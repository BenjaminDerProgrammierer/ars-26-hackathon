# Linztermine – VeranstalterInnen

> **Final verdict: USE.** Bundle this organizer registry with Linztermine events and locations. It provides the stable organizer IDs used by the event feed and a confirmed Ars Electronica anchor, but only a curated subset is festival-relevant.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / Linztermine.at |
| Catalog | [Linztermine – VeranstalterInnen](https://www.data.gv.at/katalog/datasets/9c0a65e3-db8c-4784-98df-b856a9cd3576) |
| Data access | [Live organizers XML](https://www.linztermine.at/schnittstelle/downloads/organizers_xml.php) and [official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine%20-%20Veranstalter.txt) |
| Format | UTF-8 XML with CDATA text; companion plain-text documentation |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | About 1,611 city-calendar organizer records observed, including major cultural institutions |
| Data vintage | Rolling endpoint; catalog metadata was modified 2023-06-14 |
| Last verified | 2026-07-15: live XML could not be independently fetched; schema, count, and example IDs below are observations from 2026-07-13 |

## What the dataset contains

The source review observed approximately 1,611 `<organizer>` records. Each record carries an ID, organization name, address components, telephone number, and website. Sampled entries included Ars Electronica, Landestheater, Brucknerhaus, Posthof, and Nordico Stadtmuseum.

Organizer ID `7` was confirmed as `Ars Electronica Linz GmbH & Co KG`, with Ars-Electronica-Straße 1, 4040 Linz. The ID belongs to the same namespace referenced by organizer elements and filters in the companion Linztermine events feed.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `id` | Stable organizer key for event joins; preserve exactly |
| `name` | Organization label used for semantic matching and display |
| `street`, `postcode`, `city`, `state` | Address fields for disambiguation or derived geocoding |
| `telephone` | Public contact detail; validate presence and formatting before display |
| `link` | Organizer website supplied by the source |
| Event `organizer` reference | Foreign-key relationship from the Linztermine event feed |

## Access and technical characteristics

Use the official XML endpoint. Parse with an XML library, decode as UTF-8, unwrap CDATA, and trim text. Treat `id` as the canonical source key and avoid replacing it with a normalized name. Build a cached JSON lookup keyed by ID and join it to the events snapshot.

Addresses do not include coordinates. Optional geocoding should use the full address, store match confidence and provider provenance, and never be confused with publisher geometry. For festival integration, name and address matching to known Ars organizations/venues is usually more defensible than bulk geocoding all 1,611 rows.

The endpoint was accessible during the 2026-07-13 review, but the 2026-07-15 automated fetch did not complete. Ship a snapshot and keep a refresh helper rather than making a demo depend on continuous service availability.

## Data quality and limitations

- The broad registry contains many organizers with no festival relevance.
- Organization names can differ by legal suffix, abbreviation, punctuation, or brand name.
- Addresses are not guaranteed to be event locations and should not be treated as venue geometry.
- No coordinates are provided despite a catalog geodata keyword.
- Contact details may become outdated; retain retrieval time and avoid implying endorsement.
- Catalog modification date and rolling payload vintage are different concepts.

## Using it with the Ars Electronica dataset

### Join strategy

Join Linztermine events to organizers directly on the source organizer ID. For Ars integration, seed ID `7` as the reviewed Ars Electronica anchor, then normalize organization names and compare address/website evidence for other candidates. Create a small reviewed crosswalk with Ars entity, Linz organizer ID, match method, confidence, and notes. Do not match solely because an organizer and a venue share a cultural brand.

### Suitable hackathon uses

- Enrich a combined calendar with official organizer names and websites.
- Build a curated directory of cultural organizations connected to festival venues.
- Filter city events by confirmed partner or shared organizer.
- Explore organizer networks only where the event relationship is explicit.

### Do not use it for

- Mapping events at the organizer's postal address.
- Treating all 1,611 organizations as festival partners.
- Publishing unreviewed fuzzy entity matches or stale contact information as authoritative.

## Preparation recipe

1. Snapshot organizer XML with source URL, checksum, retrieval time, and license.
2. Parse CDATA to UTF-8 JSON, trim fields, validate unique IDs, and normalize phone/URL only in derived columns.
3. Join to Linztermine events by organizer ID and create a manually reviewed Ars entity crosswalk starting with ID `7`.
4. Publish only needed organizer fields in the prepared bundle, with provenance and snapshot date; keep raw data separately.

## Decision rationale

The final portfolio decision remains **USE**. Rainer's 2026-07-13 review rated the registry “Recommended” because it is well populated, relationally clean, and contains a confirmed Ars Electronica identifier. Its value comes through the event feed and curated entity matches, not as an independent geographic dataset. Central filtering keeps its broad scope from overwhelming teams.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/9c0a65e3-db8c-4784-98df-b856a9cd3576)
- [Official live XML](https://www.linztermine.at/schnittstelle/downloads/organizers_xml.php)
- [Official interface notes](https://data.linz.gv.at/katalog/Freizeit/Linztermine%20-%20Veranstalter.txt)
- [Hands-on source review](../../2026-07-13-reviews-rainer/linztermine-veranstalterinnen.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
