"""Turn NASA BASS-II flight videos (PSI-25) into per-test burn outcomes.

  python scripts/video_outcomes.py index                 # map NASA videos to table tests -> data/video-index.json
  python scripts/video_outcomes.py fetch B1 T1 ...       # download primary videos -> work/videos/
  python scripts/video_outcomes.py fetch --pi Bhattacharjee   (or --all)
  python scripts/video_outcomes.py measure [B1 ...] [--redo]  # traces -> data/video-traces/, then outcomes -> data/video-outcomes.csv
  python scripts/video_outcomes.py outcomes [B1 ...]     # recompute outcomes from saved traces (no video needed)
  python scripts/video_outcomes.py glyphs B1 [labels]    # (one-off) build the overlay character templates

Needs Python 3.10+, numpy, and ffmpeg/ffprobe on PATH. Videos stay in work/ (git-ignored).

Method (deliberately simple and inspectable):
  background = per-pixel minimum of the brightest colour channel over the whole clip
  flame pixel = brightest channel exceeds that background by DELTA, below the on-screen data overlay
  a flame is "present" when at least MIN_AREA pixels qualify, "sustained" when present for MIN_RUN seconds
  the overlay (FUEL / AIR / FAN / RAD readings and the BASS clock) is read by matching each character cell
  against labelled templates in data/overlay-glyphs.json; unreadable characters become blanks, never guesses
Outputs are optical events in video pixels and video seconds, not calibrated flame-spread rates.
"""
import csv, hashlib, json, re, subprocess, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TABLE = ROOT / 'data' / 'PSI-25_Experimental-table_BASS-II.csv'
INDEX = ROOT / 'data' / 'video-index.json'
VIDEOS = ROOT / 'work' / 'videos'
TRACES = ROOT / 'data' / 'video-traces'
OUTCOMES = ROOT / 'data' / 'video-outcomes.csv'
API = 'https://psi.nasa.gov/geode-py/ws'

FPS = 4            # sampled frames per second
OVERLAY_ROWS = 90  # BASS video overlay (FUEL/AIR/FAN/RAD + clock) occupies rows 32-81 of 480
DELTA = 40         # brightness rise over background that counts as flame (0-255)
# ponytail: a single threshold misses dim blue near-limit flames (e.g. T1: flame ~2x the noise floor); the radiometer
# check flags those tests. Upgrade path: average 1 s of frames and use the blue channel before thresholding.
DELTAS = (30, 40, 50)  # sensitivity: extinction time is reported at each
MIN_AREA = 150     # pixels
MIN_RUN = 1.0      # seconds a flame must persist to count as sustained
MAX_GAP = 1.0      # seconds of dropout (a flickering, dim flame) that still count as the same flame period
END_MARGIN = 2.0   # flame within this many seconds of clip end = still burning at end
RAD_TOLERANCE = 6.0  # seconds; radiometer and video "flame end" closer than this count as agreeing
LIGHTS_AREA = 15000  # px; a grey bright area at least this big means the work lights are on (excluded)

GLYPHS = ROOT / 'data' / 'overlay-glyphs.json'
GRID_X0, PITCH, CELL_W, CELL_H = 156, 28.4, 27, 15   # overlay character grid in the reference clip (B1)
REF_GRID = (GRID_X0, PITCH, 0, 0)                     # (x0, pitch, dy, label-row dx)
ROW_TOP = {'label': 31, 'value': 49, 'clock': 67}
ANCHOR = (29, 47, 150, 700)  # label row "FUEL AIR FAN RAD", used to find the overlay in other clips
LEFT, RIGHT = (0, 130), (450, 550)  # anchor columns covering "FUEL" and "RAD"; their gap gives horizontal scale
INK = 110                    # luma above this is overlay text
FIELDS = {'fuel': ('value', 0, 5), 'air': ('value', 5, 10), 'fan': ('value', 10, 15), 'rad': ('value', 15, 20),
          'clock': ('clock', 9, 17)}
