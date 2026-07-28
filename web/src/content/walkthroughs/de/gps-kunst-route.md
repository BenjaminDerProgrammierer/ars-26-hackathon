---
title: "GPS-Kunst-Route durch Linz"
description: "Verwandelt die Silhouette eines Bildes in eine begehbare Route und exportiert sie als GPX-Datei."
order: 2
download: "/downloads/gps-art-maker.zip"
---

<section class="walkthrough-path walkthrough-path--ideenhilfe">
  <h2>Ideenhilfe</h2>
  <p>Teilt die Idee in drei voneinander prüfbare Teile:</p>
  <ol>
    <li>
      <strong>Form gewinnen:</strong> Bild laden, Kontrast erzeugen und Punkte
      der Silhouette auswählen.
    </li>
    <li>
      <strong>Auf Linz legen:</strong> Punkte skalieren, drehen und um einen
      Startpunkt platzieren.
    </li>
    <li>
      <strong>Route erzeugen:</strong> Punkte mit begehbaren Wegen verbinden und
      als GPX exportieren.
    </li>
  </ol>
  <p>
    Baut zuerst nur eine Vorschau der Silhouette. Eine echte Route ist eine
    spätere Ausbaustufe. Legt Grenzen für Bildgröße und Punktzahl fest, damit
    Browser und Routingdienst nicht überlastet werden.
  </p>
</section>

<section class="walkthrough-path walkthrough-path--ideen-und-prompts">
  <h2>Ideen und Prompts</h2>
  <p>Für die Planung:</p>
  <blockquote>
    <p>
      Plane einen kleinen Browser-Prototyp, der ein lokal ausgewähltes Bild in
      eine vereinfachte Punktfolge seiner Silhouette umwandelt. Das Bild darf
      nicht hochgeladen werden. Verwende zunächst weder Karte noch Routingdienst.
      Erkläre die Verarbeitungsschritte und ändere noch keinen Code.
    </p>
  </blockquote>
  <p>Für die Bildverarbeitung:</p>
  <blockquote>
    <p>
      Implementiere Bildauswahl, Graustufen-Vorschau und eine begrenzte Anzahl
      gleichmäßig verteilter Silhouettenpunkte. Zeige verständliche
      Fehlermeldungen für ungeeignete Dateien. Führe danach die vorhandenen
      Checks aus.
    </p>
  </blockquote>
  <p>Für die Positionierung:</p>
  <blockquote>
    <p>
      Lege die normalisierte Punktfolge um einen wählbaren Linzer Startpunkt.
      Ergänze Regler für Größe und Drehung. Prüfe, dass alle Koordinaten gültige
      WGS84-Werte bleiben.
    </p>
  </blockquote>
  <p>Für Routing und Export:</p>
  <blockquote>
    <p>
      Schlage vor, wie die Punkte über einen Fußweg-Routingdienst verbunden und
      als GPX exportiert werden können. Begrenze Anfragen, behandle Netzfehler
      und kennzeichne das Ergebnis ausdrücklich als Prototyp, nicht als sichere
      Navigation.
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
    Prüft eine erzeugte Route vor dem Gehen selbst. Routingdaten kennen nicht
    alle Baustellen, Sperren, Gefahren oder aktuellen Zugangsregeln.
  </p>
</section>
