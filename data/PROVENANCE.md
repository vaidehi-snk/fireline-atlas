# BASS-II experiment-table provenance

- Investigation: NASA PSI-25, Burning and Suppression of Solids-II (BASS-II).
- Landing page: https://psi.nasa.gov/physci/repo/data/investigations/PSI-25
- Persistent identifier: https://doi.org/10.60555/4qc4-de67
- License recorded by NASA PSI: CC0-1.0.
- Original filename: `PSI-25_Experimental table_BASS-II.csv`; file version 1.
- Local byte-preserving copy: `PSI-25_Experimental-table_BASS-II.csv`.
- Retrieved: 2026-11-14, from the public file-download endpoint exposed by NASA's repository application.
- SHA-256: `71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042`.
- Size: 16,590 bytes; 129 data records; 17 original columns; six named investigators.

`scripts/import-bass.py` generates `bass-data.js` from this CSV. All cells remain strings without correcting, imputing, averaging, or standardizing their source values. Record ordinals count data records, not physical file lines (the original file contains blank lines).

The initial calibrated O2 values span 13.6–22.2%. This is an envelope over heterogeneous tests, not proof that a particular material, flow, and oxygen combination was tested. It refines the report overview's approximate 14–21% range. The table contains instrument display fields, which must not be silently treated as calibrated flow velocities.

Final CO contains 120 exact numeric readings, three censored entries (one `>500`, two `OR`), one other status (`over`), and five missing/none entries. NASA's included `BASS-II_ReadMe.docx` explicitly defines `OR` as over range (>1000 ppm); the explorer therefore classifies it as censored while preserving the raw cell. No meaning beyond the source wording is assigned to `over`. Only exact numeric final CO readings are plotted. Negative recorded baseline values are retained and flagged, not changed to zero. Final CO is an endpoint value; no peak, emission rate, toxicity verdict, or alarm threshold is derived from it.

This table provides experiment-level context, not a raw time series, an image sequence, or an independently validated predictive dataset. Multiple tests may share a sample; independence and replicate structure require further review. No flame-motion accuracy claim follows from ingesting these records.

## Real B3 contact-sheet case

The repository now also includes NASA's unchanged `PSI-25_Raw Data_GMT2014_050_BASS_S148M_TPB3_ProofSheet.pdf`, stored as `BASS-II_B3_ProofSheet.pdf` (SHA-256 `7c8521870c90786ea7e201870cfeaa37c877192d4fc312d83c530ce41d2fe0ed`). The contact sheet identifies Test B3, sample 148M, 2014-02-19. The experimental table records B3 under Bhattacharjee with sample label 148; both labels remain visible rather than silently normalized.

`scripts/build-nasa-case.py` reconstructs each 314×209 thumbnail from six embedded image strips in original order, with no resizing. Eleven frames between photo clocks 12:20:37 and 12:20:58 are bundled in `nasa-case.js`. Their offsets are 0, 2, 4, 7, 9, 11, 13, 15, 18, 20, and 21 seconds. `B3-case-manifest.json` retains IDs, clocks, source hash and per-image PNG hashes. The source PDF contains all 43 contact-sheet frames; this preset selects a post-ignition portion rather than claiming a complete experiment.

Exposure changes within the sequence. Contact-sheet resolution is lower than the original camera images, and neither spatial calibration nor published boundary annotations are available for this preset. The exported values are optical-boundary measurements in reproduced image pixels, not validated physical flame-spread rates. Source timestamps are used directly; an equal-spacing assumption is not applied. The photo/video clock offset noted on the sheet is not silently corrected or used for sensor alignment.
