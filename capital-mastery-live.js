(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const V2_API = window.CAPITAL_MASTERY_V2_API_URL || API;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PASS = 80;

  const API_ALIASES = {
    fpa: 'fp-and-a',
    'fp-a': 'fp-and-a',
    'fp&a': 'fp-and-a'
  };

  function esc(value='') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function apiPathway(id) {
    return API_ALIASES[id] || id;
  }

  function hashParts() {
    return (location.hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function main() {
    return document.querySelector('#app main#main');
  }

  function signedIn() {
    return !!window.CM_AUTH?.user;
  }

  function authReady() {
    return !!window.CM_AUTH?.ready;
  }

  async function token() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function apiFetch(path, options = {}, auth = true) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (auth) {
      const idToken = await token();
      if (!idToken) throw new Error('Sign in to continue.');
      headers.Authorization = `Bearer ${idToken}`;
    }
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  function renderLoading(label='Loading secure assessment…') {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card cm-live-card"><div class="eyebrow">SECURE CAPITAL MASTERY</div><h1 class="serif">${esc(label)}</h1><p>The official result is checked by the Capital Mastery API and stored in the authoritative credential database.</p></div></div></section>`;
  }

  function renderAuthRequired() {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-live-card"><div class="eyebrow">OFFICIAL ASSESSMENT</div><h1 class="serif">Sign in required.</h1><p>Official scores and verified credentials are tied to your Firebase account.</p><a class="btn btn-primary" href="#/login">Sign in →</a></div></div></section>`;
  }

  function questionHtml(q, i) {
    return `<fieldset class="cm-official-question"><legend><span>${i+1}</span>${esc(q.prompt)}</legend>${(q.options || []).map((option, j) => `<label class="cm-official-option"><input type="radio" name="${esc(q.id)}" value="${esc(option)}"><span>${String.fromCharCode(65+j)}</span><p>${esc(option)}</p></label>`).join('')}</fieldset>`;
  }

  async function renderAssessment(pathwayId, itemId) {
    if (!authReady()) {
      renderLoading('Checking your account…');
      return;
    }
    if (!signedIn()) {
      renderAuthRequired();
      return;
    }

    renderLoading();
    const el = main();
    try {
      const data = await apiFetch(`/assessment/${encodeURIComponent(apiPathway(pathwayId))}/${encodeURIComponent(itemId)}`);
      if (!el) return;
      const isSimulation = itemId === 'simulation';
      const isFinal = itemId === 'final';
      const label = isSimulation ? 'OFFICIAL JOB SIMULATION' : isFinal ? 'FINAL EXAMINATION' : `OFFICIAL ${itemId.toUpperCase()} ASSESSMENT`;
      el.innerHTML = `<section class="cm-official-shell"><div class="container cm-official-wrap"><div class="cm-official-head"><div><div class="eyebrow">${label}</div><h1>${esc(data.pathway.title)}</h1><p>${data.questionCount} questions${isSimulation ? ' + written recommendation' : ''} · ${data.masteryScore}% required · Server graded</p></div><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Exit</a></div><div class="cm-security-note"><strong>Verified assessment:</strong> answers are graded by the Cloudflare Worker and official scores are stored in D1. Browser-edited scores cannot issue a credential.</div><form id="cm-official-form">${data.questions.map(questionHtml).join('')}${data.writingPrompt ? `<div class="cm-writing"><h3>Written recommendation</h3><p>${esc(data.writingPrompt)}</p><textarea name="writing" maxlength="5000" required placeholder="Write a concise, evidence-based recommendation…"></textarea></div>` : ''}<button class="btn btn-primary btn-block" type="submit">Submit Official ${isFinal ? 'Final Exam' : isSimulation ? 'Simulation' : 'Assessment'}</button></form></div></section>`;

      document.getElementById('cm-official-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = form.querySelector('button[type="submit"]');
        const answers = {};
        for (const q of data.questions) {
          answers[q.id] = form.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`)?.value || '';
        }
        const writing = String(new FormData(form).get('writing') || '');
        try {
          button.disabled = true;
          button.textContent = 'Grading securely…';
          const result = await apiFetch('/assessment/submit', {
            method: 'POST',
            body: JSON.stringify({ pathwayId: apiPathway(pathwayId), itemId, answers, writing })
          });
          mirrorOfficialResult(pathwayId, itemId, result.score, result.passed);
          renderResult(pathwayId, itemId, result);
        } catch (error) {
          button.disabled = false;
          button.textContent = 'Submit Again';
          showInlineError(form, error.message);
        }
      });
    } catch (error) {
      el.innerHTML = `<section class="section"><div class="container" style="max-width:820px"><div class="card cm-live-card"><div class="eyebrow">OFFICIAL ASSESSMENT</div><h1 class="serif">Not available yet.</h1><p>${esc(error.message)}</p><a class="btn btn-primary" href="#/career/${encodeURIComponent(pathwayId)}">Back to pathway →</a></div></div></section>`;
    }
  }

  function showInlineError(form, message) {
    form.querySelector('.cm-live-error')?.remove();
    const box = document.createElement('div');
    box.className = 'cm-live-error';
    box.textContent = message;
    form.prepend(box);
    box.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function mirrorOfficialResult(pathwayId, itemId, score, passed) {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!state || state.version !== 1) return;
      state.careers ||= {};
      state.careers[pathwayId] ||= { learningComplete:[], completedParts:[], quizScores:{}, simulationKnowledge:null, simulationScore:null, finalScore:null, applied:{}, simResponses:{}, readiness:null };
      const cs = state.careers[pathwayId];
      cs.completedParts ||= [];
      cs.quizScores ||= {};
      const n = /^part-(\d)$/.exec(itemId)?.[1];
      if (n) {
        const part = Number(n);
        if (part <= 4) cs.quizScores[part] = Math.max(Number(cs.quizScores[part] || 0), Number(score || 0));
        if (part === 5) cs.simulationKnowledge = Math.max(Number(cs.simulationKnowledge || 0), Number(score || 0));
        if (passed && !cs.completedParts.includes(part)) cs.completedParts.push(part);
      }
      if (itemId === 'simulation') {
        cs.simulationScore = Math.max(Number(cs.simulationScore || 0), Number(score || 0));
        if (passed && !cs.completedParts.includes(5)) cs.completedParts.push(5);
      }
      if (itemId === 'final') cs.finalScore = Math.max(Number(cs.finalScore || 0), Number(score || 0));
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      window.CM_SYNC?.flush?.().catch(() => {});
    } catch (error) {
      console.warn('Could not mirror official result into learner UI state:', error);
    }
  }

  function nextHref(pathwayId, itemId, passed) {
    if (!passed) {
      if (itemId === 'simulation') return `#/official-simulation/${pathwayId}`;
      if (itemId === 'final') return `#/final/${pathwayId}`;
      const n = Number(itemId.split('-')[1]);
      return `#/quiz/${pathwayId}/${n}`;
    }
    if (/^part-[1-4]$/.test(itemId)) {
      const n = Number(itemId.split('-')[1]);
      return `#/learn/${pathwayId}/${n+1}`;
    }
    if (itemId === 'part-5') return `#/official-simulation/${pathwayId}`;
    if (itemId === 'simulation') return `#/final/${pathwayId}`;
    return '#/credentials';
  }

  function renderResult(pathwayId, itemId, result) {
    const el = main();
    if (!el) return;
    const issued = result.issuedCredentials || [];
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card cm-result ${result.passed ? 'passed' : 'failed'}"><div class="eyebrow">SERVER-GRADED RESULT</div><div class="cm-result-score">${Number(result.score)}%</div><h1 class="serif">${result.passed ? 'Official pass recorded.' : 'Not yet.'}</h1><p>${result.passed ? 'Your result has been stored in the authoritative D1 progress record.' : `You need ${PASS}% to pass. Review the material and try again.`}</p>${result.objectiveTotal ? `<p class="muted">Objective questions: ${result.objectiveCorrect}/${result.objectiveTotal}${result.writingScore !== null && result.writingScore !== undefined ? ` · Writing: ${result.writingScore}/30` : ''}</p>` : ''}${issued.length ? `<div class="cm-issued"><strong>Credential${issued.length > 1 ? 's' : ''} automatically issued:</strong>${issued.map(c => `<a href="#/verify/${encodeURIComponent(c.publicToken)}">${esc(c.title)} →</a>`).join('')}</div>` : ''}<div class="cm-result-actions"><a class="btn ${result.passed ? 'btn-gold' : 'btn-primary'}" href="${nextHref(pathwayId, itemId, result.passed)}">${result.passed ? (itemId === 'final' ? 'View Verified Credentials' : 'Continue') : 'Try Again'} →</a><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Pathway</a></div></div></div></section>`;
  }

  async function renderCredentials() {
    if (!authReady()) {
      renderLoading('Checking your account…');
      return;
    }
    if (!signedIn()) {
      renderAuthRequired();
      return;
    }
    renderLoading('Loading verified credentials…');
    const el = main();
    try {
      const data = await apiFetch('/credentials/me');
      const credentials = data.credentials || [];
      el.innerHTML = `<section class="page-hero"><div class="container"><div class="eyebrow">VERIFIED CREDENTIALS</div><h1>Your Capital Mastery credentials.</h1><p>These records come directly from the authoritative D1 credential database.</p></div></section><section class="section-tight"><div class="container">${credentials.length ? `<div class="grid grid-3">${credentials.map(c => `<article class="card cm-credential-card"><span class="cm-status ${esc(c.status)}">${esc(c.status)}</span><div class="eyebrow">${esc(c.credential_level)}</div><h3>${esc(c.credential_title)}</h3><p><strong>Credential ID</strong><br><span class="small">${esc(c.credential_id)}</span></p><p><strong>Issued</strong><br>${formatDate(c.issued_at)}</p>${c.status === 'active' ? `<a class="btn btn-primary btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">Verify Credential →</a>` : `<div class="cm-live-error">This credential is ${esc(c.status)}.</div>`}</article>`).join('')}</div>` : `<div class="card"><h2>No verified credentials yet.</h2><p>Complete official assessments at 80% or higher to earn credentials automatically.</p><a class="btn btn-primary" href="#/careers">Explore pathways →</a></div>`}</div></section>`;
    } catch (error) {
      el.innerHTML = errorCard('Could not load credentials.', error.message);
    }
  }

  async function renderVerify(publicToken) {
    renderLoading('Verifying credential…');
    const el = main();
    try {
      let data;
      try {
        const response = await fetch(`${V2_API}/enterprise/verify/${encodeURIComponent(publicToken)}`, { headers:{Accept:'application/json'} });
        data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`);
      } catch (v2Error) {
        data = await apiFetch(`/verify/${encodeURIComponent(publicToken)}`, {}, false);
      }
      const c = data.credential; const evidence=data.evidence||[];
      const competency=evidence.find(x=>x.type==='competency_profile');
      const competencies=competency?.competencies||[];
      const workEvidence=evidence.filter(x=>['assessment','role_lab','readiness'].includes(x.type));
      const evidenceHtml=(workEvidence.length||competencies.length)?`<div class="cm-public-evidence"><div class="eyebrow">WHAT THIS CREDENTIAL PROVES</div>${workEvidence.length?`<div class="grid grid-3">${workEvidence.map(x=>`<div class="card"><strong>${esc(x.title||x.type)}</strong><p>${x.score!=null?`${Number(x.score)}%`:x.overallScore!=null?`${Number(x.overallScore)}% readiness`:'Verified evidence'}</p>${x.evidenceCoverage!=null?`<small>${Number(x.evidenceCoverage)}% evidence coverage</small>`:''}</div>`).join('')}</div>`:''}${competencies.length?`<h3>Measured competencies</h3><div class="cm-public-skills">${competencies.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><b>${Number(x.score)}%</b><small>Target ${Number(x.minimumScore)}% · ${Number(x.evidenceCount)} evidence</small></div>`).join('')}</div>`:''}</div>`:'';
      el.innerHTML = `<section class="section"><div class="container" style="max-width:980px"><div class="cm-verification ${data.valid ? 'valid' : 'invalid'}"><span class="cm-verify-badge">${data.valid ? 'VERIFIED ACTIVE CREDENTIAL ✓' : 'NOT ACTIVE'}</span><div class="eyebrow">CAPITAL MASTERY CREDENTIAL</div><h1 class="serif">${esc(c.title)}</h1><p>Issued to <strong>${esc(c.holderName)}</strong></p>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="grid grid-2"><div class="card"><strong>Credential ID</strong><p>${esc(c.credentialId)}</p></div><div class="card"><strong>Issued</strong><p>${formatDate(c.issuedAt)}</p></div><div class="card"><strong>Level</strong><p>${esc(String(c.level||'').replace(/_/g,' '))}</p></div><div class="card"><strong>Standard</strong><p>${esc(c.standardVersion||'1.0 legacy')}</p></div></div>${evidenceHtml}<div class="cm-security-note"><strong>Verification source:</strong> Capital Mastery secure API → Cloudflare Worker → D1 authoritative credential and evidence records. Public verification excludes private account identifiers and assessment answers.</div></div></div></section>`;
    } catch (error) {
      el.innerHTML = `<section class="section"><div class="container" style="max-width:780px"><div class="card"><span class="cm-verify-badge invalid">NOT VERIFIED</span><h1 class="serif">Credential not found.</h1><p>${esc(error.message)}</p></div></div></section>`;
    }
  }

  function errorCard(title, message) {
    return `<section class="section"><div class="container" style="max-width:780px"><div class="card cm-live-card"><h1 class="serif">${esc(title)}</h1><p>${esc(message)}</p></div></div></section>`;
  }

  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value || '') : new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(d);
  }

  async function route() {
    const p = hashParts();
    const [root, a, b] = p;
    const adminQaPreview = window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';
    // Admin QA deliberately falls back to the local preview renderer for knowledge/final assessments.
    // It does not call the authoritative submit endpoint, write D1 scores, or issue credentials.
    if (adminQaPreview && (root === 'quiz' || root === 'final')) return;
    if (root === 'quiz' && a && b) {
      await renderAssessment(a, `part-${Number(b)}`);
      return;
    }
    if (root === 'official-simulation' && a) {
      await renderAssessment(a, 'simulation');
      return;
    }
    if (root === 'final' && a) {
      await renderAssessment(a, 'final');
      return;
    }
    if (root === 'credentials') {
      await renderCredentials();
      return;
    }
    if (root === 'verify' && a) {
      await renderVerify(decodeURIComponent(a));
    }
  }

  function injectStyles() {
    if (document.getElementById('cm-live-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-live-styles';
    style.textContent = `
      .cm-official-shell{padding:50px 0 80px;background:var(--cream)}.cm-official-wrap{max-width:940px}.cm-official-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:24px}.cm-official-head h1{font-family:Georgia,"Times New Roman",serif;color:var(--navy);font-size:2.8rem;margin:4px 0 8px}.cm-security-note{padding:14px 16px;border:1px solid #c8d8cf;background:#f3fbf6;border-radius:12px;color:#315c49;margin:18px 0 24px}.cm-official-question{border:1px solid #dfe3e8;border-radius:16px;background:#fff;padding:20px;margin:0 0 16px}.cm-official-question legend{font-weight:800;color:var(--navy);padding:0 6px;display:flex;gap:10px}.cm-official-question legend span{width:28px;height:28px;border-radius:50%;background:#eef1f4;display:inline-grid;place-items:center;flex:none}.cm-official-option{display:grid;grid-template-columns:auto 30px 1fr;gap:10px;align-items:center;border:1px solid #e3e7eb;border-radius:12px;padding:11px 12px;margin:10px 0;cursor:pointer;background:#fff}.cm-official-option:hover{border-color:#c4a461}.cm-official-option>span{width:28px;height:28px;border-radius:50%;background:#f2f4f6;display:grid;place-items:center;font-weight:800}.cm-official-option p{margin:0}.cm-writing{background:#fff;border:1px solid #dfe3e8;border-radius:16px;padding:22px;margin:18px 0}.cm-writing textarea{width:100%;min-height:190px;border:1px solid #cbd2da;border-radius:12px;padding:14px;margin-top:8px}.cm-live-error{padding:12px 14px;border-radius:10px;background:#fff0f0;color:#8b3232;margin:12px 0}.cm-result{padding:34px;text-align:center}.cm-result-score{font-family:Georgia,"Times New Roman",serif;font-size:5rem;color:var(--navy);line-height:1}.cm-result.passed{border:1px solid #bad7c8}.cm-result.failed{border:1px solid #efcaca}.cm-issued{display:grid;gap:8px;text-align:left;background:#f7f1e4;border:1px solid #e2c991;border-radius:12px;padding:15px;margin:20px 0}.cm-issued a{color:var(--navy);font-weight:750;text-decoration:none}.cm-result-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.cm-status,.cm-verify-badge{display:inline-block;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;font-weight:900;border-radius:999px;padding:7px 10px;margin-bottom:12px}.cm-status.active,.cm-verify-badge{background:#e6f4eb;color:#245b43}.cm-status.revoked,.cm-status.reissued,.cm-verify-badge.invalid{background:#fff0f0;color:#8b3232}.cm-credential-card{display:flex;flex-direction:column}.cm-credential-card .btn{margin-top:auto}.cm-verification{background:#fff;border:1px solid #dfe3e8;border-radius:22px;padding:32px;box-shadow:var(--shadow-sm)}.cm-verification.valid{border-color:#bad7c8}.cm-verification.invalid{border-color:#efcaca}.cm-verification h1{font-size:2.8rem;color:var(--navy);margin:12px 0}.cm-live-card h1{color:var(--navy)}.cm-public-evidence{margin-top:24px;padding-top:22px;border-top:1px solid #e0e5e8}.cm-public-evidence h3{color:var(--navy);margin:22px 0 10px}.cm-public-skills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cm-public-skills>div{display:grid;grid-template-columns:1fr auto;gap:4px;background:#f5f7f8;border-radius:10px;padding:10px}.cm-public-skills small{grid-column:1/-1;color:#697580}
      @media(max-width:700px){.cm-public-skills{grid-template-columns:1fr}.cm-official-head{display:block}.cm-official-head .btn{margin-top:12px}.cm-official-head h1,.cm-verification h1{font-size:2.1rem}.cm-result-score{font-size:4rem}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('hashchange', () => setTimeout(route, 0));
  document.addEventListener('cm-auth-changed', () => setTimeout(route, 0));
  injectStyles();
  setTimeout(route, 0);
})();
