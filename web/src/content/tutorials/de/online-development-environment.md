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

![Entwicklungsumgebung; untrusted](../assets/online-development-environment-2.png)

Als Nächstes müsst ihr dem offenen Ordner vertrauen. Klickt oben auf „Manage“
und dann auf „Trust“.

![Workspace Trust window](../assets/online-development-environment-3.png)

![Entwicklungsumgebung; trusted](../assets/online-development-environment-4.png)

Öffnet nun über das horizontal geteilte Rechteck oben rechts ein Terminal.

Gebt `npm run dev` ein, um den Entwicklungsserver zu starten.

![Terminal mit laufendem Entwicklungsserver](../assets/online-development-environment-5.png)

Öffnet den Link bei „Dev server“ aus euren Zugangsdaten, um die Webseite zu
sehen, an der ihr gerade arbeitet.

![Startseite der Webseite](../assets/online-development-environment-6.png)

Öffnet über das Plus-Zeichen ein zweites Terminal, gebt `pi` ein und bestätigt,
dass pi.dev auf den geöffneten Projektordner zugreifen darf.

![Coding-Agent pi.dev](../assets/online-development-environment-7.png)

Wie ihr den Agent sinnvoll steuert, erfahrt ihr im Tutorial
[Mit pi.dev arbeiten](../pi-dev/).
