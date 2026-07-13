# Trinkbrunnen Standorte

**Verdict:** ✅ Recommended — genuinely useful drinking-fountain locations for an outdoor September festival, with one solvable coordinate-CRS gotcha.
**Catalog:** https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513
**Format / License / Last updated:** CSV (UTF-8), CC-BY 4.0, publisher Stadt Linz (open.commons@linz.at); metadata modified 2023-07-04. Three distributions; the "current" continuously-overwritten file is `Trinkbrunnen.csv` on data.linz.gv.at.

## What the data actually contains
- Fetched `Trinkbrunnen.csv`: 132 fountain rows, 24 columns, semicolon-free comma CSV with quoted fields.
- Three fountain classes by ID prefix: **TB** (86 real drinking fountains / Trinkwasserentnahmestellen), **BoP** (13 ornamental fountains suitable for drinking), **BmP** (30 ornamental, NO drinking water), plus a couple of malformed/blank rows.
- Rich attributes: `Aufstellungsort` (location name, e.g. "Spielplatz Klausenbachstr."), `Brunnenart`, `In_Betrieb` (ja/nein), `Trinkwasserbetrieb`, `Wasseranalyse`, `Betriebszeit` (operating hours like "9:00 bis 21:00"), plus lots of maintenance notes.
- Coordinates: `Koordinaten_Brunnen_x/_y` populated for 84 of 132 rows (all TB + BoP have them; the empty ones are BmP ornamental, irrelevant here). Values like y=71470,923 / x=355779,329 (comma = decimal).
- Drinking fountains operate **April–October** per the description → in service during the September festival.

## Relation to the Ars Electronica dataset
- **Spatial proximity join**: map each fountain to the nearest festival venue (venues carry WGS84 coords clustered ~48.30 N, 14.29 E). App: "nearest public drinking water to this venue/event."
- **Temporal fit**: fountains run April–Oct and carry `Betriebszeit` hours — cross-check against the festival calendar (Sept, day/evening time slots) to show which fountains are actually flowing during an event.
- Combined use: an outdoor-comfort/wayfinding layer on a festival map (hydration stations near open-air venues), useful for a warm-month event.

## Caveats
- **CRS mislabel (main friction)**: metadata says coordinates are EPSG:4326, but the values are clearly a projected/local Austrian grid (5–6 digit meters, not lat/lon degrees). They must be reprojected before overlaying on the WGS84 venue coords; the true EPSG must be inferred (likely a GK/MGI variant) since the label is wrong.
- Comma decimal separator inside quoted coordinate fields — parse carefully.
- All text is German only; column headers have trailing spaces and umlauts.
- Metadata last modified 2023; fountain locations are stable, so staleness is low-risk, but there is no guarantee the "current" file was refreshed for 2026.
