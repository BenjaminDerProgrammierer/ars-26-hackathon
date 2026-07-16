# Linz Open Data usability for the Ars Electronica Hackathon

Review date: 2026-07-16

## Executive verdict

Linz Open Data is highly usable for the hackathon when offered as a curated,
prepared portfolio rather than as the raw city catalog. The strongest sources
join to the festival through venue coordinates, addresses, dates, organizers,
countries, or categories. Several otherwise interesting sources remain optional
because they are stale, aggregated, operationally sensitive, technically heavy,
or weakly connected to the festival program.

The principal change since the 2026-07-13 review is a newly published cycling
dataset with 2024–2025 hourly counts. It is technically one of the best sources
in the catalog, but its license and metadata must be confirmed before it enters
a redistributable bundle. The publisher directory also contains an indexed 2025
edition of the 3D city model, newer 2024 parking-machine geometry, and 2025
mayoral-election data with matching precinct boundaries.

## Evidence and scope

This report consolidates:

1. the complete 820-record data.gv.at inventory;
2. hands-on payload reviews of the strongest candidates;
3. festival export analysis and join-quality constraints;
4. live endpoint and publisher follow-up checks from 2026-07-15;
5. a 2026-07-16 recursive crawl of directory indexes below
   [`https://data.linz.gv.at/katalog/`](https://data.linz.gv.at/katalog/);
6. payload profiling of cycling counts, the 2025 3D index, population and age
   tables, childcare points, construction totals, trees, and parking DBFs.

The directory crawl retrieved indexes rather than bulk-downloading the many
large GIS, imagery, and 3D payloads. It stopped descending through the very large
3D texture hierarchy after confirming the indexed structure and representative
tile listings. Directory timestamps indicate publication activity, not
necessarily the date represented by the data.

## Decision meanings

| Decision | Meaning |
|---|---|
| **USE** | Include in the default bundle after light normalization. |
| **USE WITH PREPARATION** | Include only after the organizer supplies a converted snapshot, helper, proxy, or fallback. |
| **OPTIONAL** | Offer as a clearly secondary or experimental source. |
| **DO NOT USE** | Exclude until its stated defect is fixed or the use case changes. |
| **REQUEST / REASSESS** | A license, source, stakeholder decision, or deeper audit is still required. |

## Current curated portfolio

| Dataset | Decision | Hackathon role and main qualification |
|---|---|---|
| [Baumkataster](baumkataster/) | **USE** | Current WGS84 urban-tree inventory for venue proximity, biodiversity, and approximate crown-context projects. `BaumNr` is not unique; generate a snapshot key. |
| [Linztermine events](linztermine-veranstaltungen/) | **USE** | City events during the festival window; join through the companion location, organizer, and tag feeds. |
| [Linztermine locations](linztermine-orte/) | **USE** | Venue IDs and addresses for joining city and festival events. |
| [Linztermine organizers](linztermine-veranstalterinnen/) | **USE** | Organizer identity bridge, including Ars Electronica organizer ID 7. |
| [Street names and meanings](strassennamen/) | **USE** | Compact Wikidata-linked storytelling source joined through venue addresses. |
| [Guest origin countries](herkunftslaender-gaeste/) | **USE** | 2024 tourism country totals joinable to festival contacts' countries; use only as aggregate context. |
| [Playgrounds and sports facilities](spielplaetze/) | **USE** | Geocoded CSV plus repaired 2023 equipment Shapefile; suitable for family-oriented maps with a visible vintage. |
| [LINZ AG lines and stops](linz-ag-linien-2025/) | **USE WITH PREPARATION** | Static 2025 network geometry; publish converted GeoJSON and do not imply realtime service. |
| [EFA journey planner](efa-fahrplanauskunft/) | **USE WITH PREPARATION** | Live routing/departures require a proxy, examples, request limits, and a fallback. |
| [Historical city maps](historische-stadtplaene/) | **USE WITH PREPARATION** | Pre-tile selected maps for then-and-now interfaces. |
| [3D city model](3d-geodaten-lod2-2022/) | **USE WITH PREPARATION** | Use selected tiles from the indexed 2025 edition and convert them to browser-ready assets; repair and verify stale `/2022/` URLs in its index. |
| [Accessible parking](behindertenstellplaetze/) | **USE WITH PREPARATION** | Reproject the 2022 snapshot and label its age; it does not establish current availability. |
| [Public toilets](wc-anlagen/) | **USE WITH PREPARATION** | Reproject and normalize accessibility/opening-hours attributes; verify current service status. |
| [Drinking fountains](trinkbrunnen/) | **USE WITH PREPARATION** | Reproject EPSG:31255 coordinates and verify the rolling file's current service status. |
| [Air and weather](luftguete-messwerte/) | **USE WITH PREPARATION** | Five working live stations; monitor failures, cache responses, and expose missing stations. |
| [Linztermine tags](linztermine-schlagworte/) | **USE WITH PREPARATION** | Helper taxonomy bundled with Linztermine events, not a standalone track. |
| [Defibrillators](defibrillatoren/) | **OPTIONAL** | Prototype-only 2022 safety layer; never present as operational emergency guidance. |
| [Public Wi-Fi](hotspots/) | **OPTIONAL** | Useful venue-support layer, but locations and usage data are from 2022. |
| [Orthophotos](orthofotos/) | **OPTIONAL** | Strong image-analysis material requiring organizer selection, tiling, storage, and web preparation. |
| [Short-term parking zones](kurzparkzonen/) | **OPTIONAL** | Dated projected polygons requiring multipart Shapefile conversion. |
| [Hecken die Schmecken](hecken-die-schmecken/) | **OPTIONAL** | Small playful 2022 garnish without coordinates. |
| [Dog zones](hundezonen/) | **OPTIONAL** | Repaired but dated EPSG:31255 polygons; avoid current-rule claims. |
| [Baulandreserven 2022](baulandreserven-2022/) | **OPTIONAL** | Complete but dated niche land-use context; not current availability. |
| [Election data](wahldaten/) | **OPTIONAL** | Strong democracy-map material, including 2025 mayoral data, but every election requires matching precinct geometry and neutral interpretation. |
| [Accommodation establishments](beherbergungsbetriebe/) | **DO NOT USE** | Aggregated tourism totals rather than hotel locations. |
| [Parking-ticket machines](parkscheinautomaten/) | **DO NOT USE** | The 2024 layer is technically usable but adds little festival value and does not describe parking availability, tariffs, or legal rules. |
| [Digital city map TMS/WMTS](stadtplan-tms-wmts/) | **DO NOT USE** | Non-standard stale tiles with no joinable records. |
| [Recycling points](altstoffsammelstellen/) | **DO NOT USE** | CSV access requires LINZ AG login and catalog retirement remains pending. |

## Strongest new candidate: cycling counts

### Recommendation

[Cycling counter locations and hourly measurements](radverkehr-zaehlstellen/)
merit **USE WITH PREPARATION after license and metadata confirmation**.

The publisher added three files on 2026-07-15:

- `StadtLinz_Radverkehr_Messwerte.csv`;
- `StadtLinz_Radverkehr_Zaehlstellen.csv`;
- `StadtLinz_Radverkehr_Zaehlstellen.geojson`.

Observed characteristics:

| Check | Result |
|---|---|
| Measurements | 263,160 station-hour rows |
| Time range | 2024-01-01 00:00 through 2025-12-31 23:00 |
| Counters | 15 directional IDs at 8 unique coordinate pairs |
| Join quality | Every measurement ID resolves to a counter; every counter has measurements |
| Key quality | No duplicate station/hour pairs |
| Blank readings | 1,674 cells; preserve as null pending publisher clarification and never assume zero |
| Count range | 0 to 1,166 bicycles per counter-hour among nonblank readings |
| Spatial readiness | WGS84 CSV and valid Point GeoJSON |
| Size | Approximately 9.2 MiB for measurements; small location files |

Suitable uses include historical September cycling profiles near venues, bridge
and corridor flows, and time-of-day comparisons with the festival calendar.
The data is a 2024–2025 baseline, not live 2026 observation. Several directional
IDs share coordinates, but they should only be grouped into physical sites after
the publisher confirms those relationships. Timezone and daylight-saving
semantics are also undocumented.

Release blockers are an explicit license, attribution text, update cadence,
timezone definition, sensor methodology, and the meaning of blank counts.

## Remaining unincorporated candidates

These are the strongest previously unincorporated A/B candidates and fresh
directories. The remaining catalog records stay below the threshold established
by the complete inventory.

| Candidate | Evidence and usability | Verdict |
|---|---|---|
| 2025 neighborhood statistics pack | `Hauptwohnsitzbevoelkerung` has 16 populated district rows plus 177 blank/presentation rows. `Altersschichtung` has 16 rows and 100 one-year age columns. WGS84 district GML supplies geometry. Decode CP1252, filter blank rows, retain `StatBezirkNr`, document the 2014 boundary system, and apply disclosure controls. | **USE WITH PREPARATION** as one curated pack |
| Statistical district geometry | Sixteen districts in WGS84 and EPSG:31255 GML; essential for district statistics but not compelling alone. | **USE WITH PREPARATION** inside the neighborhood pack |
| Solar and green-roof potential | Complete 2022 four-part Shapefile, about 22 MiB geometry plus 111 MiB DBF. Visually strong with 3D buildings and venues, but heavy and assumption-sensitive. | **OPTIONAL / PREPARED SHOWCASE** |
| [Council transcripts](gemeinderatsprotokolle/) | Plain-text corpus through 2026 supports cited semantic search and civic memory; political neutrality, provenance, and stakeholder scope remain decision gates. | **REASSESS** |
| 2025 city-map raster | Color and grayscale TIFF/TFW pairs of about 399 MiB each; requires web tiling and supplies no joinable records. | **DO NOT USE** in the bundle |
| Childcare locations | Geocoded and technically simple, but kindergarten, nursery, and after-school files are timestamped 2016-05-02. | **DO NOT USE** without current replacements |
| Open construction projects | The 2025 CSV has only five aggregate rows and no projects, IDs, addresses, dates, or geometry. | **DO NOT USE**; earlier title-based interpretation was misleading |
| Road-injury and fire-service series | Small citywide annual/category totals through 2024; easy dashboards but no event-level place/time join. | **OPTIONAL**, outside the festival bundle |
| Public-order incidents | Four aggregate snapshots including 2026 category totals; no locations and sensitive interpretation. | **OPTIONAL**, with neutral labels and denominator caveats |
| 2025 doctors and senior homes | Small annual service tables with weak festival joins and operational-freshness risk. | **DO NOT USE BY DEFAULT** |
| 2025 building/housing statistics | Small district-level tables on use, period, ownership, floors, and dwelling characteristics; useful only after normalization. | **OPTIONAL** neighborhood-pack extension |
| Subsidies 2021 | Stale PDF/external source with substantial extraction and context work and no festival join. | **DO NOT USE** |
| LINZ AG electricity generation | External LINZ AG service whose terms, schema, and reliability need a separate audit. | **REQUEST / AUDIT FIRST** |
| Pool occupancy | No open source was found. An anonymous feed or snapshot should be requested from LINZ AG before considering scraping. | **REQUEST DATA** |
| Institutional image archives | Potentially valuable for image-recognition experiments, but no licensed curated source was established. | **DISCOVERY REQUEST** |

## Freshness corrections

### 3D city model

The publisher directory contains `2020/`, `2022/`, and `2025/`. The 2025 index
has 834 rows: 506 terrain (`H_*`) and 328 building (`M_*`) tiles. Direct sampled
tile folders expose GML, DXF, and image directories. Every generated `folder`,
`gml`, `dxf`, and `jpg` URL in the 2025 index still contains `/2022/`; replace
only that segment with `/2025/` for selected tiles and verify each result. The
underlying capture dates are not documented in the inspected index, so “2025
edition” must not be presented as proof that every building was surveyed in 2025.

### Parking-ticket machines

The complete 2024 Shapefile supersedes the 2023 edition. Its DBF declares 251
records and a 2024-02-07 update date, compared with 269 records in the 2023 DBF.
The reason for the difference is undocumented. The newer edition fixes freshness
but does not change the **DO NOT USE** portfolio verdict.

### Tree inventory

The rolling CSV fetched on 2026-07-16 contains 27,004 records with
`DatumExport=20260701`. Its 15-column header still lacks the Wikidata genus field
described by the CSVW metadata. `BaumNr` has only 2,024 distinct values and is
not a record key. `(Flaeche, BaumNr)` still has two collisions. The combination
`(Flaeche, BaumNr, lon, lat)` is unique in this snapshot but must be revalidated
for every export and should not be assumed to provide stable longitudinal
identity.

### Election data

The publisher directory confirms first-ballot and runoff CSVs for the 2025 Linz
mayoral election plus a matching five-part 2025 precinct Shapefile. These files
strengthen the optional democracy track but do not establish stable precinct IDs
or geometry across other elections and years.

### No newer edition established

The crawl did not establish a newer edition for the 2022 accessible-parking,
defibrillator, hotspot, short-term-parking, hedge, or dog-zone snapshots; the
2023 drinking-fountain/WC era; the 2024 tourism series; or the 2025 LINZ AG
network. Rolling Linztermine and air-quality endpoints require request-time
monitoring rather than directory-year comparison.

## Joining city data to the festival export

The festival export must be cleaned before any external join:

- relation fields store bare 32-character hashes while project/contact IDs are
  prefixed; normalize IDs before joining;
- calendar rows are authoritative for event times through `Linked Projects`;
  project `Linked Calendar` values are incomplete;
- parse full event dates from the calendar `Time` display value with the dataset
  helper rather than treating bare `Start Time`/`End Time` values as datetimes;
- correct or exclude known venue-coordinate outliers, parse comma decimals, and
  deduplicate rooms/floors when the analysis intends to compare buildings;
- do not assume location or calendar IDs are present or unique;
- filter test/internal content deliberately and do not treat `Status Web` as a
  public/private flag.

Preferred city-to-festival joins are:

| Join type | Suitable sources |
|---|---|
| Spatial proximity in WGS84 | Trees, cycling counters, transit stops, toilets, fountains, playgrounds, accessibility layers, air stations |
| Address normalization | Street meanings, Linztermine places, selected service directories |
| Shared organizer/entity | Linztermine organizers and events |
| Country normalization | Guest-origin countries and festival contacts |
| Calendar/time profile | Linztermine events, air/weather, EFA, historical cycling profiles |
| District containment | Prepared 2025 population/age pack and optional building/housing indicators |

## Global preparation and safety requirements

Every prepared city output should include source URL, exact source vintage,
retrieval timestamp, checksum, license, attribution, transformation steps, and a
`prototype_only` flag where appropriate.

Operational and safety sources—AEDs, accessibility facilities, parking,
transport, fountains, toilets, and service directories—must never be presented
as guaranteed current truth without request-time confirmation. Aggregate data
must not be rewritten as individual-level behavior, and election/political
material needs neutral language, visible calculations, and source citations.

For projected GIS sources, retain the declared source CRS and transform rather
than relabel coordinates. For multipart Shapefiles, distribute all required
components or a verified converted GeoJSON/GeoPackage. Visually inspect prepared
imagery and 3D assets before release.

## Recommended organizer actions

1. Confirm metadata, CC BY attribution, timezone/DST behavior, missing-value
   meaning, sensor method, and update cadence for the cycling files.
2. Publish a cycling example that preserves blank readings and validates any
   grouping of directional counters.
3. Prepare the 2025 population/age/district pack with UTF-8 output, blank-row
   removal, stable district IDs, and boundary-vintage documentation.
4. Update the 3D preparation pipeline to the indexed 2025 edition, patch its
   stale paths, and report the broken index to Stadt Linz.
5. Generate snapshot-scoped tree record keys and document source identifier
   collisions.
6. Ask LINZ AG for timetable/GTFS or NeTEx data, realtime/service information,
   pool occupancy, and replacement access for recycling-point data.
7. Do not promote childcare or construction-project ideas without newer or more
   granular source data.

## Provenance

- [Final dataset overview](README.md)
- [2026-07-16 catalog delta and remaining-candidate review](archive/2026-07-16-catalog-delta-usability.md)
- [2026-07-13 consolidated report](archive/2026-07-13-linz-open-data-hackathon-usability.md)
- [Complete 820-record inventory](archive/2026-07-13-reviews-benjamin/linz-dataset-review.csv)
- [Hands-on source reviews](archive/2026-07-13-reviews-rainer/)
