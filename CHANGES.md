# CHANGES – Implementierungshistorie

Alle abgeschlossenen Änderungen und implementierten Features, chronologisch absteigend.

---

## 2026-04-03

### 21:15 – Quick Wins aus nächtlichem Feature-Brainstorm umgesetzt

#### Vorlagen & Austausch
- Downloadbare Startvorlagen unter `public/templates/` ergänzt
- Upload-Dialog um direkte Template-Links für Schüler und Lehrkräfte erweitert
- Neuer Download-Endpunkt für vorhandene Sets ergänzt
- Download-Button auf den Set-Kacheln in der Oberfläche ergänzt
- Export-Endpunkt für CSV und XLSX ergänzt
- Export-Modal in der Oberfläche ergänzt, um Originaldatei, CSV oder XLSX gezielt herunterzuladen
- CSV-Import/-Export für Metadaten mit Kommas und Zeilenumbrüchen robuster gemacht
- Export gegen Spreadsheet-Formel-Injection gehärtet und mit lokalem Smoke-Test abgesichert

#### Metadaten-Grundlage
- Set-Schema um optionale Metadaten erweitert: `schemaVersion`, `subject`, `topic`, `grade`, `language`, `audience`, `tags`
- CSV- und XLSX-Parser so erweitert, dass diese Metadaten bereits mitgelesen werden
- Editor um Eingabefelder für die neuen Metadaten ergänzt
- Set-Kacheln zeigen nun erste Metadaten-Badges an
- Erste Filterleiste in der Startansicht für Fach, Klassenstufe und Sprache ergänzt
- Filter um Thema und freie Tag-Suche erweitert

#### Druck & Statistik
- Druckansicht pro Set ergänzt, um Karten in einem eigenen Druckfenster auszugeben
- Statistik-API und Statistikansicht um eine Liste der schwächsten Karten ergänzt
- Druckfenster so abgesichert, dass Browser-Popup-Blocker die Funktion seltener unterbrechen
- Leerer Filterzustand in der Set-Ansicht zeigt nun eine passende Meldung statt eines generischen No-Data-Texts
- Startseite zeigt jetzt eine tägliche Karte, bei Profilen bevorzugt aus fälligen Themen
- Lernansicht um Text-to-Speech-Buttons für Frage und Antwort erweitert

#### Dokumentation & Roadmap
- `README.en.md` als englische Projektübersicht ergänzt
- `README.md` um neue Felder, Vorlagen und Download-Hinweise erweitert
- `TODO.md` mit priorisierter Roadmap aus PAL/CLINK- und Multi-Model-Brainstorm ergänzt
- Editor um eine Schnellerfassung für viele Karten aus Textblöcken erweitert

### 11:30 – Sicherheits- und Stabilitätsfixes nach Codereview

#### Frontend-Härtung
- Riskante dynamische Inline-Handler in Profil- und Set-Rendering entfernt
- Ereignisse für Profilwahl, Set-Start, Bearbeiten und Löschen nach dem Rendern per Listener gebunden
- HTML-Escaping für Anführungszeichen ergänzt, damit Sonderzeichen Daten- und Attributkontexte nicht mehr aufbrechen

#### Lernfluss stabilisiert
- Schutz gegen Mehrfachauslösung in `markAnswer()` ergänzt
- Doppelte Timeouts/Intervalle für Auto-Weiter verhindert
- Ergebnis- und Kartenfluss dadurch robuster bei schnellen Klicks oder Tastatureingaben

#### Statistikansicht robuster
- Empty-State der Sitzungsstatistik so angepasst, dass das Chart-Canvas im DOM erhalten bleibt
- Spätere erneute Anzeige mit echten Sitzungen funktioniert nun ohne vollständigen Reload

#### Backend-Härtung
- Dateinamen- und Set-Pfade serverseitig normalisiert und validiert
- Uploads werden zuerst temporär gespeichert und erst nach Prüfung unter sicherem Namen übernommen
- Kollisionsschutz für Uploads und XLSX→JSON-Konvertierung ergänzt
- Session-API validiert eingereichte `cardId`s jetzt gegen das tatsächliche Set

