# Behindertenstellplätze Standorte 2022

**Verdict:** ⚠️ Borderline — real, complete accessible-parking point data, but shipped only as a Shapefile in a projected CRS, so it needs a conversion/reprojection step before use.
**Catalog:** https://www.data.gv.at/katalog/datasets/9c01fb76-047e-47a9-be70-6e883daa92c1
**Format / License / Last updated:** ESRI Shapefile (.shp/.dbf/.shx/.prj) · CC BY 4.0 (Stadt Linz) · data vintage 2022-06-21, metadata modified 2023-03-28. No CSV/JSON/GeoJSON distribution offered.

## What the data actually contains
- **574 point records** of designated disabled parking spaces in Linz (read from the DBF header).
- Only **3 fields**: `ID` (GUID), `Strasse` (street name, often with a helpful location note, e.g. "Krankenhausstraße (AKH Med Campus)", "bei Brucknerhaus"), `Hnr` (house number, sometimes free-text like "gegenüber 22").
- Geometry lives in the `.shp`; coordinates are **MGI Austria GK Central (Transverse Mercator, meters)** per the `.prj` — **not** WGS84, so reprojection to lat/lon is required.
- Street names cover central Linz and match festival-relevant streets/landmarks (Untere Donaulände near Brucknerhaus, Donaulände area, etc.).
- DBF text uses a legacy codepage (ß/ö/ä render garbled in raw bytes); decode as CP1252/Latin-1 when converting.

## Relation to the Ars Electronica dataset
- **Spatial proximity:** after `ogr2ogr`-reprojecting to WGS84, each of the 574 spots can be matched to the 111 venue coordinates (~48.30 N, 14.29 E) to show "nearest accessible parking" per venue.
- **Text/address join:** `Strasse`/`Hnr` can be matched against venue addresses to surface accessible parking on the same street.
- **App idea:** an accessibility-first festival guide that, per project/venue, lists nearby disabled parking, complementing the festival's accessibility notes.

## Caveats
- **Shapefile only** — a hackathon team must run `ogr2ogr`/GDAL (or shapefile lib) to get usable GeoJSON in WGS84; no ready-made JSON.
- **Projected CRS (MGI GK Central)** requires reprojection; forgetting this yields meaningless coordinates.
- **2022 vintage / not updated** — acceptable, since designated parking locations change slowly, but a few spots may be outdated by Sept 2026.
- **Encoding gotcha:** German umlauts/ß in the DBF need CP1252 decoding.
