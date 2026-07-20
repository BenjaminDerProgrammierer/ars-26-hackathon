# Offene Punkte im Schema-v2-Export vom 20. Juli 2026

Danke für die umfangreichen Verbesserungen am Export. Die neuen
`canonical_id`-Werte, eindeutigen Kalender- und Location-IDs, die führende
Kalenderrelation sowie die Sichtbarkeits- und Qualitätsfelder lösen die
wichtigsten Punkte aus unserem Feedback vom 6. Juli.

Wir haben den Export mit `schema_version: 2.0`, erzeugt am
`2026-07-20T07:59:49.183Z`, nochmals über alle vier Datenbanken hinweg geprüft.
Dabei sind die folgenden offenen Datenqualitäts- und Zuordnungspunkte
aufgefallen. Die genannten Zahlen beziehen sich genau auf diesen Export.

## 1. `calendar.Language` enthält den Projekttitel

Bei allen 253 zugeordneten Kalenderzeilen stimmt `calendar.Language` nicht mit
`projects.Language` überein. Statt der Sprache enthält das Feld jeweils den
englischen Projekttitel.

Beispiele:

| Projekt | `calendar.Language` | `projects.Language` |
|---|---|---|
| `We Guide You: Homo futuris EN` | `We Guide You: Homo futuris EN` | `EN` |
| `We Guide You: Homo futuris DE` | `We Guide You: Homo futuris DE` | `DE` |
| `Pre-Opening Walk` | `Pre-Opening Walk` | `null` |

`Category`, `Highlight` und `Linked Location` stimmen bei allen 253
zugeordneten Slots mit dem jeweiligen Projekt überein. Das Problem scheint
daher auf das konfigurierte Rollup für `Language` begrenzt zu sein.

Für Timetable-, Filter- und Empfehlungs-Apps ist die Sprache ein wichtiges
Feld. Hilfreich wäre, wenn `calendar.Language` auf `projects.Language` zeigt
oder im Kalender weggelassen wird, falls die Sprache ausschließlich über das
Projekt gelesen werden soll.

## 2. Derzeit gibt es keine öffentlich nutzbare Projekt-Slot-Kombination

Der Export enthält 261 Projekte mit `public_for_hackathon: true`. Davon haben
13 Projekte insgesamt 33 zugeordnete Kalender-Slots. Alle diese 33 Slots sind
jedoch selbst `public_for_hackathon: false`.

Umgekehrt sind sieben Kalender-Slots öffentlich markiert:

- zwei davon sind `unassigned` und haben kein Projekt;
- fünf sind Projekten zugeordnet, deren `public_for_hackathon` jeweils
  `false` ist. Dabei handelt es sich um `Test Project` beziehungsweise
  `Test Event3 Subitem`.

Damit gibt es im aktuellen Export keinen einzigen zugeordneten Slot, bei dem
sowohl das Projekt als auch der Kalender-Slot öffentlich ist. Eine Demo-App,
die die dokumentierte Sichtbarkeitsregel auf beide Datensätze anwendet, kann
daher noch keinen öffentlichen Timetable anzeigen.

Für den nächsten Export wäre hilfreich, entweder

1. die Sichtbarkeit der finalen Kalender-Slots mit der Sichtbarkeit ihrer
   Projekte abzugleichen, oder
2. ausdrücklich zu dokumentieren, ob für Timetable-Apps nur die Sichtbarkeit
   des Projekts maßgeblich sein soll.

## 3. Zwei Projekt-zu-Location-Referenzen lösen nicht auf

Von 412 Werten in `projects["Linked Location"]` lösen 410 auf. Zwei Projekte
verweisen auf dieselbe nicht vorhandene Location-ID
`39838ddb450c80a78ef2dd8d43f5aa81`:

| Projekt | Projekt-ID |
|---|---|
| `Sound Bananas` | `38038ddb450c81119265da26c0b37b56` |
| `Common Fields` | `39d38ddb450c8161a927fa9fe6c0bcce` |

Hilfreich wäre, die fehlende Location in `locations` aufzunehmen oder die
beiden Referenzen auf die korrekte vorhandene `canonical_id` zu ändern. Falls
die Location bewusst nicht exportiert werden soll, sollten die Referenzen aus
dem Hackathon-Export entfernt werden.

## 4. Ein zugeordneter Kalender-Slot hat keine Zeitangaben

Der Kalender-Slot `36638ddb450c80d0b4a4e9d6f92c0de4` ist als `assigned`
markiert und mit dem Projekt `Pre-Opening Walk`
(`34a38ddb450c8008a8f1f210e52d1fb0`) verbunden. Gleichzeitig sind `Time`,
`Weekday`, `Start Time` und `End Time` alle `null`.

Dadurch kann der Slot zwar einem Projekt zugeordnet, aber nicht in einem
Timetable platziert werden. Falls bereits ein Termin bekannt ist, sollten die
Zeitfelder ergänzt werden. Andernfalls wäre ein expliziter Status für
„zugeordnet, aber noch nicht terminiert“ klarer als ein regulärer
`assigned`-Slot ohne Datum.

## 5. Sechs Koordinaten bleiben auffällig

Die sechs bereits in `_meta.quality.suspicious_coordinates` ausgewiesenen
Locations liegen alle bei ungefähr `48.09619 / 14.84447` und damit deutlich
außerhalb des erwarteten Linzer Bereichs:

| Location | `canonical_id` |
|---|---|
| `Sky Loft` | `34238ddb450c81db8331ed81749f47d2` |
| `Level 2` | `34238ddb450c81548247d561daeedea8` |
| `Level 1` | `34238ddb450c8181b5c5e0f011589861` |
| `Level 3` | `34238ddb450c81468114db52034f02fb` |
| `Kids Research Lab` | `34238ddb450c81d4866ad7268e357c21` |
| `Connected Earth` | `34238ddb450c81ff8d79d606f0361f97` |

Die Kennzeichnung über `coordinates_ok: false` ist für Apps bereits sehr
hilfreich. Korrigierte Koordinaten im nächsten Export würden Karten- und
Routen-Anwendungen zusätzlich ermöglichen, diese Räume wieder direkt zu
verwenden.

## Bereits gut gelöste beziehungsweise nicht blockierende Punkte

- Alle 1.482 Datensätze haben eine eindeutige, nicht leere `canonical_id`.
- Alle 253 zugeordneten Projekt-Kalender-Relationen und die abgeleiteten
  `projects.calendar_ids` lösen vollständig auf.
- Die 25 nicht zugeordneten Kalender-Slots sind mit `slot_status: unassigned`
  eindeutig gekennzeichnet.
- Die URL-Normalisierung funktioniert; `_meta.quality.unparsable_urls` ist
  leer.
- Die 96 Längenüberschreitungen sind als redaktionelle Hinweise
  maschinenlesbar dokumentiert und aus unserer Sicht kein Datenfehler.

## Priorität aus unserer Sicht

1. Das falsche `calendar.Language`-Rollup korrigieren.
2. Die Sichtbarkeit von öffentlichen Projekten und ihren Slots abstimmen.
3. Die zwei nicht auflösbaren Location-Referenzen korrigieren.
4. Den Slot ohne Zeitangaben vervollständigen oder eindeutiger kennzeichnen.
5. Die sechs auffälligen Koordinaten prüfen und nach Möglichkeit korrigieren.

Mit diesen Punkten wäre der Export für typische Hackathon-Anwendungen wie
Timetables, Sprachfilter, Karten und persönliche Festivalpläne ohne zusätzliche
projektspezifische Annahmen nutzbar.
