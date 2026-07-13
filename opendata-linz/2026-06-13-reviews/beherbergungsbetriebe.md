# Beherbergungsbetriebe

**Verdict:** ❌ Drop — name is misleading; it is city-wide monthly tourism aggregates, not a list of accommodation establishments, and carries no location data.
**Catalog:** https://www.data.gv.at/katalog/datasets/29b3204e-49e8-4728-9cff-9447f1b6c29e
**Format / License / Last updated:** CSV (semicolon-delimited, Latin-1/Windows-1252 encoding), CC BY 4.0, one file per year 2003–2024 (newest vintage 2024).

## What the data actually contains
- Sampled `gesbbg_2024.csv`: 12 data rows (one per month) + header. Same shape across all 22 annual files.
- Columns: `Monat`, `angekommene Gäste InländerInnen`, `angekommene Gäste AusländerInnen`, `Übernachtungen InländerInnen`, `Übernachtungen AusländerInnen` — i.e. monthly arrivals and overnight stays, split domestic vs. foreign.
- Values are clean, plausible integers (e.g. Sept 2024: 24637 + 25777 arrivals; 46102 + 52232 overnight stays).
- **No per-establishment records, no hotel names, no addresses, no coordinates.** Fully aggregated to the whole city of Linz.
- Encoding is non-UTF-8 (umlauts show as mojibake without transcoding).

## Relation to the Ars Electronica dataset
- No spatial join possible — the shortlist premise ("stay near your festival schedule", check for coordinates) is entirely unmet; there are zero locations.
- Only a trivial temporal/thematic tie: the festival runs September 2026, and one could pull the historical "September" row to give context like "how busy Linz typically is during festival month." That is a single scalar per year, not a real join to the 546 projects / 111 venues.
- No entity, geographic, or country-level join key that maps onto venues, artists, or the calendar.

## Caveats
- Latest year is 2024; no 2025/2026 data, so any "festival month" figure is at best a historical proxy.
- Requires charset transcoding (Latin-1 → UTF-8) before use.
- The dataset title implies an establishment/POI list; it is not — do not shortlist on the assumption that hotel geometries exist.
