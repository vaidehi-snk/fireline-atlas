# Submission copy — Fireline Atlas

## Project name

Fireline Atlas

## High-level project summary

What can a space-station flame tell us about a lunar habitat? Fireline Atlas connects 129 NASA BASS-II test records with optical and radiometer measurements from 65 flight clips. Users can inspect a flame frame by frame and explore 25 tests with recorded oxygen and airflow coordinates. The highest recorded initial oxygen was 22.2%. The challenge’s 30% lunar scenario sits beyond that evidence.

## Link to project demo

https://vaidehi-snk.github.io/fireline-atlas/demo.html

## Link to final project

https://vaidehi-snk.github.io/fireline-atlas/

## Detailed project description

Fireline joins 65 flight-video traces to NASA’s original BASS-II table. The dashboard measures periods of sustained visible signal and checks for a nearby drop in the digitized radiometer reading. Researchers can inspect the signal chart, trace an observation to the NASA filename and hash, and explore initial oxygen against recorded airflow for 25 tests with single-valued coordinates. The map shows 12 apparent losses with a nearby radiometer drop, two signals still visible near observation end, six inconclusive cases and five tests without video measurements. The lunar oxygen marker highlights a gap in the plotted evidence.

Fireline now incorporates the original NASA PSI-25 BASS-II experimental table: 129 records, six investigators, and 17 preserved source fields, attributed to DOI 10.60555/4qc4-de67. Users can filter tests, inspect initial oxygen versus exact numeric final CO, open the full record, and export selected rows with source provenance and file hash. Censored, status, and missing CO readings remain distinct. The recorded initial oxygen envelope is 13.6–22.2%, refining the report overview; coverage across heterogeneous tests does not establish matched conditions, causation, peak CO, or a safety threshold. This is real experiment-table ingestion; image-sequence accuracy validation remains a separate unfinished milestone.

Fireline's technical centerpiece is the offline Flame Motion Lab. Load eleven real NASA B3 contact-sheet frames with their unequal source timestamps, or import a local sequence. Select an analysis band and threshold, extract image-boundary motion with a least-squares fit, and inspect overlays and threshold sensitivity. Exports retain source clocks, timing mode, settings and hashes. The B3 case links directly to its original experiment-table record. The method is inspired by NASA's BASS-II report, §2.2.4, but remains an independent implementation awaiting physical calibration and independent boundary annotations. Contact-sheet resolution and changing exposure are explicit limitations. A separate synthetic demo is also available and labeled. Fifteen browser checks passed on the public app. A separate qualitative spot check compared sampled frames from three original clips with the detector output. In B7, illuminated hardware and faint late signals complicate the interpretation of detected duration. Independent human annotations remain future work.

Spacecraft fires unfold in a low-gravity environment where buoyancy-driven flow changes. Research results are valuable, but a mission team still needs to connect a finding to the conditions under which it was measured. Fireline Atlas presents a focused, interactive evidence desk for that task.

Users can ask about oxygen, heat release, fuel geometry, airflow, smoke, or crew monitoring; switch among habitat, suppression, and material-screening lenses; and filter the returned evidence. Fireline ranks each note by transparent topic matching, source tier, and mission relevance. Every result links to a NASA source, states its evidence type, and carries a bounded operational implication.

The mission scenario workbench turns this library into a usable planning interaction. A user selects fuel geometry, initial oxygen, burn duration, qualitative flow, a heat path to nearby hardware, and observed gas channels. The tool checks whether oxygen and configuration overlap the curated BASS-II evidence, detects the documented prolonged opposed-thick-slab damage analogue, identifies missing measurements, and generates scenario-specific review prompts. Its distinctive experiment planner ranks the next evidence gap for the chosen scenario, then exports a controlled, one-factor-at-a-time study matrix as CSV. NASA-reported context is labeled separately from proposed exploratory design levels; the matrix calls for measured flow and synchronized atmosphere channels. A one-click export also creates a source-linked plain-text mission review note. Outputs are evidence coverage and research-planning aids, not risk scores, fire predictions, or crew instructions.

