# Linz Open Data usability for the Ars Electronica Hackathon

**Date:** 2026-07-13
**Status:** Consolidated recommendation, updated after publisher fixes on 2026-07-15
**Scope:** All 820 Stadt Linz catalog records, 25 hands-on dataset reviews, and the
live Ars Electronica Festival 2026 export

## Executive conclusion

Linz Open Data is well suited to this hackathon **as a curated and prepared data
bundle**, not as an unfiltered catalog exercise.

The best combinations use one of four actual join keys in the festival data:

1. venue coordinates and addresses;
2. the 8-13 September 2026 calendar;
3. venue and organizer names;
4. artist country codes and project categories.

The strongest sources are Linztermine, Baumkataster, public transport, historical
maps/street histories, and selected visitor-service locations. They offer enough
depth for useful apps and enough visual character for Ars Electronica projects.

The practical constraint is data preparation. Several otherwise strong datasets
use GML, Shapefile, CityGML, GeoTIFF, ISO-8859-1, German comma decimals, or
EPSG:31255. Live APIs have availability and schema quirks. Several catalog defects
found in the original review were repaired on 2026-07-15; see the
[affected final verdicts](../README.md). A small organizer-made
normalization layer will save teams from spending the event on GIS and encoding
work.

## What the incoming festival data changes

The live festival export contains 546 projects, 240 contacts, 111 locations, and
178 calendar rows. Its join surface is real but needs cleansing before city data
is attached:

- 108 of 111 location rows have coordinates, representing 52 unique coordinate
  pairs because rooms and floors commonly inherit building coordinates.
- Six Ars Electronica Center child locations contain the outlier coordinate
  `48.09619, 14.84447`; the likely intended building coordinate is near
  `48.309619, 14.284447`, but this must be fixed from source knowledge.
- Location IDs are incomplete: 26 rows have no ID, and 21 rows participate in six
  duplicated ID values.
- Calendar IDs are not usable as row keys: 13 are missing, and 152 rows
  participate in 29 duplicated values.
- All 173 `calendar.Linked Projects` references resolve after normalizing the
  project's prefixed ID to its hash suffix.
- Only 64 of 81 project-to-location references resolve directly; 17 do not.
  Calendar-to-location references have 74 unresolved references out of 166.
- Only 81 projects carry a direct location link and 47 a direct calendar link.
  Child projects often rely on parent context, so apps need hierarchy inheritance.
- 374 of 546 projects and 172 of 178 calendar rows are `pending`. The organizer
  must publish a clear rule for which records are safe for public demos.

These issues do not make the festival export unusable. They mean the cleaned
festival export must be the stable hub for spatial and temporal joins.

## Recommended portfolio

### 1. City and festival calendar bundle

**Verdict: Core dataset; prepare a JSON snapshot and a live refresh helper.**

Use:

