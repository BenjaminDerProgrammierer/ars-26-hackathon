# Linztermine – Orte

**Verdict:** ✅ Recommended — clean venue registry with a direct, name-based join to Ars venues (location 358 = Ars Electronica Center confirmed).
**Catalog:** https://www.data.gv.at/katalog/datasets/3cca23c2-2aa6-4421-96db-8b914de62d56
**Format / License / Last updated:** XML (live endpoint) + TXT schema doc; CC-BY 4.0; dataset modified 2023-06-14, but endpoint serves current/continually-updated data.

## What the data actually contains
- ~428 `<location>` / `<site>` entries served live from `https://www.linztermine.at/schnittstelle/downloads/locations_xml.php`.
- Fields per entry: `id`, `name`, `street`, `postcode`, `city`, `state`, `telephone`, `description` (mostly empty), `link` (venue website).
- Two-level hierarchy: top-level `<location>` (e.g. id 108 "OK Linz") and child `<site>` elements with `<subof>` pointing at the parent (e.g. "Ursulinensaal", "Gewölbesaal").
- Ars Electronica Center is id 358, with sub-sites id 242743 "Main Deck" and 700109 "Deep Space" (subof=358).
- Data is populated and plausible: real Linz addresses, valid postcodes, working venue URLs. NO geo-coordinates in the payload (despite "Geodaten" keyword).

## Relation to the Ars Electronica dataset
- Strong text/semantic join: venue names + street addresses match the 111 Ars venues (e.g. "Ars Electronica Center", "Brucknerhaus", "OK Linz"). The `id`/`subof` hierarchy mirrors Ars main-venue → sub-room structure (Deep Space, Main Deck).
- The location IDs are the same namespace used by the companion "Linztermine – Termine" (events) feed — enables enriching Ars venues with the broader city event calendar and venue websites/phone.
- An app could resolve Ars venues to canonical Linz location IDs, then surface non-festival events happening at the same venues during/around September 2026, plus contact info and official links.

## Caveats
- No coordinates here — for spatial joins you must rely on the Ars dataset's own WGS84 coords; this feed only offers name/address matching.
- XML only (CDATA fields); needs parsing, and some name/city fields have trailing whitespace ("Linz            ").
- Name matching to Ars venues is fuzzy (spelling/abbreviation variance) and will need normalization; not every Ars venue will have a Linztermine counterpart.
- Catalog "last modified" is 2023, but the live endpoint appears current; treat vintage as rolling rather than the stale catalog date.