#### Projektdokumentation
- Arbeitsregeln für Agenten in `AGENTS.md` ergänzt
- `MEMORY.md` als Kurzprotokoll für letzten Prompt, letzte Tätigkeiten und offene Punkte angelegt

### 12:10 – Verwaisten Arbeitsstand bereinigt

#### UI-Vervollständigung
- Markup und Styles für den „Weiter“-Button im Multiple-Choice- und Schreibmodus nachgezogen
- Dadurch passt `public/index.html`/`public/css/style.css` wieder zum bereits genutzten Frontend-Code in `app.js`

#### Neue Beispieldatensätze
- Fünf weitere HSU-Sets in `data/` übernommen:
  - Bundesländer Deutschlands
  - Flüsse in Bayern
  - München und Berlin
  - Bayerns Nachbarn, Fakten und Seen
  - Bayerns Regierungsbezirke

#### Git-Hygiene
- `.gitignore` für SQLite-Laufzeitdateien und Legacy-Statistikordner ergänzt
- Laufzeitdateien (`lernkarten.db`, `*.wal`, `*.shm`, `data/.stats/`) damit künftig nicht mehr versehentlich als untracked auftauchen

### 12:25 – Restdaten bereinigt

#### Datensätze
- Syntaxfehler in `data/hsu-bayern.json` behoben, sodass das Set wieder korrekt geladen werden kann
- Offene Kartenbewertung in `data/englisch-verben.json` bewusst übernommen statt verworfen

## 2026-03-25

### 10:00 – Phase 2 vollständig implementiert

#### SQLite-Datenbasis
- `db.js` neu erstellt: `better-sqlite3`-Integration mit Tabellen `users`, `card_progress`, `sessions`
- SM-2-Algorithmus (`sm2Update`) serverseitig implementiert: Ease Factor, Intervall-Berechnung, Wiederholungszähler
- Rückwärtskompatibilität: Legacy-JSON-Stats für Gastmodus behalten

#### Benutzerverwaltung (kindgerecht, kein Passwort)
- Profilauswahl beim ersten Start: Name + Emoji-Avatar (18 Emojis zur Auswahl)
- UUID-basierte Identifikation serverseitig, `localStorage`-Bindung am Gerät
- Mehrere Profile auf einem Gerät möglich (z.B. für Geschwisterkinder)
- Gastmodus ohne Profil weiterhin verfügbar
- API: `GET/POST /api/users`, `DELETE /api/users/:id`

#### Spaced Repetition (SM-2)
- Kartenfortschritt je Benutzer und Set in SQLite gespeichert
- Fällige Karten: `GET /api/users/:userId/due`, `GET /api/users/:userId/sets/:file/due`
- Sitzungen mit SM-2-Update pro Karte: `POST /api/users/:userId/sets/:file/session`
- Neuer Lernmodus „Fällige Karten" in Modusauswahl (nur sichtbar bei eingeloggtem Benutzer + fälligen Karten)
- Kacheln zeigen Badge mit Anzahl fälliger Karten

#### Statistik-Dashboard
- `GET /api/users/:userId/stats` liefert Fortschritt je Set + Sitzungshistorie
- Neuer Stats-View mit Fortschrittsbalken je Themengebiet
- Chart.js (CDN) Balkendiagramm: richtige vs. falsche Antworten der letzten Sitzungen
- Sitzungstabelle mit Datum, Modus, Ergebnis je Set

#### PWA (Progressive Web App)
- `public/manifest.json`: App-Name, Theme-Color, Standalone-Display
- `public/sw.js`: Service Worker mit Cache-First (statische Assets) + Network-First (`/api/`)
- `public/icon.svg`: App-Icon mit grünem Hintergrund und 🎴-Emoji
- App auf Startbildschirm installierbar (iOS/Android/Desktop)

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
