# Linztermine – Schlagworte

**Verdict:** ⚠️ Borderline — a tiny, clean category taxonomy that is only useful as a lookup/crosswalk, not as standalone data.
**Catalog:** https://www.data.gv.at/katalog/datasets/fb08a46d-69ca-4fb0-baac-67557c933341
**Format / License / Last updated:** XML (live endpoint) + TXT interface doc; CC BY 4.0; dataset modified 2023-06-14, distributions from 2023-03-28, marked `continual`/`dynamisch`.

## What the data actually contains
- The XML endpoint (https://www.linztermine.at/schnittstelle/downloads/tags_xml.php) returns instantly and is well-formed UTF-8.
- It is a two-level controlled vocabulary of event keywords: **5 top-level tags** with **~25 subtags**, each with a numeric `id` and German `name`.
- Top-level tags: Freizeit & Unterhaltung (1), Kunst & Kultur (2), Diverses (3), Sport & Bewegung (4), Musik (5).
- Relevant leaves include "Festivals" (105), "Museen & Ausstellungen" (201), "Theater & Kabarett" (203), "Literatur" (205), "Konzerte & Unterhaltung" (501).
- No dates, coordinates, or event records — this is purely the tag dictionary that the Linztermine event feed references.

## Relation to the Ars Electronica dataset
- **Semantic/category join:** map Ars project categories (Exhibition, Workshop, Concert, ...) onto these Linz subtag IDs — e.g. Concert → 501, Exhibition → 201, Festival → 105.
- Acts as a controlled vocabulary to normalize/tag Ars projects so they can be blended into a city-wide Linz events browser or filtered with the same facets.
- Only becomes powerful when paired with the actual Linztermine event feed (which carries the dates/venues); on its own it just supplies the labels.

## Caveats
- Tiny (~30 terms total) and German-only; no direct festival data — value is entirely as a crosswalk/lookup layer.
- IDs are stable integers, good for joins, but there is no machine-readable mapping to Ars categories (must be hand-authored).
- "Erklärung der Schnittstelle" points at https://data.linz.gv.at/katalog/Freizeit/Linztermine_Tags.txt (interface doc, not sampled in depth); the live tag XML is the authoritative source and worked on first request.
