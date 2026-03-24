/* ====================================
   LERNKARTEN APP - Frontend Logic
   ==================================== */

// ===== STATE =====
let currentSet = null;       // { id, title, cards, ... }
let currentCards = [];       // shuffled/ordered cards
let currentIndex = 0;        // current card index
let isFlipped = false;       // card face state
let scoreRight = 0;
let scoreWrong = 0;
let answered = new Set();    // indices that were answered
let sessionStart = null;

// Emoji icons per subject prefix
const SUBJECT_ICONS = {
  'hsu': '🏡', 'heimat': '🏡', 'geograf': '🗺️', 'geschichte': '📜',
  'deutsch': '📝', 'grammatik': '✏️', 'lesen': '📖', 'rechtschreib': '✍️',
  'mathe': '🔢', 'math': '🔢', 'geometrie': '📐', 'zahlen': '🔢',
  'englisch': '🇬🇧', 'english': '🇬🇧', 'französisch': '🇫🇷',
  'sachkunde': '🔬', 'natur': '🌿', 'biologie': '🌱', 'physik': '⚡',
  'musik': '🎵', 'kunst': '🎨', 'sport': '⚽',
  'default': '📚'
};

function getIcon(title) {
  const t = title.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (t.includes(key)) return icon;
  }
  return SUBJECT_ICONS.default;
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
    const res = await fetch('/api/sets');
    const sets = await res.json();
    renderSets(sets);
  } catch (e) {
    document.getElementById('sets-grid').innerHTML =
      '<p class="loading-state" style="color:#DC2626">Fehler beim Laden. Ist der Server gestartet?</p>';
  }
}

