# Ars Electronica Festival 2026 – Database Documentation

**Festival:** Ars Electronica Festival 2026 – *Negotiating Humanity*
**Website:** [ars.electronica.art/negotiatinghumanity](https://ars.electronica.art/negotiatinghumanity)
**Data generated:** 2026-07-06

---

## Overview

This dataset contains four interconnected databases exported from the festival's content management system. The databases are linked to each other via IDs (see [Relations](#relations) below).

| Database | Records | Description |
|---|---|---|
| `projects` | 546 | Central database of all projects, collections and events |
| `contacts` | 240 | Artists, speakers, institutions and project partners |
| `locations` | 111 | Event venues (buildings, floors, rooms, outdoor areas) |
| `calendar` | 178 | Individual event time slots |

> **Note on data availability:** Not all fields are included in this export. Personal contact details (e-mail addresses, phone numbers, internal staff assignments) and administrative workflow fields have been removed for privacy and data protection reasons. Fields with `null` values are either not applicable to a given entry or have not yet been filled in.

---

## Relations

The databases reference each other using their `id` fields. All cross-references are stored as **arrays of IDs** (even when there is only one linked entry).

```
projects ──── Linked Contacts ──▶ contacts
         ──── Linked Location ──▶ locations
         ──── Linked Calendar ──▶ calendar
         ──── Linked Parent   ──▶ projects (self)
         ──── Linked Child    ──▶ projects (self)

locations ─── Linked Parent   ──▶ locations (self)
          ─── Linked Child    ──▶ locations (self)

calendar ──── Linked Projects ──▶ projects
         ──── Linked Location ──▶ locations (via rollup)
```

---

## Database: Projects

The central database. Every project, exhibition, workshop, performance, and collection has one entry here. Projects can be nested: a **Collection** or **Exhibition** can have child projects (**Linked Child**), and a project can belong to a parent (**Linked Parent**).

### Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier in the format `Category-Hash` | `Exhibitions-34238ddb…` |
| `Name EN` | string | Project title in English | `"Negotiating Humanity"` |
| `Name DE` | string | Project title in German (if available) | `"Verhandlung der Menschheit"` |
| `Category` | enum | Type of project (see values below) | `"Exhibition"` |
| `Artists` | string | Artist name(s) with country codes | `"Jane Doe (AT), Group Name (DE)"` |
| `Subtitle EN` | string | English subtitle, if any | `"A group exhibition"` |
| `Subtitle DE` | string | German subtitle, if any | — |
| `Web Preview Text EN` | string | Short summary for listings (max. 300 chars) | — |
| `Web Preview Text DE` | string | German version of the preview text | — |
| `Description EN` | string | Full project description in English | — |
| `Description DE` | string | Full project description in German | — |
| `Web Link` | string | URL of the project on the festival website, or `"offline"` | `"https://ars.electronica.art/…"` |
| `Credits short` | string | Short credits for print/signage (max. 500 chars) | — |
| `Credits long` | string | Full credits for the website | — |
| `Funding Line` | string | Funding acknowledgement text | — |
| `Curatorial Highlight` | enum | Whether the project is a curated highlight | `"Yes"` / `"No"` |
| `Website` | string | Project or artist website | `"https://example.com"` |
| `Website Secondary` | string | Secondary website, if any | — |
| `Instagram` | string | Instagram profile URL | — |
| `Facebook` | string | Facebook profile URL | — |
| `LinkedIn` | string | LinkedIn profile URL | — |
| `Video URL` | string | YouTube or Vimeo link (publicly accessible) | — |
| `Linked Parent` | array of IDs | Parent project(s) – references `projects.id` | — |
| `Linked Child` | array of IDs | Child projects – references `projects.id` | — |
| `Linked Contacts` | array of IDs | Artists/partners – references `contacts.id` | — |
| `Linked Location` | array of IDs | Venue – references `locations.id` | — |
| `Linked Calendar` | array of IDs | Time slots – references `calendar.id` | — |
| `Linked Ticket` | string | Required ticket type(s), comma-separated | `"FREE ACCESS"` |
| `Times` | string | Human-readable schedule summary (rollup) | `"Wed Sep 10, 14:00–15:30"` |
| `Recommended Arrival` | string | Minutes before event start that visitors should arrive | `"10"` |
| `Registration URLs` | string | Registration link(s), comma-separated | `"https://…"` |
| `Language` | string | Event language(s), comma-separated | `"EN"` / `"DE, EN"` |
| `Max Participants` | string | Maximum number of participants | `"15"` |
| `Event notes` | string | Access requirements and warnings | `"Registration required"` |
| `Additional Info EN` | string | Extra info: target audience, equipment, accessibility notes | — |
| `Additional Info DE` | string | German translation of Additional Info EN | — |
| `Timetable` | enum | Whether child projects are displayed as a timetable | `"Yes"` / `"No"` |
| `Status Web` | enum | Publication status on the festival website | `"done"` |

### Category values

`Collection`, `Project`, `Exhibition`, `Guided Tour`, `Workshop`, `Symposium`, `Conference`, `Keynote`, `Lecture & Talk`, `Networking Event`, `Performance`, `Concert`, `Experience`, `Event`, `Meet the Artist`, `Open Lab`, `Award Ceremony`, `Screening`

### Status Web values

`pending`, `not ready`, `ready for web`, `new image needed`, `done`, `not needed`

### Linked Ticket values

`FREE ACCESS` or a combination of: `FESTIVALPASS`, `FESTIVALPASS+`, `DAYPASS`, `Ars Electronica Center Ticket`

---

## Database: Contacts

Artists, speakers, institutions and project partners. Each contact is linked to one or more projects via `Linked Projects`.

### Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier in the format `SlugifiedName-Hash` | `"JaneDoe-34238ddb…"` |
| `Name EN` | string | Name in English | `"Jane Doe"` |
| `Name DE` | string | German name (institutions only, if different) | — |
| `Category` | enum | Type of contact | `"Person"` |
| `Pronouns` | enum | Pronouns (individuals only) | `"she/her"` |
| `Country` | string | Country of origin as two-letter code + name | `"AT Austria"` |
| `Description EN` | string | Biography or institutional description (max. 500 chars) | — |
| `Description DE` | string | German translation of the description | — |
| `Linked Projects` | array of IDs | Associated projects – references `projects.id` | — |
| `Status Web` | enum | Publication status | `"done"` |
| `Website` | string | Personal or organisational website | `"https://example.com"` |
| `Instagram` | string | Instagram profile URL | — |
| `Facebook` | string | Facebook profile URL | — |
| `LinkedIn` | string | LinkedIn profile URL | — |

### Category values

`Person`, `Group`, `Organization`

### Pronouns values

`she/her`, `he/him`, `they/them`, `she/her, they/them`, `he/him, she/her`, `other`

### Status Web values

`pending`, `not ready`, `not needed`, `ready for upload`, `new image needed`, `done`

---

## Database: Locations

Event venues for the festival. Locations are hierarchically organised: **Building → Floor → Room**. Outdoor and online locations also exist. Use `Linked Parent` and `Linked Child` to traverse the hierarchy.

### Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier (hash) | `"34238ddb450c81…"` |
| `Name EN` | string | Location name in English | `"Deep Space 8K"` |
| `Name DE` | string | Location name in German | — |
| `Type` | enum | Type of venue | `"Room"` |
| `Description EN` | string | Short description in English (max. 100 chars) | — |
| `Description DE` | string | Short description in German | — |
| `Services` | string | On-site services, comma-separated | `"Ticket Sales, Shop"` |
| `Breadcrumb EN` | string | Full hierarchical path in English | `"Ars Electronica Center, EG, Deep Space 8K"` |
| `Breadcrumb DE` | string | Full hierarchical path in German | — |
| `Area` | enum | Festival zone | `"DANUBE TRIANGLE"` |
| `Place` | string | Full address as Notion Place field | `"Ars-Electronica-Straße 1, 4040 Linz, Österreich"` |
| `Latitude` | string | Geographic latitude (decimal, comma as separator) | `"48,309619"` |
| `Longitude` | string | Geographic longitude (decimal, comma as separator) | `"14,284447"` |
| `Address` | string | Street address | `"Ars-Electronica-Straße 1, 4040 Linz"` |
| `Additional Info EN` | string | Additional visitor notes in English | — |
| `Additional Info DE` | string | Additional visitor notes in German | — |
| `Web Link` | string | URL of the location page on the festival website | `"https://ars.electronica.art/center"` |
| `Link Map` | string | OpenStreetMap link generated from coordinates | `"https://www.openstreetmap.org/…"` |
| `Website` | string | Location's own website | — |
| `Instagram` | string | Instagram profile URL | — |
| `Facebook` | string | Facebook profile URL | — |
| `LinkedIn` | string | LinkedIn profile URL | — |
| `Linked Projects` | array of IDs | Projects at this location – references `projects.id` | — |
| `Linked Parent` | array of IDs | Parent location – references `locations.id` | — |
| `Linked Child` | array of IDs | Child locations – references `locations.id` | — |

> **Note on coordinates:** `Latitude` and `Longitude` are stored as strings with a **comma** as decimal separator (European format). Convert to float by replacing `,` with `.` before use.

### Type values

`Building`, `Floor`, `Room`, `Outdoor`, `Online`

### Area values

`OK QUARTER`, `MED CAMPUS`, `DANUBE TRIANGLE`, `EVENT LOCATIONS`

### Services values

`Ticket Sales`, `Ticket Pick-Up`, `Accreditation Pick-Up`, `Press Pick-Up`, `Shop`, `Program Info`

---

## Database: Calendar

Individual time slots for events. Each calendar entry is linked to **exactly one project** via `Linked Projects`. A project can have multiple calendar entries (e.g. a workshop running on three different days).

### Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier (hash) | `"36638ddb450c80…"` |
| `Linked Projects` | array of IDs | The associated project – references `projects.id` | — |
| `Status Web` | enum | Publication status | `"done"` |
| `Time` | string | Full time range as human-readable string | `"9. September 2026 15:15 (MESZ) → 16:15"` |
| `Arrive by` | string | Recommended arrival time (human-readable) | `"9. September 2026 15:15"` |
| `Registration URL` | string | Registration link for this specific time slot | `"https://…"` |
| `Category` | string | Inherited from linked project (rollup) | `"Workshop"` |
| `Linked Location` | array of IDs | Venue – inherited from linked project (rollup) | — |
| `Language` | string | Event language(s) – inherited from linked project (rollup) | `"EN"` |
| `Recommended Arrival` | string | Minutes before start that visitors should arrive | `"10"` |
| `Duration` | string | Duration of the event in minutes | `"60"` |
| `Event before` | — | Always null in this export | — |
| `Event afterwards` | — | Always null in this export | — |
| `Weekday` | string | Day of the week (formatted) | `"Sep 9, MITTWOCH"` |
| `Start Time` | string | Start time in HH:MM format | `"15:15"` |
| `End Time` | string | End time in HH:MM format | `"16:15"` |
| `Highlight` | enum | Whether this is a curatorial highlight | `"Yes"` / `"No"` |

### Status Web values

`pending`, `done`