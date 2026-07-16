---
title: "Bauen mit Coding Agents"
description: "Einen Coding Agent mit dem optionalen OpenRouter-Zugang verbinden, effektiv arbeiten und generierten Code prüfen."
order: 3
---

Wenn ihr bei der Anmeldung die optionale gehostete Entwicklungsumgebung wählt,
ist pi.dev bereits installiert und kann mit dem dafür erforderlichen
KI-API-Add-on verwendet werden. Das Add-on bietet OpenRouter-Zugang zu Mistral
Medium 3.5 mit einem Budget von 20 US-Dollar pro Teilnehmer:in. Ihr könnt
dieses Tutorial auch mit einem Agent und selbst bezahlten Modell in eurem
eigenen Setup durcharbeiten.

## Verbindet euch, ohne den Key preiszugeben

Verwendet die OpenRouter-Einrichtungsdaten aus eurem Teilnehmer:innen-Konto,
wählt Mistral Medium 3.5 und bewahrt euren API-Key in einer Umgebungsvariable
auf. Schreibt den Key nie in den Quellcode, committed ihn nicht und liefert ihn
nicht an den Browser aus. Falls er offengelegt wurde, ersetzt ihn.

## Beginnt mit einem Plan

Beschreibt Ziel, Daten und Einschränkungen und lasst den Agent zuerst einen
Ansatz vorschlagen. Prüft den Plan und baut dann in kleinen Schritten. So
verbraucht ihr euer Guthaben nicht für wiederholte Komplettumbauten.

## Gebt dem Agent die Datendokumentation

Verweist auf das Tutorial zum Festival-Datensatz oder stellt die relevanten
Feldbeschreibungen bereit. Ein Agent, der die ID-Normalisierung und die
maßgebliche Kalenderrichtung kennt, erspart euch fehlerhafte Joins.

## Iteriert in kleinen Schritten

- Eine Funktion pro Auftrag; überprüft sie, bevor ihr weitermacht.
- Lasst den Agent seinen Code ausführen und testen.
- Committed früh und regelmäßig.
- Haltet Prompts und Kontext fokussiert; das Portal-Dashboard zeigt das
  maßgebliche Restguthaben.

## Prüft, was ihr präsentiert

Ihr tragt die Verantwortung für eure Demo. Lest den generierten Code, prüft die
Lizenzen externer Inhalte und haltet API-Keys sowie personenbezogene Daten aus
dem Repository heraus.

> Zugangsdaten und endgültige Betriebsgrenzen stehen vor dem Event im
> Teilnehmer:innen-Konto bereit.
