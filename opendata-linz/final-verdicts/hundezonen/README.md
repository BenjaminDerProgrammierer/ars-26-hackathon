# Hundezonen

> **Final verdict: DO NOT USE until public downloads are fixed.** The concept fits a festival-with-dog guide, but every published Shapefile component points to an internal file share that external teams cannot access.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Stadtgrün und Straßenbetreuung (SGS) |
| Catalog | [Hundezonen (Verbotszonen/Freilaufzonen)](https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e) |
| Data access | Unavailable publicly: catalog distributions use `file://///ugl.linz.at/.../HUNDEZONEN.*` internal UNC/SMB paths |
| Format | Intended ESRI Shapefile polygon layer with `.shp`, `.dbf`, `.shx`, `.prj`, and `.cpg` components |
| License | CC BY 4.0 in catalog metadata |
| Coverage | Intended dog zones, dog runs, dog-ban zones, and free-run zones in Linz |
| Data vintage | 2023; metadata modified 2024-06-10 |
| Last verified | 2026-07-15; dated local audit and official catalog URL reviewed. No public file could be rechecked because the catalog exposes internal `file://` paths; publisher-host DNS was also unavailable in this environment. |

## What the dataset contains

The catalog describes polygon geometry for several kinds of dog-related areas: `Hundezonen`, `Hundeausläufe`, `Hundeverbotszonen`, and `Freilaufzonen`. This would support containment and proximity questions around festival venues and walking routes. However, no record, geometry, DBF schema, or projection definition was obtainable in the 2026-07-13 hands-on review.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| Polygon geometry | Intended zone or boundary geometry; not observed because `.shp` was inaccessible. |
| Zone classification | The description implies several dog-zone categories, but no DBF field name or value vocabulary was verified. |
| Source identifier | No record-level identifier could be inspected; do not invent a join key or claim stable IDs. |
| CRS | Would normally be declared by `HUNDEZONEN.prj`, but that file is inaccessible and the CRS remains unknown. |

## Access and technical characteristics

The metadata publishes five separate Shapefile parts: `.shp` geometry, `.dbf` attributes, `.shx` index, `.prj` coordinate reference system, and `.cpg` character-set declaration. All use a `file://///ugl.linz.at/dataugl/opencommons_ugl/.../HUNDEZONEN.*` access URL aimed at an internal Linz share, with no public HTTPS `downloadURL`. A browser or hackathon container outside the municipal network cannot retrieve those paths.

The 2026-07-13 review also tested plausible `data.linz.gv.at` locations, a CKAN-style `package_show` path, and likely GeoServer/WFS capability routes, without finding a working public alternative. Those dated failures do not prove that no out-of-band copy exists, but they do establish that the catalog does not currently provide a usable public distribution. Do not infer EPSG:31255 from other Linz GIS layers: without the `.prj` or publisher confirmation, the CRS and axis order are **unverified**.

## Data quality and limitations

- The decisive defect is access: no geometry or attribute row was available to validate.
- The advertised five-component set is complete in concept but useless when every component resolves only inside the publisher's network.
- CRS, encoding, geometry validity, feature count, identifiers, and category values are unknown because the relevant files could not be opened.
- A 2023 vintage is secondary to the access problem; boundaries and rules may also have changed by September 2026.
- Dog-ban and free-run designations can have legal or operational consequences. A prototype must not claim current rules without publisher verification.

## Using it with the Ars Electronica dataset

### Join strategy

No join should be implemented from the published source. If the publisher supplies a complete public package, inspect the `.prj`, reproject polygons to EPSG:4326, validate categories, and then perform point-in-polygon and distance joins against cleaned festival venue coordinates. A route-level application would require a separate walkable street network; straight-line proximity alone does not establish a legal dog route.

### Suitable hackathon uses

- None from the currently published distributions.
- After repair, a clearly dated prototype could show nearby free-run areas or flag venues close to dog-ban zones.

### Do not use it for

- Building geometry from catalog descriptions or guessed coordinates.
- Current legal guidance, dog-access guarantees, or route recommendations without a working, verified source.

## Preparation recipe

1. Ask Stadt Linz to publish a complete HTTPS ZIP, GeoJSON, or WFS distribution and correct all catalog access URLs.
2. Verify that `.shp`, `.dbf`, `.shx`, `.prj`, and `.cpg` share one basename and open together; record encoding, fields, count, geometry type, and license attribution.
3. Read the declared CRS from `.prj`, reproject to EPSG:4326 only after confirmation, and validate sample polygons against Linz.
4. Confirm zone meanings and current rule status with SGS, then package a dated snapshot before reassessing the verdict.

## Decision rationale

The thematic relationship is real: festival venues can be related spatially to areas for or excluding dogs. Yet a hackathon dataset must be obtainable and reproducible. Because the catalog's only resources are internal file-share paths and no alternative was found, the portfolio decision remains **DO NOT USE**. Reassessment requires public geometry, a verified CRS, readable attributes, and publisher confirmation of the source's current meaning.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e)
- [Publisher defect issue #4](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/4)
- [Hands-on source review](../../2026-07-13-reviews-rainer/hundezonen.md) (access tests dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
