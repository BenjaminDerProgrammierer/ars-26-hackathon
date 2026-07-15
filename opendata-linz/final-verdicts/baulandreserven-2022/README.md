# Baulandreserven 2022

> **Final verdict: DO NOT USE until the catalog resource year is fixed.** The record is advertised as 2022, but its sole distribution URL names and serves the 2012 path. That unresolved ten-year vintage conflict makes the layer unsafe for the curated hackathon bundle.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Baulandreserven 2022 (Linz)](https://www.data.gv.at/katalog/datasets/f48d3329-fc06-4d84-86e8-e73946425e31) |
| Data access | The only cataloged resource is the disputed [`2012/Baulandreserven.shp`](https://data.linz.gv.at/katalog/geodata/baulandreserven/2012/Baulandreserven.shp); do not treat it as 2022 data |
| Format | Catalog says SHP; only one `.shp` URL is listed, with no separately cataloged sidecar components |
| License | Not independently reverified from the official catalog on 2026-07-15; confirm before any reassessment |
| Coverage | Intended to represent undeveloped or only minimally built-on designated building-land parcels in Linz |
| Data vintage | **Unresolved:** catalog title says 2022; distribution path says 2012 |
| Last verified | 2026-07-15: direct automated access could not be completed; the 2026-07-13 catalog audit still showed the single 2012-path resource |

## What the dataset contains

The catalog description defines *Baulandreserven* as undeveloped building-land parcels, including parcels with only subordinate construction such as a garden shed. This would normally imply polygon features suitable for land-use context. No hands-on feature or schema review exists for this candidate, however, because the source identity is already contradictory.

### Key fields and identifiers

No field names or stable feature identifier have been verified. Do not infer a parcel number, zoning category, geometry CRS, or observation year from the title. Those facts must come from a corrected, complete distribution and its metadata.

## Access and technical characteristics

The 2026-07-13 full-catalog audit recorded one SHP resource at a URL containing `/baulandreserven/2012/Baulandreserven.shp`. A distinct 2012 catalog record also exists, strengthening the risk that this is the older file rather than a harmless folder name. The 2022 record was published on 2022-12-15 and catalog-updated on 2023-02-02, but metadata dates do not prove the vintage of the geometry.

A Shapefile is a multi-file format. A usable package normally needs at least `.shp`, `.shx`, and `.dbf`, with `.prj` needed to declare the CRS and often `.cpg` for encoding. The catalog exposes only one `.shp` URL. Until the publisher supplies or confirms the complete component set, consumers cannot safely assume attribute availability, text encoding, or coordinate interpretation.

## Data quality and limitations

- The title-to-resource-year mismatch is a source defect, not a documentation issue.
- No geometry type, row count, fields, stable ID, CRS, or axis order has been verified.
- A lone `.shp` URL may be insufficient for normal Shapefile tooling if the associated files are not discoverable.
- The direct resource check on 2026-07-15 failed before the file could be inspected. This is not proof of permanent unavailability; it leaves the 2026-07-13 catalog observation unrechecked.
- Land availability is time-sensitive. Even a technically readable 2012 layer should not be represented as the 2022 state or as current in 2026.

## Using it with the Ars Electronica dataset

### Join strategy

There is no safe join strategy while the CRS and vintage remain unknown. If the publisher corrects the record, reproject the verified parcel polygons to WGS84 / EPSG:4326 and perform a spatial intersection or distance join against cleaned festival venue points. Keep the source year on every derived record and correct or exclude known festival coordinate outliers first.

### Suitable hackathon uses

- None in the default bundle under the current evidence.
- After correction only: exploratory urban-development context around venues, clearly dated to the source year.

### Do not use it for

- Claims about land that was available in 2022 or remains available in 2026.
- Planning, property, investment, or regulatory decisions.
- Any map that silently interprets projected coordinates as latitude/longitude.

## Preparation recipe

1. Wait for the publisher to confirm the actual observation year and replace or relabel the distribution.
2. Obtain a complete Shapefile package and verify `.shp`, `.shx`, `.dbf`, `.prj`, and encoding information.
3. Inspect fields, feature count, geometry validity, stable identifiers, CRS, and source vintage; record a checksum and retrieval date.
4. Only then reproject to EPSG:4326, join to cleaned venue points, and label the vintage visibly.

## Decision rationale

The portfolio decision remains **DO NOT USE**. Potential thematic value does not outweigh the risk of presenting a decade-old layer under a 2022 title, and no verified schema or CRS is available to mitigate that risk. The publisher correction is tracked in [issue #9](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/9). Reassess when the official record identifies the real vintage and offers a complete, inspectable distribution.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/f48d3329-fc06-4d84-86e8-e73946425e31)
- [Disputed official resource URL](https://data.linz.gv.at/katalog/geodata/baulandreserven/2012/Baulandreserven.shp)
- [Publisher-fix tracking issue](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/9)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
