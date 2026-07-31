---
title: "Festival-Tagesplan für Linz"
description: "Verwebt ausgewählte Festivalprojekte, Wegezeiten und nützliche Zwischenstopps zu einem realistischen Tagesplan."
order: 1
download: "/downloads/festival-day-weaver.zip"
---

<section class="walkthrough-path walkthrough-path--ideenhilfe">
  <h2>Ideenhilfe</h2>
  <p>
    Beginnt mit einer einfachen Frage: <strong>Passen meine ausgewählten
    Festivalprojekte zeitlich und räumlich in einen Tag?</strong> Teilt die Idee
    in vier Schritte:
  </p>
  <ol>
    <li>
      <strong>Projekte wählen:</strong> Zeigt nur öffentliche Projekte mit
      einem brauchbaren Festivalort an.
    </li>
    <li>
      <strong>Zeiten eintragen:</strong> Übernehmt Beginn und Ende aus dem
      offiziellen Festivalprogramm und sortiert die Auswahl chronologisch.
    </li>
    <li>
      <strong>Wechsel prüfen:</strong> Schätzt Weg- und Ankunftszeit zwischen
      zwei Orten und warnt, wenn der Wechsel zu knapp wird.
    </li>
    <li>
      <strong>Stadt einweben:</strong> Ergänzt erst danach einen passenden
      Trinkbrunnen, ein öffentliches WC oder eine Öffi-Abfrage.
    </li>
  </ol>
  <p>
    Ein gutes erstes Ziel besteht aus genau zwei Programmpunkten, manuellen
    Zeiten und einer verständlichen Machbarkeitsanzeige. Der aktuelle
    Datensatz enthält keine zuverlässig mit öffentlichen Projekten verknüpften
    Kalendereinträge. Erfindet deshalb keine Termine und verwendet keine
    ausgeblendeten Testdaten.
  </p>
</section>

<section class="walkthrough-path walkthrough-path--ideen-und-prompts">
  <h2>Ideen und Prompts</h2>
  <p>Für Datenverständnis und Planung:</p>
  <blockquote>
    <p>
      Lies zuerst die Hinweise zum Ars-Electronica-Datensatz und untersuche das
      vorhandene Projekt. Plane einen Browser-Prototyp für einen Festivaltag.
      Verwende nur Datensätze mit öffentlicher Freigabe, verknüpfe Datensätze
      über canonical_id und akzeptiere nur geprüfte Koordinaten. Der Kalender
      ist die einzige verlässliche Quelle für Termine. Wenn seine Einträge nicht
      mit öffentlichen Projekten verknüpft werden können, plane eine manuelle
      Zeiteingabe. Ändere noch keinen Code.
    </p>
  </blockquote>
  <p>Für die Datenaufbereitung:</p>
  <blockquote>
    <p>
      Erzeuge eine kleine vorbereitete JSON-Datei mit öffentlichen
      Festivalprojekten, ihren nutzbaren Orten und erlaubten Links. Übernimm nur
      Kalendereinträge, die über die vorgesehenen Beziehungen eindeutig mit
      einem öffentlichen Projekt verknüpft sind. Gib bei fehlenden verlässlichen
      Terminen eine leere Liste aus, statt Ersatzdaten zu erfinden. Ergänze
      automatisierte Prüfungen oder nachvollziehbare Ausgaben für die Anzahl der
      übernommenen Einträge.
    </p>
  </blockquote>
  <p>Für den ersten nutzbaren Tagesplan:</p>
  <blockquote>
    <p>
      Implementiere Projektsuche, manuelle Start- und Endzeiten und eine
      chronologisch sortierte Liste. Berechne zwischen aufeinanderfolgenden
      Orten Luftlinie und eine deutlich gekennzeichnete Gehzeitschätzung. Ziehe
      außerdem einen wählbaren Ankunftspuffer ab und zeige knapp, passend oder
      unmöglich als Text und nicht nur als Farbe an. Führe danach die vorhandenen
      Checks aus.
    </p>
  </blockquote>
  <p>Für die Ausbaustufe mit Linz-Daten:</p>
  <blockquote>
    <p>
      Ergänze vorbereitete Trinkbrunnen und öffentliche WCs als optionale
      Zwischenstopps. Ordne sie nach zusätzlichem Umweg und zeige Datenstand und
      Unsicherheit sichtbar an. Erzeuge anschließend eine Öffi-Abfrage für den
      LINZ-AG-Routenplaner, ohne dessen Ergebnis als garantiert darzustellen.
      Die Kernfunktion muss ohne Standortfreigabe und ohne erfolgreiche
      Netzwerkanfrage verständlich bleiben.
    </p>
  </blockquote>
</section>

<section class="walkthrough-path walkthrough-path--vollstaendiger-code">
  <h2>Vollständiger Code</h2>
  <p>
    Ladet den vollständigen Beispielcode über die Schaltfläche oberhalb herunter.
    Die vorbereiteten Festival- und Stadtdaten sind enthalten. Nach dem
    Entpacken:
  </p>
  <pre><code class="language-sh">npm install
npm run dev</code></pre>
  <p>
    Im vollständigen Repository kann <code>npm run prepare-data</code> die
    vorbereitete Datei aus den dort vorhandenen Quelldaten neu erzeugen.
    Kontrolliert Festivalzeiten, Wege, Öffnungszeiten, Zugänglichkeit und
    Verkehrslage immer noch einmal in den offiziellen Quellen.
  </p>
</section>