- [Linztermine events](https://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed)
- [locations](https://www.data.gv.at/katalog/datasets/3cca23c2-2aa6-4421-96db-8b914de62d56)
- [organizers](https://www.data.gv.at/katalog/datasets/9c0a65e3-db8c-4784-98df-b856a9cd3576)
- [tags](https://www.data.gv.at/katalog/datasets/fb08a46d-69ca-4fb0-baac-67557c933341)

The live event query returned 187 city events for 5-14 September 2026. Location
ID 358 is the Ars Electronica Center and organizer ID 7 is Ars Electronica Linz.
This is the strongest temporal and entity-level match in the catalog.

Good projects: combined agenda, conflict/gap finder, family/free-event planner,
same-venue discovery, and city-culture recommendation.

Preparation: convert XML/CDATA and ISO-8859-1 to UTF-8 JSON; always request an
explicit date range; normalize names and addresses. Locations do not include
coordinates, so retain the festival coordinates after matching.

### 2. Green routes and urban nature

**Verdict: Best raw downloadable dataset.**

Use [Baumkataster](https://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d).

The current export has about 27,000 city-maintained trees, WGS84 coordinates,
species, height, crown diameter, and trunk circumference. Its July 2026 export is
current and joins directly to cleaned venue coordinates.

Good projects: tree-lined route scoring, shade proxies, green-venue comparison,
species exploration, and botanical storytelling.

Preparation: parse semicolon CSV and missing-value markers. Describe shade as an
estimate from tree/crown data, not a measured thermal-comfort claim.

### 3. Festival mobility

**Verdict: Core prepared bundle; do not offer only the raw files.**

Use:

- [LINZ AG stops, lines and paths 2025](https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025)
- [EFA journey planner](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13)

The static source contains 748 stops and route/graph geometry in WGS84. The EFA
service currently resolves the Ars Electronica Center and returns departures and
journey-planner responses without registration.

Good projects: nearest stop, leave-by guidance between events, live departure
boards, itinerary feasibility, and low-car festival routing.

Preparation: publish stops/routes as GeoJSON; provide a documented
StopFinder-to-departure example and a server-side proxy or cache. Treat EFA as an
external service without an SLA, retain LINZ AG's additional usage terms, and do
not describe static route geometry as timetable data.

### 4. Historical and narrative Linz

**Verdict: Highly suitable after asset preparation.**

Use:

- [historical city maps](https://www.data.gv.at/katalog/datasets/a7bf6e72-6e5c-4973-abce-e37626b3aef7)
- [street names and meanings](https://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6)

Historical maps are available in WGS84/Web Mercator and the street dataset has
about 1,580 current/historical names, narrative descriptions, renaming history,
and Wikidata links. Festival venue addresses provide the bridge.

Good projects: then-and-now venue sliders, hidden-history walks, commemorative
street analysis, audio tours, and Wikidata-linked city stories.

Preparation: pre-tile/downsample selected maps; normalize street names from venue
addresses; optionally provide English machine translations while retaining the
German source text.

### 5. Inclusive visitor map

**Verdict: Useful prepared bundle; label freshness and safety limits.**

Use:

- [public toilets](https://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1)
- [drinking fountains](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513)
- [accessible parking](https://www.data.gv.at/katalog/datasets/9c01fb76-047e-47a9-be70-6e883daa92c1)
- [playgrounds and sports facilities](https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7)

These layers support nearest accessible toilet, Eurokey/changing-table filters,
hydration stops, accessible parking, and family breaks. They complement the
festival's venue, schedule, and visitor-information fields.

Preparation: publish one normalized WGS84 GeoJSON/CSV bundle. WC and fountain
coordinates are EPSG:31255; accessible parking is Shapefile in a projected CRS;
playground CSV is Latin-1 but already contains WGS84 WKT. The fountain catalog's
former WGS84 error was corrected on 2026-07-15, but its axis convention should
still be validated during conversion.

Freshness is 2022-2024 and opening hours are free text. Present the result as a
prototype directory, not an authoritative accessibility guarantee.

### 6. Live environmental context

**Verdict: Recommended with endpoint health checks and fallback.**

Use [air-quality and meteorological measurements](https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6).

The rolling JSON data can add air, temperature, wind, and rain context to outdoor
events. A fresh 2026-07-15 check returned HTTP 200 for `S184`, `S425`, `S415`,
`S416`, and `S431`. `L001`, `L002`, `L003`, and `C001` returned HTTP 400 with a
message that no measurements existed in the requested rolling 24-hour period.

Preparation: publish station coordinates separately, parse epoch milliseconds and
German comma-decimal values, monitor each endpoint, and cache the last successful
response. The API exposes only a rolling 24-hour window.

### 7. Artists and visitor origins

**Verdict: Recommended for analytical/storytelling projects.**

Use [guest origin countries](https://www.data.gv.at/katalog/datasets/e7b92bb8-75e4-41ac-8b78-b43e25734e0d).

The 2005-2024 quarterly time series joins to 238 festival contacts with a country
value. It can compare artistic representation with tourism patterns during Q3.

Preparation: convert Latin-1, remove aggregate/footnote rows, and provide a German
country-name to ISO code crosswalk. The result is contextual, not a causal measure
of festival visitors.

### 8. Connectivity around venues

**Verdict: Supporting dataset with a visible 2022 freshness warning.**

Use [public Wi-Fi locations](https://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2)
and [usage](https://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673).

About 134 WGS84 points include direct matches such as AEC Dach, Brucknerhaus, and
Hauptplatz. Usage covers only January-July 2022 and should not be presented as
current crowd information.

### 9. 3D festival city

**Verdict: Showcase track only; organizer preprocessing required.**

Use [3D city data LoD2 2022](https://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f).

The 834-tile CityGML/DXF model can produce compelling venue fly-throughs, but raw
CityGML 1.0, textures, EPSG:31255, and folder-based downloads are too much setup
for most teams.

Preparation: select festival-area tiles and publish glTF/3D Tiles with corrected
venue anchors. Source imagery is from 2019-2021 and stated accuracy is about +/-2 m.

## Conditional or secondary sources

| Dataset | Decision | Reason |
|---|---|---|
| Orthophotos 1988-2021 | Prepared showcase only | Roughly 11.8 GB for the 2019 vintage; TIFF/GK reprojection and web tiling required. |
| Defibrillators | Prototype-only supporting layer | Clean WGS84 data, but 2022 safety-critical locations must not be presented as current emergency guidance. |
| Parking-ticket machines | Do not prepare by default | The missing `.prj` was added and declares EPSG:31255, but the static layer still has limited thematic value. |
| Short-term parking zones | Secondary utility | Valid but projected Shapefile-only data from 2022. |
| Digital city map TMS/WMTS | Do not prepare | Non-standard 2016 GIF tile scheme adds no attributes; basemap.at/OSM is simpler. |
| Hecken die Schmecken | Optional garnish | 26 named locations, no coordinates, 2022 vintage, and uncertain plant details. |
| Linztermine tags | Helper only | Useful crosswalk of about 30 German terms, not a standalone dataset. |
| Hundezonen | Optional prepared layer | Public access is repaired and the `.prj` declares EPSG:31255; use only as a dated prototype, not current legal guidance. |
| Baulandreserven 2022 | Optional prepared layer | The incorrect 2012 links were replaced by a complete 2022 EPSG:31255 Shapefile; land availability remains time-sensitive. |

## Exclude from the hackathon bundle

| Dataset | Reason |
|---|---|
| Beherbergungsbetriebe | Misleading title for this use: city-wide monthly totals, not hotel names or locations. |
| Altstoffsammelstellen and Altstoffsammelzentren | Both advertised CSVs redirect to Linz AG login. The publisher plans to retire the catalog records rather than restore open access. |
| Most municipal budget/account records | 513 of 820 catalog entries are narrow annual budget/account tables. They overwhelm discovery and require schema normalization without a strong festival join. |

## Organizer preparation checklist

1. Publish a cleaned festival export with canonical project/location/calendar IDs,
   inherited parent locations, corrected AEC coordinates, and a public-record flag.
2. Provide `linztermine.json`, `linz-transit.geojson`, and
   `linz-visitor-services.geojson` snapshots with source URLs and retrieval dates.
3. Provide a coordinate helper for EPSG:31255 to EPSG:4326 and examples for comma
   decimals, WKT, and axis order.
4. Provide an EFA example/proxy and cached fallback; health-check all nine air
   endpoints immediately before the event and expose station-level failures.
5. Pre-tile a small historical-map area and preconvert selected CityGML tiles for
   an optional visual track.
6. Put `source_updated`, `retrieved_at`, `license`, `attribution`, and
   `prototype_only` fields into every prepared output.
7. Keep raw sources available for advanced teams, but make the prepared bundle the
   default starting point.

## Final ranking

1. Linztermine event/location/organizer bundle
2. Baumkataster
3. Transit geometry plus EFA
4. Historical maps plus street histories
5. Prepared visitor-service/accessibility POIs
6. Live air/weather with fallback
7. Guest origins joined to artist countries
8. Public Wi-Fi locations
9. Prepared 3D city tiles

This ranking balances festival relevance, join quality, prototype feasibility,
data health, and the amount of organizer preparation required.
