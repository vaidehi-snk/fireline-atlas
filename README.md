# Fireline Atlas

[Open Fireline Atlas](https://vaidehi-snk.github.io/fireline-atlas/) · [Watch the narrated demo](https://vaidehi-snk.github.io/fireline-atlas/demo.html) · [Original-clip spot check](clip-spot-check.md)

**NASA Space Apps Challenge 2026 · Flame in Freefall**  
We read NASA’s raw flight videos to find where the evidence stops. Fireline Atlas connects 65 measured flight clips to 129 BASS-II test records. Researchers can inspect the camera and radiometer signals behind an observation, then see how far the tested conditions extend toward a lunar habitat scenario.

## Project status

| Area | Current state |
| --- | --- |
| Source code | Public repository; active research prototype |
| Local app | Works directly from `index.html`; no build, API key, or sign-in |
| Hosted demo | Public GitHub Pages app and narrated demo verified |
| Image analysis | Local processing, frame inspection, and CSV export implemented |
| Verification | Real NASA B3 contact-sheet case and 15 browser checks pass; independent physical measurement accuracy remains unvalidated |
| Flight video outcomes | NASA BASS-II flight videos read per test: visible flame window, fan and radiometer readings, radiometer cross-check |

Built for [Flame in Freefall](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/): an interactive dashboard that summarizes, ranks, and interprets microgravity combustion research for human space exploration.

## Three connected workspaces

| Workspace | Task | Output |
| --- | --- | --- |
| **Flame Lab** | Extract image-boundary motion from a local image sequence | Overlays, motion graph, threshold sensitivity, measurements CSV |
| **Mission Review** | Compare a hypothetical scenario and target habitat with curated evidence | Review note, exploratory study matrix, mission-transfer gap brief |
| **NASA Evidence** | Select a test by oxygen and airflow, compare its camera and radiometer traces, and inspect the original record | Flight outcomes map, signal charts, full source records, exports with provenance, ranked findings |

## Run it

```sh
git clone https://github.com/vaidehi-snk/fireline-atlas.git
cd fireline-atlas
```

The interface has three workspaces: **Flame Lab**, **Mission Review**, and **NASA Evidence**. Start with **Load real NASA B3 case** in Flame Lab, try the separate synthetic demo, or bring a calibrated experiment image sequence. Workspace navigation supports keyboard arrows and direct links; all analysis stays on the device.

Open `index.html` in a modern browser. The dashboard and question ranking run locally; source links open NASA pages when online. No build step, API key, sign-in, or server is required.

For an optional local HTTP server, run `python -m http.server 8000` from the project directory and open `http://localhost:8000`.

## Try the workflow

1. Open **Flame Lab** and select **Load real NASA B3 case**. Inspect 11 actual contact-sheet frames and their published photo clocks, the extracted optical boundary, and threshold variants. Use the source-record link to inspect the corresponding B3 experiment. The separate synthetic demo remains available and clearly labeled.
2. For experiment data, select 2–60 PNG/JPEG/WEBP frames. Files are naturally sorted by filename and must share dimensions. Supply the source URL/DOI and seconds between equally spaced frames. Add pixels/mm calibration if known; otherwise results stay in pixel units.
3. Set the analysis band, threshold, and boundary side; extract motion, inspect individual frames, and export the measurements with their settings.
4. Open **Mission Review** to examine a hypothetical scenario or target habitat and export its gaps or proposed study.
5. Open **NASA Evidence**, try a question prompt, and follow the original source behind each finding.

Images are limited to 10 MB each, 4096 pixels per side, and 12 megapixels. Confirm timing, scale, exposure, camera stability, and region selection before interpreting the extracted motion.

## What works

- **Flight outcomes map.** In NASA Evidence, inspect 25 tests with a single recorded airflow and initial oxygen value. Select a dot or choose a test by ID to inspect the source record. The lunar scenario has a 30% oxygen reference line. Across the full table, 65 clips have measurements. Camera loss with a nearby radiometer drop, signal near observation end, inconclusive results and unmeasured cases are distinguished. The panel separates cumulative detected periods from elapsed span. [NASA sources and method](data/PROVENANCE.md)

- **NASA experiment explorer:** 129 original BASS-II records from [PSI-25, DOI 10.60555/4qc4-de67](https://doi.org/10.60555/4qc4-de67). Filter by investigator, material/test text, and initial oxygen; inspect all 17 source fields; export selected records with DOI, file version, and source hash. The plot includes only exact numeric final CO readings. Three censored, one other status, and five missing/none entries remain visible and are never replaced with zero. NASA's readme defines `OR` as over range (>1000 ppm), so those entries are explicitly censored. See [data provenance](data/PROVENANCE.md).

The calibrated initial oxygen values in this table span **13.6–22.2%**, refining the report's approximate 14–21% overview. Mission range checks now use that recorded envelope, while explicitly noting that different configurations contribute to it and no matched-run coverage or safety boundary is implied.

- **Flame Motion Lab:** load the bundled NASA B3 contact-sheet case or import 2–60 local images; track a left/right image boundary and inspect frame overlays, velocity fit and threshold sensitivity. The NASA case preserves unequal source timestamps and stays in uncalibrated pixel units. The contact-sheet PDF, manifest and reproduction script are included. Exposure changes and missing spatial calibration prevent a claim of validated physical flame-spread rate.

- Search a mission question and rank curated findings by topic match, source tier, and mission lens.
- Switch between habitat, suppression, and material-screening lenses.
- Filter findings by fire load, atmosphere, materials, monitoring, or data access.
- Read a short evidence-bounded synthesis and open the cited NASA source beside each result.
- Compare two BASS-II cases that show why heat-release rate alone is an incomplete safety signal.
- Configure a hypothetical fire scenario and match its fuel form, oxygen level, duration, and heat path against the documented BASS-II case.
- See out-of-band conditions and unobserved O₂/CO/CO₂ channels called out, with review prompts tailored to the scenario.
- Download a source-linked mission review note as a plain-text file.
- Get a scenario-specific, evidence-gap-ranked next-test recommendation and export a controlled one-factor-at-a-time study matrix as CSV. The matrix labels proposed levels as exploratory, separates NASA-reported ranges from proposed design choices, and requires flow to be measured before comparison.
- Map a mission target's oxygen, pressure, gravity, and combustion family against the curated BASS-II evidence envelope; see transfer gaps and export a mission-specific research brief. Lunar challenge conditions are shown as a gap to investigate, never as a modeled fire outcome.

## How the analysis works

**Image measurement:** the lab averages pixel luminance across a horizontal band, locates the outermost left/right threshold crossing with subpixel interpolation, and fits boundary position against time using least squares. It reports signed px/s, or mm/s with user-supplied calibration. Missing and image-border-clipped detections are excluded from velocity fits.

Threshold ±10 variants expose sensitivity to one processing choice; they are not statistical confidence intervals. R² describes fit linearity, not measurement accuracy. The CSV preserves filenames, time, positions, source, calibration, thresholds, band settings, image dimensions, and a synthetic-data flag.

The method is inspired by [NASA/TM-20210011385](https://ntrs.nasa.gov/citations/20210011385), §2.2.4, printed p. 22. Fireline is an independent implementation, and the report's uncertainty claims do not apply to it. An optical boundary is not automatically a physical material flame front; igniters, overlays, exposure, or background lights can bias detection.

**Evidence interpretation:** the local engine expands combustion-related terms, ranks tagged notes by topic match, source tier, and mission lens, and selects a bounded synthesis. It uses deterministic rules rather than a hosted language model.

**Mission review:** the tools compare selected conditions with curated BASS-II context, identify missing measurements, and check oxygen, pressure metadata, gravity, and combustion family separately. Study-matrix levels are proposed exploratory comparisons, not NASA-prescribed tests or safety thresholds.

## Verification

Run the calculation checks with Node.js:

```sh
node checks/flame-core.cjs
node checks/bass-data.cjs
node checks/nasa-case.cjs
```

Checks cover interpolated boundaries, missing detections, clipping, band averaging, insufficient/constant fits, and recovery of exactly **3 px/s** from generated translated images.

Native Chrome checks confirmed the built-in demo produces **6.000 px/s**, **12/12 usable frames**, and **R² = 1.000**, with overlays and sensitivity traces rendered. Workspace switching and example-question updates were exercised. A 390-pixel mobile DOM check found no overflowing main-content elements.

The dataset checks verify source hashes, record identity, fields, quality handling, all 11 NASA image hashes/dimensions, the photo clocks and regression with unequal time gaps.

Automated checks in a separate headless Chrome profile now pass **15 browser checks** covering the real B3 case, frame inspection, unequal-timestamp CSV export, source-record linkage, all 129 records/120 plotted observations, empty and invalid filters, data exports, byte-identical source download, lunar/ISS/Mars preset updates, question prompts, mobile layouts and no uncaught page errors. See [QA report](data/browser-checks.json). Manual imports and all failure branches still need broader coverage.

To reproduce browser QA with an installed Chrome:

```sh
npm install --no-save --package-lock=false playwright-core
node checks/browser.cjs
```

Flight video outcomes (Python 3.10+ with numpy; ffmpeg only needed to re-measure videos):

```sh
python checks/video_outcomes_check.py          # logic, overlay templates, dataset integrity
python scripts/video_outcomes.py outcomes      # rebuild outcomes and video-data.js from saved traces
python scripts/video_outcomes.py fetch --pi Olson && python scripts/video_outcomes.py measure   # add more tests
```

Set `FIRELINE_CHROME` if Chrome is not at the script's default Windows path. The B3 default fit is approximately **4.804 px/s, 11/11 usable frames, R² ≈ 0.998**. This verifies pipeline behavior on reproduced NASA imagery; it is not error against independent reference boundaries or a validated physical spread rate. [Example exported measurements](data/B3-analysis-example.csv) retain timing and source settings.

## How AI was used

Space Apps asks teams to state where and how AI (SI) tools were used. In this project:

- **Code:** the dashboard, the data importers and checks, and the flight-video pipeline (`scripts/video_outcomes.py`) were written with AI coding assistants. The team chose what to build, reviewed the code and ran the checks listed under Verification.
- **Derived data:** `bass-data.js`, `nasa-case.js`, `video-data.js`, `data/video-index.json`, `data/video-traces/`, `data/video-outcomes.csv` and `data/overlay-glyphs.json` are produced by those AI-assisted scripts from NASA's files. The NASA source files in `data/` are kept unchanged.
- **Research and writing:** AI assistants helped search NASA sources, brainstorm options and draft the project documentation and submission text.
- **Demo video:** MicroFire Tech’s 26.1-second film uses NASA BASS-II footage, Fireline Atlas data, and an AI-generated Fish Audio voice. The edit was SI-assisted. The demo page and MP4 metadata disclose the narration and editing assistance.
- **Not in the app:** the deployed dashboard does not call an AI model. Its answers come from fixed rules you can inspect, and its measurements from numerical image processing.

The same statement is in the page metadata (`<meta name="ai-disclosure">`), in `video-data.js` (`meta.ai_assistance`) and in [data provenance](data/PROVENANCE.md).

## Data and limits

The included notes are paraphrases of the listed NASA sources, primarily NASA/TM-20210011385. They are not raw experiment records and are not a complete PSI dataset. In particular, the `≈100 W` and `≈110 W` comparison uses approximate values described in the report. It is a context comparison, not a calibrated chart, safety threshold, or predictive model. The scenario workbench reports condition similarity and missing evidence; its condition coverage is not a safety score. The rank score is retrieval relevance, not fire risk. This prototype does not replace NASA material qualification, engineering review, or crew procedures.

NASA's Physical Sciences Informatics repository is the planned pathway for expanding the evidence base with investigation-level files and metadata. Each added record should preserve its source DOI, experimental conditions, measurement units, and page or file location.

## File map

- `index.html` — dashboard and accessible interface structure
- `styles.css`, `scenario.css` — responsive visual system and scenario workbench
- `evidence.js` — traceable, curated evidence notes
- `app.js` — local retrieval, ranking, synthesis, and filters
- `flame-lab.js`, `flame-lab.css` — independent offline image-processing workbench
- `workspace.js`, `workspace.css` — workspace navigation, responsive app presentation, focus states, and empty/result layouts
- `checks/flame-core.cjs` — calculation verification
- `bass-data.js`, `experiment-data.js`, `experiment-data.css` — original-record explorer and lossless data classification
- `data/PSI-25_Experimental-table_BASS-II.csv`, `data/PROVENANCE.md` — unchanged NASA table, DOI, license, and source hash
- `scripts/import-bass.py`, `checks/bass-data.cjs` — reproducible dataset import and integrity checks
- `demo.html`, `fireline-demo.mp4` — public demo player and its downloadable film
- `nasa-case.js`, `data/B3-case-manifest.json` — real NASA B3 preset and source timestamps/hashes
- `data/BASS-II_B3_ProofSheet.pdf`, `data/BASS-II_ReadMe.docx` — original NASA source documents
- `scripts/build-nasa-case.py`, `checks/nasa-case.cjs`, `checks/browser.cjs` — reproducible case preparation and verification
- `scripts/video_outcomes.py`, `checks/video_outcomes_check.py` — flight-video index, download, measurement and outcomes, with checks
- `data/video-index.json`, `data/video-traces/`, `data/video-outcomes.csv`, `data/overlay-glyphs.json` — derived video data and overlay templates
- `video-data.js`, `video-outcomes.js` — generated browser bundle and the Flight video panel
- `outcome-map.js` — oxygen–airflow plot with test selection and the lunar scenario reference

## Next technical milestones

- Obtain full-resolution images with verified spatial calibration and independent reference annotations; the bundled contact-sheet case supplies real imagery/timestamps but no spatial scale.
- Compare extracted boundaries with reference annotations; report measurement errors and failure cases.
- Add cropping/masking for overlays and checks for camera movement.
- Expand to a complementary PSI investigation with traceable metadata.
- Broaden manual-import and failure-case browser coverage; core preset, export, and mission-preset checks now pass.
