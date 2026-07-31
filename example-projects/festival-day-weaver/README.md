# Festival Day Weaver // Linz

A browser-only itinerary planner for Ars Electronica Festival 2026. Visitors
select public festival projects, add the times shown in the official program,
and receive a chronological day plan with estimated walking transfers,
departure suggestions, feasibility warnings, nearby drinking-water/toilet
stops, and pre-filled LINZ AG EFA journey queries.

## Run locally

```bash
npm install
npm run prepare-data
npm run dev
```

## Why times are entered manually

The bundled Ars Electronica snapshot contains public projects and venues, but
its public calendar rows do not currently resolve to public projects. The
preparation script follows the dataset contract and therefore emits no
official event slots instead of using hidden/test records or parsing display
text from projects. The interface explains this and lets visitors enter times
from the official festival program. If a repaired export is used later,
`npm run prepare-data` will include trustworthy slots automatically.

## Prototype boundaries

Walking time is a straight-line estimate with a 25% street allowance, not
navigation. Service stops are ranked by estimated detour and use City of Linz
snapshots from 2023/24; operation, opening hours, access, and accessibility may
have changed. EFA links open the documented LINZ AG legacy journey-planner
response in a new tab because the service does not permit direct browser
requests. Always verify the official festival program and route before travel.
