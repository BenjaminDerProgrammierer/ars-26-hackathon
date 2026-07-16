# Spielplätze und Sportanlagen

> **Final verdict: USE.** Keep the simple WGS84 playground/sports CSV as the
> default family-oriented source. The repaired 2023 equipment Shapefile is now
> available as a richer optional layer after conversion from EPSG:31255.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Playground/sports CSV](https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7); [2023 equipment layer](https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359) |
| Data access | Public CSV plus public `.shp`, `.shx`, `.dbf`, `.prj`, and `.cpg` equipment files |
| Format | Semicolon CSV with WGS84 point WKT; ESRI Shapefile equipment polygons in EPSG:31255 with UTF-8 attributes |
| License | CC BY 4.0 |
| Coverage | About 158 combined playground/sports-facility points; richer 2023 playground-equipment polygons |
| Data vintage | CSV content spans roughly 2017-2023; equipment layer is a 2023 snapshot |
| Last verified | 2026-07-15; all five corrected equipment-layer files downloaded successfully |

## Sources and fields

The default CSV contains facility class, name, area/district, activity or
equipment category, address, web link, and WGS84 point geometry. It needs
Latin-1/Windows-1252 decoding and explicit filtering so sports facilities are
not mislabeled as playgrounds.

The 2023 equipment layer documents `GUID`, `SPIELPLATZ` (name or address), and
`GERAETEART` (equipment type). Its `.prj` declares MGI / Austria GK Central
(EPSG:31255), and `.cpg` declares UTF-8. Issue
[#5](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/5)
originally reported internal file-share URLs; the catalog now exposes a complete
public component set.

## Using it with the Ars Electronica dataset

For the CSV, parse WKT as WGS84 and spatially join facilities to cleaned venue
coordinates. For the equipment layer, reproject from EPSG:31255 to EPSG:4326,
validate geometries, and optionally aggregate equipment to playground level.
Return source vintage, facility class, name/address, and distance.

Suitable uses include a dated family-break companion or nearby recreation
finder. Do not claim current equipment, safety inspection, supervision,
accessibility, opening hours, or walking routes from proximity alone.

## Preparation recipe

1. Decode and normalize the working CSV, parse its WGS84 WKT, and filter facility classes.
2. Optionally download all five equipment files, profile fields/geometries, and reproject from EPSG:31255.
3. Validate coordinates and polygons against known Linz sites and cleaned festival venues.
4. Publish a dated GeoJSON/CSV snapshot with CC BY 4.0 attribution and clear source-layer labels.

## Decision rationale

The working CSV remains the easiest default source. The publisher fix makes the
equipment layer reproducible and useful for advanced teams, but it does not
remove the freshness and safety caveats.

## Sources

- [Official working CSV catalog](https://www.data.gv.at/katalog/datasets/b77d0b46-306c-46da-b26d-6e4dd718fde7)
- [Official 2023 equipment catalog](https://www.data.gv.at/katalog/datasets/b5c88eba-dcd7-4e1f-85cb-640d3eeec359)
- [Issue #5](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/5)
- [Original hands-on review](../archive/2026-07-13-reviews-rainer/spielplaetze.md)
