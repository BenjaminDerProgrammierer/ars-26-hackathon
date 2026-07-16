---
title: "pi.dev mit eigenen Modellen verwenden"
description: "Mit Pi programmieren, das Hackathon-Budget nutzen und bei Bedarf zum eigenen Anbieter oder Abo wechseln."
order: 4
---

[Pi](https://pi.dev) ist ein Coding Agent für das Terminal. Er kann Dateien
lesen und bearbeiten, Befehle ausführen und euch beim Bauen und Testen des
Projekts unterstützen. In der gehosteten Hackathon-Umgebung ist Pi bereits
installiert. Auf dem eigenen Computer installiert ihr die aktuelle Version mit
Node.js und npm:

```sh
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

## Startet Pi in eurem Projekt

Öffnet ein Terminal, wechselt in das Projektverzeichnis und startet Pi:

```sh
cd pfad/zu/eurem-projekt
pi
```

Pi kann nun mit den Dateien in diesem Verzeichnis arbeiten. Beginnt mit einem
konkreten Auftrag, zum Beispiel:

> Lies die README und untersuche das Projekt. Schlage einen kurzen Plan für eine
> Karte der Festival-Events vor. Ändere noch keine Dateien.

Prüft den Plan und lasst Pi danach jeweils einen Schritt umsetzen. Fordert nach
Änderungen die passenden Checks an und kontrolliert den Diff vor dem Commit.

Nützliche Steuerung:

- Gebt `/model` ein oder drückt `Ctrl+L`, um ein Modell auszuwählen.
- Mit `Ctrl+P` wechselt ihr zwischen den über `/scoped-models` aktivierten
  Modellen.
- Mit `/login` verbindet ihr ein Konto bei einem unterstützten Anbieter.
- Mit `Ctrl+C` brecht ihr den aktuellen Vorgang ab, mit `Ctrl+D` beendet ihr Pi.

## Nutzt das Hackathon-Budget

Das optionale KI-Add-on enthält einen OpenRouter-API-Key und ein Budget von 20
US-Dollar für Mistral Medium 3.5. Kopiert den Key aus eurem
Teilnehmer:innen-Konto ausschließlich in die aktuelle Shell:

```sh
read -rsp "OpenRouter API-Key: " OPENROUTER_API_KEY && echo
export OPENROUTER_API_KEY
pi
```

Öffnet `/model`, sucht nach Mistral Medium 3.5 und wählt das Modell aus. Pi liest
den Key aus der Umgebungsvariable. Schreibt ihn nicht in den Quellcode, in
`.env`-Dateien, die committed werden könnten, in die Shell-History, in
Screenshots oder Chat-Nachrichten. Den verbindlichen Stand eures
Hackathon-Guthabens findet ihr im Teilnehmer:innen-Portal.

## Verwendet euer eigenes Anbieter-Abo

Wenn das Hackathon-Budget aufgebraucht ist oder ihr ein Modell aus eurem eigenen
Abo bevorzugt, startet Pi und gebt `/login` ein. Wählt einen unterstützten
Anbieter und folgt dessen Anmeldeprozess. Anschließend wählt ihr mit `/model`
eines seiner Modelle aus.

Ein gewöhnliches Chat-Abo umfasst nicht automatisch die API-Nutzung. Ihr könnt
es über `/login` nur verwenden, wenn Pi dafür eine kompatible Abo-Anmeldung
anbietet. Andernfalls benötigt ihr einen separat verrechneten API-Zugang.

Bei Anbietern mit API-Key könnt ihr stattdessen vor dem Start die dokumentierte
Umgebungsvariable setzen, zum Beispiel `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` oder
`GOOGLE_GENERATIVE_AI_API_KEY`. Anfragen über euer eigenes Konto verrechnet der
jeweilige Anbieter, nicht der Hackathon. Prüft vorher Preise und Nutzungslimits.

## Fügt einen anderen OpenAI-kompatiblen Anbieter hinzu

Eigene Anbieter und Modelle konfiguriert ihr in
`~/.pi/agent/models.json`. Verwendet diese Möglichkeit, wenn euer Anbieter nicht
über `/login` verfügbar ist oder ihr einen eigenen Endpunkt braucht. Setzt
zuerst den Key in einer Umgebungsvariable:

```sh
read -rsp "Provider API-Key: " MY_PROVIDER_API_KEY && echo
export MY_PROVIDER_API_KEY
mkdir -p ~/.pi/agent
```

Erstellt oder erweitert danach `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "my-provider": {
      "baseUrl": "https://api.example.com/v1",
      "apiKey": "$MY_PROVIDER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "provider-model-id",
          "name": "My Provider Model",
          "reasoning": false,
          "input": ["text"],
          "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
          },
          "contextWindow": 128000,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

Ersetzt URL, Modell-ID, Fähigkeiten, Kontextgröße, Ausgabelimit und Kosten durch
die Angaben aus der Dokumentation eures Anbieters. Kosten werden in US-Dollar
pro Million Tokens angegeben und dienen nur der Nutzungsanzeige von Pi. Tragt
die echten Preise ein, wenn ihr brauchbare Schätzungen sehen wollt. Setzt
`reasoning` nur bei entsprechender Unterstützung auf `true` und ergänzt `input`
nur bei bildfähigen Modellen um `"image"`.

Öffnet `/model` erneut und sucht nach der Modell-ID. Erscheint sie
nicht, prüft die JSON-Syntax, die Umgebungsvariable in derselben Shell und ob der
Anbieter eine OpenAI-kompatible Chat-Completions-API verwendet. Teilweise
kompatible Dienste benötigen zusätzliche `compat`-Einstellungen. Übernehmt
diese aus Pis
[Dokumentation für eigene Modelle](https://pi.dev/docs/latest/models), statt
Werte zu erraten.

## Behaltet Kosten und Code unter Kontrolle

- Ein Modellwechsel ändert, wer die nächsten Anfragen verrechnet. Er überträgt
  oder verlängert das Hackathon-Budget nicht.
- Nutzt für Routineaufgaben ein kleineres oder günstigeres Modell und spart
  stärkere Modelle für schwierige Fehlersuche oder Architekturentscheidungen.
- Beginnt eine neue Session, wenn der alte Kontext nicht mehr hilfreich ist.
- Prüft Änderungen, führt Tests aus und haltet API-Keys aus dem Repository.