function renderSets(sets) {
  const grid = document.getElementById('sets-grid');
  if (!sets.length) {
    grid.innerHTML = `<div class="loading-state">
      <p>Noch keine Lernkarten vorhanden.</p>
      <p>Importiere eine JSON oder CSV Datei, um zu beginnen.</p>
    </div>`;
    return;
  }

  grid.innerHTML = sets.map((s, i) => `
    <div class="set-card" style="--card-color:${s.color}; animation-delay:${i * 60}ms"
         onclick="startLearn('${s.file}')">
      <div class="set-card-actions">
        <button class="btn-delete-set" onclick="event.stopPropagation(); deleteSet('${s.file}', '${s.title}')" title="Löschen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
      <div class="set-card-icon" style="background:${s.color}22">${getIcon(s.title)}</div>
      <h3>${s.title}</h3>
      <p>${s.description || 'Keine Beschreibung'}</p>
      <div class="set-card-footer">
        <span class="card-count">${s.cardCount} Karte${s.cardCount !== 1 ? 'n' : ''}</span>
        <button class="btn-start" style="background:${s.color}">
          Üben →
        </button>
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

// ===== LEARN =====
async function startLearn(file) {
  try {
    const res = await fetch(`/api/sets/${encodeURIComponent(file)}`);
    currentSet = await res.json();
    currentSet.file = file;

    // Shuffle cards
    currentCards = [...currentSet.cards].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    scoreRight = 0;
    scoreWrong = 0;
    answered.clear();
    sessionStart = Date.now();

    document.getElementById('learn-title').textContent = currentSet.title;
    updateProgress();
    renderCard();
    updateScore();

    showView('learn');
  } catch (e) {
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

  document.getElementById('card-num').textContent = `Karte ${currentIndex + 1}`;
  document.getElementById('card-question').textContent = card.question;
  document.getElementById('card-answer').textContent = card.answer;

  // Show/hide explain button
  const explainBtn = document.getElementById('btn-explain');
  explainBtn.style.display = card.explanation ? 'flex' : 'none';

  // Answer buttons - only show after flip
  document.getElementById('answer-btns').style.display = 'none';

  // Quality rating - only show when flipped
  const qr = document.getElementById('quality-rating');
  qr.style.display = 'none';

  // Pre-select quality if already rated
  document.querySelectorAll('.quality-btn').forEach(b => {
    b.classList.remove('active-good', 'active-bad');
  });
  if (card.quality === 'good') {
    document.querySelector('.quality-btn.good').classList.add('active-good');
  } else if (card.quality === 'bad') {
    document.querySelector('.quality-btn.bad').classList.add('active-bad');
  }

  // Nav buttons
  document.querySelector('.nav-prev').disabled = currentIndex === 0;
}

function flipCard() {
  const flashCard = document.getElementById('flash-card');
  isFlipped = !isFlipped;
  flashCard.classList.toggle('flipped', isFlipped);

  if (isFlipped) {
    document.getElementById('answer-btns').style.display = 'flex';
    document.getElementById('quality-rating').style.display = 'flex';
  } else {
    document.getElementById('answer-btns').style.display = 'none';
    document.getElementById('quality-rating').style.display = 'none';
  }
}

function nextCard() {
  if (currentIndex < currentCards.length - 1) {
    currentIndex++;
    renderCard();
    updateProgress();
  } else {
    // End of deck
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
  if (answered.has(currentIndex)) {
    // Re-answering: adjust counts
    const prev = answered.get ? answered.get(currentIndex) : null;
  }

  answered.add(currentIndex);

  if (correct) {
    scoreRight++;
  } else {
    scoreWrong++;
  }
  updateScore();

  // Brief visual feedback
  const scene = document.querySelector('.card-scene');
  scene.style.transform = correct ? 'scale(1.02)' : 'scale(0.98)';
  setTimeout(() => { scene.style.transform = ''; }, 150);

  // Auto-advance after short delay
  setTimeout(() => nextCard(), 400);
}

function updateScore() {
  document.getElementById('count-right').textContent = scoreRight;
  document.getElementById('count-wrong').textContent = scoreWrong;
}

function updateProgress() {
  const total = currentCards.length;
  const pct = total > 0 ? Math.round(((currentIndex) / total) * 100) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('learn-progress').textContent = `${currentIndex + 1} / ${total}`;
}

// ===== QUALITY RATING =====
async function rateQuality(quality) {
  const card = currentCards[currentIndex];
  if (!card) return;

  // Update buttons
  document.querySelector('.quality-btn.good').classList.remove('active-good');
  document.querySelector('.quality-btn.bad').classList.remove('active-bad');
  if (quality === 'good') {
    document.querySelector('.quality-btn.good').classList.add('active-good');
  } else {
    document.querySelector('.quality-btn.bad').classList.add('active-bad');
  }

  // Only save to JSON sets
  if (currentSet.file.endsWith('.json')) {
    try {
      await fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/cards/${card.id}/quality`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality })
      });
      card.quality = quality;
    } catch (e) {
      console.error('Quality save failed:', e);
    }
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
  const total = currentCards.length;
  const answered_count = scoreRight + scoreWrong;
  const skipped = total - answered_count;
  const pct = total > 0 ? Math.round((scoreRight / total) * 100) : 0;

  // Emoji & title
  let emoji, title;
  if (pct >= 90) { emoji = '🌟'; title = 'Ausgezeichnet!'; }
  else if (pct >= 70) { emoji = '🎉'; title = 'Super gemacht!'; }
  else if (pct >= 50) { emoji = '💪'; title = 'Gut weiterüben!'; }
  else if (pct >= 30) { emoji = '📚'; title = 'Noch etwas lernen!'; }
  else { emoji = '🤔'; title = 'Das nächste Mal klappt es!'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('res-fraction').textContent = `${scoreRight}/${total}`;
  document.getElementById('res-percent').textContent = pct + ' %';
  document.getElementById('res-right').textContent = scoreRight;
  document.getElementById('res-wrong').textContent = scoreWrong;
  document.getElementById('res-skip').textContent = skipped;

  // Donut animation
  const circumference = 314; // 2 * pi * 50
  const offset = circumference - (pct / 100) * circumference;
  const ring = document.getElementById('donut-ring');
  ring.style.strokeDashoffset = circumference; // reset
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

  // Color ring by score
  ring.style.stroke = pct >= 70 ? '#16A34A' : pct >= 40 ? '#F59E0B' : '#DC2626';

  // Save session stats
  const duration = Math.round((Date.now() - sessionStart) / 1000);
  fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ right: scoreRight, wrong: scoreWrong, skipped, total, pct, duration })
  }).catch(() => {});

  showView('results');
}

function restartLearn() {
  startLearn(currentSet.file);
}

// ===== UPLOAD =====
const uploadZone = document.getElementById('upload-zone');

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--accent)';
  uploadZone.style.background = 'var(--accent-light)';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '';
  uploadZone.style.background = '';
});

uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  uploadZone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file) uploadFileObj(file);
});

async function uploadFile(input) {
  if (input.files[0]) await uploadFileObj(input.files[0]);
}

async function uploadFileObj(file) {
  const status = document.getElementById('upload-status');
  status.textContent = 'Wird hochgeladen...';
  status.className = '';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      status.textContent = `✓ "${file.name}" erfolgreich importiert!`;
      status.className = 'success';
      setTimeout(() => {
        document.getElementById('upload-modal').classList.remove('open');
        status.textContent = '';
        status.className = '';
        loadSets();
      }, 1800);
    } else {
      throw new Error(data.error);
    }
  } catch (e) {
    status.textContent = '✗ Fehler: ' + e.message;
    status.className = 'error';
  }
}

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', e => {
  const learnActive = document.getElementById('view-learn').classList.contains('active');
  if (!learnActive) return;

  if (e.key === 'ArrowRight') nextCard();
  if (e.key === 'ArrowLeft') prevCard();
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
  if (e.key === 'y' || e.key === 'j') markAnswer(true);
  if (e.key === 'n') markAnswer(false);
  if (e.key === 'Escape') goHome();
});

// ===== INIT =====
loadSets();
