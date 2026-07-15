# Orthofotos

> **Final verdict: OPTIONAL SHOWCASE SOURCE.** Offer only preselected, web-ready
> venue tiles to teams that explicitly want aerial-image or time-travel work. Do
> not distribute a complete raw vintage as the default. Inclusion is conditional
> on an organizer decision to prepare those tiles before the hackathon.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; municipal surveying and geoinformation |
| Catalog | [Orthofotos 1988](https://www.data.gv.at/katalog/datasets/162fda5a-c708-4b41-be5f-2725f175e2b0) and [Orthofotos 2019](https://www.data.gv.at/katalog/datasets/cbd03782-d8cd-49de-a038-9ce7bd1591ce), with sibling records for other vintages |
| Data access | Vintage-specific directory, overview Shapefile/PDF, then selected TIFF plus matching TFW; [2019 directory](https://geo.data.linz.gv.at/katalog/geodata/orthofotos/2019/) |
| Format | TIFF image tiles, TFW world files and ESRI Shapefile/PDF tile indexes |
| License | Creative Commons Attribution 4.0 according to the catalog |
| Coverage | Linz city; full-city editions and special subsets across 1988–2021 |
| Data vintage | Aerial capture year, not catalog update date; 1988 is grayscale, 2019 is color, and 2021 is a bridge-focused subset |
| Last verified | 2026-07-15: catalog/local evidence reviewed; source directory and file headers were observed on 2026-07-13 and were not rechecked on 2026-07-15 because the publisher host could not be resolved |

## What the dataset contains

The family consists of orthorectified aerial-image tiles published by capture
vintage. Locally catalogued sibling editions include 1988, 1998, 2004, 2008, a
2009 Innenstadt subset, 2011, 2016, 2019 and a 2021 bridges subset. Coverage and
tile count therefore differ by record; “1988–2021” describes the family range,
not one uniform time series.

The 2019 full-city edition is the clearest scale reference. The catalog documents
504 eight-bit color tiles, 20 cm ground resolution and approximately 23 MB per
image. The 2026-07-13 review observed a representative `Content-Length` of
23,438,258 bytes, which implies roughly 11.8 GB if all 504 images were fetched.
The flight occurred on 19–20 April 2019. The 1988 edition contains 540 scanned
grayscale analog images of about 3.7 MB each according to its catalog record.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| vintage | Capture year/edition; the essential temporal label for comparisons |
| tile filename/index ID | Identifier connecting the overview footprint to a TIFF/TFW pair; preserve it in every derivative manifest |
| overview footprint | Polygon in the index Shapefile used to select tiles before image download |
| `.tif` | Raster image tile; the source is not intended for direct browser display |
| `.tfw` | Affine georeferencing sidecar; the reviewed 2019 sample used 0.2 m pixels |
| EPSG:31255 | MGI / Austria GK M31 projected metre coordinates; all inspected Linz editions use this local CRS |

## Access and technical characteristics

Start with the overview, not the image directory. The 2019 catalog links the
[overview Shapefile](https://geo.data.linz.gv.at/katalog/geodata/orthofotos/2019/2019.shp)
and [PDF sheet index](https://geo.data.linz.gv.at/katalog/geodata/orthofotos/2019/2019_BlattUebersicht.pdf).
The 2026-07-13 review found the Shapefile set (`.shp`, `.shx`, `.dbf`) to be only
about 67 KB, making it the correct discovery mechanism. Download all required
Shapefile companions from the directory; a lone `.shp` is not a complete dataset.

Festival coordinates are EPSG:4326 longitude/latitude after cleaning, whereas the
tile footprints and TFW values are EPSG:31255 projected metres. Transform venue
points into EPSG:31255, intersect with the overview polygons and fetch only the
matching TIFF/TFW pairs. A reviewed TFW used 0.2 m pixel size and an origin near
`68750.1 / 349999.9`; these values must never be interpreted as degrees.

For delivery, reproject selected source tiles and create a Cloud Optimized GeoTIFF
for GIS users or PNG/WebP/standard web-map tiles for browsers. Avoid re-encoding
the entire vintage when only central venue buffers are needed.

## Data quality and limitations

- This is the largest source family in the shortlist. The 2019 edition alone is
  about 11.8 GB; multiplying that pattern across vintages is not weekend-ready.
- TIFF plus world-file delivery is static file access, not a WMTS or live imagery
  service. File availability and directory conventions must be handled per year.
- Historical captures do not represent the September 2026 city. New buildings,
  demolished structures and temporary festival conditions will differ.
- Imagery has no semantic attributes or feature IDs. Any detected building,
  vegetation or change is an inference produced by downstream processing.
- Different editions and subsets have different footprints. Confirm that both
  sides of a comparison cover the exact venue before presenting a slider.

## Using it with the Ars Electronica dataset

### Join strategy

Validate and correct Ars venue coordinates, parse German comma decimals and
deduplicate rooms that inherit the same building point. Transform canonical venue
points from EPSG:4326 to EPSG:31255 and spatially intersect them with each selected
vintage's overview footprints. Store venue ID, vintage, tile ID, source URL and
crop bounds. Reproject/crop only after selection, then check that all paired
vintages use the same visible extent and pixel alignment.

### Suitable hackathon uses

- Aerial then-and-now sliders, especially 1988 versus 2019.
- Venue-area change stories or image backdrops for selected festival zones.
- A prepared visual showcase comparing orthophotos with historical city plans.
- AI-assisted visual classification or change detection on a bounded, prepared
  training/evaluation area, with human validation of published inferences.

### Do not use it for

- Current navigation, legal boundaries or real-time city conditions.
- Asking general teams to download complete vintages or process source TIFFs.
- Automated claims of land-use or social change without validation and additional
  evidence.

## Preparation recipe

1. Select one or two complete vintages and verify that the desired venue zones are
   inside both overview footprints.
2. Transform corrected WGS84 venues to EPSG:31255 and intersect the complete
   Shapefile index to identify the minimum tile set.
3. Download only those TIFF/TFW pairs; validate checksums, affine transforms,
   image dimensions and edge alignment.
4. Mosaic/crop bounded venue areas, reproject to EPSG:3857 or EPSG:4326 and emit
   COG or browser-ready tiles with constrained zoom levels.
5. Publish a manifest with capture year, flight/source notes, tile IDs, processing
   parameters, retrieval date, license and attribution.

If the organizer does not commit to steps 1–5 before the event, do not advertise
orthophoto image recognition as a ready-to-use dataset track. Teams should not be
expected to turn the roughly 11.8 GB 2019 source into web tiles during the event.

## Related image-source request

The data provider suggested that the Tabakfabrik, museums, and other Linz
institutions may have image archives they could make available for AI-recognition
experiments. Treat this as a separate discovery and rights-clearance task, not as
part of the orthophoto license. Ask for a curated sample, machine-readable
metadata, permitted AI uses, attribution rules, and publication constraints.

## Decision rationale

Rainer found the time-travel concept visually compelling but the delivery heavy
and projection-specific. The approximately 11.8 GB 2019 scale confirms that raw
distribution is unsuitable for most teams. A small organizer-prepared set can be
excellent, so the final decision remains an optional showcase rather than
exclusion.

The 2026-07-15 stakeholder follow-up leaves preparation explicitly **TBD**. The
dataset remains optional unless and until the organizer commits to the web-tile
work.

## Sources

- [Official 1988 catalog](https://www.data.gv.at/katalog/datasets/162fda5a-c708-4b41-be5f-2725f175e2b0)
- [Official 2019 catalog](https://www.data.gv.at/katalog/datasets/cbd03782-d8cd-49de-a038-9ce7bd1591ce)
- [Official 2019 directory](https://geo.data.linz.gv.at/katalog/geodata/orthofotos/2019/)
- [Hands-on source review](../../2026-07-13-reviews-rainer/orthofotos.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
