# Data model reference

Field reference for the Ars Electronica Festival 2026 hackathon dataset,
schema version 2.0 (export of 2026-07-20). The export contains strings,
numbers, booleans, arrays of strings, and null values. Personal contact details
and internal staff assignments are removed at the source.

## Metadata and recommended usage

`_meta.usage` is the authoritative machine-readable usage guide. Its central
rules are:

1. Join every database and relation-valued `Linked *` field through
   `canonical_id`. `Linked Ticket` is free text, not a relation.
2. Read concrete event slots from `calendar`; use `projects.calendar_ids` for
   the calendar-derived reverse relation.
3. For public demo apps, include projects and calendar slots only when
   `public_for_hackathon: true`. Preserve their linked locations regardless of
   a location's visibility flag so the complete venue hierarchy remains
   available. Render a record's URL only when `link_allowed: true`.
4. Treat `status_web` and `visibility_rule` as explanations of that visibility
   decision, not as a replacement for the two booleans.

`_meta.quality` reports derived IDs, unassigned calendar slots, suspicious
coordinates, URL validation, and editorial length warnings. Values that exceed
recommended lengths are reported but not truncated.

## Common fields

Every record in all four databases has these normalized fields:

| Field | Type | Description |
|---|---|---|
| `id` | string | Human-readable Notion value for projects/contacts; for locations/calendar it equals `canonical_id` |
| `canonical_id` | string | Unique bare 32-character hexadecimal join key |
| `id_source` | enum | `notion` if retained from the source, `derived` if generated deterministically from content/hierarchy |
| `Status Web` | string | Original CMS workflow value |
| `status_web` | string | Normalized workflow value used by the export's status rules |
| `visibility_rule` | enum | Why a record is `public`, `hidden`, or marked as internal |
| `public_for_hackathon` | boolean | Whether the record is suitable for public hackathon demo apps |
| `link_allowed` | boolean | Whether the record's URL may be rendered as a link; `offline` content may be shown but not linked |

The July export intentionally includes hidden placeholders for testing. Only
`done` content is eligible for public visibility, with explicit internal/test
markers still excluded. The announced August export is expected to contain
only actual data.

## Relations

All relation values below are `canonical_id` values. Relation fields are
arrays unless noted otherwise.

```text
projects ──── Linked Contacts ──▶ contacts
         ──── Linked Location ──▶ locations
         ──── calendar_ids ─────▶ calendar  (recommended reverse relation)
         ──── Linked Parent/Child ─▶ projects

contacts ──── Linked Projects ──▶ projects

locations ── Linked Parent/Child ─▶ locations

calendar ──── project_ref ──────▶ projects  (scalar, leading relation)
         ──── Linked Projects ──▶ projects  (array equivalent)
         ──── Linked Location ──▶ locations
```

`projects."Linked Calendar"` remains in the raw source fields but is not
reliably resolvable. Use `projects.calendar_ids`. `projects.Times` is display
text only.

## Database: Projects

The central database of projects, exhibitions, workshops, performances, and
collections (706 records in this export).

| Field | Type | Description |
|---|---|---|
| `Name EN` / `Name DE` | string or null | Project title |
| `Category` | string or null | Programme type; observed values include `Project`, `Exhibition`, `Workshop`, `Performance`, `Panel Discussion`, and others |
| `Artists` | string or null | Artist names with country codes |
| `Subtitle EN/DE` | string or null | Subtitle |
| `Web Preview Text EN/DE` | string or null | Listing summary; 300 characters is an editorial recommendation |
| `Description EN/DE` | string or null | Full description |
| `Web Link` | URL string or null | Festival page; non-URL status markers such as `offline` are normalized to null |
| `Credits short` / `Credits long` | string or null | Credits; 500 characters for short credits is a recommendation |
| `Funding Line` | string or null | Funding acknowledgement |
| `Curatorial Highlight` | `Yes` / `No` | Highlight flag |
| `Website`, `Website Secondary`, `Instagram`, `Facebook`, `LinkedIn`, `Video URL` | URL string or null | URLs include a protocol |
| `Linked Parent` / `Linked Child` | array or null | Project hierarchy |
| `Linked Contacts` | array or null | Contact relations |
| `Linked Location` | array or null | Venue relations |
| `Linked Calendar` | array or null | Legacy source relation; do not use for joins |
| `calendar_ids` | array | Complete calendar-derived reverse relation |
| `Linked Ticket` | string or null | Ticket requirements |
| `Times` | string or null | Human-readable schedule summary only |
| `Recommended Arrival`, `Max Participants` | string or null | Numeric values represented as strings |
| `Registration URLs` | string or null | Registration links, possibly comma-separated |
| `Language` | string or null | Languages, comma-separated |
| `Event notes`, `Additional Info EN/DE` | string or null | Visitor information |
| `Timetable` | `Yes` / `No` | Whether children display as a timetable |