The Mission Transfer Gap Map makes the lunar design challenge explicit. Set oxygen, pressure, gravity, and combustion family to compare a target habitat with the curated BASS-II evidence context. For the challenge's lunar reference (30% or greater oxygen, 10.2 psi or less, partial gravity), the map shows which axes are outside or absent from the curated notes and exports a mission-specific research-gap brief. It does not interpolate across gravity or pressure and does not infer safety. It distinguishes solid-fuel BASS-II evidence from gaseous-flame CFI-G context.

The dashboard compares two approximate BASS-II cases reported by NASA: a prolonged opposed thick-slab burn near 100 W that damaged a window corner after a leak directed heat there, and a relatively brief concurrent-rod burn near 110 W that did not cause damage. The comparison is designed to challenge single-number reasoning, not to infer a safe threshold. The project also surfaces NASA findings about oxygen concentration, duct-flow scatter, geometry-dependent combustion products, and atmosphere measurements.

The prototype runs locally in a browser with no API key or sign-in. Its current evidence library is a small, curated set of paraphrased NASA findings rather than a complete PSI data ingestion. It is a research-navigation and decision-support concept, not a fire-growth predictor, material certification tool, or substitute for crew procedures.

## Use of Super Intelligence (SI)

Fireline uses an inspectable, local evidence-synthesis engine. It expands mission questions with combustion-science synonyms, ranks source-linked evidence using topic match, NASA source tier, and selected mission context, then generates a concise synthesis from those ranked findings. The user can inspect the evidence and limitations behind the answer. This prototype does not claim a general-purpose language model or validated predictive intelligence; its SI workflow is deliberately transparent and works without an external service. A future version can add a validated language model while retaining source-grounded retrieval, citation checks, and human review.

## NASA data

NASA PSI-25 BASS-II flight videos (main camera clips), DOI https://doi.org/10.60555/4qc4-de67, listed and downloaded through the public PSI repository API. Fireline stores derived per-frame traces and per-test outcomes with the source file name, version and SHA-256; the demo shows selected B1 frames.

NASA PSI-25 B3 contact sheet, original file `PSI-25_Raw Data_GMT2014_050_BASS_S148M_TPB3_ProofSheet.pdf`, and BASS-II readme, under the same source DOI. The repository includes unchanged source documents, a reproducible thumbnail reconstruction script, and a manifest with photo clocks and image hashes. The built-in case uses 11 unresized 314×209 thumbnails over a 21-second source-time span. No spatial calibration or independent published boundary annotation is claimed.

NASA PSI-25, BASS-II experimental table, DOI https://doi.org/10.60555/4qc4-de67. Original file `PSI-25_Experimental table_BASS-II.csv`, file version 1, CC0-1.0, retrieved 2026-11-14. A byte-preserving CSV and its SHA-256 are included with a reproducible importer and data-quality checks. See `data/PROVENANCE.md` for the source trail.

NASA/TM-20210011385, *Burning and Suppression of Solids—II (BASS-II)*, especially the summary findings on heat-release rate, oxygen concentration, duct-flow variation, test geometry, and combustion-product sensing. NASA Physical Sciences Informatics (PSI) is identified as the pathway for expanding this curated evidence set with investigation-level raw and analyzed data.

## Space agency partner data and other references

- NASA Glenn Research Center, Combustion Science overview: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- NASA PSI investigations by research area: https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/
- NASA Technical Reports Server citation: https://ntrs.nasa.gov/citations/20210011385
- NASA PSI repository: https://psi.nasa.gov/physci/repo

## Demo opening credits

MicroFire Tech · Group members: Vaidehi Kakad and Niraj Khetre. Both names appear in the opening captions and English synthetic narration. Runtime is 26.79 seconds.
