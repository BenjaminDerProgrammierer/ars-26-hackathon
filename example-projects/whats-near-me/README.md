# What's Close? // Linz

A browser-only “what’s near me?” prototype built with Vite, TypeScript, HTML,
and CSS—without a JavaScript framework or backend.

The app uses prepared open datasets from this repository:

- public drinking-water points;
- public toilets;
- public Wi-Fi locations;
- the Linz municipal tree inventory.

It calculates distances locally, supports browser geolocation, and offers three
Linz starting points when location access is unavailable. An OpenStreetMap
background provides street context while the nearby results scroll independently.

## Run locally

```sh
npm install
npm run dev
```

Build the static site with:

```sh
npm run build
```

## Data notes

The source data is provided by the City of Linz under CC BY 4.0. Service
details have different vintages: Wi-Fi is from 2022, fountains and toilets are
from 2023/24, and trees are from 2026. The prototype therefore describes
recorded locations and does not claim that services are currently operational.

Street-map tiles are loaded directly from OpenStreetMap and require an internet
connection. The browser sends ordinary tile requests, including its IP address
and page referrer, to the OpenStreetMap service.
