# Hundezonen

> **Final verdict: OPTIONAL, WITH PREPARATION.** The publisher replaced the
> internal file-share links with a complete public Shapefile. Use it only for a
> clearly dated prototype, not as current legal or operational guidance.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Stadtgrün und Straßenbetreuung (SGS) |
| Catalog | [Hundezonen (Verbotszonen/Freilaufzonen)](https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e) |
| Data access | Public HTTPS downloads for `HUNDEZONEN.shp`, `.shx`, `.dbf`, `.prj`, and `.cpg` |
| Format | ESRI Shapefile polygon layer; UTF-8 attributes |
| CRS | MGI / Austria GK Central (EPSG:31255), declared by `.prj` |
| License | CC BY 4.0 |
| Coverage | Dog zones, dog runs, dog-ban zones, and free-run zones in Linz |
| Data vintage | 2023; metadata modified 2024-06-10 |
| Last verified | 2026-07-15; all five components downloaded successfully from their corrected public URLs |

## Contents and limitations

The catalog describes several dog-related area classes, but the DBF schema and
category vocabulary still need profiling before organizer use. The source is a
2023 snapshot, so boundaries or rules may have changed. A prototype must not
turn these polygons into current legal guidance, access guarantees, or route
advice without confirmation from SGS.

Issue [#4](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/4)
documented internal `file://` URLs. The live catalog record now contains five
public `data.linz.gv.at` URLs, and the complete component set is usable.

## Using it with the Ars Electronica dataset

Reproject the polygons from EPSG:31255 to EPSG:4326, inspect the zone classes,
and perform point-in-polygon or distance joins against cleaned festival venue
coordinates. A route-level app also needs a walkable street network; straight-
line proximity does not establish a legal dog route.

## Preparation recipe

1. Download the five matching components and record retrieval date and checksums.
2. Profile fields, identifiers, categories, feature count, and geometry validity.
3. Reproject to EPSG:4326 and validate sample polygons against Linz.
4. Confirm category meanings and current rule status with SGS; publish a dated, prototype-only GeoJSON snapshot.

## Decision rationale

The access defect is fixed. The dataset moves from **DO NOT USE** to **OPTIONAL**
because the remaining constraints are staleness, legal sensitivity, and a niche
festival use case rather than technical unavailability.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e)
- [Issue #4](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/4)
- [Original hands-on review](../archive/2026-07-13-reviews-rainer/hundezonen.md)
