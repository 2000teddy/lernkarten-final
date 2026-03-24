const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

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
  if (ext === '.json' || ext === '.csv') cb(null, true);
  else cb(new Error('Nur JSON und CSV Dateien erlaubt'));
}});

// Helper: parse CSV to card set
function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  let title = '', description = '', color = '#6366F1';
  let dataStart = 0;

  // Parse metadata lines
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

// API: List all card sets
app.get('/api/sets', (req, res) => {
  const sets = [];
  const files = fs.readdirSync(DATA_DIR);
  for (const file of files) {
    if (!file.match(/\.(json|csv)$/i)) continue;
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
      let data;
      if (file.endsWith('.json')) {
        data = JSON.parse(content);
      } else {
        data = parseCsv(content);
      }
      sets.push({
        id: file,
        title: data.title,
        description: data.description || '',
        color: data.color || '#6366F1',
        cardCount: data.cards ? data.cards.length : 0,
        file
      });
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
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
    let data;
    if (req.params.file.endsWith('.json')) {
      data = JSON.parse(content);
    } else {
      data = parseCsv(content);
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
    card.quality = req.body.quality; // 'good' | 'bad'
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Upload new card set
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  res.json({ success: true, file: req.file.filename });
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
