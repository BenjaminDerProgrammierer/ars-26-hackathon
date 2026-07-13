# Stadt Linz open data: hackathon shortlist

Review date: 2026-07-13

## Result

All 820 entries in the nine-page Stadt Linz Atom feed were parsed and reviewed. The
companion file [`linz-dataset-review.csv`](linz-dataset-review.csv) contains every
entry and marks 19 as **A (recommended)**, 13 as **B (interesting/supporting)**,
and the remaining 788 as unselected.

The 820 entries are not 820 distinct subjects. They include 513 budget/annual-
account tables, 49 council minutes or agenda records, and many separate CSV and
PDF editions of the same data. Selection therefore considered both individual
records and useful multi-dataset bundles.

## Best project directions

### 1. Linz urban forest explorer

**Dataset:** [Baumkataster](https://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d)

This is the strongest single dataset in the catalog: current CSV, GPS coordinates,
species/genus, dimensions, a long snapshot history, Wikidata identifiers, and a
CSVW schema. It can support a tree explorer, species-diversity analysis, canopy
proxy, maintenance prioritization, neighborhood comparisons, or a walking game.

**Caveat:** crown diameter is useful but is not a measured shade or heat value.

### 2. Roofs for solar and green infrastructure

**Datasets:** [Solar and green-roof potential](https://www.data.gv.at/katalog/datasets/76c1f7fe-a82a-4ea3-87bb-23e83f9e3e0a),
[3D city data LoD2 2022](https://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f)

Build a roof-level opportunity finder, neighborhood potential dashboard, or 3D
scenario viewer. The combination is visually strong and has an obvious climate
story. The roof layer responded as SHP; the 3D catalog supplies GML/DXF tile data
and a tile-index CSV.

**Caveat:** GIS conversion and tiled 3D ingestion add setup time; the source model
states roughly +/-2 m accuracy and its announced refresh is not visible in this
catalog record.

### 3. Neighborhood change atlas

**Datasets:** [Statistical district boundaries](https://www.data.gv.at/katalog/datasets/fb11bd08-3c83-44fe-aeb0-7f1bffaedf65),
[age structure by district](https://www.data.gv.at/katalog/datasets/ebb9e5f3-33ea-41ab-a2a6-c277c40d35df),
[main-residence population](https://www.data.gv.at/katalog/datasets/46f16b2d-cd9a-4adb-b55d-cea8de01780f),
[open construction projects](https://www.data.gv.at/katalog/datasets/27a1b464-a2b8-4c2f-9cc0-f7c3ba776885)

These provide the best joinable analytical bundle: district geometry, annual age
structure, population, and a housing-development time series. Suitable outputs
include service-demand forecasts, family/senior accessibility, neighborhood
profiles, and a story map of demographic and building change.

**Caveat:** verify join keys and the 2014 boundary change before combining years.

### 4. Accessible everyday Linz

**Datasets:** [public toilets](https://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1),
[drinking fountains](https://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513),
[playgrounds](https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359),
[AEDs](https://www.data.gv.at/katalog/datasets/866e3d0b-531b-42a0-a82a-3f36dd02b368),
[kindergartens](https://www.data.gv.at/katalog/datasets/fa02a3b3-deaf-49c2-8276-ed0393e61574),
[nurseries](https://www.data.gv.at/katalog/datasets/f35b2a10-4d8b-40f3-9eb7-15d84c2f7f58),
[after-school care](https://www.data.gv.at/katalog/datasets/1ac8b693-987f-47bd-ac7b-f432b01a04a3)

Create a practical map or route planner for families, wheelchair users, older
people, or hot days. Toilet data is particularly good because it includes opening
hours, accessibility, Eurokey, and changing-table attributes.

**Caveat:** several layers date from 2022-2023. Never present AED or accessibility
locations as operational truth without fresh verification.

### 5. Public-transport network explorer

**Dataset:** [LINZ AG lines, paths and stops 2025](https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025)

The WGS84 GML layers are usable for a transit map, stop-coverage analysis,
first/last-mile scoring, or comparison with neighborhood demographics.

**Caveat:** this is static network geometry, not real-time vehicle data. The older
EFA record warns that its XML interface was expected to be retired in favor of
GTFS or NeTEx, so do not build on that legacy URL.

### 6. Searchable civic memory

**Datasets:** [2026 council transcripts](https://www.data.gv.at/katalog/datasets/gemeinderatsprotokolle-2026)
and the corresponding plain-text records for 2014-2025 in the inventory

Build semantic search, topic timelines, promise tracking, named-entity links, or
plain-language meeting summaries. The long text corpus is unusually hackable and
does not require PDF extraction for most recent years.

**Caveat:** summaries need citations back to meeting and passage; political text
requires neutral presentation and human verification.

### 7. What is happening in Linz?

**Datasets:** [Linztermine events](https://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed),
plus the separate place, organizer, and keyword feeds in the inventory

The XML interface supports an event recommender, personalized calendar, cultural
accessibility map, or "near me now" prototype. This is one of the few catalog
sources with an application-like live interface rather than annual statistics.

**Caveat:** inspect event completeness and licensing of any linked images before
using them.

### 8. Streets as a city knowledge graph

**Dataset:** [street names and their meanings](https://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6)

Current and historic street names plus Wikidata links enable a history explorer,
walking tour, entity graph, or analysis of whom and what the city commemorates.
This is compact enough to finish in a short hackathon and rich enough for an
excellent interface.

### 9. Democracy map

**Datasets:** [electoral precinct boundaries](https://www.data.gv.at/katalog/datasets/09660c57-9e8c-4ac5-bd2f-32f3c6961f72),
[National Council election results](https://www.data.gv.at/katalog/datasets/5f125543-f032-46e1-901d-05cd7b5678e6)

Join boundaries with the catalog's machine-readable mayoral, municipal, state,
national, presidential, and European election series for turnout and result maps.

**Caveat:** precinct boundaries change by election; match every result to the
correct year's geometry and avoid ecological claims about individual voters.

### 10. City change detector

**Datasets:** [2019 orthophotos](https://www.data.gv.at/katalog/datasets/cbd03782-d8cd-49de-a038-9ce7bd1591ce),
older orthophoto records (1988, 1998, 2004, 2008, 2009, 2011, 2016), and
[open construction projects](https://www.data.gv.at/katalog/datasets/27a1b464-a2b8-4c2f-9cc0-f7c3ba776885)

The unusually long image history could power before/after sliders, land-cover
change detection, or a visual development timeline.

**Caveat:** TIFF volumes, alignment, and imagery processing make this a higher-risk
weekend project than the CSV-based ideas.

### 11. Transparent city money

**Datasets:** [subsidies and transfers 2021](https://www.data.gv.at/katalog/datasets/5776d96d-b693-4df6-a8ee-ecff1e04a2fc),
[2026 budget](https://www.data.gv.at/katalog/datasets/9402f665-3b1e-401b-9454-f947b7cc7ba9)

Possible products include a recipient network, plain-language budget explorer,
category comparison, or "where does a euro go?" interface. The many historical
budget records provide depth, but require substantial schema normalization.

### 12. Urban resilience trends

**Datasets:** [2026 public-order incidents](https://www.data.gv.at/katalog/datasets/vorfallstatistik-ordnungsdienst-2026),
[fire-service callouts](https://www.data.gv.at/katalog/datasets/04381e75-01ad-414f-964a-163cc4e000c2),
[road injuries](https://www.data.gv.at/katalog/datasets/fe536a32-76b8-491e-9686-50e431a3309e)

These can support longitudinal category dashboards and public-service explainers.
They rank below the map-ready sources because they are aggregated statistics, not
geocoded individual incidents.

### 13. Live environmental pulse

**Dataset:** [air-quality and meteorological measurements](https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6)

The station JSON can power a live air, heat, wind, and rain dashboard or feed a
healthier-route prototype. The catalog describes measurements including PM,
nitrogen oxides, ozone, temperature, humidity, wind, and solar radiation, varying
by station.

**Caveat:** only five of the nine cataloged URLs returned HTTP 200 on review. The
URLs for `L001`, `L002`, `L003`, and `C001` returned HTTP 400, while `S184`,
`S425`, `S415`, `S416`, and `S431` worked. Handle missing stations explicitly and
ask the publisher whether station codes changed.

## Interesting supporting data

- [recycling-container locations](https://www.data.gv.at/katalog/datasets/162398d4-b2ea-4674-83d4-2c1d851a521a)
  for a circular-city finder
- [public Wi-Fi locations](https://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2)
  and [usage](https://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673),
  although usage only lists the first half of 2022
- [electricity generation](https://www.data.gv.at/katalog/datasets/928150db-c4e7-4d2a-9dd6-42374a4f1dd7)
  for a long-term energy story
- [dog zones](https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e)
  and [edible hedges](https://www.data.gv.at/katalog/datasets/d587eab4-6c96-4d48-978d-2d5d12c57f15)
  for lighter public-space prototypes

## Review method

1. Downloaded Atom pages 0 through 8 with `limit=100` and confirmed entry counts
   of 100 on pages 0-7 and 20 on page 8.
2. Parsed every title, description, publication/update date, enclosure format,
   dataset URL, and resource URL with a namespace-aware XML parser.
3. Preferred machine-readable, joinable, geospatial, current or longitudinal data
   with a feasible prototype and public value.
4. Down-ranked PDF-only duplicates, narrow accounting tables, stale snapshots,
   non-geocoded aggregates, and sources with no resources.
5. Tested representative A-tier resource URLs. Tree, transit, street, events,
   toilet, age, construction, and solar resources returned usable content; the
   air-quality API worked for five of nine cataloged station URLs.

The reproducible parser is [`analyze_linz_catalog.py`](analyze_linz_catalog.py).
The Atom XML pages themselves are not committed because they are generated source
downloads; rerun the parser after fetching pages to refresh the inventory.
