# Fireline Atlas

**NASA Space Apps Challenge 2026 · Flame in Freefall**  
An offline-ready, source-traceable evidence dashboard for microgravity fire-safety research.

## Run it

Open `index.html` in a modern browser. The dashboard and question ranking run locally; source links open NASA pages when online. No build step, API key, sign-in, or server is required.

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

## Data and limits

The included notes are paraphrases of the listed NASA sources, primarily NASA/TM-20210011385. They are not raw experiment records and are not a complete PSI dataset. In particular, the `≈100 W` and `≈110 W` comparison uses approximate values described in the report. It is a context comparison, not a calibrated chart, safety threshold, or predictive model. The scenario workbench reports condition similarity and missing evidence; its condition coverage is not a safety score. The rank score is retrieval relevance, not fire risk. This prototype does not replace NASA material qualification, engineering review, or crew procedures.

NASA's Physical Sciences Informatics repository is the planned pathway for expanding the evidence base with investigation-level files and metadata. Each added record should preserve its source DOI, experimental conditions, measurement units, and page or file location.

## File map

- `index.html` — dashboard and accessible interface structure
- `styles.css`, `scenario.css` — responsive visual system and scenario workbench
- `evidence.js` — traceable, curated evidence notes
- `app.js` — local retrieval, ranking, synthesis, and filters
- `flame-lab.js`, `flame-lab.css` — independent offline image-processing workbench
- `submission-copy.md` — draft submission fields and demo script

## Submission checklist

- Add the team name and member names to the demo.
- Host this folder on a public static host and verify that the URL opens without sign-in.
- Record a demo of 30 seconds or less, or create a deck of no more than seven slides.
- Add public demo and project URLs to the submission page.
- Keep the NASA data citations and limitations visible in the project description.
