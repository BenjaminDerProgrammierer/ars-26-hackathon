---
title: "Was ist in meiner Nähe?"
description: "Entwickelt einen mobilen Wegweiser zu Trinkbrunnen, WCs, WLAN-Hotspots und Bäumen in Linz."
order: 2
download: "/downloads/whats-near-me.zip"
---

<section class="walkthrough-path walkthrough-path--ideenhilfe">
  <h2>Ideenhilfe</h2>
  <p>
    Beginnt mit einer einzigen Frage: <strong>Was brauchen Menschen rund um
    einen Festivalort gerade jetzt?</strong> Wählt zunächst nur eine Datenart,
    etwa Trinkbrunnen oder öffentliche WCs.
  </p>
  <p>Ein kleines erstes Ziel:</p>
  <ol>
    <li>Zeigt drei feste Startpunkte in Linz.</li>
    <li>Berechnet die Entfernung zu allen Orten im gewählten Datensatz.</li>
    <li>Sortiert die fünf nächstgelegenen Treffer.</li>
    <li>Zeigt Name, Entfernung und Datenstand verständlich an.</li>
  </ol>
  <p>
    Erst wenn das funktioniert, ergänzt ihr Browser-Standort, Karte oder weitere
    Datensätze. Beachtet, dass ein verzeichneter Ort nicht garantiert aktuell
    geöffnet oder benutzbar ist.
  </p>
</section>

<section class="walkthrough-path walkthrough-path--ideen-und-prompts">
  <h2>Ideen und Prompts</h2>
  <p>Startet euren Agent mit diesem Auftrag:</p>
  <blockquote>
    <p>
      Untersuche das vorhandene Projekt und die vorbereiteten Datensätze. Plane
      einen browserbasierten Prototyp, der für einen gewählten Startpunkt die
      fünf nächsten Trinkbrunnen anzeigt. Verwende zunächst keine Karte und
      keine neue Bibliothek. Ändere noch keine Dateien.
    </p>
  </blockquote>
  <p>Für den ersten Umsetzungsschritt:</p>
  <blockquote>
    <p>
      Implementiere nur das Einlesen der Trinkbrunnen und eine getestete
      Funktion zur Luftlinienentfernung zwischen zwei WGS84-Koordinaten. Führe
      danach die vorhandenen Checks aus.
    </p>
  </blockquote>
  <p>Für die nächste Ausbaustufe:</p>
  <blockquote>
    <p>
      Ergänze drei feste Linzer Startpunkte und eine nach Entfernung sortierte
      Ergebnisliste. Zeige den Datenstand sichtbar an. Achte auf
      Tastaturbedienung und kleine Bildschirme.
    </p>
  </blockquote>
  <p>Erst danach könnt ihr fragen:</p>
  <blockquote>
    <p>
      Prüfe, wie eine OpenStreetMap-Karte und die Browser-Geolocation als
      optionale Verbesserung ergänzt werden können. Die Anwendung muss ohne
      Standortfreigabe weiterhin funktionieren.
    </p>
  </blockquote>
</section>

<section class="walkthrough-path walkthrough-path--vollstaendiger-code">
  <h2>Vollständiger Code</h2>
  <p>
    Ladet den vollständigen Beispielcode über die Schaltfläche oberhalb herunter.
    Nach dem Entpacken:
  </p>
  <pre><code class="language-sh">npm install
npm run dev</code></pre>
  <p>
    Die Daten werden lokal verarbeitet. Kartenkacheln werden aus dem Internet
    geladen; dabei gelten die Nutzungsbedingungen und Datenschutzregeln des
    jeweiligen Kartendienstes.
  </p>
</section>
