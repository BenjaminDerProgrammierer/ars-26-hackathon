# Linztermine – Übersicht über Veranstaltungen

> **Final verdict: USE.** Include a normalized, dated snapshot plus a live refresh helper in the default bundle. This is the city's calendar counterpart to the Ars schedule and covers the exact festival period when queried explicitly.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / Linztermine.at |
| Catalog | [Linztermine – Übersicht über Veranstaltungen](https://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed) |
| Data access | [Live events XML](https://www.linztermine.at/schnittstelle/downloads/events_xml.php) and [official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Uebersicht_Veranstaltungen.txt) |
| Format | XML REST-style endpoint; ISO-8859-1 declaration and CDATA text observed; companion plain-text documentation |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | Linz public events, with date slots, organizers, locations, tags, and audience/admission flags |
| Data vintage | Rolling/dynamic endpoint; catalog metadata was modified 2023-06-14 |
| Last verified | 2026-07-15: the live query could not be independently repeated; the 187-event festival-window result and schema below were observed on 2026-07-13 |

## What the dataset contains

The source review queried 5–14 September 2026 and received 187 city events. Each event can contain an `id`, overall `firstdate`/`lastdate`, title, long German description, `properforchildren`, `freeofcharge`, a root category, organizer, location, tags, and one or more concrete date slots with `dFrom` and `dTo`.

Organizer and location objects carry IDs from the companion Linztermine registries. Tags likewise reference the companion Schlagworte taxonomy. This makes the feed a relational center rather than a self-contained geographic dataset.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| Event `id` | Source event identifier; validate uniqueness within a snapshot |
| `firstdate`, `lastdate` | Overall event span, not necessarily every occurrence |
| `<date dFrom=… dTo=…>` | Concrete occurrence interval; use this for calendar overlap |
| `title`, `description` | German event text, CDATA-wrapped in the reviewed payload |
| `properforchildren`, `freeofcharge` | Audience/admission filters; preserve source semantics and missing values |
| `organizer id` | Foreign key to the organizer registry |
| `location id` | Foreign key to the locations registry; the feed itself has no coordinates |
| Tag `id` and label | Foreign key and display label from the tag taxonomy |

## Access and technical characteristics

The endpoint accepts `lt_datefrom` and `lt_dateuntil` in `yyyy-mm-dd hh:mm:ss` form, plus filters such as `lt_location_id`, `lt_tag_id`, and `lt_organizer_id`. Always supply an explicit interval: the reviewed API defaults to a moving “now plus seven days” window when dates are omitted, which makes builds non-reproducible.

Parse as XML using the declared charset rather than assuming the catalog's UTF-8 metadata. Handle CDATA and multiple occurrence slots. Convert to UTF-8 JSON with separate event and occurrence tables, or repeat event metadata per occurrence with a documented composite key. Snapshot companion locations, organizers, and tags at the same retrieval time.

The automated 2026-07-15 request did not yield an inspectable response. This does not overturn the successful 2026-07-13 observation; it means teams need a cached fallback and a health-checked refresh step.

## Data quality and limitations

- No event coordinates are supplied; location is only an ID and name.
- German-only titles/descriptions may need a separate translation layer.
- Overall date ranges and concrete slots have different semantics; using only `firstdate` can create false overlaps.
- XML/CDATA and charset handling add avoidable client-side friction.
- Rolling content can change between builds, so reproducibility requires a snapshot.
- A city event's presence does not imply endorsement by Ars Electronica.

## Using it with the Ars Electronica dataset

### Join strategy

Expand both calendars to normalized occurrence intervals in Europe/Vienna time and compare `dFrom`/`dTo` with Ars calendar start/end values. Join locations through the prepared Linztermine location registry and reviewed Ars venue crosswalk; retain cleaned Ars WGS84 coordinates after the match. Organizer ID `7` and location ID `358` provide reviewed Ars Electronica anchors. Map categories only through the explicit tag crosswalk.

### Suitable hackathon uses

- A combined festival-and-city agenda for 8–13 September 2026.
- Time-conflict, gap, and “what else is nearby” discovery.
- Family-friendly or free-admission filters using source flags.
- Same-venue cultural recommendations after reviewed venue matching.

### Do not use it for

- Spatial proximity before locations are matched and coordinates attached.
- Treating a missing flag as false or machine-translated text as official copy.
- Assuming the 187-event count remains current after 2026-07-13.
- Live-only demos without a snapshot fallback.

## Preparation recipe

1. Query the required festival buffer window explicitly, save raw XML, and record parameters, retrieval time, checksum, URL, and license.
2. Decode using the payload declaration, parse CDATA, expand occurrence slots, and normalize timestamps in Europe/Vienna.
3. Validate event IDs, occurrence ranges, foreign keys, flags, and orphaned location/organizer/tag references.
4. Join the synchronized helper snapshots, apply reviewed Ars venue/category crosswalks, and attach cleaned festival coordinates only to confirmed matches.
5. Publish UTF-8 JSON plus provenance and a health-checked refresh command; keep the last successful snapshot available.

## Decision rationale

The final decision remains **USE**. The dated live query demonstrated direct temporal overlap and rich fields for practical schedule prototypes, while companion datasets provide strong relational anchors. Rainer's 2026-07-13 verdict was “Recommended.” The main risks—XML conversion, character encoding, missing geometry, and endpoint availability—are exactly the kind of preparation the organizer can solve once for every team.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed)
- [Official live XML endpoint](https://www.linztermine.at/schnittstelle/downloads/events_xml.php)
- [Official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Uebersicht_Veranstaltungen.txt)
- [Hands-on source review](../../2026-07-13-reviews-rainer/linztermine-veranstaltungen.md) (successful query and observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
