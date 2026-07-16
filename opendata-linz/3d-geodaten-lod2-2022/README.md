# 3D Geodaten LoD2 (2025 refresh)

> **Final verdict: USE WITH PREPARATION FOR A SHOWCASE TRACK.** Preselect and
> convert festival-area tiles; the raw citywide source is not weekend-ready.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner: municipal surveying and geoinformation |
| Catalog | [3D Geodaten mit Level of Detail2 2022](https://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f); title is stale relative to the publisher directory |
| Data access | Prefer the [2025 directory](https://data.linz.gv.at/katalog/geodata/3d_geo_daten/2025/) and [2025 tile index CSV](https://data.linz.gv.at/katalog/geodata/3d_geo_daten/2025/Uebersicht.csv) |
| Format | GML, DXF, JPEG textures, CSV tile index and PDF sheet overview; the inspected 2022 sample was CityGML 1.0 |
| License | Creative Commons Attribution 4.0; retain the Stadt Linz attribution |
| Coverage | Linz in a 625 m × 500 m projected grid; buildings and terrain |
| Data vintage | Indexed 2025 edition published in the directory; acquisition dates behind the refresh are not documented in the inspected index |
| Last verified | 2026-07-16: 2025 directory and index crawled; representative tile listings checked |

## What the dataset contains

The source is a tiled three-dimensional city model, not one citywide file. The
2025 `Uebersicht.csv` contains 834 rows: 506 terrain and 328 building tiles. Each
row points to the relevant GML, DXF and image-folder resources. In the earlier
2022 edition, a representative building GML was valid CityGML 1.0 from a
CityGRID export, contained `bldg:Building` members, and used
`app:ParameterizedTexture` references to JPEGs below `images/`. The reviewed GML
was about 350 KB before its textures; this is not a reliable average for all
tiles or proof that the 2025 payload schema is identical.

The catalog describes simple building and roof forms generated semi-automatically
from a digital surface model and building footprints. Some buildings have more
detailed modelling. Heights are relative to the Adriatic height datum, and the
publisher states a simple mean accuracy of approximately ±2 m.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| tile name | Grid identifier used to select and retrieve a small area; preserve it as provenance in converted assets |
| `M_*` | Model tiles containing building data (`data=building`) |
| `H_*` | Model tiles containing terrain data (`data=terrain`) |
| `bldg:Building` | CityGML building feature; useful for feature-level styling after conversion |
| `app:ParameterizedTexture` | Texture mapping whose relative JPEG references must remain valid during extraction |
| EPSG:31255 | MGI / Austria GK M31 projected coordinates in metres; not longitude/latitude |

## Access and technical characteristics

Use `Uebersicht.csv` or the [PDF sheet overview](https://data.linz.gv.at/katalog/geodata/3d_geo_daten/2025/01-Uebersicht.pdf)
for discovery. The directory is folder-based; the 2026-07-13 review did not find a
single bulk archive. Select the necessary grid cells first, then retrieve only
their building, terrain and texture resources. Do not crawl all 834 entries for a
prototype.

The 2025 index has a systematic publisher defect: every generated `folder`,
`gml`, `dxf`, and `jpg` URL still contains `/2022/`. Replace that single path
segment with `/2025/` for selected rows and verify the resulting URL. Direct
2025 tile directories do contain GML, DXF, and image folders; do not follow the
unmodified index links or silently fall back to the older model.

Geometry is in EPSG:31255, Gauss–Krüger M31, with projected metre coordinates.
Convert it deliberately to the coordinate system expected by the target renderer.
For a 2D spatial join, transform festival WGS84 coordinates from EPSG:4326 into
EPSG:31255. For a browser 3D deliverable, convert selected source tiles to glTF or
3D Tiles while retaining a tested geospatial transform and vertical-offset policy.
Do not relabel the source coordinates as WGS84. The reviewed GML declared
ISO-8859-1, so XML parsing should respect the declaration before emitting UTF-8.
DXF is the untextured alternative for technical workflows.

## Data quality and limitations

- A full 2025 directory is now published, but the inspected index does not state
  its underlying capture dates. “2025 edition” must not be presented as proof
  that every building was surveyed in 2025.
- All 834 resource paths embedded in the 2025 index point to the 2022 directory
  and require a controlled path correction plus existence checks.
- Automatically derived standard roof shapes and the stated ±2 m accuracy make
  the model unsuitable for surveying, clearance, accessibility or safety claims.
- CityGML plus external textures creates path, material and conversion failure
  modes. Validate every published showcase tile visually.
- Full-corpus conversion is an organizer-scale task. The raw folder hierarchy and
  projected CRS are too much setup for the default hackathon track.

## Using it with the Ars Electronica dataset

### Join strategy

Start from cleaned festival location coordinates, not raw location IDs: some Ars
locations share building coordinates and several AEC child-location coordinates
need correction. Parse German comma decimals, validate latitude/longitude ranges,
deduplicate to building-level points, then transform EPSG:4326 to EPSG:31255.
Find the containing grid cell from the overview/index and attach the selected tile
ID to each venue. Keep a mapping of canonical venue ID, source coordinate,
corrected coordinate, tile ID and conversion version.

### Suitable hackathon uses

- A prebuilt 3D venue explorer or festival-zone fly-through.
- Highlighting venue buildings and overlaying projects or calendar slots.
- An optional visual installation contrasting the 2025 city-model edition with festival
  activity, with the source vintage clearly visible.

### Do not use it for

- A raw-download challenge for general teams.
- Current-building completeness, precise roof geometry, surveying or navigation.
- Inferring accessibility, occupancy or safe routes from model geometry.

## Preparation recipe

1. Correct and deduplicate festival venue coordinates, then transform them from
   EPSG:4326 to EPSG:31255.
2. Intersect those points with the sheet grid, repair `/2022/` to `/2025/` in
   selected index URLs, verify them, and download only the required `M_*`/`H_*`
   resources and their referenced textures.
3. Parse CityGML with its declared encoding; validate relative texture paths,
   geometry, CRS and vertical placement.
4. Convert and optimize to glTF/3D Tiles, generate browser-ready levels of detail,
   and visually inspect each venue anchor.
5. Publish a small bundle with tile ID, retrieval date, imagery vintage, CRS,
   transform settings, license and attribution.

## Decision rationale

The model has strong visual value and Rainer's review recommended it for genuine
3D festival storytelling. The portfolio decision remains narrower: the file
family, textures, local CRS and folder-based selection make organizer
preprocessing mandatory. It belongs in a showcase track, not the core bundle.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f)
- [Official 2025 source directory](https://data.linz.gv.at/katalog/geodata/3d_geo_daten/2025/)
- [Official 2025 tile index](https://data.linz.gv.at/katalog/geodata/3d_geo_daten/2025/Uebersicht.csv)
- [2026-07-16 catalog delta](../archive/2026-07-16-catalog-delta-usability.md)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/3d-geodaten-lod2-2022.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
