# Nicht auflösbare Relationen im Export vom 23. Juli 2026

Danke für die Aktualisierung des Hackathon-Datensatzes. Wir haben den unter
<https://ars.electronica.art/negotiatinghumanity/hackathondata/> verfügbaren
Export geprüft. Die Datei wurde laut `_meta.generated_at` am
`2026-07-23T13:22:00.446Z` erzeugt und verwendet weiterhin
`schema_version: 2.0`.

Der Export ist strukturell gültig: Felder, Typen, Enum-Werte, eindeutige
`canonical_id`-Werte, deklarierte Record Counts und Sichtbarkeitsfelder stimmen.
Die Relationen zwischen Projekten, Kalender und Kontakten sind jedoch nach der
Filterung des Exports nicht mehr referenziell vollständig. Dadurch kann aus dem
Export derzeit kein einziger Projekt-Termin zusammengesetzt werden.

## Kurzfassung

Die Prüfung findet 40 Fehler in der führenden Projekt-Kalender-Relation:

- Fünf zugeordnete Kalender-Slots verweisen auf Projekte, die nicht im Export
  enthalten sind.
- 35 enthaltene Projekte haben zusammen 75 Werte in `calendar_ids`, aber keiner
  dieser 75 Kalender-Slots ist im Export enthalten.

Zusätzlich lösen 113 von 145 Projekt-zu-Kontakt-Referenzen und zehn von 42
Kontakt-zu-Projekt-Referenzen nicht auf.

Das Muster deutet darauf hin, dass Datensätze anhand ihrer Sichtbarkeit aus den
einzelnen Datenbanken entfernt wurden, ohne anschließend die Relationen auf die
tatsächlich exportierte Datensatzmenge zu reduzieren oder die benötigten
Relationstargets mit zu exportieren.

## Record Counts

| Datenbank | Export vom 20. Juli | Export vom 23. Juli |
|---|---:|---:|
| `projects` | 706 | 316 |
| `contacts` | 360 | 28 |
| `locations` | 138 | 140 |
| `calendar` | 278 | 7 |

Die in `_meta.databases.*.count` deklarierten Werte stimmen mit den tatsächlichen
Counts des neuen Exports überein. Das Problem liegt daher nicht in unvollständig
geschriebenen Arrays, sondern in den Relationen zwischen den exportierten
Arrays.

## 1. Fünf Kalender-Slots verweisen auf nicht exportierte Projekte

Alle fünf als `assigned` markierten Kalender-Slots haben intern konsistente
Werte: `project_ref` entspricht jeweils dem einzigen Wert in
`Linked Projects`. Die referenzierte `canonical_id` kommt aber nicht in
`projects` vor.

| Kalender-Slot | Zeit | Fehlende Projekt-ID | Projekt im vorherigen Export |
|---|---|---|---|
| `053871b47860990654956e229a21821d` | 8. September 2026, 09:00–10:00 | `35138ddb450c8100a845d6003fd97cca` | `Test Project` |
| `11eddd9cd4233a366518f8e2b89c6a39` | 8. September 2026, 09:00–10:00 | `35138ddb450c8100a845d6003fd97cca` | `Test Project` |
| `ee846b3f7242571d4bd20761bbc153f8` | 9. September 2026, 15:00–16:00 | `35138ddb450c8100a845d6003fd97cca` | `Test Project` |
| `8ea3b2a7ff2812017c32725d57d7afaa` | 10. September 2026, 17:00–18:00 | `35138ddb450c8100a845d6003fd97cca` | `Test Project` |
| `39138ddb450c80a8ad95dd786c78bb7c` | 10. September 2026, 09:00–10:00 | `33a38ddb450c8313860c8171847047ec` | `Test Event3 Subitem` |

Beide Projekte waren im Export vom 20. Juli vorhanden, dort aber mit
`public_for_hackathon: false` gekennzeichnet. Im neuen Export wurden sie aus
`projects` entfernt, während ihre fünf öffentlichen Kalender-Slots erhalten
blieben.

## 2. 35 Projekte enthalten ausschließlich nicht auflösbare `calendar_ids`

35 der 316 exportierten Projekte enthalten zusammen 75 Kalender-IDs. Keine
dieser IDs kommt in den sieben exportierten Kalenderzeilen vor:

| Relation | Aufgelöst | Gesamt |
|---|---:|---:|
| `projects.calendar_ids` → `calendar.canonical_id` | 0 | 75 |

Da der Kalender laut `_meta.usage` die führende Relation ist, sollte
`projects.calendar_ids` die vollständige, aus dem **exportierten** Kalender
abgeleitete Rückrelation sein. Für die 35 betroffenen Projekte wäre sie im
vorliegenden Export somit leer. Alternativ müssten die 75 referenzierten
Kalender-Slots ebenfalls exportiert werden.

