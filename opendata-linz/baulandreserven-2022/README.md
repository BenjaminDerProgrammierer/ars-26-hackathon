# Baulandreserven 2022

> **Final verdict: OPTIONAL, WITH PREPARATION.** The publisher corrected the
> stale 2012 links. The complete 2022 Shapefile is now publicly downloadable,
> but the layer is dated and has limited direct festival value.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Baulandreserven 2022 (Linz)](https://www.data.gv.at/katalog/datasets/f48d3329-fc06-4d84-86e8-e73946425e31) |
| Data access | Public 2022 directory with `Baulandreserven.shp`, `.shx`, `.dbf`, `.prj`, and `.cpg` |
| Format | ESRI Shapefile polygon layer; separate component downloads |
| CRS | MGI / Austria GK Central (EPSG:31255), declared by `.prj` |
| License | CC BY 4.0 |
| Coverage | Undeveloped or only minimally built-on designated building-land parcels in Linz |
| Data vintage | 2022; do not present as current land availability in 2026 |
| Last verified | 2026-07-15; catalog links point to 2022 and the complete component set is publicly reachable |

## Contents and technical characteristics

The catalog documents the attributes `HAUPTKAPIT`, `THEMA`, `THEMENGRUP`, and
`UNTERKAPIT`. The catalog directly lists `.shp`, `.shx`, `.dbf`, and `.cpg`
resources; the matching `.prj` is available in the same public directory even
though it is not currently a catalog distribution. The `.prj` declares
EPSG:31255.

Issue [#9](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/9)
originally identified a 2022-to-2012 link mismatch. The live catalog record was
modified on 2026-07-15 and all listed data links now use the 2022 directory.

## Using it with the Ars Electronica dataset

Reproject the polygons from EPSG:31255 to EPSG:4326 and spatially relate them to
cleaned festival venue coordinates. Keep the source year on every derived
record. Suitable uses are exploratory land-use context or speculative urban
storytelling; the layer is not suitable for planning, property, investment, or
current-availability claims.

## Preparation recipe

1. Download the five matching Shapefile components and record retrieval date and checksums.
2. Inspect feature count, geometry validity, attribute values, and any stable identifier.
3. Reproject from EPSG:31255 to EPSG:4326 and validate sample polygons against Linz.
4. Publish a dated GeoJSON extract with CC BY 4.0 attribution and a visible 2022-vintage label.

## Decision rationale

The access and resource-year defect is fixed, so exclusion is no longer
necessary. The layer remains **OPTIONAL** because its subject is niche for the
festival and land availability is time-sensitive.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/f48d3329-fc06-4d84-86e8-e73946425e31)
- [Corrected 2022 directory](https://data.linz.gv.at/katalog/geodata/baulandreserven/2022/)
- [Issue #9](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/9)
