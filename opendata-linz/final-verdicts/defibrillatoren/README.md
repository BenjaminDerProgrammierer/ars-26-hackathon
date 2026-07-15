# Defibrillatoren

> **Final verdict: OPTIONAL, PROTOTYPE ONLY.** The file is technically easy to map, but its May 2022 safety-critical locations must not appear in a default visitor guide or be represented as emergency guidance.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; source/contact: Österreichisches Rotes Kreuz, Landesverband Oberösterreich |
| Catalog | [Defibrillatoren Standorte](https://www.data.gv.at/katalog/datasets/866e3d0b-531b-42a0-a82a-3f36dd02b368) |
| Data access | [Defi_Standorte_Linz_2022-05.csv](https://data.linz.gv.at/katalog/gesundheit/defis/2022/Defi_Standorte_Linz_2022-05.csv) |
| Format | CSV, UTF-8; coordinate cells use quoted German comma decimals plus a degree sign |
| License | CC BY 4.0 |
| Coverage | 282 published AED/device records in Linz |
| Data vintage | May 2022; catalog updated 2022-06-03 and distribution metadata modified 2023-03-28 |
| Last verified | 2026-07-15; current official catalog metadata was checked. The CSV was not re-fetched because `data.linz.gv.at` DNS resolution was blocked; file contents below are from the 2026-07-13 source review. |

## What the dataset contains

The reviewed CSV contains 282 data rows describing organizations or buildings with a defibrillator. Each row carries an address, device manufacturer/model information, an in-building placement description, and WGS84 coordinates. Multiple devices can legitimately share one coordinate when they are in the same building, so coordinate duplication is not by itself a data error.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `FIRMA` | Organization or building name; useful for cautious name matching. |
| `Adresse`, `PLZ`, `Stadt` | Street address, postal code, and municipality; retain as the verification-facing location. |
| `Marke/Hersteller` | Published device brand/manufacturer information. |
| `Standort` | Free-text in-building placement description; not a guarantee that visitors can enter or find it. |
| `Koordinaten N`, `Koordinaten O` | Latitude and longitude in WGS84, encoded like `48,307533°` and `14,288317°`. |
| Record identity | No stable source ID was documented; do not invent one that implies permanence. |

## Access and technical characteristics

Use a real CSV parser because the comma-decimal coordinates are quoted inside a comma-separated file. Strip surrounding whitespace and the `°` suffix, replace the decimal comma with `.`, then parse `Koordinaten N` as latitude and `Koordinaten O` as longitude. Validate the plausible Linz range before emitting GeoJSON coordinates in `[longitude, latitude]` order. The review found UTF-8 text and well-populated address/model fields.

The catalog page observed on 2026-07-15 still describes the single CSV distribution, identifies Stadt Linz as publisher and the Red Cross as contact, and dates the data to May/June 2022. That catalog visibility does not establish that every device remains present, accessible, serviced, or available around the clock.

## Data quality and limitations

- The source is more than four years old by the September 2026 festival. AED placement, access rules, opening hours, and device readiness are safety-critical and can change.
- `Standort` is descriptive text, not structured access information. A device inside a building may be inaccessible when that building is closed.
- Duplicate coordinates may represent multiple devices at one building; retain rows rather than collapsing them blindly.
- The CSV has no documented immutable row identifier, complicating change tracking and verification.
- Publisher-file retrieval was blocked on 2026-07-15. The successful 2026-07-13 inspection is retained as a dated observation, not a claim of current endpoint health.

## Using it with the Ars Electronica dataset

### Join strategy

Parse both sources into numeric WGS84 coordinates, clean the festival location outliers and parent/child venue inheritance, then calculate nearest candidates. Name/address matches can be used to flag likely same-building records, but every result must remain explicitly unverified. Keep the source address and `Standort` text visible so a demo does not reduce the record to a misleading pin.

### Suitable hackathon uses

- A fictional or clearly labelled prototype demonstrating how verified safety data could be integrated.
- A data-quality dashboard showing which venues would require fresh AED verification.
- A design study for a publisher-maintained feed, with all live functionality disabled.

### Do not use it for

- Emergency response, route guidance, “nearest available AED” claims, or a public festival safety map.
- Inferring access hours, readiness, or legal responsibility from proximity alone.

## Preparation recipe

1. Ask the Red Cross or publisher for a current verified feed; if none is supplied, retain this file only in the prototype track.
2. Parse UTF-8 CSV, strip `°`, convert German decimal commas, and validate latitude/longitude ranges.
3. Preserve duplicate coordinates and original location text; create only a local technical row key and label it non-authoritative.
4. Package with `source_updated: 2022-06-03`, retrieval date, attribution, and `prototype_only: true`; add an unmistakable “not emergency guidance” notice.

## Decision rationale

The older hands-on review called the layer technically recommended because it is clean, geocoded, and directly joinable. The consolidated portfolio correctly overrides that implementation-focused view for a safety-critical application: stale location data creates an unacceptable risk of false reassurance. It remains **OPTIONAL, PROTOTYPE ONLY** unless the responsible organization provides a current, verified source.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/866e3d0b-531b-42a0-a82a-3f36dd02b368)
- [Official CSV distribution](https://data.linz.gv.at/katalog/gesundheit/defis/2022/Defi_Standorte_Linz_2022-05.csv)
- [Hands-on source review](../../2026-07-13-reviews-rainer/defibrillatoren.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
