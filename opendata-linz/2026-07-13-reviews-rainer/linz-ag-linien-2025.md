# Linien, Fahrwege und Haltestellen der LINZ AG LINIEN 2025

**Verdict:** ✅ Recommended — clean WGS84 stop/route geodata; the caveat is it's static infrastructure, not a live timetable.
**Catalog:** https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025
**Format / License / Last updated:** GML (WGS84 & GK M31 variants), plus GeoPackage/MDB/PDF; CC-BY 4.0; issued/modified 2025-10-20.

## What the data actually contains
- **Haltestelle_WGS84.gml**: 748 stops, each with `HSTNAME` (e.g. "Katzbachweg"), numeric `ID`, and a `gml:Point` in EPSG:4326 (e.g. `48.3277 14.3305`). Bounding box covers the greater Linz area (48.21–48.35 N, 14.20–14.38 E).
- **Fahrweg_Linie_WGS84.gml**: route line geometries carrying `LINIE` (line numbers, e.g. "12,25", "N83,27,41,43"), `VERKEHRSMITTEL` (mode: Bus, etc.), and `RICHTUNG` (direction).
- Also **Fahrweg_Graph** (routable network graph), **Haltestellenbereichspunkt** (stop-area points), and **TIM_Standorte** — all as GML.
- Every geometry ships in both WGS84 and Gauß-Krüger M31; a `OGD4Stadtplan.gpkg` GeoPackage bundles it for GIS tools.
- Coordinates use dot decimal separator and are directly plottable.

## Relation to the Ars Electronica dataset
- **Spatial proximity join**: match each festival venue (WGS84 coords, ~48.30 N / 14.29 E) to its nearest stop(s) via haversine distance → "closest tram/bus stop to this event, X m away". Both datasets share the same central-Linz footprint.
- **Routing between events**: the Fahrweg_Graph network + stop points let an app snap two venues to stops and sketch a transit path — the core "how do I get from event A to event B" feature.
- **Map overlay**: draw festival venues + calendar time slots on top of the transit network for a unified festival-mobility map.

## Caveats
- **No schedules/departure times** — this is static stop/route geometry, not GTFS. True "in time" arrival planning needs a separate timetable/EFA feed; here you can only estimate proximity and paths.
- **GML, not CSV/JSON** — teams must parse XML (or use the GeoPackage via GDAL/ogr2ogr); a small transform step is required before use.
- `LINIE` bundles multiple line numbers per geometry as comma-joined strings, so per-line filtering needs light parsing.
