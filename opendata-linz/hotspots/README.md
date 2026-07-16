# Öffentliche WLAN-Hotspots

> **Final verdict: OPTIONAL.** Offer the 2022 locations as a visibly dated supporting layer. Usage figures are historical illustration only and must not be presented as 2026 connectivity, capacity, or crowd information.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Hotspot locations](https://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2) and [usage counts](https://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673) |
| Data access | [2022 locations CSV](https://data.linz.gv.at/katalog/Freizeit/hotspot/Hotspot_Geodaten_2022.csv) and [2022 HJ1 usage CSV](https://data.linz.gv.at/katalog/Freizeit/hotspot/Hotspot-Auswertung_2022-HJ1.csv) |
| Format | Two UTF-8 CSV files; WGS84 coordinates use quoted German decimal commas |
| License | CC BY 4.0 |
| Coverage | About 134 public-Wi-Fi location rows; about 107 usage rows for January-July 2022 |
| Data vintage | 2022; catalog metadata modified 2023-05-16; irregular update cadence |
| Last verified | 2026-07-15; official URLs and dated local evidence reviewed. Publisher CSVs were not re-fetched because `data.linz.gv.at` DNS resolution was blocked; contents are from the 2026-07-13 source review. |

## What the dataset contains

The bundle consists of a location table and a separate monthly-usage table. The location file describes public Wi-Fi points with names, short descriptions, dates/years, address fields, homepage, and WGS84 coordinates. It includes direct festival-landmark matches such as `AEC Dach (Ars Electronica Center)`, Brucknerhaus, Hauptplatz, and Domplatz. The usage file reports clients per month and hotspot for the first part of 2022.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `Nummer` | Published hotspot number, but some rows are empty; do not assume universal identity coverage. |
| `Latitude`, `Longitude` | WGS84 coordinates encoded with decimal commas; output GeoJSON as longitude then latitude. |
| `Name` | Main bridge to usage rows and landmark matching; requires normalization. |
| `Kurztext` | German description of the hotspot. |
| `Start im Jahr`, `Ende im Jahr` | Published lifecycle years; a sampled `0` end value denoted no recorded end, not proof of current operation. |
| `Stadt`, `Postleitzahl`, `Straße`, `Homepage` | Address and reference fields. |
| Monthly date columns | Client counts in the usage file for January-July 2022; blanks represent missing values, not zero. |

## Access and technical characteristics

Use `Hotspot_Geodaten_2022.csv`; the catalog also lists a 2011 location file, which is superseded for this project. Parse UTF-8 with a genuine CSV reader so quoted comma decimals remain intact, convert the two coordinate columns to numeric values, and validate them against Linz before mapping.

The two tables do not have a demonstrated common immutable ID. Join on a normalized `Name`: trim whitespace, case-fold for comparison, normalize punctuation, and remove explanatory parentheticals only in a separate matching key. For example, location `AEC Dach (Ars Electronica Center)` corresponds to usage name `AEC Dach`. Preserve both source names and emit match confidence; do not silently force unmatched rows.

## Data quality and limitations

- Both tables are frozen in 2022. A listed hotspot may have been moved, retired, renamed, or changed in performance.
- Usage covers only January-July 2022 and is monthly aggregate client activity, not bandwidth, unique people, venue capacity, or current footfall.
- Location-to-usage name matching is partial and semantic; blank `Nummer` and blank monthly cells prevent simple completeness assumptions.
- `Ende im Jahr = 0` was observed in apparently active samples, but it cannot prove operation on 2026-07-15.
- Publisher-file availability was not rechecked because DNS failed. The successful 2026-07-13 review remains the evidence for schema and counts.

## Using it with the Ars Electronica dataset

### Join strategy

Normalize festival venue names and Wi-Fi names for high-confidence landmark matches, then use spatial proximity for the remaining cleaned venue coordinates. Keep one location row per hotspot and attach usage only where the normalized-name match is unambiguous. Store `distance_m`, `match_method`, `match_confidence`, and both original names. The Ars location hierarchy and known coordinate outliers must be cleaned before proximity calculations.

### Suitable hackathon uses

- A dated “public Wi-Fi locations recorded in 2022” layer around festival venues.
- A historical digital-city story comparing the first half of 2022 across landmarks.
- A prototype showing how a current connectivity feed could complement venue information.

### Do not use it for

- Current Wi-Fi availability, performance, crowd density, queueing, safety, or network-capacity decisions.
- Comparing raw monthly blanks as zeros or treating client counts as unique visitors.

## Preparation recipe

1. Acquire the 2022 location and usage CSVs, record hashes/retrieval time, and ignore the 2011 file unless doing history.
2. Parse UTF-8, convert German decimal commas, validate WGS84 ranges, and normalize address/name comparison keys.
3. Join usage to locations conservatively on normalized names; retain unmatched rows, blanks, source names, and confidence.
4. Spatially match locations to cleaned festival venues and publish a cached snapshot with `source_year: 2022` and a prominent historical-data warning.

## Decision rationale

The landmark overlap and direct WGS84 geometry make this easy to demonstrate, supporting the older technical recommendation. However, four-year-old locations and seven months of historical usage have limited operational value. The portfolio decision therefore remains **OPTIONAL**: useful visual context when labelled honestly, but not a 2026 service or crowd layer.

## Sources

- [Official locations catalog](https://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2)
- [Official usage catalog](https://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673)
- [Official 2022 locations CSV](https://data.linz.gv.at/katalog/Freizeit/hotspot/Hotspot_Geodaten_2022.csv)
- [Official 2022 usage CSV](https://data.linz.gv.at/katalog/Freizeit/hotspot/Hotspot-Auswertung_2022-HJ1.csv)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/hotspots.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
