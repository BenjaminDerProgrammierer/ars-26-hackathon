---
title: "Festival- und Linzer Open Data kombinieren"
description: "Orte, Zeiten und Programm des Festivals mit offenen Daten der Stadt Linz verbinden."
order: 2
---

Der Festival-Datensatz bietet drei natürliche Anknüpfungspunkte an Stadtdaten:
**Ortskoordinaten**, den **Veranstaltungskalender** sowie **zweisprachige Texte**
mit Kategorien und Herkunftsländern.

## Ansatz 1: Orte

Die Festivalorte sind in Zonen wie OK QUARTER, MED CAMPUS und DANUBE TRIANGLE
gruppiert. Korrigiert oder entfernt zuerst bekannte Koordinaten-Ausreißer und
übernehmt bei Bedarf Punkte des übergeordneten Gebäudes. Danach könnt ihr sie
mit aufbereiteten WGS84-Ebenen wie Baumkataster, Haltestellen, Spielplätzen,
WC-Anlagen oder Trinkbrunnen verbinden.

## Ansatz 2: Zeiten

Wandelt die Anzeige-Strings des Festivalkalenders in vollständige Zeitpunkte der
Zeitzone Europe/Vienna um und vergleicht Intervalle mit einem gecachten
Linztermine-Snapshot für das Festival-Zeitfenster. Für Mobilität zeigt die
statische LINZ-AG-Geometrie nahe Haltestellen, während ein vorbereiteter
EFA-Adapter Soll-Verbindungen liefert. Statische Geometrie ist kein Fahrplan,
und eine angeforderte Realtime-Antwort ist nicht automatisch live.

## Ansatz 3: Inhalte

Deutsche und englische Beschreibungen, Projektkategorien und Länderwerte der
Kontakte eignen sich für mehrsprachige Guides, thematische Cluster oder
Vergleiche mit historischen Tourismusdaten. Bewahrt Originaltexte und
Provenienz; fehlende Werte sind keine inhaltliche Aussage.

## Koordinatensysteme

Mehrere ausgewählte Linzer Quellen verwenden österreichisches Gauß-Krüger
(EPSG:31255) statt WGS84. Reprojiziert sie vor dem Mischen, prüft die
Achsenfolge an bekannten Linzer Orten und bewahrt Datenstand sowie Lizenz in
jeder aufbereiteten Ausgabe.

Verwendet gecachte Fallbacks für Live-Dienste und kennzeichnet datierte,
sicherheitsrelevante Besucherservices sichtbar als Prototypdaten.
