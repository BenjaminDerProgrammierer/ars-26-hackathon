# 3D Geodaten Level of Detail 2 (2022)

**Verdict:** ✅ Recommended — real textured 3D building models of Linz, ideal for festival fly-throughs, but heavy format needs reprojection + tooling effort.
**Catalog:** https://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f
**Format / License / Last updated:** CityGML 1.0 (+ DXF, JPG textures, PDF sheet index); CC BY 4.0; dataset modified 2022-11-25, source imagery flights 2019–2021 (no newer vintage published).

## What the data actually contains
- Tiled 3D city model over a 625 m × 500 m grid; index `Uebersicht.csv` lists **834 tiles**, each with GML + DXF + image-folder links.
- Two tile types: `M_*` = **buildings** (`data=building`), `H_*` = **terrain** (`data=terrain`).
- Confirmed a building tile is valid **CityGML 1.0** (CityGRID export) with `bldg:Building` members, textured surfaces (`app:ParameterizedTexture`, referenced `images/*.jpg`). ~350 KB per building GML tile (plus texture images).
- CRS = **EPSG:31255** (Gauss-Krüger M31, heights over Adria) — NOT WGS84. Stated positional accuracy ~±2 m; roof shapes auto-derived (LoD2-ish, "Standardmusterdächer").
- DXF alternative provided for untextured/technical use; PDF `01-Uebersicht.pdf` maps the tile grid.

## Relation to the Ars Electronica dataset
- **Spatial join via venue coordinates:** reproject the 111 venue WGS84 points (e.g. "48,309619" → 48.309619) into EPSG:31255, then look up the containing/nearby tile in `Uebersicht.csv` to fetch the exact 3D building model for each festival venue.
- App ideas: a **3D festival map / venue explorer** or **fly-through** highlighting venue buildings (Ars Electronica Center, POSTCITY, Brucknerhaus, etc.), overlaying calendar events and project categories on the actual building geometry.
- Central Linz (~48.30 N, 14.29 E) is well inside the covered grid, so the festival zone is represented.

## Caveats
- **Heavy for a hackathon:** CityGML + textures across 834 tiles is not plug-and-play — teams need CityGML tooling (FME, 3dcitydb, py3dtiles) or DXF import, plus a reprojection step (EPSG:31255 → WGS84 / 3D tiles) before browser rendering.
- Download is folder/index-based (no single bulk archive seen); teams must fetch only the tiles they need via the CSV links.
- Vintage 2019–2021; a promised 2023/2024 refresh does not appear published here — fine for stable building stock, but a few recent structures may be missing.
- GML encoded ISO-8859-1; explicit "no liability for errors/inaccuracies."
