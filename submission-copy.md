# Submission copy — Fireline Atlas

## Project name

Fireline Atlas

## High-level project summary

Fireline Atlas connects actual NASA flame imagery, 129 original BASS-II experiment records, and source-linked findings in an inspectable research workflow. Extract optical motion with published photo timestamps, inspect threshold sensitivity, trace the image case to its experimental conditions, and map evidence gaps for target habitats. The prototype preserves provenance and missing/censored readings while keeping measured image motion distinct from unvalidated physical fire predictions.

## Link to project demo

To be added after the demo is recorded and hosted publicly.

## Link to final project

To be added after Fireline Atlas is deployed to a public static host.

## Detailed project description

NASA's BASS-II experimental table records how each test was set up but not what happened. Fireline reads NASA's own flight videos for each test and adds the missing outcomes: when the visible flame started and ended, how its edges moved, and the on-screen fan, radiometer and clock readings at those moments. The flame radiometer acts as an independent second sensor. Where it agrees with the camera, the extinction is confirmed. Where it keeps reading high after a dim blue flame fades from the camera, the test is flagged for review rather than reported as extinguished. The pipeline also found NASA video files that are truncated and do not open. Every number links to the exact NASA file and its SHA-256; outcomes are optical observations in video pixels and seconds, not calibrated spread rates.

Fireline now incorporates the original NASA PSI-25 BASS-II experimental table: 129 records, six investigators, and 17 preserved source fields, attributed to DOI 10.60555/4qc4-de67. Users can filter tests, inspect initial oxygen versus exact numeric final CO, open the full record, and export selected rows with source provenance and file hash. Censored, status, and missing CO readings remain distinct. The recorded initial oxygen envelope is 13.6–22.2%, refining the report overview; coverage across heterogeneous tests does not establish matched conditions, causation, peak CO, or a safety threshold. This is real experiment-table ingestion; image-sequence accuracy validation remains a separate unfinished milestone.

Fireline's technical centerpiece is the offline Flame Motion Lab. Load eleven real NASA B3 contact-sheet frames with their unequal source timestamps, or import a local sequence. Select an analysis band and threshold, extract image-boundary motion with a least-squares fit, and inspect overlays and threshold sensitivity. Exports retain source clocks, timing mode, settings and hashes. The B3 case links directly to its original experiment-table record. The method is inspired by NASA's BASS-II report, §2.2.4, but remains an independent implementation awaiting physical calibration and independent boundary annotations. Contact-sheet resolution and changing exposure are explicit limitations. A separate synthetic demo is also available and labeled. Thirteen automated browser checks pass for the core workflow, exports, filters, presets and mobile layouts; these verify software behavior rather than physical measurement accuracy.

Spacecraft fires unfold in a low-gravity environment where buoyancy-driven flow changes. Research results are valuable, but a mission team still needs to connect a finding to the conditions under which it was measured. Fireline Atlas presents a focused, interactive evidence desk for that task.

Users can ask about oxygen, heat release, fuel geometry, airflow, smoke, or crew monitoring; switch among habitat, suppression, and material-screening lenses; and filter the returned evidence. Fireline ranks each note by transparent topic matching, source tier, and mission relevance. Every result links to a NASA source, states its evidence type, and carries a bounded operational implication.

The mission scenario workbench turns this library into a usable planning interaction. A user selects fuel geometry, initial oxygen, burn duration, qualitative flow, a heat path to nearby hardware, and observed gas channels. The tool checks whether oxygen and configuration overlap the curated BASS-II evidence, detects the documented prolonged opposed-thick-slab damage analogue, identifies missing measurements, and generates scenario-specific review prompts. Its distinctive experiment planner ranks the next evidence gap for the chosen scenario, then exports a controlled, one-factor-at-a-time study matrix as CSV. NASA-reported context is labeled separately from proposed exploratory design levels; the matrix calls for measured flow and synchronized atmosphere channels. A one-click export also creates a source-linked plain-text mission review note. Outputs are evidence coverage and research-planning aids, not risk scores, fire predictions, or crew instructions.