MAX_MISMATCH = 45            # template distance (pixels) above which a character is unreadable
MIN_MARGIN = 8               # best character must beat the best *other* character by this many pixels
ALLOWED = {'value': '0123456789-.', 'clock': '0123456789:'}
BLANK = {'value': 12, 'clock': 3}  # ink pixels at or below this = empty cell ('-' has 23, ':' has 8)


def ink(frame):
    """Binary overlay-text mask, padded so edge cells slice cleanly."""
    return np.pad(frame @ np.array([.299, .587, .114]) > INK, ((0, 20), (0, 40)))


def cell(mask, row, k, grid=REF_GRID, jx=0, jy=0):
    x, y = int(round(grid[0] + k * grid[1])) + jx, ROW_TOP[row] + grid[2] + jy
    return mask[y:y + CELL_H, x:x + CELL_W]


def bits(a):
    return [''.join('1' if v else '0' for v in r) for r in a]


def unbits(rows):
    return np.array([[c == '1' for c in r] for r in rows])


def load_glyphs():
    if not GLYPHS.exists():
        return None
    g = json.loads(GLYPHS.read_text(encoding='utf-8'))
    return unbits(g['anchor']), ([t['char'] for t in g['templates']], np.stack([unbits(t['bits']) for t in g['templates']]))


def find(mask, anchor, part, dxs=range(-15, 16), dys=range(-6, 51)):  # T13's overlay sits ~38 px lower
    """Best (mismatch, dx, dy) for one piece of the label row, or None if it is not on screen."""
    a, x, (y0, y1) = anchor[:, part[0]:part[1]], ANCHOR[2] + part[0], ANCHOR[:2]
    best = min((int((mask[y0 + dy:y1 + dy, x + dx:x + dx + a.shape[1]] ^ a).sum()), dx, dy)
               for dx in dxs for dy in dys if y0 + dy >= 0 and x + dx >= 0)
    return best if best[0] < a.sum() * 0.5 else None


def locate(mask, anchor):
    """Character grid (x0, pitch, dy, dx) of this clip's overlay, or None. Clips differ by a few px and ~1 % in width."""
    left, right = find(mask, anchor, LEFT), find(mask, anchor, RIGHT)
    if not left or not right:
        return None
    cl, cr = ANCHOR[2] + sum(LEFT) / 2, ANCHOR[2] + sum(RIGHT) / 2
    scale = 1 + (right[1] - left[1]) / (cr - cl)
    return (cl + left[1] + (GRID_X0 - cl) * scale, PITCH * scale, left[2], left[1])


def live(mask, anchor, grid):
    """True while the BASS overlay is on screen, i.e. the frame is experiment footage, not an appended playback."""
    return find(mask, anchor, LEFT, range(grid[3] - 2, grid[3] + 3), range(grid[2] - 2, grid[2] + 3)) is not None


def match(mask, row, k, grid, templates, width):
    """(distance, char) for one cell: closest allowed template within 1 px of jitter, ignoring columns past the
    frame edge. Returns '?' unless the winner is clear of every other character by MIN_MARGIN."""
    chars, stack = templates
    best = {}
    for jx in (-1, 0, 1):
        for jy in (-1, 0, 1):
            c = cell(mask, row, k, grid, jx, jy)
            visible = max(1, min(CELL_W, width - int(round(grid[0] + k * grid[1])) - jx))
            d = (stack[:, :, :visible] ^ c[:, :visible]).sum((1, 2))
            for ch, dist in zip(chars, d.tolist()):
                if ch in ALLOWED[row]:
                    best[ch] = min(best.get(ch, 10 ** 6), dist)
    ranked = sorted((dist, ch) for ch, dist in best.items())
    dist, char = ranked[0]
    clear = len(ranked) == 1 or ranked[1][0] - dist >= MIN_MARGIN
    return dist, char if dist <= MAX_MISMATCH and clear else '?'


