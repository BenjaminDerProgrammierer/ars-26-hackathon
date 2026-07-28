---
title: "Mit pi.dev arbeiten"
description: "Die wichtigsten Abläufe und Gewohnheiten für kontrolliertes, effizientes Arbeiten mit dem Coding Agent."
order: 2
---

[pi.dev](https://pi.dev) ist ein Coding Agent im Terminal. Er kann Dateien
lesen und ändern sowie Befehle ausführen. In der Online-Entwicklungsumgebung ist
Pi bereits installiert.

## Im richtigen Projekt starten

Öffnet ein Terminal im Projektordner und startet Pi:

```sh
cd pfad/zu/eurem-projekt
pi
```

Pi darf auf alles in diesem Ordner zugreifen. Startet ihn deshalb nicht in einem
übergeordneten Ordner mit privaten oder fremden Dateien.

## Zuerst orientieren, dann ändern

Lasst Pi vor der ersten Änderung die vorhandene `README.md`, die
Projektstruktur und die verfügbaren Prüfbefehle untersuchen:

> Lies die README und untersuche das Projekt. Erkläre mir kurz, wie es aufgebaut
> ist und welche Befehle Änderungen prüfen. Ändere noch keine Dateien.

Gebt danach einen überschaubaren Auftrag. Lasst Pi die Änderung selbst prüfen
und bittet um eine kurze Zusammenfassung der betroffenen Dateien.

## Projektregeln festhalten

Wiederkehrende Regeln gehören in eine `AGENTS.md` im Projekt:

```md
# Projektregeln

- Führe nach Änderungen `npm run check` aus.
- Ändere keine Datendateien.
- Halte API-Keys aus dem Repository.
```

So müsst ihr wichtige Rahmenbedingungen nicht in jedem Prompt wiederholen.

## Den Überblick behalten

- Brecht einen falschen Weg früh mit `Ctrl+C` ab.
- Ändert jeweils nur eine klar abgegrenzte Funktion.
- Seht euch Änderungen an, bevor ihr sie übernehmt.
- Speichert funktionierende Zwischenstände regelmäßig mit Git.
- Startet eine neue Sitzung, wenn der alte Gesprächskontext nicht mehr hilft.
- Gebt API-Keys nur über die dafür vorgesehene sichere Konfiguration weiter.

Pi kann Arbeit beschleunigen, aber nicht entscheiden, ob eure Daten,
Sicherheitsannahmen und Projektergebnisse korrekt sind. Prüft eure Demo selbst.
