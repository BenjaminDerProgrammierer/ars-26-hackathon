---
title: "Working with the Festival Dataset"
description: "Understand the four databases in the festival export, how they link together, and the pitfalls to avoid."
order: 1
---

The festival dataset is a single JSON export from the festival's content
system. The current snapshot contains four interlinked databases: **projects**
(546 records), **contacts** (240), **locations** (111), and **calendar** (178
rows), plus export metadata. These are raw CMS records: internal/test content is
mixed in, and a location or calendar row is not necessarily a unique public
venue or event.

## Getting the data

Download the latest export from the official hackathon data endpoint on the
datasets page. The file is around 2 MB of JSON. Fields are nullable in practice,
coordinates use decimal-comma strings, and structured values need deliberate
normalization.

## How the databases link

Records reference each other through fields such as `Linked Contacts`, `Linked
Location`, and `Linked Projects`. Project and contact record IDs carry a prefix,
while links use bare hashes; normalize every ID to its trailing 32-character
hash. Event slots live in **calendar**: join from `calendar."Linked Projects"`,
which resolves reliably, and ignore the broken reverse
`projects."Linked Calendar"` relation.

## Pitfalls

- Filter internal and test entries before presenting the data publicly.
- Coordinates use comma decimal separators, for example `"48,3069"`.
- Some URLs lack an `https://` protocol prefix.
- Location and calendar IDs can be missing or duplicated; they are not unique
  venue or time-slot keys.
- Calendar start/end fields contain only a time of day. Parse the full date from
  the calendar's display string with the provided dataset helper.
- Every field can be `null`. Handle it.

Use the repository's `ars_dataset.py` helper for verification, normalized joins,
parsed event datetimes, coordinates, and test-content filtering instead of
reimplementing these rules in each project.
