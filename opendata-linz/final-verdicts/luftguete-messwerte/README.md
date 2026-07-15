# Luftgüte- und meteorologische Messwerte

> **Final verdict: USE WITH PREPARATION AND FALLBACK.** Offer a monitored proxy
> or cached snapshot, not nine untested catalog URLs. Endpoint failure is partial
> and station-specific.

## At a glance

| Item | Details |
|---|---|
| Publisher | Stadt Linz catalog record; measurements served by Land Oberösterreich |
| Catalog | [Luftgüte- und meteorologische Messwerte](https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6) |
| Data access | Nine station-specific Land OÖ JSON endpoints using `?stationcode=…`; example: [S184](https://www2.land-oberoesterreich.gv.at/imm/jaxrs/messwerte/json?stationcode=S184) |
| Format | JSON over HTTP; German comma-decimal numeric strings and epoch-millisecond timestamps |
| License | Creative Commons Attribution 4.0 according to the catalog |
| Coverage | Air pollutants and meteorological components at nine named stations in/around Linz; components vary by station |
| Data vintage | Rolling last 24 hours, not an archive; catalog modification dates are not the measurement timestamps |
| Last verified | 2026-07-15: catalog and local evidence reviewed; endpoint health below was observed on 2026-07-13 and was not rechecked on 2026-07-15 because the Land OÖ host could not be resolved |

## What the dataset contains

Each distribution is a request to the same Land OÖ IMM service with a different
station code. Successful responses contain repeated measurements, approximately
48 half-hour samples per component over a rolling 24-hour window in the reviewed
payloads. The set is mixed: depending on the station it can include pollutants,
particulate matter, temperature, wind, rain and other meteorological components.
Do not assume every station measures every component.

The complete 2026-07-13 endpoint check showed a meaningful partial failure:

| Station code | Station name | Dated endpoint result |
|---|---|---|
| `S184` | Stadtpark | HTTP 200 |
| `S425` | Freinberg-Sender | HTTP 200 |
| `S415` | 24er-Turm | HTTP 200 |
| `S416` | Neue Welt | HTTP 200 |
| `S431` | Römerberg | HTTP 200 |
| `L001` | Goethestraße | HTTP 400 |
| `L002` | Schlossmuseum | HTTP 400 |
| `L003` | Sternwarte | HTTP 400 |
| `C001` | Chemiepark | HTTP 400 |

These status codes describe that check only. They do not prove permanent success
or failure, and the organizer should not hide a working station merely because a
different distribution fails.

### Key fields and identifiers

| Field | Meaning and integration relevance |
|---|---|
| `zeitpunkt` | Observation time as Unix epoch milliseconds; convert with an explicit timezone policy |
| `messwert` | Measurement value encoded as a string, often with a comma decimal such as `4,01` |
| `station` | Stable station code, for example `S415`; primary join to the organizer's station registry |
| `komponente` | Measured component code, for example `BOE` for wind gust; decode through publisher metadata rather than guessing |
| `mittelwert` | Aggregation/mean code, for example `HMW` for half-hourly mean |
| `einheit` | Unit such as `m/s`; retain it with every value and component |

## Access and technical characteristics

The endpoint pattern is
`https://www2.land-oberoesterreich.gv.at/imm/jaxrs/messwerte/json?stationcode=CODE`.
Make nine independent requests through a server-side adapter. A successful HTTP
status is not enough: require valid JSON, a matching `station`, plausible recent
`zeitpunkt` values and parseable measurements. Record health per station and per
request; never collapse the result to a single global “API up” flag.

Parse `messwert` by replacing the decimal comma only after validating its string
shape; do not apply a locale conversion to codes or units. Treat epoch milliseconds
as instants, then render in `Europe/Vienna`. Preserve the raw timestamp, raw value,
normalized numeric value, component, aggregation, unit and retrieval time. Because
the feed rolls over after roughly 24 hours, organizer snapshots are the only
reliable way to retain a festival-period history.

## Data quality and limitations

- Four of nine catalog URLs returned HTTP 400 on 2026-07-13. This is a publisher
  defect or catalog/service mismatch under investigation in [issue #6](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/6),
  not something documentation can repair.
- Station coordinates are absent from the measurement payload. Names alone are
  not a safe spatial join; publish a reviewed code-to-coordinate registry.
- Component coverage and units vary. Never compare values across components or
  stations without matching `komponente`, `mittelwert` and `einheit`.
- A 24-hour rolling feed cannot answer historical conditions for past festival
  slots unless snapshots were captured at the time.
- Measurements are contextual. Do not turn a nearest-station value into a venue-
  specific exposure, safety or medical recommendation.

## Using it with the Ars Electronica dataset

### Join strategy

Create a station dimension keyed by `station`, with official/reviewed name,
WGS84 coordinates, active component codes and provenance. Correct and normalize
festival venue coordinates, then calculate nearest stations or a clearly stated
distance threshold. For live displays, select the most recent valid observation
at or before the current time. For comparisons with calendar slots, join by time
window only to organizer-captured snapshots; future September 2026 events cannot
be joined to measurements before they occur.

### Suitable hackathon uses

- A live environmental context card for outdoor festival zones.
- Wind, temperature or rain context for installations, with station distance and
  observation time visible.
- A data-resilience demonstration showing station-level health and cached values.

### Do not use it for

- Personal health, legal limit compliance or venue-specific exposure advice.
- Historical analysis without a separately captured archive.
- Treating missing/failed stations as zero values or silently substituting another
  component.

## Preparation recipe

1. Build and review the nine-code station registry with WGS84 coordinates and
   component/unit metadata.
2. Poll every endpoint independently; validate HTTP status, JSON shape, station
   code, timestamp recency and numeric conversion.
3. Normalize comma decimals and epoch milliseconds while retaining all raw values.
4. Cache the last successful payload per station and take timestamped snapshots
   during the festival; expose staleness and partial failures to clients.
5. Publish a small proxy schema with `retrieved_at`, `observed_at`, station,
   component, value, unit, health state, license and attribution.

## Decision rationale

The working stations offer unusually relevant live context and Rainer recommended
the source with a fallback. The rolling window, absent coordinates and four dated
station failures make a monitored organizer adapter essential. That preserves the
portfolio verdict: use it, but never as nine raw links or the sole demo path.

## Sources

- [Official catalog](https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6)
- [Official Land OÖ endpoint example (`S184`)](https://www2.land-oberoesterreich.gv.at/imm/jaxrs/messwerte/json?stationcode=S184)
- [Hands-on source review](../../2026-07-13-reviews-rainer/luftguete-messwerte.md) (endpoint observations dated 2026-07-13)
- [Consolidated usability report](../../2026-07-13-linz-open-data-hackathon-usability.md)
- [Publisher defect tracking issue #6](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/6)
