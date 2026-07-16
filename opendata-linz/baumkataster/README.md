# Baumkataster (Linz)

> **Final verdict: USE.** Include this in the default hackathon bundle. It is the strongest single Linz dataset for direct spatial enrichment of cleaned Ars Electronica venue coordinates.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Baumkataster (Linz)](https://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d) |
| Data access | Use [Baumkataster aktuell](https://data.linz.gv.at/katalog/umwelt/baumkataster/Baumkataster.csv), not a frozen annual file |
| Format | Semicolon-delimited CSV; dot-decimal WGS84 coordinates |
| License | CC BY 4.0, according to the official catalog and 2026-07-13 source review |
| Coverage | Trees maintained by the City of Linz; point locations plus botanical and size attributes |
| Data vintage | The reviewed current file contained `DatumExport=20260701` (1 July 2026) |
| Last verified | 2026-07-16: the rolling CSV downloaded successfully and still contained 27,004 rows, 15 columns, and `DatumExport=20260701` |

## What the dataset contains

The 2026-07-16 check observed 27,004 inventory records. Records describe genus,
species, cultivar, German common name, height, crown diameter, trunk
circumference, tree type, two coordinate representations, a tree number, and an
export date. The reviewed points lie in the Linz urban area and overlap the
festival's venue extent. Record count must not be reported as a verified count
of unique trees because the source identifiers are not globally unique.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `BaumNr` | Locally reused tree number, not a record key: only 2,024 distinct values occur in 27,004 records. Treat it as a string. The live CSVW metadata defines row subjects from this value despite the collisions. |
| `Flaeche` | Identifier for the managed area/location associated with the tree. |
| `Gattung`, `Art`, `Sorte` | Genus, species, and cultivar; useful for botanical filtering and enrichment. |
| `NameDeutsch` | German common name; retain the source text in user-facing outputs. |
| `Hoehe` | Height in metres. |
| `Schirmdurchmesser` | Crown diameter in metres; a canopy proxy, not measured shade. |
| `Stammumfang` | Trunk circumference in centimetres, per the catalog description. |
| `Typ` | `L` = deciduous (`Laubbaum`), `N` = conifer (`Nadelbaum`). |
| `lon`, `lat` | Longitude and latitude in WGS84 / EPSG:4326; use these for festival joins. |
| `XPos`, `YPos` | Projected Austrian central-grid coordinates, documented by the catalog as EPSG:31255. Do not interpret them as longitude/latitude. |
| `DatumExport` | Export date, observed as `20260701` in the reviewed current file. |

The official CSVW metadata also specifies a `WikidataID (genus)` column. The 2026-07-13 review did **not** find that column in the current CSV header. Do not require it without checking the downloaded file; genus/species can still support later enrichment.

## Access and technical characteristics

Download the rolling `Baumkataster.csv` distribution. The catalog also lists dated annual snapshots, including a 2013 file and a 2026 snapshot; these preserve historical states and are not substitutes for the current file when building a current festival prototype.

The reviewed CSV uses `;` as its delimiter and dot decimals for `lon`/`lat`. Parse it with a CSV library rather than splitting lines manually. Missing cultivars include markers such as `-` and whitespace-prefixed ` -`; trim whitespace and normalize these to null. The tree WGS84 coordinate order is `lon`, then `lat`. Ars coordinates use latitude/longitude semantics and comma decimals in the local festival review, so parse and label both sides explicitly before joining.

## Data quality and limitations

- The current file was accessible and its contents were rechecked on 2026-07-16.
- `BaumNr` is heavily reused. `(Flaeche, BaumNr)` is almost unique but still has
  two duplicate combinations. `(Flaeche, BaumNr, lon, lat)` was unique in the
  checked snapshot, but that does not establish stable identity across exports.
- Catalog modification dates and annual distribution names do not establish the data's true vintage; use `DatumExport` from the acquired file.
- `Sorte` contains inconsistent missing-value markers, and the CSVW schema does not exactly match the reviewed current header.
- Tree dimensions describe an inventory, not direct measurements of shade, temperature, accessibility, or pedestrian comfort.
- Festival coordinates require cleansing first. Six Ars Electronica Center child locations share the outlier `48.09619, 14.84447`; do not let those points distort proximity results.

## Using it with the Ars Electronica dataset

### Join strategy

There is no shared identifier. Use a spatial proximity join: normalize venue coordinate decimal commas to dots, validate latitude/longitude ranges, correct or exclude known outliers, and compare each venue point with tree `lon`/`lat` in EPSG:4326. A bounding-box prefilter followed by haversine distance is sufficient for nearest-tree or radius counts. Deduplicate inherited room/floor coordinates when the analysis intends to compare buildings rather than individual location rows.

### Suitable hackathon uses

- Rank venues or walking-route segments by nearby tree count or estimated crown coverage.
- Build a tree explorer filtered by species, tree type, height, or size.
- Compare green context around festival buildings while clearly stating the chosen radius and metric.
- Link botanical names to external knowledge sources after a separate, validated enrichment step.

### Do not use it for

- Claims about measured shade, thermal comfort, walkability, tree health, or route safety.
- Exact canopy polygons: `Schirmdurchmesser` supports only an approximate circular representation.
- Current operational decisions without confirming the downloaded file's export date and availability.

## Preparation recipe

1. Download `Baumkataster.csv`, record retrieval time, checksum, source URL, license, and `DatumExport`; retain a snapshot for the event.
2. Parse as semicolon CSV, trim text fields, normalize cultivar placeholders to null, and parse numeric fields without changing identifiers.
3. Preserve source fields and generate a snapshot-scoped record key. Validate
   candidate composites, coordinate ranges, dimension ranges, row count, and
   the actual header; report identifier collisions and any mismatch with the
   CSVW metadata. Do not use `BaumNr` alone.
4. Clean festival venue coordinates, then build indexed WGS84 point data or GeoJSON and precompute venue-radius summaries as needed.
5. Publish provenance and describe crown-based outputs as estimates rather than observations of shade.

## Decision rationale

The final portfolio decision remains **USE** because the dataset is current by its reviewed export date, modest in size, directly geocoded in WGS84, thematically rich, and requires only light normalization. It joins to the festival's strongest external key—venue coordinates—and supports several credible visual and routing prototypes. Rainer's 2026-07-13 verdict was likewise “Recommended”; the remaining risks are manageable data-cleaning and interpretation issues, not reasons to exclude it.

## Sources

- [Official data.gv.at catalog](https://www.data.gv.at/katalog/datasets/f660cf3f-afa9-4816-aafb-0098a36ca57d)
- [Official current CSV](https://data.linz.gv.at/katalog/umwelt/baumkataster/Baumkataster.csv)
- [Official CSVW metadata](https://data.linz.gv.at/katalog/umwelt/baumkataster/Baumkataster-metadata.json)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/baumkataster.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md) (portfolio decision dated 2026-07-13)
