/* ====================================
   LERNKARTEN APP - Frontend Logic
   Phase 1: Dark Mode, MC, Write, Editor, Improved Results
   ==================================== */

// ===== STATE =====
let currentSet    = null;
let currentCards  = [];
let currentIndex  = 0;
let currentMode   = 'flip';   // 'flip' | 'mc' | 'write'
let isFlipped     = false;
let scoreRight    = 0;
let scoreWrong    = 0;
let answeredMap   = new Map(); // index -> true/false
let sessionStart  = null;
let pendingFile   = null;     // file selected in mode selector

// MC mode
let mcOptions = [];

// Editor state
let editorFile   = null;
let editorCards  = [];
let editorColor  = '#6366F1';

const COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];

const MODE_LABELS = { flip: 'Karteikarten', mc: 'Multiple Choice', write: 'Tippen' };

// Emoji icons per subject
const SUBJECT_ICONS = {
  'hsu':'🏡','heimat':'🏡','geograf':'🗺️','geschichte':'📜',
  'deutsch':'📝','grammatik':'✏️','lesen':'📖','rechtschreib':'✍️',
  'mathe':'🔢','math':'🔢','geometrie':'📐','zahlen':'🔢',
  'englisch':'🇬🇧','english':'🇬🇧','französisch':'🇫🇷',
  'sachkunde':'🔬','natur':'🌿','biologie':'🌱','physik':'⚡',
  'musik':'🎵','kunst':'🎨','sport':'⚽','default':'📚'
};

function getIcon(title) {
  const t = title.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (t.includes(key)) return icon;
  }
  return SUBJECT_ICONS.default;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== DARK MODE =====
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'true' || (saved === null && prefersDark);
  setDarkMode(isDark);
}

function setDarkMode(on) {
  document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
  document.getElementById('icon-moon').style.display = on ? 'none' : 'block';
  document.getElementById('icon-sun').style.display  = on ? 'block' : 'none';
  localStorage.setItem('darkMode', on ? 'true' : 'false');
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setDarkMode(!isDark);
}

// ===== VIEW MANAGEMENT =====
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

// ===== HOME =====
async function loadSets() {
  try {
    const res  = await fetch('/api/sets');
    const sets = await res.json();
    renderSets(sets);
  } catch(e) {
    document.getElementById('sets-grid').innerHTML =
      '<p class="loading-state" style="color:#DC2626">Fehler beim Laden. Ist der Server gestartet?</p>';
  }
}

function renderSets(sets) {
  const grid = document.getElementById('sets-grid');
  if (!sets.length) {
    grid.innerHTML = `<div class="loading-state">
      <p>Noch keine Lernkarten vorhanden.</p>
      <p>Erstelle ein neues Set oder importiere eine JSON/CSV/XLSX-Datei.</p>
    </div>`;
    return;
  }
  grid.innerHTML = sets.map((s, i) => `
    <div class="set-card" style="--card-color:${s.color}; animation-delay:${i*60}ms"
         onclick="showModeSelector('${s.file}', '${escHtml(s.title)}')">
      <div class="set-card-actions">
        ${s.file.endsWith('.json') ? `
        <button class="btn-edit-set" onclick="event.stopPropagation(); showEditorExisting('${s.file}')" title="Bearbeiten">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>` : ''}
        <button class="btn-delete-set" onclick="event.stopPropagation(); deleteSet('${s.file}', '${escHtml(s.title)}')" title="Löschen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
      <div class="set-card-icon" style="background:${s.color}22">${getIcon(s.title)}</div>
      <h3>${escHtml(s.title)}</h3>
      <p>${escHtml(s.description || 'Keine Beschreibung')}</p>
      <div class="set-card-footer">
        <span class="card-count">${s.cardCount} Karte${s.cardCount !== 1 ? 'n' : ''}</span>
        <button class="btn-start" style="background:${s.color}">Üben →</button>
      </div>
    </div>
  `).join('');
}

async function deleteSet(file, title) {
  if (!confirm(`"${title}" wirklich löschen?`)) return;
  await fetch(`/api/sets/${encodeURIComponent(file)}`, { method: 'DELETE' });
  loadSets();
}

function goHome() {
  showView('home');
  loadSets();
}

// ===== MODE SELECTOR =====
function showModeSelector(file, title) {
  pendingFile = file;
  document.getElementById('mode-modal-title').textContent = title;
  document.getElementById('mode-modal').classList.add('open');
}

