# EFA Fahrplanauskunft

> **Final verdict: USE WITH PREPARATION.** Provide a documented adapter/proxy,
> working examples, health checks and a cached fallback. Do not make the service
> the only path through a mobility demo.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / LINZ AG LINIEN |
| Catalog | [EFA interface-document record](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13); [newer scheduled-data record](https://www.data.gv.at/katalog/datasets/d3c0a223-516b-4049-9370-22881a0428d8) |
| Data access | EFA requests below `https://www.linzag.at/static/`; the older catalog's three distributions are PDF documentation, not API payloads |
| Format | HTTP EFA endpoints returning JSON or XML; separate GTFS/NeTEx scheduled-data distributions are catalogued |
| License | Catalog metadata says CC BY 4.0, subject to the [additional LINZ AG LINIEN terms](https://data.linz.gv.at/nutzungsbedingungen/) |
| Coverage | LINZ AG LINIEN stops, POIs, departures and journey planning in the Linz service area |
| Data vintage | Request-time service responses; the documented product is **Sollzeit** (scheduled time), even where a request asks for realtime data |
| Last verified | 2026-07-15: official catalog records checked; live EFA behavior was observed on 2026-07-13 and was not rechecked on 2026-07-15 because the publisher host could not be resolved from the execution environment |

## What the dataset contains

This is a service interface, not a downloadable table. The 2026-07-13 source
review successfully used three EFA request families:

- `XML_STOPFINDER_REQUEST` resolves stop names, addresses, points of interest and
  coordinate inputs. A search for “Ars Electronica” returned named AEC POIs.
- `XML_DM_REQUEST` resolves a stop and returns a departure monitor. A test with
  “Hauptplatz” returned several stop choices, including stop ID `60501010`.
- `XML_TRIP_REQUEST2` is the origin-to-destination journey-planner family. It is
  linked by the newer catalog record; the 2026-07-13 review did not exercise a
  complete trip request.

The distinction between catalogs and service matters. Record
`cc074ef6-…` exposes EFA interface and coordinate PDFs. Record `d3c0a223-…`
links an EFA request plus scheduled GTFS/NeTEx resources and warns that the XML
interface was expected to be discontinued in 2024. The EFA endpoints nevertheless
responded on 2026-07-13. Treat that as a dated observation, not a permanence
guarantee.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| stop/point ID | Resolved identifier to pass from StopFinder to the departure or trip request; names alone can be ambiguous |
| `name_sf` / point type | StopFinder search text and result category for stops, addresses and POIs |
| `coords` | Service coordinate pair; reviewed defaults looked projected, for example `5447080.00,807309.00`, and must not be treated as WGS84 |
| `servingLines` | Lines associated with the resolved departure-monitor point |
| `departureList` | Departure items returned for a successfully resolved stop |
| `dateTime` | Service date/time structure; parse it explicitly and retain the service timezone |
| `useRealtime` | Request option observed in the review; it does not by itself prove that every returned time is measured realtime |

## Access and technical characteristics

The useful base is `https://www.linzag.at/static/`, with request paths such as
[`XML_STOPFINDER_REQUEST`](https://www.linzag.at/static/XML_STOPFINDER_REQUEST),
[`XML_DM_REQUEST`](https://www.linzag.at/static/XML_DM_REQUEST) and
[`XML_TRIP_REQUEST2`](https://www.linzag.at/static/XML_TRIP_REQUEST2). Build URLs
from the official [EFA interface PDF](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/LINZ_LINIEN_Schnittstelle_EFA_V1.pdf)
and [coordinate PDF](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/LINZ_AG_LINIEN_Schnittstelle_EFA_Koordinaten.pdf),
not from guessed parameters. Examples in the PDF reportedly contain localhost
placeholders, so the adapter must substitute the public host.

Resolve input before asking for departures. An ambiguous place name can return a
point-selection list and no departures; that is a valid disambiguation response,
not an empty timetable. Request documented coordinate input/output formats when
combining the API with WGS84 venues. The reviewed default coordinate string is
projected, but the local evidence does not establish its EPSG code or axis order;
do not guess either.

## Data quality and limitations

- Availability is external, has no documented SLA and may change because the
  catalog explicitly anticipated retirement of EFA XML.
- The product title says `Sollzeit`. A current server timestamp or
  `useRealtime=1` does not justify calling every returned departure realtime.
- Stop/POI names are ambiguous; cache the chosen stable IDs and surface choices
  rather than silently taking the first match.
- Coordinate notation is service-specific. Convert only through documented EFA
  parameters or a verified transform.
- Usage terms, attribution, request volume and browser cross-origin behavior must
  be checked before deployment. A server-side proxy should throttle and cache.

## Using it with the Ars Electronica dataset

### Join strategy

Normalize each public festival venue to a canonical name and corrected WGS84
coordinate. Use StopFinder with the venue name or documented geographic input,
review ambiguous results, and store the chosen EFA stop/POI ID beside the canonical
venue ID. At request time, combine the festival calendar's Europe/Vienna end time
with the resolved stop ID for a departure query, or with both endpoint IDs for a
trip query. Keep this crosswalk independent of incomplete or duplicated raw Ars
location IDs.

### Suitable hackathon uses

- Departure boards for festival zones, clearly labelled scheduled/realtime
  according to the actual response.
- “Leave after this event” prompts and itinerary feasibility between venues.
- A live layer paired with the prepared static 2025 stops/routes snapshot.

### Do not use it for

- Guaranteed arrival times, accessibility guarantees or operational dispatch.
- Client-only apps with no fallback, caching or error handling.
- Treating a place-name match or an undocumented coordinate pair as exact.

## Preparation recipe

1. Implement and test StopFinder → selection → departure/trip flows through a
   rate-limited organizer proxy.
2. Request JSON and documented geographic coordinate formats; validate IDs,
   timezone handling and ambiguous-result branches.
3. Pre-resolve the main festival venues and manually verify the crosswalk.
4. Cache successful responses briefly, log endpoint health, and keep a dated
   static stop/route snapshot plus a “service unavailable” UI path.
5. Publish example requests with secrets removed, retrieval timestamps, license,
   attribution and the LINZ AG terms.

## Decision rationale

Rainer's dated test established that the service can resolve the AEC and return
departure information without registration. That is unusually valuable for event
mobility. The retirement warning, service-only delivery, uncertain availability,
two-step resolution and coordinate handling keep the portfolio verdict at **use
with preparation**.

## Sources

- [Official EFA interface-document catalog](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13)
- [Official newer EFA/GTFS/NeTEx catalog](https://www.data.gv.at/katalog/datasets/d3c0a223-516b-4049-9370-22881a0428d8)
- [Official EFA interface documentation](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/LINZ_LINIEN_Schnittstelle_EFA_V1.pdf)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/efa-fahrplanauskunft.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
