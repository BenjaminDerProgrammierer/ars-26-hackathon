# Linztermine – Übersicht über Veranstaltungen

**Verdict:** ✅ Recommended — the city's live event calendar is a direct thematic twin of the festival calendar and covers the exact festival window.
**Catalog:** https://www.data.gv.at/katalog/datasets/dfa2ff35-d2c4-4196-9989-a1bdbeabbfed
**Format / License / Last updated:** Live XML REST endpoint (also a TXT interface doc), CC BY 4.0, continually updated (metadata `dct:modified` 2023 but data is live/dynamic).

## What the data actually contains
- Live XML API: `https://www.linztermine.at/schnittstelle/downloads/events_xml.php` with URL params `lt_datefrom` / `lt_dateuntil` (`yyyy-mm-dd hh:mm:ss`), `lt_location_id`, `lt_tag_id`, `lt_organizer_id`.
- Verified live query for the festival window returned **187 events for 2026-09-05 … 2026-09-14** — real, richly populated data.
- Per event: `id`, `firstdate`/`lastdate`, `properforchildren`, `freeofcharge`, `roottag`, CDATA `title` + long German `description`, `organizer` (id, name, website), `location` (id + name), `tags` (id + label, e.g. "Museen & Ausstellungen"), and one or more `<date dFrom= dTo=>` slots per event.
- No coordinates in the feed — `location` is an id + name only (categories carry a legacy "Old CategrieID" placeholder).
- Encoding is declared ISO-8859-1 in the XML (metadata claims utf8).

## Relation to the Ars Electronica dataset
- **Time overlap** (strongest join): `dFrom`/`dTo` slots map directly onto the 178 festival calendar time slots → "everything else on in Linz during festival week", conflict/gap finders, personal planners.
- **Semantic/spatial via location name**: `location` names (e.g. museums, halls) can be text-matched to the 111 festival venue names; venues like Ars Electronica Center are shared civic landmarks. Coordinates come from the Ars venue side, not this feed.
- **Category/audience filters**: `freeofcharge`, `properforchildren`, and tag labels let an app blend free/family-friendly non-festival events near festival zones.

## Caveats
- No geocoordinates in the feed — spatial proximity to festival venues requires name matching (or a separate Linz location dataset), which is fuzzy.
- XML only (no JSON/CSV/GeoBSON) and ISO-8859-1 encoding — parsers must handle CDATA + charset explicitly.
- API defaults to "now + 7 days" if no date range given; always pass explicit `lt_datefrom`/`lt_dateuntil` for the Sept 2026 window.
- Content is German-only (no EN descriptions).
