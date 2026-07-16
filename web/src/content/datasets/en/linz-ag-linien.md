---
title: "LINZ AG LINIEN — Public Transit"
summary: "A 2025 snapshot of static tram and bus stops, route geometry, and a network graph — no timetable or live data."
provider: "LINZ AG / data.gv.at"
url: "https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025"
group: "linz"
status: "preparation"
order: 4
---

The static 2025 GML layers cover stops, lines, routes, and a network graph in
WGS84 and EPSG:31255 variants. The organizer should convert the WGS84 data to
GeoJSON and verify GML axis order before distribution. Use it for nearest-stop
and network views, not timetable, frequency, disruption, or live-arrival claims;
pair it with a prepared [EFA journey-planner](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13)
adapter, proxy, health check, and cached fallback for scheduled journeys.