The Mission Transfer Gap Map makes the lunar design challenge explicit. Set oxygen, pressure, gravity, and combustion family to compare a target habitat with the curated BASS-II evidence context. For the challenge's lunar reference (30% or greater oxygen, 10.2 psi or less, partial gravity), the map shows which axes are outside or absent from the curated notes and exports a mission-specific research-gap brief. It does not interpolate across gravity or pressure and does not infer safety. It distinguishes solid-fuel BASS-II evidence from gaseous-flame CFI-G context.

The dashboard compares two approximate BASS-II cases reported by NASA: a prolonged opposed thick-slab burn near 100 W that damaged a window corner after a leak directed heat there, and a relatively brief concurrent-rod burn near 110 W that did not cause damage. The comparison is designed to challenge single-number reasoning, not to infer a safe threshold. The project also surfaces NASA findings about oxygen concentration, duct-flow scatter, geometry-dependent combustion products, and atmosphere measurements.

The prototype runs locally in a browser with no API key or sign-in. Its current evidence library is a small, curated set of paraphrased NASA findings rather than a complete PSI data ingestion. It is a research-navigation and decision-support concept, not a fire-growth predictor, material certification tool, or substitute for crew procedures.

## Use of Super Intelligence (SI)

Fireline uses an inspectable, local evidence-synthesis engine. It expands mission questions with combustion-science synonyms, ranks source-linked evidence using topic match, NASA source tier, and selected mission context, then generates a concise synthesis from those ranked findings. The user can inspect the evidence and limitations behind the answer. This prototype does not claim a general-purpose language model or validated predictive intelligence; its SI workflow is deliberately transparent and works without an external service. A future version can add a validated language model while retaining source-grounded retrieval, citation checks, and human review.

## NASA data

NASA PSI-25 BASS-II flight videos (main camera clips), DOI https://doi.org/10.60555/4qc4-de67, listed and downloaded through the public PSI repository API. Fireline stores derived per-frame traces and per-test outcomes with the source file name, version and SHA-256; the videos themselves are not redistributed.

NASA PSI-25 B3 contact sheet, original file `PSI-25_Raw Data_GMT2014_050_BASS_S148M_TPB3_ProofSheet.pdf`, and BASS-II readme, under the same source DOI. The repository includes unchanged source documents, a reproducible thumbnail reconstruction script, and a manifest with photo clocks and image hashes. The built-in case uses 11 unresized 314×209 thumbnails over a 21-second source-time span. No spatial calibration or independent published boundary annotation is claimed.

NASA PSI-25, BASS-II experimental table, DOI https://doi.org/10.60555/4qc4-de67. Original file `PSI-25_Experimental table_BASS-II.csv`, file version 1, CC0-1.0, retrieved 2026-11-14. A byte-preserving CSV and its SHA-256 are included with a reproducible importer and data-quality checks. See `data/PROVENANCE.md` for the source trail.

NASA/TM-20210011385, *Burning and Suppression of Solids—II (BASS-II)*, especially the summary findings on heat-release rate, oxygen concentration, duct-flow variation, test geometry, and combustion-product sensing. NASA Physical Sciences Informatics (PSI) is identified as the pathway for expanding this curated evidence set with investigation-level raw and analyzed data.

## Space agency partner data and other references

- NASA Glenn Research Center, Combustion Science overview: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- NASA PSI investigations by research area: https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/
- NASA Technical Reports Server citation: https://ntrs.nasa.gov/citations/20210011385
- NASA PSI repository: https://psi.nasa.gov/physci/repo

## 30-second demo script

**0:00–0:04** Show team/member names and project title. “Fireline Atlas turns NASA combustion data into inspectable mission evidence.”

**0:04–0:11** Load **real NASA B3 case** and scrub frames. “We extract optical motion from real NASA images, preserving timestamps and showing processing sensitivity.”

**0:11–0:19** Open the B3 source-record link, reset filters, and show censored values. “Each case links to experimental conditions across 129 tests. Missing and over-range readings stay explicit.”

**0:19–0:26** Show the lunar transfer gaps and export. “For future habitats, Fireline identifies evidence gaps and exports traceable research briefs.”

**0:26–0:30** Show sources and project URL. “Next: independent physical validation, supporting better fire-safety research.”

Add team name and team members on screen or in the introduction. Use the demo only after the team and the project URL are finalized.
