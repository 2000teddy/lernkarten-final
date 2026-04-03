# TODO – Entwicklungsplan & Erweiterungen

Geplante Phasen, erarbeitet gemeinsam mit PAL MCP (Gemini 2.5 Pro), 2026-03-24.
Abgeschlossenes wird in `CHANGES.md` übertragen.

## Kurzfristige Nacharbeit

- [ ] Manuellen Browser-Smoke-Test für Upload-Kollision, Profilnamen mit Sonderzeichen, Stats-Empty-State und Mehrfachklicks auf Antwortaktionen durchführen `[Klein]`

## Nacht-Backlog – Ideen aus PAL, CLINK und Multi-Model-Brainstorm

Diese Roadmap wurde in dieser Runde mit PAL und Modellperspektiven von `gpt-5.4`, `gemini-3-pro-preview`, `claude-sonnet`, `deepseek`, `kimi-k2` und `glm` verdichtet.

### Bereits als Quick Wins umgesetzt

- [x] **Downloadbare Startvorlagen** – Statische JSON/CSV-Vorlagen für Vokabeln und Lehrkräfte im Upload-Dialog bereitstellen `[Klein]`
- [x] **Set-Download aus der Oberfläche** – Einzelne Fragensätze direkt herunterladen `[Klein]`
- [x] **Englische README** – `README.en.md` ergänzen und mit deutscher README verlinken `[Klein]`
- [x] **Metadaten-Grundlage im Schema** – Optionale Felder wie `subject`, `topic`, `grade`, `language`, `audience`, `tags`, `schemaVersion` einführen `[Mittel]`

### Priorität A – Nächste sinnvolle Schritte

- [ ] **Filter nach Fach, Thema, Klassenstufe und Sprache** – Set-Übersicht clientseitig und später serverseitig filterbar machen `[Mittel]`
- [ ] **Druckansicht / Print-Layout** – Karten oder ganze Sets auf A4 druckbar machen `[Klein]`
- [ ] **Schwächste Karten** – Häufig falsch beantwortete Karten in den Statistiken sichtbar machen `[Klein]`
- [ ] **CSV- und XLSX-Export** – Vorhandene Sets nicht nur herunterladen, sondern in mehreren Formaten exportieren `[Mittel]`
- [ ] **Import-Vorschau** – Vor dem endgültigen Speichern eine Vorschau der importierten Karten anzeigen `[Mittel]`

### Priorität B – Struktur und Schulalltag

- [ ] **Hierarchie in der Startansicht** – Gruppen wie `Klasse → Fach → Thema` visuell darstellen `[Mittel]`
- [ ] **Lehrplan-/Vorlagen-Bibliothek** – Kuratierte Vorlagen nach Fach, Klassenstufe und Bundesland sammeln `[Mittel]`
- [ ] **Lernpfade** – Mehrere Sets in feste Reihenfolgen bündeln, z.B. „Woche 1 Mathe Klasse 4“ `[Mittel]`
- [ ] **Remediation-Pakete** – Aus schwachen Karten automatisch Wiederholungs-Sets erzeugen `[Mittel]`
- [ ] **Template-Galerie** – Vorlagen direkt in der App ansehen und kopieren statt nur herunterladen `[Mittel]`

### Priorität C – Mehrsprachigkeit und Sprache lernen

- [ ] **UI-Mehrsprachigkeit (DE/EN zuerst)** – Alle festen UI-Texte in eine kleine i18n-Struktur auslagern `[Mittel]`
- [ ] **Weitere Sprachen für die Oberfläche** – z.B. Französisch, Türkisch, Spanisch `[Klein]`
- [ ] **Text-to-Speech** – Wörter oder Antworten über die Browser-Sprachausgabe vorlesen `[Klein]`
- [ ] **Audio je Karte** – Eigene Aussprache oder Lehrer-Audio an Karten hängen `[Mittel]`
- [ ] **Mehrsprachige Kartenpaare** – Fragen/Antworten mit expliziten Sprachfeldern erweitern `[Mittel]`

### Priorität D – Kreative, aber realistische Ideen

- [ ] **Karte des Tages** – Jeden Tag eine zufällige oder schwache Karte auf der Startseite zeigen `[Klein]`
- [ ] **Schnellerfassung / Quick Add** – Viele Karten aus einfachem Textblock in einem Schritt erzeugen `[Klein]`
- [ ] **Qualitätsbericht für Datensätze** – Leere Erklärungen, Dubletten, lange Antworten oder fehlende Metadaten melden `[Mittel]`
- [ ] **Bildunterstützung** – Bilder pro Karte für Sachunterricht, Biologie oder Geografie `[Mittel]`
- [ ] **PDF-Export** – Sets als druckfertiges PDF ausgeben `[Mittel]`

### Priorität E – Größere Ausbaustufe

- [ ] **Klassenmodus light** – Sets über einfachen Klassen-Code teilen `[Groß]`
- [ ] **Lehrkraft-Dashboard** – Überblick über Fortschritte mehrerer Schülerprofile `[Groß]`
- [ ] **Aufgabensets / Hausaufgaben** – Bestimmte Sets für Schüler markieren `[Groß]`
- [ ] **Bulk-Export / Paket-Export** – Mehrere Sets oder ganze Themenbereiche gemeinsam exportieren `[Mittel]`
- [ ] **Anki-kompatibler Export** – Brücke zu externen Lernsystemen `[Groß]`

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
- [x] **SQLite-Integration** (`better-sqlite3`) – Benutzerfortschritt, SM-2-Daten und Statistiken in DB statt JSON-Dateien `[Groß]`
  - Ersetzt `data/.stats/` für Statistiken
  - Neue Tabellen: `users`, `progress`, `sessions`

### Benutzerverwaltung (kindgerecht, kein Passwort)
- [x] **Benutzerprofile** – Name + Avatar (Emoji-Auswahl), keine Registrierung/kein Passwort `[Mittel]`
  - Auswahl beim ersten Start, gespeichert in `localStorage` (Gerätezuordnung)
  - Serverseitig via UUID identifiziert
  - Mehrere Profile auf einem Gerät möglich (z.B. für Geschwisterkinder)
- [x] **Getrennter Lernfortschritt** je Benutzerprofil `[Mittel]`

### Lernalgorithmus
- [x] **Spaced-Repetition (SM-2)** – Karten die öfter falsch beantwortet wurden, öfter anzeigen `[Mittel]`
  - Intervall-Berechnung pro Karte und Benutzer
  - „Fällige Karten heute" als Startansicht anzeigen
  - Abhängigkeit: SQLite muss vorher implementiert sein

### Statistiken
- [x] **Statistik-Dashboard** – Diagramme mit Chart.js: Lernfortschritt über Zeit, Trefferquote je Thema `[Mittel]`
- [ ] **Schwächste Karten** – Liste der am häufigsten falsch beantworteten Karten je Set `[Klein]`

### Offline & Mobile
- [x] **PWA / Offline-Modus** – Service Worker + App-Manifest, App auf Startbildschirm installierbar `[Mittel]`

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
