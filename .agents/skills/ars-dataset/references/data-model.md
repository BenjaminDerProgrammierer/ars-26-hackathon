# Data model reference

Full field reference for the Ars Electronica Festival 2026 hackathon dataset
(export of 2026-07-06). All values are strings, arrays of strings, or null —
there are no native numbers or booleans in the export. Personal contact
details (e-mail, phone, internal staff assignments) and administrative
workflow fields were removed at the source for privacy reasons.

## Contents

- [Relations](#relations)
- [Projects](#database-projects)
- [Contacts](#database-contacts)
- [Locations](#database-locations)
- [Calendar](#database-calendar)

## Relations

All cross-references are arrays of bare 32-char hash keys (see SKILL.md for
the join rule — link values match the *hash part* of the target `id`, not the
full `id`).

```
projects ──── Linked Contacts ──▶ contacts
         ──── Linked Location ──▶ locations
         ──── Linked Calendar ──▶ calendar   (unreliable — prefer the reverse)
         ──── Linked Parent   ──▶ projects (self)
         ──── Linked Child    ──▶ projects (self)

contacts ──── Linked Projects ──▶ projects

locations ─── Linked Parent   ──▶ locations (self)
          ─── Linked Child    ──▶ locations (self)

calendar ──── Linked Projects ──▶ projects   (authoritative time-slot relation)
         ──── Linked Location ──▶ locations  (rollup; partially filled)
```

Projects nest: a Collection or Exhibition can have child projects
(`Linked Child`), and a project can belong to a parent (`Linked Parent`).

---

## Database: Projects

The central database. Every project, exhibition, workshop, performance, and
collection has one entry.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | `Category-Hash` format | `Exhibitions-34238ddb…` |
| `Name EN` | string | Project title in English | `"Negotiating Humanity"` |
| `Name DE` | string | Project title in German (often null) | — |
| `Category` | enum | Type of project (see below); null on ~13 records | `"Exhibition"` |
| `Artists` | string | Artist name(s) with country codes | `"Jane Doe (AT), Group Name (DE)"` |
| `Subtitle EN` / `Subtitle DE` | string | Subtitle, if any | — |
| `Web Preview Text EN` / `… DE` | string | Short summary for listings (~300 chars, editorial guideline, sometimes exceeded) | — |
| `Description EN` / `… DE` | string | Full project description | — |
| `Web Link` | string | URL on festival website, or the string `"offline"` if not (yet) published | `"https://ars.electronica.art/…"` |
| `Credits short` | string | Short credits for print/signage (~500 chars guideline) | — |
| `Credits long` | string | Full credits for the website | — |
| `Funding Line` | string | Funding acknowledgement text | — |
| `Curatorial Highlight` | enum | `"Yes"` / `"No"` | — |
| `Website`, `Website Secondary`, `Instagram`, `Facebook`, `LinkedIn`, `Video URL` | string (URL) | Social/web links; may lack protocol | — |
| `Linked Parent` | array | Parent project(s) → `projects` | — |
| `Linked Child` | array | Child projects → `projects` | — |
| `Linked Contacts` | array | Artists/partners → `contacts` | — |
| `Linked Location` | array | Venue(s) → `locations` (a few references don't resolve) | — |
| `Linked Calendar` | array | Time slots → `calendar` — unreliable, use `calendar."Linked Projects"` instead | — |
| `Linked Ticket` | string | Required ticket type(s), comma-separated (see values below) | `"FREE ACCESS"` |
| `Times` | string | Human-readable schedule summary (rollup — display only) | `"Wed Sep 10, 14:00–15:30"` |
| `Recommended Arrival` | string | Minutes before start visitors should arrive | `"10"` |
| `Registration URLs` | string | Registration link(s), comma-separated | — |
| `Language` | string | Comma-separated; known values: `EN`, `DE`, `nonverbal`, `other`, `FR` | `"DE, EN"` |
| `Max Participants` | string | Maximum number of participants | `"15"` |
| `Event notes` | string | Access requirements and warnings | `"Registration required"` |
| `Additional Info EN` / `… DE` | string | Audience, equipment, accessibility notes | — |
| `Timetable` | enum | Whether child projects are displayed as a timetable: `"Yes"` / `"No"` | — |
| `Status Web` | enum | CMS publication workflow state (see below) — not a public/private flag | `"pending"` |

**Category values:** `Collection`, `Project`, `Exhibition`, `Guided Tour`,
`Workshop`, `Symposium`, `Conference`, `Keynote`, `Lecture & Talk`,
`Networking Event`, `Performance`, `Concert`, `Experience`, `Event`,
`Meet the Artist`, `Open Lab`, `Award Ceremony`, `Screening`

**Status Web values:** `pending`, `not ready`, `ready for web`,
`new image needed`, `done`, `not needed`
(distribution in current export: pending 374, ready for web 117, not ready 49, done 3, not needed 2, new image needed 1)

**Linked Ticket values:** `FREE ACCESS`, or a comma-separated combination of
`FESTIVALPASS`, `FESTIVALPASS+`, `DAYPASS`, `Ars Electronica Center Ticket`

---

## Database: Contacts

Artists, speakers, institutions and project partners.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | `SlugifiedName-Hash` format | `"JaneDoe-34238ddb…"` |
| `Name EN` | string | Name in English | `"Jane Doe"` |
| `Name DE` | string | German name (institutions only, if different) | — |
| `Category` | enum | `Person`, `Group`, `Organization` | `"Person"` |
| `Pronouns` | enum | Individuals only: `she/her`, `he/him`, `they/them`, `she/her, they/them`, `he/him, she/her`, `other` | — |
| `Country` | string | Two-letter code + name | `"AT Austria"` |
| `Description EN` / `… DE` | string | Biography or institutional description (~500 chars guideline) | — |
| `Linked Projects` | array | Associated projects → `projects` | — |
| `Status Web` | enum | `pending`, `not ready`, `not needed`, `ready for upload`, `new image needed`, `done` | — |
| `Website`, `Instagram`, `Facebook`, `LinkedIn` | string (URL) | May lack protocol; Instagram may be a bare `@handle` | — |

---

## Database: Locations

Event venues, hierarchically organised Building → Floor → Room; Outdoor and
Online locations also exist. Traverse the hierarchy with `Linked Parent` /
`Linked Child`; `Breadcrumb EN/DE` gives the pre-formatted full path.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Bare hash; **null on ~26 records, duplicated for generic floors/rooms** | `"34238ddb450c81…"` |
| `Name EN` / `Name DE` | string | Location name | `"Deep Space 8K"` |
| `Type` | enum | `Building`, `Floor`, `Room`, `Outdoor`, `Online` | `"Room"` |
| `Description EN` / `… DE` | string | Short description | — |
| `Services` | string | Comma-separated: `Ticket Sales`, `Ticket Pick-Up`, `Accreditation Pick-Up`, `Press Pick-Up`, `Shop`, `Program Info` | — |
| `Breadcrumb EN` / `… DE` | string | Full hierarchical path | `"Ars Electronica Center, EG, Deep Space 8K"` |
| `Area` | enum | Festival zone: `OK QUARTER`, `MED CAMPUS`, `DANUBE TRIANGLE`, `EVENT LOCATIONS` | — |
| `Place` | string | Full address as plain text | `"Ars-Electronica-Straße 1, 4040 Linz, Österreich"` |
| `Latitude` / `Longitude` | string | Decimal with **comma** separator — convert before use; a few are wrong (see data-quality.md) | `"48,309619"` |
| `Address` | string | Street address | — |
| `Additional Info EN` / `… DE` | string | Null on all entries in this export | — |
| `Web Link` | string (URL) | Location page on festival website | — |
| `Link Map` | string (URL) | OpenStreetMap link generated from coordinates | — |
| `Website`, `Instagram`, `Facebook`, `LinkedIn` | string (URL) | Location's own web presence | — |
| `Linked Projects` | array | Null on all entries in this export — join from `projects."Linked Location"` instead | — |
| `Linked Parent` / `Linked Child` | array | Venue hierarchy → `locations` | — |

---

## Database: Calendar

Individual time slots. Each entry links to (at most) one project via
`Linked Projects`; a project can have multiple entries (e.g. a workshop
running on three days). **This database is the authoritative source of event
times** — derive timetables from here, not from `projects."Linked Calendar"`.

**There is no machine-readable date field.** `Start Time`/`End Time` are bare
`HH:MM` and `Weekday` is a display label; the full date exists only inside the
`Time` display string. Use the skill module's `parse_event_datetime()` (or the
`start_dt`/`end_dt` fields on `event_rows()` output) instead of parsing it
yourself.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Bare hash; **null on ~13 records, and recurring events share one id across slots** (165 keyed slots, only 42 distinct ids) — never treat as a unique slot key | — |
| `Linked Projects` | array | The associated project → `projects` (resolves 100% via hash) | — |
| `Status Web` | enum | `pending`, `done` | — |
| `Time` | string | Full human-readable range — the **only** field carrying the event date; parse with `parse_event_datetime()` | `"9. September 2026 15:15 (MESZ) → 16:15"` |
| `Arrive by` | string | Recommended arrival time (human-readable) | — |
| `Registration URL` | string (URL) | Registration link for this specific slot | — |
| `Category` | string | Rollup from the linked project | `"Workshop"` |
| `Linked Location` | array | Venue rollup from project; only ~55% resolve — fall back to project's `Linked Location` | — |
| `Language` | string | Rollup from project | `"EN"` |
| `Recommended Arrival` | string | Minutes before start | `"10"` |
| `Duration` | string | Minutes | `"60"` |
| `Event before` / `Event afterwards` | null | Always null in this export | — |
| `Weekday` | string | Formatted day label (German weekday names) | `"Sep 9, MITTWOCH"` |
| `Start Time` / `End Time` | string | `HH:MM` | `"15:15"` |
| `Highlight` | enum | `"Yes"` / `"No"`, inherited from project | — |

Festival dates: September 2026 (Linz, Austria). Times are local (MESZ / CEST).
