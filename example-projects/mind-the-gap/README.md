# Mind the Gap // Linz

A browser-only festival-day prototype built with Vite, TypeScript, HTML, and
CSS. Select two public Ars Electronica Festival projects, enter when the first
one ends and the next one begins, and choose either a recorded Linz city tree
that fits into the interval or a tree-rich route via a drinking-water point.

The app combines:

- public festival projects and their venue coordinates;
- the Linz municipal tree inventory;
- Linz drinking-water points recorded as operational and potable;
- local distance and walking-time calculations; and
- an embedded OpenStreetMap tile view with pedestrian-routed geometry and a
  route-checking link.

## Run locally

```sh
npm install
npm run dev
```

Build the static site with:

```sh
npm run build
```

## Data preparation

`src/festival-projects.json` is a small derived snapshot containing only
projects where `public_for_hackathon` is `true` and the linked venue has usable,
non-flagged coordinates. Relations are resolved through `canonical_id`.

After downloading a current festival export to
`../../ars-dataset/notion_export.json`, rebuild that snapshot with:

```sh
npm run prepare-data
```

Event times are deliberately entered by the visitor. The checked public export
available while this example was built had broken calendar-to-project
relations, so the app does not fabricate schedules or parse the display-only
`projects.Times` field. Once the export is repaired, a future version can use
authoritative calendar rows and the repository's `event_rows(...,
public_only=True)` helper.

## Prototype boundaries

Walking estimates use straight-line distances, a 25% distance allowance, and a
75-metre-per-minute pace when ranking candidates. Shady routes are ranked by
the number of registered trees within 30 metres of the two estimated
venue–fountain segments, with recorded crown diameter as a tie-breaker. The
displayed line is requested from the public FOSSGIS OpenStreetMap/OSRM
foot-routing service, but it is not turn-by-turn navigation or accessibility
guidance. The tree inventory is dated 1 July 2026 and records trees maintained
by the City of Linz. The fountain source is dated 4 July 2023. Neither dataset
guarantees current access, condition, shade, operation, or potability. Map
tiles, routing, and the directions link require an internet connection and send
ordinary requests, including the visitor's IP address and page referrer, to
those services.
