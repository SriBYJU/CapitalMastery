(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const PASS = 80;
  const ALIASES = { fpa:'fp-and-a', 'fp-a':'fp-and-a', 'fp&a':'fp-and-a' };
  let domScheduled = false;
  let routeEpoch = 0;
  let lastRaceRepair = '';

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parts(hash=location.hash) {
    return String(hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function qaMode() { return localStorage.getItem(QA_KEY) === 'true'; }
  function apiPathway(id) { return ALIASES[id] || id; }

  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return s && s.version === 1 ? s : null;
    } catch (_) { return null; }
  }

  function sanitizeCareer(cs) {
    if (!cs || typeof cs !== 'object') return;
    cs.completedParts = Array.isArray(cs.completedParts) ? [...new Set(cs.completedParts.map(Number).filter(Number.isFinite))] : [];
    if (Number(cs.simulationScore || 0) < PASS) cs.completedParts = cs.completedParts.filter(n => n !== 5);
    cs.completedParts.sort((a,b)=>a-b);
  }

  function sanitizeState(s) {
    if (!s || s.version !== 1) return s;
    Object.values(s.careers || {}).forEach(sanitizeCareer);
    return s;
  }

  function installStateGuard() {
    if (Storage.prototype.__cmAuditStateGuard) return;
    const previous = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, '__cmAuditStateGuard', { value:true, configurable:false });
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && key === STATE_KEY) {
        try {
          const parsed = JSON.parse(value);
          if (parsed?.version === 1) {
            sanitizeState(parsed);
            parsed.updatedAt = new Date().toISOString();
            value = JSON.stringify(parsed);
          }
        } catch (_) {}
      }
      return previous.call(this, key, value);
    };

    const current = readState();
    if (current) localStorage.setItem(STATE_KEY, JSON.stringify(current));
  }

  async function token() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function fetchProgress(pathway) {
    const t = await token();
    if (!t) throw new Error('Not signed in.');
    const response = await fetch(`${API}/progress/${encodeURIComponent(apiPathway(pathway))}`, { headers:{ Authorization:`Bearer ${t}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Progress request failed (${response.status})`);
    return Array.isArray(data.progress) ? data.progress : [];
  }

  function applyOfficial(state, pathway, rows) {
    state.careers ||= {};
    state.careers[pathway] ||= { learningComplete:[], completedParts:[], quizScores:{}, simulationKnowledge:null, simulationScore:null, finalScore:null, applied:{}, simResponses:{}, readiness:null };
    const cs = state.careers[pathway];
    cs.learningComplete = Array.isArray(cs.learningComplete) ? [...new Set(cs.learningComplete.map(Number).filter(Number.isFinite))] : [];
    cs.applied ||= {};
    cs.simResponses ||= {};
    const before = JSON.stringify({ completedParts:cs.completedParts, quizScores:cs.quizScores, simulationKnowledge:cs.simulationKnowledge, simulationScore:cs.simulationScore, finalScore:cs.finalScore, learningComplete:cs.learningComplete });

    const by = Object.fromEntries(rows.map(r => [String(r.item_id || ''), r]));
    const quizScores = {};
    const completed = [];
    for (let p=1; p<=4; p++) {
      const row = by[`part-${p}`];
      if (!row) continue;
      const score = Number(row.best_score || 0);
      if (score > 0) quizScores[p] = score;
      if (Number(row.completed) === 1 && score >= PASS) {
        completed.push(p);
        if (!cs.learningComplete.includes(p)) cs.learningComplete.push(p);
      }
    }

    const knowledge = by['part-5'];
    const knowledgeScore = knowledge ? Number(knowledge.best_score || 0) : 0;
    if (knowledge && Number(knowledge.completed) === 1 && knowledgeScore >= PASS && !cs.learningComplete.includes(5)) cs.learningComplete.push(5);

    const sim = by.simulation;
    const simScore = sim ? Number(sim.best_score || 0) : 0;
    if (sim && Number(sim.completed) === 1 && simScore >= PASS) {
      completed.push(5);
      if (!cs.learningComplete.includes(5)) cs.learningComplete.push(5);
    }

    const final = by.final;
    cs.quizScores = quizScores;
    cs.completedParts = completed;
    cs.simulationKnowledge = knowledgeScore || null;
    cs.simulationScore = simScore || null;
    cs.finalScore = final ? Number(final.best_score || 0) || null : null;
    cs.learningComplete.sort((a,b)=>a-b);
    sanitizeCareer(cs);

    const after = JSON.stringify({ completedParts:cs.completedParts, quizScores:cs.quizScores, simulationKnowledge:cs.simulationKnowledge, simulationScore:cs.simulationScore, finalScore:cs.finalScore, learningComplete:cs.learningComplete });
    return before !== after;
  }

  async function reconcileCurrent(forceReload=false) {
    if (!API || qaMode() || !window.CM_AUTH?.ready || !window.CM_AUTH?.user) return;
    const epoch = ++routeEpoch;
    const [root, pathway] = parts();
    const state = readState();
    if (!state) return;

    let ids = [];
    if (pathway && ['career','learn','quiz','official-simulation','simulation','final','achievement','credential','certificate'].includes(root)) ids = [pathway];
    else if (root === 'passport') {
      ids = Object.entries(state.careers || {})
        .filter(([,cs]) => cs && ((cs.learningComplete || []).length || Object.keys(cs.quizScores || {}).length || Number(cs.simulationKnowledge || 0) || Number(cs.simulationScore || 0) || Number(cs.finalScore || 0)))
        .map(([id]) => id);
    }
    if (!ids.length) return;

    const results = await Promise.allSettled(ids.map(async id => ({ id, rows:await fetchProgress(id) })));
    if (epoch !== routeEpoch) return;
    let changed = false;
    for (const r of results) if (r.status === 'fulfilled') changed = applyOfficial(state, r.value.id, r.value.rows) || changed;
    if (!changed) return;
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    window.CM_SYNC?.flush?.().catch(() => {});
    if (forceReload && !document.querySelector('.cm-result')) location.reload();
  }

  function repairAsyncRouteRace() {
    const root = parts()[0] || '';
    const main = document.querySelector('#app main#main');
    if (!main) return;
    const stale =
      (!!main.querySelector('.cm-official-shell') && !['quiz','official-simulation','final'].includes(root)) ||
      (!!main.querySelector('.cert-page') && root !== 'certificate') ||
      (!!main.querySelector('.credential-detail') && root !== 'credential') ||
      (!!main.querySelector('.credentials-hero') && root !== 'credentials') ||
      (!!main.querySelector('.cm-verification') && root !== 'verify');
    if (!stale) return;
    const key = `${location.hash}|${main.firstElementChild?.className || 'stale'}`;
    if (lastRaceRepair === key) return;
    lastRaceRepair = key;
    setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 0);
  }

  function polishDom() {
    repairAsyncRouteRace();

    const [root] = parts();
    if (root === 'certificate') {
      const cert = document.getElementById('certificate');
      if (cert && !cert.classList.contains('simple') && !cert.classList.contains('applied')) {
        const title = cert.querySelector('.cert-title');
        if (title && /\sCareer$/.test(title.textContent.trim())) title.textContent = title.textContent.trim().replace(/\sCareer$/, '');
      }
      const pdf = document.querySelector('[data-cm-live-pdf], [data-cm-live-print]');
      if (pdf && pdf.textContent.trim() !== 'Download PDF') pdf.textContent = 'Download PDF';
    }

    document.querySelectorAll('.cm-madeline-msg.bot').forEach(node => {
      if (node.innerHTML.includes('Download / Print PDF')) node.innerHTML = node.innerHTML.replaceAll('Download / Print PDF','Download PDF');
    });

    const createForm = document.getElementById('cm-create-form');
    createForm?.querySelector('input[name="name"]')?.closest('label')?.remove();
  }

  function scheduleDom() {
    if (domScheduled) return;
    domScheduled = true;
    requestAnimationFrame(() => { domScheduled = false; polishDom(); });
  }

  async function correctCredentialDetail() {
    const [root, pathway, level] = parts();
    if (root !== 'credential' || !pathway || !level || !window.CM_AUTH?.user || !API) return;
    const main = document.querySelector('#app main#main');
    if (!main?.querySelector('.credential-detail')) return;
    try {
      const t = await token();
      if (!t) return;
      const response = await fetch(`${API}/credentials/me`, { headers:{ Authorization:`Bearer ${t}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || parts()[0] !== 'credential' || parts()[1] !== pathway || parts()[2] !== level) return;
      const matches = (data.credentials || [])
        .filter(c => c.pathway_id === pathway && c.credential_level === level)
        .sort((a,b) => Date.parse(b.issued_at || 0) - Date.parse(a.issued_at || 0));
      const c = matches.find(x => x.status === 'active') || matches[0];
      if (!c || c.status === 'active') return;
      const badge = main.querySelector('.verify-status');
      if (badge) { badge.textContent = `● ${String(c.status).toUpperCase()}`; badge.classList.add('preview'); }
      main.querySelectorAll('a[href^="#/certificate/"], [data-cm-live-linkedin], [data-cm-live-post]').forEach(el => { el.style.display = 'none'; });
      const feedback = main.querySelector('.feedback-box');
      if (feedback) feedback.innerHTML = `<strong>Authoritative record:</strong> this credential is <b>${esc(c.status)}</b> and is not currently active. Public verification remains available for status checking.`;
    } catch (_) {}
  }

  function routeTasks(forceReload=false) {
    routeEpoch++;
    setTimeout(() => reconcileCurrent(forceReload), 80);
    setTimeout(correctCredentialDetail, 180);
    setTimeout(scheduleDom, 40);
  }

  installStateGuard();
  window.addEventListener('hashchange', () => routeTasks(true));
  window.addEventListener('pageshow', e => routeTasks(!!e.persisted));
  window.addEventListener('focus', () => routeTasks(false));
  window.addEventListener('online', () => routeTasks(false));
  document.addEventListener('cm-auth-changed', () => routeTasks(true));

  const app = document.getElementById('app');
  if (app) new MutationObserver(scheduleDom).observe(app, { childList:true, subtree:true });

  routeTasks(false);
})();