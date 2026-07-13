# Elektronische Fahrplanauskunft der LINZ AG LINIEN (Sollzeit)

**Verdict:** ✅ Recommended — live public EFA API (no registration, JSON output) that already knows "Ars Electronica Center" as a named POI.
**Catalog:** https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13
**Format / License / Last updated:** EFA XML/JSON web API (endpoint `https://www.linzag.at/static/…`); metadata CC-BY 4.0 (plus LINZ AG Linien usage terms at data.linz.gv.at/nutzungsbedingungen); dataset metadata modified 2022-06-03, but the API serves live real-time data (server time 2026-07-13 confirmed in responses).

## What the data actually contains
- The three "distributions" on data.gv.at are only **PDF interface docs** (Schnittstelle + Geokoordinaten). The real payload is the standard Mentz **EFA** journey-planner API, base `https://www.linzag.at/static/`.
- `XML_STOPFINDER_REQUEST` — resolves stops/addresses/POIs. Tested `name_sf=Ars Electronica` → returned POIs "Ars Electronica Center", "Ars Electronica Futurelab / Roof" with coords. HTTP 200, JSON.
- `XML_DM_REQUEST` — departure monitor (Sollzeit + `useRealtime=1`), returns servingLines, departureList, dateTime per stop. Tested against "Hauptplatz" (HTTP 200, resolved multiple stops incl. stopID 60501010).
- `XML_TRIP_REQUEST2` — origin→destination routing (docs show it; not exercised but same live endpoint).
- Covers LINZ AG LINIEN network (tram/BIM lines L001–L003, buses, ÖPNV) across Linz city area.
- Coordinates in responses are a **projected grid** (e.g. `coords:"5447080.00,807309.00"`), not WGS84 lat/lon; the API also accepts/returns geo-coordinates per the Geokoordinaten PDF.

## Relation to the Ars Electronica dataset
- **Spatial + semantic join:** feed each of the 111 venue WGS84 coordinates (or names like "Ars Electronica Center") into StopFinder to find the nearest transit stop — directly connects festival venues to live departures.
- **Time join:** festival calendar (dates/times/durations in Sept 2026) → DM/Trip requests to show "next tram/bus after this event ends" or "how to get to the next venue in time".
- An app could offer per-project "how to get there / when to leave" routing and a live departure board at each festival zone.

## Caveats
- Not a downloadable dataset — it's an API, so hackathon teams must call it live (rate/usage terms apply, CC-BY attribution).
- Response coordinates are a projected grid; teams must use the geo-coordinate parameters/doc to interconvert with the festival's WGS84.
- Departure monitor needs a resolved **stopID** (ambiguous names return a disambiguation point list with empty departures) — a two-step StopFinder→DM flow is required.
- Undocumented endpoint host (`www.linzag.at/static`, gleaned from the PDF, which itself uses `localhost` placeholders); availability isn't SLA-backed.
