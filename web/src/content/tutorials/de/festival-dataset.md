---
title: "Arbeiten mit dem Festival-Datensatz"
description: "Die vier Datenbanken des Festival-Exports verstehen: Verknüpfungen, Besonderheiten und Stolperfallen."
order: 1
---

Der Festival-Datensatz ist ein einzelner JSON-Export aus dem Content-System des
Festivals. Der aktuelle Snapshot enthält vier verknüpfte Datenbanken:
**projects** (546 Datensätze), **contacts** (240), **locations** (111) und
**calendar** (178 Zeilen) sowie Export-Metadaten. Es sind rohe CMS-Datensätze:
Interne und Test-Inhalte sind enthalten, und eine Orts- oder Kalenderzeile ist
nicht automatisch ein eindeutiger öffentlicher Ort oder Event.

## Daten beziehen

Ladet den neuesten Export über den offiziellen Hackathon-Endpunkt auf der
Datensatzseite. Die JSON-Datei ist rund 2 MB groß. Felder können in der Praxis
`null` sein, Koordinaten verwenden Dezimalkommas und strukturierte Werte müssen
bewusst normalisiert werden.

## Datenbanken verknüpfen

Datensätze verweisen über Felder wie `Linked Contacts`, `Linked Location` und
`Linked Projects` aufeinander. Projekt- und Kontakt-IDs tragen ein Präfix,
während Links nur den Hash enthalten. Normalisiert daher jede ID auf den
abschließenden 32-stelligen Hash.

Für Eventzeiten ist **calendar** maßgeblich: Verknüpft über
`calendar."Linked Projects"`, das zuverlässig aufgelöst wird, und ignoriert die
defekte Rückrichtung `projects."Linked Calendar"`.

## Stolperfallen

- Filtert interne und Test-Einträge vor einer öffentlichen Darstellung.
- Koordinaten sind Strings mit Dezimalkomma, etwa `"48,3069"`.
- Manche URLs haben kein `https://`-Präfix.
- Orts- und Kalender-IDs können fehlen oder mehrfach vorkommen.
- Start- und Endfelder im Kalender enthalten nur Uhrzeiten. Das volle Datum
  muss aus dem Anzeige-String gelesen werden.
- Jedes Feld kann `null` sein.

Verwendet den `ars_dataset.py`-Helper im Repository für Validierung,
normalisierte Joins, geparste Eventzeiten, Koordinaten und Testfilter, statt
diese Regeln in jedem Projekt neu zu implementieren.
