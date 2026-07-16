# Historische Stadtpläne

> **Final verdict: USE WITH PREPARATION.** Pre-tile or downsample a small set of
> maps covering festival venues; do not make teams process the full source
> rasters onsite.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; municipal surveying and geoinformation |
| Catalog | [Stadtplan Linz 1876](https://www.data.gv.at/katalog/datasets/a7bf6e72-6e5c-4973-abce-e37626b3aef7) and [Stadtplan Linz 1945](https://www.data.gv.at/katalog/datasets/fd2d275e-e145-4c43-8957-8a52cb9e6fa1) |
| Data access | One citywide raster per vintage and CRS; use EPSG:3857 for web tiling or EPSG:4326 for direct WGS84 overlay |
| Format | TIFF/GeoTIFF-style raster delivery with TFW world files; some vintages include a JPEG preview |
| License | Creative Commons Attribution 4.0; retain Stadt Linz attribution |
| Coverage | Whole-city historical plans; 1876 and 1945 were inspected, with sibling records extending the collection to later twentieth-century vintages |
| Data vintage | The year in each dataset title is the depicted map state, distinct from 2022 catalog modification dates |
| Last verified | 2026-07-15: official catalog metadata reviewed; file characteristics are from the 2026-07-13 source review and were not rechecked on 2026-07-15 because the publisher host could not be resolved |

## What the dataset contains

Each catalog record is a georeferenced raster city plan for one historical year,
not a table or vector feature layer. The catalog describes buildings, streets,
forests, green space, water, street and water labels, and house numbers at a
nominal 25 cm ground resolution. The 2026-07-13 hands-on review inspected the
1876 and 1945 resources and identified a broader 1876–1990 family of sibling
datasets; do not imply that only two vintages exist, but do not claim an
unverified complete year list either.

The same image is offered in several coordinate systems. The 1876 catalog lists
TIFFs in EPSG:31255, EPSG:3857 and EPSG:4326. For the inspected WGS84 variant, the
world file placed the upper-left near 14.2623° E, 48.3250° N with an approximate
pixel size of 0.0000034 degrees. This is evidence about georeferencing, not a
claim that degree units are a constant ground distance across the image.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| vintage year | Primary identifier for the depicted historical state; keep it in layer names and UI labels |
| EPSG:4326 | Longitude/latitude variant suited to direct comparison with validated Ars venue coordinates |
| EPSG:3857 | Web Mercator variant suited to producing standard browser-map tiles |
| EPSG:31255 | MGI / Austria GK M31 source variant in projected metres; not WGS84 |
| `.tfw` | Six-line affine world file; it must stay paired with the corresponding raster when the TIFF lacks embedded georeferencing |
| raster pixel | Color/image observation only; there are no feature IDs or attributes to join |

## Access and technical characteristics

Choose one CRS per workflow rather than downloading every variant. The direct
[1876 EPSG:3857 TIFF](https://geo.data.linz.gv.at/katalog/geodata/stadtplan/1876/stadtplan_1876_EPSG_3857.tif)
is the natural starting point for organizer-side web tiling; the
[1876 EPSG:4326 TIFF](https://geo.data.linz.gv.at/katalog/geodata/stadtplan/1876/stadtplan_1876_EPSG_4326.tif)
is convenient for GIS checks against venue coordinates. The 1945 URLs contain a
literal space in the filename and must be percent-encoded, as in the
[1945 EPSG:3857 TIFF](https://geo.data.linz.gv.at/katalog/geodata/stadtplan/1945/Stadtplan%201945_EPSG_3857.tif).

These are whole-city, full-resolution source images. The 2026-07-13 review found
the 1945 JPEG preview alone to be about 19 MB. TIFF is not a practical direct web
asset. Generate a tile pyramid, COG or bounded WebP/PNG crops around festival
zones, and verify the result against control points. Preserve the original world
file and CRS metadata alongside every derivative.

## Data quality and limitations

- The depicted year is historical; catalog publication/modification dates do not
  make the cartography current.
- Raster labels and boundaries are cartographic evidence, not normalized
  entities. OCR or automated building extraction would introduce new uncertainty.
- Full-resolution assets are too large for casual browser delivery. Preview size
  is not a reliable proxy for TIFF size.
- Map conventions, surveyed accuracy and completeness vary by vintage. The
  publisher disclaims liability for errors and inaccuracies.
- Separate records and filename differences make a full-series bulk pipeline
  brittle; curate only the years needed by the concept.

## Using it with the Ars Electronica dataset

### Join strategy

Use a spatial overlay. First correct invalid festival coordinates and inherit
parent building locations where child rooms lack reliable points. For an
EPSG:4326 raster, plot validated longitude/latitude venue points directly after
checking axis order. For EPSG:3857 tiles, project the same points to Web Mercator.
No attribute key links a project or venue to a raster pixel; store the vintage and
prepared layer ID on the resulting scene or story card.

### Suitable hackathon uses

- A then-and-now slider centered on Ars Electronica venues.
- Historical walking narratives that combine a plan with street-name history.
- A time-travel backdrop for festival zones, with vintage and uncertainty shown.

### Do not use it for

- Current navigation, parcel boundaries, building existence or address truth.
- Automated claims about who occupied a building without another historical
  source.
- Delivering original TIFFs directly to general participants or browsers.

## Preparation recipe

1. Select two or three story-relevant vintages and one appropriate CRS variant
   for each; avoid duplicate downloads.
2. Verify raster/world-file pairing, extent, axis order and several known Linz
   control points.
3. Crop to buffered festival zones and create standard web tiles or compressed
   image pyramids with bounded zoom levels.
4. Overlay corrected festival venue points and visually inspect alignment at the
   intended zooms.
5. Publish a manifest with vintage, original URL, source and output CRS,
   retrieval date, processing settings, license and attribution.

## Decision rationale

Rainer recommended these plans because WGS84 and Web Mercator variants make the
historical imagery unusually approachable. They have high narrative value but no
attributes and significant raster-delivery overhead. The final portfolio decision
therefore requires organizer-prepared assets rather than raw-file distribution.

## Sources

- [Official 1876 catalog](https://www.data.gv.at/katalog/datasets/a7bf6e72-6e5c-4973-abce-e37626b3aef7)
- [Official 1945 catalog](https://www.data.gv.at/katalog/datasets/fd2d275e-e145-4c43-8957-8a52cb9e6fa1)
- [Official 1876 EPSG:4326 raster](https://geo.data.linz.gv.at/katalog/geodata/stadtplan/1876/stadtplan_1876_EPSG_4326.tif)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/historische-stadtplaene.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
