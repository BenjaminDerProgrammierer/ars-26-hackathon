---
title: "Working with the Festival Dataset"
description: "Understand the four databases in the festival export, how they link together, and the pitfalls to avoid."
order: 1
---

The festival dataset is a single JSON export from the festival's content
system. It contains four interlinked databases: **projects** (~546 entries —
every exhibition, workshop, performance, and talk), **contacts** (~240 artists
and institutions), **locations** (~111 venues), and **calendar** (~178 time
slots). Lorem ipsum dolor sit amet, consectetur adipiscing elit.

## Getting the data

Download the latest export from the official hackathon data endpoint (see the
datasets page). The file is around 2 MB of JSON. Every value is a string, an
array of strings, or `null` — there are no native numbers or booleans, so
parse deliberately. Integer posuere erat a ante venenatis dapibus.

## How the databases link

Records reference each other through ID fields such as `Linked Contacts`,
`Linked Location`, and `Linked Projects`. Watch out: some IDs carry a prefix
before the 32-character hash, so join on the trailing hash. Event times live
in the **calendar** database — link from the calendar side, not from
`projects."Linked Calendar"`. Cras mattis consectetur purus sit amet
fermentum. Sed posuere consectetur est at lobortis.

## Pitfalls

- The export includes internal test entries — filter before you present.
- Coordinates use comma decimal separators ("48,3069").
- Some URLs lack an `https://` protocol prefix.
- Every field can be `null`. Handle it. Aenean eu leo quam, pellentesque
  ornare sem lacinia quam venenatis vestibulum.

> Placeholder: a full walkthrough with code samples in Python and TypeScript
> will appear here. Donec ullamcorper nulla non metus auctor fringilla.
