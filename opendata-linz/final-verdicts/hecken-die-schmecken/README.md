# Hecken die Schmecken

> **Final verdict: OPTIONAL GARNISH.** This tiny edible-hedge list can add a playful stop to a festival walk, but it should not be offered as a primary dataset. Locations require manual verification, and the only reviewed vintage is 2022.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Hecken die Schmecken – Standorte von Beerensträuchern](https://www.data.gv.at/katalog/datasets/d587eab4-6c96-4d48-978d-2d5d12c57f15) |
| Data access | [Hecken die schmecken 2022.csv](https://data.linz.gv.at/katalog/umwelt/hecken/Hecken%20die%20schmecken%202022.csv) |
| Format | Single UTF-8 CSV with three text columns |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | 26 named hedge locations in Linz parks and streets; no coordinates |
| Data vintage | 2022; catalog metadata promises annual updates, but the reviewed catalog exposed no newer file |
| Last verified | 2026-07-15: direct CSV fetch did not complete; contents and accessibility observations below are dated 2026-07-13 |

## What the dataset contains

The source review observed 26 rows and three columns. Each row names a place such as Volksgarten, Pulvermühlpark, Unipark, Freinberg, Pöstlingberg, or Bindermichlpark, provides free-text location detail, and identifies a berry species. Species include currants (`Ribisel`), raspberries (`Himbeeren`), blackberries (`Brombeeren`), jostaberries (`Josta`), gooseberries (`Stachelbeeren`), Japanese wineberries, and cornelian cherries (`Dirndl`).

The catalog gives indicative harvest periods: June for currants and jostaberries, July for Japanese wineberries, and September for blackberries. These are general notes, not observations that fruit is present at a specific hedge.

### Key fields and identifiers

| Field | Meaning and integration relevance |
|---|---|
| `Standort` | Named park, street, or area; the starting point for manual geocoding |
| `Beschreibung` | Free-text placement detail; retain it to disambiguate the named place |
| `Art` | Berry species or planting description, in German |
| Row identity | No stable ID was observed; create a local key from normalized location plus species and retain the source row |

## Access and technical characteristics

The catalog lists a single UTF-8 CSV. No WGS84 or projected coordinates are supplied; the official description explicitly says precise coordinates cannot currently be provided. Consequently, the data is not map-ready even though it describes locations.

Geocode all 26 rows against `Standort` plus `Beschreibung`, then manually inspect the results. A park centroid is not necessarily the hedge position. Store the chosen coordinate, match method, confidence, verification date, and original German text separately so inferred geometry is never confused with publisher-provided geometry.

## Data quality and limitations

- The file is from 2022, four years before the 2026 festival; plantings may have moved, failed, or changed.
- The publisher says variety information can change more often than the dataset and must be treated with reservation.
- There are no coordinates or authoritative point geometries.
- Harvest month is approximate and affected by weather and maintenance.
- The dataset is not food-safety guidance. Do not promise edibility, ripeness, allergen safety, pesticide status, or permission to harvest.
- The 2026-07-15 fetch failure does not prove the official file is permanently offline; it means the 2026-07-13 observations were not rechecked.

## Using it with the Ars Electronica dataset

### Join strategy

After manual geocoding, compare verified hedge points with cleaned Ars venue coordinates in WGS84 / EPSG:4326. Use a walking-network route if available; straight-line proximity alone can place a hedge across a river or inaccessible boundary. Keep the festival's venue coordinates as the authoritative festival side and label hedge geometry as derived.

### Suitable hackathon uses

- An optional “green snack detour” layer between events.
- A small urban-nature story about edible planting in public space.
- A September-themed blackberry filter, clearly labeled as approximate historical context.

### Do not use it for

- Current availability or food-safety claims.
- Routing users to an unverified coordinate or guaranteeing access.
- A standalone city-nature analysis; 26 rows are too narrow for that role.

## Preparation recipe

1. Acquire the CSV, record its 2022 vintage, checksum, license, and retrieval date.
2. Parse as UTF-8 CSV, trim text, preserve German labels, and create a deterministic local row key.
3. Geocode `Standort` with `Beschreibung`, then manually verify every point and record confidence and provenance.
4. Package a small WGS84 GeoJSON/CSV snapshot with `source_vintage=2022`, `geometry_source=derived`, and a visible safety disclaimer.
5. Use the provider's invitation for data requests to ask whether a newer,
   geocoded inventory exists. Do not delay the core bundle if it does not.

## Decision rationale

The final portfolio decision remains **OPTIONAL GARNISH**. Rainer's 2026-07-13 review called it “Borderline”: its concept is memorable and September blackberries align playfully with festival week, but the source is tiny, stale, ungeocoded, and explicitly uncertain about varieties. Those constraints are acceptable for a clearly labeled experimental side layer, not for the default bundle or any operational food guide.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/d587eab4-6c96-4d48-978d-2d5d12c57f15)
- [Official 2022 CSV](https://data.linz.gv.at/katalog/umwelt/hecken/Hecken%20die%20schmecken%202022.csv)
- [Hands-on source review](../../2026-07-13-reviews-rainer/hecken-die-schmecken.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
