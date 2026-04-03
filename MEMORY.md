# MEMORY – Letzter Stand

## Arbeitsweise

- Vor Implementierungen zuerst `git pull` versuchen.
- Danach die vorhandenen Markdown-Dateien lesen: `AGENTS.md`, `README.md`, `CHANGES.md`, `TODO.md`, `MEMORY.md`.
- Nach Änderungen die Doku aktualisieren.
- Danach gezielt committen, ohne fremde Worktree-Änderungen ungeprüft mitzunehmen.

## Letzter relevanter Prompt

„Schaue mal ob du hier am Code noch etwas verbessern kannst. Also einen Codereview machen. Evtl. hilft die Pal und Gemini 3 pro, GLM, MiniMax und Kimi K2 dabei.“

## Zuletzt erledigt

- Codereview mit lokaler Prüfung und PAL-Gegenchecks durchgeführt.
- Frontend gegen Inline-Handler-/Quote-Injection gehärtet.
- Backend-Dateinamen und Set-Pfade validiert, Uploads mit Kollisionsschutz versehen.
- Session-API auf gültige `cardId`s des jeweiligen Sets eingeschränkt.
- Lernfluss gegen Mehrfachauslösung abgesichert.
- Statistik-Empty-State so angepasst, dass das Chart-Canvas erhalten bleibt.
- Verwaisten Worktree-Stand geprüft: fehlende Weiter-Button-Markup/Styles als sinnvoller Nachzug erkannt.
- Fünf neue HSU-Datensätze als plausible Inhalts-Erweiterung eingeordnet.
- `.gitignore` für SQLite- und Statistik-Laufzeitdateien ergänzt.

## Offene sinnvolle Nacharbeiten

- Manuellen Browser-Smoke-Test für Upload, Stats und Lernmodi ausführen.
- Prüfen, ob auch der Avatar-Picker mittelfristig ohne Inline-`onclick` vereinheitlicht werden soll.
- Offenen Einzelstand in `data/englisch-verben.json` bewusst entscheiden: Inhaltsänderung übernehmen oder verwerfen.
