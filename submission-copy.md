# Fireline Atlas — Space Apps submission copy

Team: MicroFire Tech
Group members: Vaidehi Kakad and Niraj Khetre

Use the headings below to find each portal field. Copy the paragraphs or URLs beneath them. The SI checkbox notes and final team note are instructions for the team.

## Project Summary

### Project Name

Fireline Atlas

### Summary

How much can a flame aboard the International Space Station tell us about fire in a Moon base? Fireline Atlas connects 129 NASA BASS-II experiment records with measurements from 65 flight videos. A researcher can select a test, see when its flame signal faded, and check whether the radiometer reading also dropped. An interactive map plots the 25 tests with a single recorded oxygen and airflow value. It also reveals a gap: the highest initial oxygen in the full table was 22.2%, while the challenge’s lunar scenario starts at 30%. By tracing each observation back to its source and showing where the evidence runs out, Fireline helps researchers decide what to test next.

### Project Demo

https://vaidehi-snk.github.io/fireline-atlas/demo.html

### Project

https://vaidehi-snk.github.io/fireline-atlas/

## Project Information

### Project Details

Start in NASA Evidence and select B1 on the oxygen–airflow map. The camera shows a bright signal that fades near 38 seconds. The radiometer falls below our comparison level at 39.75 seconds. A researcher can inspect both traces, read NASA’s original test settings and identify the source clip. This turns a table of experimental setups into a way to investigate what happened during individual tests.

We used Python, NumPy and FFmpeg to process NASA flight footage. The pipeline samples four frames per second, measures changes in image brightness and reads instrument digits from the video overlay. It compares the last sustained optical detection with a measured drop in the radiometer. Across 65 clips, 24 show both signals changing close together, five show a visible signal near the end of observation, and 36 remain inconclusive. Igniter glow, work lights and faint flames can affect the optical measurement. A missing sensor reading leaves the comparison unresolved.

The browser interface uses HTML, CSS and JavaScript. Flame Lab lets users step through 11 NASA B3 images, track an image boundary using the original photo timestamps, vary the brightness threshold and export the results. NASA Evidence preserves all 17 fields from the original table. Tests with changing or ambiguous airflow stay in the table. Only tests with a single numeric reading on both axes appear on the map. The Moon base scenario appears as a vertical oxygen line because its airflow is unspecified.

Mission Review compares a proposed environment with the available evidence across oxygen, pressure, gravity and fuel type. It gives researchers source-linked questions and an exportable experimental plan. We designed the dashboard to make disagreements and missing measurements visible, so a researcher can tell which conclusions need another experiment. Fifteen browser checks passed on the public app. A separate visual spot check used sampled frames from three original NASA clips. Independent validation of physical burn duration and spread rate remains open.

### Use of Super Intelligence (SI)

**Select these seven options**

- Ideation or Brainstorming
- Research or Information Gathering
- Data Analysis and Interpretation
- Coding, Debugging, or Troubleshooting
- Writing, Editing, or Translation
- Visual Design or Image Creation
- Presentation, Video, or Audio

Visual Design applies to the dashboard layout, charts, and demo composition. NASA supplied the experimental imagery. Writing applies to the submission copy, script, and captions. Presentation applies to the edited demo and synthesized narration.

**Leave unchecked for the documented implementation**

- Building SI/ML Into the Project — the deployed dashboard uses explicit retrieval rules, numerical image processing, and template matching. SI assistance was used during development.
- Other Project-Related SI Use — the seven selections cover the documented uses.
- None / Did not use SI or SI tools — the team used SI in the selected categories.

**Disclosure text** (use wherever the form offers a description):

We used OpenAI Codex to help develop the project idea, investigate NASA sources, write and debug code, review derived measurements, design regression checks, and prepare the submission text and demo. The demo uses actual NASA imagery and screenshots of the working application. Its editing, script and captions were SI-assisted. The English narration is an AI-generated voice from Fish Audio; the end card, the demo page and the MP4 metadata say so. NASA supplied the original experiment records and footage. Fireline’s code produced the optical measurements and classifications from those sources. In the dashboard, questions are matched to curated NASA findings through explicit rules that users can inspect.

### NASA Data

Choose **Add New Link** for each row. The PSI-25 collection contains the experimental table, primary flight videos, B3 photographic proof sheet and instrument readme.

| Link Text | Link Url |
| --- | --- |
| NASA PSI-25 — BASS-II experiment records, flight videos, B3 images and instrument notes | https://doi.org/10.60555/4qc4-de67 |
| NASA Technical Memorandum — Burning and Suppression of Solids–II (BASS-II), including the image-analysis method in section 2.2.4 | https://ntrs.nasa.gov/citations/20210011385 |
| NASA Glenn Research Center — Combustion Science | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/ |
| NASA Physical Sciences Informatics — Investigations by Research Area | https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/ |
| NASA Space Apps — Flame in Freefall challenge and lunar scenario | https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/ |

### Space Agency Partner & Other Data

The science data came from NASA. Use these rows for the project's public code and external development, processing and presentation tools.

| Link Text | Link Url |
| --- | --- |
| MicroFire Tech — Fireline Atlas source code, processing scripts and provenance | https://github.com/vaidehi-snk/fireline-atlas |
| OpenAI Codex — SI-assisted development and submission preparation | https://openai.com/codex/ |
| Python — data preparation and video analysis | https://www.python.org/ |
| NumPy — numerical analysis | https://numpy.org/ |
| FFmpeg — video decoding and demo encoding | https://ffmpeg.org/ |
| pypdf — extracting source images from the NASA proof sheet | https://pypdf.readthedocs.io/ |
| Pillow — image reconstruction, captions and demo frames | https://python-pillow.org/ |
| PyAV — decoding selected NASA video frames for the demo and spot checks | https://pyav.org/ |
| Fish Audio — AI-generated English narration for the demo | https://fish.audio/ |
| HyperFrames — demo video composition and rendering | https://hyperframes.heygen.com/ |
| Playwright — automated browser checks | https://playwright.dev/ |
| GitHub Pages — public project and demo hosting | https://pages.github.com/ |

## Team note before submission

The screenshot asks for visible watermarks on SI-generated visuals and descriptive text and metadata for SI-generated audio, code and data. The demo MP4 (26.0 s) now discloses its AI narration and SI-assisted edit in three places: the end card on screen ("AI voice by Fish Audio · SI-assisted edit"), the demo page text under the video, and the MP4 title, comment and description tags. Its visuals are NASA PSI-25 footage and Fireline data drawn as motion graphics, not generated images. Record SI assistance for code and derived data in public descriptive text where the form asks for it.
