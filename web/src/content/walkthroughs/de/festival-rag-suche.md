---
title: "Festivalprojekte mit RAG durchsuchen"
description: "Baut eine kleine semantische Suche, die Fragen nur mit passenden öffentlichen Festivalprojekten beantwortet."
order: 3
download: "/downloads/2026-08-04-rag-example.zip"
---

<section class="walkthrough-path walkthrough-path--ideenhilfe">
  <h2>Ideenhilfe</h2>
  <p>
    Beginnt mit einer Frage, die eine Stichwortsuche nur schwer beantwortet:
    <strong>Welche Festivalprojekte beschäftigen sich mit dem Verhältnis von
    KI und menschlicher Identität?</strong>
  </p>
  <ol>
    <li>Übernehmt nur öffentlich freigegebene Projekte.</li>
    <li>Zerlegt ihre deutschen und englischen Texte in durchsuchbare Abschnitte.</li>
    <li>Findet per Embedding die fünf ähnlichsten Projekte zur Frage.</li>
    <li>Gebt nur diese Treffer an ein Sprachmodell und verlangt Quellenangaben.</li>
  </ol>
  <p>
    Zeigt zuerst die gefundenen Titel und Ähnlichkeitswerte. So bleibt sichtbar,
    ob ein Fehler aus der Suche oder aus der formulierten Antwort stammt. Eine
    kleine JSON-Datei und Kosinus-Ähnlichkeit reichen für diesen Datensatz aus;
    eine Vektordatenbank ist für den ersten Prototyp nicht nötig.
  </p>
</section>

<section class="walkthrough-path walkthrough-path--ideen-und-prompts">
  <h2>Ideen und Prompts</h2>
  <p>Für einen sicheren, überschaubaren Start:</p>
  <blockquote>
    <p>
      Lies zuerst die Hinweise zum Ars-Electronica-Datensatz und untersuche das
      vorhandene Projekt. Plane eine kleine RAG-Kommandozeilenanwendung für
      Festivalprojekte. Verwende nur Datensätze mit public_for_hackathon ===
      true, verknüpfe Orte über canonical_id und übernimm Links nur bei
      link_allowed === true. Ändere noch keinen Code.
    </p>
  </blockquote>
  <p>Für Datenaufbereitung und Suche:</p>
  <blockquote>
    <p>
      Erzeuge getrennte deutsche und englische Textabschnitte aus den
      öffentlichen Projekten. Baue daraus mit OpenRouter-Embeddings einen
      lokalen JSON-Index und implementiere eine Kosinus-Suche. Zeige Titel und
      Ähnlichkeitswert an, behalte pro Projekt nur den besten Treffer und teste
      Ranking, Sichtbarkeit und Link-Regeln ohne echte API-Aufrufe.
    </p>
  </blockquote>
  <p>Für die Antwort mit Quellen:</p>
  <blockquote>
    <p>
      Gib nur die gefundenen öffentlichen Projekte an das Sprachmodell. Weise
      es an, ausschließlich diese Quellen zu verwenden, sie als [1], [2] zu
      zitieren und fehlende Informationen offen zu benennen. Gib danach die
      tatsächlich verwendeten Quelldatensätze aus und ergänze einen Test für
      den Fall, dass die Treffer eine Frage nicht beantworten.
    </p>
  </blockquote>
</section>

<section class="walkthrough-path walkthrough-path--vollstaendiger-code">
  <h2>Vollständiger Code</h2>
  <p>
    Ladet den vollständigen Beispielcode über die Schaltfläche oberhalb herunter.
    Ihr benötigt Node.js 22 oder neuer, einen aktuellen Festivalexport und einen
    OpenRouter-Schlüssel. Nach dem Entpacken:
  </p>
  <pre><code class="language-sh">npm install
cp .env.example .env
npm run prepare-data -- /pfad/zum/notion_export.json data/documents.json
npm run build-index
npm run search -- "art about machine consciousness"
npm run ask -- "Which projects explore AI and human identity?"</code></pre>
  <p>
    Tragt <code>OPENROUTER_API_KEY</code> in <code>.env</code> ein. Das Erzeugen
    des Index verbraucht API-Guthaben; Suche und Antworten benötigen ebenfalls
    Netzwerkzugriff. Prüft die Treffer und Quellen vor einer Demo. Embedding-
    Ähnlichkeit ist kein Faktenbeweis und auch eine eingeschränkte RAG-Antwort
    kann halluzinieren.
  </p>
</section>
