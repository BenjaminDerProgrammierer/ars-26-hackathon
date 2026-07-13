# Luftgüte- und meteorologische Messwerte

**Final verdict: USE WITH PREPARATION AND FALLBACK.** Offer a monitored proxy or
cached snapshot, not nine untested catalog URLs.

**Rainer verdict:** ⚠️ Recommended with fallback — live air-quality and weather
data maps cleanly onto festival geography, but four of nine station URLs fail.

Five endpoints returned HTTP 200 on 2026-07-13 (`S184`, `S425`, `S415`, `S416`,
`S431`); four returned HTTP 400 (`L001`, `L002`, `L003`, `C001`). The working
rolling data can contextualize outdoor events with air, temperature, and wind.

Publish station coordinates, normalize epoch timestamps and comma-decimal values,
health-check per station, and cache the last successful payload. The source exposes
only a rolling 24-hour window. Track the publisher fix in
[issue #6](https://github.com/BenjaminDerProgrammierer/ars-26-hackathon/issues/6).

[Catalog](https://www.data.gv.at/katalog/datasets/c312a9a9-fdbc-47e8-9da1-ad3be82dfbd6) ·
[Rainer review](../../2026-07-13-reviews-rainer/luftguete-messwerte.md)
