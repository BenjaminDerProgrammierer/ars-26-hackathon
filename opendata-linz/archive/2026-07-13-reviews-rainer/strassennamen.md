# Straßennamen und deren Bedeutung

**Verdict:** ✅ Recommended — rich, Wikidata-linked street-name lore, perfect for storytelling walks; only friction is that it carries no coordinates.
**Catalog:** https://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6
**Format / License / Last updated:** 2× CSV (UTF-8, BOM), CC BY 4.0, distribution modified 2025-03-07 (annual update cadence).

## What the data actually contains
- **Strassennamen-aktuell.csv**: ~1,211 current Linz streets. Fields: ID, Name, KG (cadastral district), Beschreibung (rich German prose: location + naming history), Link, Wikidata ID + Link (street), Benannt nach (person/thing), Wikidata Person ID/Link/Name/Geschlecht/Beruf/Geburtsdatum/Sterbedatum.
- **Strassennamen-historisch.csv**: ~369 historical/renamed streets. Adds "Aktuelle Straße" (current successor name), Jahr der Benennung / Jahr der Löschung (naming/deletion year), gender flag. Captures e.g. Nazi-era renamings (Adolf-Hitler-Platz 1938–1945).
- Descriptions are genuinely narrative — dates, biographical detail, street geometry described in words.
- Wikidata columns are populated for many but not all rows (person biographical enrichment where a public figure is the namesake).
- **No geometry / coordinates** — streets are identified only by name + cadastral district.

## Relation to the Ars Electronica dataset
- **Text join on venue address**: Ars venues carry street addresses; match the street token against `Name` to attach the naming story to a venue's location — "you are standing on Adalbert-Stifter-Platz, named after…".
- **Storytelling walks between venues**: chain streets along a route between festival venues, surfacing the Beschreibung + Wikidata bio for a self-guided audio/AR tour.
- **Semantic/thematic links**: namesake professions (writer, journalist, politician) and gender data enable themed walks (e.g. streets named after artists/women) tied to festival categories.
- **Historical layer**: contrast current vs. renamed streets near venues as a "hidden history of Linz" narrative overlay.

## Caveats
- **No coordinates**: any map placement requires geocoding street names externally (or matching to another Linz street-geometry dataset); pure spatial proximity join to venue WGS84 points is not possible out of the box.
- Wikidata enrichment is sparse for streets named after non-notable locals or non-person things (Ackerlweg → empty).
- Descriptions are German only; EN storytelling needs translation.
- Address matching needs normalization (Straße/Gasse/Platz suffixes, umlauts) — mild ETL friction but no blocker.
