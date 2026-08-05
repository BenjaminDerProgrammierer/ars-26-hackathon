---
title: "Mit pi.dev arbeiten"
description: "Die wichtigsten Abläufe und Gewohnheiten für kontrolliertes, effizientes Arbeiten mit dem Coding Agent."
order: 2
---

[pi.dev](https://pi.dev) ist ein Coding Agent im Terminal. Er kann Dateien
lesen und ändern sowie Befehle ausführen. In der Online-Entwicklungsumgebung ist
Pi bereits installiert.

## Im richtigen Projekt starten

Wenn ihr auf eurem eigenen Computer arbeitet, öffnet ein Terminal im Projektordner und startet Pi (Alles nach `#` ist ein Kommentar und muss nicht eingegeben werden):

```sh
cd pfad/zu/eurem-projekt # Change Directory - Ordner ändern - Hiermit navigiert ihr in den Ordner eures Projekts. Wenn ihr die Online-Entwicklungsumgebung nutzt, ist der Projektordner bereits geöffnet, und ihr könnt diesen Schritt überspringen.
pi # Startet den Coding Agent pi.dev.
```

Pi darf auf alles in diesem Ordner zugreifen. Startet ihn deshalb nicht in einem
übergeordneten Ordner mit privaten oder fremden Dateien.

Wenn ihr Pi beenden wollt, drückt `Strg`+`C`. Pi merkt sich den Gesprächskontext nur während der laufenden Sitzung. Wenn ihr Pi neu startet, beginnt es wieder mit einem leeren Kontext. Verwendet `pi resume`, um trotzdem den letzten Gesprächskontext zu laden.

## Bei bestehenden Projekten: Zuerst orientieren, dann ändern

Lasst Pi vor der ersten Änderung die vorhandene `README.md`, die
Projektstruktur und die verfügbaren Prüfbefehle untersuchen:

> Lies die README und untersuche das Projekt. Erkläre mir kurz, wie es aufgebaut ist.

Gebt danach einen überschaubaren Auftrag. Lasst Pi die Änderung selbst prüfen
und bittet um eine kurze Zusammenfassung der betroffenen Dateien.

## Projektregeln festhalten

Wiederkehrende Regeln gehören in eine `AGENTS.md` im Projekt:

```md
# Projektregeln

- Führe nach Änderungen `npm run check` aus.
- Ändere keine Datesatz-dateien.
- Halte API-Keys aus dem Repository.
```

Ihr könnt auch Pi darum bitten, die Regeln in der `AGENTS.md` zu dokumentieren. So müsst ihr wichtige Rahmenbedingungen nicht in jedem Prompt wiederholen.

## Hackathon-Skills installieren

Skills geben Pi zusätzliches, auf diesen Hackathon zugeschnittenes Wissen. Die
beiden Daten-Skills erklären Pi, wie es den Festival-Datensatz korrekt
verknüpft und wie es die auf der Hackathon-Website angebotenen Linz-Datensätze
einschließlich ihrer Kurz-Dokumentationen findet und sicher herunterlädt.

Öffnet ein Terminal **im Ordner eures Projekts** und installiert beide Skills
mit [skills.sh](https://skills.sh/):

```sh
npx skills@latest add BenjaminDerProgrammierer/ars-26-hackathon \
  --skill ars-dataset hackathon-datasets \
  --agent pi \
  --yes
```

`npx` lädt das aktuelle `skills`-Werkzeug bei Bedarf automatisch. Der Befehl
installiert die Skills nur für dieses Projekt unter `.pi/skills/` und legt eine
`skills-lock.json` an. Die Installation enthält Programme und Anweisungen, die der Agent ausführen darf.

Startet Pi danach neu, damit es die neuen Skills sicher erkennt:

```sh
pi
```

Nennt den passenden Skill am besten ausdrücklich. Zum Beispiel:

> Verwende den Skill `hackathon-datasets`. Finde den passendsten Datensatz für
> eine Karte mit Trinkbrunnen, lies zuerst alle Hinweise und verlinkten
> Kurz-Dokumentationen auf der Hackathon-Website und lade danach die
> aufbereitete Datei in den Ordner `data/`. Erkläre mir Felder und wichtige
> Einschränkungen, bevor du Code änderst.

Für den laufend aktualisierten Festival-Programmdatensatz:

> Verwende den Skill `ars-dataset`. Lade den aktuellen Export herunter, prüfe
> ihn und erkläre mir die sicheren Verknüpfungen für Projekte, Orte und
> Kalender. Ändere noch keinen Code.

Aktualisiert die installierten Projekt-Skills später mit:

```sh
npx skills@latest update --project --yes
```

Falls `npx` nach einer Bestätigung zur Installation des `skills`-Pakets fragt,
bestätigt diese. Bei einem Netzwerkfehler prüft zuerst, ob GitHub und npm im
Terminal erreichbar sind, und führt denselben Befehl erneut aus.

## Mini-Projekt: Festival-Kalender

Probiert den kompletten Ablauf an einem kleinen Projekt aus. Erstellt einen
leeren Ordner, startet Pi darin und gebt ihm diesen Auftrag:

> Verwende den Skill `ars-dataset`. Erstelle eine möglichst kleine Vite-App mit
> Plain TypeScript, die den aktuellen Festival-Datensatz lädt und alle sicher
> verknüpften öffentlichen Termine nach Tagen gruppiert als Kalender anzeigt.
> Nutze die Datums- und Join-Logik des Skills, respektiere `link_allowed` und
> zeige einen verständlichen Leerzustand, wenn der Export keine gültigen
> Termine enthält. Führe danach den Build aus.

Eine fertige Minimalversion könnt ihr als
[ZIP-Datei herunterladen](/downloads/pi-dev-calendar.zip). Nach dem Entpacken
installiert ihr den `ars-dataset`-Skill im Projektordner und startet die App:

```sh
npm install
npm run dev
```

Vor jedem Start holt das Beispiel den aktuellen Export. Der Browser lädt nur
die vom Skill vorbereiteten öffentlichen Kalenderzeilen. Das ist absichtlich
ein zweistufiger Ablauf: Die Datumsangabe steckt im Export nur in einem
menschenlesbaren Textfeld, und derzeit lassen sich die öffentlichen
Kalenderzeilen nicht sicher mit öffentlichen Projekten verbinden. Das Beispiel
erfindet deshalb keine Titel oder Termine, sondern zeigt bis zu einer Reparatur
des Exports den Leerzustand.

## Den Überblick behalten

- Brecht einen falschen Weg früh mit `Ctrl+C` ab.
- Ändert jeweils nur eine klar abgegrenzte Funktion.
- Seht euch Änderungen an, bevor ihr sie übernehmt.
- Speichert funktionierende Zwischenstände regelmäßig mit Git.
- Startet eine neue Sitzung, wenn der alte Gesprächskontext nicht mehr hilft.
- Gebt API-Keys nur über die dafür vorgesehene sichere Konfiguration weiter.

Pi kann Arbeit beschleunigen, aber nicht entscheiden, ob eure Daten,
Sicherheitsannahmen und Projektergebnisse korrekt sind. Prüft eure Demo selbst.

## Als nächstes: Vibe Coding und Prompts

Als nächstes lernt ihr, wie ihr eure Ideen in überprüfbare Schritte zerlegt und
einen Coding Agent sinnvoll anleitet. Lest dazu das Tutorial „Vibe Coding und Prompts“.
