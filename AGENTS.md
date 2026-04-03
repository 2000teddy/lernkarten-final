# AGENTS.md – Lernkarten-App

Diese Datei enthält Hinweise für KI-Agenten (Claude Code, Copilot, etc.) zur Arbeit in diesem Projekt.

## Projektüberblick

**Lernkarten-App** – eine interaktive, browserbasierte Lernkarten-Anwendung (ähnlich NotebookLM).
Node.js/Express Backend (Port **3004**), reines HTML/CSS/JS Frontend (kein Framework).

## Verzeichnisstruktur

```
lernkarten-final/
├── server.js          # Express-Server, REST-API
├── package.json
├── data/              # Fragensätze als JSON oder CSV
│   ├── *.json
│   ├── *.csv
│   └── .stats/        # Sitzungsstatistiken (automatisch)
├── public/
│   ├── index.html     # SPA-Einstiegspunkt
│   ├── css/style.css
│   └── js/app.js      # Frontend-Logik
└── routes/            # Reserviert für zukünftige Route-Module
```

## REST-API (server.js)

| Methode | Pfad | Funktion |
|---------|------|----------|
| GET | `/api/sets` | Alle Fragensätze auflisten |
| GET | `/api/sets/:file` | Einzelnen Fragensatz laden |
| PATCH | `/api/sets/:file/cards/:id/quality` | Kartenqualität bewerten |
| POST | `/api/upload` | Neue Datei hochladen (JSON/CSV) |
| DELETE | `/api/sets/:file` | Fragensatz löschen |
| GET | `/api/sets/:file/stats` | Sitzungsstatistiken abrufen |
| POST | `/api/sets/:file/stats` | Sitzungsstatistiken speichern |

## Dateiformat

### JSON
```json
{
  "title": "Themengebiet",
  "description": "Kurze Beschreibung",
  "color": "#6366F1",
  "cards": [
    {
      "id": 1,
      "question": "Frage?",
      "answer": "Antwort",
      "explanation": "Optionale Erklärung",
      "quality": null
    }
  ]
}
```

### CSV
```
title,Themengebiet
description,Kurze Beschreibung
color,#6366F1
question,answer,explanation
Frage 1?,Antwort 1,Optionale Erklärung
Frage 2?,Antwort 2,
```

## Entwicklungshinweise

- **Kein Build-Schritt** nötig – direkt mit `node server.js` starten
- Frontend ist Vanilla JS – kein React/Vue/Angular
- Dateinamen in `data/` werden direkt als API-Parameter genutzt – keine DB
- Statistiken werden in `data/.stats/` als `<filename>.json` gespeichert (max. 20 Sitzungen)
- CSV-Parsing erfolgt synchron via `csv-parse/sync`
- Kartenqualität (`quality: 'good' | 'bad'`) wird nur in JSON-Dateien persistiert

## Arbeitsregeln für Agenten

- Vor Implementierungen immer zuerst `git pull` versuchen, dann die vorhandenen Markdown-Dateien (`AGENTS.md`, `README.md`, `CHANGES.md`, `TODO.md`, `MEMORY.md`) lesen.
- Nach jeder inhaltlichen Änderung die betroffenen `*.md`-Dateien aktualisieren, mindestens aber `CHANGES.md` und bei Nutzer-relevanten Änderungen auch `README.md`.
- Nach abgeschlossener Änderung einen gezielten Commit mit nur den passenden Dateien erstellen; bestehende fremde Worktree-Änderungen nicht ungeprüft mit committen.
- `MEMORY.md` als kurze Arbeitsnotiz pflegen: letzter relevanter Prompt, letzte umgesetzte Arbeiten, offene Punkte.

## Rollenmodell / Orchestrierung

- Die aktuelle CLI-AI arbeitet als **Lead Developer & Orchestrator**:
  - schreibt den Code
  - trifft Umsetzungsentscheidungen
  - steuert den Gesamtprozess
- Sub-Agenten und PAL/CLINK-Modelle werden gezielt für klar umrissene Nebenaufgaben eingesetzt, nicht als Ersatz für die Hauptumsetzung.

## Empfohlener Werkzeugeinsatz

- **Modul fertig / allgemeiner Gegencheck**
  - `pal:codereview` mit `gpt-5.4` oder Gemini nutzen
  - Grund: andere Modelle finden oft andere Bugs und Regressionen
- **Design-Frage / Richtungsentscheidung**
  - `pal:consensus` mit 2-3 Modellen nutzen
  - Grund: vermeidet Tunnelblick
- **Tests schreiben oder isolierte Teilaufgabe**
  - `clink` mit Gemini für klar abgegrenzte Outputs nutzen
- **Vor dem Commit**
  - `pal:precommit` zur automatischen Validierung nutzen
- **Security-Check**
  - `pal:codereview` mit Security-Fokus nutzen
  - Besonders wichtig bei sensiblen Bereichen wie Auth, Secrets, Vault- oder Crypto-nahem Code

## Start

```bash
cd lernkarten-final
npm install   # einmalig
npm start     # oder: node server.js
# → http://localhost:3004
```
