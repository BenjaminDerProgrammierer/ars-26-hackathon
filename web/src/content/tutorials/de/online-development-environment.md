---
title: "Online-Entwicklungsumgebung einrichten"
description: "Meldet euch an, startet den Entwicklungsserver und öffnet pi.dev in der bereitgestellten Browser-Umgebung."
order: 1
---

## Schritt 1: Anmeldung

Wenn ihr euch für die Online-Entwicklungsumgebung angemeldet habt, bekommt ihr
beim Eingang des Hackathons einen Zettel mit einem Shortcode. Gebt diesen Code
auf [der Redeem-Seite](../../redeem/) ein, um die Zugangsdaten für eure
Online-Entwicklungsumgebung zu erhalten. Die Zugangsdaten sehen so aus:

```plaintext
Environment 1  (vcenv-local-1)
  Code Server        : XXXXXXXXXX
  Password           : XXXXXXXXXX
  Dev server         : XXXXXXXXXX
  Container shell    : XXXXXXXXXX
```

Ruft den Link bei „Code Server“ im Browser auf und gebt das Passwort ein.

![Passwort-Eingabe](../assets/online-development-environment-1.png)

## Schritt 2: Entwicklungsumgebung einrichten

Jetzt müsst ihr den Ordner öffnen, in dem ihr arbeiten wollt. Klickt dazu auf Drei Striche → File → Open Folder und wählt den Ordner `website` aus.

![Entwicklungsumgebung; open file](../assets/online-development-environment-2.png)

![Open File; ~](../assets/online-development-environment-3.png)

![Open FIle; ~/website](../assets/online-development-environment-4.png)

Als Nächstes müsst ihr dem offenen Ordner vertrauen. Klickt oben auf „Manage“
und dann auf „Trust“.

![Workspace Trust window](../assets/online-development-environment-5.png)

Öffnet nun über das horizontal geteilte Rechteck oben rechts ein Terminal.

![Workspace Trust window](../assets/online-development-environment-6.png)

Gebt `npm run dev` ein, um den Entwicklungsserver zu starten.

![Terminal; npm run dev](../assets/online-development-environment-7.png)

Öffnet den Link bei „Dev server“ aus euren Zugangsdaten, um die Webseite zu
sehen, an der ihr gerade arbeitet.

![Startseite der Webseite](../assets/online-development-environment-8.png)

Öffnet über das Plus-Zeichen ein zweites Terminal, gebt `pi` ein und bestätigt,
dass pi.dev auf den geöffneten Projektordner zugreifen darf.

![Coding-Agent pi.dev; Trust](../assets/online-development-environment-9.png)

Fragt zum Beispiel nach, was die Dateien im Ordner `website` machen, und ihr bekommt eine Antwort von pi.dev.

> Erkläre die Dateien in diesem Ordner.

![Coding-Agent pi.dev; Erste Antwort](../assets/online-development-environment-10.png)

## Weitere Schritte

Wie ihr den Agent sinnvoll steuert, erfahrt ihr im nächsten Tutorial „Vibe Coding und Prompts“.
