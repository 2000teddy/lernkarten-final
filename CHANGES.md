# CHANGES – Implementierungshistorie

Alle abgeschlossenen Änderungen und implementierten Features, chronologisch absteigend.

---

## 2026-03-24

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
