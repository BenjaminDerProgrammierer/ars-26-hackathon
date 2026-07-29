# Who Comes to Linz?

A browser-only data story built with Vite, TypeScript, HTML, CSS, and SVG. It
compares countries represented by public Ars Electronica Festival 2026 contacts
with the origins recorded in Linz's 2024 accommodation statistics.

The app combines:

- public festival contacts and their public linked projects;
- quarterly guest arrivals and overnight stays by origin;
- an interactive comparison plot and ranked country table; and
- a transparent detail view for every represented country.

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

`src/country-data.json` is a small derived snapshot. Festival contacts are
included only when `public_for_hackathon` is `true`. Their linked projects are
resolved through `canonical_id`; unresolved filtered relations are omitted
rather than replaced. A contact with more than one explicit country contributes
once to each named country.

After downloading a current festival export to
`../../ars-dataset/notion_export.json`, rebuild the snapshot with:

```sh
npm run prepare-data
```

You can also pass another verified export:

```sh
python3 prepare_data.py /path/to/notion_export.json
```

## How to read the comparison

The two datasets describe different populations. “Festival contacts” are the
published people and organizations in the available festival export—not ticket
holders or all festival participants. “Guests” are aggregated accommodation
arrivals in Linz during 2024—not unique people, residents, day visitors, or
festival attendance. Country overlap therefore reveals a conversation between
two snapshots, not causation.

Tourism data: Stadt Linz, CC BY 4.0. Festival snapshot provenance is displayed
in the app.
