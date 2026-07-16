# Digitaler Stadtplan TMS/WMTS

> **Final verdict: DO NOT USE.** Use a standard basemap.at or OpenStreetMap
> integration instead. The Linz tile tree is old, non-standard and contains no
> joinable attributes.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; the second catalog record redirects users to Austria's basemap.at viewer |
| Catalog | [Digitaler Stadtplan für TMS Server](https://www.data.gv.at/katalog/datasets/c0df0382-e517-44c6-8863-16008bb6d2d5) and [Web Map Tile Service der Stadt Linz](https://www.data.gv.at/katalog/datasets/8f057721-c4f7-4979-9fe0-22d55827477a) |
| Data access | [Linz tile directory](https://geo.data.linz.gv.at/katalog/geodata/tms/stadtplan); the “WMTS” distribution links to a [basemap.at application view](https://www.basemap.at/application/index.html#%7B%22center%22:%5B1591543.2400141982%2C6155954.305902162%5D%2C%22zoom%22:14%2C%22rotation%22:0%2C%22layers%22:%2210000000%22%7D), not a Linz capabilities document |
| Format | GIF raster tiles plus WLD world files in a custom directory tree; catalog labels the companion record XML |
| License | CC BY 4.0 in the Linz catalog; alternative basemaps have their own attribution terms |
| Coverage | Pre-rendered Linz city-map imagery only; no vector objects or attributes |
| Data vintage | Tile directories were dated 2016 in the 2026-07-13 review; metadata was modified in 2022 |
| Last verified | 2026-07-15: official catalog evidence reviewed; tile behavior is from 2026-07-13 and was not rechecked on 2026-07-15 because the publisher host could not be resolved |

## What the dataset contains

The TMS-labeled record exposes an Apache-style directory listing, not a standard
capabilities response or familiar `{z}/{x}/{y}` URL template. The reviewed tree
continued through `DSPTiles/Tiles1` to `Tiles7`, with scale/level subdirectories,
numbered GIF files and associated `.wld` world files. A representative
`Tiles1/0/0.gif` fetched on 2026-07-13 was a valid 1,345-byte GIF. The imagery is
a pre-rendered cartographic backdrop containing streets, buildings, vegetation
and water, but no queryable feature objects.

The separately catalogued “WMTS der Stadt Linz” is materially different from its
title: its distribution access URL opens an Austria-wide basemap.at viewer centered
on Linz. It does not identify a Linz-specific WMTS `GetCapabilities` resource.
Teams should integrate basemap.at through its current official documentation, not
pretend this catalog redirect is a service contract.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `Tiles1` … `Tiles7` | Custom top-level tile sets; they are not standard web-map zoom numbers |
| scale/number path | Directory-discovered address of a GIF; no supported XYZ mapping was established |
| `.gif` | Rendered raster tile with no semantic fields or feature identifiers |
| `.wld` | Affine world file giving pixel scale and origin for the paired GIF |
| EPSG:31255 | MGI / Austria GK M31 projected coordinates in metres |
| catalog “WMTS” URL | Viewer deep link to basemap.at, not a Linz service endpoint or capabilities document |

## Access and technical characteristics

The 2026-07-13 review found roughly 32 scale/level subdirectories within each
`Tiles*` branch and no working guessed `z/x/y.png` path. A reviewed world file had
0.5 m pixels and an origin around `67500 / 360599`, consistent with EPSG:31255.
Those numbers are projected metre coordinates and cannot be used as WGS84
longitude/latitude.

Standard Leaflet, OpenLayers and MapLibre tile layers expect a documented scheme,
normally Web Mercator plus a stable URL template or WMTS capabilities metadata.
This source would require custom directory discovery, world-file interpretation,
tile selection and likely reprojection. Crawling the listing to reverse-engineer
the scheme would create organizer code for a stale background that standard
basemaps already supply.

## Data quality and limitations

- The content is dated 2016 in the reviewed server directory, so recent streets
  and buildings may be absent even though catalog metadata changed in 2022.
- It is raster-only: no place names, buildings, streets or other objects can be
  selected, filtered or joined as data.
- The TMS label overstates compatibility. Directory listings, GIF and projected
  world files do not make this a standard plug-in XYZ/TMS source.
- The WMTS catalog record points to an external application viewer rather than a
  machine-readable Linz-specific service definition.
- Availability of one sample tile on 2026-07-13 is not an SLA or evidence that
  every branch is complete.

## Using it with the Ars Electronica dataset

### Join strategy

There is no attribute join. At most, corrected WGS84 festival venue points could
be transformed to EPSG:31255 and drawn over a manually selected raster extent.
That work should not be done for the hackathon bundle. Use a current standard
basemap and overlay the same validated venue GeoJSON directly.

### Suitable hackathon uses

- None in the prepared portfolio. A researcher might inspect it as a legacy
  geospatial-delivery example, but that is outside the festival data track.

### Do not use it for

- A production or default festival basemap.
- Any feature query, route computation or venue/entity join.
- Assuming the basemap.at viewer URL is a Linz WMTS capabilities endpoint.
- Crawling the entire legacy tile tree during the hackathon.

## Preparation recipe

1. Do not ingest or mirror the Linz GIF directory.
2. Choose a maintained standard basemap and confirm its current license,
   attribution, API/service documentation and browser compatibility.
3. Publish corrected festival venues as WGS84 GeoJSON and use the standard map
   library's supported layer integration.
4. If historical reproducibility is needed, keep the two Linz catalog URLs and
   this dated audit as evidence of why the source was excluded.

## Decision rationale

Rainer's review called the source borderline because a real sample tile was
accessible. Accessibility alone does not offset the custom EPSG:31255 scheme,
2016 content and absence of attributes. The companion record is only a basemap.at
redirect. The final portfolio decision therefore remains **do not use**.

## Sources

- [Official TMS catalog](https://www.data.gv.at/katalog/datasets/c0df0382-e517-44c6-8863-16008bb6d2d5)
- [Official WMTS-labeled catalog](https://www.data.gv.at/katalog/datasets/8f057721-c4f7-4979-9fe0-22d55827477a)
- [Official Linz tile directory](https://geo.data.linz.gv.at/katalog/geodata/tms/stadtplan)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/stadtplan-tms-wmts.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
