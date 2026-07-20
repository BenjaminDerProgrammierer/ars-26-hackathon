# Rückmeldung zum aktualisierten Export vom 20. Juli 2026

Martin bestätigte, dass das Feedback vom 6. Juli nachvollziehbar war und die
meisten Punkte an der Quelle oder im Export-Workflow behoben wurden. Der
aktuelle Export steht weiterhin unter
<https://ars.electronica.art/negotiatinghumanity/hackathondata/> bereit.

## Änderungen

- **IDs und Referenzen:** Jeder Datensatz hat nun `canonical_id`, immer als
  reinen 32-stelligen Hash. Alle `Linked-*`-Felder enthalten genau diese Werte.
  Das sprechende `id` bleibt zur Lesbarkeit erhalten. Zuvor hatte ein Fehler
  beim Aufbau des JSON den technischen Wert mit der sprechenden Spalte
  überschrieben.
- **Locations:** Alle 138 Location-IDs sind befüllt und eindeutig. Generische
  Räume wie `Level 1` oder `Foyer` werden über die Eltern-Kind-Hierarchie
  disambiguiert. 122 Locations behalten ihre Notion-ID; für 16 wird die ID
  deterministisch aus Hierarchie und Name erzeugt. `id_source` unterscheidet
  `notion` und `derived`.
- **Kalender:** Alle 278 Slots haben eine eigene eindeutige ID. Die frühere ID
  war tatsächlich eine Projekt-ID, was die Dubletten verursachte. Zusätzlich
  gibt es `project_ref` und `slot_status`; 25 aktuell nicht zugeordnete Slots
  sind als `unassigned` markiert.
- **Führende Relation:** Der Kalender ist führend, dokumentiert in
  `_meta.usage`. `projects.calendar_ids` wird aus dem Kalender abgeleitet und
  ist die vollständig auflösbare Rückrelation.
- **Sichtbarkeit:** Jeder Datensatz trägt `public_for_hackathon`,
  `link_allowed`, `status_web` und `visibility_rule`. Derzeit gilt nur `done`
  als sichtbar; der Export ist wegen des noch nicht finalen Datenstands bewusst
  streng. `offline` bedeutet anzeigen, aber nicht verlinken. Der für August
  angekündigte Export soll statt Test-Platzhaltern nur tatsächliche Daten
  enthalten.
- **URLs:** Alle 1.980 im Export enthaltenen URL-Werte haben ein Protokoll.
- **Koordinaten:** Die Location-Koordinaten sind noch nicht vollständig geprüft
  und werden sich voraussichtlich nochmals ändern.
- **Textlängen:** Überschreitungen der redaktionell empfohlenen Längen werden in
  `_meta.quality` gemeldet; Inhalte werden nicht gekürzt.

## Verifikation des bereitgestellten Exports

Der am 20. Juli abgerufene Export wurde um `07:59:49Z` erzeugt und bestätigt
die genannten Record Counts, eindeutigen IDs, 16 abgeleiteten Location-IDs,
226 abgeleiteten Kalender-IDs sowie 253 vollständig auflösbare
`projects.calendar_ids`. `_meta.quality` weist weiterhin sechs verdächtige
Koordinaten und 96 Längenwarnungen aus.
