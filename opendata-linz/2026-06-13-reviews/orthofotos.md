# Orthofotos (1988–2021, several vintages)

**Verdict:** ⚠️ Borderline — visually compelling time-travel idea, but heavy TIFF-only delivery in a non-WGS84 projection is real friction for a hackathon.
**Catalog:** https://www.data.gv.at/katalog/datasets/162fda5a-c708-4b41-be5f-2725f175e2b0 (1988), https://www.data.gv.at/katalog/datasets/cbd03782-d8cd-49de-a038-9ce7bd1591ce (2019)
**Format / License / Last updated:** Georeferenced TIFF tiles + ESRI Shapefile/DBF overview + TFW worldfiles; CC BY 4.0; metadata modified 2022–2023 (imagery vintages 1988 grayscale, 2019 color, others 1988–2021).

## What the data actually contains
- 2019 vintage: **504 GeoTIFF tiles, each ~23 MB** (confirmed Content-Length 23,438,258; image/tiff) → ~11.8 GB total. 8-bit color, 20 cm ground resolution, flown 19–20 Apr 2019.
- 1988 vintage: 540 grayscale scanned-analog images, ~3.7 MB each.
- Each tile has a `.tfw` worldfile (verified: 0.2 m pixel size, origin e.g. 68750.1 / 349999.9) → precisely georeferenced.
- Coordinate system is **Gauss-Krüger M31, EPSG:31255** — NOT WGS84.
- An overview **Shapefile (.shp/.shx/.dbf, ~67 KB) + PDF sheet index** gives per-tile footprints, so you can look up which tile covers a given point without downloading everything.
- Directory listing at geo.data.linz.gv.at is open and browsable; all links live.

## Relation to the Ars Electronica dataset
- **Spatial join:** reproject the 111 venue WGS84 coordinates (~48.30 N, 14.29 E) into EPSG:31255, intersect against the overview shapefile footprints to fetch only the handful of tiles covering festival venues.
- App idea: "then vs. now" aerial slider over each venue (1988 grayscale ↔ 2019 color), or an aerial basemap under a festival venue map.
- Only a semantic/spatial link exists — no temporal join (imagery predates the Sept 2026 festival by years, which is fine for a historical backdrop).

## Caveats
- **Heaviest candidate seen:** ~11.8 GB per vintage in 23 MB TIFF tiles; no WMTS/tile/web service in the metadata, only static files. A team must select/convert tiles (GDAL) and reproject GK→WGS84 before web use.
- TIFF is not browser-native; needs conversion to COG/PNG/web tiles for a hackathon UI.
- Imagery is static/historical (vintage snapshots), so no live relation to festival timing — value is purely as a spatial/visual backdrop.