## Database: Contacts

Artists, speakers, groups, institutions, and project partners (360 records).

| Field | Type | Description |
|---|---|---|
| `Name EN` / `Name DE` | string or null | Person or institution name |
| `Category` | `Person`, `Group`, `Organization`, or null | Contact type |
| `Pronouns` | string or null | One or more pronoun sets |
| `Country` | string or null | Two-letter code and country name |
| `Description EN/DE` | string or null | Biography or institutional description; 500 characters is a recommendation |
| `Linked Projects` | array or null | Related projects |
| `Website`, `Instagram`, `Facebook`, `LinkedIn` | URL string or null | URLs include a protocol |

## Database: Locations

Venues organized as Building → Floor → Room, plus Outdoor and Online
locations (138 records). All ids are present and unique: 122 came from Notion
and 16 generic rooms/floors received stable, hierarchy-derived ids.

| Field | Type | Description |
|---|---|---|
| `Name EN` / `Name DE` | string | Location name; interpret generic names within their parent hierarchy |
| `Type` | enum | `Building`, `Floor`, `Room`, `Outdoor`, or `Online` |
| `Description EN/DE` | string or null | Short description |
| `Services` | string or null | Comma-separated on-site services |
| `Breadcrumb EN/DE` | string or null | Full hierarchy path |
| `Area` | string or null | Festival zone |
| `Place`, `Address` | string or null | Address text |
| `Latitude` / `Longitude` | number or null | Decimal WGS84 coordinate; some values remain unverified |
| `coordinates_ok` | boolean or null | Exporter's coordinate plausibility check; false for six current records |
| `Web Link`, `Link Map`, `Website`, social fields | URL string or null | URLs include a protocol |
| `Linked Projects` | array or null | Related projects, where supplied |
| `Linked Parent` / `Linked Child` | array or null | Venue hierarchy |

## Database: Calendar

Individual time slots (278 records). Every slot has a unique id. Of these, 253
are assigned to a project and 25 are explicitly unassigned.

| Field | Type | Description |
|---|---|---|
| `project_ref` | canonical id or null | Scalar leading relation to the project |
| `Linked Projects` | array or null | Array form of `project_ref` |
| `slot_status` | enum | `assigned` or `unassigned` |
| `Time` | string or null | Full human-readable date/time range |
| `Start Time` / `End Time` | string or null | Bare `HH:MM` values |
| `Weekday` | string or null | Formatted display label |
| `Arrive by`, `Recommended Arrival` | string or null | Arrival information |
| `Registration URL` | URL string or null | Slot-specific registration URL |
| `Category`, `Language`, `Highlight` | string or null | Values rolled up from the linked project |
| `Linked Location` | array or null | Venue relations |
| `Duration`, `Event before`, `Event afterwards` | null in this export | Reserved source fields |

The full date still exists only in the `Time` display value; `Start Time` and
`End Time` are time-only. Use `parse_event_datetime()` or the parsed
`start_dt`/`end_dt` returned by `event_rows()`. Festival times are local to Linz
(MESZ / CEST).
