# Herkunftsländer der Gäste von Beherbergungsbetrieben

> **Final verdict: USE.** Include a cleaned country-by-year table and a reviewed German-label-to-ISO crosswalk. This is useful contextual tourism data, but it describes all Linz guests—not Ars Electronica visitors.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Herkunftsländer der Gäste von Beherbergungsbetrieben](https://www.data.gv.at/katalog/datasets/e7b92bb8-75e4-41ac-8b78-b43e25734e0d) |
| Data access | Annual CSVs; the latest reviewed file was [`thdg_2024.csv`](https://data.linz.gv.at/katalog/tourismus/herkunftsnationen/2024/thdg_2024.csv) |
| Format | Semicolon-delimited CSV; ISO-8859-1/Latin-1 observed in review |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | Linz guest arrivals and overnight stays by residence country/region and quarter |
| Data vintage | Reviewed annual series through 2024; catalog lists files back to 2003, while the curated recommendation focuses on 2005–2024 |
| Last verified | 2026-07-15: direct file fetch did not complete; schema, row shape, and values below are observations from 2026-07-13 |

## What the dataset contains

Each annual file is a country/region table with approximately 58 data rows in the reviewed 2024 file. The first column is the guest's permanent residence (`ständiger Wohnsitz der Fremden`). Eight numeric columns report `Fremdenmeldungen` (arrivals) and `Übernachtungen` (overnight stays), each split across the four quarters.

Rows mix individual countries with composite regions and aggregates. Labels include `Österreich`, `Deutschland`, `Belgien`, `China 2)`, `Ausland`, and broader groupings such as `Arab. Länder in Asien`. Footnotes define inclusions that do not always map one-to-one onto modern ISO country codes.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `ständiger Wohnsitz der Fremden` | German residence-country or region label; requires a curated crosswalk |
| `Fremdenmeldungen` Q1–Q4 | Guest arrivals by quarter |
| `Übernachtungen` Q1–Q4 | Overnight stays by quarter |
| File year | Observation year; add explicitly during import |
| Normalized ISO code | Organizer-created join key for true country rows; leave composite/aggregate rows unmapped |

## Access and technical characteristics

Use the annual CSV distributions, decode them as ISO-8859-1/Latin-1, and parse with `;`. Do not rely on default UTF-8 handling: umlauts and German labels will otherwise be corrupted. Add a `year` from the distribution path and reshape the eight measure columns into long form (`year`, `quarter`, `measure`, `origin`, `value`) for analysis.

Build the ISO crosswalk manually and version it. Strip only well-understood footnote suffixes; do not automatically force composite regions such as “Arab countries in Asia,” “former Yugoslavia,” or “Central and South America excluding Brazil” onto a single country. Preserve the exact source label and footnote definition next to any normalized value.

## Data quality and limitations

- Latest reviewed observations are 2024, not the 2026 festival year.
- German names, footnote markers, historic groupings, and aggregates complicate automated ISO mapping.
- Aggregate rows such as `Ausland` and subnational rows such as `darunter Wien` must not be counted as countries.
- The data is quarterly and city-wide; it has no hotel, visitor, venue, or point geometry.
- Residence-country totals are not nationality and are not evidence that a person attended Ars Electronica.
- Direct access was not revalidated on 2026-07-15; the 2026-07-13 source review remains the dated evidence.

## Using it with the Ars Electronica dataset

### Join strategy

Normalize Ars contact country values to ISO codes, then join only to source rows with an unambiguous country mapping. The consolidated review found 238 festival contacts carrying a country value. Compare counts or shares by country, not individual people. For seasonal context, select Q3 because the festival occurs in September, but label it as the entire July–September quarter.

### Suitable hackathon uses

- Compare country distributions of festival contacts and historical Linz tourism.
- Build a map or ranked story about artistic representation versus wider visitor origins.
- Show how Q3 tourism composition changed from 2005 through 2024.

### Do not use it for

- Claims that tourism guests attended the festival or that the festival caused a change.
- Individual-level profiling, nationality inference, or visitor tracking.
- A 2026 forecast without a separate, documented forecasting method.

## Preparation recipe

1. Download the chosen annual files, record URLs, checksums, retrieval date, license, and actual maximum year.
2. Decode Latin-1, parse semicolon CSV, add `year`, and reshape quarterly measures to tidy long form.
3. Separate country rows from aggregates and composites; create a reviewed ISO crosswalk while retaining original labels and footnotes.
4. Validate non-negative integers, quarter completeness, duplicate year-origin rows, and totals before joining to normalized Ars contact countries.
5. Publish the cleaned table, crosswalk, mapping notes, and visible `source_vintage` metadata.

## Decision rationale

The final decision remains **USE** because the country dimension creates a credible semantic bridge to festival contacts and the long quarterly series supports useful storytelling. Rainer's 2026-07-13 review also rated it “Recommended.” Preparation is modest but essential: encoding, aggregate filtering, and non-trivial label mapping must be handled centrally. Its analytical role is contextual and comparative, never causal.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/e7b92bb8-75e4-41ac-8b78-b43e25734e0d)
- [Official 2024 CSV](https://data.linz.gv.at/katalog/tourismus/herkunftsnationen/2024/thdg_2024.csv)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/herkunftslaender-gaeste.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
