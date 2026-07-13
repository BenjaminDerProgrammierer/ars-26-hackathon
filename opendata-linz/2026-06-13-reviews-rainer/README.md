# Reviews: Linz Open Data for the Ars Electronica Hackathon

**Date:** 2026-07-13

This folder contains short reviews of open data datasets published by the City of Linz on [data.gv.at](https://www.data.gv.at/publisher?publisher=Stadt+Linz&locale=de). We checked each candidate to answer two simple questions:

1. **Is the data any good?** Can you actually download it, is it filled with real values, and is it reasonably up to date?
2. **Does it fit our festival data?** Can it be meaningfully combined with the [Ars Electronica Festival 2026 dataset](../../ars-dataset/) (projects, artists, venues and event schedule) — for example via map locations, dates, or matching names?

> These are source-level screening notes. The stricter, portfolio-level decision
> is the [consolidated usability report](../2026-07-13-linz-open-data-hackathon-usability.md),
> which also accounts for festival-export quality, safety/freshness risk, required
> organizer preprocessing, and partial air-API failures observed on 2026-07-13.

For every dataset we downloaded a real sample of the data (not just the catalog description) and wrote a one-page review. Each review lists what the data contains, how it can be combined with the festival data, and any pitfalls.

## How to read the verdicts

| Verdict | Meaning |
|---|---|
| ✅ **Recommended** | Works, contains meaningful data, and combines well with the festival dataset. Safe to offer to hackathon participants. |
| ⚠️ **Borderline** | Usable, but with real friction — e.g. old data, missing map coordinates, or a file format that needs extra conversion work first. Offer only with preparation or a warning. |
| ❌ **Drop** | Not meaningfully usable — e.g. the download is broken or the content is not what the title suggests. |

**Result: 17 recommended, 6 borderline, 2 drop.**

## ✅ Recommended

| Dataset | In short | Review |
|---|---|---|
| Linztermine – Veranstaltungen | The city's public event calendar as a live feed — includes real events during the festival week in September 2026. | [Details](linztermine-veranstaltungen.md) |
| Linztermine – Orte | Directory of ~430 Linz event venues. The Ars Electronica Center has its own entry (ID 358), so festival venues can be matched directly. | [Details](linztermine-orte.md) |
| Linztermine – VeranstalterInnen | Directory of ~1,600 event organizers incl. addresses and websites — Ars Electronica is organizer ID 7. | [Details](linztermine-veranstalterinnen.md) |
| LINZ AG LINIEN 2025 (Linien & Haltestellen) | All 748 tram/bus stops and routes in Linz with map coordinates — the basis for "how do I get to my next event?" | [Details](linz-ag-linien-2025.md) |
| Elektronische Fahrplanauskunft (EFA) | Live journey-planner service of LINZ AG — works without registration and even knows "Ars Electronica Center" as a destination. | [Details](efa-fahrplanauskunft.md) |
| Luftgüte & Wetter | Live air-quality and weather readings from 9 measuring stations in Linz, updated every half hour. | [Details](luftguete-messwerte.md) |
| Baumkataster | All ~27,000 city-maintained trees with species and map position — current data, great for "shady route" ideas in September. | [Details](baumkataster.md) |
| Historische Stadtpläne | Historical city maps (1876–1990) that can be laid over today's map — "Linz then & now" along festival routes. | [Details](historische-stadtplaene.md) |
| 3D Geodaten LoD2 (2022) | 3D building models of the whole city — impressive 3D festival maps, but needs some technical setup. | [Details](3d-geodaten-lod2-2022.md) |
| Öffentliche WC-Anlagen | ~40 public toilets incl. opening hours and accessibility info. | [Details](wc-anlagen.md) |
| Trinkbrunnen | 86 public drinking fountains — useful for a September outdoor festival. | [Details](trinkbrunnen.md) |
| Defibrillatoren | 282 defibrillator locations with map coordinates — a ready-made safety layer around venues. | [Details](defibrillatoren.md) |
| Parkscheinautomaten | 269 parking-ticket machines with street addresses in central Linz. | [Details](parkscheinautomaten.md) |
| WLAN-Hotspots | ~134 free public WiFi spots incl. usage statistics — the Ars Electronica Center itself is one of them. | [Details](hotspots.md) |
| Herkunftsländer der Gäste | Tourism statistics: where hotel guests come from, per year up to 2024 — pairs nicely with the artists' countries in the festival data. | [Details](herkunftslaender-gaeste.md) |
| Straßennamen und Bedeutung | ~1,580 current and historical street names with the story behind each name — material for storytelling walks between venues. | [Details](strassennamen.md) |
| Spielplätze und Sportanlagen | ~158 playgrounds and sports facilities with map coordinates — for a "festival with kids" companion. | [Details](spielplaetze.md) |

## ⚠️ Borderline

| Dataset | In short | Review |
|---|---|---|
| Linztermine – Schlagworte | Only a small list of ~30 event category keywords — useful as a helper for the other Linztermine feeds, not on its own. | [Details](linztermine-schlagworte.md) |
| Orthofotos | Aerial photos of Linz from 1988–2021 — visually great, but hundreds of very large image files that need conversion first. | [Details](orthofotos.md) |
| Behindertenstellplätze | 574 accessible parking spots — real, complete data, but delivered in a GIS format that needs a conversion step before use. | [Details](behindertenstellplaetze.md) |
| Kurzparkzonen | Short-term parking zones — same story: solid content, but GIS-only format and coordinate conversion required. | [Details](kurzparkzonen.md) |
| Digitaler Stadtplan (TMS/WMTS) | The city's own base-map tiles work, but use an unusual technical scheme; the "WMTS" entry just points to the national basemap.at. Standard map services are easier. | [Details](stadtplan-tms-wmts.md) |
| Hecken die Schmecken | Charming list of 26 public berry hedges in parks — but without map coordinates and last updated in 2022. | [Details](hecken-die-schmecken.md) |

## ❌ Drop

| Dataset | In short | Review |
|---|---|---|
| Beherbergungsbetriebe | Despite the name, no hotel locations — only city-wide monthly guest totals. Nothing to place on a map or match with venues. | [Details](beherbergungsbetriebe.md) |
| Hundezonen | The download links point to internal city file paths that are not publicly reachable — the data cannot be obtained. | [Details](hundezonen.md) |

## Two things to prepare before the hackathon

1. **Coordinate conversion helper.** Several datasets use the Austrian surveying coordinate system (Gauss-Krüger / EPSG:31255) instead of normal GPS coordinates, and a few even have mislabeled coordinates. A small ready-made conversion script for participants would remove the most common stumbling block.
2. **Don't trust the catalog dates.** Several live data feeds are marked "last modified 2023" in the catalog but actually serve current data (and vice versa: one dataset titled "2023" contained older content). The reviews note the real, observed freshness per dataset.

---

*How these reviews were made: each dataset was checked by an automated review that fetched the catalog metadata and a sample of the actual data, verified download links and formats, and assessed how it can be joined with the Ars Electronica dataset. Reviews are deliberately short. They are a screening pass, not a full data audit.*
