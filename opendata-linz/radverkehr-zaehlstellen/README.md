# Radverkehr-Zählstellen und Messwerte

> **Provisional verdict: USE WITH PREPARATION after license confirmation.** This
> is the strongest source added since the original catalog review, but it should
> not enter the redistributable hackathon bundle until official metadata and
> licensing are attached to the new files.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz publisher directory; a central catalog record was not discoverable on review |
| Data access | [Official directory](https://data.linz.gv.at/katalog/verkehr/radverkehr/) |
| Files | Hourly measurements CSV, counter CSV, and counter GeoJSON |
| Format | Semicolon CSV and WGS84 Point GeoJSON |
| License | **Not established for these newly published files; confirm before redistribution** |
| Coverage | 15 directional counter IDs at 8 unique coordinate pairs |
| Data vintage | Complete hourly timestamp grid from 2024-01-01 through 2025-12-31 |
| Last verified | 2026-07-16; all three payloads downloaded and profiled |

## What the dataset contains

`StadtLinz_Radverkehr_Messwerte.csv` contains 263,160 station-hour rows with
three fields:

| Field | Meaning |
|---|---|
| `Zaehlstelle` | Directional counter ID and foreign key to station `ID` |
| `Zaehlstunde` | Naive hourly timestamp such as `2025-12-31 23:00:00`; timezone/DST semantics are not documented |
| `Anzahl pro Stunde` | Bicycle count for the hour; 1,674 cells are blank and their publisher-defined meaning is not documented |

The station CSV contains `ID`, human-readable name and placement, WGS84 latitude
and longitude, measurement method, commissioning month, and mode. The GeoJSON
contains equivalent point geometry and properties. Several directional counter
IDs share coordinates, but the files provide no explicit physical-site ID.

## Observed quality

- All 15 station IDs occur in the measurements, and every measurement ID resolves.
- There are no duplicate `(Zaehlstelle, Zaehlstunde)` pairs.
- The file contains every nominal hour across 2024 and 2025 for every counter,
  including leap day; 1,674 cells have a blank count.
- Nonblank values range from 0 to 1,166 per counter-hour. Range checks alone do
  not establish sensor correctness.
- The 15 counter IDs collapse to 8 unique coordinates, so map symbols need
  grouping or directional display to avoid overplotting. Confirm site
  relationships before treating shared coordinates as one physical counter.
- The CSVs are ASCII-compatible UTF-8, semicolon-delimited, and have stable row widths.
- Timestamps have no UTC offset. Ask the publisher how the repeated/skipped hour
  at daylight-saving transitions is represented before time-series aggregation.

## Using it with the Ars Electronica dataset

There is no shared ID. Spatially join cleaned festival venue points to the eight
counter sites, retaining distance and a defensible maximum radius. Join festival
calendar datetimes only to derived historical profiles—such as September,
weekday, and hour-of-day—not to the source year as if it were 2026 observation.

Suitable prototypes include:

- a typical cycling pulse around nearby festival venues;
- bridge and corridor flow by direction, weekday, season, and hour;
- a mobility dashboard that overlays festival calendar density and historical
  cycling patterns with a prominent “2024–2025 baseline” label;
- quality-aware visualizations that show missing sensor periods rather than
  silently interpolating them.

Do not use this source for live 2026 counts, route safety, cyclist demographics,
travel-time prediction, or causal claims about festival attendance.

## Preparation recipe

1. Obtain and record the official license, attribution, timezone, update cadence,
   sensor methodology, and missing-value definition.
2. Snapshot all three files with retrieval time and checksums.
3. Parse semicolon CSV, validate the station foreign key and compound key, and
   preserve blank counts as null.
4. Create a physical-site key from coordinates only after checking that grouped
   directional counters genuinely represent one site.
5. Precompute transparent hourly/daily summaries and missingness metrics; retain
   raw counts for reproducibility.
6. Clean Ars venue coordinates before nearest-site joins and publish the chosen
   distance threshold.

## Decision rationale

The source is small enough for a weekend, spatially ready, temporally rich, and
strongly connected to visitor mobility. It would merit **USE WITH PREPARATION**
on technical grounds. Missing source metadata and license are release blockers,
not reasons to discard the candidate.

## Sources

- [Official publisher directory](https://data.linz.gv.at/katalog/verkehr/radverkehr/)
- [Hourly measurements](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Messwerte.csv)
- [Counter CSV](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Zaehlstellen.csv)
- [Counter GeoJSON](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Zaehlstellen.geojson)
- [Catalog delta review](../archive/2026-07-16-catalog-delta-usability.md)
