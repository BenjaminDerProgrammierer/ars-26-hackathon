# Hotspot – Standorte und Nutzungszahlen

**Verdict:** ✅ Recommended — clean geo + usage data with a direct spatial/name join to festival venues, only caveat is 2022 vintage.
**Catalog:** https://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2 (Standorte) · https://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673 (Nutzungszahlen)
**Format / License / Last updated:** CSV (UTF-8) / CC BY 4.0 / data vintage 2022, metadata modified 2023-05-16.

## What the data actually contains
- **Standorte (Hotspot_Geodaten_2022.csv):** ~134 rows. Fields: Nummer, Latitude, Longitude, Name, Kurztext, Start im Jahr, Ende im Jahr, Stadt, Postleitzahl, Straße, Homepage.
- Coordinates are WGS84 with **comma decimal separator** (e.g. `"48,309727","14,284314"`) — identical format to the Ars venue coordinates.
- Records include full street addresses, all in Linz; first row is literally `AEC Dach (Ars Electronica Center)`.
- **Nutzungszahlen (Hotspot-Auswertung_2022-HJ1.csv):** ~107 rows, monthly client counts Jan–Jul 2022 per hotspot (columns are month dates), keyed by hotspot Name (e.g. `AEC Dach`, `Brucknerhaus`, `Hauptplatz`).
- An older `Hotspot_Geodaten_2011.csv` also exists but the 2022 vintage supersedes it.

## Relation to the Ars Electronica dataset
- **Spatial proximity:** hotspot lat/long joins directly against the 111 venue coordinates (~48.30 N, 14.29 E cluster) — same coordinate format, no reprojection needed. An app could show "free WiFi near this venue."
- **Direct name/semantic match:** hotspot names map onto festival landmarks (AEC/Ars Electronica Center, Brucknerhaus, Hauptplatz, Domplatz), enabling a name-based join too.
- **Usage as a crowd proxy:** monthly client counts hint at foot traffic around venues; an app could surface busiest/quietest connectivity spots for festival planning.

## Caveats
- Data is frozen at **2022** (`accrualPeriodicity: irregular`, no newer distribution); usage covers only H1 2022 — treat numbers as illustrative, not current.
- Standorte↔Nutzungszahlen join is on Name and is only partial: geodata says `AEC Dach (Ars Electronica Center)` while usage says `AEC Dach` (parenthetical suffix must be stripped to match).
- Some geodata rows have empty Nummer and some usage cells are blank (missing months).
- German-only field names/descriptions; decommissioned sites may exist (Ende im Jahr = 0 means still active in samples seen).
