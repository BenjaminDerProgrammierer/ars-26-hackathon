# Final Linz Open Data verdicts

The current consolidated assessment is the
[2026-07-16 hackathon usability report](2026-07-16-hackathon-usability.md).

These are the authoritative dataset decisions for the Ars Electronica Festival
2026 hackathon. Each folder preserves Rainer's source verdict and adds the final
decision after the full 820-record catalog review, live endpoint checks, festival
export analysis, GitHub defect handoff, and a 2026-07-16 publisher-directory
delta crawl.

Each dataset page now provides compact frontmatter for status, format, license,
and data vintage, followed by a short factual description, contact information,
and source links. Detailed review evidence remains in the research archive and
consolidated report. Current catalog evidence was reviewed through 2026-07-16;
Orthofotos 2023 and Stadtplan Linz 2025 were added and checked on 2026-07-17.
The affected verdicts link to the publisher fixes and live endpoint checks
recorded in the relevant GitHub issues. The
verdicts also incorporate the 2026-07-15 stakeholder follow-up: the data
provider confirmed several fixes, escalated the air-quality failures, invited
requests for missing or fresher data, and asked the hackathon team to approach
LINZ AG directly for LINZ AG-controlled sources.

## How these verdicts were reached

The final set is the result of three complementary passes, retained in the
[research archive](archive/):

1. A title-and-description scan identified plausible festival combinations
   across the Stadt Linz catalog.
2. Benjamin's reproducible review inventoried all 820 catalog records, marked 19
   records A and 13 B, and surfaced broader directions such as civic memory,
   neighborhood change, elections, solar roofs, and long-term city imagery.
3. Rainer's hands-on review downloaded 25 likely sources and checked their actual
   payloads, formats, identifiers, freshness, endpoint behavior, and join paths to
   the festival export. The consolidated review then applied portfolio-level
   safety and preparation constraints, followed by endpoint and publisher checks
   on 2026-07-15.

Final decisions therefore weigh more than whether a source is interesting or
technically downloadable. A default hackathon dataset also needs a credible join
to festival venues, dates, entities, countries, or categories; a feasible
prototype path; acceptable freshness and interpretation risk; and preparation
cost proportionate to its value. This is why some technically good city datasets
remain optional, pending, or outside the festival portfolio.

## Decision meanings

| Decision | Meaning |
|---|---|
| **USE** | Include in the default hackathon bundle after only light normalization. |
| **USE WITH PREPARATION** | Include only after the organizer supplies a converted snapshot, helper, or fallback. |
| **OPTIONAL** | Offer as an explicitly secondary or experimental source. |
| **DO NOT USE** | Exclude until the stated defect is fixed or the use case changes. |

## Final selection

| Dataset | Final decision | Role |
|---|---|---|
| [Baumkataster](baumkataster/) | **USE** | Current geocoded urban-tree data; strongest standalone source. |
| [Linztermine events](linztermine-veranstaltungen/) | **USE** | City events during the exact festival window. |
| [Linztermine locations](linztermine-orte/) | **USE** | Venue IDs and addresses for joining city and festival events. |
| [Linztermine organizers](linztermine-veranstalterinnen/) | **USE** | Organizer identity bridge, including Ars Electronica ID 7. |
| [Street names and meanings](strassennamen/) | **USE** | Wikidata-linked city storytelling via venue addresses. |
| [Guest origin countries](herkunftslaender-gaeste/) | **USE** | Country join to festival contacts. |
| [Playgrounds and sports facilities](spielplaetze/) | **USE** | Working geocoded CSV plus a repaired 2023 equipment Shapefile. |
| [LINZ AG lines and stops](linz-ag-linien-2025/) | **USE WITH PREPARATION** | Static transit geometry; publish converted GeoJSON. |
| [EFA journey planner](efa-fahrplanauskunft/) | **USE WITH PREPARATION** | Live routing/departures; provide proxy, example, and fallback. |
| [Boudicca.Events public API](boudicca-events/) | **USE WITH PREPARATION** | Snapshot and normalize the multi-source event API; preserve per-source provenance, attribution and a cached fallback. |
| [Historical city maps](historische-stadtplaene/) | **USE WITH PREPARATION** | Pre-tile selected maps for then-and-now interfaces. |
| [Stadtplan Linz 2025](stadtplan-linz-2025/) | **OPTIONAL** | Current municipal cartographic raster; crop, reproject, and optimize one variant before browser use. |
| [3D city data](3d-geodaten-lod2-2022/) | **USE WITH PREPARATION** | Use the 2025 refresh and preconvert selected festival-area tiles; repair stale `/2022/` links in its index. |
| [Accessible parking](behindertenstellplaetze/) | **USE WITH PREPARATION** | Convert/reproject and label 2022 freshness. |
| [Public toilets](wc-anlagen/) | **USE WITH PREPARATION** | Reproject and normalize accessibility/opening-hours data. |
| [Drinking fountains](trinkbrunnen/) | **USE WITH PREPARATION** | EPSG:31255 is now documented; reproject and verify current service status. |
| [Air and weather](luftguete-messwerte/) | **USE WITH PREPARATION** | Five working live stations; monitor and cache. |
| [Linztermine tags](linztermine-schlagworte/) | **USE WITH PREPARATION** | Helper taxonomy only, bundled with Linztermine events. |
| [Defibrillators](defibrillatoren/) | **OPTIONAL** | Prototype-only safety layer; 2022 data is not operational guidance. |
| [Public Wi-Fi](hotspots/) | **OPTIONAL** | Useful venue layer, but usage and locations are from 2022. |
| [Orthophotos](orthofotos/) | **OPTIONAL** | Heavy experimental visual source, now including the 2023 edition, requiring selection and web tiling. |
| [Short-term parking zones](kurzparkzonen/) | **OPTIONAL** | Utility layer with projected Shapefile conversion. |
| [Hecken die Schmecken](hecken-die-schmecken/) | **OPTIONAL** | Small playful garnish with no coordinates and 2022 data. |
| [Dog zones](hundezonen/) | **OPTIONAL** | Public downloads are repaired; convert the dated EPSG:31255 polygons and avoid current-rule claims. |
| [Baulandreserven 2022](baulandreserven-2022/) | **OPTIONAL** | Corrected complete 2022 layer for niche, clearly dated land-use context. |
| [Election data](wahldaten/) | **OPTIONAL** | Strong democracy-map material, but year-specific precinct joins and neutral interpretation require preparation. |
| [Accommodation establishments](beherbergungsbetriebe/) | **DO NOT USE** | Aggregated tourism totals, not hotel locations. |
| [Parking-ticket machines](parkscheinautomaten/) | **DO NOT USE** | CRS is repaired, but the static layer still has low festival value. |
| [Digital city map TMS/WMTS](stadtplan-tms-wmts/) | **DO NOT USE** | Non-standard stale tiles with no joinable data. |
| [Recycling points](altstoffsammelstellen/) | **DO NOT USE** | CSVs require Linz AG login; catalog retirement is pending. |

