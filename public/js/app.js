/* ====================================
   LERNKARTEN APP – Frontend Logic
   Phase 1+2: Dark Mode, MC, Write, Editor,
              Profile, SM-2, Stats, PWA
   ==================================== */

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentSet    = null;
let currentCards  = [];
let currentIndex  = 0;
let currentMode   = 'flip';   // 'flip' | 'mc' | 'write' | 'spaced'
let isFlipped     = false;
let scoreRight    = 0;
let scoreWrong    = 0;
let answeredMap   = new Map(); // index → true/false
let sessionStart  = null;
let pendingFile   = null;
let pendingDue    = 0;         // due-card-count für mode-modal
let mcOptions     = [];
let answerLocked  = false;
let nextCardTimeout = null;

// User state
let currentUserId   = null;
let currentUserName = '';
let currentUserAvatar = '🎓';
let selectedAvatar  = '🦊';

// Editor state
let editorFile  = null;
let editorCards = [];
let editorColor = '#6366F1';
let editorMeta  = { subject:'', topic:'', grade:'', language:'de', audience:'', tags:'' };

// Stats chart instance
let sessionsChart = null;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const COLORS  = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6'];
const AVATARS = ['🦊','🐻','🐼','🦁','🐸','🦋','🌟','🚀','⚡','🌈','🎨','🎯','🏆','🎮','🌺','🦄','🐯','🐧'];
const MODE_LABELS = { flip:'Karteikarten', mc:'Multiple Choice', write:'Tippen', spaced:'Fällige Karten' };

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
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}

// ─── DARK MODE ────────────────────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setDarkMode(saved === 'true' || (saved === null && prefersDark));
}

function setDarkMode(on) {
  document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
  document.getElementById('icon-moon').style.display = on ? 'none'  : 'block';
  document.getElementById('icon-sun').style.display  = on ? 'block' : 'none';
  localStorage.setItem('darkMode', on ? 'true' : 'false');
}

