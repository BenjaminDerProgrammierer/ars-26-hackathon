# Luftgüte- und meteorologische Messwerte

**Verdict:** ⚠️ Recommended with fallback — live air-quality + weather data maps cleanly onto festival geography, but four of nine catalog station URLs currently fail.
**Catalog:** https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6
**Format / License / Last updated:** JSON REST endpoints (Land OÖ IMM API), CC BY 4.0. DCAT `dct:modified` is stale (2023) but the endpoints serve live rolling data — sampled records were timestamped July 2026 (current as of today).

## What the data actually contains
- 9 distributions, one "letzte 24 Stunden" JSON endpoint per station: 24er-Turm, Freinberg-Sender, Römerberg, Goethestraße, Stadtpark, Schlossmuseum, Chemiepark, Sternwarte, Neue Welt — all in/around Linz.
- Each record: `zeitpunkt` (epoch ms), `messwert` (value, comma decimal e.g. "4,01"), `station` (code e.g. S415), `komponente` (e.g. BOE = wind gust), `mittelwert` (HMW = half-hourly mean), `einheit` (e.g. m/s).
- Keywords/metadata cover the full range: Feinstaub (particulates), Luftschadstoffe, Temperatur, Wind — i.e. both air-quality and meteorological components per station.
- Rolling 24h window: ~48 half-hourly samples per component on working stations.
- Full endpoint check on 2026-07-13: `S184`, `S425`, `S415`, `S416`, and `S431` returned HTTP 200; `L001`, `L002`, `L003`, and `C001` returned HTTP 400.
- No coordinates in the payload, but station names are geocodable Linz landmarks; station codes (S4xx) are stable identifiers.

## Relation to the Ars Electronica dataset
- Spatial join: geocode the 9 station names/codes to WGS84, then nearest-neighbour against the 111 venue coordinates (~48.30 N, 14.29 E). E.g. Schlossmuseum/Stadtpark stations sit right in the central-Linz venue cluster.
- Temporal join: `zeitpunkt` overlaps the 178 September-2026 calendar slots — surface live air quality / wind next to each event's time and venue.
- App idea: "how's the air at your venue right now" overlay, or an outdoor-comfort/wind score for open-air program items and festival zones.

## Caveats
- Metadata `modified` dates (2023) are misleading; data itself is live — don't judge on the stale timestamp.
- Values use German comma decimals as strings; parse accordingly. Timestamps are epoch ms.
- Only a 24h rolling window is exposed — no historical archive, and station coordinates must be geocoded separately (not in the feed).
- Depends on the Land OÖ endpoint staying up during the hackathon; component set varies per station.
- Health-check stations individually and cache the last successful payload; do not assume all catalog distributions are currently operational.
