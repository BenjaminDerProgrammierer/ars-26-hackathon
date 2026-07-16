---
title: "LINZ AG LINIEN — Öffentlicher Verkehr"
summary: "Ein statischer Snapshot von 2025 mit Haltestellen, Fahrwegen und Netzgraph — ohne Fahrplan- oder Live-Daten."
provider: "LINZ AG / data.gv.at"
url: "https://www.data.gv.at/katalog/datasets/linien-fahrwege-und-haltestellen-der-linz-ag-linien-2025"
group: "linz"
status: "preparation"
order: 4
---

Die statischen GML-Ebenen von 2025 enthalten Haltestellen, Linien, Fahrwege und
einen Netzgraph in Varianten für WGS84 und EPSG:31255. Vor der Verteilung
sollten die WGS84-Daten zentral in GeoJSON konvertiert und die GML-Achsenfolge
geprüft werden. Geeignet sind Haltestellen- und Netzansichten, nicht Aussagen zu
Fahrplan, Takt, Störungen oder Live-Abfahrten; dafür braucht es einen
aufbereiteten [EFA-Routenplaner](https://www.data.gv.at/katalog/datasets/cc074ef6-bcc9-4c76-815c-81e349ee6a13)
mit Adapter, Proxy, Zustandsprüfung und gecachtem Fallback.
