(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const V2_API = window.CAPITAL_MASTERY_V2_API_URL || API;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PASS = 80;
  let authWaitSince = 0;
  let authRetryTimer = null;

  const API_ALIASES = {
    fpa: 'fp-and-a',
    'fp-a': 'fp-and-a',
    'fp&a': 'fp-and-a',
    'quant-finance': 'quantitative-finance',
    quant: 'quantitative-finance'
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

  function renderLoading(label='Loading secure assessmentâ¦') {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card cm-live-card"><div class="eyebrow">SECURE CAPITAL MASTERY</div><h1 class="serif">${esc(label)}</h1><p>The official result is checked by the Capital Mastery API and stored in the authoritative credential database.</p></div></div></section>`;
  }

  function renderAuthRequired() {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-live-card"><div class="eyebrow">OFFICIAL ASSESSMENT</div><h1 class="serif">Sign in required.</h1><p>Official scores and verified credentials are tied to your Firebase account.</p><a class="btn btn-primary" href="#/login">Sign in â</a></div></div></section>`;
  }

  function waitForAuthReady(label='Checking your accountâ¦') {
    if (!authWaitSince) authWaitSince = Date.now();
    renderLoading(label);
    if (authRetryTimer) clearTimeout(authRetryTimer);
    if (Date.now() - authWaitSince < 10000) {
      authRetryTimer = setTimeout(() => route(), 250);
    } else {
      const el = main();
      if (el) el.innerHTML = `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-live-card"><div class="eyebrow">SECURE CAPITAL MASTERY</div><h1 class="serif">Account check is taking longer than expected.</h1><p>Your work is safe. Retry the secure assessment without leaving the pathway.</p><button class="btn btn-primary" type="button" id="cm-auth-retry">Retry account check</button></div></div></section>`;
      document.getElementById('cm-auth-retry')?.addEventListener('click', () => { authWaitSince = 0; route(); });
    }
  }

  function clearAuthWait() {
    authWaitSince = 0;
    if (authRetryTimer) clearTimeout(authRetryTimer);
    authRetryTimer = null;
  }

  function questionTableHtml(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';
    return `<div class="cm-official-table-wrap"><table class="cm-official-table"><thead><tr>${rows[0].map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function questionHtml(q, i) {
    const context = q.context ? `<div class="cm-official-context">${esc(q.context)}</div>` : '';
    const table = questionTableHtml(q.table);
    const response = q.type === 'numeric'
      ? `<label class="cm-official-numeric"><span>Your calculated answer${q.unit?` (${esc(q.unit)})`:''}</span><input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" placeholder="Enter your result"></label>`
      : q.type === 'text'
        ? `<label class="cm-official-written"><span>Your professional response</span><textarea name="${esc(q.id)}" required maxlength="3000" placeholder="Write the concise workpaper / reviewer note you would actually submit…"></textarea></label>`
        : (q.options || []).map((option, j) => `<label class="cm-official-option"><input type="radio" name="${esc(q.id)}" value="${esc(option)}"><span>${String.fromCharCode(65+j)}</span><p>${esc(option)}</p></label>`).join('');
    return `<fieldset class="cm-official-question ${q.type==='numeric'?'cm-official-question-numeric':q.type==='text'?'cm-official-question-written':''}"><legend><span>${i+1}</span>${esc(q.prompt)}</legend>${context}${table}${response}</fieldset>`;
  }


  function workbenchField(q) {
    const wp = q.workProduct || {};
    if (q.type === 'numeric') {
      return `<div class="cm-wb-input"><span class="cm-wb-cell">${esc(wp.cell || '')}</span><label>${esc(wp.label || q.prompt)}${q.unit?` <small>${esc(q.unit)}</small>`:''}<input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" placeholder="Enter output"></label></div>`;
    }
    return `<div class="cm-wb-input"><label>${esc(wp.label || q.prompt)}<select name="${esc(q.id)}" required><option value="">Select finding…</option>${(q.options||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label></div>`;
  }

  function renderWorkbenchFile(file) {
    const rows = Array.isArray(file.rows) ? file.rows : [];
    return `<article class="cm-wb-file" data-wb-file="${esc(file.id)}"><div class="cm-wb-file-head"><span class="cm-wb-file-type">${esc(file.type)}</span><div><strong>${esc(file.name)}</strong><small>${esc(file.label||'')}</small></div></div>${rows.length?`<div class="cm-official-table-wrap"><table class="cm-official-table"><tbody>${rows.map((r,i)=>`<tr>${r.map((x,j)=>`<${i===0?'th':'td'}>${esc(x)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}</article>`;
  }

  function workbenchSection(data, section, title, copy) {
    const qs = data.questions.filter(q => q.workProduct?.section === section);
    if (!qs.length) return '';
    return `<section class="cm-wb-stage" id="cm-wb-${esc(section)}"><div class="cm-wb-stage-head"><div><div class="eyebrow">ANALYST WORK PRODUCT</div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><span>${qs.length} output${qs.length===1?'':'s'}</span></div><div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>Northstar_Orion_Valuation_v03.xlsx</b><span>Model outputs · $ in millions unless noted</span></div>${qs.map(q=>`<div class="cm-wb-row"><div><strong>${esc(q.workProduct?.label || q.prompt)}</strong><p>${esc(q.workProduct?.instruction || '')}</p></div>${workbenchField(q)}</div>`).join('')}</div></section>`;
  }


  function careerWorkbenchField(q) {
    const wp=q.workProduct||{};
    if(q.type==='numeric') return `<div class="cm-wb-input"><span class="cm-wb-cell">${esc(wp.cell||'OUT')}</span><label>${esc(wp.label||q.prompt)}${q.unit?` <small>${esc(q.unit)}</small>`:''}<input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" placeholder="Enter calculated output"></label></div>`;
    return `<label class="cm-wb-text-output"><span>${esc(wp.label||q.prompt)}</span><textarea name="${esc(q.id)}" required maxlength="3000" placeholder="Write the work note you would put in the file or send to your reviewer…"></textarea></label>`;
  }

  function renderCareerSimulationWorkbench(data,pathwayId,itemId,el){
    const p=data.simulationProfile; const sections=[...new Set(data.questions.map(q=>q.workProduct?.section||'analysis'))];
    el.innerHTML=`<section class="cm-wb-shell"><div class="cm-wb-top"><div class="container cm-wb-top-inner"><div><div class="eyebrow">PROFESSIONAL WORKBENCH · SYNTHETIC CASE</div><h1>${esc(p.project)}</h1><p>${esc(p.role)}</p></div><div class="cm-wb-deadline"><span>Review deadline</span><strong>${esc(p.deadline)}</strong></div></div></div><div class="container cm-wb-layout"><aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CASE / CLIENT</span><strong>${esc(p.client)}</strong><span>REVIEWER</span><strong>${esc(p.reviewer)}</strong></div><nav><a href="#cm-wb-files">01 · Source Files</a>${sections.map((x,i)=>`<a href="#cm-wb-${esc(x)}">${String(i+2).padStart(2,'0')} · ${esc(String(x).replace(/-/g,' '))}</a>`).join('')}<a href="#cm-wb-email">${String(sections.length+2).padStart(2,'0')} · Final Deliverable</a></nav><div class="cm-security-note"><strong>Real-work grading</strong><br>No simulation answer key is sent to the browser. Numerical outputs and work notes are evaluated by the Worker and the official score is recorded in D1.</div><a class="btn btn-outline btn-block" href="#/career/${encodeURIComponent(pathwayId)}">Exit Workbench</a></aside><main class="cm-wb-main"><section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>${esc(p.objective)}</h2><p>Use the source files, produce the requested work outputs, then write the final reviewer-facing recommendation. The knowledge check and final examination are separate—this screen tests whether you can do the job workflow.</p></div><div class="cm-wb-status"><b>${data.masteryScore}%</b><span>minimum standard</span><small>${esc(data.assessmentVersion)}</small></div></section><section class="cm-wb-stage" id="cm-wb-files"><div class="cm-wb-stage-head"><div><div class="eyebrow">SOURCE PACKET</div><h2>Open the case files before building</h2><p>Trace every requested output back to the case data. All names and figures are synthetic training material.</p></div><span>${(p.files||[]).length} files</span></div><div class="cm-wb-files">${(p.files||[]).map(renderWorkbenchFile).join('')}</div></section><form id="cm-official-form">${sections.map((section,si)=>{const qs=data.questions.filter(q=>(q.workProduct?.section||'analysis')===section);return `<section class="cm-wb-stage" id="cm-wb-${esc(section)}"><div class="cm-wb-stage-head"><div><div class="eyebrow">WORK PRODUCT ${String(si+1).padStart(2,'0')}</div><h2>${esc(String(section).replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()))}</h2><p>Produce the output in the format you would hand to your reviewer. Do not guess—use the source packet and document the logic.</p></div><span>${qs.length} required output${qs.length===1?'':'s'}</span></div><div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>${esc(p.project.replace(/\s+/g,'_'))}_Working_v01</b><span>Training work product · synthetic data</span></div>${qs.map(q=>`<div class="cm-wb-row ${q.type==='text'?'cm-wb-row-text':''}"><div><strong>${esc(q.workProduct?.label||q.prompt)}</strong><p>${esc(q.workProduct?.instruction||'')}</p></div>${careerWorkbenchField(q)}</div>`).join('')}</div></section>`}).join('')}<section class="cm-wb-stage" id="cm-wb-email"><div class="cm-wb-stage-head"><div><div class="eyebrow">FINAL REVIEW DELIVERABLE</div><h2>Send the recommendation</h2><p>Connect the work outputs to a decision. A senior reviewer should be able to understand what changed, what matters and what you recommend.</p></div><span>30 points</span></div><div class="cm-wb-compose"><div><span>To</span><b>${esc(p.reviewer)}</b></div><div><span>Subject</span><b>${esc(p.project)} — analysis & recommendation</b></div><label>Message<textarea name="writing" maxlength="5000" required placeholder="Recommendation:\n\nKey evidence:\n\nRisks / what changed:\n\nNext step:"></textarea></label></div></section><button class="btn btn-primary btn-block cm-wb-submit" type="submit">Submit Work for Review →</button><div class="cm-wb-submit-note">This is the job simulation. MCQ knowledge testing remains in the separate knowledge check / final exam.</div></form></main></div></section>`;
    bindOfficialAssessmentSubmit(data,pathwayId,itemId);
  }

  function renderIbSimulationWorkbench(data, pathwayId, itemId, el) {
    const p = data.simulationProfile;
    el.innerHTML = `<section class="cm-wb-shell"><div class="cm-wb-top"><div class="container cm-wb-top-inner"><div><div class="eyebrow">LIVE-STYLE ANALYST WORKBENCH · SYNTHETIC CASE</div><h1>${esc(p.project)}</h1><p>${esc(p.role)} · ${esc(p.desk)}</p></div><div class="cm-wb-deadline"><span>Associate deadline</span><strong>${esc(p.deadline)}</strong></div></div></div><div class="container cm-wb-layout"><aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CLIENT</span><strong>${esc(p.client)}</strong><span>TARGET</span><strong>${esc(p.target)}</strong></div><nav><a href="#cm-wb-inbox">01 · Inbox</a><a href="#cm-wb-data">02 · Data Room</a><a href="#cm-wb-model">03 · Model</a><a href="#cm-wb-valuation">04 · Valuation</a><a href="#cm-wb-update">05 · Update</a><a href="#cm-wb-qa">06 · QA</a><a href="#cm-wb-email">07 · Associate Email</a></nav><div class="cm-security-note"><strong>Authoritative grading</strong><br>Outputs are graded by the Worker and stored in D1. The case is synthetic; no proprietary bank data is used.</div><a class="btn btn-outline btn-block" href="#/career/${encodeURIComponent(pathwayId)}">Exit Workbench</a></aside><main class="cm-wb-main"><section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>${esc(p.objective)}</h2><p>You are not being asked to recognize definitions. Produce the analyst outputs below, update them when information changes, QA the model, then send your Associate a recommendation.</p></div><div class="cm-wb-status"><b>${data.masteryScore}%</b><span>minimum standard</span><small>${esc(data.assessmentVersion)}</small></div></section><section class="cm-wb-stage" id="cm-wb-inbox"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / INBOX</div><h2>Associate instructions</h2></div><span>${p.inbox.length} messages</span></div>${p.inbox.map((m,i)=>`<article class="cm-wb-email ${i===1?'cm-wb-new':''}"><div class="cm-wb-email-meta"><b>${esc(m.from)}</b><span>${esc(m.time)}</span></div><h3>${esc(m.subject)}</h3><p>${esc(m.body)}</p></article>`).join('')}</section><section class="cm-wb-stage" id="cm-wb-data"><div class="cm-wb-stage-head"><div><div class="eyebrow">VIRTUAL DATA ROOM</div><h2>Project files</h2><p>Use the source files the way an analyst would: trace the number before typing the output.</p></div><span>${p.files.length} files</span></div><div class="cm-wb-files">${p.files.map(renderWorkbenchFile).join('')}</div></section><form id="cm-official-form">${workbenchSection(data,'model','Transaction Model','Build the capitalization bridge and headline transaction multiple from the source files.')}${workbenchSection(data,'valuation','Trading Comps & Implied Value','Calculate the defensible peer-set output rather than choosing the highest multiple.')}${workbenchSection(data,'update','Management Update','New information arrived at 2:17 PM. Update the forecast and every dependent output before continuing.')}${workbenchSection(data,'qa','Model QA','Review the planted model-check notes and identify the material issue that changes valuation.')}<section class="cm-wb-stage" id="cm-wb-email"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / COMPOSE</div><h2>Email the Associate</h2><p>The email should be short enough to read quickly and specific enough to support a decision.</p></div><span>30 points</span></div><div class="cm-wb-compose"><div><span>To</span><b>${esc(p.associate)}</b></div><div><span>Cc</span><b>${esc(p.vp)}</b></div><div><span>Subject</span><b>${esc(p.project)} — updated valuation & recommendation</b></div><label>Message<textarea name="writing" maxlength="5000" required placeholder="Maya — I recommend…\n\nValuation: …\nUpdate: …\nKey risks / diligence: …\nNext step: …"></textarea></label></div></section><button class="btn btn-primary btn-block cm-wb-submit" type="submit">Send Work for Associate Review →</button><div class="cm-wb-submit-note">Submitting locks this attempt for server grading. You can revise and resubmit if you do not meet the 80% standard.</div></form></main></div></section>`;
    bindOfficialAssessmentSubmit(data, pathwayId, itemId);
  }

  function bindOfficialAssessmentSubmit(data, pathwayId, itemId) {
    document.getElementById('cm-official-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      const answers = {};
      for (const q of data.questions) {
        const name = CSS.escape(q.id);
        if (q.type === 'numeric') answers[q.id] = form.querySelector(`input[name="${name}"]`)?.value || '';
        else if (q.type === 'text') answers[q.id] = form.querySelector(`textarea[name="${name}"]`)?.value || form.querySelector(`input[name="${name}"]`)?.value || '';
        else answers[q.id] = form.querySelector(`input[name="${name}"]:checked`)?.value || form.querySelector(`select[name="${name}"]`)?.value || '';
      }
      const writing = String(new FormData(form).get('writing') || '');
      try {
        button.disabled = true;
        button.textContent = itemId === 'simulation' ? 'Sending to Associate review…' : 'Grading securely…';
        const result = await apiFetch('/assessment/submit', { method:'POST', body:JSON.stringify({ pathwayId:apiPathway(pathwayId), itemId, answers, writing }) });
        mirrorOfficialResult(pathwayId, itemId, result.score, result.passed);
        renderResult(pathwayId, itemId, result);
      } catch (error) {
        button.disabled = false;
        button.textContent = itemId === 'simulation' ? 'Send Work for Associate Review →' : 'Submit Again';
        showInlineError(form, error.message);
      }
    });
  }

  async function renderAssessment(pathwayId, itemId) {
    if (!authReady()) {
      waitForAuthReady('Checking your accountâ¦');
      return;
    }
    clearAuthWait();
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
      if (isSimulation && data.simulationProfile?.kind === 'ib-deal-workbench-v2') {
        renderIbSimulationWorkbench(data, pathwayId, itemId, el);
        return;
      }
      if (isSimulation && data.simulationProfile?.kind === 'career-workbench-v2') {
        renderCareerSimulationWorkbench(data, pathwayId, itemId, el);
        return;
      }
      const label = isSimulation ? 'OFFICIAL JOB SIMULATION' : isFinal ? 'FINAL EXAMINATION' : `OFFICIAL ${itemId.toUpperCase()} ASSESSMENT`;
      el.innerHTML = `<section class="cm-official-shell"><div class="container cm-official-wrap"><div class="cm-official-head"><div><div class="eyebrow">${label}</div><h1>${esc(data.pathway.title)}</h1><p>${data.questionCount} questions${isSimulation ? ' + written recommendation' : ''} Â· ${data.masteryScore}% required Â· Server graded</p></div><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Exit</a></div><div class="cm-security-note"><strong>Verified assessment:</strong> answers are graded by the Cloudflare Worker and official scores are stored in D1. Browser-edited scores cannot issue a credential.</div><form id="cm-official-form">${data.questions.map(questionHtml).join('')}${data.writingPrompt ? `<div class="cm-writing"><h3>Written recommendation</h3><p>${esc(data.writingPrompt)}</p><textarea name="writing" maxlength="5000" required placeholder="Write a concise, evidence-based recommendationâ¦"></textarea></div>` : ''}<button class="btn btn-primary btn-block" type="submit">Submit Official ${isFinal ? 'Final Exam' : isSimulation ? 'Simulation' : 'Assessment'}</button></form></div></section>`;

      bindOfficialAssessmentSubmit(data, pathwayId, itemId);
    } catch (error) {
      el.innerHTML = `<section class="section"><div class="container" style="max-width:820px"><div class="card cm-live-card"><div class="eyebrow">OFFICIAL ASSESSMENT</div><h1 class="serif">Not available yet.</h1><p>${esc(error.message)}</p><a class="btn btn-primary" href="#/career/${encodeURIComponent(pathwayId)}">Back to pathway â</a></div></div></section>`;
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
      cs.learningComplete ||= [];
      const partMatch = /^part-(\d+)$/.exec(itemId);
      if (partMatch) {
        const part = Number(partMatch[1]);
        if (part <= 4) {
          cs.quizScores[part] = Math.max(Number(cs.quizScores[part] || 0), Number(score || 0));
          if (passed && !cs.completedParts.includes(part)) cs.completedParts.push(part);
        } else if (part === 5) {
          cs.simulationKnowledge = Math.max(Number(cs.simulationKnowledge || 0), Number(score || 0));
        }
        if (passed && !cs.learningComplete.includes(part)) cs.learningComplete.push(part);
      }
      if (itemId === 'simulation') {
        cs.simulationScore = Math.max(Number(cs.simulationScore || 0), Number(score || 0));
        if (passed && !cs.completedParts.includes(5)) cs.completedParts.push(5);
      }
      if (itemId === 'final') cs.finalScore = Math.max(Number(cs.finalScore || 0), Number(score || 0));
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      window.CM?.refreshLocalState?.();
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
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card cm-result ${result.passed ? 'passed' : 'failed'}"><div class="eyebrow">SERVER-GRADED RESULT</div><div class="cm-result-score">${Number(result.score)}%</div><h1 class="serif">${result.passed ? 'Official pass recorded.' : 'Not yet.'}</h1><p>${result.passed ? 'Your result has been stored in the authoritative D1 progress record.' : `You need ${PASS}% to pass. Review the material and try again.`}</p>${result.objectiveTotal ? `<p class="muted">${itemId === 'simulation' ? 'Work products accepted' : 'Objective questions'}: ${result.objectiveCorrect}/${result.objectiveTotal}${result.writingScore !== null && result.writingScore !== undefined ? ` Â· Writing: ${result.writingScore}/30` : ''}</p>` : ''}${issued.length ? `<div class="cm-issued"><strong>Credential${issued.length > 1 ? 's' : ''} automatically issued:</strong>${issued.map(c => `<a href="#/verify/${encodeURIComponent(c.publicToken)}">${esc(c.title)} â</a>`).join('')}</div>` : ''}<div class="cm-result-actions"><a class="btn ${result.passed ? 'btn-gold' : 'btn-primary'}" href="${nextHref(pathwayId, itemId, result.passed)}">${result.passed ? (itemId === 'final' ? 'View Verified Credentials' : 'Continue') : 'Try Again'} â</a><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Pathway</a></div></div></div></section>`;
  }

  async function renderCredentials() {
    if (!authReady()) {
      waitForAuthReady('Checking your accountâ¦');
      return;
    }
    clearAuthWait();
    if (!signedIn()) {
      renderAuthRequired();
      return;
    }
    renderLoading('Loading verified credentialsâ¦');
    const el = main();
    try {
      const data = await apiFetch('/credentials/me');
      const credentials = data.credentials || [];
      el.innerHTML = `<section class="page-hero"><div class="container"><div class="eyebrow">VERIFIED CREDENTIALS</div><h1>Your Capital Mastery credentials.</h1><p>These records come directly from the authoritative D1 credential database.</p></div></section><section class="section-tight"><div class="container">${credentials.length ? `<div class="grid grid-3">${credentials.map(c => `<article class="card cm-credential-card"><span class="cm-status ${esc(c.status)}">${esc(c.status)}</span><div class="eyebrow">${esc(c.credential_level)}</div><h3>${esc(c.credential_title)}</h3><p><strong>Credential ID</strong><br><span class="small">${esc(c.credential_id)}</span></p><p><strong>Issued</strong><br>${formatDate(c.issued_at)}</p>${c.status === 'active' ? `<a class="btn btn-primary btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">Verify Credential â</a>` : `<div class="cm-live-error">This credential is ${esc(c.status)}.</div>`}</article>`).join('')}</div>` : `<div class="card"><h2>No verified credentials yet.</h2><p>Complete official assessments at 80% or higher to earn credentials automatically.</p><a class="btn btn-primary" href="#/careers">Explore pathways â</a></div>`}</div></section>`;
    } catch (error) {
      el.innerHTML = errorCard('Could not load credentials.', error.message);
    }
  }

  async function renderVerify(publicToken) {
    renderLoading('Verifying credentialâ¦');
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
      const evidenceHtml=(workEvidence.length||competencies.length)?`<div class="cm-public-evidence"><div class="eyebrow">WHAT THIS CREDENTIAL PROVES</div>${workEvidence.length?`<div class="grid grid-3">${workEvidence.map(x=>`<div class="card"><strong>${esc(x.title||x.type)}</strong><p>${x.score!=null?`${Number(x.score)}%`:x.overallScore!=null?`${Number(x.overallScore)}% readiness`:'Verified evidence'}</p>${x.evidenceCoverage!=null?`<small>${Number(x.evidenceCoverage)}% evidence coverage</small>`:''}</div>`).join('')}</div>`:''}${competencies.length?`<h3>Measured competencies</h3><div class="cm-public-skills">${competencies.map(x=>`<div><span>${esc(x.name)}${x.critical?' Â· Critical':''}</span><b>${Number(x.score)}%</b><small>Target ${Number(x.minimumScore)}% Â· ${Number(x.evidenceCount)} evidence</small></div>`).join('')}</div>`:''}</div>`:'';
      el.innerHTML = `<section class="section"><div class="container" style="max-width:980px"><div class="cm-verification ${data.valid ? 'valid' : 'invalid'}"><span class="cm-verify-badge">${data.valid ? 'VERIFIED ACTIVE CREDENTIAL â' : 'NOT ACTIVE'}</span><div class="eyebrow">CAPITAL MASTERY CREDENTIAL</div><h1 class="serif">${esc(c.title)}</h1><p>Issued to <strong>${esc(c.holderName)}</strong></p>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="grid grid-2"><div class="card"><strong>Credential ID</strong><p>${esc(c.credentialId)}</p></div><div class="card"><strong>Issued</strong><p>${formatDate(c.issuedAt)}</p></div><div class="card"><strong>Level</strong><p>${esc(String(c.level||'').replace(/_/g,' '))}</p></div><div class="card"><strong>Standard</strong><p>${esc(c.standardVersion||'1.0 legacy')}</p></div></div>${evidenceHtml}<div class="cm-security-note"><strong>Verification source:</strong> Capital Mastery secure API â Cloudflare Worker â D1 authoritative credential and evidence records. Public verification excludes private account identifiers and assessment answers.</div></div></div></section>`;
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
      .cm-wb-shell{min-height:100vh;background:#edf1f5;color:#172334}.cm-wb-top{background:#071a33;color:white;border-bottom:3px solid #c5a25d}.cm-wb-top-inner{display:flex;justify-content:space-between;gap:24px;align-items:center;padding-top:24px;padding-bottom:24px}.cm-wb-top h1{font-family:Georgia,"Times New Roman",serif;font-size:2.5rem;margin:5px 0}.cm-wb-top p{margin:0;color:#d6deea}.cm-wb-deadline{display:grid;text-align:right;gap:4px;padding:12px 16px;border:1px solid #53657d;border-radius:10px}.cm-wb-deadline span,.cm-wb-case-card span{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#718096;font-weight:850}.cm-wb-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;padding-top:24px;padding-bottom:60px}.cm-wb-sidebar{position:sticky;top:14px;align-self:start;background:#fff;border:1px solid #d8e0e7;border-radius:14px;padding:14px;box-shadow:0 7px 24px rgba(13,31,52,.08)}.cm-wb-case-card{display:grid;gap:5px;padding:10px 8px 15px;border-bottom:1px solid #e1e6eb;margin-bottom:8px}.cm-wb-case-card strong{color:#071a33}.cm-wb-sidebar nav{display:grid}.cm-wb-sidebar nav a{padding:10px;border-radius:8px;text-decoration:none;color:#34475d;font-weight:750;font-size:.88rem}.cm-wb-sidebar nav a:hover{background:#eef3f7;color:#071a33}.cm-wb-main{min-width:0}.cm-wb-hero,.cm-wb-stage{background:#fff;border:1px solid #d8e0e7;border-radius:16px;padding:24px;margin-bottom:18px;box-shadow:0 5px 18px rgba(13,31,52,.055)}.cm-wb-hero{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start}.cm-wb-hero h2,.cm-wb-stage h2{font-family:Georgia,"Times New Roman",serif;color:#071a33;margin:6px 0 8px}.cm-wb-status{min-width:120px;text-align:center;background:#f7f2e7;border:1px solid #dcc79b;border-radius:12px;padding:12px}.cm-wb-status b{display:block;font-size:2rem;color:#071a33}.cm-wb-status span,.cm-wb-status small{display:block;font-size:.72rem;color:#6f6247}.cm-wb-stage-head{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:16px}.cm-wb-stage-head>span{font-size:.72rem;font-weight:850;padding:7px 9px;border-radius:999px;background:#eef2f5;color:#4b5c6f}.cm-wb-email{border:1px solid #dde3e9;border-left:4px solid #8ea0b3;border-radius:10px;padding:16px;margin-top:10px;background:#fbfcfd}.cm-wb-email.cm-wb-new{border-left-color:#c39439;background:#fffaf0}.cm-wb-email-meta{display:flex;justify-content:space-between;gap:16px;font-size:.82rem;color:#677586}.cm-wb-email h3{color:#071a33;margin:8px 0}.cm-wb-files{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cm-wb-file{border:1px solid #dce2e8;border-radius:12px;padding:14px;overflow:hidden}.cm-wb-file-head{display:flex;gap:10px;align-items:center;margin-bottom:10px}.cm-wb-file-head div{display:grid;min-width:0}.cm-wb-file-head strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#071a33}.cm-wb-file-head small{color:#738092}.cm-wb-file-type{font-size:.65rem;font-weight:900;background:#071a33;color:#fff;border-radius:5px;padding:5px 7px}.cm-wb-sheet{border:1px solid #cfd8e1;border-radius:10px;overflow:hidden}.cm-wb-sheet-bar{display:flex;justify-content:space-between;gap:16px;background:#e7edf2;padding:10px 12px;font-size:.78rem;color:#526477}.cm-wb-sheet-bar b{color:#071a33}.cm-wb-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,330px);gap:18px;align-items:center;padding:16px;border-top:1px solid #e1e6eb}.cm-wb-row:first-of-type{border-top:0}.cm-wb-row p{margin:5px 0 0;color:#677586;font-size:.86rem}.cm-wb-input{display:flex;align-items:end;gap:8px}.cm-wb-input label{display:grid;gap:6px;width:100%;font-size:.76rem;font-weight:800;color:#536477}.cm-wb-input input,.cm-wb-input select,.cm-wb-compose textarea{width:100%;border:1px solid #aebdca;border-radius:7px;background:#fff;padding:11px;color:#071a33;font:inherit}.cm-wb-input input:focus,.cm-wb-input select:focus,.cm-wb-compose textarea:focus{outline:2px solid #caa554;outline-offset:1px}.cm-wb-cell{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.72rem;background:#eaf0f4;border:1px solid #ccd7df;padding:10px 7px;border-radius:6px;color:#536477}.cm-wb-compose{border:1px solid #d8e0e7;border-radius:10px;overflow:hidden}.cm-wb-compose>div{display:grid;grid-template-columns:70px 1fr;padding:9px 12px;border-bottom:1px solid #e3e7eb;font-size:.86rem}.cm-wb-compose>div span{color:#758294}.cm-wb-compose label{display:grid;gap:8px;padding:12px;font-weight:800;color:#536477}.cm-wb-compose textarea{min-height:220px;resize:vertical;font-weight:400}.cm-wb-submit{margin-top:18px;min-height:52px}.cm-wb-submit-note{text-align:center;color:#6b7785;font-size:.78rem;margin-top:8px}
      @media(max-width:900px){.cm-wb-layout{grid-template-columns:1fr}.cm-wb-sidebar{position:static}.cm-wb-sidebar nav{grid-template-columns:repeat(3,1fr)}.cm-wb-files{grid-template-columns:1fr}.cm-wb-row{grid-template-columns:1fr}.cm-wb-top-inner,.cm-wb-hero{grid-template-columns:1fr;display:grid}.cm-wb-deadline{text-align:left}.cm-wb-sheet-bar{display:grid}}
      @media(max-width:600px){.cm-wb-sidebar nav{grid-template-columns:1fr 1fr}.cm-wb-top h1{font-size:2rem}.cm-wb-stage,.cm-wb-hero{padding:17px}.cm-wb-stage-head{display:block}.cm-wb-stage-head>span{display:inline-block;margin-top:7px}.cm-wb-email-meta{display:grid}.cm-wb-compose>div{grid-template-columns:55px 1fr}}
      .cm-official-context{margin:10px 0 12px;padding:12px 14px;border-left:4px solid var(--gold);background:#fbf7ee;color:#4e5966;border-radius:8px}.cm-official-table-wrap{overflow:auto;margin:12px 0}.cm-official-table{width:100%;border-collapse:collapse;font-size:.86rem}.cm-official-table th,.cm-official-table td{border:1px solid #d9e0e7;padding:9px 10px;text-align:right}.cm-official-table th:first-child,.cm-official-table td:first-child{text-align:left}.cm-official-numeric{display:block;margin-top:14px;font-weight:750;color:var(--navy)}.cm-official-numeric span{display:block;margin-bottom:6px}.cm-official-numeric input{width:min(100%,320px);padding:12px;border:1px solid #bcc9d5;border-radius:9px;background:#fff;color:var(--navy);font-size:1rem}.cm-official-question-numeric{background:linear-gradient(180deg,#fff,#fbfcfd)}
            @media(max-width:700px){.cm-public-skills{grid-template-columns:1fr}.cm-official-head{display:block}.cm-official-head .btn{margin-top:12px}.cm-official-head h1,.cm-verification h1{font-size:2.1rem}.cm-result-score{font-size:4rem}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('hashchange', () => setTimeout(route, 0));
  document.addEventListener('cm-auth-changed', () => setTimeout(route, 0));
  injectStyles();
  setTimeout(route, 0);
})();
