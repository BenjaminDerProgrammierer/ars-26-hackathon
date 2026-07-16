# Parkscheinautomaten

> **Final verdict: DO NOT USE in the curated bundle.** The missing CRS defect is
> fixed, but a static parking-machine layer remains low value beside the stronger
> transit and accessibility sources. It is technically usable for a team with a
> specific parking use case.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz; data owner listed as Bürger*innen-Angelegenheiten (BA) |
| Catalog | [Parkscheinautomaten Standorte 2023](https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888) |
| Data access | Public `.shp`, `.shx`, `.dbf`, `.prj`, and `.cpg` downloads |
| Format | ESRI Shapefile point layer; UTF-8 attributes |
| CRS | MGI / Austria GK Central (EPSG:31255), declared by the added `.prj` |
| License | CC BY 4.0 |
| Coverage | 251 records in the 2024 DBF; the 2023 edition contained 269 |
| Data vintage | 2024-02-07; the complete 2024 file set supersedes the 2023-06-23 edition |
| Last verified | 2026-07-16; the 2024 multipart layer and DBF record count were verified in the publisher directory |

## Contents and technical characteristics

The source fields include machine number (`PSA`), address (`Standort`), parking
duration zone (`Zone`), notes (`Anmerkung`), projected `X`/`Y`, and `GUID`. The
publisher's `.prj` resolves the original ambiguity: the geometry uses EPSG:31255
and can be transformed rather than geocoded or guessed. The 2024 edition retains
the same DBF record width and exposes 251 records, down from 269 in 2023; the
reason for the difference is not documented and should not be inferred as a
simple count of closures.

Issue [#8](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/8)
reported the missing projection definition. The `.prj` was added to the catalog
on 2026-07-15. The publisher also exposed a complete 2024 five-file directory,
which is now the recommended edition if a team chooses this source.

## Limitations and use

- A machine point does not establish parking availability, price, current operation, accessibility, or legal restrictions.
- Machine locations, NFC support, zones, and payment rules may have changed since the 2024 snapshot.
- The layer is multipart and needs EPSG:31255-to-EPSG:4326 conversion.
- If used, preserve `PSA`, `Standort`, `Zone`, `Anmerkung`, and `GUID`, validate transformed points against known addresses, and label the source vintage.

## Decision rationale

The technical blocker is gone. The portfolio still excludes the dataset by
default because its narrow parking-machine use case and static vintage add less
value than transit, accessible parking, and visitor-service layers.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888)
- [Added 2023 `.prj`](https://data.linz.gv.at/katalog/geodata/parkscheinautomaten/2023/Parkscheinautomaten_20230623.prj)
- [Public 2024 directory](https://data.linz.gv.at/katalog/geodata/parkscheinautomaten/2024/)
- [Issue #8](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/8)
