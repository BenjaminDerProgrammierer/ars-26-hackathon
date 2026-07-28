---
title: "Vibe Coding und gute Prompts"
description: "Von einer groben Idee zu überprüfbaren Schritten: Ziele, Kontext und Abnahmekriterien so formulieren, dass der Agent sinnvoll helfen kann."
order: 3
---

Beim Vibe Coding beschreibt ihr in natürlicher Sprache, was entstehen soll, und
entwickelt das Ergebnis gemeinsam mit einem Coding Agent. Gute Resultate kommen
nicht vom längsten Prompt, sondern von klaren Zielen, passendem Kontext und
kleinen überprüfbaren Schritten.

## Ein brauchbarer Startprompt

Nennt vier Dinge:

1. **Ziel:** Was soll eine Person am Ende tun können?
2. **Ausgangslage:** Welche Dateien, Daten und Funktionen gibt es bereits?
3. **Grenzen:** Was darf der Agent nicht ändern oder hinzufügen?
4. **Fertig-Kriterium:** Woran erkennt ihr, dass der Schritt funktioniert?

Zum Beispiel:

> Ergänze die bestehende Karte um einen Filter für Trinkbrunnen. Verwende nur
> die bereits geladenen Daten und keine neue Bibliothek. Auf kleinen
> Bildschirmen muss der Filter über der Karte bedienbar bleiben. Führe danach
> die vorhandenen Checks aus und beschreibe, wie ich das Ergebnis teste.

## Erst fragen, dann bauen

Wenn eure Idee noch unscharf ist, gebt dem Agent zunächst keine
Änderungserlaubnis:

> Stelle mir höchstens fünf Fragen, die du für einen kleinen, in zwei Tagen
> umsetzbaren Prototyp beantworten musst. Schlage danach drei Varianten vor.
> Ändere noch keinen Code.

Entscheidet euch selbst für eine Variante. Lasst sie anschließend in kleine
Schritte zerlegen und setzt nur den nächsten Schritt um.

## Prompts beim Debuggen

Beschreibt beobachtbares Verhalten statt nur „Es geht nicht“:

> Beim Klick auf „Route erstellen“ bleibt die Karte leer. In der
> Browser-Konsole steht die folgende Fehlermeldung: … Reproduziere den Fehler,
> erkläre die Ursache und schlage die kleinste Korrektur vor. Ändere noch
> nichts.

Gebt Fehlermeldungen vollständig weiter, aber entfernt Zugangsdaten,
personenbezogene Daten und andere Geheimnisse.

## Gute Schleifen

- **Planen:** Ziel und kleinsten nächsten Schritt festlegen.
- **Bauen:** Nur diesen Schritt umsetzen lassen.
- **Prüfen:** Checks ausführen und die Funktion selbst ausprobieren.
- **Vergleichen:** Passt das Ergebnis zum Fertig-Kriterium?
- **Sichern:** Einen funktionierenden Zwischenstand committen.

Wenn das Ergebnis vom Ziel abweicht, beschreibt die konkrete Abweichung.
Komplette Neuschreibungen kosten meist mehr Zeit und erzeugen neue Fehler.
