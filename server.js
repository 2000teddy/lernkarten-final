const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const multer   = require('multer');
const { parse }= require('csv-parse/sync');
const xlsx     = require('xlsx');
const { db, sm2Update } = require('./db');

const app      = express();
const PORT     = 3004;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DATA_DIR),
  filename:    (req, file, cb) => cb(null, sanitizeUploadFilename(file.originalname))
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.json','.csv','.xlsx'].includes(ext)) cb(null, true);
  else cb(new Error('Nur JSON, CSV und XLSX Dateien erlaubt'));
}});

// ─── Helpers ────────────────────────────────────────────────────────────────

function titleToFilename(title) {
  return title.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') + '.json';
}

function sanitizeUploadFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
  return `${base || 'upload'}${ext}`;
}

function resolveDataPath(file) {
  const normalizedFile = path.basename(file);
  if (!normalizedFile || normalizedFile !== file) return null;
  const resolved = path.resolve(DATA_DIR, normalizedFile);
  if (!resolved.startsWith(DATA_DIR + path.sep)) return null;
  return resolved;
}

function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  let title = '', description = '', color = '#6366F1', dataStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('title,'))       { title       = line.replace('title,','').trim();       dataStart = i+1; }
    else if (line.startsWith('description,')) { description = line.replace('description,','').trim(); dataStart = i+1; }
    else if (line.startsWith('color,'))  { color       = line.replace('color,','').trim();       dataStart = i+1; }
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
  return { title: title||'Unbekanntes Thema', description, color, cards };
}

function parseXlsx(buffer) {
  const wb = xlsx.read(buffer, { type:'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header:1, defval:'' });
  let title = wb.SheetNames[0]||'Unbekanntes Thema', description='', color='#6366F1', dataStart=0;
  for (let i=0; i<rows.length; i++) {
    const key = String(rows[i][0]||'').toLowerCase().trim();
    if (key==='title')       { title       = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='description') { description = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='color')  { color       = String(rows[i][1]||'').trim(); dataStart=i+1; }
    else if (key==='question') { dataStart=i+1; break; }
  }
  const cards = rows.slice(dataStart)
    .filter(r => (r[0]||'').toString().trim() && (r[1]||'').toString().trim())
    .map((r,idx) => ({
      id:idx+1, question:String(r[0]||'').trim(), answer:String(r[1]||'').trim(),
      explanation:String(r[2]||'').trim()||null, quality:null
    }));
  return { title, description, color, cards };
}

function validateCardSet(data) {
  if (!data || typeof data!=='object')       return 'Ungültiges Format';
  if (!data.title || !data.title.trim())     return 'Kein Titel (title) gefunden';
  if (!Array.isArray(data.cards))            return 'Keine Karten (cards) gefunden';
  if (!data.cards.length)                    return 'Mindestens eine Karte erforderlich';
  for (const [i,c] of data.cards.entries())
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
      const data = file.endsWith('.json') ? JSON.parse(content) : parseCsv(content);
      sets.push({ id:file, title:data.title, description:data.description||'',
        color:data.color||'#6366F1', cardCount:data.cards?.length||0, file });
    } catch(e) { console.error(`Error reading ${file}:`, e.message); }
  }
  sets.sort((a,b) => a.title.localeCompare(b.title,'de'));
  res.json(sets);
});

