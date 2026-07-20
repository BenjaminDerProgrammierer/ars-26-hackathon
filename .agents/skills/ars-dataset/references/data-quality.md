# Data quality status and usage rules

Measured against schema version 2.0, export generated 2026-07-20 at
07:59:49Z. The previous ID, relation, visibility, and URL problems were fixed
at the source. Do not keep the workarounds from the 2026-07-06 export in new
applications.

## 1. IDs and joins

All 1,482 records have a unique, non-null `canonical_id` containing a bare
32-character hexadecimal value. Every `Linked *` value uses that same key.

| Database | Records | `notion` ids | `derived` ids |
|---|---:|---:|---:|
| projects | 706 | 706 | 0 |
| contacts | 360 | 360 | 0 |
| locations | 138 | 122 | 16 |
| calendar | 278 | 52 | 226 |

Join on `canonical_id`, never on the readable `id`. `id_source: derived`
means the id is deterministic and remains stable while its source content
(such as location hierarchy/name or slot attributes) does not change.

## 2. Locations

All 138 location ids are present and unique. Generic names such as `Level 1`
and `Foyer` are disambiguated through the parent-child hierarchy; the 16 cases
without a suitable Notion id have deterministic derived ids.

Two project-to-location references out of 412 do not currently resolve. Apps
should tolerate a missing joined location without discarding the project.

## 3. Calendar and reverse relation

All 278 calendar ids are present and unique. The former duplicate value was a
project id rather than a slot id. Each row now has:

- `project_ref`: scalar project `canonical_id`, or null;
- `slot_status`: `assigned` or `unassigned`.

There are 253 assigned and 25 unassigned slots. All 253 assigned project
references resolve. `calendar` is authoritative for concrete times.
`projects.calendar_ids` is derived from it; all 253 values are unique and
resolve to calendar rows. Ignore the legacy `projects."Linked Calendar"`
relation and treat `projects.Times` as display text only.

## 4. Visibility

Use the explicit output fields instead of inferring visibility from names or
the raw CMS status:

- include a record in a public demo only when `public_for_hackathon` is true;
- render its URL only when `link_allowed` is true;
- use `status_web` and `visibility_rule` to explain/debug the decision.

Only `done` is currently eligible for visibility. Internal/test markers remain
excluded even when their workflow status is `done`. An `offline` record may be
shown but must not be linked. The July export contains placeholders for
testing; the data provider expects the August export to contain only actual
records.

Visibility is record-specific: do not expose a hidden project merely because a
linked slot is public. In this test export no joined event has both a public
calendar slot and a public project, so `event_rows(public_only=True)` correctly
returns no rows. This is expected to change with later data, not a reason to
relax the slot/project filter. Locations are the exception: retain locations
linked to public records regardless of their own visibility flag so venue
hierarchies and map context remain complete.

## 5. URLs

All 1,980 non-null URL values in this export include `http://` or `https://`,
and `_meta.quality.unparsable_urls` is empty. Source status values such as
`offline` are normalized to null rather than emitted into URL fields. Continue
to respect `link_allowed` before rendering links.

## 6. Coordinates still require caution

Coordinates are now JSON numbers, not comma-decimal strings. Use them directly
as WGS84 latitude/longitude values and consult `coordinates_ok`.

Six locations are flagged with `coordinates_ok: false` and listed in
`_meta.quality.suspicious_coordinates`. They contain approximately
`48.09619 / 14.84447`, outside the expected Linz area. Coordinates are not yet
fully reviewed and the provider expects further changes. For map apps, omit
flagged markers or fall back to a verified parent building coordinate.
`event_rows()` never derives `lat`/`lon` from an explicitly flagged location;
it continues to the next joined location with a usable coordinate pair.

## 7. Dates remain display-oriented

`Start Time` and `End Time` contain only `HH:MM`; the date is embedded in the
human-readable calendar `Time` string. Use the skill's
`parse_event_datetime()` helper. One of the 250 currently joinable non-test
event rows lacks a parseable date.

## 8. Length limits are recommendations

Text length limits are editorial recommendations, not validation constraints.
The exporter does not truncate values. The current export reports 96 overruns
in `_meta.quality.length_warnings`; applications should allow wrapping or
truncate only in their own presentation layer.
