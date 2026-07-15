# Spielplätze und Sportanlagen

> **Final verdict: USE THE WORKING CSV.** Use the older combined playground/sports-facility CSV as a dated family-break layer. Do not use the separate 2023 equipment Shapefile until its internal-only resource URLs are replaced with public downloads.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Working playground/sports CSV](https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7); [broken 2023 equipment layer](https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359) |
| Data access | [spielplaetze_und_sportanlagen.CSV](https://data.linz.gv.at/katalog/Freizeit/spielplaetze_sportanlagen/spielplaetze_und_sportanlagen.CSV); 2023 Shapefile components use internal `file://` paths |
| Format | Working semicolon-delimited CSV in Latin-1/Windows-1252; WGS84 point WKT. Broken source is ESRI Shapefile. |
| License | CC BY 4.0 |
| Coverage | About 158 playground and sports-facility records across Linz |
| Data vintage | Working CSV metadata/content dates span 2017-2023; equipment layer is a 2023 snapshot with metadata modified 2024-06-10 |
| Last verified | 2026-07-15; official URLs and dated local evidence reviewed. Publisher-file fetches were DNS-blocked, so contents were not rechecked after the successful 2026-07-13 audit. |

## What the dataset contains

The usable file is a combined point list of playgrounds and sports facilities. Its roughly 158 rows include facility type, name, administrative area/district, neighborhood, activity or equipment category, web link, address, postal code, city, several coordinate representations, and a Google Maps link. It is suitable for finding a nearby family break but does not supply real-time occupancy, supervision, opening status, or a verified inventory for 2026.

The separate 2023 dataset is conceptually richer: equipment-level polygons with playground/address and equipment type. Its data cannot be inspected through the published catalog because the resources point to the municipal internal share.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `Anlage` | Broad facility class, such as playground (`Spielplatz`) or sports facility (`Sportanlage`). |
| `Name` | Facility name for display and cautious text matching. |
| `Bereich`, district number/name, `Stadtteil` | Administrative/grouping context; exact header spelling should be preserved from the file. |
| `Art` | Facility/activity type, for example `Beach Volleyball` or `Fitnessanlage`. |
| `URL` | Publisher reference for the facility when populated. |
| WKT coordinate field | Reliable geometry such as `POINT (14.294362 48.318145)`, in longitude/latitude WGS84 order. |
| Street, `PLZ`, `Ort` | Address components for display and secondary matching. |
| `Koordinate Nord/Ost` | Space-grouped display values; prefer WKT or the decimal Google Maps coordinates. |
| 2023 `GUID`, `SPIELPLATZ`, `GERAETEART` | Advertised equipment-layer fields; unusable until public components are supplied. |

## Access and technical characteristics

Use the CSV from catalog b77d0b46. Parse it with delimiter `;` and decode as ISO-8859-1/Windows-1252, then emit UTF-8. Treat mojibake such as broken `Straße` as an encoding error, not source spelling. Parse WKT with a geometry library or a strict `POINT (lon lat)` parser and validate WGS84 ranges. The WKT already uses GeoJSON-compatible longitude/latitude order; do not swap it based on German `Nord/Ost` display columns.

The 2023 equipment source advertises `.shp`, `.dbf`, and `.shx` parts through `file://///ugl.linz.at/...`; no usable public `.prj` or `.cpg` was available in the reviewed resource set. Its CRS, encoding, feature count, and geometry quality therefore remain unverified. Do not merge catalog descriptions from that broken layer into the working CSV as if they were observed records.

## Data quality and limitations

- The working CSV is dated and the catalog itself points toward newer geodata; facilities, names, equipment, or access conditions may have changed.
- It combines playgrounds with sports facilities. Filter `Anlage`/`Art` explicitly rather than calling every row a playground.
- WKT and Google-link coordinates are preferable to ambiguous space-grouped display columns.
- Family suitability, age range, accessibility, shade, safety inspection status, hours, and capacity are not established by proximity alone.
- The 2023 equipment source is unavailable to external teams; no CRS should be guessed from other city layers.

## Using it with the Ars Electronica dataset

### Join strategy

Decode and parse the working CSV, filter the facility classes needed by the prototype, and spatially join its WGS84 points to cleaned festival venue coordinates. Clean the Ars location hierarchy first so rooms inherit appropriate building coordinates and known outliers are corrected or excluded. Return nearby candidates with distance, facility class, original name/address, source vintage, and a publisher link; avoid claiming that straight-line distance equals walking distance.

### Suitable hackathon uses

- A dated “family break near this venue” companion.
- Pairing daytime workshops or exhibitions with nearby playground/sports options.
- Neighborhood-level exploration of festival venues and public recreation facilities.

### Do not use it for

- Current equipment, safety, supervision, accessibility, opening, or route guarantees.
- Any feature derived from the inaccessible 2023 equipment polygons.

## Preparation recipe

1. Acquire the working CSV, record retrieval date/hash, parse semicolon delimiters, and decode Latin-1/Windows-1252 to UTF-8.
2. Parse WKT as WGS84 longitude/latitude, validate all coordinates, and retain the original coordinate/address fields for provenance.
3. Normalize facility classes and names without collapsing distinct sites; join spatially to cleaned festival venue coordinates.
4. Publish a dated GeoJSON/CSV snapshot. Reassess the equipment layer only after public `.shp`, `.dbf`, `.shx`, `.prj`, and encoding information are available.

## Decision rationale

The working CSV has a direct family-oriented festival use, usable WGS84 geometry, and manageable encoding work, supporting the older technical recommendation. The equipment-level alternative is not reproducible because its files are internal-only. The portfolio decision therefore remains **USE THE WORKING CSV**, with visible staleness and no safety or current-access claims.

## Sources

- [Official working CSV catalog](https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7)
- [Official working CSV distribution](https://data.linz.gv.at/katalog/Freizeit/spielplaetze_sportanlagen/spielplaetze_und_sportanlagen.CSV)
- [Official 2023 equipment catalog](https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359)
- [Publisher defect issue #5](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/5)
- [Hands-on source review](../../2026-07-13-reviews-rainer/spielplaetze.md) (observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
