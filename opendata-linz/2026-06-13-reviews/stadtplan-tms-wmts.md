# Digitaler Stadtplan (TMS) / WMTS der Stadt Linz

**Verdict:** ⚠️ Borderline — the TMS tiles are live and serve a Linz base map, but the tiling scheme is non-standard and it adds no joinable attributes, only a cartographic backdrop.
**Catalog:** https://www.data.gv.at/katalog/datasets/c0df0382-e517-44c6-8863-16008bb6d2d5 , https://www.data.gv.at/katalog/datasets/8f057721-c4f7-4979-9fe0-22d55827477a
**Format / License / Last updated:** GIF raster tiles via directory-listing (TMS), CC BY 4.0, metadata modified 2022; tile dirs on server dated 2016.

## What the data actually contains
- TMS service at `geo.data.linz.gv.at/katalog/geodata/tms/stadtplan` responds (HTTP 200): Apache directory listing → `DSPTiles/Tiles1..Tiles7/{zoom}/{n}.gif` (+ `.wld` world files). Fetched `Tiles1/0/0.gif` = valid 1345-byte `image/gif`.
- Each `Tiles*` folder has ~32 zoom/scale subfolders; tiles are pre-rendered city-map raster imagery (streets, buildings, green space, water).
- Georeferencing is **Gauss-Krüger M31, EPSG:31255** (per metadata and the `.wld` file: 0.5 m/pixel, origin ~67500 / 360599). NOT a standard web-mercator z/x/y scheme.
- The second dataset ("WMTS") is misleading: its distribution `accessURL` points to **basemap.at** (Austria-wide standard basemap viewer), not a Linz-specific WMTS endpoint — effectively a link to the national basemap.
- Purely a base-map image layer: no records, attributes, or feature data to query.

## Relation to the Ars Electronica dataset
- Only relation is cartographic: use the tiles as a Linz-branded background on which to plot the 111 venue WGS84 coordinates and festival zones.
- No attribute join is possible — tiles carry no data fields, so there is nothing to link to projects/contacts/calendar beyond visual overlay.

## Caveats
- Non-standard tiling (custom `Tiles1..7` folders, GIF, Gauss-Krüger EPSG:31255) means it does NOT drop into Leaflet/OpenLayers/MapLibre as a normal XYZ source; teams must reproject WGS84 venue coords and map the folder scheme — real friction.
- Tile content dated 2016; fine for streets/buildings but stale for a "current" map feel.
- Free web-mercator basemaps (basemap.at, OSM) give the same backdrop with far less integration effort, weakening the reason to use this.
- No sample tile at guessed `z/x/y.png` paths (404); you must crawl the directory listing to discover valid tile URLs.