function closeModeSelector() {
  document.getElementById('mode-modal').classList.remove('open');
}

function startLearnWithMode(mode) {
  currentMode = mode;
  closeModeSelector();
  startLearn(pendingFile);
}

// ===== LEARN =====
async function startLearn(file) {
  try {
    const res = await fetch(`/api/sets/${encodeURIComponent(file)}`);
    currentSet = await res.json();
    currentSet.file = file;

    currentCards = [...currentSet.cards].sort(() => Math.random() - 0.5);
    currentIndex  = 0;
    scoreRight    = 0;
    scoreWrong    = 0;
    answeredMap.clear();
    sessionStart  = Date.now();

    document.getElementById('learn-title').textContent = currentSet.title;
    document.getElementById('mode-badge').textContent  = MODE_LABELS[currentMode] || '';

    // MC mode needs at least 4 cards for 3 wrong options
    if (currentMode === 'mc' && currentCards.length < 2) {
      alert('Multiple Choice benötigt mindestens 2 Karten.');
      currentMode = 'flip';
      document.getElementById('mode-badge').textContent = MODE_LABELS.flip;
    }

    updateProgress();
    renderCard();
    updateScore();
    showView('learn');
  } catch(e) {
    alert('Fehler beim Laden des Fragesatzes.');
  }
}

function renderCard() {
  const card = currentCards[currentIndex];
  if (!card) return;

  // Reset flip
  const flashCard = document.getElementById('flash-card');
  flashCard.classList.remove('flipped');
  isFlipped = false;

  document.getElementById('card-num').textContent      = `Karte ${currentIndex + 1}`;
  document.getElementById('card-question').textContent = card.question;
  document.getElementById('card-answer').textContent   = card.answer;

  // Mode-specific hint text
  const hints = { flip: 'Zum Umdrehen tippen', mc: 'Wähle die richtige Antwort', write: 'Tippe deine Antwort unten ein' };
  document.getElementById('card-hint').textContent = hints[currentMode];

  // Card clickable only in flip mode
  const scene = document.getElementById('card-scene');
  scene.style.cursor = currentMode === 'flip' ? 'pointer' : 'default';

  // Hide all mode-specific elements first
  document.getElementById('mc-options').style.display   = 'none';
  document.getElementById('write-mode').style.display   = 'none';
  document.getElementById('answer-btns').style.display  = 'none';
  document.getElementById('quality-rating').style.display = 'none';
  document.getElementById('btn-explain').style.display  = 'none';

  // Reset write input
  document.getElementById('write-input').value          = '';
  document.getElementById('write-input').disabled       = false;
  document.getElementById('write-feedback').style.display = 'none';

  // Show mode-specific UI
  if (currentMode === 'mc') {
    document.getElementById('mc-options').style.display = 'grid';
    renderMCOptions(card);
  } else if (currentMode === 'write') {
    document.getElementById('write-mode').style.display = 'block';
    setTimeout(() => document.getElementById('write-input').focus(), 100);
  }

  // Quality rating: pre-select if already rated
  document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active-good','active-bad'));
  if (card.quality === 'good') document.querySelector('.quality-btn.good').classList.add('active-good');
  if (card.quality === 'bad')  document.querySelector('.quality-btn.bad').classList.add('active-bad');

  document.querySelector('.nav-prev').disabled = currentIndex === 0;
}

function flipCard() {
  if (currentMode !== 'flip') return;
  const flashCard = document.getElementById('flash-card');
  isFlipped = !isFlipped;
  flashCard.classList.toggle('flipped', isFlipped);

  const card = currentCards[currentIndex];
  if (isFlipped) {
    document.getElementById('answer-btns').style.display  = 'flex';
    document.getElementById('quality-rating').style.display = 'flex';
    if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  } else {
    document.getElementById('answer-btns').style.display  = 'none';
    document.getElementById('quality-rating').style.display = 'none';
    document.getElementById('btn-explain').style.display  = 'none';
  }
}

