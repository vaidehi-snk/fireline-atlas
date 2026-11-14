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

Final CO contains exact numeric readings, a censored `>500` entry, non-numeric statuses (`OR`, `over`), `none`, and blank cells. The explorer preserves them all and plots only exact numeric final CO readings. It does not interpret status abbreviations without supporting documentation. Negative recorded baseline values are retained and flagged, not changed to zero. Final CO is an endpoint value; no peak, emission rate, toxicity verdict, or alarm threshold is derived from it.

This table provides experiment-level context, not a raw time series, an image sequence, or an independently validated predictive dataset. Multiple tests may share a sample; independence and replicate structure require further review. No flame-motion accuracy claim follows from ingesting these records.
