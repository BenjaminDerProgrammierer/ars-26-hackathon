# Öffentliche WC-Anlagen

> **Final verdict: USE WITH PREPARATION.** Include a normalized, dated WC layer in the visitor-services bundle. Accessibility and opening information is valuable but must be presented as prototype directory data, not a current accessibility or availability guarantee.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Gebäudemanagement und Tiefbau (GMT) |
| Catalog | [Öffentliche WC-Anlagen Standorte](https://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1) |
| Data access | [Rolling WC_Anlagen.csv](https://data.linz.gv.at/katalog/Freizeit/toiletten/WC_Anlagen.csv), plus dated 2022 and 2023 snapshots in the catalog |
| Format | Semicolon-delimited UTF-8 CSV with quoted embedded line breaks |
| License | CC BY 4.0 |
| Coverage | About 40 public toilet locations across Linz |
| Data vintage | Dataset updated 2023-01-16; distribution metadata touched 2024-07-08; actual 2026 content not established |
| Last verified | 2026-07-15; the current official catalog still documented EPSG:31255 and the rolling CSV. Publisher file contents were not rechecked because `data.linz.gv.at` DNS resolution was blocked. |

## What the dataset contains

The rolling source contains roughly 40 public toilet sites. Records describe staffed/unstaffed type, location name, projected coordinates, accessible entry, Eurokey support, opening hours, changing table, winter closure, and notes such as a usage fee. Recognizable sites include Lentos Kunstmuseum, Hauptplatz, Donaupark, and Urfahrmarkt, providing a strong spatial relationship to festival activity.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `Nr.` | Published running number; retain as source identifier but verify uniqueness. |
| `Art` | Type of WC facility, including staffed/unstaffed descriptions; may contain line breaks. |
| WC facility/name field | German location label such as a landmark or public space. |
| `X`, `Y` | Projected coordinates explicitly documented by the catalog as EPSG:31255. |
| `barrierefrei` | Published yes/no accessible-entry flag; dated and not a full accessibility assessment. |
| `Euro-Key` | Published Eurokey-support flag. |
| `Öffnungszeiten` | German free-text opening hours, including quoted multiline values. |
| `Wickeltisch` | Published changing-table flag. |
| `Wintersperre` | Winter-closure indicator; relevant to interpretation but not proof of September opening. |
| `Anmerkung` | Free-text notes, including possible fees or exceptions. |

## Access and technical characteristics

Use the rolling `WC_Anlagen.csv` for preparation, while retaining dated snapshots for comparison. Parse it with an RFC-compatible CSV reader using `;` as the delimiter and UTF-8 decoding. Do not split on physical lines: `Öffnungszeiten` and `Art` can contain embedded newlines inside quoted fields. Preserve free text even if creating normalized helper fields.

The official catalog explicitly says `X,Y=Koordinaten im Format EPSG 31255`, and the source review observed plausible projected values such as X 70,795 and Y 352,404. Read them as easting/northing in MGI Austria GK Central, reproject EPSG:31255 to EPSG:4326, and emit GeoJSON `[longitude, latitude]`. Validate several named landmarks after conversion to catch axis swaps. This is a declared CRS, unlike the unresolved fountain and parking-machine layers.

## Data quality and limitations

- Dataset dates are 2023/2024, and a rolling filename or metadata touch does not demonstrate that the facilities were checked for September 2026.
- `barrierefrei` is a binary publisher flag, not a description of route, door width, transfer space, lift status, or temporary obstacles.
- Eurokey, changing-table, fee, opening, staffing, and closure status may change; the file has no real-time availability signal.
- Opening hours and notes are German free text with line breaks. Automated parsing can lose exceptions and should never silently become an “open now” guarantee.
- The small record count is appropriate for a directory but may omit other toilets accessible to festival visitors.

## Using it with the Ars Electronica dataset

### Join strategy

Reproject the WC points to WGS84, validate landmark coordinates, and calculate proximity to cleaned festival venue coordinates. Return multiple nearby candidates with original name, distance, accessibility/Eurokey/changing-table flags, hours text, source date, and verification warning. Festival location IDs are incomplete/duplicated, so anchor the result to organizer-canonical venue IDs after hierarchy inheritance rather than raw IDs alone. Any time comparison with calendar rows should retain the unparsed source hours and a low-confidence indicator.

### Suitable hackathon uses

- An inclusive visitor prototype listing nearby public toilets and their dated published attributes.
- A family guide filtering published changing-table information.
- A data-quality or verification workflow for organizer staff before the festival.

### Do not use it for

- Guaranteed “open now,” step-free access, cleanliness, safety, price, or availability claims.
- Mapping raw EPSG:31255 metres as latitude/longitude.

## Preparation recipe

1. Acquire the rolling and latest dated CSVs, record hashes/retrieval time, and compare them to identify actual changes.
2. Parse semicolon UTF-8 CSV with multiline quote support; preserve German free-text values and normalize yes/no flags separately.
3. Reproject declared EPSG:31255 X/Y to EPSG:4326, verify axis order against named landmarks, and validate identifier uniqueness.
4. Join to cleaned canonical venue coordinates and publish dated GeoJSON/CSV with source fields, attribution, `prototype_only: true`, and a visible verification disclaimer.

## Decision rationale

The layer directly supports inclusive and family-oriented festival navigation, contains useful distinctions beyond geometry, and has an authoritative CRS declaration. Its GIS and CSV quirks are straightforward for organizer-side preparation. Because freshness, hours, and accessibility are not operationally verified, the portfolio decision remains **USE WITH PREPARATION**, never an authoritative visitor guarantee.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/461b3bd7-346d-4401-91d6-8009538c54a1)
- [Official rolling CSV](https://data.linz.gv.at/katalog/Freizeit/toiletten/WC_Anlagen.csv)
- [Hands-on source review](../../2026-07-13-reviews-rainer/wc-anlagen.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
