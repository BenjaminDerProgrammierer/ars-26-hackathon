# Straßennamen und deren Bedeutung

> **Final verdict: USE.** Include both current and historical CSVs after light address normalization. The rich German narratives and Wikidata links support venue-based history stories, although the source has no geometry.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Straßennamen und deren Bedeutung](https://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6) |
| Data access | [Current streets CSV](https://data.linz.gv.at/katalog/stadt/strassen/Strassennamen-aktuell.csv) and [historical streets CSV](https://data.linz.gv.at/katalog/stadt/strassen/Strassennamen-historisch.csv) |
| Format | Two UTF-8 CSVs with BOM observed in review |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | About 1,211 current and 369 historical/renamed Linz street records observed |
| Data vintage | Distributions catalog-modified 2025-03-07; annual cadence stated in review |
| Last verified | 2026-07-15: direct CSV fetch did not complete; schema and counts below are observations from 2026-07-13 |

## What the dataset contains

The current file provides about 1,211 street-name records with cadastral district, narrative description, official links, naming subject, and Wikidata enrichment. The historical file adds roughly 369 former or renamed streets, the current successor street, naming and deletion years, and gender-related namesake information. Together they cover about 1,580 records.

Descriptions are substantive German prose, including location descriptions, naming history, dates, and biographical context. Historical records capture politically significant renamings as well as ordinary changes. Wikidata fields are populated for many, but not all, streets or namesakes.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `ID` | Source record identifier; keep current and historical namespaces/source file visible |
| `Name` | Current or historical street name; primary address-match field |
| `KG` | Cadastral district, useful for disambiguation |
| `Beschreibung` | German narrative about location and naming history |
| `Aktuelle Straße` | Historical file's current successor name |
| `Jahr der Benennung`, `Jahr der Löschung` | Historical naming/deletion years |
| `Benannt nach` | Person, place, concept, or other namesake |
| Wikidata street/person IDs and links | Optional external enrichment keys; often missing |
| Person `Name`, `Geschlecht`, `Beruf`, birth/death dates | Namesake attributes for thematic analysis, where populated |

## Access and technical characteristics

Download and retain both CSVs; using only the current file loses renaming history. Parse with a CSV library that accepts a UTF-8 BOM. Preserve German source text and links exactly, while creating separate normalized name columns for matching. Do not strip meaningful suffixes such as `Straße`, `Gasse`, `Weg`, or `Platz`; normalize spelling variants in a controlled alias table.

No line geometry or coordinates are included. For a venue-level story, matching an Ars address to `Name` can attach the narrative without geocoding. Walking routes or all streets traversed between venues require an external street network or geocoder, with separate licensing and provenance.

## Data quality and limitations

- There is no geometry, so proximity and routing are impossible from these files alone.
- German-only prose needs translation for an English interface; retain the original beside any machine translation.
- Wikidata and biographical fields are sparse and apply mainly where the namesake is notable and identifiable.
- Street-name normalization can create false matches, especially for historic/current names and abbreviated addresses.
- Sensitive historical material requires contextual presentation rather than gamified decontextualization.
- The 2025 catalog date does not guarantee every narrative or external Wikidata link is current in 2026.

## Using it with the Ars Electronica dataset

### Join strategy

Extract the street component from cleaned Ars venue addresses. Normalize Unicode, whitespace, common abbreviations (`Str.` only when unambiguous), and hyphen variants, then exact-match against current `Name`. Use postcode/city or `KG` where available to resolve collisions. Join historical rows through `Aktuelle Straße`, and maintain a reviewed alias table rather than fuzzy matching every name automatically. The join is textual; venue WGS84 coordinates remain separate.

### Suitable hackathon uses

- “Why is this street named that?” stories at festival venues.
- Hidden-history, renaming, or commemorative-name walks.
- Audio/AR narratives using `Beschreibung` and reviewed Wikidata enrichment.
- Analysis of namesake professions or gender, with completeness caveats.
- A Linked Data interface inspired by
  [Mapping Diversity](https://mappingdiversity.eu/), using the existing Wikidata
  IDs as entity links while retaining the Linz narratives and provenance.

### Do not use it for

- Street routing, geocoding, or exact map placement without an external geometry source.
- Claims that missing Wikidata/person values mean “unknown” in reality.
- Unreviewed translations or simplistic conclusions from incomplete gender data.

## Preparation recipe

1. Download both CSVs and record retrieval date, checksums, source URLs, license, and catalog vintage.
2. Parse UTF-8 with BOM, preserve source fields, and add source-table plus normalized-name columns.
3. Validate IDs, duplicate names, current-successor references, year ranges, and URL/Wikidata formats; keep nulls explicit.
4. Extract and normalize Ars address street tokens, build a reviewed current/historical match table, and retain match confidence.
5. Publish German originals with optional clearly labeled translations and external-geometry provenance where mapping is added.

## Decision rationale

The final decision remains **USE** because the files are compact, technically simple, unusually rich in narrative content, and join directly to a field the Ars venue data already carries: address. Rainer's 2026-07-13 review rated them “Recommended.” The lack of geometry limits mapping but does not block venue-based storytelling; it simply makes external street geometry a separate, transparent dependency.

The 2026-07-15 stakeholder follow-up confirmed that the Wikidata links were
already part of the review and added Mapping Diversity as the concrete product
reference. This strengthens the use case without changing the technical verdict.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/807645f0-2e80-4e24-b142-3673b108dde6)
- [Official current-streets CSV](https://data.linz.gv.at/katalog/stadt/strassen/Strassennamen-aktuell.csv)
- [Official historical-streets CSV](https://data.linz.gv.at/katalog/stadt/strassen/Strassennamen-historisch.csv)
- [Mapping Diversity](https://mappingdiversity.eu/) (product and Linked Data reference)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/strassennamen.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