app.get('/api/sets/:file', (req, res) => {
  const fp = resolveDataPath(req.params.file);
  if (!fp) return res.status(400).json({ error:'Ungültiger Dateiname' });
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Nicht gefunden' });
  try {
    const content = fs.readFileSync(fp,'utf8');
    res.json(req.params.file.endsWith('.json') ? JSON.parse(content) : parseCsv(content));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/sets', (req, res) => {
  const err = validateCardSet(req.body);
  if (err) return res.status(400).json({ error:err });
  const filename = titleToFilename(req.body.title);
  const fp = path.join(DATA_DIR, filename);
  if (fs.existsSync(fp)) return res.status(409).json({ error:'Ein Set mit diesem Titel existiert bereits', file:filename });
  req.body.cards.forEach((c,i) => { c.id = i+1; });
  fs.writeFileSync(fp, JSON.stringify(req.body, null, 2));
  res.json({ success:true, file:filename });
});

app.put('/api/sets/:file', (req, res) => {
  if (!req.params.file.endsWith('.json'))
    return res.status(400).json({ error:'Nur JSON-Dateien können bearbeitet werden' });
  const fp = resolveDataPath(req.params.file);
  if (!fp) return res.status(400).json({ error:'Ungültiger Dateiname' });
  const err = validateCardSet(req.body);
  if (err) return res.status(400).json({ error:err });
  req.body.cards.forEach((c,i) => { c.id = i+1; });
  fs.writeFileSync(fp, JSON.stringify(req.body, null, 2));
  res.json({ success:true });
});

app.patch('/api/sets/:file/cards/:id/quality', (req, res) => {
  const fp = resolveDataPath(req.params.file);
  if (!fp) return res.status(400).json({ error:'Ungültiger Dateiname' });
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
  const uploadedPath = resolveDataPath(req.file.filename);
  if (!uploadedPath) return res.status(400).json({ error:'Ungültiger Dateiname' });
  const ext = path.extname(req.file.filename).toLowerCase();
  try {
    let data;
    if (ext==='.json') {
      data = JSON.parse(fs.readFileSync(uploadedPath,'utf8'));
    } else if (ext==='.xlsx') {
      data = parseXlsx(fs.readFileSync(uploadedPath));
      const jsonFile = titleToFilename(data.title || req.file.filename.replace('.xlsx',''));
      fs.writeFileSync(path.join(DATA_DIR, jsonFile), JSON.stringify(data, null, 2));
      fs.unlinkSync(uploadedPath);
      const err2 = validateCardSet(data);
      if (err2) { try { fs.unlinkSync(path.join(DATA_DIR, jsonFile)); } catch {} return res.status(400).json({ error:err2 }); }
      return res.json({ success:true, file:jsonFile });
    } else {
      data = parseCsv(fs.readFileSync(uploadedPath,'utf8'));
    }
    const err = validateCardSet(data);
    if (err) { fs.unlinkSync(uploadedPath); return res.status(400).json({ error:err }); }
    res.json({ success:true, file:req.file.filename });
  } catch(e) {
    try { fs.unlinkSync(uploadedPath); } catch {}
    res.status(400).json({ error:'Datei konnte nicht verarbeitet werden: '+e.message });
  }
});

app.delete('/api/sets/:file', (req, res) => {
  const fp = resolveDataPath(req.params.file);
  if (!fp) return res.status(400).json({ error:'Ungültiger Dateiname' });
  if (!fs.existsSync(fp)) return res.status(404).json({ error:'Nicht gefunden' });
  fs.unlinkSync(fp);
  res.json({ success:true });
});

// Legacy stats (Rückwärtskompatibilität für Gast-Sitzungen)
app.get('/api/sets/:file/stats', (req, res) => {
  const statsFile = path.basename(req.params.file) + '.json';
  if (statsFile !== req.params.file + '.json') return res.status(400).json({ error:'Ungültiger Dateiname' });
  const sf = path.join(DATA_DIR, '.stats', statsFile);
  if (!fs.existsSync(sf)) return res.json({ sessions:[] });
  res.json(JSON.parse(fs.readFileSync(sf,'utf8')));
});

app.post('/api/sets/:file/stats', (req, res) => {
  const statsDir = path.join(DATA_DIR, '.stats');
  if (!fs.existsSync(statsDir)) fs.mkdirSync(statsDir);
  const statsFile = path.basename(req.params.file) + '.json';
  if (statsFile !== req.params.file + '.json') return res.status(400).json({ error:'Ungültiger Dateiname' });
  const sf = path.join(statsDir, statsFile);
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

  // Save session
  db.prepare(`
    INSERT INTO sessions (user_id, set_file, mode, right_count, wrong_count, skipped, total, pct, duration)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(userId, file, mode||'flip', right||0, wrong||0, skipped||0, total||0, pct||0, duration||0);

  // SM-2 update per card
  if (Array.isArray(answers) && answers.length) {
    const doUpdate = db.transaction(() => {
      for (const { cardId, correct } of answers) {
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
