# Open Data Linz – Candidate Datasets for the Ars Electronica Hackathon

**Date:** 2026-07-13
**Source catalog:** [data.gv.at – Publisher "Stadt Linz"](https://www.data.gv.at/publisher?publisher=Stadt+Linz&locale=de)
**Status:** First pass – candidates identified by title/description only; formats, licenses and data freshness not yet verified per dataset.

---

## Goal

Identify Linz open data datasets that can be combined with the [Ars Electronica Festival 2026 dataset](../ars-dataset/) for an AI hackathon. Participants should be able to build interesting apps/websites using open data from both sources.

## How this list was created

The data.gv.at catalog was queried via its RSS search feed filtered to publisher "Stadt Linz" (~820 entries). After removing German/English duplicates and bulk noise, a shortlist was curated by hand. Roughly half of the catalog consists of yearly municipal financial reports (Rechnungsabschluss/Voranschlag 2012–2026) which are not useful for this hackathon.

## Join points offered by the Ars dataset

The festival dataset (546 projects, 240 contacts, 111 locations, 178 calendar slots; festival in September 2026) offers three natural hooks for combining with city data:

1. **Geo-coordinates of venues** – all in Linz, grouped into festival zones (DANUBE TRIANGLE, OK QUARTER, MED CAMPUS, EVENT LOCATIONS)
2. **Event calendar with times** – time slots, durations, languages, ticket requirements
3. **Rich text and categories** – project descriptions (DE/EN), artist names with countries, categories, accessibility notes

---

## Tier 1 – Obvious, high-value matches

| Dataset | Why it fits | Link |
|---|---|---|
| Linztermine – Übersicht über Veranstaltungen | The city's own event calendar – direct thematic twin of the festival calendar. Merge both into "what's on in Linz during festival week", personal planners, non-festival events near venues. | [data.gv.at](http://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed) |
| Linztermine – Orte | Event locations with IDs. The catalog description explicitly notes: **location ID 358 = Ars Electronica Center** – a ready-made join hint. | [data.gv.at](http://www.data.gv.at/katalog/datasets/3cca23c2-2aa6-4421-96db-8b914de62d56) |
| Linztermine – VeranstalterInnen | Organizers with IDs; **organizer ID 7 = Ars Electronica Center**. | [data.gv.at](http://www.data.gv.at/katalog/datasets/9c0a65e3-db8c-4784-98df-b856a9cd3576) |
| Linztermine – Schlagworte | Keyword list (XML) for categorizing city events. | [data.gv.at](http://www.data.gv.at/katalog/datasets/fb08a46d-69ca-4fb0-baac-67557c933341) |
| Linien, Fahrwege und Haltestellen der LINZ AG LINIEN 2025 | Public transit stops, lines and routes. "How do I get from my current event to the next one in time?" is the killer festival app. | [data.gv.at](http://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025) |
| Elektronische Fahrplanauskunft der LINZ AG LINIEN (Sollzeit) | Timetable/journey-planner API (EFA) for departures and routing. | [data.gv.at](http://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13) |
| Luftgüte- und meteorologische Messwerte | Current air-quality and weather measurements (provided by Land OÖ). Pairs with outdoor venues and the festival's environmental themes. | [data.gv.at](http://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6) |
| Baumkataster | Every city-maintained tree with species, height, crown diameter, coordinates. Shaded walking routes between venues in September; green-city visualizations; fits "Negotiating Humanity". | [data.gv.at](http://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d) |
| Historical Stadtpläne (1876, 1910, 1926, 1945, 1962, 1976, 1990, …) | Georeferenced historical city maps. "Then & now" overlays along festival routes – strong artistic/humanities angle for an Ars audience. | e.g. [1876](http://www.data.gv.at/katalog/datasets/a7bf6e72-6e5c-4973-abce-e37626b3aef7), [1945](http://www.data.gv.at/katalog/datasets/fd2d275e-e145-4c43-8957-8a52cb9e6fa1) |
| Orthofotos (1988–2021, several vintages) | Georeferenced aerial photos; complements the historical maps for time-travel visualizations. | e.g. [1988](http://www.data.gv.at/katalog/datasets/162fda5a-c708-4b41-be5f-2725f175e2b0), [2019](http://www.data.gv.at/katalog/datasets/cbd03782-d8cd-49de-a038-9ce7bd1591ce) |
| 3D Geodaten Level of Detail 2 (2022) | 3D building models of Linz. 3D festival maps, venue fly-throughs, Deep-Space-style visualizations. | [data.gv.at](http://www.data.gv.at/katalog/datasets/d0500244-6b9e-4d3c-9def-70703c013b3f) |

## Tier 2 – Good supporting layers for festival companion apps

| Dataset | Why it fits | Link |
|---|---|---|
| Öffentliche WC-Anlagen Standorte | Includes opening hours, accessibility, Eurokey, changing tables – comfort layer around venues. | [data.gv.at](http://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1) |
| Trinkbrunnen Standorte | Public drinking fountains – valuable for a September outdoor festival. | [data.gv.at](http://www.data.gv.at/katalog/datasets/ee7668cf-46bc-4246-a6fa-4adfdb52a513) |
| Defibrillatoren Standorte | Safety layer (source: Red Cross). | [data.gv.at](http://www.data.gv.at/katalog/datasets/866e3d0b-531b-42a0-a82a-3f36dd02b368) |
| Behindertenstellplätze Standorte 2022 | Accessible parking – combines with the festival's accessibility info fields into an accessibility-first festival guide. | [data.gv.at](http://www.data.gv.at/katalog/datasets/9c01fb76-047e-47a9-be70-6e883daa92c1) |
| Kurzparkzonen Standorte 2022 | Short-term parking zones and fee-zone boundaries. | [data.gv.at](http://www.data.gv.at/katalog/datasets/bb992195-d827-48d4-a676-f3d680840a1c) |
| Parkscheinautomaten Standorte 2023 | Parking-ticket machine locations. | [data.gv.at](http://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888) |
| Hotspot – Standorte (+ Nutzungszahlen) | Free public WiFi locations near venues; usage numbers as bonus stats. | [Standorte](http://www.data.gv.at/katalog/datasets/b2068d46-de7f-4a22-a563-4dea59b1e6f2), [Nutzung](http://www.data.gv.at/katalog/datasets/d849807f-d313-45fb-a7b6-af3f726a1673) |
| Beherbergungsbetriebe (all star categories) | Hotels/accommodation incl. guest and overnight-stay counts – "stay near your festival schedule". | [Übersicht](http://www.data.gv.at/katalog/datasets/29b3204e-49e8-4728-9cff-9447f1b6c29e) |
| Herkunftsländer der Gäste von Beherbergungsbetrieben | Tourism origin statistics – pairs with artist countries in the contacts DB ("where do artists vs. tourists come from"). | [data.gv.at](http://www.data.gv.at/katalog/datasets/e7b92bb8-75e4-41ac-8b78-b43e25734e0d) |
| Digitaler Stadtplan (TMS) / WMTS der Stadt Linz | City-hosted base-map tiles – teams don't depend on external tile providers. | [TMS](http://www.data.gv.at/katalog/datasets/c0df0382-e517-44c6-8863-16008bb6d2d5), [WMTS](http://www.data.gv.at/katalog/datasets/8f057721-c4f7-4979-9fe0-22d55827477a) |

## Tier 3 – Creative / quirky angles (good for hackathon diversity)

| Dataset | Why it fits | Link |
|---|---|---|
| Straßennamen und deren Bedeutung | Meaning of current and historical street names, **incl. Wikidata links** – storytelling walks between venues. | [data.gv.at](http://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6) |
| Hecken die Schmecken | Public berry-bush hedges in parks – playful "snack map" for festival walks. | [data.gv.at](http://www.data.gv.at/katalog/datasets/d587eab4-6c96-4d48-978d-2d5d12c57f15) |
| Hundezonen (Verbots-/Freilaufzonen) | Dog zones – "festival with dog" companion. | [data.gv.at](http://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e) |
| Spielplätze Standorte 2023 / Spielplätze und Sportanlagen | Playgrounds incl. equipment – "festival with kids" companion. | [2023](http://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359), [Sportanlagen](http://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7) |
