# Historische Stadtpläne (1876–1990)

**Verdict:** ✅ Recommended — georeferenced historical raster maps in WGS84, drop-in for "then & now" venue overlays.
**Catalog:** https://www.data.gv.at/katalog/datasets/a7bf6e72-6e5c-4973-abce-e37626b3aef7 (1876), https://www.data.gv.at/katalog/datasets/fd2d275e-e145-4c43-8957-8a52cb9e6fa1 (1945)
**Format / License / Last updated:** GeoTIFF + TFW worldfile (+ JPG preview), each in EPSG:4326 / 31255 / 3857; CC BY 4.0; distributions modified 2023-03-28.

## What the data actually contains
- Georeferenced raster city maps, one dataset per vintage (verified 1876 and 1945; shortlist says the series spans 1876–1990, so more vintages exist as sibling datasets).
- Each vintage ships in three CRS: EPSG:4326 (WGS84/GPS), EPSG:31255 (Austrian local), EPSG:3857 (Web Mercator) — each as a TIF + matching TFW worldfile, plus a JPG preview.
- Verified TFW georeferencing works: 1876 EPSG:4326 worldfile has upper-left ~14.2623 E / 48.3250 N (central Linz) with a ~0.0000034° pixel size (very high resolution).
- 1945 map: 25 cm ground resolution; depicts buildings, streets, forests, green spaces, water bodies, street/water names and house numbers.
- This is imagery, not vector/tabular data — no attribute fields or record counts, just georeferenced pixels.

## Relation to the Ars Electronica dataset
- Direct spatial overlay: festival venues carry WGS84 coords (~48.30 N, 14.29 E) that plot straight onto the EPSG:4326 rasters — no reprojection needed. The maps cover the whole Linz city area, so central-Linz venues fall inside them.
- App idea: a "then & now" map slider showing each 2026 festival venue on the 1876/1945 (and other-vintage) city plan, with a time-of-day layer from the calendar.
- Enables historical-context storytelling per venue/festival zone (what stood there in 1876 vs. 1945 vs. today).

## Caveats
- Raster only: joins are purely spatial (point-on-map). No text/attribute join to project categories, artists, or countries.
- Heavy files: full-res TIFs are large; the 1945 JPG preview alone is ~19 MB — plan tiling/downsampling for a hackathon web app.
- URL gotcha: 1945 download paths contain a space (must be %20-encoded, e.g. `Stadtplan%201945_EPSG_4326.tfw`); guessing un-encoded names returns 300/404.
- Each vintage is a separate data.gv.at dataset; assembling the full 1876–1990 series means collecting multiple catalog entries.
