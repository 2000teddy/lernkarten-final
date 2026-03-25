const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');

const app = express();
const PORT = 3004;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DATA_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.json', '.csv', '.xlsx'].includes(ext)) cb(null, true);
  else cb(new Error('Nur JSON, CSV und XLSX Dateien erlaubt'));
}});

// Helper: sanitize title to filename
function titleToFilename(title) {
  return title.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.json';
}

// Helper: escape HTML
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Helper: parse CSV to card set
function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  let title = '', description = '', color = '#6366F1';
  let dataStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('title,')) { title = line.replace('title,', '').trim(); dataStart = i + 1; }
    else if (line.startsWith('description,')) { description = line.replace('description,', '').trim(); dataStart = i + 1; }
    else if (line.startsWith('color,')) { color = line.replace('color,', '').trim(); dataStart = i + 1; }
    else if (line.toLowerCase().startsWith('question,')) { dataStart = i + 1; break; }
  }

  const csvBody = lines.slice(dataStart).join('\n');
  let rows = [];
  try {
    rows = parse(csvBody, { skip_empty_lines: true, relax_quotes: true, trim: true });
  } catch(e) {
    rows = csvBody.split('\n').map(l => l.split(','));
  }

  const cards = rows.map((row, idx) => ({
    id: idx + 1,
    question: (row[0] || '').trim(),
    answer: (row[1] || '').trim(),
    explanation: (row[2] || '').trim() || null,
    quality: null
  })).filter(c => c.question && c.answer);

  return { title: title || 'Unbekanntes Thema', description, color, cards };
}

// Helper: parse XLSX to card set
function parseXlsx(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let title = sheetName || 'Unbekanntes Thema';
  let description = '';
  let color = '#6366F1';
  let dataStart = 0;

  for (let i = 0; i < rows.length; i++) {
    const key = String(rows[i][0] || '').toLowerCase().trim();
    if (key === 'title') { title = String(rows[i][1] || '').trim(); dataStart = i + 1; }
    else if (key === 'description') { description = String(rows[i][1] || '').trim(); dataStart = i + 1; }
    else if (key === 'color') { color = String(rows[i][1] || '').trim(); dataStart = i + 1; }
    else if (key === 'question') { dataStart = i + 1; break; }
  }

  const cards = rows.slice(dataStart)
    .filter(row => (row[0] || '').toString().trim() && (row[1] || '').toString().trim())
    .map((row, idx) => ({
      id: idx + 1,
      question: String(row[0] || '').trim(),
      answer: String(row[1] || '').trim(),
      explanation: String(row[2] || '').trim() || null,
      quality: null
    }));

  return { title, description, color, cards };
}

// Helper: validate card set structure
function validateCardSet(data) {
  if (!data || typeof data !== 'object') return 'Ungültiges Format – kein Objekt';
  if (!data.title || typeof data.title !== 'string' || !data.title.trim())
    return 'Kein Titel (title) gefunden';
  if (!Array.isArray(data.cards)) return 'Keine Karten (cards Array) gefunden';
  if (data.cards.length === 0) return 'Mindestens eine Karte erforderlich';
  for (const [i, card] of data.cards.entries()) {
    if (!card.question || !card.answer)
      return `Karte ${i + 1}: question und answer sind Pflichtfelder`;
  }
  return null;
}

// API: List all card sets
app.get('/api/sets', (req, res) => {
  const sets = [];
  const files = fs.readdirSync(DATA_DIR);
  for (const file of files) {
    if (!file.match(/\.(json|csv)$/i)) continue;
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      const data = file.endsWith('.json') ? JSON.parse(content) : parseCsv(content);
      sets.push({
        id: file, title: data.title, description: data.description || '',
        color: data.color || '#6366F1', cardCount: data.cards ? data.cards.length : 0, file
      });
    } catch (e) { console.error(`Error reading ${file}:`, e.message); }
  }
  sets.sort((a, b) => a.title.localeCompare(b.title, 'de'));
  res.json(sets);
});

