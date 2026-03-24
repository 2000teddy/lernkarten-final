# Lernkarten-App

Interaktive Lernkarten-Anwendung für Schüler und Lernende – ähnlich wie NotebookLM, aber lokal und erweiterbar.

## Idee & Hintergrund

Die App entstand aus dem Wunsch, eine NotebookLM-ähnliche Lernkarten-Umgebung zu haben, die man selbst betreiben und beliebig erweitern kann.

Kernidee: Klickt man auf eine Frage, wendet sich die Karte und zeigt die Lösung. Mit dem Pfeil nach rechts kommt die nächste Frage, nach links die vorherige. In der Mitte werden richtige und falsche Antworten hochgezählt. Am Ende gibt es eine kleine Bewertung des Durchgangs.

Neue Fragensätze (Frage/Antwort-Paare) lassen sich über JSON oder CSV in ein Datenverzeichnis importieren. Die Überschrift der Datei gibt das Themengebiet an (z.B. „HSU – Bayern", „Deutsch – Zeiten", „Mathe – Begriffe", „Englisch – unregelmäßige Verben"), sodass schrittweise eine größere Wissens- und Abfragebasis aufgebaut werden kann.

Zusätzlich kann die Qualität der Fragen bewertet werden. Erläuterungen und Erklärungen zu den Antworten sind ebenfalls abrufbar – alles durch das JSON- oder CSV-Schema definiert.

Als nächster Schritt ist geplant, Fragen automatisch per KI aus einem Verzeichnis mit Lernmaterial zu generieren, wobei der Verzeichnisname das Themengebiet bestimmt (siehe [TODO.md](TODO.md)).

## Features

- **Karteikarten mit Flip-Animation** – Klick auf die Karte dreht sie um und zeigt die Antwort
- **Navigation** – Pfeiltasten oder Buttons für vorherige/nächste Karte
- **Punktezählung** – Richtige und falsche Antworten werden gezählt
- **Abschlussbewertung** – Am Ende jedes Durchgangs gibt es eine Auswertung
- **Erklärungen** – Optional können Erläuterungen zu jeder Antwort hinterlegt werden
- **Qualitätsbewertung** – Einzelne Karten können als „gut" oder „schlecht" bewertet werden
- **Statistiken** – Die letzten 20 Lernsitzungen je Themengebiet werden gespeichert
- **Themengebiete** – Beliebig viele Fragensätze verwaltbar (z.B. Deutsch, Englisch, Mathe, HSU)
- **Import** – Neue Fragensätze per JSON oder CSV importieren

## Voraussetzungen

- [Node.js](https://nodejs.org/) Version 18 oder neuer
- npm (wird mit Node.js installiert)

## Installation & Start

```bash
# Repository klonen
git clone https://github.com/2000teddy/lernkarten-final.git
cd lernkarten-final

# Abhängigkeiten installieren
npm install

# App starten
npm start
```

Danach die App im Browser öffnen: **http://localhost:3004**

## Eigene Fragensätze erstellen

Neue Fragensätze können als **JSON** oder **CSV** direkt über die App hochgeladen werden (Button „Datei hochladen" auf der Startseite).

Alternativ Dateien manuell in das Verzeichnis `data/` kopieren – beim nächsten Seitenaufruf erscheinen sie automatisch.

### Format: JSON

```json
{
  "title": "Mathe – Grundrechenarten",
  "description": "Kurze Beschreibung des Themas",
  "color": "#F59E0B",
  "cards": [
    {
      "id": 1,
      "question": "Was ist 7 × 8?",
      "answer": "56",
      "explanation": "7 × 8 kann man als 7 × 4 × 2 = 28 × 2 = 56 berechnen.",
      "quality": null
    }
  ]
}
```

**Farbcodes** (Beispiele):
| Farbe | Hex-Code |
|-------|----------|
| Indigo (Standard) | `#6366F1` |
| Grün | `#10B981` |
| Orange | `#F59E0B` |
| Rot | `#EF4444` |
| Blau | `#3B82F6` |
| Lila | `#8B5CF6` |

### Format: CSV

```csv
title,Englisch – Farben
description,Englische Vokabeln: Farben
color,#3B82F6
question,answer,explanation
What color is the sky?,blue,The sky appears blue because of light scattering.
What color is grass?,green,
What color is a banana?,yellow,
```

- Die ersten Zeilen (`title,`, `description,`, `color,`) sind Metadaten
- Die Kopfzeile `question,answer,explanation` markiert den Start der Karten
- Die Spalte `explanation` ist optional

## Enthaltene Beispiel-Datensätze

| Datei | Thema |
|-------|-------|
| `deutsch-zeiten.json` | Deutsch – Grammatik: Zeitformen |
| `englisch-verben.json` | Englisch – Unregelmäßige Verben |
| `hsu-bayern.json` | HSU Bayern – Heimat- und Sachkunde |
| `mathe-begriffe.csv` | Mathe – Grundbegriffe (CSV-Beispiel) |

## Projektstruktur

```
lernkarten-final/
├── server.js          # Node.js/Express Backend
├── package.json       # Abhängigkeiten
├── data/              # Fragensätze (JSON/CSV)
│   └── .stats/        # Sitzungsstatistiken (automatisch)
├── public/
│   ├── index.html     # Frontend
│   ├── css/style.css
│   └── js/app.js
├── README.md          # Diese Datei
├── CHANGES.md         # Implementierungshistorie
└── TODO.md            # Geplante Erweiterungen
```

## Geplante Erweiterungen

Siehe [TODO.md](TODO.md) für eine vollständige Liste der geplanten Features, u.a.:
- KI-gestützte Fragengenerierung aus Textdokumenten
- Spaced-Repetition-Algorithmus
- Multiple-Choice- und Schreibmodus
- Benutzerverwaltung für den Schulkontext

## Lizenz

MIT License – freie Verwendung, auch im Schulkontext.
