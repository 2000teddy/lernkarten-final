# TODO – Entwicklungsplan & Erweiterungen

Geplante Phasen, erarbeitet gemeinsam mit PAL MCP (Gemini 2.5 Pro), 2026-03-24.
Abgeschlossenes wird in `CHANGES.md` übertragen.

---

## Tech-Stack-Empfehlung

**Vanilla JS beibehalten** für Phase 1 und 2 – kein Overhead, kein Build-Schritt, direkt wartbar.
Ab Phase 2/3, wenn Komplexität steigt: **Alpine.js** als minimale Ergänzung erwägen (keine
Kompilierung nötig, nur ein `<script>`-Tag). SQLite (via `better-sqlite3`) ab Phase 2 als
Datenbasis für Benutzerfortschritt und Statistiken anstelle der JSON-Dateien.

---

## Phase 1 – Sofort, hoher Nutzwert

Keine Architekturänderung nötig. Alle Tasks bauen direkt auf dem bestehenden Code auf.

### Lernmodi
- [x] **Multiple-Choice-Modus** – 4 Antwortoptionen, 3 Falsche automatisch aus dem Set gezogen `[Klein]`
- [x] **Schreibmodus** – Antwort eintippen, Vergleich mit Lösung (Groß-/Kleinschreibung ignorieren) `[Klein]`
- [ ] **Zufallsmodus (Shuffle)** – Reihenfolge der Karten zufällig mischen `[Klein]` *(Karten sind standardmäßig bereits gemischt)*

### Bedienung & UX
- [x] **Karteneditor in der App** – Karten direkt im Browser erstellen und bearbeiten, ohne externe Datei `[Mittel]`
- [x] **Fortschrittsbalken** – Visueller Fortschritt während einer Sitzung (z.B. „Karte 4 von 12") `[Klein]`
- [x] **Verbesserter Abschluss-Screen** – Fehler-Liste + „Nur Fehler wiederholen" Button `[Klein]`
- [x] **Dark Mode** – Systemeinstellung automatisch erkennen + manueller Toggle `[Klein]`
- [x] **Tastaturnavigation** – Leertaste = Karte umdrehen, Pfeiltasten = Navigation `[Klein]`

### Daten & Import
- [x] **XLSX/Excel-Import** – via `xlsx`-Paket, für Lehrkräfte die mit Excel arbeiten `[Klein]`
- [x] **Schema-Validierung beim Upload** – Fehlermeldung wenn JSON/CSV/XLSX fehlerhaft oder leer `[Klein]`

---

## Phase 2 – Mittelfristig, moderate Komplexität

Baut auf Phase 1 auf. Erfordert Datenbankgrundlage (SQLite) und Benutzerkonzept.

### Voraussetzung: Datenbasis
- [ ] **SQLite-Integration** (`better-sqlite3`) – Benutzerfortschritt, SM-2-Daten und Statistiken in DB statt JSON-Dateien `[Groß]`
  - Ersetzt `data/.stats/` für Statistiken
  - Neue Tabellen: `users`, `progress`, `sessions`

### Benutzerverwaltung (kindgerecht, kein Passwort)
- [ ] **Benutzerprofile** – Name + Avatar (Emoji-Auswahl), keine Registrierung/kein Passwort `[Mittel]`
  - Auswahl beim ersten Start, gespeichert in `localStorage` (Gerätezuordnung)
  - Serverseitig via UUID identifiziert
  - Mehrere Profile auf einem Gerät möglich (z.B. für Geschwisterkinder)
- [ ] **Getrennter Lernfortschritt** je Benutzerprofil `[Mittel]`

### Lernalgorithmus
- [ ] **Spaced-Repetition (SM-2)** – Karten die öfter falsch beantwortet wurden, öfter anzeigen `[Mittel]`
  - Intervall-Berechnung pro Karte und Benutzer
  - „Fällige Karten heute" als Startansicht anzeigen
  - Abhängigkeit: SQLite muss vorher implementiert sein

### Statistiken
- [ ] **Statistik-Dashboard** – Diagramme mit Chart.js: Lernfortschritt über Zeit, Trefferquote je Thema `[Mittel]`
- [ ] **Schwächste Karten** – Liste der am häufigsten falsch beantworteten Karten je Set `[Klein]`

### Offline & Mobile
- [ ] **PWA / Offline-Modus** – Service Worker + App-Manifest, App auf Startbildschirm installierbar `[Mittel]`

---

## Phase 3 – Längerfristig, hohe Komplexität

Erfordert abgeschlossene Phase 2. Größere Architekturentscheidungen.

### KI-Fragengenerierung

**Empfehlung: Ollama (lokal) als primäre Option**
- Datenschutz (kein Daten-Upload an externe Server) – wichtig im Schulkontext
- Keine laufenden API-Kosten
- Modelle: `llama3`, `mistral` oder `phi3` je nach Hardware
- Claude API als Alternative/Fallback konfigurierbar

- [ ] **Verzeichnis-Scanner** – Textdateien (TXT, PDF, MD) aus Ordner einlesen `[Mittel]`
- [ ] **Ollama-Integration** – REST-Aufruf an lokale Ollama-Instanz, Prompt-Template für Fragen `[Groß]`
- [ ] **Generierungs-Vorschau** – Generierte Karten vor dem Speichern anzeigen und bearbeiten `[Mittel]`
- [ ] **Ordnername = Themengebiet** – Verzeichnisname wird automatisch als `title` übernommen `[Klein]`
- [ ] **Claude API als Fallback** – Konfigurierbar über `.env`, wenn kein Ollama verfügbar `[Mittel]`

### Klassenraum-Modus
- [ ] **Lehrkraft-Ansicht** – Übersicht über Lernfortschritt aller Schüler je Themengebiet `[Groß]`
- [ ] **Klassen-Code** – Einfacher Code (kein Passwort) um einer Klasse/Gruppe beizutreten `[Mittel]`
- [ ] **Aufgaben stellen** – Lehrkraft kann bestimmte Sets als „Hausaufgabe" markieren `[Mittel]`

### Weitere Lernmodi
- [ ] **Matching-Modus** – Fragen und Antworten per Drag & Drop zuordnen `[Mittel]`
- [ ] **Blitz-Modus** – Zeitlimit pro Karte, Punkte für schnelle Antworten `[Klein]`

### Gamification
- [ ] **XP-System** – Punkte pro richtiger Antwort, Streak-Anzeige `[Mittel]`
- [ ] **Badges** – Auszeichnungen (z.B. „10 Karten in Folge", „Set abgeschlossen") `[Mittel]`

---

## Abhängigkeiten zwischen den Phasen

```
Phase 1                    Phase 2                    Phase 3
-----------                -----------                -----------
Karteneditor           --> SQLite-DB              --> Ollama-KI
Multiple-Choice        --> Benutzerverwaltung     --> Klassenraum-Modus
Shuffle/Zufallsmodus   --> Spaced Repetition      --> Gamification
XLSX-Import            --> Statistik-Dashboard    --> Matching-Modus
Dark Mode              --> PWA/Offline
```

Spaced Repetition (Phase 2) **setzt SQLite voraus** – daher SQLite als ersten Task in Phase 2 beginnen.
KI-Generierung (Phase 3) ist unabhängig von Benutzerverwaltung, kann parallel gestartet werden.

---

## Legende

- `[Klein]` – Wenige Stunden, isolierte Änderung
- `[Mittel]` – Mehrere Tage, mehrere Dateien betroffen
- `[Groß]` – Komplexe Änderung, ggf. Architekturanpassung nötig
