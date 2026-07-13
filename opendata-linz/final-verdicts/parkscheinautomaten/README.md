# Parkscheinautomaten

**Final verdict: DO NOT USE in the curated bundle.** Reconsider after the CRS is
fixed and only if a team has a specific parking-machine use case.

**Rainer verdict:** ✅ Recommended — real, geolocated parking-machine points in
central Linz; use street addresses to sidestep the missing CRS.

The 269 records have useful addresses and payment/zone attributes, but the
Shapefile omits `.prj` and the projected CRS cannot be used authoritatively. The
2023 snapshot also has weak thematic value beside transit/accessibility data.

The missing CRS is tracked in
[issue #8](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/8).

[Catalog](https://www.data.gv.at/katalog/datasets/bb201cea-ffa7-4490-bf04-5928d276f888) ·
[Rainer review](../../2026-07-13-reviews-rainer/parkscheinautomaten.md)
