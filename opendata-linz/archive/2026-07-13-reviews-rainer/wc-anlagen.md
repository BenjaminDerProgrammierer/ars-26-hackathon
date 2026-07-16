# Öffentliche WC-Anlagen Standorte

**Verdict:** ✅ Recommended — clean, comfort-layer POI data that joins spatially to venues once reprojected.
**Catalog:** https://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1
**Format / License / Last updated:** CSV (semicolon-delimited, UTF-8); CC BY 4.0; dataset modified 2023-01-16, distributions touched 2024-07-08. Irregular update frequency.

## What the data actually contains
- ~40 public toilet locations across Linz (rolling file `WC_Anlagen.csv`; two dated snapshots 2022/2023 also offered).
- Fields: Nr., Art (staffed/unstaffed), name/location, X, Y, barrierefrei (accessible y/n), Euro-Key (y/n), Öffnungszeiten (opening hours, free text, multi-line), Wickeltisch (changing table y/n), Wintersperre (winter closure), Anmerkung (notes, e.g. usage fee "€ 0,20").
- Coordinates are **EPSG 31255 (MGI Austria GK Central)**, e.g. X=70795, Y=352404 — projected local coords, NOT WGS84. Must be reprojected to join.
- Values are well-populated and plausible; landmark-named sites (Lentos Kunstmuseum, Hauptplatz, Donaupark, Urfahrmarkt) sit in central Linz, same area as festival venues.
- Semicolon delimiter; several fields contain embedded newlines inside quotes (opening hours, Art) — needs a real CSV parser.

## Relation to the Ars Electronica dataset
- **Spatial proximity join**: after reprojecting EPSG 31255 → WGS84, snap each toilet to nearest venue coordinate (venues cluster ~48.30 N / 14.29 E). App: "nearest accessible/family toilet to this venue."
- **Accessibility overlay**: `barrierefrei` + `Eurokey` + `Wickeltisch` flags pair naturally with the festival's per-project accessibility notes to build an inclusive-visitor map.
- **Opening-hours vs. calendar**: parse Öffnungszeiten and cross-check against the September 2026 evening/late festival time slots to flag venues whose nearby toilets close early or have winter closure.

## Caveats
- Coordinate reprojection (EPSG 31255 → 4326) is mandatory and the single biggest integration cost; get axis order right (X/Y look like easting/northing).
- Opening hours and notes are free-text German with inline line breaks — no structured schema; needs NLP/manual parsing for time logic.
- Small dataset (~40 rows) and staleness (core content ~2023) — fine for static POIs, but new/removed toilets since 2023 won't be reflected.
