# Lernkarten-App

🇩🇪 Deutsch · 🇬🇧 [English](README.en.md)

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
- **Sicherer Import** – Upload-Dateinamen werden serverseitig normalisiert und bei Kollisionen abgewiesen
- **Vorlagen** – Downloadbare Startvorlagen für Vokabeln und Unterrichtssätze
- **Download** – Vorhandene Sets können direkt aus der Oberfläche heruntergeladen werden
- **Filter** – Sets lassen sich nach Fach, Klassenstufe und Sprache einschränken

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

> Hinweis: Beim Upload normalisiert der Server Dateinamen. Wenn bereits ein Set mit demselben abgeleiteten Dateinamen existiert, wird der Import mit einer Fehlermeldung abgewiesen statt eine bestehende Datei zu überschreiben.

### Vorlagen

Im Upload-Dialog stehen fertige Startvorlagen zum Download bereit:

- `CSV-Vorlage Vokabeln`
- `JSON-Vorlage Vokabeln`
- `CSV-Vorlage Lehrkraft`

---

### Format: JSON

#### Vollständige Struktur

```json
{
  "schemaVersion": 2,
  "title": "Mathe – Grundrechenarten",
  "description": "Kurze Beschreibung des Themas (optional)",
  "subject": "Mathematik",
  "topic": "Grundrechenarten",
  "grade": "3-4",
  "language": "de",
  "audience": "Schüler",
  "tags": ["grundschule", "zahlen"],
  "color": "#F59E0B",
  "cards": [
    {
      "id": 1,
      "question": "Was ist 7 × 8?",
      "answer": "56",
      "explanation": "7 × 8 kann man als 7 × 4 × 2 = 28 × 2 = 56 berechnen.",
      "quality": null
    },
    {
      "id": 2,
      "question": "Was ist eine Primzahl?",
      "answer": "Eine Zahl, die nur durch 1 und sich selbst teilbar ist.",
      "explanation": "Beispiele: 2, 3, 5, 7, 11, 13 … Die 1 gilt nicht als Primzahl.",
      "quality": null
    }
  ]
}
```

#### Feldbeschreibung

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `schemaVersion` | Zahl | Nein | Schemaversion, aktuell `2` |
| `title` | String | Ja | Themengebiet, erscheint als Überschrift auf der Kachel |
| `description` | String | Nein | Kurzbeschreibung, wird unter dem Titel angezeigt |
| `subject` | String | Nein | Fach, z.B. Deutsch, Englisch, Mathe |
| `topic` | String | Nein | Unterthema oder Schwerpunkt |
| `grade` | String | Nein | Klassenstufe oder Bereich, z.B. `3-4` |
| `language` | String | Nein | Sprachkürzel wie `de` oder `en` |
| `audience` | String | Nein | Zielgruppe, z.B. Schüler oder Lehrkraft |
| `tags` | Array | Nein | Freie Schlagwörter für spätere Filter |
| `color` | String | Nein | Hex-Farbcode für die Kachel (Standard: `#6366F1`) |
| `cards` | Array | Ja | Liste aller Lernkarten |
| `cards[].id` | Zahl | Ja | Eindeutige Nummer der Karte (fortlaufend ab 1) |
| `cards[].question` | String | Ja | Die Frage auf der Vorderseite der Karte |
| `cards[].answer` | String | Ja | Die Antwort auf der Rückseite der Karte |
| `cards[].explanation` | String | Nein | Zusätzliche Erklärung, nach dem Aufdecken abrufbar |
| `cards[].quality` | String\|null | Nein | Qualitätsbewertung: `"good"`, `"bad"` oder `null` (wird von der App gesetzt) |

#### Farbcodes

| Farbe | Hex-Code |
|-------|----------|
| Indigo (Standard) | `#6366F1` |
| Grün | `#10B981` |
| Orange | `#F59E0B` |
| Rot | `#EF4444` |
| Blau | `#3B82F6` |
| Lila | `#8B5CF6` |

---

