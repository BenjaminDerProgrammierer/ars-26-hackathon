# EFA Fahrplanauskunft

**Final verdict: USE WITH PREPARATION.** Provide a documented adapter/proxy,
working examples, health checks, and cached fallback.

**Rainer verdict:** ✅ Recommended — live public EFA API (no registration, JSON
output) that already knows "Ars Electronica Center" as a named POI.

StopFinder and departure endpoints worked on 2026-07-13, including an Ars
Electronica Center lookup. The service enables nearest-stop resolution, live
departures, and leave-by guidance tied to festival calendar end times.

The catalog distributions are interface PDFs; the usable endpoint is an external
service without an SLA. Implement the two-step StopFinder-to-departure flow,
respect LINZ AG's extra terms, and never make the live API the only demo path.

[Catalog](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13) ·
[Rainer review](../../2026-07-13-reviews-rainer/efa-fahrplanauskunft.md)