function toggleDarkMode() {
  setDarkMode(document.documentElement.getAttribute('data-theme') !== 'dark');
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

// ─── USER / PROFILE ───────────────────────────────────────────────────────────
function initUser() {
  currentUserId    = localStorage.getItem('userId')     || null;
  currentUserName  = localStorage.getItem('userName')   || '';
  currentUserAvatar= localStorage.getItem('userAvatar') || '🎓';

  if (!currentUserId) {
    loadProfiles();
    showView('profile');
  } else {
    updateUserBadge();
    loadSets();
    showView('home');
  }
}

function updateUserBadge() {
  const btn = document.getElementById('user-badge');
  if (currentUserId) {
    btn.textContent = currentUserAvatar + ' ' + currentUserName;
    btn.style.display = 'flex';
  } else {
    btn.textContent = 'Gast';
    btn.style.display = 'flex';
  }
  const greeting = document.getElementById('home-greeting');
  if (currentUserName) greeting.textContent = 'Hallo, ' + currentUserName + '!';
  else                  greeting.textContent = 'Deine Themenbereiche';
}

async function loadProfiles() {
  try {
    const res = await fetch('/api/users');
    renderProfiles(await res.json());
  } catch(e) {
    document.getElementById('profiles-list').innerHTML =
      '<p style="color:var(--text-muted);text-align:center">Server nicht erreichbar.</p>';
  }
}

function renderProfiles(users) {
  const list = document.getElementById('profiles-list');
  if (!users.length) {
    list.innerHTML = '<p class="profile-hint">Noch kein Profil vorhanden.</p>';
    showCreateProfile();
    return;
  }
  hideCreateProfile();
  list.innerHTML = users.map((u, index) => `
    <div class="profile-card" data-user-index="${index}" role="button" tabindex="0">
      <span class="profile-avatar">${escHtml(u.avatar)}</span>
      <span class="profile-name">${escHtml(u.name)}</span>
      <button class="profile-del" data-user-delete="${index}" title="Profil löschen">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.profile-card').forEach(card => {
    const user = users[Number(card.dataset.userIndex)];
    if (!user) return;
    const activate = () => selectUser(user.id, user.name, user.avatar);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  list.querySelectorAll('.profile-del').forEach(button => {
    const user = users[Number(button.dataset.userDelete)];
    if (!user) return;
    button.addEventListener('click', event => {
      event.stopPropagation();
      deleteUser(user.id);
    });
  });
}

function selectUser(id, name, avatar) {
  currentUserId    = id;
  currentUserName  = name;
  currentUserAvatar= avatar;
  localStorage.setItem('userId',    id);
  localStorage.setItem('userName',  name);
  localStorage.setItem('userAvatar',avatar);
  updateUserBadge();
  goHome();
}

function continueAsGuest() {
  currentUserId    = null;
  currentUserName  = '';
  currentUserAvatar= '';
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userAvatar');
  updateUserBadge();
  goHome();
}

async function deleteUser(id) {
  if (!confirm('Profil und alle gespeicherten Fortschritte löschen?')) return;
  await fetch(`/api/users/${id}`, { method:'DELETE' });
  if (currentUserId === id) continueAsGuest();
  else loadProfiles();
}

function showCreateProfile() {
  document.getElementById('profile-create').style.display = 'block';
  document.getElementById('btn-new-profile').style.display = 'none';
  renderAvatarPicker();
  document.getElementById('profile-name-input').focus();
}

function hideCreateProfile() {
  document.getElementById('profile-create').style.display = 'none';
  document.getElementById('btn-new-profile').style.display = 'block';
}

function renderAvatarPicker() {
  selectedAvatar = AVATARS[0];
  document.getElementById('avatar-picker').innerHTML = AVATARS.map(a => `
    <button class="avatar-opt${a===selectedAvatar?' selected':''}" onclick="pickAvatar('${a}')">${a}</button>
  `).join('');
}

function pickAvatar(av) {
  selectedAvatar = av;
  document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  [...document.querySelectorAll('.avatar-opt')].find(b => b.textContent===av)?.classList.add('selected');
}

async function createProfile() {
  const name = document.getElementById('profile-name-input').value.trim();
  if (!name) { alert('Bitte einen Namen eingeben.'); return; }
  const res  = await fetch('/api/users', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ name, avatar: selectedAvatar })
  });
  const data = await res.json();
  if (data.success) selectUser(data.id, data.name, data.avatar);
  else alert('Fehler: ' + data.error);
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
async function loadSets() {
  try {
    const [setsRes, dueRes] = await Promise.all([
      fetch('/api/sets'),
      currentUserId ? fetch(`/api/users/${currentUserId}/due`) : null
    ]);
    const sets = await setsRes.json();
    const due  = dueRes ? await dueRes.json() : {};
    renderSets(sets, due);
  } catch(e) {
    document.getElementById('sets-grid').innerHTML =
      '<p class="loading-state" style="color:#DC2626">Fehler beim Laden.</p>';
  }
}

function renderSets(sets, due = {}) {
  const grid = document.getElementById('sets-grid');
  if (!sets.length) {
    grid.innerHTML = `<div class="loading-state">
      <p>Noch keine Lernkarten vorhanden.</p>
      <p>Erstelle ein neues Set oder importiere eine Datei.</p></div>`;
    return;
  }
  grid.innerHTML = sets.map((s,i) => {
    const dueCount = due[s.file] || 0;
    return `
    <div class="set-card" data-set-index="${i}" style="--card-color:${s.color};animation-delay:${i*60}ms">
      <div class="set-card-actions">
        ${s.file.endsWith('.json') ? `
        <button class="btn-edit-set" data-set-edit="${i}" title="Bearbeiten">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>` : ''}
        <button class="btn-download-set" data-set-download="${i}" title="Herunterladen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="btn-delete-set" data-set-delete="${i}" title="Löschen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
      <div class="set-card-icon" style="background:${s.color}22">${getIcon(s.title)}</div>
      <h3>${escHtml(s.title)}</h3>
      ${(s.subject || s.grade || s.language) ? `<div class="set-card-meta">
        ${s.subject ? `<span class="set-meta-pill">${escHtml(s.subject)}</span>` : ''}
        ${s.topic ? `<span class="set-meta-pill">${escHtml(s.topic)}</span>` : ''}
        ${s.grade ? `<span class="set-meta-pill">Klasse ${escHtml(s.grade)}</span>` : ''}
        ${s.language ? `<span class="set-meta-pill">${escHtml(String(s.language).toUpperCase())}</span>` : ''}
      </div>` : ''}
      <p>${escHtml(s.description||'Keine Beschreibung')}</p>
      <div class="set-card-footer">
        <span class="card-count">${s.cardCount} Karte${s.cardCount!==1?'n':''}</span>
        ${dueCount>0 ? `<span class="due-badge">${dueCount} fällig</span>` : ''}
        <button class="btn-start" style="background:${s.color}">Üben →</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.set-card').forEach(card => {
    const set = sets[Number(card.dataset.setIndex)];
    if (!set) return;
    card.addEventListener('click', () => showModeSelector(set.file, set.title, due[set.file] || 0));
  });

  grid.querySelectorAll('.btn-edit-set').forEach(button => {
    const set = sets[Number(button.dataset.setEdit)];
    if (!set) return;
    button.addEventListener('click', event => {
      event.stopPropagation();
      showEditorExisting(set.file);
    });
  });

  grid.querySelectorAll('.btn-delete-set').forEach(button => {
    const set = sets[Number(button.dataset.setDelete)];
    if (!set) return;
    button.addEventListener('click', event => {
      event.stopPropagation();
      deleteSet(set.file, set.title);
    });
  });

  grid.querySelectorAll('.btn-download-set').forEach(button => {
    const set = sets[Number(button.dataset.setDownload)];
    if (!set) return;
    button.addEventListener('click', event => {
      event.stopPropagation();
      downloadSet(set.file);
    });
  });
}