Beispiele:

| Projekt | Projekt-ID | Nicht auflösbare Kalender-IDs |
|---|---|---:|
| `CAOS` | `37a38ddb450c814abab3e9a35afa66f1` | 6 |
| `Connected Earth` | `37c38ddb450c80509434c339bfa068e9` | 6 |
| `The Lightness of Submission` | `38838ddb450c8118a666fd0af73e5e86` | 6 |
| `UN-ORGANIC (multimedia installation)` | `38238ddb450c80bbb78ff7dcfaca4ecc` | 4 |
| `Musikmaschine in concert` | `37b38ddb450c81e7b77eed14187e07b0` | 3 |

Die restlichen 30 betroffenen Projekte zeigen dasselbe Muster mit jeweils ein
bis drei nicht exportierten Kalender-Slots.

## 3. Nicht auflösbare Kontaktrelationen

Auch die Kontaktrelationen wurden offenbar nicht nach der Exportfilterung
bereinigt:

| Relation | Aufgelöst | Gesamt | Nicht aufgelöst |
|---|---:|---:|---:|
| `projects["Linked Contacts"]` → `contacts.canonical_id` | 32 | 145 | 113 |
| `contacts["Linked Projects"]` → `projects.canonical_id` | 32 | 42 | 10 |

Damit können Apps bei vielen Projekten die angegebenen Artists, Speakers,
Institutions oder Partner nicht laden. Umgekehrt verweisen exportierte Kontakte
teilweise auf Projekte, die nicht im Export vorkommen.

## Auswirkung auf Hackathon-Anwendungen

Die derzeit dokumentierte Join-Logik liefert null zusammengesetzte
Projekt-Termine:

- fünf zugeordnete Kalender-Slots, aber kein referenziertes Projekt im Export;
- 35 Projekte mit Kalenderreferenzen, aber kein referenzierter Slot im Export;
- `event_rows()` liefert deshalb `0` Zeilen.

Timetables, persönliche Festivalpläne und zeitbasierte Karten können den neuen
Export daher nicht sinnvoll verwenden. Auch Projekt-Detailseiten können
Kontaktangaben nicht zuverlässig auflösen.

## Vorschlag zur Behebung

Wir empfehlen, die Sichtbarkeitsfilterung vor der Ableitung der exportierten
Relationen anzuwenden und anschließend folgende Invarianten zu prüfen:

1. Jeder Wert in `calendar.project_ref` und `calendar["Linked Projects"]`
   verweist auf eine vorhandene `projects.canonical_id`.
2. `projects.calendar_ids` wird ausschließlich aus den tatsächlich
   exportierten, zugeordneten Kalender-Slots abgeleitet und ist die exakte
   Rückrelation.
3. Jeder Wert in `projects["Linked Contacts"]` verweist auf eine vorhandene
   `contacts.canonical_id`.
4. Jeder Wert in `contacts["Linked Projects"]` verweist auf eine vorhandene
   `projects.canonical_id`.

Falls relationierte, nicht öffentliche Datensätze bewusst nicht exportiert
werden sollen, sollten die entsprechenden Referenzen aus den öffentlichen
Datensätzen entfernt werden. Falls die Relationen für Hackathon-Anwendungen
benötigt werden, könnten die Target-Datensätze stattdessen als reduzierte,
nicht verlinkbare Einträge mit `link_allowed: false` erhalten bleiben.

Für die fünf öffentlichen Test-Slots wäre außerdem konsistent, entweder die
beiden Testprojekte mit zu exportieren oder die Test-Slots aus dem öffentlichen
Export zu entfernen.

## Verifikation

Der Fehler lässt sich mit dem im Repository enthaltenen Validator
reproduzieren:

```bash
python3 .agents/skills/ars-dataset/scripts/ars_dataset.py download \
  -o /tmp/ars-export.json
python3 .agents/skills/ars-dataset/scripts/ars_dataset.py verify \
  /tmp/ars-export.json
python3 .agents/skills/ars-dataset/scripts/ars_dataset.py summary \
  /tmp/ars-export.json
```

Erwartete Validator-Ausgabe für den Export vom 23. Juli:

```text
40 violation(s) in 2 field(s):
  projects.'calendar_ids': inconsistent relation x35
  calendar.'project_ref': unresolved reference x5
```

Sobald alle Relationstargets wieder enthalten oder die Referenzen nach der
Filterung neu abgeleitet sind, sollte die Prüfung ohne Verletzungen
abschließen und `event_rows()` wieder Projekt-Termin-Kombinationen liefern.