## Pending decisions and data requests

| Candidate | Current status | Required decision or request |
|---|---|---|
| [Cycling counter measurements](radverkehr-zaehlstellen/) | **REQUEST METADATA, THEN USE WITH PREPARATION** | Confirm license, attribution, timezone/DST semantics, missing-value meaning, and update cadence for the new 2024–2025 hourly files. |
| 2025 neighborhood statistics pack | **PREPARATION CANDIDATE** | Bundle population, one-year age counts, and 2014-system district geometry with encoding and blank-row cleanup. |
| [Council transcripts](gemeinderatsprotokolle/) | **REASSESS** | Previously excluded despite an A-tier catalog review. |
| [Pool occupancy](baederauslastung/) | **REQUEST DATA** | No open dataset was found. Ask LINZ AG for an anonymous feed or snapshot before considering a scraper. |
| [Orthophoto image-recognition pack](orthofotos/) | **ORGANIZER DECISION PENDING** | Decide whether to prepare festival-area web tiles; raw 2019 imagery alone is about 11.8 GB. |
| Institutional image archives | **DISCOVERY REQUEST** | Ask the Tabakfabrik, museums, and other institutions whether they can provide licensed, curated image material for AI-recognition experiments. |

These statuses are deliberately separate from the final selection: they record
work that still needs a stakeholder decision or new source access.

## Broader catalog ideas retained from the research

The full catalog review found several worthwhile Linz projects that did not all
become default festival datasets. Their ideas remain useful for future tracks:

| Direction | How it flows into the final set |
|---|---|
| Solar/green-roof potential plus 3D buildings | The visually strong 3D component remains a prepared showcase track; roof-potential data still needs a dedicated source audit and festival-area preparation. |
| Neighborhood change atlas | District geometry, population, age structure, and construction series are analytically strong, but boundary changes and a weak direct festival join make this a separate civic-data track. |
| Searchable civic memory | Preserved as [council transcripts](gemeinderatsprotokolle/) with a **REASSESS** status pending a hands-on corpus profile. |
| Democracy map | Preserved as optional [election data](wahldaten/), with year-specific precinct joins and neutral interpretation made explicit. |
| City change detector | Preserved through optional [orthophotos](orthofotos/); organizer-selected web tiles are required because the raw imagery is too large for a default bundle. |
| City finance and resilience trends | Valuable standalone civic topics, but schema normalization, aggregated records, and weak festival joins put them outside this curated portfolio. |

See [Benjamin's complete shortlist](archive/2026-07-13-reviews-benjamin/linz-hackathon-shortlist.md)
for the original project concepts and caveats.

## Global prerequisites

Before spatial use, clean the festival export: correct six invalid Ars Electronica
Center coordinates, generate canonical location/calendar IDs, resolve or inherit
parent locations, and define which `pending` records are public. Prepared city
outputs should include source URL, license, source vintage, retrieval timestamp,
and a `prototype_only` flag where relevant.

Open LINZ AG requests should cover timetable/GTFS or NeTEx data, realtime or
service information, pool occupancy, and replacement access for recycling-point
data. Scraping is a fallback only after an open feed request and a terms review.

See the [current consolidated usability report](2026-07-16-hackathon-usability.md)
for all current decisions. The
[original cross-dataset analysis](archive/2026-07-13-linz-open-data-hackathon-usability.md)
and [2026-07-16 catalog delta](archive/2026-07-16-catalog-delta-usability.md)
remain as research provenance.