// ===== MULTIPLE CHOICE =====
function renderMCOptions(card) {
  const container = document.getElementById('mc-options');
  const others = currentCards.filter((_, i) => i !== currentIndex);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  const wrongAnswers = shuffledOthers.slice(0, 3).map(c => c.answer);
  while (wrongAnswers.length < 3) wrongAnswers.push('–');

  mcOptions = [card.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  container.innerHTML = mcOptions.map((opt, idx) => `
    <button class="mc-option" onclick="selectMCOption(${idx})">
      <span class="mc-letter">${'ABCD'[idx]}</span>
      <span class="mc-opt-text">${escHtml(opt)}</span>
    </button>
  `).join('');
}

function selectMCOption(idx) {
  const card = currentCards[currentIndex];
  const isCorrect = mcOptions[idx] === card.answer;

  const buttons = document.querySelectorAll('.mc-option');
  buttons.forEach(b => b.disabled = true);
  buttons[idx].classList.add(isCorrect ? 'mc-correct' : 'mc-wrong');

  if (!isCorrect) {
    const correctIdx = mcOptions.indexOf(card.answer);
    if (correctIdx >= 0) buttons[correctIdx].classList.add('mc-correct');
  }

  // Show explain button if available
  if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  if (currentSet.file.endsWith('.json')) document.getElementById('quality-rating').style.display = 'flex';

  markAnswer(isCorrect);
}

// ===== WRITE MODE =====
function checkWriteAnswer() {
  const input = document.getElementById('write-input');
  const feedback = document.getElementById('write-feedback');
  const card = currentCards[currentIndex];

  if (!input.value.trim()) return;

  const normalize = s => s.toLowerCase().trim().replace(/\s+/g,' ').replace(/[.,!?;:'"()]/g,'');
  const isCorrect = normalize(input.value) === normalize(card.answer);

  feedback.style.display = 'block';
  if (isCorrect) {
    feedback.className = 'write-feedback correct';
    feedback.innerHTML = '<strong>Richtig!</strong>';
  } else {
    feedback.className = 'write-feedback wrong';
    feedback.innerHTML = `<strong>Nicht ganz.</strong> Richtige Antwort: <em>${escHtml(card.answer)}</em>`;
  }
  input.disabled = true;

  if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  if (currentSet.file.endsWith('.json')) document.getElementById('quality-rating').style.display = 'flex';

  markAnswer(isCorrect);
}

// ===== NAVIGATION =====
function nextCard() {
  if (currentIndex < currentCards.length - 1) {
    currentIndex++;
    renderCard();
    updateProgress();
  } else {
    showResults();
  }
}

function prevCard() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCard();
    updateProgress();
  }
}

function markAnswer(correct) {
  // Adjust counts for re-answers
  if (answeredMap.has(currentIndex)) {
    if (answeredMap.get(currentIndex)) scoreRight--; else scoreWrong--;
  }
  answeredMap.set(currentIndex, correct);
  if (correct) scoreRight++; else scoreWrong++;
  updateScore();

  const scene = document.querySelector('.card-scene');
  scene.style.transform = correct ? 'scale(1.02)' : 'scale(0.98)';
  setTimeout(() => { scene.style.transform = ''; }, 150);

  setTimeout(() => nextCard(), currentMode === 'flip' ? 400 : 900);
}

function updateScore() {
  document.getElementById('count-right').textContent = scoreRight;
  document.getElementById('count-wrong').textContent = scoreWrong;
}

function updateProgress() {
  const total = currentCards.length;
  const pct   = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
  document.getElementById('progress-bar').style.width     = pct + '%';
  document.getElementById('learn-progress').textContent   = `${currentIndex + 1} / ${total}`;
}

// ===== QUALITY RATING =====
async function rateQuality(quality) {
  const card = currentCards[currentIndex];
  if (!card) return;

  document.querySelector('.quality-btn.good').classList.remove('active-good');
  document.querySelector('.quality-btn.bad').classList.remove('active-bad');
  if (quality === 'good') document.querySelector('.quality-btn.good').classList.add('active-good');
  else                    document.querySelector('.quality-btn.bad').classList.add('active-bad');

  if (currentSet.file.endsWith('.json')) {
    try {
      await fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/cards/${card.id}/quality`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality })
      });
      card.quality = quality;
    } catch(e) { console.error('Quality save failed:', e); }
  }
}

// ===== EXPLANATION =====
function showExplanation() {
  const card = currentCards[currentIndex];
  if (!card || !card.explanation) return;
  document.getElementById('explain-text').textContent = card.explanation;
  document.getElementById('explain-modal').classList.add('open');
}

function closeExplanation() {
  document.getElementById('explain-modal').classList.remove('open');
}

// ===== RESULTS =====
function showResults() {
  const total         = currentCards.length;
  const answeredCount = scoreRight + scoreWrong;
  const skipped       = total - answeredCount;
  const pct           = total > 0 ? Math.round((scoreRight / total) * 100) : 0;

  let emoji, title;
  if (pct >= 90)      { emoji = '🌟'; title = 'Ausgezeichnet!'; }
  else if (pct >= 70) { emoji = '🎉'; title = 'Super gemacht!'; }
  else if (pct >= 50) { emoji = '💪'; title = 'Gut weiterüben!'; }
  else if (pct >= 30) { emoji = '📚'; title = 'Noch etwas lernen!'; }
  else                { emoji = '🤔'; title = 'Das nächste Mal klappt es!'; }

  document.getElementById('results-emoji').textContent   = emoji;
  document.getElementById('results-title').textContent   = title;
  document.getElementById('res-fraction').textContent    = `${scoreRight}/${total}`;
  document.getElementById('res-percent').textContent     = pct + ' %';
  document.getElementById('res-right').textContent       = scoreRight;
  document.getElementById('res-wrong').textContent       = scoreWrong;
  document.getElementById('res-skip').textContent        = skipped;

  // Donut animation
  const circumference = 314;
  const offset = circumference - (pct / 100) * circumference;
  const ring = document.getElementById('donut-ring');
  ring.style.strokeDashoffset = circumference;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
  ring.style.stroke = pct >= 70 ? '#16A34A' : pct >= 40 ? '#F59E0B' : '#DC2626';

  // Wrong cards detail
  const wrongIndices = [...answeredMap.entries()].filter(([,ok]) => !ok).map(([i]) => i);
  const wrongSection = document.getElementById('wrong-cards-section');
  const retryBtn     = document.getElementById('btn-retry-wrong');

  if (wrongIndices.length > 0) {
    document.getElementById('wrong-cards-list').innerHTML = wrongIndices.map(i => {
      const c = currentCards[i];
      return `<div class="wrong-card-item">
        <div class="wrong-card-q">${escHtml(c.question)}</div>
        <div class="wrong-card-a">${escHtml(c.answer)}</div>
      </div>`;
    }).join('');
    wrongSection.style.display = 'block';
    retryBtn.style.display     = 'block';
    // Store wrong cards for retry
    window._wrongCards = wrongIndices.map(i => currentCards[i]);
  } else {
    wrongSection.style.display = 'none';
    retryBtn.style.display     = 'none';
  }

  // Save session stats
  const duration = Math.round((Date.now() - sessionStart) / 1000);
  fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ right: scoreRight, wrong: scoreWrong, skipped, total, pct, duration, mode: currentMode })
  }).catch(() => {});

  showView('results');
}

function restartLearn() {
  startLearn(currentSet.file);
}

function restartWithWrong() {
  if (!window._wrongCards || !window._wrongCards.length) return;
  currentCards = [...window._wrongCards];
  currentIndex  = 0;
  scoreRight    = 0;
  scoreWrong    = 0;
  answeredMap.clear();
  sessionStart  = Date.now();
  updateProgress();
  renderCard();
  updateScore();
  showView('learn');
}

// ===== UPLOAD =====
const uploadZone = document.getElementById('upload-zone');

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--accent)';
  uploadZone.style.background  = 'var(--accent-light)';
});
uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '';
  uploadZone.style.background  = '';
});
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  uploadZone.style.background  = '';
  if (e.dataTransfer.files[0]) uploadFileObj(e.dataTransfer.files[0]);
});

async function uploadFile(input) {
  if (input.files[0]) await uploadFileObj(input.files[0]);
}

async function uploadFileObj(file) {
  const status = document.getElementById('upload-status');
  status.textContent = 'Wird hochgeladen...';
  status.className   = '';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res  = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      status.textContent = `✓ "${file.name}" erfolgreich importiert!`;
      status.className   = 'success';
      setTimeout(() => {
        document.getElementById('upload-modal').classList.remove('open');
        status.textContent = '';
        status.className   = '';
        loadSets();
      }, 1800);
    } else {
      throw new Error(data.error);
    }
  } catch(e) {
    status.textContent = '✗ Fehler: ' + e.message;
    status.className   = 'error';
  }
}

// ===== EDITOR =====
function showEditorNew() {
  editorFile  = null;
  editorCards = [];
  editorColor = '#6366F1';
  document.getElementById('ed-title').value       = '';
  document.getElementById('ed-desc').value        = '';
  document.getElementById('ed-new-q').value       = '';
  document.getElementById('ed-new-a').value       = '';
  document.getElementById('ed-new-e').value       = '';
  document.getElementById('editor-heading').textContent = 'Neues Set erstellen';
  renderEditorCards();
  renderColorPicker();
  showView('editor');
}

async function showEditorExisting(file) {
  try {
    const res  = await fetch(`/api/sets/${encodeURIComponent(file)}`);
    const data = await res.json();
    editorFile  = file;
    editorCards = data.cards.map(c => ({ ...c }));
    editorColor = data.color || '#6366F1';
    document.getElementById('ed-title').value       = data.title || '';
    document.getElementById('ed-desc').value        = data.description || '';
    document.getElementById('ed-new-q').value       = '';
    document.getElementById('ed-new-a').value       = '';
    document.getElementById('ed-new-e').value       = '';
    document.getElementById('editor-heading').textContent = 'Set bearbeiten';
    renderEditorCards();
    renderColorPicker();
    showView('editor');
  } catch(e) {
    alert('Fehler beim Laden des Sets');
  }
}

function closeEditor() {
  goHome();
}

function renderColorPicker() {
  document.getElementById('ed-colors').innerHTML = COLORS.map(c => `
    <button class="color-swatch${editorColor === c ? ' active' : ''}"
            style="background:${c}"
            onclick="selectEditorColor('${c}')"
            title="${c}"></button>
  `).join('');
}

function selectEditorColor(color) {
  editorColor = color;
  renderColorPicker();
}

function renderEditorCards() {
  const container = document.getElementById('editor-cards');
  document.getElementById('ed-card-count').textContent = `(${editorCards.length})`;
  if (!editorCards.length) {
    container.innerHTML = '<p class="editor-empty">Noch keine Karten. Füge unten eine hinzu.</p>';
    return;
  }
  container.innerHTML = editorCards.map((card, idx) => `
    <div class="editor-card-item">
      <div class="editor-card-num">${idx + 1}</div>
      <div class="editor-card-content">
        <div class="editor-card-q">${escHtml(card.question)}</div>
        <div class="editor-card-a">${escHtml(card.answer)}</div>
        ${card.explanation ? `<div class="editor-card-e">${escHtml(card.explanation)}</div>` : ''}
      </div>
      <button class="editor-card-del" onclick="removeEditorCard(${idx})" title="Löschen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>
  `).join('');
}

function addEditorCard() {
  const q = document.getElementById('ed-new-q').value.trim();
  const a = document.getElementById('ed-new-a').value.trim();
  const e = document.getElementById('ed-new-e').value.trim();
  if (!q || !a) { alert('Frage und Antwort sind Pflichtfelder.'); return; }
  editorCards.push({ id: editorCards.length + 1, question: q, answer: a, explanation: e || null, quality: null });
  document.getElementById('ed-new-q').value = '';
  document.getElementById('ed-new-a').value = '';
  document.getElementById('ed-new-e').value = '';
  document.getElementById('ed-new-q').focus();
  renderEditorCards();
}

function removeEditorCard(idx) {
  if (!confirm('Karte löschen?')) return;
  editorCards.splice(idx, 1);
  editorCards.forEach((c, i) => { c.id = i + 1; });
  renderEditorCards();
}

async function saveEditor() {
  const title       = document.getElementById('ed-title').value.trim();
  const description = document.getElementById('ed-desc').value.trim();
  if (!title) { alert('Bitte einen Titel eingeben.'); return; }
  if (!editorCards.length) { alert('Mindestens eine Karte erforderlich.'); return; }

  const data = { title, description, color: editorColor, cards: editorCards };
  try {
    let res;
    if (editorFile) {
      res = await fetch(`/api/sets/${encodeURIComponent(editorFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    goHome();
  } catch(e) {
    alert('Fehler beim Speichern: ' + e.message);
  }
}

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', e => {
  const learnActive  = document.getElementById('view-learn').classList.contains('active');
  const editorActive = document.getElementById('view-editor').classList.contains('active');

  if (editorActive) {
    if (e.key === 'Escape') closeEditor();
    return;
  }
  if (!learnActive) return;

  // Don't interfere with write mode input
  if (currentMode === 'write' && document.activeElement === document.getElementById('write-input')) return;

  if (e.key === 'ArrowRight') nextCard();
  if (e.key === 'ArrowLeft')  prevCard();
  if ((e.key === ' ' || e.key === 'Enter') && currentMode === 'flip') { e.preventDefault(); flipCard(); }
  if (e.key === 'y' || e.key === 'j') markAnswer(true);
  if (e.key === 'n') markAnswer(false);
  if (e.key === 'Escape') goHome();
});

// ===== INIT =====
initDarkMode();
loadSets();
