# Kurzparkzonen Standorte 2022

**Verdict:** ⚠️ Borderline — meaningful, spatially joinable data, but ships only as ESRI Shapefiles in a non-WGS84 projection (reprojection required) and the thematic tie is a utility one.
**Catalog:** https://www.data.gv.at/katalog/datasets/bb992195-d827-48d4-a676-f3d680840a1c
**Format / License / Last updated:** ESRI Shapefile (shp/shx/dbf/prj/cpg components only — no CSV/GeoJSON) · CC-BY 4.0 · dataset modified 2022-07-20, vintage 20220621.

## What the data actually contains
- Five shapefile layers: 30min / 90min (Line + Area) / 180min short-term parking zones plus `Kurzparkzone_Grenze` (fee-zone boundary polygons).
- Small, clean tables: e.g. 30min layer = 11 polyline records; Grenze = 4 polygons. Fields: `GUID`, `Zeiten` (opening hours text, e.g. "werktags Mo–Fr 8:00–18:30, Sa 8:00–12:00"), `Parkdauer` (e.g. "30 min").
- Fields are fully populated with plausible values; geometry is real (line/polygon).
- CRS is **MGI Austria GK Central (EPSG:31255, meters)** — NOT WGS84. Verified reprojection: a sample point maps to 14.286 E / 48.30 N, i.e. central Linz, matching the festival venue cluster.

## Relation to the Ars Electronica dataset
- **Spatial proximity** to the 111 venue WGS84 coordinates: after reprojecting the zones to EPSG:4326, compute for each venue which parking zone / fee boundary it falls in or nearest to.
- App idea: "getting to the festival" helper — show the parking duration limit (30/90/180 min) and hours near each venue, or warn attendees which venues sit inside fee zones during festival opening times.
- `Zeiten` hours can be cross-referenced with the festival calendar (Sept 2026 time slots) to flag events that run past the parking window.

## Caveats
- Shapefile-only distribution: a hackathon team must combine shp+dbf+prj and reproject (pyshp+pyproj works in one script, as tested). No lightweight CSV/GeoJSON option.
- 2022 vintage; parking-zone geometry changes slowly so staleness is minor, but hours/limits may be outdated.
- Relation is purely spatial/utility — no thematic or temporal overlap beyond "same city center". Nice-to-have, not a core dataset.
- All layers cover only central Linz (matches venue cluster, so coverage is fine for this use).
