# Spielplätze Standorte 2023 / Spielplätze und Sportanlagen

**Verdict:** ✅ Recommended — the "Spielplätze und Sportanlagen" CSV is a clean, geocoded point list ideal for a "festival with kids" companion; the 2023 shapefile dataset is a bonus but hard to use.
**Catalog:** https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7 · https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359
**Format / License / Last updated:** CSV (b77d0b46, semicolon-delimited, Latin-1) + ESRI Shapefile (b5c88eba); CC BY 4.0; CSV distribution modified 2023-03-28 (dataset metadata dates 2017–2022), shapefile modified 2024-06.

## What the data actually contains
- CSV: ~158 rows of playgrounds AND sports facilities. Columns: Anlage (Spielplatz/Sportanlage), Name, Bereich, Bezirksnummer/-name, Stadtteil, Art (e.g. "Beach Volleyball", "Fitnessanlage"), URL, WKT `POINT (lon lat)`, street, PLZ, Ort, Koordinate Nord/Ost, Google-Maps link.
- Coordinates are WGS84 and well populated: a proper `POINT (14.294362 48.318145)` field plus a decimal Google-Maps link, so no fragile parsing needed (the "48 318 145" Nord/Ost columns are just space-grouped decimals).
- All points sit in the Linz city area (~48.2–48.32 N, 14.26–14.38 E), overlapping the festival's central-Linz venue cluster.
- Second dataset (b5c88eba, "Spielplätze 2023") holds per-equipment polygons with fields GUID / SPIELPLATZ (name+address) / GERAETEART (equipment type) — richer detail, but only as `.shp/.dbf/.shx` components.

## Relation to the Ars Electronica dataset
- Spatial proximity join: match playgrounds/sports sites to the 111 venue WGS84 coordinates (parse the festival's comma-decimal strings) → "nearest kid-friendly spot to each venue/exhibition".
- App idea: a family route planner around the September 2026 festival calendar — pair Workshop/Exhibition time slots with the closest playground for breaks.
- Text/district join possible on Bezirk/Stadtteil to group festival zones with local play areas.

## Caveats
- Latin-1 encoding: umlauts are mojibake as raw bytes (Straße → `Stra?e`); decode as ISO-8859-1/Windows-1252, not UTF-8.
- Shapefile dataset (b5c88eba) is essentially unusable as published: its `dcat:accessURL`s are internal `file://///ugl.linz.at/...` UNC paths, not HTTP downloads — the equipment-level detail is not fetchable via the catalog.
- Data is stale (CSV ~2023, metadata to 2022); the record points to newer geodata at the "Spiel- und Sportanlagen der Stadt Linz" dataset. Fine for a hackathon, not authoritative-current.
