/* ====================================
   Lernkarten – SQLite Datenbankschicht
   Phase 2: Benutzer, SM-2, Statistiken
   ==================================== */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(path.join(DATA_DIR, 'lernkarten.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    avatar     TEXT NOT NULL DEFAULT '🎓',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS card_progress (
    user_id       TEXT    NOT NULL,
    set_file      TEXT    NOT NULL,
    card_id       INTEGER NOT NULL,
    ease_factor   REAL    DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions   INTEGER DEFAULT 0,
    next_review   TEXT    DEFAULT (date('now')),
    last_review   TEXT,
    total_correct INTEGER DEFAULT 0,
    total_wrong   INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, set_file, card_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT    NOT NULL,
    set_file    TEXT    NOT NULL,
    mode        TEXT    DEFAULT 'flip',
    right_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    skipped     INTEGER DEFAULT 0,
    total       INTEGER DEFAULT 0,
    pct         INTEGER DEFAULT 0,
    duration    INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now'))
  );
`);

/* -----------------------------------------------
   SM-2 Algorithmus
   quality: 4 = richtig, 1 = falsch
   ----------------------------------------------- */
function sm2Update(easeFactor, intervalDays, repetitions, quality) {
  let ef = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  let interval, reps;
  if (quality < 3) {
    interval = 1;
    reps = 0;
  } else {
    reps = repetitions + 1;
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else                        interval = Math.round(intervalDays * ef);
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    ease_factor:   ef,
    interval_days: interval,
    repetitions:   reps,
    next_review:   next.toISOString().split('T')[0]
  };
}

module.exports = { db, sm2Update };
