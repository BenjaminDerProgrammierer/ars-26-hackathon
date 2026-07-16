# Linz Open Data catalog delta and remaining-candidate usability

Review date: 2026-07-16

## Outcome

The publisher directory crawl found one high-value new source and one material
refresh that were not reflected in the existing portfolio:

- **Cycling counts are the strongest new candidate.** The newly published
  hourly measurements and counter locations are compact, well structured, and
  directly useful for mobility stories around festival venues. Hold them out of
  the redistributable bundle until the publisher supplies or confirms dataset
  metadata, license, and update policy.
- **The 3D city model has an indexed 2025 edition.** Prefer it over the documented
  2022 edition, but repair the tile-index URLs during preparation: all 834 rows
  in the 2025 `Uebersicht.csv` incorrectly point into `/2022/`.

No other remaining candidate should displace the current core portfolio. The
best optional addition is a prepared **2025 neighborhood statistics pack** made
from population, one-year age counts, and statistical-district geometry.

## Method and scope

The review combined three sources of evidence:

1. the prior 820-record data.gv.at inventory and its A/B candidate ratings;
2. a recursive crawl of directory indexes below
   [`https://data.linz.gv.at/katalog/`](https://data.linz.gv.at/katalog/) on
   2026-07-16, without bulk-downloading data payloads;
3. hands-on samples of the new cycling files, 2025 population tables, the 2025
   3D index, the rolling tree inventory, childcare points, construction totals,
   and 2023/2024 parking-machine DBFs.

The crawl deliberately stopped descending through the very large 3D texture
hierarchy after establishing the 2025 edition's structure. Directory
modification timestamps indicate publication activity, not necessarily the
observation date inside a dataset.

The former data.gv.at CKAN route used in older research returned HTTP 404 during
this review. For freshness decisions, the publisher directory and payload
contents therefore take precedence over stale central-catalog metadata.

## Highest-priority new candidate

### Cycling counter locations and hourly measurements

**Recommendation: USE WITH PREPARATION after license and metadata confirmation.**

The publisher added three files on 2026-07-15:

- [`StadtLinz_Radverkehr_Messwerte.csv`](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Messwerte.csv)
- [`StadtLinz_Radverkehr_Zaehlstellen.csv`](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Zaehlstellen.csv)
- [`StadtLinz_Radverkehr_Zaehlstellen.geojson`](https://data.linz.gv.at/katalog/verkehr/radverkehr/StadtLinz_Radverkehr_Zaehlstellen.geojson)

Observed characteristics:

| Check | Result |
|---|---|
| Measurements | 263,160 station-hour rows |
| Time range | 2024-01-01 00:00 through 2025-12-31 23:00 |
| Counter records | 15 directional counters at 8 unique coordinates |
| Join quality | Every measurement station ID resolves; every counter has measurements |
| Key quality | No duplicate station/hour pairs |
| Blank readings | 1,674 blank counts; preserve as null pending publisher clarification, never assume zero |
| Count range | 0 to 1,166 bicycles per station-hour among nonblank readings |
| Spatial format | WGS84 CSV and valid Point GeoJSON |
| Size | About 9.2 MiB for measurements; small station files |

The strongest festival uses are a venue-nearby cycling pulse, typical September
hour/day profiles, bridge-flow storytelling, and comparisons with event times.
The source is historical, not live: it cannot describe cycling conditions during
the September 2026 festival. Several directional counter IDs share coordinates;
aggregate them into sites only after the publisher or another authoritative
source confirms those relationships. See the
[dedicated verdict](../radverkehr-zaehlstellen/).

## Remaining unincorporated candidates

These verdicts cover the strongest previously unincorporated A/B candidates and
fresh directories discovered by the crawl. The other catalog records remain
below the threshold established in the full 820-record review.

| Candidate | Evidence | Hackathon usability | Verdict |
|---|---|---|---|
| 2025 neighborhood statistics pack | `Hauptwohnsitzbevoelkerung` has 16 populated district rows plus 177 blank/presentation rows; `Altersschichtung` has 16 rows and 100 one-year age columns; WGS84 district GML is available | Strong civic map and venue-neighborhood context; stable `StatBezirkNr` join, but CP1252 decoding, blank-row filtering, boundary provenance, and disclosure controls need preparation | **USE WITH PREPARATION** as one curated pack, not many raw files |
| Statistical district geometry | 16 districts, WGS84 and EPSG:31255 GML; geometry dates from the 2014 boundary system | Essential helper for district statistics, but not interesting alone | **USE WITH PREPARATION** inside the neighborhood pack |
| Solar and green-roof potential | Complete four-part Shapefile; roughly 22 MiB geometry and 111 MiB DBF, dated 2022 | Visually strong with 3D buildings and venues, but heavy conversion and old potential assumptions make this organizer-scale | **OPTIONAL / PREPARED SHOWCASE** |
| Council transcripts | Plain-text annual corpus through 2026; already has a dedicated reassessment page | Excellent cited semantic search and civic-memory material, but political neutrality and scope remain stakeholder decisions | **REASSESS**, unchanged |
| 2025 city-map raster | Color and grayscale TIFF/TFW pairs, about 399 MiB per TIFF | Current-looking basemap but no joinable records, web tiling required, and better web basemaps exist | **DO NOT USE** in the bundle |
| Childcare locations | 81 kindergarten rows in the sampled file; WGS84 coordinates and addresses, but all three source files are timestamped 2016-05-02 | Technically easy, operationally too stale for family-service guidance in 2026 | **DO NOT USE** unless replaced with current data |
| Open construction projects | The 2025 CSV contains five aggregate rows such as project and dwelling totals; no project IDs, addresses, dates, or geometry | Supports a tiny annual trend chart, not a city-change map or venue join | **DO NOT USE**; downgrade the earlier shortlist interpretation |
| Road-injury and fire-service series | Small citywide annual/category totals updated through 2024 | Easy civic dashboards, but no event-level place/time join and weak festival connection | **OPTIONAL**, outside the festival bundle |
| Public-order incidents | Four small aggregate snapshots, including 2026 files, with category totals | Current civic trend material but no incident locations and sensitive interpretation | **OPTIONAL**, with neutral labels and denominator caveats |
| 2025 doctors and senior-home tables | Very small annual CSVs appeared in current directories | Potential service-directory use, but weak festival join and operational-freshness risk; not payload-profiled deeply enough for inclusion | **DO NOT USE BY DEFAULT** |
| 2025 building/housing statistics | Small district-level annual tables for building use, period, ownership, floors, and dwelling characteristics | Useful supporting indicators once normalized, but weaker and more interpretively complex than population/age | **OPTIONAL** extension to the neighborhood pack |
| Subsidies 2021 | PDF/external download; stale for a 2026 event | Possible finance explainer, substantial extraction/context work, no festival join | **DO NOT USE** |
| LINZ AG electricity generation | External LINZ AG service rather than a publisher-hosted payload | Interesting live-energy direction, but access terms, schema, and reliability need a separate LINZ AG audit | **REQUEST/AUDIT FIRST** |

## Freshness corrections to incorporated pages

### 3D city model

The directory now contains `2020/`, `2022/`, and `2025/`. The 2025 index has 834
rows: 506 terrain (`H_*`) and 328 building (`M_*`) tiles. Direct 2025 tile
folders contain GML, DXF, and image directories.
However, every `folder`, `gml`, `dxf`, and `jpg` URL in the 2025 index retains a
`/2022/` path. A prepared importer should replace only that path segment with
`/2025/`, then verify each selected resource before conversion. The newer
edition improves recency but does not remove the CRS, texture, file-size, or
visual-QA requirements.

### Parking-ticket machines

The complete 2024 Shapefile is verified at the publisher. Its DBF declares 251
records and a 2024-02-07 update date, compared with 269 records in the 2023 DBF.
The DBF record width is unchanged. This is a genuine newer edition, but it does not
change the **DO NOT USE** portfolio verdict because the layer still represents
machines, not availability, tariffs, legal rules, or accessible parking.

### Tree inventory

The rolling CSV was successfully fetched on 2026-07-16 and still contains 27,004
records with `DatumExport=20260701`. Its 15-column header matches the prior
review; the expected Wikidata genus field is still absent. `BaumNr` is not a
unique key, and even `(Flaeche, BaumNr)` has two collisions; the current
four-field combination `(Flaeche, BaumNr, lon, lat)` is unique but must be
revalidated for every snapshot. The existing **USE** verdict and data vintage
remain correct.

### Election data

The publisher directory confirms machine-readable 2025 Linz mayoral-election
results for the first and runoff ballots, plus a matching five-part 2025 precinct
Shapefile. This strengthens the existing optional election track but does not
remove its year-specific join and neutral-interpretation requirements.

### Other incorporated sources

The crawl did not establish a newer edition for the 2022 accessible-parking,
defibrillator, hotspot, short-term-parking, hedge, or dog-zone snapshots; the
2023 drinking-fountain/WC era; the 2024 tourism series; or the 2025 LINZ AG
network. Rolling Linztermine and air-quality endpoints require request-time
monitoring rather than directory-year comparison.

## Recommended organizer actions

1. Ask Stadt Linz to publish catalog metadata, CC BY attribution text, update
   cadence, timezone semantics, and missing-value meaning for the cycling files.
2. Prepare a small cycling example that joins `Zaehlstelle` to `ID`, preserves
   blanks, and aggregates directional pairs only when explicitly requested.
3. Prepare the 2025 population/age/district pack with UTF-8 output, blank-row
   removal, stable district IDs, and a boundary-vintage note.
4. Update the 3D preparation pipeline to 2025 and patch its stale index paths;
   report the broken index to the publisher.
5. Do not promote childcare or construction-project ideas from title/description
   review without newer or more granular source data.
