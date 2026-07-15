# Parkscheinautomaten

> **Final verdict: DO NOT USE in the curated bundle.** The 2023 point data is real, but the published Shapefile omits its projection definition. Reconsider only after the publisher supplies an authoritative CRS and a team demonstrates a specific need beyond the preferred transit and accessibility layers.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Bürger*innen-Angelegenheiten (BA) |
| Catalog | [Parkscheinautomaten Standorte 2023](https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888) |
| Data access | [Published `.shp`](https://data.linz.gv.at/katalog/geodata/parkscheinautomaten/2023/Parkscheinautomaten_20230623.shp) plus matching `.dbf`, `.shx`, and `.cpg`; no `.prj` distribution |
| Format | ESRI Shapefile point layer; `.cpg` indicates UTF-8 |
| License | CC BY 4.0 |
| Coverage | 269 parking-ticket-machine records in central Linz |
| Data vintage | 2023-06-23; catalog updated 2024-06-10; update cadence `notPlanned` |
| Last verified | 2026-07-15; the official catalog still listed four components and no `.prj`. Publisher files were not re-fetched because `data.linz.gv.at` DNS resolution was blocked. |

## What the dataset contains

The reviewed layer contains 269 point records, one per published parking-ticket machine. Attributes describe the machine number, street address, parking-duration zone, a marker value, optional notes such as NFC card functionality, duplicated X/Y values, and a GUID. The addresses are recognizable central-Linz streets and therefore remain useful evidence even though the geometry cannot be authoritatively transformed.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `PSA` | Parking-machine number; potentially useful for publisher-facing verification. |
| `Standort` | Street address; the safest available bridge to venues because the source CRS is unknown. |
| `Zone` | Published 30/90/180-minute zone classification; stale and not a tariff guarantee. |
| `E` | Observed as `P` throughout the reviewed data; meaning was not documented, so preserve without interpretation. |
| `Anmerkung` | Optional note; about 110 reviewed rows mention `NFC-Kartenfunktion`. |
| `X`, `Y` | Projected numeric coordinates; not longitude/latitude and unusable authoritatively without a CRS. |
| `GUID` | City-supplied feature identifier; retain if the layer is ever repaired. |

## Access and technical characteristics

The official catalog lists `.shp` geometry, `.dbf` attributes, `.shx` index, and `.cpg` encoding. It does **not** list a `.prj` projection definition. Thus this is not a complete self-describing Shapefile for geospatial integration. The source review found point geometry and a bounding box around X 70,146-72,528 and Y 350,580-353,647: clearly projected metres rather than WGS84 degrees. Similarity to other Linz grid data is not sufficient to assign EPSG:31255 or any other CRS.

Do not “fix” the file by guessing a projection until the publisher confirms it. Geocoding `Standort` is safer for a one-off research prototype, but derived coordinates must be labelled separately with geocoder, retrieval date, confidence, and terms. The catalog page checked on 2026-07-15 still displayed only the four components, confirming that the missing `.prj` is a publisher defect rather than a local download omission.

## Data quality and limitations

- Exact CRS and axis order are unknown; raw X/Y and geometry must not be overlaid with festival WGS84 coordinates.
- Data is a static 2023 snapshot with no planned update. Machines, NFC support, zones, and payment rules may have changed.
- A machine point says nothing about parking-space availability, price, current operation, accessible parking, or legal restrictions.
- `E` has no verified meaning in the available evidence.
- The file is technically multipart and inconvenient, while the use case has low value compared with public transport and visitor-service POIs.

## Using it with the Ars Electronica dataset

### Join strategy

No geometry join belongs in the curated bundle until the CRS is confirmed. If a team independently needs the addresses, normalize `Standort` against cleaned venue street addresses or geocode it with explicit provenance, then manually review same-street and nearest results. Never attach guessed source coordinates. Keep `PSA` and `GUID` so a later authoritative publisher update can replace derived geometry.

### Suitable hackathon uses

- None in the default curated bundle.
- After CRS repair, a narrow, dated prototype showing recorded machines near driving-oriented venues.

### Do not use it for

- Current payment options, tariff/enforcement advice, parking availability, accessible-parking guidance, or any raw-coordinate map.

## Preparation recipe

1. Request a corrected `.prj` or written EPSG/axis-order confirmation from Stadt Linz; track the defect in issue #8.
2. Only after confirmation, download `.shp`, `.dbf`, `.shx`, and `.cpg`, attach the authoritative CRS, and validate known addresses spatially.
3. Convert UTF-8 attributes to GeoJSON, preserve `PSA`, `Standort`, `Zone`, `Anmerkung`, and `GUID`, and mark the 2023 vintage.
4. Reassess thematic value before joining to cleaned venue coordinates; otherwise leave the dataset excluded.

## Decision rationale

The older source review recommended address-based use because the 269 records are clean and plausible. The consolidated portfolio applies the stricter curation standard: absent CRS metadata prevents authoritative spatial reuse, the source is static, and the parking-machine use case adds little beside stronger mobility layers. The decision remains **DO NOT USE** until the publisher repairs the CRS and a concrete need justifies preparation.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888)
- [Official `.shp` distribution](https://data.linz.gv.at/katalog/geodata/parkscheinautomaten/2023/Parkscheinautomaten_20230623.shp)
- [Publisher defect issue #8](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/8)
- [Hands-on source review](../../2026-07-13-reviews-rainer/parkscheinautomaten.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
