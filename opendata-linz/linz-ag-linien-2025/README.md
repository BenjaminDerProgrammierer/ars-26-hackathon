# LINZ AG Linien 2025

> **Final verdict: USE WITH PREPARATION.** Publish a WGS84 GeoJSON snapshot in
> the default bundle; retain GML or GeoPackage for advanced teams. This is static
> infrastructure geometry, not a timetable.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz / LINZ AG LINIEN |
| Catalog | [Linien, Fahrwege und Haltestellen der LINZ AG LINIEN 2025](https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025) |
| Data access | Use the `*_WGS84.gml` distributions for festival mapping; [Haltestelle_WGS84.gml](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Haltestelle_WGS84.gml) is the stop layer |
| Format | GML plus schemas/overview; the reviewed bundle also offered a GeoPackage and MDB |
| License | CC BY 4.0 in the catalog; also retain the [LINZ AG LINIEN usage terms](https://data.linz.gv.at/nutzungsbedingungen/) |
| Coverage | Stops, stop-area points, route paths, a network graph and related transport layers in greater Linz |
| Data vintage | Static 2025 network edition, issued and modified 2025-10-20; catalog cadence is annual |
| Last verified | 2026-07-15: current official catalog record reviewed; file contents are from the 2026-07-13 source review and were not re-fetched on 2026-07-15 because the publisher host could not be resolved |

## What the dataset contains

The bundle provides complementary vector layers rather than one denormalized
table. The 2026-07-13 hands-on review counted 748 point features in
`Haltestelle_WGS84.gml`. Route paths in `Fahrweg_Linie_WGS84.gml` carry line,
mode and direction attributes. `Fahrweg_Graph` provides the network geometry for
more advanced path work, while `Haltestellenbereichspunkt` represents points
within stop areas. `TIM_Standorte` is an additional mobility-location layer and
should not be mixed into public-transport stops without its own semantic review.

The official catalog supplies equivalent WGS84 and Gauss–Krüger variants. Its
description identifies tram lines `L001`, `L002`, `L003` and `L004` as
`Straßenbahnlinien (BIM)`. Preserve source codes rather than converting them to
bare integers.

### Key fields and identifiers

| Field or concept | Meaning and integration relevance |
|---|---|
| `ID` | Numeric stop identifier observed in the stop layer; preserve as a string-safe source ID |
| `HSTNAME` | Stop name used for display and for assisted matching to EFA results |
| `LINIE` | One or more line identifiers on a route feature, sometimes comma-joined, for example `12,25` or `N83,27,41,43` |
| `VERKEHRSMITTEL` | Transport mode, such as `Bus` |
| `RICHTUNG` | Route direction label |
| WGS84 point | Stop geometry in EPSG:4326; the reviewed GML position appeared as latitude then longitude, so axis order must be handled by the GML parser |
| graph feature | Network geometry for routing experiments; topology semantics must be read from the schema rather than inferred from line crossings |

## Access and technical characteristics

For the prepared bundle, retrieve
[`Haltestelle_WGS84.gml`](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Haltestelle_WGS84.gml),
[`Haltestellenbereichspunkt_WGS84.gml`](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Haltestellenbereichspunkt_WGS84.gml),
[`Fahrweg_Linie_WGS84.gml`](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Fahrweg_Linie_WGS84.gml)
and, if required,
[`Fahrweg_Graph_WGS84.gml`](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Fahrweg_Graph_WGS84.gml).
The source also publishes GK31-5 variants in EPSG:31255. Never combine those
projected metre coordinates with WGS84 venue degrees.

GML is XML with namespace-qualified fields and CRS-aware coordinate order; use a
GIS/GML reader rather than ad hoc string parsing. The reviewed stop example was
`48.3277 14.3305`, which is latitude then longitude under EPSG:4326 GML axis
order. GeoJSON expects `[longitude, latitude]`, so conversion must swap into that
order. Validate the resulting extent around roughly 48.21–48.35 N and
14.20–14.38 E before publishing.

## Data quality and limitations

- The edition is a 2025 network snapshot. It does not encode the September 2026
  schedule, temporary diversions, disruption status or vehicle positions.
- Route geometry shows where services run, not when or how often they run.
- A comma inside `LINIE` is a multi-value delimiter, not part of one line ID.
  Trim tokens but retain values such as `N83` and `L001` as strings.
- A geometric route intersection is not necessarily a permitted transfer or graph
  connection. Respect source topology and stop-area semantics.
- The static IDs may not be identical to EFA API IDs. Create an explicit
  crosswalk; do not join them solely because both look numeric.

The data provider explicitly asked the hackathon team to approach LINZ AG
directly for additional LINZ AG-controlled data. This does not change the scope
of the published 2025 layer and should not be read as a promise that timetable or
realtime data will be supplied.

## Using it with the Ars Electronica dataset

### Join strategy

Correct the festival location coordinates, inherit parent building locations for
rooms where needed, parse comma decimals and deduplicate building-level points.
Convert the stop GML to GeoJSON `[lon, lat]`, then calculate geodesic or local
projected distances from each canonical venue to candidate stops. Store canonical
venue ID, source stop `ID`, `HSTNAME`, distance and the edition year. For live or
scheduled departures, separately resolve the stop through EFA and maintain a
reviewed static-ID-to-EFA-ID crosswalk.

### Suitable hackathon uses

- Nearest-stop suggestions and walking-distance estimates around venues.
- A static network and line overlay for the festival map.
- First/last-mile exploration or graph-based route sketches, paired with EFA for
  actual departure and trip information.

### Do not use it for

- Timetable, headway, realtime arrival or guaranteed connection claims.
- Assuming the nearest geometry is the accessible entrance or correct platform.
- Routing through graph line crossings without validating network connectivity.

## Preparation recipe

1. Download the WGS84 stop, stop-area and route layers; include the graph only for
   teams that need it.
2. Parse with GDAL or another CRS-aware GML reader and export UTF-8 GeoJSON with
   explicit `[longitude, latitude]` coordinates.
3. Split `LINIE` into a normalized line array while preserving the original text,
   and keep all IDs as stable source strings.
4. Validate 748 stops against the dated source count, the Linz bounding box,
   geometry types and a sample of known stops.
5. Precompute venue-to-stop candidates, manually review major festival zones and
   publish provenance, edition date, license and LINZ AG terms.
6. Ask LINZ AG for current GTFS or NeTEx, realtime/service-status data, stable
   stop-ID crosswalks, and permission/terms suitable for hackathon redistribution.
   Keep the static-only fallback if that request is declined or arrives too late.

## Decision rationale

Rainer recommended the clean WGS84 geometry, and it forms the dependable static
half of a festival mobility bundle. Its GML delivery, axis-order risk and lack of
time data justify organizer conversion and an EFA companion rather than raw-only
distribution.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025)
- [Official stop GML](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Haltestelle_WGS84.gml)
- [Official route GML](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/linien/2025/Fahrweg_Linie_WGS84.gml)
- [Hands-on source review](../archive/2026-07-13-reviews-rainer/linz-ag-linien-2025.md) (observations dated 2026-07-13)
- [Consolidated usability report](../archive/2026-07-13-linz-open-data-hackathon-usability.md)