async function deleteSet(file, title) {
  if (!confirm(`"${title}" wirklich löschen?`)) return;
  await fetch(`/api/sets/${encodeURIComponent(file)}`, { method:'DELETE' });
  loadSets();
}

function downloadSet(file) {
  window.location.href = `/api/sets/${encodeURIComponent(file)}/download`;
}

function goHome() {
  showView('home');
  loadSets();
}

// ─── MODE SELECTOR ────────────────────────────────────────────────────────────
function showModeSelector(file, title, dueCount = 0) {
  pendingFile = file;
  pendingDue  = dueCount;
  document.getElementById('mode-modal-title').textContent = title;

  const spacedBtn   = document.getElementById('btn-mode-spaced');
  const spacedLabel = document.getElementById('spaced-count-label');
  if (currentUserId && dueCount > 0) {
    spacedBtn.style.display = 'flex';
    spacedLabel.textContent = `${dueCount} Karte${dueCount!==1?'n':''} fällig heute`;
  } else {
    spacedBtn.style.display = 'none';
  }
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

// ─── LEARN ────────────────────────────────────────────────────────────────────
async function startLearn(file) {
  try {
    const res = await fetch(`/api/sets/${encodeURIComponent(file)}`);
    currentSet = await res.json();
    currentSet.file = file;

    let cards = [...currentSet.cards];

    // Spaced mode: nur fällige Karten
    if (currentMode === 'spaced' && currentUserId) {
      const dueRes  = await fetch(`/api/users/${currentUserId}/sets/${encodeURIComponent(file)}/due`);
      const dueData = await dueRes.json();
      if (dueData.due.length > 0) {
        cards = cards.filter(c => dueData.due.includes(c.id));
      } else {
        alert('Keine fälligen Karten für heute. Alle Karten werden gezeigt.');
        currentMode = 'flip';
      }
    }

    currentCards = cards.sort(() => Math.random() - 0.5);
    currentIndex  = 0;
    scoreRight    = 0;
    scoreWrong    = 0;
    answeredMap.clear();
    sessionStart  = Date.now();

    document.getElementById('learn-title').textContent = currentSet.title;
    document.getElementById('mode-badge').textContent  = MODE_LABELS[currentMode] || '';

    if (currentMode === 'mc' && currentCards.length < 2) {
      alert('Multiple Choice benötigt mindestens 2 Karten.');
      currentMode = 'flip';
      document.getElementById('mode-badge').textContent = MODE_LABELS.flip;
    }

    updateProgress();
    renderCard();
    updateScore();
    showView('learn');
  } catch(e) { alert('Fehler beim Laden des Fragesatzes.'); }
}

function renderCard() {
  const card = currentCards[currentIndex];
  if (!card) return;

  // Weiter-Timer stoppen falls aktiv
  if (window._weiterInterval) { clearInterval(window._weiterInterval); window._weiterInterval = null; }
  if (nextCardTimeout) { clearTimeout(nextCardTimeout); nextCardTimeout = null; }
  answerLocked = false;
  document.getElementById('weiter-container').style.display = 'none';

  document.getElementById('flash-card').classList.remove('flipped');
  isFlipped = false;
  document.getElementById('card-num').textContent      = `Karte ${currentIndex+1}`;
  document.getElementById('card-question').textContent = card.question;
  document.getElementById('card-answer').textContent   = card.answer;

  // Hintergrund der Fragevorderseite in Set-Farbe (Fading-Gradient)
  const color = currentSet && currentSet.color ? currentSet.color : '#2D6A4F';
  document.querySelector('.card-front').style.background =
    `linear-gradient(135deg, ${color}28 0%, var(--surface) 65%)`;

  const hints = { flip:'Zum Umdrehen tippen', mc:'Wähle die richtige Antwort', write:'Tippe deine Antwort unten ein', spaced:'Zum Umdrehen tippen' };
  document.getElementById('card-hint').textContent = hints[currentMode] || hints.flip;

  const scene = document.getElementById('card-scene');
  scene.style.cursor = (currentMode==='flip'||currentMode==='spaced') ? 'pointer' : 'default';

  document.getElementById('mc-options').style.display       = 'none';
  document.getElementById('write-mode').style.display       = 'none';
  document.getElementById('answer-btns').style.display      = 'none';
  document.getElementById('quality-rating').style.display   = 'none';
  document.getElementById('btn-explain').style.display      = 'none';
  document.getElementById('write-input').value              = '';
  document.getElementById('write-input').disabled           = false;
  document.getElementById('write-feedback').style.display   = 'none';

  if (currentMode === 'mc') {
    document.getElementById('mc-options').style.display = 'grid';
    renderMCOptions(card);
  } else if (currentMode === 'write') {
    document.getElementById('write-mode').style.display = 'block';
    setTimeout(() => document.getElementById('write-input').focus(), 100);
  }

  document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active-good','active-bad'));
  if (card.quality==='good') document.querySelector('.quality-btn.good').classList.add('active-good');
  if (card.quality==='bad')  document.querySelector('.quality-btn.bad').classList.add('active-bad');
  document.querySelector('.nav-prev').disabled = currentIndex === 0;
}

function flipCard() {
  if (currentMode!=='flip' && currentMode!=='spaced') return;
  isFlipped = !isFlipped;
  document.getElementById('flash-card').classList.toggle('flipped', isFlipped);
  const card = currentCards[currentIndex];
  if (isFlipped) {
    document.getElementById('answer-btns').style.display    = 'flex';
    document.getElementById('quality-rating').style.display = 'flex';
    if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  } else {
    document.getElementById('answer-btns').style.display    = 'none';
    document.getElementById('quality-rating').style.display = 'none';
    document.getElementById('btn-explain').style.display    = 'none';
  }
}

// ─── MULTIPLE CHOICE ─────────────────────────────────────────────────────────
function renderMCOptions(card) {
  const others = currentCards.filter((_,i) => i!==currentIndex);
  const wrong  = [...others].sort(()=>Math.random()-0.5).slice(0,3).map(c=>c.answer);
  while (wrong.length < 3) wrong.push('–');
  mcOptions = [card.answer, ...wrong].sort(()=>Math.random()-0.5);
  document.getElementById('mc-options').innerHTML = mcOptions.map((opt,idx) => `
    <button class="mc-option" onclick="selectMCOption(${idx})">
      <span class="mc-letter">${'ABCD'[idx]}</span>
      <span class="mc-opt-text">${escHtml(opt)}</span>
    </button>`).join('');
}

function selectMCOption(idx) {
  const card      = currentCards[currentIndex];
  const isCorrect = mcOptions[idx] === card.answer;
  const buttons   = document.querySelectorAll('.mc-option');
  buttons.forEach(b => b.disabled = true);
  buttons[idx].classList.add(isCorrect ? 'mc-correct' : 'mc-wrong');
  if (!isCorrect) {
    const ci = mcOptions.indexOf(card.answer);
    if (ci >= 0) buttons[ci].classList.add('mc-correct');
  }
  if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  if (currentSet.file.endsWith('.json')) document.getElementById('quality-rating').style.display = 'flex';
  markAnswer(isCorrect);
}

// ─── WRITE MODE ───────────────────────────────────────────────────────────────
function checkWriteAnswer() {
  const input    = document.getElementById('write-input');
  const feedback = document.getElementById('write-feedback');
  const card     = currentCards[currentIndex];
  if (!input.value.trim()) return;

  const norm = s => s.toLowerCase().trim().replace(/\s+/g,' ').replace(/[.,!?;:'"()]/g,'');
  const isCorrect = norm(input.value) === norm(card.answer);

  feedback.style.display = 'block';
  feedback.className     = 'write-feedback ' + (isCorrect ? 'correct' : 'wrong');
  feedback.innerHTML     = isCorrect
    ? '<strong>Richtig!</strong>'
    : `<strong>Nicht ganz.</strong> Richtige Antwort: <em>${escHtml(card.answer)}</em>`;
  input.disabled = true;

  if (card.explanation) document.getElementById('btn-explain').style.display = 'flex';
  if (currentSet.file.endsWith('.json')) document.getElementById('quality-rating').style.display = 'flex';
  markAnswer(isCorrect);
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
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
  if (currentIndex > 0) { currentIndex--; renderCard(); updateProgress(); }
}

function markAnswer(correct) {
  if (answerLocked) return;
  if ((currentMode === 'flip' || currentMode === 'spaced') && !isFlipped) return;
  answerLocked = true;

  if (answeredMap.has(currentIndex)) {
    if (answeredMap.get(currentIndex)) scoreRight--; else scoreWrong--;
  }
  answeredMap.set(currentIndex, correct);
  if (correct) scoreRight++; else scoreWrong++;
  updateScore();

  const scene = document.querySelector('.card-scene');
  scene.style.transform = correct ? 'scale(1.02)' : 'scale(0.98)';
  setTimeout(() => { scene.style.transform = ''; }, 150);

  if (currentMode === 'flip' || currentMode === 'spaced') {
    if (nextCardTimeout) clearTimeout(nextCardTimeout);
    nextCardTimeout = setTimeout(() => {
      nextCardTimeout = null;
      nextCard();
    }, 400);
  } else {
    // MC / Write: Weiter-Button mit 5s-Countdown anzeigen
    const container = document.getElementById('weiter-container');
    const countdown = document.getElementById('weiter-countdown');
    const btn       = document.getElementById('btn-weiter');
    btn.style.borderColor = currentSet && currentSet.color ? currentSet.color : '';
    btn.style.color       = currentSet && currentSet.color ? currentSet.color : '';
    container.style.display = 'flex';
    let secs = 5;
    countdown.textContent = `(${secs}s)`;
    if (window._weiterInterval) clearInterval(window._weiterInterval);
    window._weiterInterval = setInterval(() => {
      secs--;
      if (secs > 0) {
        countdown.textContent = `(${secs}s)`;
      } else {
        clearInterval(window._weiterInterval);
        window._weiterInterval = null;
        weiterCard();
      }
    }, 1000);
  }
}

function weiterCard() {
  if (nextCardTimeout) { clearTimeout(nextCardTimeout); nextCardTimeout = null; }
  if (window._weiterInterval) { clearInterval(window._weiterInterval); window._weiterInterval = null; }
  document.getElementById('weiter-container').style.display = 'none';
  nextCard();
}

function updateScore() {
  document.getElementById('count-right').textContent = scoreRight;
  document.getElementById('count-wrong').textContent = scoreWrong;
}

function updateProgress() {
  const total = currentCards.length;
  const pct   = total > 0 ? Math.round((currentIndex/total)*100) : 0;
  document.getElementById('progress-bar').style.width   = pct+'%';
  document.getElementById('learn-progress').textContent = `${currentIndex+1} / ${total}`;
}

// ─── QUALITY RATING ───────────────────────────────────────────────────────────
async function rateQuality(quality) {
  const card = currentCards[currentIndex];
  if (!card) return;
  document.querySelector('.quality-btn.good').classList.remove('active-good');
  document.querySelector('.quality-btn.bad').classList.remove('active-bad');
  document.querySelector(`.quality-btn.${quality}`).classList.add(quality==='good'?'active-good':'active-bad');
  if (currentSet.file.endsWith('.json')) {
    try {
      await fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/cards/${card.id}/quality`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ quality })
      });
      card.quality = quality;
    } catch(e) { console.error('Quality save failed:', e); }
  }
}

// ─── EXPLANATION ──────────────────────────────────────────────────────────────
function showExplanation() {
  const card = currentCards[currentIndex];
  if (!card?.explanation) return;
  document.getElementById('explain-text').textContent = card.explanation;
  document.getElementById('explain-modal').classList.add('open');
}
function closeExplanation() {
  document.getElementById('explain-modal').classList.remove('open');
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────
function showResults() {
  const total   = currentCards.length;
  const skipped = total - scoreRight - scoreWrong;
  const pct     = total > 0 ? Math.round((scoreRight/total)*100) : 0;

  let emoji, title;
  if      (pct>=90) { emoji='🌟'; title='Ausgezeichnet!'; }
  else if (pct>=70) { emoji='🎉'; title='Super gemacht!'; }
  else if (pct>=50) { emoji='💪'; title='Gut weiterüben!'; }
  else if (pct>=30) { emoji='📚'; title='Noch etwas lernen!'; }
  else              { emoji='🤔'; title='Das nächste Mal klappt es!'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('res-fraction').textContent  = `${scoreRight}/${total}`;
  document.getElementById('res-percent').textContent   = pct+' %';
  document.getElementById('res-right').textContent     = scoreRight;
  document.getElementById('res-wrong').textContent     = scoreWrong;
  document.getElementById('res-skip').textContent      = skipped;

  const ring = document.getElementById('donut-ring');
  ring.style.strokeDashoffset = 314;
  setTimeout(() => { ring.style.strokeDashoffset = 314-(pct/100)*314; }, 100);
  ring.style.stroke = pct>=70 ? '#16A34A' : pct>=40 ? '#F59E0B' : '#DC2626';

  // Wrong cards
  const wrongIdx = [...answeredMap.entries()].filter(([,ok])=>!ok).map(([i])=>i);
  const wrongSec = document.getElementById('wrong-cards-section');
  const retryBtn = document.getElementById('btn-retry-wrong');
  if (wrongIdx.length > 0) {
    document.getElementById('wrong-cards-list').innerHTML = wrongIdx.map(i => {
      const c = currentCards[i];
      return `<div class="wrong-card-item">
        <div class="wrong-card-q">${escHtml(c.question)}</div>
        <div class="wrong-card-a">${escHtml(c.answer)}</div>
      </div>`;
    }).join('');
    wrongSec.style.display = 'block';
    retryBtn.style.display = 'block';
    window._wrongCards = wrongIdx.map(i => currentCards[i]);
  } else {
    wrongSec.style.display = 'none';
    retryBtn.style.display = 'none';
  }

  // Save session + SM-2
  const duration = Math.round((Date.now()-sessionStart)/1000);
  const answers  = [...answeredMap.entries()].map(([idx, correct]) => ({
    cardId: currentCards[idx].id, correct
  }));

  if (currentUserId) {
    fetch(`/api/users/${currentUserId}/sets/${encodeURIComponent(currentSet.file)}/session`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ mode:currentMode, right:scoreRight, wrong:scoreWrong, skipped, total, pct, duration, answers })
    }).catch(()=>{});
  } else {
    // Gast: Legacy JSON stats
    fetch(`/api/sets/${encodeURIComponent(currentSet.file)}/stats`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ right:scoreRight, wrong:scoreWrong, skipped, total, pct, duration, mode:currentMode })
    }).catch(()=>{});
  }

  showView('results');
}

function restartLearn()    { startLearn(currentSet.file); }

function restartWithWrong() {
  if (!window._wrongCards?.length) return;
  currentCards = [...window._wrongCards];
  currentIndex  = 0; scoreRight = 0; scoreWrong = 0;
  answeredMap.clear(); sessionStart = Date.now();
  updateProgress(); renderCard(); updateScore();
  showView('learn');
}

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor='var(--accent)'; });
uploadZone.addEventListener('dragleave',()  => { uploadZone.style.borderColor=''; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.style.borderColor='';
  if (e.dataTransfer.files[0]) uploadFileObj(e.dataTransfer.files[0]);
});
async function uploadFile(input) { if (input.files[0]) await uploadFileObj(input.files[0]); }
async function uploadFileObj(file) {
  const status = document.getElementById('upload-status');
  status.textContent='Wird hochgeladen...'; status.className='';
  const fd = new FormData(); fd.append('file', file);
  try {
    const res  = await fetch('/api/upload', { method:'POST', body:fd });
    const data = await res.json();
    if (data.success) {
      status.textContent=`✓ "${file.name}" erfolgreich importiert!`; status.className='success';
      setTimeout(() => {
        document.getElementById('upload-modal').classList.remove('open');
        status.textContent=''; status.className=''; loadSets();
      }, 1800);
    } else throw new Error(data.error);
  } catch(e) { status.textContent='✗ Fehler: '+e.message; status.className='error'; }
}

// ─── EDITOR ───────────────────────────────────────────────────────────────────
function showEditorNew() {
  editorFile='null'; editorFile=null; editorCards=[]; editorColor='#6366F1';
  editorMeta = { subject:'', topic:'', grade:'', language:'de', audience:'', tags:'' };
  document.getElementById('ed-title').value=''; document.getElementById('ed-desc').value='';
  document.getElementById('ed-subject').value=''; document.getElementById('ed-topic').value=''; document.getElementById('ed-grade').value='';
  document.getElementById('ed-language').value='de'; document.getElementById('ed-audience').value=''; document.getElementById('ed-tags').value='';
  document.getElementById('ed-new-q').value=''; document.getElementById('ed-new-a').value=''; document.getElementById('ed-new-e').value='';
  document.getElementById('editor-heading').textContent='Neues Set erstellen';
  renderEditorCards(); renderColorPicker(); showView('editor');
}

async function showEditorExisting(file) {
  try {
    const data = await (await fetch(`/api/sets/${encodeURIComponent(file)}`)).json();
    editorFile=file; editorCards=data.cards.map(c=>({...c})); editorColor=data.color||'#6366F1';
    editorMeta = {
      subject:data.subject||'',
      topic:data.topic||'',
      grade:data.grade||'',
      language:data.language||'de',
      audience:data.audience||'',
      tags:Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags||'')
    };
    document.getElementById('ed-title').value=data.title||''; document.getElementById('ed-desc').value=data.description||'';
    document.getElementById('ed-subject').value=editorMeta.subject;
    document.getElementById('ed-topic').value=editorMeta.topic;
    document.getElementById('ed-grade').value=editorMeta.grade;
    document.getElementById('ed-language').value=editorMeta.language;
    document.getElementById('ed-audience').value=editorMeta.audience;
    document.getElementById('ed-tags').value=editorMeta.tags;
    document.getElementById('ed-new-q').value=''; document.getElementById('ed-new-a').value=''; document.getElementById('ed-new-e').value='';
    document.getElementById('editor-heading').textContent='Set bearbeiten';
    renderEditorCards(); renderColorPicker(); showView('editor');
  } catch(e) { alert('Fehler beim Laden des Sets'); }
}

function closeEditor() { goHome(); }

function renderColorPicker() {
  document.getElementById('ed-colors').innerHTML = COLORS.map(c => `
    <button class="color-swatch${editorColor===c?' active':''}" style="background:${c}"
            onclick="selectEditorColor('${c}')" title="${c}"></button>`).join('');
}
function selectEditorColor(c) { editorColor=c; renderColorPicker(); }

function renderEditorCards() {
  const container = document.getElementById('editor-cards');
  document.getElementById('ed-card-count').textContent=`(${editorCards.length})`;
  if (!editorCards.length) { container.innerHTML='<p class="editor-empty">Noch keine Karten. Füge unten eine hinzu.</p>'; return; }
  container.innerHTML = editorCards.map((card,idx) => `
    <div class="editor-card-item">
      <div class="editor-card-num">${idx+1}</div>
      <div class="editor-card-content">
        <div class="editor-card-q">${escHtml(card.question)}</div>
        <div class="editor-card-a">${escHtml(card.answer)}</div>
        ${card.explanation?`<div class="editor-card-e">${escHtml(card.explanation)}</div>`:''}
      </div>
      <button class="editor-card-del" onclick="removeEditorCard(${idx})" title="Löschen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`).join('');
}

function addEditorCard() {
  const q=document.getElementById('ed-new-q').value.trim();
  const a=document.getElementById('ed-new-a').value.trim();
  const e=document.getElementById('ed-new-e').value.trim();
  if (!q||!a) { alert('Frage und Antwort sind Pflichtfelder.'); return; }
  editorCards.push({ id:editorCards.length+1, question:q, answer:a, explanation:e||null, quality:null });
  document.getElementById('ed-new-q').value=''; document.getElementById('ed-new-a').value=''; document.getElementById('ed-new-e').value='';
  document.getElementById('ed-new-q').focus();
  renderEditorCards();
}

function removeEditorCard(idx) {
  if (!confirm('Karte löschen?')) return;
  editorCards.splice(idx,1); editorCards.forEach((c,i)=>{c.id=i+1;}); renderEditorCards();
}

async function saveEditor() {
  const title=document.getElementById('ed-title').value.trim();
  const description=document.getElementById('ed-desc').value.trim();
  const subject=document.getElementById('ed-subject').value.trim();
  const topic=document.getElementById('ed-topic').value.trim();
  const grade=document.getElementById('ed-grade').value.trim();
  const language=document.getElementById('ed-language').value.trim() || 'de';
  const audience=document.getElementById('ed-audience').value.trim();
  const tags=document.getElementById('ed-tags').value.trim();
  if (!title) { alert('Bitte einen Titel eingeben.'); return; }
  if (!editorCards.length) { alert('Mindestens eine Karte erforderlich.'); return; }
  const data={schemaVersion:2,title,description,color:editorColor,subject,topic,grade,language,audience,tags,cards:editorCards};
  try {
    const res = await fetch(editorFile ? `/api/sets/${encodeURIComponent(editorFile)}` : '/api/sets', {
      method: editorFile ? 'PUT' : 'POST',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
    });
    const result=await res.json();
    if (!res.ok) throw new Error(result.error);
    goHome();
  } catch(e) { alert('Fehler beim Speichern: '+e.message); }
}

// ─── STATISTICS ───────────────────────────────────────────────────────────────
async function showStats() {
  if (!currentUserId) {
    alert('Statistiken sind nur mit einem Benutzerprofil verfügbar.');
    return;
  }
  document.getElementById('stats-username').textContent = currentUserAvatar+' '+currentUserName;
  try {
    const res  = await fetch(`/api/users/${currentUserId}/stats`);
    const data = await res.json();
    renderStats(data);
    showView('stats');
  } catch(e) { alert('Fehler beim Laden der Statistiken.'); }
}

function renderStats({ sessions, progress }) {
  // Progress per set
  const progList = document.getElementById('stats-progress');
  if (!progress.length) {
    progList.innerHTML='<p class="editor-empty">Noch keine Lernaktivität vorhanden.</p>';
  } else {
    progList.innerHTML = progress.map(p => {
      const total   = (p.total_correct||0)+(p.total_wrong||0);
      const acc     = total>0 ? Math.round((p.total_correct/total)*100) : 0;
      const barColor= acc>=70?'var(--right)':acc>=40?'#F59E0B':'var(--wrong)';
      return `<div class="stat-set-row">
        <div class="stat-set-name">${escHtml(p.set_file.replace('.json','').replace('.csv','').replace(/-/g,' '))}</div>
        <div class="stat-set-bar-wrap">
          <div class="stat-set-bar" style="width:${acc}%;background:${barColor}"></div>
        </div>
        <div class="stat-set-meta">
          <span>${acc}%</span>
          ${p.due_today>0?`<span class="due-badge-small">${p.due_today} fällig</span>`:''}
        </div>
      </div>`;
    }).join('');
  }

  // Sessions chart (last 10)
  const last10 = [...sessions].slice(0,10).reverse();
  const labels  = last10.map((_,i)=>`${i+1}`);
  const scores  = last10.map(s=>s.pct);
  const colors  = scores.map(p=>p>=70?'rgba(22,163,74,0.8)':p>=40?'rgba(245,158,11,0.8)':'rgba(220,38,38,0.8)');

  if (sessionsChart) { sessionsChart.destroy(); sessionsChart=null; }
  const ctx = document.getElementById('sessions-chart');
  const chartWrap = document.querySelector('.chart-wrap');
  let emptyState = chartWrap.querySelector('.chart-empty');
  if (!emptyState) {
    emptyState = document.createElement('p');
    emptyState.className = 'editor-empty chart-empty';
    emptyState.textContent = 'Noch keine Sitzungen vorhanden.';
    chartWrap.appendChild(emptyState);
  }
  if (last10.length) {
    ctx.style.display = 'block';
    emptyState.style.display = 'none';
    sessionsChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets:[{ data:scores, backgroundColor:colors, borderRadius:6, borderSkipped:false }] },
      options: {
        responsive:true, plugins:{ legend:{display:false} },
        scales: {
          y: { min:0, max:100, ticks:{ callback:v=>v+'%', color:'var(--text-muted)', font:{size:11} }, grid:{color:'var(--border)'} },
          x: { ticks:{ color:'var(--text-muted)', font:{size:11} }, grid:{display:false} }
        }
      }
    });
  } else {
    ctx.style.display = 'none';
    emptyState.style.display = 'block';
  }

  // Sessions table
  const sessList = document.getElementById('stats-sessions-list');
  if (!sessions.length) {
    sessList.innerHTML='<p class="editor-empty">Noch keine Sitzungen vorhanden.</p>';
  } else {
    sessList.innerHTML=`
      <table class="stats-table">
        <thead><tr><th>Datum</th><th>Thema</th><th>Modus</th><th>Ergebnis</th></tr></thead>
        <tbody>${sessions.slice(0,20).map(s=>`
          <tr>
            <td>${formatDate(s.created_at)}</td>
            <td>${escHtml(s.set_file.replace('.json','').replace('.csv','').replace(/-/g,' '))}</td>
            <td>${MODE_LABELS[s.mode]||s.mode}</td>
            <td class="${s.pct>=70?'stat-ok':s.pct>=40?'stat-mid':'stat-bad'}">${s.pct}%</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }
}

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.getElementById('view-editor').classList.contains('active')) {
    if (e.key==='Escape') closeEditor(); return;
  }
  if (!document.getElementById('view-learn').classList.contains('active')) return;
  if (currentMode==='write' && document.activeElement===document.getElementById('write-input')) return;

  if (e.key==='ArrowRight') nextCard();
  if (e.key==='ArrowLeft')  prevCard();
  if ((e.key===' '||e.key==='Enter') && (currentMode==='flip'||currentMode==='spaced')) { e.preventDefault(); flipCard(); }
  if (e.key==='y'||e.key==='j') markAnswer(true);
  if (e.key==='n') markAnswer(false);
  if (e.key==='Escape') goHome();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
initDarkMode();
initUser();
