# Beherbergungsbetriebe

> **Final verdict: DO NOT USE for the proposed hotel/venue use case.** Despite the title, this is a city-wide monthly tourism series, not a registry of accommodation establishments. It contains no hotel names, addresses, or coordinates.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Beherbergungsbetriebe (Linz)](https://www.data.gv.at/katalog/datasets/29b3204e-49e8-4728-9cff-9447f1b6c29e) |
| Data access | Annual files; the latest reviewed file was [`gesbbg_2024.csv`](https://data.linz.gv.at/katalog/tourismus/entwicklung/2024/gesbbg_2024.csv) |
| Format | Semicolon-delimited CSV; Latin-1/Windows-1252-compatible encoding observed in the source review |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | Monthly totals for the whole city of Linz, split into domestic and foreign guests |
| Data vintage | Annual files from 2003 through 2024 in the reviewed catalog; newest observations are 2024 |
| Last verified | 2026-07-15: official file could not be independently fetched; schema and values below are observations from 2026-07-13 |

## What the dataset contains

Each annual file has one row per month. The reviewed 2024 file contained 12 rows plus a header. Measures cover arrivals and overnight stays, each split into domestic and foreign totals. Values are plausible integers; for example, the source review recorded September 2024 arrivals of 24,637 domestic and 25,777 foreign guests, and 46,102 domestic plus 52,232 foreign overnight stays.

It does **not** contain individual accommodation businesses, star ratings, available rooms, addresses, or geographic coordinates.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `Monat` | German month label; combine with the file year to form a proper monthly date key |
| `angekommene Gäste InländerInnen` | Arrivals by domestic guests |
| `angekommene Gäste AusländerInnen` | Arrivals by foreign guests |
| `Übernachtungen InländerInnen` | Overnight stays by domestic guests |
| `Übernachtungen AusländerInnen` | Overnight stays by foreign guests |
| File year + month | The only practical row key; there is no establishment or location identifier |

## Access and technical characteristics

The catalog lists 22 annual CSV resources spanning 2003–2024. Use a real CSV parser with `;` as delimiter and transcode the source encoding to UTF-8 before matching headers or month values. Parse measures as integers and add an explicit `year` derived from the file path; otherwise identical month labels repeat across files.

The 2026-07-13 review inspected `gesbbg_2024.csv`. An automated direct-file check on 2026-07-15 did not complete, so the earlier accessibility observation was not revalidated. The catalog metadata update shown in the local audit was 2025-11-14, but the actual data vintage remains 2024.

## Data quality and limitations

- The title is easy to misread as an establishment directory; the unit is city-month.
- There is no venue, hotel, address, category, capacity, or coordinate field.
- Latest reviewed observations are two years before the September 2026 festival.
- Encoding must be handled explicitly to avoid mojibake in German headers.
- City-wide totals cannot explain festival attendance, hotel availability, prices, or neighborhood demand.

## Using it with the Ars Electronica dataset

### Join strategy

There is no entity or spatial join. At most, build a month-year key and compare the historical September row with the festival month. This is contextual annotation rather than a record-level join to Ars projects, calendar entries, contacts, or locations.

### Suitable hackathon uses

- A small historical chart of Linz arrivals and overnight stays by month.
- A clearly labeled September tourism-context statistic, if a project already needs background context.

### Do not use it for

- “Hotels near my event,” accommodation recommendations, availability, or routing.
- Inferring Ars Electronica visitor counts or causal festival effects.
- Presenting 2024 totals as a forecast or measurement for September 2026.

## Preparation recipe

1. If used outside the curated bundle, download only the required annual files and record their URLs and retrieval dates.
2. Decode as Latin-1/Windows-1252, parse with `;`, normalize headers, and add the year from the file path.
3. Validate that each year has 12 unique months and all measures are non-negative integers.
4. Publish long-form `year`, `month`, `origin_group`, `measure`, `value` data with a visible `source_vintage` field.

## Decision rationale

The final portfolio decision remains **DO NOT USE for the proposed hotel/venue use case**. Rainer's 2026-07-13 review rated it “Drop” because the proposed spatial accommodation concept is impossible with aggregate city-month data. A single historical September number does not justify adding another dataset to the prepared bundle. The separate guest-origin dataset provides a much stronger country join and should be preferred.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/29b3204e-49e8-4728-9cff-9447f1b6c29e)
- [Official 2024 CSV](https://data.linz.gv.at/katalog/tourismus/entwicklung/2024/gesbbg_2024.csv)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/beherbergungsbetriebe.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
