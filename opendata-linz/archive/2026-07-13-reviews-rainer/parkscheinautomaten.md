# Parkscheinautomaten Standorte 2023

**Verdict:** ✅ Recommended — real, geolocated parking-machine points in central Linz; use street addresses to sidestep the missing CRS.
**Catalog:** https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888
**Format / License / Last updated:** ESRI Shapefile only (shp/dbf/shx/cpg, UTF-8); CC-BY 4.0; data vintage 2023-06-23, metadata modified 2024-06-10, accrual "notPlanned".

## What the data actually contains
- 269 point records (shapeType 1 = point), one per parking-ticket machine.
- Fields: `PSA` (machine no.), `Standort` (street address, e.g. "Gruberstraße 24"), `Zone` (90/180/30 min), `E` (always "P"), `Anmerkung` (notes, ~110 flag "NFC-Kartenfunktion"), `X`,`Y`, `GUID`.
- Addresses are real central-Linz streets (Mozartstraße, Blumauerstraße, Gruberstraße, …) — same area as the festival venues.
- Coordinates are a projected Austrian grid, NOT WGS84 (bbox ~70146–72528 E, 350580–353647 N); no `.prj` shipped, so the exact CRS (likely GK/MGI-based Linz local) must be guessed to reproject.
- Fully populated fields, plausible values, clean UTF-8.

## Relation to the Ars Electronica dataset
- Spatial proximity: reproject X/Y (or geocode `Standort`) to WGS84 and match to venue coords (~48.30 N, 14.29 E) → "nearest parking machine to your festival event."
- Text/address join: `Standort` streets overlap the central-Linz festival zone; can be tied to venue addresses directly without any CRS work.
- App idea: festival companion that shows paid-parking options + tariff zone (30/90/180 min) and NFC-payment flag near each venue/time slot.

## Caveats
- Shapefile-only — needs pyshp/ogr/QGIS to open; no CSV/JSON/GeoJSON convenience format for a hackathon.
- No `.prj`, so raw X/Y are unusable until the CRS is inferred; addresses are the safer join key.
- Static 2023 snapshot, not maintained ("notPlanned") — fine for locations, but tariffs/machines may have shifted by Sept 2026.
