/* EOT Prep — multiple choice practice tests */

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const $ = id => document.getElementById(id);

const store = {
  read(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
};

const state = {
  manifest: [],
  banks: {},        // id -> bank object
  bank: null,       // active bank
  questions: [],    // active run
  answers: [],      // index picked per question, or null
  i: 0,
  mode: 'test',
  shuffle: true,
  length: 'all'
};

/* ---------- helpers ---------- */

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(name) {
  ['home', 'quiz', 'results'].forEach(v => { $('view-' + v).hidden = (v !== name); });
  window.scrollTo(0, 0);
}

function progressKey(id) { return 'eot:progress:' + id; }

/* ---------- load ---------- */

async function boot() {
  try {
    const res = await fetch('variants/manifest.json');
    if (!res.ok) throw new Error('manifest ' + res.status);
    const manifest = await res.json();
    state.manifest = manifest.variants;

    for (const v of state.manifest) {
      const r = await fetch('variants/' + v.file);
      if (!r.ok) throw new Error(v.file + ' ' + r.status);
      const bank = await r.json();
      state.banks[bank.id] = bank;
      v.id = bank.id;
    }
    renderHome();
  } catch (err) {
    $('variantList').innerHTML =
      '<p class="err">Couldn\'t load the question files (' + err.message + ').<br>' +
      'Open this through a web server — GitHub Pages, or <code>python3 -m http.server</code> locally. ' +
      'Opening index.html directly from disk blocks the file loads.</p>';
  }
}

/* ---------- home ---------- */

function renderHome() {
  const wrap = $('variantList');
  wrap.innerHTML = '';
  state.manifest.forEach(v => {
    const bank = state.banks[v.id];
    const prog = store.read(progressKey(v.id), null);
    const btn = document.createElement('button');
    btn.className = 'variant';
    btn.innerHTML =
      '<span class="variant-top">' +
        '<span class="variant-name"></span>' +
        '<span class="variant-count">' + bank.questions.length + ' questions</span>' +
      '</span>' +
      '<p class="variant-blurb"></p>' +
      (prog ? '<p class="variant-best">Best <b>' + prog.best + '%</b> · last ' + prog.last + '%' +
        (prog.weak ? ' · weakest: ' + prog.weak : '') + '</p>' : '');
    btn.querySelector('.variant-name').textContent = bank.title;
    btn.querySelector('.variant-blurb').textContent = bank.blurb;
    btn.addEventListener('click', () => openSetup(v.id));
    wrap.appendChild(btn);
  });
  $('setupPanel').hidden = true;
}

function openSetup(id) {
  state.bank = state.banks[id];
  $('setupTitle').textContent = state.bank.title;
  $('setupBlurb').textContent = state.bank.blurb;
  const missed = store.read('eot:missed:' + id, []);
  const weakBtn = $('startWeakBtn');
  weakBtn.hidden = missed.length === 0;
  weakBtn.textContent = 'Retry my ' + missed.length + ' missed question' + (missed.length === 1 ? '' : 's');
  $('setupPanel').hidden = false;
  $('setupPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function wireSeg(segId, attr, apply) {
  $(segId).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    [...$(segId).children].forEach(c => c.classList.toggle('on', c === b));
    apply(b.dataset[attr]);
  });
}

/* ---------- run a test ---------- */

function startTest(pool) {
  let qs = pool || state.bank.questions.slice();
  if (state.shuffle) qs = shuffled(qs);
  if (!pool && state.length !== 'all') qs = qs.slice(0, Number(state.length));

  state.questions = qs;
  state.answers = new Array(qs.length).fill(null);
  state.i = 0;
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = state.questions[state.i];
  const total = state.questions.length;
  $('counter').textContent = (state.i + 1) + ' / ' + total;
  $('topicTag').textContent = q.topic;
  $('trackFill').style.width = ((state.i) / total * 100) + '%';
  $('questionText').textContent = q.q;

  const picked = state.answers[state.i];
  const reveal = state.mode === 'practice' && picked !== null;

  const box = $('choices');
  box.innerHTML = '';
  q.choices.forEach((text, idx) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.type = 'button';
    b.innerHTML = '<span class="key">' + KEYS[idx] + '</span><span class="body"></span>';
    b.querySelector('.body').textContent = text;

    if (reveal) {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('correct');
      else if (idx === picked) b.classList.add('wrong');
    } else if (idx === picked) {
      b.classList.add('picked');
    }
    b.addEventListener('click', () => pick(idx));
    box.appendChild(b);
  });

  const fb = $('feedback');
  if (reveal) {
    const right = picked === q.answer;
    fb.className = 'feedback ' + (right ? 'right' : 'miss');
    fb.innerHTML = '<span class="verdict"></span><span class="why"></span>';
    fb.querySelector('.verdict').textContent = right ? 'Correct' : 'Not quite — the answer is ' + KEYS[q.answer];
    fb.querySelector('.why').textContent = q.why;
    fb.hidden = false;
  } else {
    fb.hidden = true;
  }

  $('prevBtn').disabled = state.i === 0;
  $('nextBtn').textContent = state.i === total - 1 ? 'Finish and score' : 'Next';
  $('nextBtn').disabled = picked === null;
}

function pick(idx) {
  if (state.mode === 'practice' && state.answers[state.i] !== null) return;
  state.answers[state.i] = idx;
  renderQuestion();
}