### Format: CSV

#### Vollständige Struktur

```csv
schemaVersion,2
title,Mathe - Begriffe
description,Mathematische Grundbegriffe für die Grundschule
subject,Mathematik
topic,Grundbegriffe
grade,3-4
language,de
audience,Schüler
tags,grundschule|zahlen
color,#EF4444
question,answer,explanation
Was ist ein Produkt?,Das Ergebnis einer Multiplikation heißt Produkt.,"Beispiel: 3 × 4 = 12. Die 12 ist das Produkt, 3 und 4 heißen Faktoren."
Was ist ein Quotient?,Das Ergebnis einer Division heißt Quotient.,"Beispiel: 12 ÷ 4 = 3. Die 3 ist der Quotient."
Was ist eine Summe?,Das Ergebnis einer Addition heißt Summe.,
```

#### Aufbau der CSV-Datei

Die Datei besteht aus zwei Bereichen: einem **Metadaten-Kopf** und dem **Kartenteil**.

**Metadaten-Kopf** (vor der Kopfzeile):

| Zeile | Format | Pflicht | Beschreibung |
|-------|--------|---------|--------------|
| `schemaVersion,…` | `schemaVersion,<Wert>` | Nein | Schemaversion |
| `title,…` | `title,<Wert>` | Ja | Themengebiet |
| `description,…` | `description,<Wert>` | Nein | Kurzbeschreibung |
| `subject,…` | `subject,<Wert>` | Nein | Fach |
| `topic,…` | `topic,<Wert>` | Nein | Unterthema |
| `grade,…` | `grade,<Wert>` | Nein | Klassenstufe |
| `language,…` | `language,<Wert>` | Nein | Sprachkürzel |
| `audience,…` | `audience,<Wert>` | Nein | Zielgruppe |
| `tags,…` | `tags,<Wert>` | Nein | Tags, getrennt durch `|`, `,` oder `;` |
| `color,…` | `color,<Hex>` | Nein | Kachelfarbe (z.B. `#3B82F6`) |

**Kopfzeile** (trennt Metadaten von Karten):

```
question,answer,explanation
```

Diese Zeile ist **Pflicht** und markiert den Beginn der Kartendaten.

**Karten-Zeilen** (eine Karte pro Zeile):

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| 1 – `question` | Ja | Die Frage |
| 2 – `answer` | Ja | Die Antwort |
| 3 – `explanation` | Nein | Erklärung (leer lassen = keine Erklärung) |

> **Hinweis:** Enthält ein Wert ein Komma, muss er in **Anführungszeichen** gesetzt werden:
> `"Beispiel: 3 × 4 = 12, die 12 ist das Produkt."`

#### Unterschiede zu JSON

| | JSON | CSV |
|-|------|-----|
| Qualitätsbewertung speicherbar | Ja (wird persistiert) | Nein (nur während Sitzung) |
| Mehrzeilige Erklärungen | Ja | Eingeschränkt |
| Empfohlen für | Vollständige Datensätze | Schnelles Erstellen in Excel/Tabellenprogramm |

## Enthaltene Beispiel-Datensätze

| Datei | Thema |
|-------|-------|
| `deutsch-zeiten.json` | Deutsch – Grammatik: Zeitformen |
| `englisch-verben.json` | Englisch – Unregelmäßige Verben |
| `hsu-bayern.json` | HSU Bayern – Heimat- und Sachkunde |
| `hsu-bundeslaender-deutschland.json` | HSU – Alle 16 Bundesländer Deutschlands |
| `hsu-fluesse-bayern.json` | HSU – Flüsse in Bayern |
| `hsu-muenchen-und-berlin.json` | HSU – München und Berlin |
| `hsu-nachbarn-fakten-seen.json` | HSU – Bayerns Nachbarn, Fakten und Seen |
| `hsu-regierungsbezirke.json` | HSU – Bayerns 7 Regierungsbezirke |
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
├── MEMORY.md          # Letzter Arbeitsstand / Kurznotizen
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
