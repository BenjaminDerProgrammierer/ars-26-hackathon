# Baumkataster

**Verdict:** ✅ Recommended — current, clean, geocoded tree inventory that joins directly to venue coordinates.
**Catalog:** https://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d
**Format / License / Last updated:** CSV (semicolon-separated), CC BY 4.0. "Baumkataster aktuell" distribution modified 2026-01-01; export date in data is 20260701 (1 July 2026). A separate frozen "Baumkataster 2013" distribution also exists — use the "aktuell" one.

## What the data actually contains
- ~27,004 tree records (one row per tree), fetched live from data.linz.gv.at.
- Columns: Flaeche, Gattung (genus), Art (species), Sorte (cultivar), NameDeutsch, Hoehe (height m), Schirmdurchmesser (crown diameter m), Stammumfang (trunk circ. cm), Typ (L=deciduous/N=conifer), XPos/YPos (Austrian central grid), lon, lat, BaumNr, DatumExport.
- Coordinates in **WGS84 EPSG:4326** as `lon`/`lat` with dot decimal separator (e.g. 14.259, 48.319) — no reprojection needed.
- Points cluster around central Linz (~48.2–48.33 N, 14.25–14.35 E), overlapping the festival area.
- Fields are well-populated with plausible values (species names, heights 4–25 m, crown 2–15 m). German species names included.
- The DCAT description mentions a WikidataID column mapping genus to Wikidata; not present in this CSV header but genus/species enable enrichment anyway.

## Relation to the Ars Electronica dataset
- **Spatial proximity join (primary):** venue WGS84 coordinates (parse comma→dot) vs tree lon/lat. Trivial haversine/bounding-box join — both in the same central-Linz extent.
- App idea: "shaded route / green venue" finder — count/rank trees near each of the 111 venues, suggest tree-lined walking paths between September calendar events.
- Green-city visualization overlaying the ~27k tree canopy (crown diameter) with festival venues and zones on a map.
- Semantic angle: match tree species/countries-of-origin to artist country codes for a playful "botanical origins" narrative.

## Caveats
- Not stale: this contradicts the shortlist's "2013?" worry — the current export is dated mid-2026.
- CSV uses `;` delimiter and mixes a placeholder `-` / ` -` in the Sorte column; trivial to parse.
- Coordinate decimal convention differs from the Ars dataset (dot here, comma there) — normalize before joining.
- Large-ish file (~27k rows) but easily handled in a hackathon.
