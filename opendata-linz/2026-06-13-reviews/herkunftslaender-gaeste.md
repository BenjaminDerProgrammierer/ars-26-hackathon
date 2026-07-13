# Herkunftsländer der Gäste von Beherbergungsbetrieben

**Verdict:** ✅ Recommended — clean, country-keyed tourism origin data that maps directly onto artist countries, updated through 2024.
**Catalog:** https://www.data.gv.at/katalog/datasets/e7b92bb8-75e4-41ac-8b78-b43e25734e0d
**Format / License / Last updated:** CSV (semicolon-separated, ISO-8859-1 encoded); CC BY 4.0; newest vintage 2024 (per-year distributions from 2005 through 2024).

## What the data actually contains
- One CSV per year; the newest is `thdg_2024.csv`. ~58 data rows each, one per country/region of guest origin.
- Columns: `ständiger Wohnsitz der Fremden` (country of residence), then `Fremdenmeldungen` (guest arrivals) and `Übernachtungen` (overnight stays), each split into 4 quarters — 8 numeric columns.
- Rows are German country names (Österreich, Deutschland, Belgien, China 2), Australien, ...) plus aggregate rows (Ausland, "darunter Wien", "Arab. Länder in Asien").
- Values are well populated and plausible (e.g. 2024 Deutschland/Ausland totals in the tens of thousands). Long consistent time series 2005–2024.
- Encoding is Latin-1, not UTF-8 — needs `iconv -f ISO-8859-1` to read umlauts correctly.

## Relation to the Ars Electronica dataset
- **Country join:** the Ars contacts table has 240 artists with country codes. Map artist ISO country → German country name here to compare "where artists come from" vs. "where tourists/overnight guests come from" in Linz.
- **Seasonal overlay:** the festival runs in September (Q3). The Q3 `Übernachtungen`/`Fremdenmeldungen` columns give the tourist backdrop for the exact festival quarter — an app could show, per country, both festival artist presence and typical Q3 visitor volume.
- App idea: a map/ranking contrasting artistic representation with tourism flows by nationality, highlighting over/under-represented origins.

## Caveats
- Requires a name↔ISO-code mapping (German names, some with footnote markers like "China 2)", "Frankreich (inkl. Monaco)") to join against Ars country codes — light preprocessing.
- Latin-1 encoding and semicolon delimiter (German-locale CSV) must be handled explicitly.
- Aggregate rows (Ausland, "darunter Wien") are mixed with country rows and must be filtered out.
- Annual/quarterly, city-level only — no venue geometry, so no spatial join to venue coordinates; relation is purely by country and by quarter/season.
