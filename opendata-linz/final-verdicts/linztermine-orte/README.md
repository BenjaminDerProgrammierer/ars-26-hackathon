# Linztermine – Orte

> **Final verdict: USE.** Bundle this venue registry with Linztermine events as the identity bridge to Ars locations. It supplies stable city-calendar IDs and hierarchy, but not coordinates.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / Linztermine.at |
| Catalog | [Linztermine – Orte](https://www.data.gv.at/katalog/datasets/3cca23c2-2aa6-4421-96db-8b914de62d56) |
| Data access | [Live locations XML](https://www.linztermine.at/schnittstelle/downloads/locations_xml.php) and [official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Ort.txt) |
| Format | XML with CDATA text; companion plain-text documentation |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | About 428 Linz locations and child sites observed, including cultural venues |
| Data vintage | Rolling endpoint; catalog metadata was modified 2023-06-14 |
| Last verified | 2026-07-15: live XML could not be independently fetched; schema and counts below are observations from 2026-07-13 |

## What the dataset contains

The dated source review found about 428 `<location>` and nested `<site>` entries. Records include a numeric ID, name, street, postcode, city, state, telephone, description, and website link. Top-level locations can contain child sites that reference their parent through `subof`.

This hierarchy is directly relevant to the festival. The review confirmed Ars Electronica Center as location ID `358`, with child sites `242743` “Main Deck” and `700109` “Deep Space.” Similar building/room relationships appear in the Ars location export.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `id` | Stable Linztermine location/site key; referenced by companion event records |
| `subof` | Parent location ID for a child site; use to resolve rooms to buildings |
| `name` | Venue/site label used for matching to Ars locations |
| `street`, `postcode`, `city`, `state` | Address components for disambiguation and optional geocoding |
| `telephone`, `link` | Venue contact and official website enrichment |
| `description` | Free text, mostly empty in the reviewed sample; do not require it |

## Access and technical characteristics

Parse the official XML rather than scraping the public website. CDATA-wrapped fields and trailing whitespace require XML-aware parsing plus text trimming. Flatten both `<location>` and `<site>` into one table, retain a record-type field, and preserve `subof` as a foreign key.

No coordinates were observed, despite a catalog keyword suggesting geodata. Do not fabricate them from the location ID. If a map needs geometry, carry forward cleaned WGS84 coordinates from matched Ars locations or separately geocode the address and label the result as derived.

The endpoint served plausible rolling data on 2026-07-13 but could not be re-fetched through the automated check on 2026-07-15. Cache a dated snapshot for the hackathon and treat endpoint availability as operationally uncertain, not permanently broken.

## Data quality and limitations

- Some text has trailing whitespace and needs normalization.
- Names may differ by abbreviation, punctuation, language, or building/room granularity.
- No WGS84 or projected coordinates are supplied.
- Not every Ars location will have a Linztermine counterpart.
- Contact fields may be empty or organization-level; verify before prominent display.
- The 2023 catalog modification date does not prove payload vintage.

## Using it with the Ars Electronica dataset

### Join strategy

First inherit or resolve parent buildings on both sides. Normalize Unicode, case, repeated whitespace, punctuation, and common abbreviations, then compare venue names. Use normalized street and postcode to confirm ambiguous candidates. Seed deterministic matches such as Ars Electronica Center → `358`, but publish an explicit crosswalk with match method and confidence rather than performing fuzzy matching at runtime. Retain Ars WGS84 coordinates after the match.

### Suitable hackathon uses

- Resolve shared venues across festival and city calendars.
- Surface non-festival events at the same building during festival week.
- Preserve room-to-building hierarchy for navigation and grouped schedules.
- Add official venue websites and contact details to matched locations.

### Do not use it for

- Nearest-venue calculations without external or Ars-derived coordinates.
- Assuming equal names imply equal physical rooms.
- Automatically overwriting festival venue data with a lower-confidence fuzzy match.

## Preparation recipe

1. Snapshot the locations XML with retrieval time, checksum, URL, and license.
2. Parse CDATA, trim strings, flatten locations/sites, and validate unique `id` values plus resolvable `subof` references.
3. Normalize both address/name systems and create a manually reviewed Ars-to-Linztermine match table with confidence and notes.
4. Attach cleaned Ars coordinates only after matching, retain provenance for every field, and bundle the result with events.

## Decision rationale

The final decision remains **USE** because this is the missing identity layer between a live city calendar and festival locations. Rainer's 2026-07-13 review rated it “Recommended,” specifically confirming the AEC anchor and useful site hierarchy. Lack of coordinates is a real limitation but not a blocker because the Ars export supplies the spatial side after its coordinate defects are cleaned.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/3cca23c2-2aa6-4421-96db-8b914de62d56)
- [Official live XML](https://www.linztermine.at/schnittstelle/downloads/locations_xml.php)
- [Official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine_Ort.txt)
- [Hands-on source review](../../2026-07-13-reviews-rainer/linztermine-orte.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