def read_overlay(mask, grid, templates):
    out, width = {}, mask.shape[1] - 40
    for name, (row, k0, k1) in FIELDS.items():
        text = ''
        for k in range(k0, k1):
            if cell(mask, row, k, grid).sum() <= BLANK[row]:  # specks smaller than the smallest allowed glyph
                text += ' '
                continue
            text += match(mask, row, k, grid, templates, width)[1]
        out[name] = text.strip()
    clock = out['clock'] if re.fullmatch(r'\d\d:\d\d:\d\d', out['clock']) else ''
    num = lambda s, kind: s if re.fullmatch(r'-?\d+' if kind == 'int' else r'-?\d+(\.\d+)?', s) else ''
    return {'clock': clock, 'fuel': num(out['fuel'], 'int'), 'air': num(out['air'], 'int'),
            'fan': num(out['fan'], 'int'), 'rad': num(out['rad'], 'float')}


def glyphs(args):
    """One-off: cluster distinct character shapes in a reference clip; with labels, save them as templates."""
    test, labels = args[0], (args[1] if len(args) > 1 else None)
    shapes, first = [], None
    for frame in frames(VIDEOS / f'{test}.mp4'):
        mask = ink(frame)
        first = mask if first is None else first
        for row in ('value', 'clock'):
            for k in range(20):
                c = cell(mask, row, k)
                if c.sum() > 3 and not any((s ^ c).sum() <= 12 for s in shapes):
                    shapes.append(c)
    if not labels:
        from PIL import Image
        h, w = CELL_H + 4, CELL_W + 4
        sheet = np.full(((len(shapes) + 9) // 10 * h, 10 * w), 60, np.uint8)
        for i, s in enumerate(shapes):
            r, c = divmod(i, 10)
            sheet[r * h + 2:r * h + 2 + CELL_H, c * w + 2:c * w + 2 + CELL_W] = s * 255
        (ROOT / 'work').mkdir(exist_ok=True)
        Image.fromarray(sheet).resize((sheet.shape[1] * 3, sheet.shape[0] * 3), Image.NEAREST).save(ROOT / 'work' / 'glyphs.png')
        print(f'{len(shapes)} shapes -> work/glyphs.png; label them left to right, top to bottom')
        return
    assert len(labels) == len(shapes), f'{len(shapes)} shapes but {len(labels)} labels'
    y0, y1, x0, x1 = ANCHOR
    anchor = first[y0:y1, x0:x1]
    GLYPHS.write_text(json.dumps({'reference': f'BASS-II {test} primary video', 'grid': [GRID_X0, PITCH, CELL_W, CELL_H],
                                  'anchor': bits(anchor),
                                  'templates': [{'char': ch, 'bits': bits(s)} for ch, s in zip(labels, shapes)]}) + '\n')
    print(f'Saved {len(shapes)} templates to {GLYPHS.name}')


def table_tests():
    with TABLE.open(encoding='utf-8-sig', newline='') as f:
        return {row['Test #'].strip(): row['PI'].strip() for row in csv.DictReader(f)}


def index():
    with urllib.request.urlopen(f'{API}/repo/investigations/PSI-25', timeout=120) as r:
        investigation = json.load(r)
    tests = table_tests()
    found = {t: {'pi': pi, 'videos': []} for t, pi in tests.items()}
    unmatched = []
    for f in investigation['added']:
        name = f['file_name']
        if not name.lower().endswith('.mp4') or f.get('visible') is False:
            continue
        m = re.search(r'(?:TEST|test)[_ ]?([A-Z]\d+[a-z]?)(?![a-z])', name)
        test = m and m.group(1)
        entry = {'file': name, 'version': f['version'], 'bytes': f['file_size'],
                 'view': 'still' if 'Still_Sequence' in name else 'second' if '2ND_VIEW' in name.upper()
                 else 'primary' if name.startswith('PSI-25_Raw Data_BASS') else 'other'}
        (found[test]['videos'].append(entry) if test in found else unmatched.append(entry))
    payload = {'source': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25', 'doi': '10.60555/4qc4-de67',
               'note': 'Built from the NASA PSI file list. "primary" = main camera clip, "second" = second view, '
                       '"still" = camera playback of still photos, "other" = support footage.',
               'tests': found, 'unmatched': unmatched}
    INDEX.write_text(json.dumps(payload, indent=1) + '\n', encoding='utf-8')
    have = sum(any(v['view'] == 'primary' for v in x['videos']) for x in found.values())
    print(f'{have}/{len(found)} table tests have a primary video; {len(unmatched)} videos not tied to a table test')


def main_clip(entry):
    """The test's single main-camera clip, or None. Second views are handheld footage of the lab monitors
    (checked: B14, O17), so they are never measured."""
    found = [v for v in entry['videos'] if v['view'] == 'primary']
    return found[0] if len(found) == 1 else None  # ponytail: tests with 2 main clips are skipped, pick by hand if needed


def readable(path):
    return path.exists() and subprocess.run(['ffprobe', '-v', 'error', str(path)], capture_output=True).returncode == 0


def download(test, out, clip):
    if out.exists() and out.stat().st_size == clip['bytes']:
        return f'{out.name}: already here'
    q = urllib.parse.urlencode({'file': clip['file'], 'version': clip['version'], 'redirect': 'false'})
    with urllib.request.urlopen(f'{API}/studies/PSI-25/download?{q}', timeout=120) as r:
        url = r.read().decode().strip()
    part = out.with_suffix('.part')
    with urllib.request.urlopen(url, timeout=600) as r, part.open('wb') as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    if part.stat().st_size != clip['bytes']:
        part.unlink()
        return f'{test}: size mismatch, discarded'
    part.replace(out)
    return f'{out.name}: {clip["bytes"] / 1e6:.1f} MB' + ('' if readable(out) else ' (NASA file does not decode)')


def fetch(args):
    entries = json.loads(INDEX.read_text(encoding='utf-8'))['tests']
    if '--all' in args:
        wanted = list(entries)
    elif '--pi' in args:
        wanted = [t for t, e in entries.items() if e['pi'] == args[args.index('--pi') + 1]]
    else:
        wanted = args
    jobs = [(t, VIDEOS / f'{t}.mp4', main_clip(entries[t])) for t in wanted]
    jobs = sorted([j for j in jobs if j[2]], key=lambda j: j[2]['bytes'])  # smallest first
    VIDEOS.mkdir(parents=True, exist_ok=True)
    print(f'Fetching {len(jobs)} main clips, {sum(j[2]["bytes"] for j in jobs) / 1e9:.2f} GB')
    with ThreadPoolExecutor(8) as pool:  # NASA's file host is slow per connection
        for message in pool.map(lambda j: safe(download, *j), jobs):
            print(message, flush=True)


def safe(fn, test, *rest):
    try:
        return fn(test, *rest)
    except Exception as error:  # keep going; one bad file should not stop a batch
        return f'{test}: failed ({error})'


def frames(path):
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                            '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True)
    w, h = map(int, probe.stdout.split(',')[:2])
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'fps={FPS}', '-f', 'rawvideo',
                             '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = w * h * 3
    try:
        while len(buf := proc.stdout.read(size)) == size:
            yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    finally:
        proc.kill()


def trace(path):
    glyph_set = load_glyphs()
    anchor = glyph_set[0] if glyph_set else None
    grid = None
    if anchor is not None:
        for frame in frames(path):
            if grid := locate(ink(frame), anchor):
                break
    # Frames without the overlay (e.g. still-camera playback spliced onto the end) are not experiment footage.
    shown, background = [], None
    for frame in frames(path):
        shown.append(grid is None or live(ink(frame), anchor, grid))
        if shown[-1]:
            background = frame.max(2) if background is None else np.minimum(background, frame.max(2))
    rows = []
    for i, (frame, ok) in enumerate(zip(frames(path), shown)):
        if not ok:
            rows.append({'t_s': round(i / FPS, 2), 'live': 0, 'area_px': 0, **{f'area_px_d{d}': 0 for d in DELTAS if d != DELTA},
                         'brightness': 0, 'x_min': '', 'x_max': '', 'y_min': '', 'y_max': '', 'rgb': '',
                         'clock': '', 'fuel': '', 'air': '', 'fan': '', 'rad': ''})
            continue
        overlay = read_overlay(ink(frame), grid, glyph_set[1]) if grid else \
            {'clock': '', 'fuel': '', 'air': '', 'fan': '', 'rad': ''}
        rise = frame.max(2).astype(np.int16) - background
        rise[:OVERLAY_ROWS + max(0, grid[2] if grid else 0)] = 0
        mask = rise > DELTA
        ys, xs = np.nonzero(mask)
        row = {'t_s': round(i / FPS, 2), 'live': 1, 'area_px': int(mask.sum()),
               **{f'area_px_d{d}': int((rise > d).sum()) for d in DELTAS if d != DELTA},
               'brightness': int(rise[mask].sum()),
               'x_min': int(xs.min()) if len(xs) else '', 'x_max': int(xs.max()) if len(xs) else '',
               'y_min': int(ys.min()) if len(ys) else '', 'y_max': int(ys.max()) if len(ys) else ''}
        row['rgb'] = ' '.join(str(int(c)) for c in frame[mask].mean(0)) if len(xs) else ''
        rows.append({**row, **overlay})
    return rows


def seconds(clock):
    h, m, s = map(int, clock.split(':'))
    return h * 3600 + m * 60 + s


def near(rows, key, t, window=0.5):
    """Median overlay reading within +-window seconds of t, or '' if none was readable."""
    values = [float(r[key]) for r in rows if r[key] != '' and abs(r['t_s'] - t) <= window]
    value = round(float(np.median(values)), 2) if values else ''
    return int(value) if value != '' and value == int(value) else value


def edge_speeds(rows, first, last):
    """Robust (Theil-Sen) drift of the flame's left and right image edges, 1 sample/s, skipping 3 s of ignition."""
    pts = [r for r in rows if first + 3 <= r['t_s'] <= last and r['area_px'] >= MIN_AREA][::FPS]
    if len(pts) < 5:
        return {}
    t = np.array([r['t_s'] for r in pts])
    i, j = np.triu_indices(len(t), 1)
    slope = lambda key: round(float(np.median((np.array([r[key] for r in pts])[j] - np.array([r[key] for r in pts])[i]) / (t[j] - t[i]))), 2)
    return {'left_edge_px_s': slope('x_min'), 'right_edge_px_s': slope('x_max')}


def overlay_summary(rows, first, last):
    out = {'fan_at_flame_start': near(rows, 'fan', first), 'fan_at_flame_end': near(rows, 'fan', last),
           **radiometer(rows, first, last)}
    clocked = [(r['t_s'], seconds(r['clock'])) for r in rows if r['clock'] and r['live']]
    if not clocked:
        return {**out, 'overlay_read': 'no clock read'}
    offset = float(np.median([c - t for t, c in clocked]))
    consistent = sum(abs(c - t - offset) <= 1.5 for t, c in clocked) / sum(r['live'] for r in rows)
    clock_at = lambda t: '%02d:%02d:%02d' % (divmod(divmod(int(round(offset + t)), 60)[0], 60) + (int(round(offset + t)) % 60,))
    return {**out, 'overlay_read': f'{consistent:.0%} of frames give a consistent clock',
            'clock_at_flame_start': clock_at(first), 'clock_at_flame_end': clock_at(last)}


def radiometer(rows, first, last):
    """Independent check from the flame radiometer: when does radiation fall below half its burning level?

    Baseline = before ignition (or the clip minimum if the clip starts after ignition). Burning level = median while the camera shows a flame, skipping the
    igniter spike (first 3 s). Radiation lags the flame by a few seconds as the sensor cools."""
    rad = [(r['t_s'], float(r['rad'])) for r in rows if r['rad'] != '']
    during = [v for t, v in rad if first + 3 <= t <= last]
    if not during:
        return {}
    before = [v for t, v in rad if t < first - 1] or [min(v for _, v in rad)]  # clip may start after ignition
    base, level = float(np.median(before)), float(np.median(during))
    if level - base < 0.05:
        return {'rad_baseline': round(base, 2), 'rad_flame_level': round(level, 2), 'radiometer_check': 'no clear rise'}
    half = base + (level - base) / 2
    above = [t for t, v in rad if t >= first + 3 and v >= half]
    levels = {'rad_baseline': round(base, 2), 'rad_flame_level': round(level, 2)}
    if not above:
        return {**levels, 'radiometer_check': 'no clear rise'}
    last_high = above[-1]
    low = next((t for t, value in rad if t > last_high and value < half), None)
    if low is None:
        return {**levels, 'radiometer_check': 'inconclusive: no subsequent low reading'}
    # The crossing is bracketed by readings. Both must lie in the tolerance window.
    gap = round(low - last, 2)
    agrees = last - RAD_TOLERANCE <= last_high < low <= last + RAD_TOLERANCE
    return {**levels, 'rad_end_s': low, 'rad_vs_video_s': gap,
            'radiometer_check': 'agrees' if agrees else 'radiometer timing differs or is unresolved'}



def runs(times, present):
    """(start, end) seconds of each sustained flame period; dropouts up to MAX_GAP s (flicker) do not split a period."""
    out, start, on = [], None, None
    def close():
        if times[on] - times[start] + 1 / FPS >= MIN_RUN:
            out.append((times[start], times[on]))
    for i, p in enumerate(present):
        if not p:
            continue
        if start is not None and times[i] - times[on] > MAX_GAP + 1 / FPS:
            close()
            start = None
        start = i if start is None else start
        on = i
    if start is not None:
        close()
    return out


def lights_on(r):
    """Work lights on: a large, grey (unsaturated) bright area. Flames and the igniter glow are strongly coloured."""
    if r['area_px'] < LIGHTS_AREA or not r['rgb']:
        return False
    c = [float(x) for x in r['rgb'].split()]
    return max(c) - min(c) < 0.3 * max(c)


def usable(row):
    return bool(row['live']) and not lights_on(row)


def outcome(rows):
    if not rows:
        return {'status': 'no experiment footage recognised'}
    rows = [r for r in rows if usable(r)]
    times = [r['t_s'] for r in rows]
    shown = [r['t_s'] for r in rows if r['live']]
    if not shown:
        return {'status': 'no experiment footage recognised', 'clip_s': ''}
    clip_end = shown[-1]
    def flame_runs(key):
        return runs(times, [bool(r['live']) and r[key] >= MIN_AREA for r in rows])
    main = flame_runs('area_px')
    result = {'clip_s': clip_end, 'flame_periods': len(main)}
    if not main:
        return {**result, 'status': 'no sustained flame detected'}
    first, last = main[0][0], main[-1][1]
    lit = [r for r in rows if r['area_px'] >= MIN_AREA]
    peak = max(lit, key=lambda r: r['area_px'])  # often the igniter flash, not the steady flame
    ends = [r[-1][1] for r in (flame_runs('area_px' if d == DELTA else f'area_px_d{d}') for d in DELTAS) if r]
    sensors = overlay_summary(rows, first, last)
    if not any(r['clock'] or r['rad'] for r in rows):  # overlay never found (e.g. T13 is framed differently)
        sensors['radiometer_check'] = 'radiation unavailable: overlay not found'
    check = sensors.get('radiometer_check', '')
    status = ('visible near observation end' if last >= clip_end - END_MARGIN else
              'camera loss with radiometer drop' if check == 'agrees' else 'inconclusive')
    return {**result, 'status': status,
            'review': 'yes' if check != 'agrees' else '',
            'flame_start_s': first, 'flame_end_s': last, 'span_s': round(last - first, 2),
            'flame_s': round(sum(end - start for start, end in main), 2),
            'flame_end_s_range': f'{min(ends)} to {max(ends)}',
            'median_area_px': int(np.median([r['area_px'] for r in lit])),
            'median_width_px': int(np.median([r['x_max'] - r['x_min'] for r in lit])),
            'median_rgb': ' '.join(str(int(c)) for c in np.median([[int(v) for v in r['rgb'].split()] for r in lit], 0)),
            'peak_area_px': peak['area_px'], 'peak_s': peak['t_s'], **edge_speeds(rows, first, last), **sensors}


META = ['test', 'pi', 'video_view', 'video_file', 'video_version', 'video_sha256', 'note']
COLUMNS = ['test', 'pi', 'status', 'review', 'flame_start_s', 'flame_end_s', 'flame_s', 'span_s', 'flame_end_s_range', 'flame_periods',
           'clip_s', 'rad_end_s', 'rad_vs_video_s', 'radiometer_check', 'rad_baseline', 'rad_flame_level',
           'left_edge_px_s', 'right_edge_px_s', 'clock_at_flame_start', 'clock_at_flame_end',
           'fan_at_flame_start', 'fan_at_flame_end', 'overlay_read', 'median_area_px', 'median_width_px', 'median_rgb',
           'peak_area_px', 'peak_s', 'sample_fps', 'delta', 'min_area_px'] + META[2:]


def load_trace(test):
    with (TRACES / f'{test}.csv').open(encoding='utf-8', newline='') as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r['t_s'] = float(r['t_s'])
        for k in r:
            if k == 'live' or k.startswith('area_px') or k == 'brightness' or (k[:2] in ('x_', 'y_') and r[k] != ''):
                r[k] = int(r[k])
    return rows


def outcomes(args):
    """Rebuild data/video-outcomes.csv and video-data.js from saved traces + per-test metadata (no video needed)."""
    records = {}
    for path in TRACES.glob('*.json'):
        meta = json.loads(path.read_text(encoding='utf-8'))
        test = meta['test']
        records[test] = {'status': 'not measured yet', **meta}
        if meta.get('video_file') and (TRACES / f'{test}.csv').exists():
            records[test] = {**meta, 'sample_fps': FPS, 'delta': DELTA, 'min_area_px': MIN_AREA, **outcome(load_trace(test))}
    order = list(table_tests())
    with OUTCOMES.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, restval='', extrasaction='ignore')
        writer.writeheader()
        writer.writerows(sorted(records.values(), key=lambda r: order.index(r['test'])))
    bundle(records)
    for test in sorted(records, key=order.index):
        if not args or test in args:
            r = records[test]
            print(test, '|', r['status'], '|', r.get('flame_start_s', ''), '->', r.get('flame_end_s', ''), 's |',
                  r.get('radiometer_check', ''), r.get('rad_vs_video_s', ''))


def bundle(records):
    """video-data.js: outcomes plus 1-per-second traces for the offline browser app."""
    keep = [c for c in COLUMNS if c not in ('pi', 'sample_fps', 'delta', 'min_area_px', 'median_rgb', 'overlay_read')]
    tests = {}
    for test in sorted(records):
        r = records[test]
        entry = {k: r.get(k, '') for k in keep if r.get(k, '') != ''}
        if r.get('video_file') and (TRACES / f'{test}.csv').exists():
            seconds_ = {}
            for row in load_trace(test):
                if usable(row):
                    seconds_.setdefault(int(row['t_s']), []).append(row)
            med = lambda vals: float(np.median(vals)) if vals else None
            entry['trace'] = {'t': list(seconds_),
                              'area': [int(np.mean([g['area_px'] for g in s])) for s in seconds_.values()],
                              'rad': [med([float(g['rad']) for g in s if g['rad'] != '']) for s in seconds_.values()],
                              'fan': [med([int(g['fan']) for g in s if g['fan'] != '']) for s in seconds_.values()]}
        tests[test] = entry
    meta = {'source': 'NASA PSI-25 BASS-II flight videos, https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
            'doi': '10.60555/4qc4-de67', 'script': 'scripts/video_outcomes.py',
            'method': f'Flame = pixels brighter than the clip background by {DELTA}/255 below the data overlay; '
                      f'present at >= {MIN_AREA} px, sustained >= {MIN_RUN} s, flicker gaps <= {MAX_GAP} s merged. '
                      f'Sampled at {FPS} frames/s. Overlay readings (fan, radiometer, clock) read by template matching.',
            'limits': 'Image pixels and video seconds, not calibrated flame-spread rates. A dim blue flame can fall below '
                      'the camera threshold; the radiometer check flags those tests.'}
    (ROOT / 'video-data.js').write_text('window.FIRELINE_VIDEO = ' + json.dumps({'meta': meta, 'tests': tests},
                                        separators=(',', ':')) + ';\n', encoding='utf-8')


def measure(args):
    entries = json.loads(INDEX.read_text(encoding='utf-8'))['tests']
    redo, args = '--redo' in args, [a for a in args if a != '--redo']
    tests = args or sorted({p.stem.removesuffix('_2nd') for p in VIDEOS.glob('*.mp4')})
    TRACES.mkdir(parents=True, exist_ok=True)
    for test in tests:  # each test writes only its own files, so several measure runs can work in parallel
        meta, path = video_meta(test, entries[test])
        if path and (redo or not (TRACES / f'{test}.csv').exists()):
            rows = trace(path)
            part = TRACES / f'{test}.csv.part'
            with part.open('w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=list(rows[0]))
                writer.writeheader()
                writer.writerows(rows)
            part.replace(TRACES / f'{test}.csv')  # atomic, so a parallel run never reads half a trace
        (TRACES / f'{test}.json').write_text(json.dumps(meta, indent=1) + '\n', encoding='utf-8')
        print(test, meta.get('status', 'traced'), flush=True)
    outcomes([])


def video_meta(test, entry):
    """Provenance for the main clip that was measured, plus its local path (None if it cannot be measured)."""
    base = {'test': test, 'pi': entry['pi']}
    mains = [v for v in entry['videos'] if v['view'] == 'primary']
    if not mains:
        return {**base, 'status': 'no main camera clip',
                'note': 'NASA lists no main-camera clip for this test; second views film the lab monitors and are not measured.'}, None
    if len(mains) > 1:
        return {**base, 'status': 'two main clips, not chosen automatically',
                'note': '; '.join(v['file'] for v in mains)}, None
    clip, path = mains[0], VIDEOS / f'{test}.mp4'
    if not path.exists():
        return {**base, 'status': 'not downloaded yet'}, None
    if not readable(path):
        return {**base, 'status': 'no readable video', 'video_file': '',
                'note': f'Main clip does not decode as published by NASA: {clip["file"]} '
                        f'({path.stat().st_size} bytes).'}, None
    return {**base, 'video_view': clip['view'], 'video_file': clip['file'], 'video_version': clip['version'],
            'video_sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'note': ''}, path


if __name__ == '__main__':
    command, *rest = sys.argv[1:] or ['help']
    {'index': lambda a: index(), 'fetch': fetch, 'measure': measure, 'outcomes': outcomes, 'glyphs': glyphs}.get(command, lambda a: print(__doc__))(rest)
