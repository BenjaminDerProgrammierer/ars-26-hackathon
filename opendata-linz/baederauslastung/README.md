# Bäderauslastung

> **Current status: REQUEST DATA — DO NOT SCRAPE BY DEFAULT.** No open dataset
> was found or evaluated. Ask LINZ AG for an anonymous, machine-readable feed or
> a licensed festival snapshot before building a scraper.

## Source candidate

The public-facing
[Bäderauslastung page](https://www.linzag.at/portal/de/privatkunden/freizeit/baederauslastung/Bderauslastung.html)
appears to expose current occupancy information as a web application. The
hackathon review has not established its underlying endpoint, update cadence,
history, terms, field semantics, or whether automated reuse is permitted.

## Requested data

Ask LINZ AG for:

- an anonymous JSON/CSV endpoint or recurring snapshot;
- facility IDs and names, capacity/occupancy semantics, observation timestamps,
  update cadence, and temporary-closure states;
- license, attribution, caching, redistribution, and rate-limit terms;
- a stable fallback snapshot suitable for demos during the hackathon.

The data provider invited requests for missing datasets and explicitly asked the
team to contact LINZ AG directly. Use the supplied private contact operationally,
but do not add personal contact details to this public repository.

## Scraping fallback

Consider a scraper only if LINZ AG declines or cannot supply a feed, the page's
terms and robots policy permit automated access, and the team accepts the
maintenance risk. A scraper must rate-limit requests, identify stale values,
avoid bypassing authentication or access controls, and never infer exact visitor
counts from an unexplained occupancy indicator.

## Decision gate

Promote this candidate only after source access, license, schema, freshness, and
fallback behavior have been verified. Until then it is a data request, not a
usable dataset.
