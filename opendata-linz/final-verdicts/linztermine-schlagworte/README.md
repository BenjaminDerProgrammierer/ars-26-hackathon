# Linztermine – Schlagworte

> **Final verdict: USE WITH PREPARATION AS A HELPER ONLY.** Include this taxonomy inside the Linztermine bundle and ship an explicit Ars-category crosswalk. It has no standalone event, date, or location value.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / Linztermine.at |
| Catalog | [Linztermine – Schlagworte](https://www.data.gv.at/katalog/datasets/fb08a46d-69ca-4fb0-baac-67557c933341) |
| Data access | [Live tag XML](https://www.linztermine.at/schnittstelle/downloads/tags_xml.php) and [official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Tags.txt) |
| Format | UTF-8 XML with a two-level hierarchy; companion plain-text documentation |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | Controlled vocabulary used by Linztermine events: 5 top-level tags and about 25 subtags observed |
| Data vintage | Rolling/dynamic endpoint; catalog metadata was modified 2023-06-14 |
| Last verified | 2026-07-15: live XML could not be independently fetched; content and endpoint behavior below are observations from 2026-07-13 |

## What the dataset contains

This is a small German event-category dictionary. The 2026-07-13 review found five top-level tags—`Freizeit & Unterhaltung` (1), `Kunst & Kultur` (2), `Diverses` (3), `Sport & Bewegung` (4), and `Musik` (5)—plus roughly 25 child terms. Relevant leaves included `Festivals` (105), `Museen & Ausstellungen` (201), `Theater & Kabarett` (203), `Literatur` (205), and `Konzerte & Unterhaltung` (501).

It contains labels and IDs only. The companion Linztermine event feed is the parent dataset that supplies actual event records and references these tags.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| Tag `id` | Numeric identifier referenced by event records and API filtering |
| Tag `name` | German display label; preserve verbatim alongside any translation |
| Parent/child nesting | Defines the two-level taxonomy and enables broader category rollups |
| Local Ars crosswalk | Organizer-created mapping from festival categories to one or more Linztermine tag IDs |

## Access and technical characteristics

Use the official `tags_xml.php` endpoint as the machine-readable vocabulary and convert it into a compact UTF-8 JSON lookup. Preserve numeric IDs as strings or integers consistently across the tags and events imports. Record the parent ID for each subtag so the hierarchy survives flattening.

The live endpoint was reported as fast, well-formed UTF-8 XML on 2026-07-13. An automated check on 2026-07-15 did not complete, so do not claim present availability from the older observation. Cache the small response with retrieval metadata rather than making every prototype depend on the live service.

## Data quality and limitations

- The vocabulary is tiny and German-only.
- It has no dates, event records, coordinates, organizer details, or venue details.
- No official mapping to Ars project categories exists; any crosswalk is an editorial interpretation.
- A single Ars category may require multiple Linz tags, and apparently similar labels may have different scope.
- Catalog modification time is not the same as taxonomy content vintage.

## Using it with the Ars Electronica dataset

### Join strategy

Create a reviewed many-to-many table such as `ars_category`, `linz_tag_id`, `mapping_note`, `confidence`, and `reviewed_at`. Plausible starting points from the dated review include Concert → 501, Exhibition → 201, and Festival → 105, but validate these against actual event usage before presenting a unified filter. Join Linz event tags by ID; join Ars projects through the crosswalk, never by assuming the two systems share identifiers.

### Suitable hackathon uses

- Shared filters in a combined festival-and-city event browser.
- Broader category rollups using the parent/child hierarchy.
- A transparent translation layer between Ars categories and German civic-event labels.

### Do not use it for

- Standalone dataset discovery or analysis.
- Automatic semantic equivalence without human review.
- Inferring event topics that are not represented in the actual event-tag links.

## Preparation recipe

1. Fetch and snapshot the XML with retrieval date, checksum, source URL, and license.
2. Parse all parent and child IDs/names into UTF-8 JSON; validate unique IDs and valid parent references.
3. Draft and manually review the Ars-to-Linz many-to-many crosswalk against representative events.
4. Bundle taxonomy, crosswalk, provenance, and companion events together; hide this helper from standalone dataset listings.

## Decision rationale

The portfolio decision remains **USE WITH PREPARATION AS A HELPER ONLY**. Rainer's 2026-07-13 verdict was “Borderline” because the data is clean and useful as a lookup but too small and relational to stand alone. Central preparation converts that narrow value into a practical shared filter while preventing teams from overinterpreting a hand-authored category mapping.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/fb08a46d-69ca-4fb0-baac-67557c933341)
- [Official live XML](https://www.linztermine.at/schnittstelle/downloads/tags_xml.php)
- [Official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Tags.txt)
- [Hands-on source review](../../2026-07-13-reviews-rainer/linztermine-schlagworte.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
