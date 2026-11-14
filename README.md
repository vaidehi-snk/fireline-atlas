# Fireline Atlas

**NASA Space Apps Challenge 2026 · Flame in Freefall**  
An offline-ready, source-traceable evidence dashboard for microgravity fire-safety research.

## Project status

| Area | Current state |
| --- | --- |
| Source code | Public repository; active research prototype |
| Local app | Works directly from `index.html`; no build, API key, or sign-in |
| Hosted demo | Not yet deployed or verified |
| Image analysis | Local processing, frame inspection, and CSV export implemented |
| Scientific validation | Synthetic checks pass; real NASA image-sequence validation remains planned |

Built for [Flame in Freefall](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/): an interactive dashboard that summarizes, ranks, and interprets microgravity combustion research for human space exploration.

## Three connected workspaces

| Workspace | Task | Output |
| --- | --- | --- |
| **Flame Lab** | Extract image-boundary motion from a local image sequence | Overlays, motion graph, threshold sensitivity, measurements CSV |
| **Mission Review** | Compare a hypothetical scenario and target habitat with curated evidence | Review note, exploratory study matrix, mission-transfer gap brief |
| **NASA Evidence** | Ask questions, rank findings, and inspect NASA sources | Bounded synthesis, mission lenses, filtered evidence cards |

## Run it

```sh
git clone https://github.com/vaidehi-snk/fireline-atlas.git
cd fireline-atlas
```

The interface has three workspaces: **Flame Lab**, **Mission Review**, and **NASA Evidence**. Start with the synthetic method demo in Flame Lab, or bring a calibrated experiment image sequence. Workspace navigation supports keyboard arrows and direct links; all analysis stays on the device.

Open `index.html` in a modern browser. The dashboard and question ranking run locally; source links open NASA pages when online. No build step, API key, sign-in, or server is required.

For an optional local HTTP server, run `python -m http.server 8000` from the project directory and open `http://localhost:8000`.

## Try the workflow

1. Open **Flame Lab** and select **Try synthetic method demo**. Inspect the analysis band, boundaries, graph, and threshold variants. This generated example contains no NASA observations.
2. For experiment data, select 2–60 PNG/JPEG/WEBP frames. Files are naturally sorted by filename and must share dimensions. Supply the source URL/DOI and seconds between equally spaced frames. Add pixels/mm calibration if known; otherwise results stay in pixel units.
3. Set the analysis band, threshold, and boundary side; extract motion, inspect individual frames, and export the measurements with their settings.
4. Open **Mission Review** to examine a hypothetical scenario or target habitat and export its gaps or proposed study.
5. Open **NASA Evidence**, try a question prompt, and follow the original source behind each finding.

Images are limited to 10 MB each, 4096 pixels per side, and 12 megapixels. Confirm timing, scale, exposure, camera stability, and region selection before interpreting the extracted motion.

## What works

- **Flame Motion Lab:** import 2–60 local experiment images; average intensity over a selected band; track a left/right image boundary; fit motion over time; inspect threshold sensitivity and frame overlays; export CSV with source, timing, calibration, and settings. A labeled synthetic example demonstrates the method. No NASA image sequence is bundled and no NASA measurement accuracy is claimed.

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
```

Checks cover interpolated boundaries, missing detections, clipping, band averaging, insufficient/constant fits, and recovery of exactly **3 px/s** from generated translated images.

Native Chrome checks confirmed the built-in demo produces **6.000 px/s**, **12/12 usable frames**, and **R² = 1.000**, with overlays and sensitivity traces rendered. Workspace switching and example-question updates were exercised. A 390-pixel mobile DOM check found no overflowing main-content elements.

These checks establish behavior on generated input, not accuracy on NASA experiments. A complete imported-file, download, and mission-preset walkthrough remains to be completed.

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
- `submission-copy.md` — draft submission fields and demo script

## Next technical milestones

- Add one verified NASA image sequence with test identity, timestamps, scale, and source provenance.
- Compare extracted boundaries with reference annotations; report measurement errors and failure cases.
- Add cropping/masking for overlays and checks for camera movement.
- Expand to a complementary PSI investigation with traceable metadata.
- Complete the browser walkthrough for imports, exports, and mission presets.

## Submission checklist

- Add the team name and member names to the demo.
- Host this folder on a public static host and verify that the URL opens without sign-in.
- Record a demo of 30 seconds or less, or create a deck of no more than seven slides.
- Add public demo and project URLs to the submission page.
- Keep the NASA data citations and limitations visible in the project description.