function next() {
  if (state.answers[state.i] === null) return;
  if (state.i === state.questions.length - 1) return finish();
  state.i++;
  renderQuestion();
}

function prev() {
  if (state.i === 0) return;
  state.i--;
  renderQuestion();
}

/* ---------- results ---------- */

function finish() {
  const qs = state.questions;
  const misses = [];
  const topics = {};
  let correct = 0;

  qs.forEach((q, i) => {
    const right = state.answers[i] === q.answer;
    if (right) correct++; else misses.push({ q, picked: state.answers[i] });
    const t = topics[q.topic] || (topics[q.topic] = { ok: 0, n: 0 });
    t.n++; if (right) t.ok++;
  });

  const pct = Math.round(correct / qs.length * 100);
  $('scoreNum').textContent = pct + '%';
  $('scoreSub').textContent = correct + ' of ' + qs.length + ' correct';
  $('resultTitle').textContent = state.bank.title;

  const rows = Object.entries(topics).map(([name, t]) => ({
    name, pct: Math.round(t.ok / t.n * 100), ok: t.ok, n: t.n
  })).sort((a, b) => a.pct - b.pct || b.n - a.n);

  const weakest = rows.filter(r => r.pct < 100).slice(0, 2).map(r => r.name);
  $('resultVerdict').textContent = weakest.length
    ? 'Spend your next session on ' + weakest.join(' and ') + '.'
    : 'Clean sweep. Run it again shuffled, or move to another bank.';

  // topic breakdown
  const tb = $('topicBreakdown');
  tb.innerHTML = '';
  rows.forEach(r => {
    const div = document.createElement('div');
    div.className = 'topic-row ' + (r.pct < 60 ? 'weak' : r.pct < 85 ? 'mid' : '');
    div.innerHTML =
      '<span class="topic-name"></span>' +
      '<span class="topic-score">' + r.ok + '/' + r.n + ' · ' + r.pct + '%</span>' +
      '<span class="topic-bar"><i style="width:' + r.pct + '%"></i></span>';
    div.querySelector('.topic-name').textContent = r.name;
    tb.appendChild(div);
  });

  // missed questions
  const ml = $('missList');
  ml.innerHTML = '';
  $('missHead').textContent = misses.length
    ? 'What you got wrong (' + misses.length + ')'
    : 'What you got wrong';
  if (!misses.length) {
    ml.innerHTML = '<p class="perfect">Nothing missed on this run.</p>';
  }
  misses.forEach(m => {
    const d = document.createElement('div');
    d.className = 'miss';
    d.innerHTML =
      '<p class="m-topic"></p><p class="m-q"></p>' +
      '<dl><dt>You said</dt><dd class="yours"></dd>' +
      '<dt>Answer</dt><dd class="right"></dd></dl>' +
      '<p class="m-why"></p>';
    d.querySelector('.m-topic').textContent = m.q.topic;
    d.querySelector('.m-q').textContent = m.q.q;
    d.querySelector('.yours').textContent =
      m.picked === null ? 'No answer' : KEYS[m.picked] + '. ' + m.q.choices[m.picked];
    d.querySelector('.right').textContent = KEYS[m.q.answer] + '. ' + m.q.choices[m.q.answer];
    d.querySelector('.m-why').textContent = m.q.why;
    ml.appendChild(d);
  });

  // persist
  const id = state.bank.id;
  const prev = store.read(progressKey(id), { best: 0 });
  store.write(progressKey(id), {
    best: Math.max(prev.best || 0, pct),
    last: pct,
    weak: weakest[0] || '',
    at: new Date().toISOString()
  });
  store.write('eot:missed:' + id, misses.map(m => m.q.q));

  state.lastMisses = misses.map(m => m.q);
  $('retryMissedBtn').hidden = misses.length === 0;
  show('results');
}

/* ---------- wiring ---------- */

wireSeg('lengthSeg', 'len', v => state.length = v);
wireSeg('modeSeg', 'mode', v => state.mode = v);
wireSeg('shuffleSeg', 'shuffle', v => state.shuffle = (v === 'on'));

$('startBtn').addEventListener('click', () => startTest(null));
$('cancelSetup').addEventListener('click', () => { $('setupPanel').hidden = true; });
$('startWeakBtn').addEventListener('click', () => {
  const texts = store.read('eot:missed:' + state.bank.id, []);
  const pool = state.bank.questions.filter(q => texts.includes(q.q));
  if (pool.length) startTest(pool);
});

$('nextBtn').addEventListener('click', next);
$('prevBtn').addEventListener('click', prev);
$('quitBtn').addEventListener('click', () => { renderHome(); show('home'); });

$('retryMissedBtn').addEventListener('click', () => {
  if (state.lastMisses && state.lastMisses.length) startTest(state.lastMisses);
});
$('retakeBtn').addEventListener('click', () => startTest(null));
$('backHomeBtn').addEventListener('click', () => { renderHome(); show('home'); });
$('homeLink').addEventListener('click', e => { e.preventDefault(); renderHome(); show('home'); });

// keyboard: A-D to pick, Enter to advance
document.addEventListener('keydown', e => {
  if ($('view-quiz').hidden) return;
  const k = e.key.toUpperCase();
  const idx = KEYS.indexOf(k);
  if (idx > -1 && idx < state.questions[state.i].choices.length) { pick(idx); return; }
  if (e.key === 'Enter' && !$('nextBtn').disabled) next();
});

boot();