// API: Get specific card set
app.get('/api/sets/:file', (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Nicht gefunden' });
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = req.params.file.endsWith('.json') ? JSON.parse(content) : parseCsv(content);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Create new card set (editor)
app.post('/api/sets', (req, res) => {
  const data = req.body;
  const err = validateCardSet(data);
  if (err) return res.status(400).json({ error: err });

  const filename = titleToFilename(data.title);
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath))
    return res.status(409).json({ error: 'Ein Set mit diesem Titel existiert bereits', file: filename });

  data.cards.forEach((c, i) => { c.id = i + 1; });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.json({ success: true, file: filename });
});

// API: Update entire card set (editor)
app.put('/api/sets/:file', (req, res) => {
  if (!req.params.file.endsWith('.json'))
    return res.status(400).json({ error: 'Nur JSON-Dateien können bearbeitet werden' });
  const err = validateCardSet(req.body);
  if (err) return res.status(400).json({ error: err });

  const filePath = path.join(DATA_DIR, req.params.file);
  req.body.cards.forEach((c, i) => { c.id = i + 1; });
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// API: Update card quality rating
app.patch('/api/sets/:file/cards/:id/quality', (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.file);
  if (!filePath.endsWith('.json')) return res.status(400).json({ error: 'Nur für JSON-Dateien' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Nicht gefunden' });
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const card = data.cards.find(c => c.id == req.params.id);
    if (!card) return res.status(404).json({ error: 'Karte nicht gefunden' });
    card.quality = req.body.quality;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Upload new card set
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });

  const uploadedPath = path.join(DATA_DIR, req.file.filename);
  const ext = path.extname(req.file.filename).toLowerCase();

  try {
    let data;
    if (ext === '.json') {
      data = JSON.parse(fs.readFileSync(uploadedPath, 'utf8'));
    } else if (ext === '.xlsx') {
      data = parseXlsx(fs.readFileSync(uploadedPath));
      // Save as JSON, remove xlsx
      const jsonFilename = titleToFilename(data.title || req.file.filename.replace('.xlsx', ''));
      fs.writeFileSync(path.join(DATA_DIR, jsonFilename), JSON.stringify(data, null, 2));
      fs.unlinkSync(uploadedPath);
      const err = validateCardSet(data);
      if (err) { try { fs.unlinkSync(path.join(DATA_DIR, jsonFilename)); } catch {} return res.status(400).json({ error: err }); }
      return res.json({ success: true, file: jsonFilename });
    } else {
      data = parseCsv(fs.readFileSync(uploadedPath, 'utf8'));
    }

    const err = validateCardSet(data);
    if (err) {
      fs.unlinkSync(uploadedPath);
      return res.status(400).json({ error: err });
    }
    res.json({ success: true, file: req.file.filename });
  } catch (e) {
    try { fs.unlinkSync(uploadedPath); } catch {}
    res.status(400).json({ error: 'Datei konnte nicht verarbeitet werden: ' + e.message });
  }
});

// API: Delete card set
app.delete('/api/sets/:file', (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Nicht gefunden' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

// API: Get stats for a set
app.get('/api/sets/:file/stats', (req, res) => {
  const statsFile = path.join(DATA_DIR, '.stats', req.params.file + '.json');
  if (!fs.existsSync(statsFile)) return res.json({ sessions: [] });
  res.json(JSON.parse(fs.readFileSync(statsFile, 'utf8')));
});

// API: Save session stats
app.post('/api/sets/:file/stats', (req, res) => {
  const statsDir = path.join(DATA_DIR, '.stats');
  if (!fs.existsSync(statsDir)) fs.mkdirSync(statsDir);
  const statsFile = path.join(statsDir, req.params.file + '.json');
  let stats = { sessions: [] };
  if (fs.existsSync(statsFile)) stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  stats.sessions.push({ ...req.body, date: new Date().toISOString() });
  if (stats.sessions.length > 20) stats.sessions = stats.sessions.slice(-20);
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🎴 Lernkarten-App läuft auf http://localhost:${PORT}`);
});
