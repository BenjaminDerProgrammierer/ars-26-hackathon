# Defibrillatoren Standorte

**Verdict:** ✅ Recommended — clean, geocoded public-safety point layer that overlays directly onto festival venues.
**Catalog:** https://www.data.gv.at/katalog/datasets/866e3d0b-531b-42a0-a82a-3f36dd02b368
**Format / License / Last updated:** Single CSV, CC-BY 4.0, source Red Cross OÖ; issued 2022-05, metadata modified 2023-03. Vintage 2022 (no newer distribution).

## What the data actually contains
- 282 data rows (283 lines incl. header), UTF-8, comma-decimal + `°` suffix on coords.
- Columns: FIRMA, Adresse, PLZ, Stadt, Marke/Hersteller, Standort (in-building description), Koordinaten N, Koordinaten O.
- Coordinates are WGS84 lat/lon, e.g. `"48,307533°","14,288317°"` — same comma-decimal convention as the Ars venue coordinates.
- Well populated: every sampled row has full address, PLZ (4020/4021/4040...), device model, and coords. Clustered in Linz city area (~48.29–48.33 N, 14.25–14.32 E), matching the festival's central-Linz footprint.
- Includes named venues relevant to the festival scene (Musiktheater Linz / Volksgarten, Landestheater orbit, Landhaus, sports/education sites).

## Relation to the Ars Electronica dataset
- Spatial proximity join: for each of the 111 festival venues (WGS84 coords), find nearest AED — "closest defibrillator to this stage/exhibition" safety feature.
- Direct address / name match on central-Linz buildings (e.g. Musiktheater Am Volksgarten) where festival events may occur.
- App idea: a festival safety map overlaying AED points on venues, or accessibility/emergency panel per event showing nearest AED with in-building location hint (Standort column).

## Caveats
- Vintage is 2022; some sites may have relocated/closed, but AED placement is fairly stable and adequate for a hackathon prototype (not for real emergency use).
- Coordinates need parsing: strip `°`, replace comma with dot — trivial but required.
- Some rows share identical coords for multiple devices in one building (duplicate lat/lon), which is expected, not an error.
