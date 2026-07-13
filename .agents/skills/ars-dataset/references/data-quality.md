# Known data-quality issues and workarounds

Measured against the 2026-07-06 export (the numbers may shift in newer
exports, but the patterns are structural — assume they persist until
verified otherwise). These issues have been reported to the data provider
(Ars Electronica); some may be fixed at the source in future exports.

## 1. ID formats are inconsistent between records and links

- `projects.id` / `contacts.id`: `Prefix-<32-hex-hash>` (e.g. `Exhibitions-34238ddb…`)
- `locations.id` / `calendar.id`: bare 32-hex hash
- All `Linked *` fields: bare 32-hex hash, always arrays

**Measured:** joining `projects."Linked Contacts"` values directly against
`contacts.id` matches 0 of 258 links; matching against the hash part matches
258 of 258. Same pattern for every relation touching projects/contacts.

**Workaround:** normalize every id to its trailing 32-hex-char hash before
joining (`id.split('-')[-1]`, or regex `[0-9a-f]{32}$`). `scripts/load_dataset.py`
does this (`_key` field).

## 2. Locations: missing and duplicate ids

**Measured:** 26 of 111 locations have `id: null`; several ids occur 2–6
times (generic floors/rooms such as `Level 0`, `Foyer`, `Ground Floor` that
exist in multiple buildings share an id or have none).

**Workaround:** for a unique location key, use the hash when present and
unique, otherwise synthesize from `Breadcrumb EN` (which encodes the full
Building → Floor → Room path and is filled consistently).

## 3. Calendar: ids are not unique slot keys

**Measured:** 13 of 178 calendar entries have `id: null`, and the remaining
165 slots share only 42 distinct id values — recurring events (same workshop
on several days) reuse one id per group. An id identifies a *slot group*, not
a slot.

**Workaround:** treat a calendar row's identity as the combination
(linked project hash, `Time`), or generate synthetic ids at load time. Don't
persist references to `calendar.id` across exports.

## 4. `projects."Linked Calendar"` is broken; the calendar side is not

**Measured:** only 42 of 173 `projects."Linked Calendar"` references resolve
to a calendar id, while 173 of 173 `calendar."Linked Projects"` references
resolve to a project (via hash).

**Rule:** the calendar database is the source of truth for time slots. Read
concrete times via `calendar."Linked Projects"`; treat `projects.Times` as a
display-only summary; ignore `projects."Linked Calendar"`.

Also: `calendar."Linked Location"` (rollup) resolves only ~92 of 166
references — fall back to the linked project's `"Linked Location"`
(64 of 81 resolve; the remainder point at keyless locations, see issue 2).

## 5. Test and internal content is mixed in

The export contains entries clearly not meant for end users:
`Test Event2`, `Test Event3 Subitem`, several projects named `undefined`,
and entries suffixed `- NOT FOR WEB` (e.g. `Futurelab Signage - NOT FOR WEB`).

**Workaround for user-facing apps:** drop projects whose `Name EN` is null,
`undefined`, starts with `Test Event`/`Test_`, or contains `NOT FOR WEB`.

`Status Web` is CMS workflow state, not a visibility flag: 374 of 546
projects are `pending` and only 3 are `done` — and those 3 are all test
events (`Test Event2`, `Test Event3 Subitem`, `Test Event4 Subitem`), the
only projects with a real (non-`offline`) `Web Link`. Filtering to
"published" statuses would leave nothing but test data — don't do it.

## 6. `Web Link` uses the sentinel string `"offline"`

543 of 546 projects have `Web Link: "offline"`, meaning "no festival-website
page yet". Render the project without a website link; never emit `offline`
as an href.

## 7. Coordinates: European decimal format, some wrong values

`Latitude`/`Longitude` are strings with a comma decimal separator
(`"48,309619"`). Convert with `float(value.replace(',', '.'))`.

**Measured:** 6 locations have latitudes outside the plausible Linz range.
Several Ars Electronica Center entries sit at ~`48,09619 / 14,84447` —
digits dropped from the correct ~`48,309… / 14,284…`. For map apps,
sanity-check coordinates against Linz (lat ≈ 48.2–48.4, lon ≈ 14.2–14.4) and
fall back to the parent building's coordinates or drop the marker.

## 8. URL fields without protocol

A handful of `Website`/`Instagram` values lack `https://`
(e.g. `www.kunstuni-linz.at/viskom/`, `ariathney.cargo.site`, `@ariathney`).
Prefix `https://` before use; expand bare `@handle` Instagram values to
`https://www.instagram.com/handle`.

## 9. Documented max lengths are guidelines, not guarantees

Field docs mention limits (300 chars for preview texts, 500 for short
credits/bios), but the export contains longer values. Truncate defensively in
constrained UI.
