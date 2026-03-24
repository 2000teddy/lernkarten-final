# TODO – Geplante Erweiterungen und Verbesserungen

Offene Aufgaben, Ideen und Verbesserungsvorschläge. Abgeschlossenes wird in `CHANGES.md` übertragen.

---

## Hohe Priorität

### KI-gestützte Fragengenerierung
- [ ] Verzeichnis-Scanner: Textdateien aus einem Ordner einlesen
- [ ] Integration eines LLM (z.B. Ollama lokal oder OpenAI/Claude API) zur automatischen Fragen-/Antworterstellung
- [ ] Ordnername wird automatisch als Themengebiet übernommen
- [ ] Generierte Fragen als JSON in `data/` speichern (zur Überprüfung vor Verwendung)

### Lernfortschritt / Wiederholungsalgorithmus
- [ ] Spaced-Repetition-Algorithmus (z.B. SM-2) implementieren
- [ ] Karten, die öfter falsch beantwortet wurden, häufiger anzeigen
- [ ] Langzeit-Lernfortschritt pro Karte und Set speichern (nicht nur Sitzungsstatistik)

### Benutzerverwaltung (Multi-User)
- [ ] Einfache Benutzerprofile (Name/Avatar, kein Passwort nötig für Schulkontext)
- [ ] Getrennter Lernfortschritt pro Benutzer
- [ ] Klassenmodus: Lehrkraft sieht Fortschritt aller Schüler

---

## Mittlere Priorität

### Import-Erweiterungen
- [ ] XLSX/Excel-Import (via `xlsx`-Paket)
- [ ] Markdown-Import (Überschrift = Thema, Tabellen = Frage/Antwort)
- [ ] Import aus Anki-Format (`.apkg`)
- [ ] Bulk-Import: ZIP-Archiv mit mehreren Dateien

### Kartenanzeige
- [ ] Bilder in Fragen und Antworten unterstützen (Base64 in JSON oder Datei-Referenz)
- [ ] Mathematische Formeln via MathJax oder KaTeX rendern
- [ ] Code-Blöcke mit Syntax-Highlighting (für Programmier-Lernkarten)
- [ ] Audio-Unterstützung für Fremdsprachen-Aussprache

### Lernmodi
- [ ] **Schreibmodus**: Antwort eintippen statt nur aufdecken
- [ ] **Multiple-Choice-Modus**: 4 Antwortoptionen (3 falsche werden automatisch aus dem Set gewählt)
- [ ] **Matching-Modus**: Fragen und Antworten per Drag & Drop zuordnen
- [ ] **Blitz-Modus**: Zeitlimit pro Karte

### Karteneditor
- [ ] Karten direkt in der App erstellen und bearbeiten (ohne externe JSON-Datei)
- [ ] Karten innerhalb eines Sets umsortieren (Drag & Drop)
- [ ] Einzelne Karten aus einem Set löschen

---

## Niedrige Priorität / Ideen

### Gamification
- [ ] Punkte-/Erfahrungssystem (XP pro richtiger Antwort)
- [ ] Badges/Auszeichnungen (z.B. „10 Karten in Folge richtig")
- [ ] Streak-Anzeige (tägliches Lernen)
- [ ] Bestenliste (Leaderboard) für Klassenraum-Kontext

### Statistiken & Auswertung
- [ ] Detaillierter Statistik-Bereich mit Diagrammen (Chart.js)
- [ ] Exportfunktion für Lernstatistiken als CSV/PDF
- [ ] Schwächste Karten als separate Übungsliste anzeigen

### Technisches
- [ ] `.gitignore` für `data/.stats/` und `node_modules/` (kein Upload sensibler Stats)
- [ ] Docker-Container / `docker-compose.yml` für einfachen Betrieb
- [ ] Offline-Modus via PWA (Service Worker, App-Manifest)
- [ ] Dark Mode
- [ ] Mehrsprachige Oberfläche (DE/EN)
- [ ] Automatische Backups der `data/`-Dateien

### Qualitätssicherung
- [ ] Unit-Tests für CSV-Parser und API-Endpunkte (Jest oder Mocha)
- [ ] Input-Validierung für Upload (maximale Dateigröße, Schema-Prüfung)
- [ ] Fehler-Handling verbessern (benutzerfreundliche Fehlermeldungen im Frontend)
