# Behindertenstellplätze

> **Final verdict: USE WITH PREPARATION.** Include this as a converted, dated, prototype-only accessibility layer. It can help visitors discover nearby designated parking, but the 2022 snapshot is not an authoritative statement of availability in September 2026.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz |
| Catalog | [Behindertenstellplätze Standorte 2022](https://www.data.gv.at/katalog/datasets/9c01fb76-047e-47a9-be70-6e883daa92c1) |
| Data access | [Published `.shp` component](https://data.linz.gv.at/katalog/geodata/behindertenstellplaetze/2022/Behindertenparkplaetze_20220621.shp); obtain the matching `.dbf`, `.shx`, and `.prj` as one set |
| Format | ESRI Shapefile point layer; legacy DBF text encoding |
| License | CC BY 4.0; attribution to Stadt Linz |
| Coverage | Designated accessible-parking locations in Linz |
| Data vintage | File dated 2022-06-21; 574 records observed on 2026-07-13 |
| Last verified | 2026-07-15; official URLs and dated local evidence reviewed. The publisher files were not re-fetched because `data.linz.gv.at` DNS resolution was blocked in this environment. |

## What the dataset contains

The source review found 574 point records, one per published accessible-parking location. The attributes are intentionally small: an identifier plus a street and house-number/location description. Examples in the file include landmark-oriented text such as `bei Brucknerhaus`, which is useful to a visitor even when a conventional house number is absent.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `ID` | GUID supplied by the city; retain as `source_id` rather than generating identity from coordinates. |
| `Strasse` | Street name, sometimes including a landmark or explanatory note; useful for a normalized address match. |
| `Hnr` | House number or free text such as `gegenüber 22`; do not force this into a numeric type. |
| Point geometry | Projected source coordinates; the basis for proximity joins after reprojection. |

## Access and technical characteristics

This is a multipart Shapefile, not a standalone `.shp`. The 2026-07-13 review observed `.shp` geometry, `.dbf` attributes, `.shx` index, and `.prj` projection definition. No `.cpg` component was recorded. Keep files with the identical basename together during conversion; a `.shp` without its `.dbf` loses the addresses, and a conversion without `.prj` risks assigning the wrong CRS.

The `.prj` declares **MGI Austria GK Central**, a projected metre-based CRS corresponding to EPSG:31255, rather than longitude/latitude. Reproject from EPSG:31255 to EPSG:4326 for web maps, explicitly requesting traditional longitude/latitude output order. The DBF rendered German umlauts and `ß` incorrectly when treated as UTF-8; the review successfully treated it as CP1252/Latin-1. Detect or set that decoding during conversion and export normalized UTF-8.

## Data quality and limitations

- The snapshot is dated 2022-06-21. Locations, restrictions, construction conditions, and actual vacancy may have changed.
- A point means a designated location in the source, not real-time availability, legal entitlement, route accessibility, or an obstacle-free path from the space to a venue.
- `Hnr` is partly descriptive text, so address geocoding and exact-address joins need manual review.
- Publisher-file availability was not rechecked on 2026-07-15. The source review observed a complete usable layer on 2026-07-13; the later DNS failure is not evidence that it is permanently unavailable.
- This is an accessibility-related layer and must carry `prototype_only: true`, source vintage, attribution, and a visible verification warning.

## Using it with the Ars Electronica dataset

### Join strategy

First clean the festival locations: inherit parent venue coordinates where appropriate and correct or exclude known coordinate outliers. Reproject parking points to EPSG:4326, parse festival comma-decimal coordinates, and compute great-circle or projected walking-area distances. Return several nearby candidates rather than asserting one point is usable. As a secondary check, normalize `Strasse` and `Hnr` against venue address fields while preserving the original German strings.

### Suitable hackathon uses

- A prototype accessibility panel listing dated accessible-parking candidates near each venue.
- Same-street discovery around Brucknerhaus and other recognizable landmarks.
- Coverage visualization that highlights places where publisher verification would be valuable.

### Do not use it for

- Real-time vacancy, navigation guarantees, enforcement, eligibility advice, or an authoritative accessibility claim.
- Direct mapping of raw projected coordinates as latitude/longitude.

## Preparation recipe

1. Download the matching `.shp`, `.dbf`, `.shx`, and `.prj` components and record retrieval time and hashes.
2. Open the layer with its declared MGI Austria GK Central CRS; decode DBF text as CP1252/Latin-1 and export UTF-8.
3. Reproject EPSG:31255 to EPSG:4326, validate several results within Linz, and preserve `ID`, `Strasse`, and free-text `Hnr`.
4. Deduplicate only on `ID`, calculate venue distances from cleaned festival coordinates, and package a dated GeoJSON/CSV snapshot with `prototype_only: true`.

## Decision rationale

The points have a strong, direct spatial relationship to festival venues and can improve an inclusive visitor prototype. The conversion, legacy encoding, and four-year freshness gap are manageable for an organizer-prepared bundle but inappropriate to hide from teams. This preserves the portfolio decision of **USE WITH PREPARATION**, while narrowing the older hands-on “borderline” assessment into a clearly dated, non-authoritative use.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/9c01fb76-047e-47a9-be70-6e883daa92c1)
- [Official `.shp` distribution](https://data.linz.gv.at/katalog/geodata/behindertenstellplaetze/2022/Behindertenparkplaetze_20220621.shp)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/behindertenstellplaetze.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
