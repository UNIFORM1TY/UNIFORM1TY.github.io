/* ============================================================
   Uniformity — application layer
   i18n · theme · command palette · live flow · real terminal ·
   live GitHub · animated pipeline · canvas object wiring
   ============================================================ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = window.__I18N__ || {};
  var LANG = 'en';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tr(k) {
    var d = T[LANG] || {}, e = T.en || {};
    return d[k] !== undefined ? d[k] : (e[k] !== undefined ? e[k] : k);
  }

  /* ---------------- theme ---------------- */
  var OBJ_COLORS = {
    dark:  { core: '#2DD4E8', mid: '#8B7CF6', outer: '#5A6379', wire: '#8B93A7' },
    light: { core: '#0891B2', mid: '#6D5CE7', outer: '#9AA2B4', wire: '#68718A' }
  };
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (window.__obj && OBJ_COLORS[t]) window.__obj.setColors(OBJ_COLORS[t]);
    try { localStorage.setItem('uniformity-theme', t); } catch (e) {}
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('uniformity-theme'); } catch (e) {}
  applyTheme(savedTheme || 'dark');

  /* ---------------- progress + nav ---------------- */
  var nav = $('nav'), prog = $('prog');
  addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', scrollY > 12);
    var h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  /* ---------------- reveal ---------------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
    io.observe(el);
  });

  /* ---------------- toast ---------------- */
  var tt;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2100);
  }

  /* ---------------- canvas object ---------------- */
  var cv = $('object');
  if (cv && window.UniformityObject) {
    var th = document.documentElement.getAttribute('data-theme');
    window.__obj = new window.UniformityObject(cv, OBJ_COLORS[th] || OBJ_COLORS.dark);
  }
  $('theme-btn').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    toast(tr(next === 'dark' ? 'theme_dark' : 'theme_light'));
  });

  /* ---------------- pipeline + grammar ---------------- */
  var G = [
    { k: 'Object',       lk: 'g_object_k',   t: 'g_obj_t',      p: 'g_obj_p',      m: 'object_id · juno106-7f3a91c4' },
    { k: 'State',        lk: 'g_state_k',    t: 'g_state_t',    p: 'g_state_p',    m: 'rev 1 → rev 2 on verified completion' },
    { k: 'Signal',       lk: 'g_signal_k',   t: 'g_signal_t',   p: 'g_signal_p',   m: 'event · signal.detected' },
    { k: 'Evidence',     lk: 'g_evidence_k', t: 'g_evidence_t', p: 'g_evidence_p', m: 'revision-aware · permission-scoped · provenance-bearing' },
    { k: 'Intelligence', lk: 'g_intel_k',    t: 'g_intel_t',    p: 'g_intel_p',    m: 'Fridge Brain · POST /v1/assessments' },
    { k: 'Action',       lk: 'g_action_k',   t: 'g_action_t',   p: 'g_action_p',   m: 'action.accepted → action.started → action.completed' },
    { k: 'Verification', lk: 'g_verif_k',    t: 'g_verif_t',    p: 'g_verif_p',    m: 'appends verified evidence · updates state exactly once' },
    { k: 'History',      lk: 'g_hist_k',     t: 'g_hist_t',     p: 'g_hist_p',     m: 'terminal state · action.completed' }
  ];
  var gBody = $('gram-body'), gIndex = 0, pipeIn = $('pipe-in');
  pipeIn.innerHTML = G.map(function (g, i) {
    return (i ? '<span class="pipe-conn" data-conn="' + (i - 1) + '"></span>' : '') +
      '<button class="pipe-node" role="tab" aria-selected="' + (i === 0) + '" data-g="' + i + '">' +
      '<span class="pipe-dot">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="pipe-lbl" data-i18n="' + g.lk + '">' + g.k + '</span></button>';
  }).join('');

  function drawGram(i) {
    gIndex = i;
    var g = G[i];
    gBody.innerHTML = '<h3>' + tr(g.t) + '</h3><p>' + tr(g.p) + '</p><div class="meta">' + g.m + '</div>';
    gBody.classList.remove('fade'); void gBody.offsetWidth; gBody.classList.add('fade');
    document.querySelectorAll('.pipe-node').forEach(function (b) {
      var idx = +b.dataset.g;
      b.setAttribute('aria-selected', String(idx === i));
      var c = b.previousElementSibling;
      if (c && c.classList.contains('pipe-conn')) {
        c.classList.toggle('flow', idx === i + 1);
        c.classList.toggle('done', idx <= i);
      }
    });
  }
  pipeIn.addEventListener('click', function (e) {
    var b = e.target.closest('.pipe-node'); if (!b) return;
    drawGram(+b.dataset.g);
  });

  /* ---------------- i18n ---------------- */
  function applyLang(lang) {
    LANG = T[lang] ? lang : 'en';
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'); if (k) el.textContent = tr(k);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (k && T[LANG] && T[LANG][k] !== undefined) el.innerHTML = T[LANG][k];
    });
    $('lang-cur').textContent = LANG.toUpperCase();
    document.querySelectorAll('.lang-item').forEach(function (b) {
      b.setAttribute('aria-current', b.dataset.lang === LANG ? 'true' : 'false');
    });
    drawGram(gIndex); render(); buildPalette(); renderTerminal();
    try { localStorage.setItem('uniformity-lang', LANG); } catch (e) {}
  }
  var menu = $('lang-menu'), langWrap = $('lang');
  menu.innerHTML = ['en', 'fr', 'es'].filter(function (l) { return T[l]; }).map(function (l) {
    return '<button class="lang-item" role="option" data-lang="' + l + '" aria-current="false"><span>' +
      (T[l].lang_name || l) + '</span><span class="code">' + l + '</span></button>';
  }).join('');
  $('lang-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    var open = langWrap.dataset.open === 'true';
    langWrap.dataset.open = open ? 'false' : 'true';
    $('lang-btn').setAttribute('aria-expanded', String(!open));
  });
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('.lang-item'); if (!b) return;
    applyLang(b.dataset.lang);
    langWrap.dataset.open = 'false'; $('lang-btn').setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', function () {
    langWrap.dataset.open = 'false'; $('lang-btn').setAttribute('aria-expanded', 'false');
  });

  /* ---------------- live reference flow ---------------- */
  var STATE = { stage: 'signal', rev: 1, events: ['created', 'signal.detected'], proj: 'matt' };
  var SK = { signal: 'st_signal', accepted: 'st_accepted', started: 'st_started', done: 'st_done' };
  var SC = { signal: '', accepted: 'active', started: 'active', done: 'done' };
  function line(k, v) { return '<div class="proj-line"><span>' + k + '</span><span>' + v + '</span></div>'; }
  function projHTML(k) {
    var done = STATE.stage === 'done', acc = STATE.stage !== 'signal';
    if (k === 'matt') return '<div class="pl">matt · technical bench</div>' + line('object_id', 'juno106-7f3a91c4') + line('signal', 'voice board — intermittent') + line('reason', 'CEM3340 drift, thermal') + line('evidence', 'rev ' + STATE.rev + ' · 3 items') + line('action', acc ? (done ? 'completed · verified' : STATE.stage) : 'awaiting acceptance') + line('trace', done ? 'full trace available' : 'trace partial');
    if (k === 'susanna') return '<div class="pl">susanna · operational</div>' + line('status', done ? 'Board repaired' : (acc ? 'In progress' : 'Reported')) + line('blocker', acc ? 'none' : 'awaiting acceptance') + line('next step', done ? 'Return to customer' : (STATE.stage === 'started' ? 'Bench work underway' : 'Accept the action')) + line('who acts', done ? '—' : 'Matt') + line('object', 'juno106-7f3a91c4');
    if (k === 'customer') return '<div class="pl">customer · safe view</div>' + line('item', 'JUNO-106') + line('status', done ? 'Repair complete' : (acc ? 'In progress' : 'Received')) + line('your action', done ? 'Approve collection' : 'None required') + line('eta', done ? 'ready' : 'in workshop');
    return '<div class="pl">logarhythm · public</div>' + line('story', 'JUNO-106 · voice board') + line('theme', 'thermal drift in a 1984 classic') + line('workshop', 'private intelligence withheld') + line('status', 'narrative draft');
  }
  function render() {
    var pill = $('pill'); if (!pill) return;
    pill.className = 'state-pill ' + SC[STATE.stage];
    $('pill-text').textContent = tr(SK[STATE.stage]);
    $('rev').textContent = tr('rev') + ' ' + STATE.rev;
    $('hist-log').innerHTML = STATE.events.map(function (e) {
      return '<span class="ev' + (e === 'action.completed' ? ' final' : '') + '">' + e + '</span>';
    }).join('');
    $('hist-count').textContent = '· ' + STATE.events.length + ' ' + tr('events');
    $('proj-body').innerHTML = projHTML(STATE.proj);
    $('btn-accept').disabled = STATE.stage !== 'signal';
    $('btn-start').disabled = STATE.stage !== 'accepted';
    $('btn-complete').disabled = STATE.stage !== 'started';
    $('btn-brain').disabled = STATE.stage === 'done';
    // drive the pipeline highlight from the real flow
    var map = { signal: 3, accepted: 5, started: 5, done: 7 };
    var idx = map[STATE.stage];
    document.querySelectorAll('.pipe-node').forEach(function (b) {
      b.classList.toggle('lit', +b.dataset.g === idx);
    });
  }
  $('btn-accept').addEventListener('click', function () { if (STATE.stage !== 'signal') return; STATE.stage = 'accepted'; STATE.events.push('action.accepted'); render(); toast('action.accepted → state advanced'); });
  $('btn-start').addEventListener('click', function () { if (STATE.stage !== 'accepted') return; STATE.stage = 'started'; STATE.events.push('action.started'); render(); toast('action.started → bench work'); });
  $('btn-complete').addEventListener('click', function () { if (STATE.stage !== 'started') return; STATE.stage = 'done'; STATE.rev = 2; STATE.events.push('evidence.verified', 'action.completed'); render(); toast('rev 2 · verified · action.completed'); });
  $('btn-reset').addEventListener('click', function () { STATE = { stage: 'signal', rev: 1, events: ['created', 'signal.detected'], proj: STATE.proj }; $('brain-out').textContent = tr('brain_idle'); $('brain-warn').classList.remove('on'); render(); toast('reset to rev 1'); });
  document.querySelectorAll('.proj-tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.proj-tab').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      b.setAttribute('aria-selected', 'true'); STATE.proj = b.dataset.p; render();
    });
  });
  $('btn-copy').addEventListener('click', function () {
    var id = 'juno106-7f3a91c4';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(id).then(function () { toast(tr('copied') + ' · ' + id); });
    else toast(id);
  });
  $('btn-brain').addEventListener('click', function () {
    var out = $('brain-out');
    out.innerHTML = '<span class="hyp">Retrieving governed evidence for revision ' + STATE.rev + '…</span>';
    setTimeout(function () {
      var before = JSON.stringify(STATE.events);
      out.innerHTML = '<span class="hyp"><b>Hypothesis 1</b> · thermal drift in the CEM3340 VCO — confidence <b>0.72</b></span><span class="hyp"><b>Hypothesis 2</b> · failing electrolytic in the PSU rail — confidence <b>0.41</b></span><span class="hyp"><b>Missing</b> · bench temperature log; rail ripple measurement</span><span class="hyp"><b>Proposed next action</b> · reflow VCO pins and re-measure drift — <b>awaiting domain acceptance</b></span>';
      if (JSON.stringify(STATE.events) === before) $('brain-warn').classList.add('on');
    }, 620);
  });

  /* ---------------- REAL TERMINAL ---------------- */
  /* Captured from `node --test` in the canonical repository. */
  var TERM_SCRIPT = {
    en: [
      ['p', '$ ', 'c', 'node --test'],
      ['dim', ' ', 'dim', 'TAP version 13 · node v22 · local-first'],
      ['ok', '✔ ', 'c', 'creates JUNO-106 as one canonical object with a stable object_id'],
      ['ok', '✔ ', 'c', 'records immutable signal evidence against the canonical JUNO object'],
      ['ok', '✔ ', 'c', 'completes a JUNO diagnostic action and updates canonical state from one event'],
      ['ok', '✔ ', 'c', 'projects the same JUNO object differently for Matt and Susanna'],
      ['ok', '✔ ', 'c', 'authorised Matt accepts a Fridge Brain proposal as a ready action with an audit event'],
      ['ok', '✔ ', 'c', 'a proposal cannot be accepted by someone other than its proposed owner'],
      ['ok', '✔ ', 'c', 'runtime contract rejects intelligence mutation authority'],
      ['ok', '✔ ', 'c', 'SUBANGEL rejects non-instrument domain objects such as RESELL inventory'],
      ['ok', '✔ ', 'c', 'Matt and Susanna runtime envelopes share canonical state but expose different projections'],
      ['dim', '  ', 'dim', '… 81 more'],
      ['dim', ' ', 'dim', 'ℹ tests 91   suites 0   pass 91   fail 0   duration_ms 4240.9'],
      ['ok', '✔ ', 'ok', '91 / 91 passing'],
      ['p', '$ ', 'c', 'git log --oneline -1'],
      ['c', '  ', 'c', 'b014b39  fix(juno-web): restore clean page() and fix /api/juno route'],
      ['p', '$ ', 'c', '']
    ],
    fr: [
      ['p', '$ ', 'c', 'node --test'],
      ['dim', ' ', 'dim', 'TAP version 13 · node v22 · local d\'abord'],
      ['ok', '✔ ', 'c', 'crée JUNO-106 comme un objet canonique unique avec un object_id stable'],
      ['ok', '✔ ', 'c', 'enregistre une preuve de signal immuable sur l\'objet JUNO canonique'],
      ['ok', '✔ ', 'c', 'termine une action de diagnostic JUNO et met à jour l\'état canonique depuis un seul événement'],
      ['ok', '✔ ', 'c', 'projette le même objet JUNO différemment pour Matt et Susanna'],
      ['ok', '✔ ', 'c', 'Matt autorisé accepte une proposition de Fridge Brain comme action prête avec un événement d\'audit'],
      ['ok', '✔ ', 'c', 'une proposition ne peut pas être acceptée par quelqu\'un d\'autre que son propriétaire'],
      ['ok', '✔ ', 'c', 'le contrat runtime rejette toute autorité de mutation de l\'intelligence'],
      ['ok', '✔ ', 'c', 'SUBANGEL rejette les objets de domaine non-instrument comme l\'inventaire RESELL'],
      ['ok', '✔ ', 'c', 'les enveloppes runtime de Matt et Susanna partagent l\'état canonique mais exposent des projections différentes'],
      ['dim', '  ', 'dim', '… 81 de plus'],
      ['dim', ' ', 'dim', 'ℹ tests 91   suites 0   réussis 91   échecs 0   durée_ms 4240.9'],
      ['ok', '✔ ', 'ok', '91 / 91 réussis'],
      ['p', '$ ', 'c', 'git log --oneline -1'],
      ['c', '  ', 'c', 'b014b39  fix(juno-web): restaure un page() propre et corrige la route /api/juno'],
      ['p', '$ ', 'c', '']
    ],
    es: [
      ['p', '$ ', 'c', 'node --test'],
      ['dim', ' ', 'dim', 'TAP version 13 · node v22 · local primero'],
      ['ok', '✔ ', 'c', 'crea JUNO-106 como un objeto canónico único con un object_id estable'],
      ['ok', '✔ ', 'c', 'registra evidencia de señal inmutable sobre el objeto JUNO canónico'],
      ['ok', '✔ ', 'c', 'completa una acción de diagnóstico JUNO y actualiza el estado canónico desde un solo evento'],
      ['ok', '✔ ', 'c', 'proyecta el mismo objeto JUNO de forma distinta para Matt y Susanna'],
      ['ok', '✔ ', 'c', 'Matt autorizado acepta una propuesta de Fridge Brain como acción lista con un evento de auditoría'],
      ['ok', '✔ ', 'c', 'una propuesta no puede ser aceptada por alguien distinto de su propietario'],
      ['ok', '✔ ', 'c', 'el contrato de runtime rechaza la autoridad de mutación de la inteligencia'],
      ['ok', '✔ ', 'c', 'SUBANGEL rechaza objetos de dominio no-instrumento como el inventario de RESELL'],
      ['ok', '✔ ', 'c', 'los sobres de runtime de Matt y Susanna comparten estado canónico pero exponen proyecciones distintas'],
      ['dim', '  ', 'dim', '… 81 más'],
      ['dim', ' ', 'dim', 'ℹ tests 91   suites 0   pasan 91   fallan 0   duración_ms 4240.9'],
      ['ok', '✔ ', 'ok', '91 / 91 superadas'],
      ['p', '$ ', 'c', 'git log --oneline -1'],
      ['c', '  ', 'c', 'b014b39  fix(juno-web): restaura page() limpio y corrige la ruta /api/juno'],
      ['p', '$ ', 'c', '']
    ]
  };
  var termBody = $('term-body');
  var termTimers = [];
  function renderTerminal() {
    termTimers.forEach(clearTimeout); termTimers = [];
    var script = TERM_SCRIPT[LANG] || TERM_SCRIPT.en;
    if (reduced) {
      termBody.innerHTML = script.map(function (l) {
        return '<span class="term-line"><span class="' + l[0] + '">' + l[1] + '</span><span class="' + l[2] + '">' + l[3] + '</span></span>';
      }).join('') + '<span class="term-line"><span class="caret"></span></span>';
      return;
    }
    termBody.innerHTML = '';
    var i = 0;
    function step() {
      if (i >= script.length) {
        termBody.insertAdjacentHTML('beforeend', '<span class="term-line"><span class="caret"></span></span>');
        return;
      }
      var l = script[i++];
      termBody.insertAdjacentHTML('beforeend', '<span class="term-line"><span class="' + l[0] + '">' + l[1] + '</span><span class="' + l[2] + '">' + l[3] + '</span></span>');
      termBody.parentElement.scrollTop = termBody.parentElement.scrollHeight;
      termTimers.push(setTimeout(step, l[1].indexOf('$') === 0 ? 420 : 90));
    }
    step();
  }
  $('term-copy').addEventListener('click', function () {
    var txt = (TERM_SCRIPT[LANG] || TERM_SCRIPT.en).map(function (l) { return l[1] + l[3]; }).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast(tr('term_copied')); });
    else toast(tr('term_copied'));
  });
  // replay when scrolled into view
  if ('IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { renderTerminal(); tio.disconnect(); }
    }, { threshold: .25 });
    tio.observe($('terminal'));
  } else { renderTerminal(); }

  /* ---------------- LIVE GITHUB ---------------- */
  var LANG_COLOR = { TypeScript: '#3178C6', JavaScript: '#F1E05A', Python: '#3572A5', CSS: '#563D7C', HTML: '#E34C26', Shell: '#89E051', Rust: '#DEA584', Go: '#00ADD8' };
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm';
    if (s < 86400) return Math.round(s / 3600) + 'h';
    if (s < 2592000) return Math.round(s / 86400) + 'd';
    return Math.round(s / 2592000) + 'mo';
  }
  function repoCard(r) {
    var col = LANG_COLOR[r.language] || '#2DD4E8';
    return '<a class="repo" href="' + r.html_url + '" target="_blank" rel="noopener">' +
      '<div class="repo-top"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5z"/></svg>' +
      '<span class="repo-name">' + r.name + '</span></div>' +
      '<div class="repo-desc">' + (r.description ? r.description.replace(/</g, '&lt;') : '<span style="color:var(--fg-4)">—</span>') + '</div>' +
      '<div class="repo-meta">' +
      (r.language ? '<span class="lg"><i style="background:' + col + '"></i>' + r.language + '</span>' : '') +
      '<span>★ ' + r.stargazers_count + '</span><span>' + ago(r.pushed_at) + '</span></div></a>';
  }
  fetch('https://api.github.com/orgs/UNIFORM1TY/repos?per_page=100&sort=pushed', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      var repos = (d || []).filter(function (x) { return !x.archived; }).slice(0, 6);
      if (!repos.length) throw new Error('empty');
      $('live-grid').innerHTML = repos.map(repoCard).join('');
      $('live-msg').textContent = tr('live_ok').replace('{n}', repos.length);
    })
    .catch(function () {
      $('live-grid').innerHTML = '<div class="repo"><div class="repo-name">uniformity-os</div><div class="repo-desc">The operating system / composition layer.</div><div class="repo-meta"><span>private</span></div></div>';
      $('live-msg').textContent = tr('live_fail');
    });

  /* ---------------- COMMAND PALETTE ---------------- */
  var pal = $('palette'), palInput = $('pal-input'), palList = $('pal-list');
  var palItems = [], palSel = 0;
  function go(h) { closePal(); location.hash = h; var el = document.querySelector(h); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  function buildPalette() {
    palItems = [
      { ic: '§', label: tr('nav_model'), sub: '#model', act: function () { go('#model'); } },
      { ic: '▸', label: tr('nav_demo'), sub: '#demo', act: function () { go('#demo'); } },
      { ic: '$', label: tr('nav_term'), sub: '#terminal', act: function () { go('#terminal'); } },
      { ic: '★', label: tr('nav_live'), sub: '#live', act: function () { go('#live'); } },
      { ic: '⌗', label: tr('nav_arch'), sub: '#architecture', act: function () { go('#architecture'); } },
      { ic: '→', label: tr('pal_accept'), sub: 'demo', act: function () { go('#demo'); $('btn-accept').click(); } },
      { ic: '→', label: tr('pal_start'), sub: 'demo', act: function () { go('#demo'); $('btn-start').click(); } },
      { ic: '✓', label: tr('pal_complete'), sub: 'demo', act: function () { go('#demo'); $('btn-complete').click(); } },
      { ic: '✦', label: tr('pal_brain'), sub: 'advisory', act: function () { go('#demo'); $('btn-brain').click(); } },
      { ic: '◐', label: tr('theme_toggle'), sub: 'ui', act: function () { $('theme-btn').click(); } },
      { ic: '⌘', label: tr('pal_gh'), sub: 'github', act: function () { window.open('https://github.com/UNIFORM1TY', '_blank'); } },
      { ic: '⌘', label: tr('pal_site'), sub: 'site', act: function () { window.open('https://uniform1ty.github.io', '_blank'); } }
    ];
    Object.keys(T).forEach(function (l) {
      if (!T[l] || !T[l].lang_name) return;
      palItems.push({ ic: '⌾', label: T[l].lang_name, sub: l, act: function () { applyLang(l); toast(T[l].lang_name); } });
    });
    renderPal();
  }
  function renderPal() {
    var q = palInput.value.trim().toLowerCase();
    var list = palItems.filter(function (i) {
      return !q || i.label.toLowerCase().indexOf(q) > -1 || i.sub.toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) { palList.innerHTML = '<div class="pal-empty">' + tr('pal_none') + '</div>'; return; }
    if (palSel >= list.length) palSel = 0;
    palList.innerHTML = list.map(function (i, n) {
      return '<button class="pal-item' + (n === palSel ? ' sel' : '') + '" role="option" data-n="' + n + '">' +
        '<span class="pi-ico">' + i.ic + '</span><span>' + i.label + '</span><span class="pi-sub">' + i.sub + '</span></button>';
    }).join('');
    palList._list = list;
  }
  function openPal() { pal.classList.add('on'); palInput.value = ''; palSel = 0; renderPal(); setTimeout(function () { palInput.focus(); }, 30); }
  function closePal() { pal.classList.remove('on'); }
  $('pal-open').addEventListener('click', openPal);
  pal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-pal-close')) closePal(); });
  palList.addEventListener('click', function (e) {
    var b = e.target.closest('.pal-item'); if (!b) return;
    var item = palList._list[+b.dataset.n]; if (item) item.act();
  });
  palInput.addEventListener('input', function () { palSel = 0; renderPal(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('on') ? closePal() : openPal(); return; }
    if (e.key === 'Escape') { closePal(); langWrap.dataset.open = 'false'; }
    if (!pal.classList.contains('on')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, (palList._list || []).length - 1); renderPal(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); renderPal(); }
    if (e.key === 'Enter') { e.preventDefault(); var it = (palList._list || [])[palSel]; if (it) it.act(); }
  });

  /* ---------------- metric count-up ---------------- */
  var mio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = +el.dataset.count, n = 0, step = Math.max(1, Math.round(target / 26));
      (function tick() { n += step; if (n >= target) { el.textContent = target; return; } el.textContent = n; requestAnimationFrame(tick); })();
      mio.unobserve(el);
    });
  }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { mio.observe(el); });

  /* ---------------- boot ---------------- */
  var saved = null; try { saved = localStorage.getItem('uniformity-lang'); } catch (e) {}
  var initial = saved || (navigator.language || 'en').slice(0, 2).toLowerCase();
  applyLang(T[initial] ? initial : 'en');
  var m = location.search.match(/[?&]lang=([a-z]{2})/i);
  if (m && T[m[1].toLowerCase()]) applyLang(m[1].toLowerCase());
})();
