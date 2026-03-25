# CHANGES – Implementierungshistorie

Alle abgeschlossenen Änderungen und implementierten Features, chronologisch absteigend.

---

## 2026-03-24

### 17:30 – Phase 1 vollständig implementiert

#### Dark Mode
- Automatische Erkennung via `prefers-color-scheme`, manueller Toggle (Mond/Sonne-Button)
- Vollständige Dark-Mode-Variablen in CSS, Präferenz in `localStorage` gespeichert

#### Lernmodi
- **Modus-Auswahl** vor dem Start: Karteikarten / Multiple Choice / Tippen (Modal)
- **Multiple-Choice-Modus**: 4 Antwortoptionen (1 richtig, 3 zufällig aus Set), farbiges Feedback, Auto-Weiter
- **Schreibmodus (Tippen)**: Antwort eintippen, Normalisierung (Groß/Kleinschreibung, Satzzeichen), direktes Feedback mit richtiger Antwort

#### Verbesserter Abschluss-Screen
- Liste der falsch beantworteten Karten (Frage + Antwort) im Ergebnisscreen
- Neuer Button „Nur Fehler wiederholen" – startet Sitzung ausschließlich mit Fehlerkarten
- Sitzungsstatistik enthält jetzt auch den verwendeten Lernmodus

#### Karteneditor (in-App)
- Neuer Editor-View: Set-Metadaten (Titel, Beschreibung, Farbauswahl via Swatches)
- Karten direkt im Browser hinzufügen / löschen
- Bestehendes Set bearbeiten (Bleistift-Icon auf Kacheln, nur JSON-Sets)
- Neues Set erstellen (+-Button im Header)
- API: `POST /api/sets` (neu anlegen) und `PUT /api/sets/:file` (aktualisieren)

#### XLSX/Excel-Import
- Excel-Dateien (.xlsx) werden beim Upload automatisch in JSON konvertiert
- Gleiches Metadaten-Schema wie CSV (title, description, color als erste Zeilen)
- Dateifilter in Upload-Dialog auf JSON · CSV · XLSX erweitert

#### Schema-Validierung
- Server prüft alle hochgeladenen Dateien auf vollständiges Schema (title, cards, question, answer)
- Benutzerfreundliche Fehlermeldung bei ungültiger Datei, Datei wird nicht gespeichert

#### Beantworte Karten korrekt tracking
- Wechsel von `Set` zu `Map` für `answeredMap` – korrekte Anpassung bei Re-Bewertung
- Mehrfachbeantwortung einer Karte korrigiert Score nun korrekt

### 16:50 – Entwicklungsplan mit PAL MCP (Gemini 2.5 Pro) erarbeitet
- Dreiphasiger Entwicklungsplan in `TODO.md` eingetragen
- Tech-Stack-Empfehlung: Vanilla JS beibehalten, SQLite ab Phase 2, Alpine.js optional
- KI-Empfehlung: Ollama lokal (Datenschutz), Claude API als Fallback
- Benutzerverwaltungskonzept: Name + Emoji-Avatar, kein Passwort, UUID-basiert
- Abhängigkeiten zwischen Phasen dokumentiert

### 09:00 – Projektdokumentation angelegt
- `AGENTS.md` erstellt (Projektbeschreibung für KI-Agenten)
- `CLAUDE.md` als Symlink auf `AGENTS.md` angelegt
- `README.md` für Endbenutzer erstellt
- `TODO.md` für Erweiterungen und Verbesserungen angelegt
- `CHANGES.md` (diese Datei) für Implementierungshistorie erstellt
- GitHub-Repository unter `2000teddy/lernkarten-final` eingerichtet

---

## Initial-Implementierung (Claude.ai)

### Kernanwendung
- **Node.js/Express Server** auf Port 3004 (`server.js`)
- **REST-API** mit 7 Endpunkten für Fragensätze, Upload, Statistiken und Qualitätsbewertung
- **SPA-Frontend** (Single Page Application) mit reinem HTML/CSS/JavaScript, kein Framework

### Lernkarten-Funktionen
- Kartenansicht mit **Flip-Animation** (Klick auf Karte dreht sie um und zeigt die Antwort)
- **Navigation** mit Pfeiltasten (links = vorherige Karte, rechts = nächste Karte)
- **Punktezählung** (richtig/falsch) wird während der Sitzung aktualisiert
- **Abschluss-Bewertung** am Ende eines Durchgangs mit prozentualer Auswertung
- **Optionale Erklärungen** zu Antworten (im JSON/CSV-Schema definierbar)

### Themengebiet-Verwaltung
- **Übersichtsseite** mit allen verfügbaren Fragensätzen als Kacheln
- Farb-Codierung pro Themengebiet (via `color`-Feld)
- Anzeige der Kartenanzahl pro Set

### Datenimport
- Import von **JSON-Dateien** (vollständiges Schema mit Metadaten)
- Import von **CSV-Dateien** (kompaktes Format mit Metadaten-Header)
- **Upload-Funktion** im Browser (Drag & Drop / Datei-Dialog)
- **Löschen** von Fragensätzen direkt aus der App

### Qualitätsbewertung
- Jede Karte kann als „gut" oder „schlecht" bewertet werden
- Bewertung wird in der JSON-Datei persistiert (`quality`-Feld)

### Statistiken
- Sitzungsstatistiken werden serverseitig in `data/.stats/` gespeichert
- Letzte 20 Sitzungen werden je Fragensatz aufbewahrt

### Beispiel-Datensätze
- `deutsch-zeiten.json` – Deutsche Grammatik: Zeitformen
- `englisch-verben.json` – Englisch: unregelmäßige Verben
- `hsu-bayern.json` – HSU Bayern (Heimat- und Sachkunde)
- `mathe-begriffe.csv` – Mathematische Grundbegriffe (CSV-Format)
