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

## Start

```bash
cd lernkarten-final
npm install   # einmalig
npm start     # oder: node server.js
# → http://localhost:3004
```
