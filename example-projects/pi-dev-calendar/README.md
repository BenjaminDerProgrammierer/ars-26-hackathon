# Minimaler Festival-Kalender

Ein bewusst kleines Beispielprojekt für das
[pi.dev-Tutorial](../../web/src/content/tutorials/de/pi-dev.md): Vite, Plain
TypeScript und der öffentliche Ars-Electronica-Festival-Datensatz.

## Starten

Installiere zuerst den `ars-dataset`-Skill wie im Tutorial beschrieben. Danach:

```sh
npm install
npm run dev
```

Vor jedem Start lädt `prepare_data.py` den aktuellen Export. Das Skript benutzt
die Join- und Datumslogik des Skills und schreibt ausschließlich öffentliche,
vollständig verknüpfte Termine nach `public/events.json`.

Der Export vom 23. Juli 2026 enthält derzeit keine Kalenderzeile, die sich mit
einem öffentlichen Projekt verknüpfen lässt. In diesem Fall zeigt die App einen
entsprechenden Leerzustand. Sobald der Export repariert ist, erscheinen alle
gültigen Termine automatisch im Kalender.
