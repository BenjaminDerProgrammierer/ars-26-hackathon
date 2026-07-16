---
title: "Festival 2026 Programm-Export"
summary: "Der aktuelle Programm-Export von Negotiating Humanity als eine JSON-Datei: Projekte, Kontakte, Orte und Kalenderzeilen."
provider: "Ars Electronica"
url: "https://ars.electronica.art/negotiatinghumanity/hackathondata/"
group: "festival"
order: 1
---

Ein JSON-Export (~2 MB) direkt aus dem Content-System des Festivals. Der
aktuelle Snapshot enthält **546 Projekte**, **240 Kontakte**, **111 Orte** und
**178 Kalenderzeilen** sowie zweisprachige Beschreibungen, Kategorien,
Ticketangaben und Ortskoordinaten. Aktualisierte Exporte erscheinen unter
derselben URL.

Behandelt die Datei als Arbeits-Export aus dem CMS und nicht als bereinigte
öffentliche API: Test- und interne Einträge sind enthalten, manche Orts- und
Kalender-IDs fehlen oder kommen mehrfach vor, und für Projektzeiten ist die
Kalenderseite maßgeblich. Normalisiert IDs auf ihren abschließenden
32-stelligen Hash und prüft Koordinaten vor räumlichen Joins.
