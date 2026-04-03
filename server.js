const express  = require('express');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');
const multer   = require('multer');
const { parse }= require('csv-parse/sync');
const xlsx     = require('xlsx');
const { db, sm2Update } = require('./db');

const app      = express();
const PORT     = 3004;
const DATA_DIR = path.join(__dirname, 'data');
const STATS_DIR = path.join(DATA_DIR, '.stats');
const SET_EXTENSIONS = new Set(['.json', '.csv']);
const UPLOAD_EXTENSIONS = new Set(['.json', '.csv', '.xlsx']);
const DEFAULT_SET_COLOR = '#6366F1';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DATA_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(path.basename(file.originalname || '')).toLowerCase();
    if (!UPLOAD_EXTENSIONS.has(ext)) return cb(new Error('Nur JSON, CSV und XLSX Dateien erlaubt'));
    cb(null, `.upload-${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ext = path.extname(path.basename(file.originalname || '')).toLowerCase();
  if (UPLOAD_EXTENSIONS.has(ext)) cb(null, true);
  else cb(new Error('Nur JSON, CSV und XLSX Dateien erlaubt'));
}});

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugifyNamePart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function titleToFilename(title) {
  return `${slugifyNamePart(title) || 'set'}.json`;
}

function sanitizeSetFilename(name, allowedExtensions = SET_EXTENSIONS) {
  const input = String(name || '').trim();
  const base = path.basename(input);
  if (!base || base !== input) throw new Error('Ungültiger Dateiname');

  const ext = path.extname(base).toLowerCase();
  if (!allowedExtensions.has(ext)) throw new Error('Ungültige Dateiendung');

  const stem = slugifyNamePart(path.basename(base, ext));
  if (!stem) throw new Error('Ungültiger Dateiname');

  return `${stem}${ext}`;
}

function resolveSetPath(name, allowedExtensions = SET_EXTENSIONS) {
  return path.join(DATA_DIR, sanitizeSetFilename(name, allowedExtensions));
}

function resolveStatsPath(name) {
  return path.join(STATS_DIR, `${sanitizeSetFilename(name)}.json`);
}

function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  let title = '', description = '', color = DEFAULT_SET_COLOR, dataStart = 0;
  let subject = '', topic = '', grade = '', language = 'de', audience = '', tags = '', schemaVersion = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('title,'))       { title       = line.replace('title,','').trim();       dataStart = i+1; }
    else if (line.startsWith('description,')) { description = line.replace('description,','').trim(); dataStart = i+1; }
    else if (line.startsWith('color,'))  { color       = line.replace('color,','').trim();       dataStart = i+1; }
    else if (line.startsWith('subject,')) { subject = line.replace('subject,','').trim(); dataStart = i+1; }
    else if (line.startsWith('topic,')) { topic = line.replace('topic,','').trim(); dataStart = i+1; }
    else if (line.startsWith('grade,')) { grade = line.replace('grade,','').trim(); dataStart = i+1; }
    else if (line.startsWith('language,')) { language = line.replace('language,','').trim(); dataStart = i+1; }
    else if (line.startsWith('audience,')) { audience = line.replace('audience,','').trim(); dataStart = i+1; }
    else if (line.startsWith('tags,')) { tags = line.replace('tags,','').trim(); dataStart = i+1; }
    else if (line.startsWith('schemaVersion,')) { schemaVersion = line.replace('schemaVersion,','').trim(); dataStart = i+1; }
    else if (line.toLowerCase().startsWith('question,')) { dataStart = i+1; break; }
  }
  const csvBody = lines.slice(dataStart).join('\n');
  let rows = [];
  try { rows = parse(csvBody, { skip_empty_lines:true, relax_quotes:true, trim:true }); }
  catch(e) { rows = csvBody.split('\n').map(l => l.split(',')); }
  const cards = rows.map((row,idx) => ({
    id: idx+1, question:(row[0]||'').trim(), answer:(row[1]||'').trim(),
    explanation:(row[2]||'').trim()||null, quality:null
  })).filter(c => c.question && c.answer);
  return normalizeSetMetadata({
    title: title||'Unbekanntes Thema',
    description,
    color,
    subject,
    topic,
    grade,
    language,
    audience,
    tags,
    schemaVersion,
    cards
  });
}

function parseXlsx(buffer) {
  const wb = xlsx.read(buffer, { type:'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header:1, defval:'' });
  let title = wb.SheetNames[0]||'Unbekanntes Thema', description='', color=DEFAULT_SET_COLOR, dataStart=0;
  let subject = '', topic = '', grade = '', language = 'de', audience = '', tags = '', schemaVersion = '';
  for (let i=0; i<rows.length; i++) {
    const key = String(rows[i][0]||'').toLowerCase().trim();
    if (key==='title')       { title       = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='description') { description = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='color')  { color       = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='subject') { subject = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='topic') { topic = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='grade') { grade = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='language') { language = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='audience') { audience = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='tags') { tags = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='schemaversion') { schemaVersion = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='question') { dataStart=i+1; break; }
  }
  const cards = rows.slice(dataStart)
    .filter(r => (r[0]||'').toString().trim() && (r[1]||'').toString().trim())
    .map((r,idx) => ({
      id:idx+1, question:String(r[0]||'').trim(), answer:String(r[1]||'').trim(),
      explanation:String(r[2]||'').trim()||null, quality:null
    }));
  return normalizeSetMetadata({
    title,
    description,
    color,
    subject,
    topic,
    grade,
    language,
    audience,
    tags,
    schemaVersion,
    cards
  });
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(tag => String(tag).trim()).filter(Boolean);
  return String(value || '')
    .split(/[|;,]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

function normalizeSetMetadata(data = {}) {
  return {
    schemaVersion: Number(data.schemaVersion) || 2,
    title: String(data.title || '').trim(),
    description: String(data.description || '').trim(),
    color: String(data.color || DEFAULT_SET_COLOR).trim() || DEFAULT_SET_COLOR,
    subject: String(data.subject || '').trim(),
    topic: String(data.topic || '').trim(),
    grade: String(data.grade || '').trim(),
    language: String(data.language || 'de').trim() || 'de',
    audience: String(data.audience || '').trim(),
    tags: normalizeTags(data.tags),
    cards: Array.isArray(data.cards) ? data.cards : []
  };
}

function validateCardSet(data) {
  if (!data || typeof data!=='object')       return 'Ungültiges Format';
  const normalized = normalizeSetMetadata(data);
  if (!normalized.title || !normalized.title.trim()) return 'Kein Titel (title) gefunden';
  if (!Array.isArray(normalized.cards))      return 'Keine Karten (cards) gefunden';
  if (!normalized.cards.length)              return 'Mindestens eine Karte erforderlich';
  for (const [i,c] of normalized.cards.entries())
    if (!c.question||!c.answer) return `Karte ${i+1}: question und answer sind Pflichtfelder`;
  return null;
}

// ─── Card Sets ───────────────────────────────────────────────────────────────

app.get('/api/sets', (req, res) => {
  const sets = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.match(/\.(json|csv)$/i)) continue;
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, file),'utf8');
      const data = file.endsWith('.json') ? normalizeSetMetadata(JSON.parse(content)) : parseCsv(content);
      sets.push({ id:file, title:data.title, description:data.description||'',
        color:data.color||DEFAULT_SET_COLOR, cardCount:data.cards?.length||0, file,
        subject:data.subject||'', topic:data.topic||'', grade:data.grade||'', language:data.language||'de',
        audience:data.audience||'', tags:data.tags||[], schemaVersion:data.schemaVersion||2 });
    } catch(e) { console.error(`Error reading ${file}:`, e.message); }
  }
  sets.sort((a,b) => a.title.localeCompare(b.title,'de'));
  res.json(sets);
});

app.get('/api/sets/:file', (req, res) => {
  let fp;
  try { fp = resolveSetPath(req.params.file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Nicht gefunden' });
  try {
    const content = fs.readFileSync(fp,'utf8');
    res.json(fp.endsWith('.json') ? normalizeSetMetadata(JSON.parse(content)) : parseCsv(content));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/sets/:file/download', (req, res) => {
  let fp;
  try { fp = resolveSetPath(req.params.file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Nicht gefunden' });
  res.download(fp, path.basename(fp));
});

app.post('/api/sets', (req, res) => {
  const err = validateCardSet(req.body);
  if (err) return res.status(400).json({ error:err });
  const normalized = normalizeSetMetadata(req.body);
  const filename = titleToFilename(normalized.title);
  const fp = path.join(DATA_DIR, filename);
  if (fs.existsSync(fp)) return res.status(409).json({ error:'Ein Set mit diesem Titel existiert bereits', file:filename });
  normalized.cards.forEach((c,i) => { c.id = i+1; });
  fs.writeFileSync(fp, JSON.stringify(normalized, null, 2));
  res.json({ success:true, file:filename });
});

app.put('/api/sets/:file', (req, res) => {
  let fp;
  try { fp = resolveSetPath(req.params.file, new Set(['.json'])); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fp.endsWith('.json'))
    return res.status(400).json({ error:'Nur JSON-Dateien können bearbeitet werden' });
  const err = validateCardSet(req.body);
  if (err) return res.status(400).json({ error:err });
  const normalized = normalizeSetMetadata(req.body);
  normalized.cards.forEach((c,i) => { c.id = i+1; });
  fs.writeFileSync(fp, JSON.stringify(normalized, null, 2));
  res.json({ success:true });
});

app.patch('/api/sets/:file/cards/:id/quality', (req, res) => {
  let fp;
  try { fp = resolveSetPath(req.params.file, new Set(['.json'])); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fp.endsWith('.json')) return res.status(400).json({ error:'Nur für JSON-Dateien' });
  if (!fs.existsSync(fp))   return res.status(404).json({ error:'Nicht gefunden' });
  try {
    const data = JSON.parse(fs.readFileSync(fp,'utf8'));
    const card = data.cards.find(c => c.id == req.params.id);
    if (!card) return res.status(404).json({ error:'Karte nicht gefunden' });
    card.quality = req.body.quality;
    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error:'Keine Datei hochgeladen' });
  const uploadedPath = path.join(DATA_DIR, req.file.filename);
  const originalExt = path.extname(path.basename(req.file.originalname || '')).toLowerCase();
  try {
    let data;
    if (originalExt === '.json') {
      data = JSON.parse(fs.readFileSync(uploadedPath,'utf8'));
    } else if (originalExt === '.xlsx') {
      data = parseXlsx(fs.readFileSync(uploadedPath));
      const err2 = validateCardSet(data);
      if (err2) {
        fs.unlinkSync(uploadedPath);
        return res.status(400).json({ error:err2 });
      }
      const jsonFile = titleToFilename(data.title || path.basename(req.file.originalname, originalExt));
      const targetPath = resolveSetPath(jsonFile, new Set(['.json']));
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(uploadedPath);
        return res.status(409).json({ error:'Ein Set mit diesem Dateinamen existiert bereits', file:jsonFile });
      }
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
      fs.unlinkSync(uploadedPath);
      return res.json({ success:true, file:jsonFile });
    } else {
      data = parseCsv(fs.readFileSync(uploadedPath,'utf8'));
    }
    const err = validateCardSet(data);
    if (err) { fs.unlinkSync(uploadedPath); return res.status(400).json({ error:err }); }
    const finalName = sanitizeSetFilename(req.file.originalname, new Set([originalExt]));
    const finalPath = resolveSetPath(finalName, new Set([originalExt]));
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(uploadedPath);
      return res.status(409).json({ error:'Ein Set mit diesem Dateinamen existiert bereits', file:finalName });
    }
    fs.renameSync(uploadedPath, finalPath);
    res.json({ success:true, file:finalName });
  } catch(e) {
    try { fs.unlinkSync(uploadedPath); } catch {}
    res.status(400).json({ error:'Datei konnte nicht verarbeitet werden: '+e.message });
  }
});

app.delete('/api/sets/:file', (req, res) => {
  let fp;
  try { fp = resolveSetPath(req.params.file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Nicht gefunden' });
  fs.unlinkSync(fp);
  res.json({ success:true });
});

// Legacy stats (Rückwärtskompatibilität für Gast-Sitzungen)
app.get('/api/sets/:file/stats', (req, res) => {
  let sf;
  try { sf = resolveStatsPath(req.params.file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fs.existsSync(sf)) return res.json({ sessions:[] });
  res.json(JSON.parse(fs.readFileSync(sf,'utf8')));
});

app.post('/api/sets/:file/stats', (req, res) => {
  if (!fs.existsSync(STATS_DIR)) fs.mkdirSync(STATS_DIR);
  let sf;
  try { sf = resolveStatsPath(req.params.file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  let stats = { sessions:[] };
  if (fs.existsSync(sf)) stats = JSON.parse(fs.readFileSync(sf,'utf8'));
  stats.sessions.push({ ...req.body, date: new Date().toISOString() });
  if (stats.sessions.length > 20) stats.sessions = stats.sessions.slice(-20);
  fs.writeFileSync(sf, JSON.stringify(stats, null, 2));
  res.json({ success:true });
});

// ─── Users ───────────────────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY name').all());
});

app.post('/api/users', (req, res) => {
  const { name, avatar } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:'Name erforderlich' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, name, avatar) VALUES (?,?,?)').run(id, name.trim(), avatar||'🎓');
  res.json({ success:true, id, name:name.trim(), avatar:avatar||'🎓' });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM card_progress WHERE user_id=?').run(id);
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ success:true });
});

// ─── Due cards (SM-2) ────────────────────────────────────────────────────────

// Due counts for all sets at once
app.get('/api/users/:userId/due', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const rows  = db.prepare(`
    SELECT set_file, COUNT(*) as count
    FROM card_progress
    WHERE user_id=? AND next_review<=?
    GROUP BY set_file
  `).all(req.params.userId, today);
  const result = {};
  rows.forEach(r => { result[r.set_file] = r.count; });
  res.json(result);
});

// Due card IDs for one set
app.get('/api/users/:userId/sets/:file/due', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const rows  = db.prepare(`
    SELECT card_id FROM card_progress
    WHERE user_id=? AND set_file=? AND next_review<=?
  `).all(req.params.userId, req.params.file, today);
  res.json({ due: rows.map(r => r.card_id), count: rows.length });
});

// ─── Sessions + SM-2 update ──────────────────────────────────────────────────

app.post('/api/users/:userId/sets/:file/session', (req, res) => {
  const { userId } = req.params;
  const { file }   = req.params;
  const { mode, right, wrong, skipped, total, pct, duration, answers } = req.body;
  let fp;
  try { fp = resolveSetPath(file); }
  catch (e) { return res.status(400).json({ error:e.message }); }
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Set nicht gefunden' });

  let setData;
  try {
    const content = fs.readFileSync(fp, 'utf8');
    setData = fp.endsWith('.json') ? JSON.parse(content) : parseCsv(content);
  } catch (e) {
    return res.status(500).json({ error:'Set konnte nicht geladen werden' });
  }

  const validCardIds = new Set((setData.cards || []).map(card => Number(card.id)));
  const normalizedAnswers = [];
  if (Array.isArray(answers)) {
    const deduped = new Map();
    for (const entry of answers) {
      const cardId = Number(entry?.cardId);
      if (!Number.isInteger(cardId) || !validCardIds.has(cardId)) {
        return res.status(400).json({ error:'Ungültige cardId in answers' });
      }
      deduped.set(cardId, { cardId, correct: !!entry.correct });
    }
    normalizedAnswers.push(...deduped.values());
  }

  // Save session
  db.prepare(`
    INSERT INTO sessions (user_id, set_file, mode, right_count, wrong_count, skipped, total, pct, duration)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(userId, file, mode||'flip', right||0, wrong||0, skipped||0, total||0, pct||0, duration||0);

  // SM-2 update per card
  if (normalizedAnswers.length) {
    const doUpdate = db.transaction(() => {
      for (const { cardId, correct } of normalizedAnswers) {
        const quality = correct ? 4 : 1;
        const existing = db.prepare(`
          SELECT * FROM card_progress WHERE user_id=? AND set_file=? AND card_id=?
        `).get(userId, file, cardId);

        if (existing) {
          const u = sm2Update(existing.ease_factor, existing.interval_days, existing.repetitions, quality);
          db.prepare(`
            UPDATE card_progress SET
              ease_factor=?, interval_days=?, repetitions=?, next_review=?, last_review=date('now'),
              total_correct=total_correct+?, total_wrong=total_wrong+?
            WHERE user_id=? AND set_file=? AND card_id=?
          `).run(u.ease_factor, u.interval_days, u.repetitions, u.next_review,
                 correct?1:0, correct?0:1, userId, file, cardId);
        } else {
          const u = sm2Update(2.5, 0, 0, quality);
          db.prepare(`
            INSERT INTO card_progress
              (user_id, set_file, card_id, ease_factor, interval_days, repetitions, next_review, last_review, total_correct, total_wrong)
            VALUES (?,?,?,?,?,?,?,date('now'),?,?)
          `).run(userId, file, cardId, u.ease_factor, u.interval_days, u.repetitions, u.next_review,
                 correct?1:0, correct?0:1);
        }
      }
    });
    doUpdate();
  }

  res.json({ success:true });
});

// ─── User statistics ─────────────────────────────────────────────────────────

app.get('/api/users/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const sessions = db.prepare(`
    SELECT set_file, mode, right_count, wrong_count, total, pct, duration, created_at
    FROM sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 60
  `).all(userId);

  const today = new Date().toISOString().split('T')[0];
  const progress = db.prepare(`
    SELECT set_file,
      COUNT(*)                                            AS total_cards,
      SUM(total_correct)                                  AS total_correct,
      SUM(total_wrong)                                    AS total_wrong,
      COUNT(CASE WHEN next_review <= ? THEN 1 END)        AS due_today
    FROM card_progress WHERE user_id=? GROUP BY set_file
  `).all(today, userId);

  res.json({ sessions, progress });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🎴 Lernkarten-App läuft auf http://localhost:${PORT}`);
});
