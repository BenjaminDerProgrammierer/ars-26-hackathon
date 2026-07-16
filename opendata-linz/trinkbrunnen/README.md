# Trinkbrunnen

> **Final verdict: USE WITH PREPARATION.** The publisher corrected the CRS to
> EPSG:31255. Reproject the coordinates, validate the column orientation, and
> verify current potable/in-service status before offering a hydration layer.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Trinkbrunnen Standorte](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513) |
| Data access | [Rolling Trinkbrunnen.csv](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen.csv) plus dated 2022 and 2023 snapshots |
| Format | UTF-8 comma CSV with quoted German decimal-comma values |
| CRS | EPSG:31255, now documented for the dated resources |
| License | CC BY 4.0 |
| Coverage | Public drinking-water points and ornamental fountains maintained by Stadt Linz |
| Data vintage | Rolling filename, but catalog metadata and dated snapshot are from 2023 |
| Last verified | 2026-07-15; rolling CSV downloaded and the live metadata no longer claims EPSG:4326 |

## Contents and identifiers

The source distinguishes `TB` drinking-water points, `BoP` ornamental fountains
suitable for drinking-water withdrawal, and `BmP` ornamental fountains without
drinking water. Important fields include the full fountain ID,
`Aufstellungsort`, `Brunnenart`, `In_Betrieb`, `Trinkwasserbetrieb`,
`Wasseranalyse`, `Betriebszeit`, and the two coordinate columns.

The 2022 and 2023 distribution descriptions now state EPSG:31255 for both
coordinate columns. This fixes the false EPSG:4326 claim reported in issue
[#7](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/7).
The rolling file's short description does not repeat the CRS or explain its
`Koordinaten_Brunnen_x`/`_y` convention, so conversion code should validate the
orientation against known Linz locations instead of relying on the labels alone.

## Limitations

- The rolling filename does not prove freshness; capture a retrieval timestamp and compare dated snapshots.
- Potability and service are safety-relevant and time-sensitive. `BmP` rows must never be shown as hydration points.
- `In_Betrieb`, `Trinkwasserbetrieb`, water-analysis notes, and free-text operating hours need review.
- Reprojection from EPSG:31255 is still required, even though the CRS is now correctly identified.

## Using it with the Ars Electronica dataset

Parse decimal-comma coordinates, validate the EPSG:31255 axis convention, and
transform to EPSG:4326. Filter to consistent, currently verified `TB` and `BoP`
records, quarantine malformed or contradictory rows, and join by proximity to
cleaned venue coordinates. Retain raw status fields, source vintage, retrieval
time, verification state, and distance.

## Preparation recipe

1. Fetch the rolling CSV and record its retrieval timestamp and checksum.
2. Parse UTF-8 CSV, trim header comparison keys, and validate coordinate orientation at known sites.
3. Reproject from EPSG:31255 to EPSG:4326 and filter potable, in-service candidates.
4. Confirm current service status and publish a dated prototype-only layer with attribution and a safety disclaimer.

## Decision rationale

The CRS metadata blocker is fixed, but coordinate conversion, source freshness,
and safety-relevant status still require organizer preparation. The verdict
therefore remains **USE WITH PREPARATION**.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513)
- [Official rolling CSV](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen.csv)
- [Issue #7](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/7)
- [Original hands-on review](../archive/2026-07-13-reviews-rainer/trinkbrunnen.md)
