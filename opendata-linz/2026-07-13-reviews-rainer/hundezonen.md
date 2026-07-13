# Hundezonen (Verbots-/Freilaufzonen)

**Verdict:** ❌ Drop — thematically appealing but the published data is not actually downloadable.
**Catalog:** https://www.data.gv.at/katalog/datasets/35538aec-3486-4ef1-9b15-840b359c5a5e
**Format / License / Last updated:** ESRI Shapefile only (5 components: .shp/.shx/.dbf/.prj/.cpg), CC BY 4.0, modified 2024-06-10 (data vintage 2023).

## What the data actually contains
- Per DCAT metadata: locations of dog zones, dog runs (Hundeausläufe), dog-ban zones and free-run zones in Linz — polygon geometry, publisher Stadtgrün und Straßenbetreuung (SGS).
- All 5 distributions are Shapefile parts; there is NO CSV/JSON/GeoJSON and no WFS/API distribution.
- Every distribution's `dcat:accessURL` is an internal SMB/UNC path (`file://///ugl.linz.at/dataugl/opencommons_ugl/.../HUNDEZONEN.*`) with no `dcat:downloadURL` — not reachable from the public internet.
- I could not fetch a single record. Probes of plausible public endpoints (data.linz.gv.at opendata path, CKAN package_show, data.linz.gv.at / gisdata geoserver WFS GetCapabilities) all returned 404 or the SPA shell.
- Coordinate system unverified (would be in the .prj, likely EPSG:31255/MGI or ETRS89) since files are inaccessible.

## Relation to the Ars Electronica dataset
- Strong concept-level fit: spatial join of dog-zone polygons against the 111 venue WGS84 coordinates (~48.30N, 14.29E) → "which festival venues are near a dog free-run area / inside a dog-ban zone" for a dog-friendly festival companion.
- Could annotate walking routes between venues with nearest legal dog areas.
- But every join is blocked because the underlying geometry cannot be obtained through the catalog.

## Caveats
- Effectively a dead-link dataset: distributions point only at an internal Linz file share; no public download resolved after several attempts.
- Shapefile-only would already be heavy for a hackathon (needs GDAL/reprojection) even if it were reachable.
- Data is stale (2023 vintage) but staleness is minor here — dog zones change slowly; access, not freshness, is the blocker.
- If a working public download (GeoJSON/WFS) can be sourced out-of-band, this could be revisited as Borderline given the good thematic fit.
