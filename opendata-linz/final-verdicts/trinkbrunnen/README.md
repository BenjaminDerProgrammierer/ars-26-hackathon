# Trinkbrunnen

> **Final verdict: USE WITH PREPARATION.** Include only potable, in-service candidates after the publisher confirms the real CRS and the organizer verifies current status. The catalog's EPSG:4326 claim conflicts with projected metre-like values and must not be trusted for conversion.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Trinkbrunnen Standorte](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513) |
| Data access | [Rolling Trinkbrunnen.csv](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen.csv); dated [July 2023](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen_GEMESSEN_2023-07.csv) and [July 2022](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen_GEMESSEN_2022-07.csv) snapshots |
| Format | UTF-8, comma-delimited CSV with quoted German decimal-comma values; 24 columns observed |
| License | CC BY 4.0 |
| Coverage | 132 reviewed rows for public drinking-water points and ornamental fountains maintained by the city |
| Data vintage | Rolling filename, but catalog metadata modified 2023-07-04; no verified 2026 refresh |
| Last verified | 2026-07-15; current official catalog description and dated local evidence reviewed. Publisher CSVs were not re-fetched because `data.linz.gv.at` DNS resolution was blocked. |

## What the dataset contains

The reviewed rolling CSV has 132 rows and three ID-prefix classes: 86 `TB` drinking-water withdrawal points, 13 `BoP` ornamental fountains marked suitable for drinking-water withdrawal, and 30 `BmP` ornamental fountains marked as not drinking water, plus malformed or blank rows. It includes site description, fountain type, service and potable-water indicators, water-analysis information, operating periods/hours, coordinates, and maintenance notes.

The catalog description says drinking fountains generally operate from April through October and undergo a microbiological water sample after winter shutdown. That seasonal policy overlaps September, but it is not proof that a particular point is operational or safe on a given festival day.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| ID/prefix (`TB`, `BoP`, `BmP`) | Published class signal; retain the full ID, not only the prefix. |
| `Aufstellungsort` | German location description. |
| `Brunnenart` | Fountain type. |
| `In_Betrieb` | Published yes/no operational status; needs current verification. |
| `Trinkwasserbetrieb` | Published potable-water operation indicator; central to filtering. |
| `Wasseranalyse` | Source information about water analysis; not a substitute for current safety confirmation. |
| `Betriebszeit` | Free-text hours/operating period, for example `9:00 bis 21:00`. |
| `Koordinaten_Brunnen_x`, `Koordinaten_Brunnen_y` | Projected-looking coordinates with German decimal commas; catalog CRS metadata is contradictory. |

## Access and technical characteristics

Prefer the rolling `Trinkbrunnen.csv` only if its content date is captured and compared with the dated snapshots. Parse it as UTF-8 comma CSV; quoted coordinate cells use decimal commas, and some headers contain umlauts or trailing spaces. Normalize header whitespace in a comparison layer while retaining the original header names in provenance.

The metadata labels the coordinates EPSG:4326, but observed values such as approximately 71,470.923 and 355,779.329 cannot be longitude/latitude degrees. The actual projected CRS, axis order, and which column is easting/northing are **not verified**. Similarity to other Linz data is not enough to assign EPSG:31255. Request publisher confirmation and test known landmarks before reprojection. The review reported 84 coordinate-populated rows while also associating coordinates with the useful potable classes; because that does not reconcile with the prefix totals, completeness must be recalculated from a fresh file rather than repeated as settled fact.

## Data quality and limitations

- Incorrect CRS metadata is the main integration blocker. Guessing an EPSG code can yield plausible-looking but wrong pins.
- The rolling filename does not establish freshness; catalog metadata dates to July 2023 and the file was not re-fetched on 2026-07-15.
- Potability and service are safety-relevant and time-sensitive. Prefix, `In_Betrieb`, `Trinkwasserbetrieb`, and `Wasseranalyse` must all be interpreted and verified.
- `BmP` rows are explicitly not drinking water and must never appear as hydration points.
- Free-text operating hours and maintenance notes are German and not reliably machine-actionable without review.
- Row-class totals and coordinate completeness in the dated audit require reconciliation against a fresh snapshot.

## Using it with the Ars Electronica dataset

### Join strategy

After authoritative CRS confirmation, transform fountain coordinates to EPSG:4326 and validate several known sites. Filter to `TB` and `BoP` only when their potable and in-service fields agree; quarantine contradictory/malformed rows. Join to cleaned venue coordinates by proximity and retain original status fields, verification timestamp, distance, and source vintage. Any calendar-hours comparison is advisory because `Betriebszeit` is free text.

### Suitable hackathon uses

- A prototype hydration layer near outdoor venues after organizer verification.
- A data-quality view explaining class, seasonal operation, and source uncertainty.
- A prepared visitor-services bundle combined with toilets and other dated POIs.

### Do not use it for

- Current water-safety, guaranteed availability, or opening claims based only on the 2023 file.
- Mapping raw X/Y as WGS84 or including `BmP` ornamental fountains as potable.

## Preparation recipe

1. Obtain a fresh rolling CSV and publisher confirmation of EPSG code, axis order, class meanings, and current status fields.
2. Parse UTF-8 CSV with quoted decimal commas; trim header comparison keys and recompute row/class/coordinate counts.
3. Filter potable/in-service records, transform from the confirmed CRS to EPSG:4326, and validate known Linz locations.
4. Join to cleaned festival venues and package a dated, prototype-only snapshot with attribution, verification status, and a safety disclaimer.

## Decision rationale

Public drinking-water locations are highly relevant to an outdoor September festival and the attributes are richer than a simple point list. However, wrong CRS metadata and stale safety-relevant status make raw distribution unsafe for teams. The portfolio decision remains **USE WITH PREPARATION**, conditional on authoritative coordinate and service verification; issue #7 tracks the publisher defect.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513)
- [Official rolling CSV](https://data.linz.gv.at/katalog/Freizeit/trinkbrunnen/Trinkbrunnen.csv)
- [Publisher defect issue #7](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/7)
- [Hands-on source review](../../2026-07-13-reviews-rainer/trinkbrunnen.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
