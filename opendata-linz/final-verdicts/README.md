# Final Linz Open Data verdicts

These are the authoritative dataset decisions for the Ars Electronica Festival
2026 hackathon. Each folder preserves Rainer's source verdict and adds the final
decision after the full 820-record catalog review, live endpoint checks, festival
export analysis, and GitHub defect handoff.

Each dataset page now also documents the recommended distribution, observed
schema and identifiers, access/format details, quality limits, Ars join strategy,
preparation recipe, decision rationale, and source provenance. Current catalog
evidence was reviewed on 2026-07-15. Where publisher hosts could not be reached
from the execution environment, file- and endpoint-level claims remain explicitly
dated to the successful 2026-07-13 source audit rather than being presented as a
fresh live check.

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
| [Playgrounds and sports facilities](spielplaetze/) | **USE** | Working geocoded CSV for family-oriented apps. |
| [LINZ AG lines and stops](linz-ag-linien-2025/) | **USE WITH PREPARATION** | Static transit geometry; publish converted GeoJSON. |
| [EFA journey planner](efa-fahrplanauskunft/) | **USE WITH PREPARATION** | Live routing/departures; provide proxy, example, and fallback. |
| [Historical city maps](historische-stadtplaene/) | **USE WITH PREPARATION** | Pre-tile selected maps for then-and-now interfaces. |
| [3D city data](3d-geodaten-lod2-2022/) | **USE WITH PREPARATION** | Preconvert selected festival-area tiles for a showcase track. |
| [Accessible parking](behindertenstellplaetze/) | **USE WITH PREPARATION** | Convert/reproject and label 2022 freshness. |
| [Public toilets](wc-anlagen/) | **USE WITH PREPARATION** | Reproject and normalize accessibility/opening-hours data. |
| [Drinking fountains](trinkbrunnen/) | **USE WITH PREPARATION** | Correct the CRS before publishing a normalized layer. |
| [Air and weather](luftguete-messwerte/) | **USE WITH PREPARATION** | Five working live stations; monitor and cache. |
| [Linztermine tags](linztermine-schlagworte/) | **USE WITH PREPARATION** | Helper taxonomy only, bundled with Linztermine events. |
| [Defibrillators](defibrillatoren/) | **OPTIONAL** | Prototype-only safety layer; 2022 data is not operational guidance. |
| [Public Wi-Fi](hotspots/) | **OPTIONAL** | Useful venue layer, but usage and locations are from 2022. |
| [Orthophotos](orthofotos/) | **OPTIONAL** | Heavy experimental visual source requiring selection and web tiling. |
| [Short-term parking zones](kurzparkzonen/) | **OPTIONAL** | Utility layer with projected Shapefile conversion. |
| [Hecken die Schmecken](hecken-die-schmecken/) | **OPTIONAL** | Small playful garnish with no coordinates and 2022 data. |
| [Accommodation establishments](beherbergungsbetriebe/) | **DO NOT USE** | Aggregated tourism totals, not hotel locations. |
| [Dog zones](hundezonen/) | **DO NOT USE** | Public downloads are broken. |
| [Parking-ticket machines](parkscheinautomaten/) | **DO NOT USE** | Missing CRS definition and low festival value. |
| [Digital city map TMS/WMTS](stadtplan-tms-wmts/) | **DO NOT USE** | Non-standard stale tiles with no joinable data. |
| [Baulandreserven 2022](baulandreserven-2022/) | **DO NOT USE** | The 2022 record points to a 2012 resource. |

## Global prerequisites

Before spatial use, clean the festival export: correct six invalid Ars Electronica
Center coordinates, generate canonical location/calendar IDs, resolve or inherit
parent locations, and define which `pending` records are public. Prepared city
outputs should include source URL, license, source vintage, retrieval timestamp,
and a `prototype_only` flag where relevant.

See the [consolidated usability report](../2026-07-13-linz-open-data-hackathon-usability.md)
for the cross-dataset analysis.
