# Submission copy — Fireline Atlas

## Project name

Fireline Atlas

## High-level project summary

Fireline Atlas is a source-traceable intelligence dashboard that helps crews and mission planners explore NASA microgravity combustion research. Ask a mission question, choose a mission lens, and see the most relevant findings ranked with their NASA sources and limitations. The prototype spotlights a BASS-II lesson: heat-release rate alone does not explain hardware damage; duration, fuel geometry, ventilation, and heat path matter too.

## Link to project demo

To be added after the demo is recorded and hosted publicly.

## Link to final project

To be added after Fireline Atlas is deployed to a public static host.

## Detailed project description

Spacecraft fires unfold in a low-gravity environment where buoyancy-driven flow changes. Research results are valuable, but a mission team still needs to connect a finding to the conditions under which it was measured. Fireline Atlas presents a focused, interactive evidence desk for that task.

Users can ask about oxygen, heat release, fuel geometry, airflow, smoke, or crew monitoring; switch among habitat, suppression, and material-screening lenses; and filter the returned evidence. Fireline ranks each note by transparent topic matching, source tier, and mission relevance. Every result links to a NASA source, states its evidence type, and carries a bounded operational implication.

The mission scenario workbench turns this library into a usable planning interaction. A user selects fuel geometry, initial oxygen, burn duration, qualitative flow, a heat path to nearby hardware, and observed gas channels. The tool checks whether oxygen and configuration overlap the curated BASS-II evidence, detects the documented prolonged opposed-thick-slab damage analogue, identifies missing measurements, and generates scenario-specific review prompts. Its distinctive experiment planner ranks the next evidence gap for the chosen scenario, then exports a controlled, one-factor-at-a-time study matrix as CSV. NASA-reported context is labeled separately from proposed exploratory design levels; the matrix calls for measured flow and synchronized atmosphere channels. A one-click export also creates a source-linked plain-text mission review note. Outputs are evidence coverage and research-planning aids, not risk scores, fire predictions, or crew instructions.

The Mission Transfer Gap Map makes the lunar design challenge explicit. Set oxygen, pressure, gravity, and combustion family to compare a target habitat with the curated BASS-II evidence context. For the challenge's lunar reference (30% or greater oxygen, 10.2 psi or less, partial gravity), the map shows which axes are outside or absent from the curated notes and exports a mission-specific research-gap brief. It does not interpolate across gravity or pressure and does not infer safety. It distinguishes solid-fuel BASS-II evidence from gaseous-flame CFI-G context.

The dashboard compares two approximate BASS-II cases reported by NASA: a prolonged opposed thick-slab burn near 100 W that damaged a window corner after a leak directed heat there, and a relatively brief concurrent-rod burn near 110 W that did not cause damage. The comparison is designed to challenge single-number reasoning, not to infer a safe threshold. The project also surfaces NASA findings about oxygen concentration, duct-flow scatter, geometry-dependent combustion products, and atmosphere measurements.

The prototype runs locally in a browser with no API key or sign-in. Its current evidence library is a small, curated set of paraphrased NASA findings rather than a complete PSI data ingestion. It is a research-navigation and decision-support concept, not a fire-growth predictor, material certification tool, or substitute for crew procedures.

## Use of Super Intelligence (SI)

Fireline uses an inspectable, local evidence-synthesis engine. It expands mission questions with combustion-science synonyms, ranks source-linked evidence using topic match, NASA source tier, and selected mission context, then generates a concise synthesis from those ranked findings. The user can inspect the evidence and limitations behind the answer. This prototype does not claim a general-purpose language model or validated predictive intelligence; its SI workflow is deliberately transparent and works without an external service. A future version can add a validated language model while retaining source-grounded retrieval, citation checks, and human review.

## NASA data

NASA/TM-20210011385, *Burning and Suppression of Solids—II (BASS-II)*, especially the summary findings on heat-release rate, oxygen concentration, duct-flow variation, test geometry, and combustion-product sensing. NASA Physical Sciences Informatics (PSI) is identified as the pathway for expanding this curated evidence set with investigation-level raw and analyzed data.

## Space agency partner data and other references

- NASA Glenn Research Center, Combustion Science overview: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- NASA PSI investigations by research area: https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/
- NASA Technical Reports Server citation: https://ntrs.nasa.gov/citations/20210011385
- NASA PSI repository: https://psi.nasa.gov/physci/repo

## 30-second demo script

**0:00–0:04** “Fireline Atlas turns NASA microgravity fire research into an evidence-backed mission review.”

**0:04–0:10** Set the workbench to **opposed thick slab**, **prolonged**, **heat directed to hardware**, then select **Analyze scenario**. “Fireline finds the closest documented BASS-II case.”

**0:10–0:18** Show the analogue and prompts. “The report describes window damage near 100 watts in a prolonged burn, but no damage in a briefer burn near 110. This is a case match, not a prediction.”

**0:18–0:25** Toggle CO and CO₂, move oxygen outside the test range, and analyze again. “It exposes missing sensor context and marks where NASA’s evidence stops.”

**0:25–0:30** Select **Download review note**. “Your team gets a source-linked review brief—not a black-box risk score.”

Add team name and team members on screen or in the introduction. Use the demo only after the team and the project URL are finalized.
