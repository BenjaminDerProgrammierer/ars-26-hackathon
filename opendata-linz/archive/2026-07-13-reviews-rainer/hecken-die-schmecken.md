# Hecken die Schmecken

**Verdict:** ⚠️ Borderline — charming snack-map concept and real Linz park locations, but no coordinates and 4 years stale.
**Catalog:** https://www.data.gv.at/katalog/datasets/d587eab4-6c96-4d48-978d-2d5d12c57f15
**Format / License / Last updated:** Single CSV (UTF-8), CC BY 4.0, distribution dated 2022 ("Hecken die schmecken 2022.csv"); metadata says annual update but nothing newer exists.

## What the data actually contains
- 26 data rows, 3 columns: `Standort` (location/park name), `Beschreibung` (free-text detail), `Art` (berry species).
- Locations are named Linz parks/streets: Baumgärtlstraße, Pulvermühlpark, Volksgarten, Unipark, Freinberg, Pöstlingberg, Bindermichlpark, etc.
- Species: Ribisel (currants), Himbeeren, Brombeeren, Josta, Stachelbeeren, Japanische Weinbeere, Dirndl, etc. — with harvest months (June/July/September).
- NO coordinates — the description explicitly states coordinates "cannot currently be provided". Locations are only free-text names.
- Fields are well-populated and human-readable; species notes are flagged "mit Vorbehalt" (approximate).

## Relation to the Ars Electronica dataset
- Spatial join only via geocoding: park/street names must be geocoded to WGS84, then matched by proximity to the 111 festival venue coordinates (~48.30 N, 14.29 E). Several locations (Volksgarten, Unipark, Freinberg, Pöstlingberg) are within/near central Linz.
- Temporal tie-in: September harvest species (Brombeere/Japanische Weinbeere) overlap the September 2026 festival dates — a "snack while you walk between venues" route.
- App idea: a playful festival walking map that suggests a free-berry-hedge stop between two venues, filtered to what is ripe during the festival.

## Caveats
- No coordinates = mandatory geocoding step (26 rows, feasible by hand or Nominatim, but real friction for a hackathon).
- Only one vintage (2022); 4 years old, plantings and species may have changed (publisher warns species data is unreliable).
- Tiny dataset (26 rows) — a garnish, not a centerpiece.
