# GPS Art Maker // Linz

A browser-only concept that turns an uploaded image into a GPS-art route on an
interactive OpenStreetMap of Linz. It demonstrates local image processing,
route visualization, nearby drinking fountains, directions, and GPX export
without uploading the image. The route map also shows nearby public toilets.

## Run locally

```bash
npm install
npm run dev
```

## Prototype boundaries

The image's sampled silhouette points are passed to the public FOSSGIS
OpenStreetMap/OSRM foot-routing service, so the resulting geometry follows
mapped pedestrian streets and paths. This requires an internet connection and
is still not turn-by-turn navigation. Before walking it, verify crossings,
access, construction, and current conditions. Fountain and public-toilet dots
come from City of Linz snapshots with 2023 data and do not guarantee current
operation, drinkability, opening hours, location, or accessibility.
