"""Checks for scripts/video_outcomes.py: flame-period logic, radiometer cross-check, overlay templates, dataset integrity.
Run from the repo root: python checks/video_outcomes_check.py   (needs numpy; no videos needed)"""
import csv, json, re, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'scripts'))
import video_outcomes as v

fps = v.FPS
t = [i / fps for i in range(40)]
assert v.runs(t, [False] * 4 + [True] * 12 + [False] * 3 + [True] * 8 + [False] * 13) == [(1.0, 6.5)], 'short flicker gap merges'
assert v.runs(t, [False] * 4 + [True] * 12 + [False] * 8 + [True] * 8 + [False] * 8) == [(1.0, 3.75), (6.0, 7.75)], 'long gap splits'
assert v.runs(t, [True] * 2 + [False] * 38) == [], 'a 0.5 s blip is not a sustained flame'


def rows(area, rad):
    return [{'t_s': i / fps, 'live': 1, 'area_px': a, 'area_px_d30': a, 'area_px_d50': a, 'x_min': 10, 'x_max': 20 + i,
             'rgb': '200 60 60', 'clock': '', 'fan': '', 'rad': r} for i, (a, r) in enumerate(zip(area, rad))]

n = 160  # 40 s
area = [0] * 20 + [5000] * 100 + [0] * 40                       # flame seen 5 s -> 29.75 s
agree = ['0.05'] * 20 + ['1.00'] * 108 + ['0.05'] * 32           # radiation falls ~2 s later
linger = ['0.05'] * 20 + ['1.00'] * 140                           # radiation never falls
assert v.outcome(rows(area, agree))['status'] == 'camera loss with radiometer drop'
lost = v.outcome(rows(area, linger))
assert lost['status'] == 'inconclusive' and lost['review'] == 'yes'
assert v.outcome(rows([0] * n, agree))['status'] == 'no sustained flame detected'
assert v.outcome(rows(area, agree))['right_edge_px_s'] == 4.0, 'edge drift: 1 px per frame at 4 fps'
lit = rows(area, agree)
for r in lit[140:]:  # work lights switched on at the end: large grey area, not a flame
    r.update(area_px=60000, area_px_d30=60000, area_px_d50=60000, rgb='56 61 59')
assert v.outcome(lit)['status'] == 'camera loss with radiometer drop', 'lights-on frames are not flame'
assert not v.lights_on({'area_px': 40000, 'rgb': '129 52 62'}), 'a large red igniter glow is not the work lights'

anchor, (chars, stack) = v.load_glyphs()
for ch, tpl in zip(chars, stack):  # every template must read back as itself
    assert chars[int((stack ^ tpl).sum((1, 2)).argmin())] == ch

table = v.table_tests()
with v.OUTCOMES.open(encoding='utf-8', newline='') as f:
    out = list(csv.DictReader(f))
assert out and all(r['test'] in table for r in out), 'every outcome row is a NASA table test'
analysed = [r for r in out if r.get('video_file')]
assert all(re.fullmatch(r'[0-9a-f]{64}', r['video_sha256']) for r in analysed), 'every analysed clip has its SHA-256'
assert all((v.TRACES / f"{r['test']}.csv").exists() for r in analysed), 'every analysed clip has its trace'
bundle = json.loads((root / 'video-data.js').read_text(encoding='utf-8').split('=', 1)[1].rstrip(';\n'))
assert set(bundle['tests']) == {r['test'] for r in out}, 'browser bundle matches the outcomes CSV'
b1 = v.outcome(v.load_trace('B1'))  # reference clip: overlay read and radiometer agree
assert b1['fan_at_flame_start'] == 62 and b1['radiometer_check'] == 'agrees' and b1['overlay_read'].startswith('100%')
status = {}
for r in out:
    status[r['status']] = status.get(r['status'], 0) + 1
print(f'PASS: flame periods, radiometer cross-check, {len(chars)} overlay templates, {len(analysed)} analysed clips, '
      f'{len(out)} outcome rows, browser bundle.', status)

for test in ('B8', 'T23'):
    result = bundle['tests'][test]
    assert result['radiometer_check'] == 'inconclusive: no subsequent low reading'
    assert 'rad_end_s' not in result
assert bundle['tests']['B7']['flame_s'] == 54.5 and bundle['tests']['B7']['span_s'] == 102.75
for record in analysed:
    test = record['test']
    raw = v.load_trace(test)
    valid = [row for row in raw if v.usable(row)]
    expected = v.outcome(raw)
    entry = bundle['tests'][test]
    assert entry['status'] == expected['status'] == record['status']
    if 'peak_s' in expected:
        assert expected['peak_area_px'] == max(row['area_px'] for row in valid)
        assert any(row['t_s'] == expected['peak_s'] for row in valid)
    bins = {}
    for row in valid:
        bins.setdefault(int(row['t_s']), []).append(row['area_px'])
    assert entry['trace']['t'] == list(bins)
    assert entry['trace']['area'] == [int(sum(values) / len(values)) for values in bins.values()]
print('PASS: censored sensor endings, B7 period durations, and usable-frame peaks and chart bins for all clips.')
