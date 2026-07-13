# Digitaler Stadtplan TMS/WMTS

**Final verdict: DO NOT USE.** Use basemap.at or OpenStreetMap instead.

**Rainer verdict:** ⚠️ Borderline — the TMS tiles are live and serve a Linz base
map, but the tiling scheme is non-standard and adds no joinable attributes.

The Linz source uses a custom EPSG:31255 GIF/world-file directory scheme with tile
content dated 2016. The separate "WMTS" record points to the national basemap.at,
not a Linz-specific service.

It adds integration cost without unique hackathon data. Standard Web Mercator
basemaps are simpler, fresher, and better supported.

[TMS catalog](https://www.data.gv.at/katalog/datasets/c0df0382-e517-44c6-8863-16008bb6d2d5) ·
[WMTS catalog](https://www.data.gv.at/katalog/datasets/8f057721-c4f7-4979-9fe0-22d55827477a) ·
[Rainer review](../../2026-06-13-reviews-rainer/stadtplan-tms-wmts.md)
