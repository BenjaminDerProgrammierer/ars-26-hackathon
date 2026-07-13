# Linztermine – VeranstalterInnen

**Verdict:** ✅ Recommended — live, well-populated organizer registry that includes Ars Electronica (id 7) and other festival venues; text/address join.
**Catalog:** https://www.data.gv.at/katalog/datasets/9c0a65e3-db8c-4784-98df-b856a9cd3576
**Format / License / Last updated:** XML (live endpoint) + TXT schema doc; CC BY 4.0; metadata modified 2023-06-14, but the XML endpoint serves current/live data (accrual: continual).

## What the data actually contains
- ~1611 `<organizer>` records fetched live from https://www.linztermine.at/schnittstelle/downloads/organizers_xml.php
- Fields per organizer: `id` (attribute), `name`, `street`, `postcode`, `city`, `state`, `telephone`, `link` (website)
- All sampled fields populated with plausible values (e.g. id 7 = "Ars Electronica Linz GmbH & Co KG", Ars-Electronica-Straße 1, 4040 Linz; also Landestheater, Brucknerhaus, Posthof, Nordico Stadtmuseum)
- Addresses only — NO coordinates/geometry despite "Geodaten" keyword
- UTF-8, CDATA-wrapped strings; clean, easy to parse

## Relation to the Ars Electronica dataset
- Semantic/name join: organizer names map to festival venues/organizers ("Ars Electronica Center", "Brucknerhaus", "Posthof" etc.) — id 7 is the explicit anchor confirmed in the metadata description
- Address join: organizer street + postcode can be matched to Ars venue addresses, or geocoded to reach venue WGS84 coords for spatial linking
- App idea: enrich festival venues/partners with official contact info (phone, website) and a directory of Linz cultural organizers beyond the festival itself
- This is the companion "organizers" table to the larger Linztermine events feed, giving stable IDs for cross-referencing

## Caveats
- XML only (no CSV/JSON); consumers must parse XML and normalize names for fuzzy matching
- No coordinates — spatial joins require geocoding the addresses first
- It's a broad city-wide organizer list; only a handful of the 1611 records are festival-relevant, so filtering/matching effort is needed
- Metadata "modified" date is 2023, but the served payload is live; treat the endpoint, not the DCAT date, as the vintage
