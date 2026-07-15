# Kurzparkzonen

> **Final verdict: OPTIONAL.** Include only for a concrete driving/parking prototype and only after organizer-side conversion. The 2022 geometry and free-text rules must not be presented as current tariffs or enforcement information.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Bürger*innen-Angelegenheiten (BA) |
| Catalog | [Kurzparkzonen Standorte 2022](https://www.data.gv.at/katalog/datasets/bb992195-d827-48d4-a676-f3d680840a1c) |
| Data access | Multipart files under the [official 2022 directory](https://data.linz.gv.at/katalog/geodata/kurzparkzonen/2022/); for example, the [90-minute area `.shp`](https://data.linz.gv.at/katalog/geodata/kurzparkzonen/2022/Kurzparkzone_90min_Area_20220621.shp) |
| Format | Five ESRI Shapefile layers; each requires `.shp`, `.dbf`, `.shx`, `.prj`, and `.cpg` |
| License | CC BY 4.0; catalog attribution: Stadt Linz / `data.linz.gv.at` |
| Coverage | Central-Linz 30-, 90-, and 180-minute zones plus fee-zone boundaries |
| Data vintage | 2022-06-21; catalog metadata from 2022/2023 |
| Last verified | 2026-07-15; current official catalog evidence and dated local review checked. Publisher files were not re-fetched because `data.linz.gv.at` DNS resolution was blocked. |

## What the dataset contains

The distribution is a five-layer GIS bundle: a 30-minute layer, separate line and area representations for the 90-minute zone, a 180-minute layer, and `Kurzparkzone_Grenze` fee-zone boundaries. The source review found small real tables—for example, 11 polyline records in the 30-minute layer and four boundary polygons—covering the central city where many festival venues lie.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `GUID` | City-supplied feature identifier; preserve per source layer. |
| `Zeiten` | German free-text applicability hours, such as weekday/Saturday ranges. |
| `Parkdauer` | Published duration label such as `30 min`; parse cautiously and retain the original. |
| Layer name | Encodes duration and whether geometry is an area, line, or fee boundary; retain as `source_layer`. |
| Geometry | Lines or polygons in MGI Austria GK Central / EPSG:31255. |

## Access and technical characteristics

Each layer is a multipart Shapefile. The official catalog exposes `.shp` geometry, `.dbf` attributes, `.shx` index, `.prj` CRS, and `.cpg` encoding components. Download all components with the same basename; do not treat a catalog `.shp` link as the complete dataset. The catalog declares geographic extent in EPSG:31255, and the 2026-07-13 review read MGI Austria GK Central from the projection information and verified that reprojection placed sample geometry near 14.286 E, 48.30 N.

Convert from EPSG:31255 to EPSG:4326 and force conventional GeoJSON `[longitude, latitude]` order. Keep the five layers separate through validation because line and area layers have different spatial semantics. For a venue lookup, prefer polygon containment against area/boundary layers; distance to a line is not equivalent to being governed by a parking rule.

## Data quality and limitations

- Geometry and rule text are dated 2022-06-21. Hours, durations, fees, exceptions, signs, and enforcement can change independently.
- `Zeiten` is German free text, not a legal or fully machine-readable schedule. Holidays and special exceptions are not established by this file.
- The five layers mix lines and polygons. Treating every geometry as a zone polygon will produce false containment results.
- Shapefile-only delivery imposes component management, conversion, CRS, and encoding work.
- Publisher-file access was not rechecked on 2026-07-15; schema and sample results are dated 2026-07-13 observations.

## Using it with the Ars Electronica dataset

### Join strategy

Clean and validate festival venue coordinates, reproject all parking layers to a common local analysis CRS or WGS84, then test venues against the area and boundary polygons. For line layers, report only distance to the published line. If comparing `Zeiten` with festival calendar rows, retain the German source text and mark any parsed schedule as an interpretation. Calendar IDs are not reliable row keys, so use cleaned canonical calendar records.

### Suitable hackathon uses

- A dated “parking rules recorded near this venue in 2022” prototype.
- A visual comparison of festival venues with central fee-zone boundaries.
- Demonstrating organizer-side GIS normalization alongside stronger transit data.

### Do not use it for

- Current tariffs, legal advice, parking availability, enforcement, or a guarantee that an event fits within a permitted duration.
- Point-in-polygon calculations on line-only geometry.

## Preparation recipe

1. Download all five layers and, for every basename, retain `.shp`, `.dbf`, `.shx`, `.prj`, and `.cpg`; record hashes and missing components.
2. Read the declared MGI Austria GK Central CRS, reproject EPSG:31255 to EPSG:4326, and validate sample coordinates in central Linz.
3. Preserve `GUID`, `Zeiten`, `Parkdauer`, geometry type, and source layer; validate polygons and keep line semantics explicit.
4. Join to cleaned venue/calendar records and publish a dated GeoJSON bundle with a non-authoritative rule warning.

## Decision rationale

The geometry is real, compact, and spatially joinable, matching the older borderline technical assessment. Its thematic value is secondary to transit and visitor-service layers, and the 2022 free-text rules cannot answer current legal questions. The portfolio decision therefore remains **OPTIONAL** and organizer-prepared, not a default hackathon source.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/bb992195-d827-48d4-a676-f3d680840a1c)
- [Official 90-minute area `.shp`](https://data.linz.gv.at/katalog/geodata/kurzparkzonen/2022/Kurzparkzone_90min_Area_20220621.shp)
- [Hands-on source review](../../2026-07-13-reviews-rainer/kurzparkzonen.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
