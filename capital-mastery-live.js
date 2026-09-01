(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const V2_API = window.CAPITAL_MASTERY_V2_API_URL || API;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PASS = 80;
  let authWaitSince = 0;
  let authRetryTimer = null;
  let secureRouteEpoch = 0;
  let secureRouteController = null;
  let routeInFlightKey = '';
  let routeInFlightPromise = null;
  let savedReviewSequence = 0;
  const savedReviewCache = new Map();

  function beginSecureRoute() {
    secureRouteEpoch += 1;
    if (secureRouteController) secureRouteController.abort();
    secureRouteController = new AbortController();
    return { epoch:secureRouteEpoch, hash:location.hash, signal:secureRouteController.signal };
  }

  function secureRouteCurrent(epoch, hash) {
    return epoch === secureRouteEpoch && hash === location.hash && !secureRouteController?.signal.aborted;
  }

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

  function hashQuery() {
    const query=(location.hash||'').split('?')[1]||'';
    return new URLSearchParams(query);
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
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
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

  function waitForAuthReady(label='Checking your account…') {
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
      return `<div class="cm-wb-input"><span class="cm-wb-cell">${esc(wp.cell || '')}</span><label>${esc(wp.label || q.prompt)}${q.unit?` <small>${esc(q.unit)}</small>`:''}<input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" placeholder="Enter calculated output"></label></div>`;
    }
    if (q.type === 'text') {
      return `<label class="cm-wb-text-output"><span>${esc(wp.label || q.prompt)}</span><textarea name="${esc(q.id)}" required maxlength="3000" placeholder="Write the workpaper note, QA finding, or reviewer-ready takeaway you would actually submit…"></textarea></label>`;
    }
    return `<div class="cm-wb-input cm-wb-unsupported"><strong>Unsupported work-product type.</strong><p>This practical simulation only accepts calculated outputs and written work products.</p></div>`;
  }

  const IB_WORKBENCH_GUIDES = Object.freeze({
    inbox: {
      purpose:'Understand exactly what the Associate needs, what changed, and when the work is due.',
      steps:['Read both messages in time order.','Write down every requested deliverable before opening the model.','Treat the 2:17 PM guidance email as a required model update, not optional context.'],
      check:'You should be able to name the valuation outputs, QA work, recommendation, and deadline before moving on.'
    },
    data: {
      purpose:'Know which source supports each calculation before you type an output.',
      steps:['Open each file card and read its short description.','Use capitalization for the EV bridge; forecasts for operating inputs; comps, precedents, and DCF for their matching analyses.','Keep the diligence list and QA note open when you write the senior-review takeaway.'],
      check:'Every number in your work should trace to a visible source file and use the stated units.'
    },
    model: {
      purpose:'Build the offer enterprise value and headline transaction multiple.',
      steps:['Start with equity value from the capitalization file.','Add debt and subtract cash to reach enterprise value.','Divide enterprise value by LTM EBITDA and keep units consistent.'],
      check:'Reconcile the bridge in both directions and confirm the multiple uses LTM—not NTM—EBITDA.'
    },
    valuation: {
      purpose:'Use a defensible peer set to estimate Orion’s trading value.',
      steps:['Calculate NTM EV / EBITDA for every listed peer.','Exclude the clearly low-fit hardware-heavy outlier and take the median of the four defensible peers.','Apply the selected multiple to Orion NTM EBITDA, then bridge EV to equity value.'],
      check:'Confirm the selected peers share the intended business fit and the EV-to-equity bridge uses debt and cash with the correct signs.'
    },
    precedents: {
      purpose:'Use relevant control transactions as a second market-based valuation reference.',
      steps:['Open the precedent file and verify each stated EV / LTM EBITDA multiple.','Sort the four relevant multiples and calculate the midpoint of the two middle observations.','Apply the median to Orion LTM EBITDA and bridge to equity value.'],
      check:'Use LTM EBITDA consistently and do not mix trading-comps NTM inputs into precedents.'
    },
    dcf: {
      purpose:'Build an intrinsic-value cross-check independent of market multiples.',
      steps:['Discount each annual unlevered FCF at the stated WACC.','Calculate terminal value with the Gordon Growth formula, then discount it to present value.','Add the present values to get enterprise value and bridge to equity value.'],
      check:'WACC must be greater than terminal growth, terminal value must be discounted, and the EV-to-equity bridge must reconcile.'
    },
    update: {
      purpose:'Show that the late management update flows through every dependent output.',
      steps:['Reduce the initial Year-1 revenue case by the stated percentage.','Use revised EBITDA for the refreshed trading-comps valuation.','Update the takeaway and email so they describe the revised—not original—case.'],
      check:'No downstream page should still present the initial forecast as the current case.'
    },
    qa: {
      purpose:'Catch the material model error before senior review.',
      steps:['Open the model-check note and identify the broken sign convention.','Explain the correction in your own words and identify the affected bridge.','Recheck units, formula direction, and whether the management update flows through all outputs.'],
      check:'Your note must state both what is wrong and the correction required; simply saying “formula error” is not enough.'
    },
    'client-materials': {
      purpose:'Turn the analysis into one decision-useful senior-review takeaway.',
      steps:['Lead with where the offer sits versus comps, precedents, and DCF.','Explain how the revised guidance changes the valuation view.','State the decision implication and the diligence issues that could change it.'],
      check:'A senior reviewer should understand the conclusion, evidence, change, and risk without reading every model tab.'
    },
    email: {
      purpose:'Give the Associate a concise handoff that can be reviewed and acted on quickly.',
      steps:['State the recommendation first.','Cite the key calculated valuation evidence and explain the management update.','Name at least two material risks or diligence items, then assign a controlled next action.'],
      check:'Passing requires an 80% overall score, at least 75% of work products accepted, and at least 20/30 on the writing rubric.'
    }
  });

  function workbenchGuide(section, fallback='Complete this step using the source packet and reviewer standard.') {
    const guide=IB_WORKBENCH_GUIDES[section]||{
      purpose:fallback,
      steps:['Open the relevant source file and identify the required evidence.','Complete each requested output and show the logic in the work product.','Review the result for units, assumptions, exceptions, and decision impact.'],
      check:'The output should be reproducible, source-backed, and ready for a reviewer to challenge.'
    };
    return `<details class="cm-wb-guide" open><summary><span>How to complete this step</span><small>Practical guide — no answer key</small></summary><div class="cm-wb-guide-body"><p><strong>Purpose:</strong> ${esc(guide.purpose)}</p><ol>${guide.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p class="cm-wb-guide-check"><strong>Quality check:</strong> ${esc(guide.check)}</p></div></details>`;
  }

  function workbenchNavButton(index,target,label) {
    return `<button type="button" data-cm-wb-target="${esc(target)}" aria-controls="${esc(target)}"${index===1?' aria-current="step"':''}><b>${String(index).padStart(2,'0')}</b><span>${esc(label)}</span></button>`;
  }

  function workbenchProgress() {
    return `<div class="cm-wb-progress" aria-live="polite"><div><strong>Work progress</strong><span data-cm-wb-progress-text>0 outputs complete</span></div><div class="cm-wb-progress-track" role="progressbar" aria-label="Required work completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-cm-wb-progress-bar></span></div></div>`;
  }

  function friendlyFileDescription(file) {
    if(file.description) return String(file.description);
    const kind=String(file.type||'file').toLowerCase();
    const label=String(file.label||'case evidence').toLowerCase();
    return `A ${kind} source containing the ${label} inputs used in this assignment. Open it to inspect the available evidence before completing the related output.`;
  }

  function renderWorkbenchFile(file) {
    const rows = Array.isArray(file.rows) ? file.rows : [];
    const description=friendlyFileDescription(file);
    const useFor=file.useFor||file.label||'case analysis';
    return `<details class="cm-wb-file" data-wb-file="${esc(file.id)}"><summary><div class="cm-wb-file-head"><span class="cm-wb-file-type">${esc(file.type)}</span><div><strong>${esc(file.name)}</strong><small>${esc(file.label||'Source file')}</small></div></div><p>${esc(description)}</p><span class="cm-wb-file-open"><span class="cm-wb-file-open-label">Open file preview</span><span aria-hidden="true">↗</span></span></summary><div class="cm-wb-file-preview"><div class="cm-wb-file-preview-bar"><span>READ-ONLY TRAINING PREVIEW</span><strong>Use for: ${esc(useFor)}</strong></div>${rows.length?`<div class="cm-official-table-wrap"><table class="cm-official-table"><tbody>${rows.map((r,i)=>`<tr>${r.map(x=>`<${i===0?'th':'td'}>${esc(x)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>No tabular preview is available. Use the description above to understand this source.</p>'}</div></details>`;
  }

  function workbenchSection(data, section, title, copy) {
    const qs = data.questions.filter(q => q.workProduct?.section === section);
    if (!qs.length) return '';
    return `<section class="cm-wb-stage" id="cm-wb-${esc(section)}" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">ANALYST WORK PRODUCT</div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><span>${qs.length} output${qs.length===1?'':'s'}</span></div>${workbenchGuide(section,copy)}<div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>Northstar_Orion_Valuation_v03.xlsx</b><span>Model outputs · $ in millions unless noted</span></div>${qs.map(q=>`<div class="cm-wb-row"><div><strong>${esc(q.workProduct?.label || q.prompt)}</strong><p>${esc(q.workProduct?.instruction || '')}</p></div>${workbenchField(q)}</div>`).join('')}</div></section>`;
  }


  function careerWorkbenchField(q) {
    const wp=q.workProduct||{};
    if(q.type==='numeric') return `<div class="cm-wb-input"><span class="cm-wb-cell">${esc(wp.cell||'OUT')}</span><label>${esc(wp.label||q.prompt)}${q.unit?` <small>${esc(q.unit)}</small>`:''}<input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" placeholder="Enter calculated output"></label></div>`;
    return `<label class="cm-wb-text-output"><span>${esc(wp.label||q.prompt)}</span><textarea name="${esc(q.id)}" required maxlength="3000" placeholder="Write the work note you would put in the file or send to your reviewer…"></textarea></label>`;
  }

  function renderCareerSimulationWorkbench(data,pathwayId,itemId,el){
    const p=data.simulationProfile; const sections=[...new Set(data.questions.map(q=>q.workProduct?.section||'analysis'))];
    const navItems=[{id:'cm-wb-files',label:'Source Files'},...sections.map(x=>({id:`cm-wb-${x}`,label:String(x).replace(/-/g,' ')})),{id:'cm-wb-email',label:'Manager Handoff'}];
    const standards=(p.reviewStandard||[]).map((x,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x)}</span></li>`).join('');
    const update=p.managerUpdate||null;
    const updateHtml=update?`<section class="cm-wb-stage cm-wb-live-update" id="cm-wb-live-update"><div class="cm-wb-stage-head"><div><div class="eyebrow">MID-ASSIGNMENT UPDATE · INBOX</div><h2>${esc(update.title)}</h2><p>${esc(update.timestamp)} · Your first draft is no longer enough. Re-open the affected work before you send anything to your reviewer.</p></div><span>NEW</span></div><article class="cm-wb-email cm-wb-new"><div class="cm-wb-email-meta"><b>${esc(p.reviewer)}</b><span>${esc(update.fileName)}</span></div><h3>New information — revise the work</h3><p>${esc(update.message)}</p><p><strong>Expected revised deliverable:</strong> ${esc(update.deliverable)}</p></article></section>`:'';
    el.innerHTML=`<section class="cm-wb-shell">
      <div class="cm-wb-top"><div class="container cm-wb-top-inner"><div><div class="eyebrow">PRACTICAL JOB SIMULATION · NO MULTIPLE CHOICE</div><h1>${esc(p.project)}</h1><p>${esc(p.role)} · Complete the work, not a quiz.</p></div><div class="cm-wb-deadline"><span>Review deadline</span><strong>${esc(p.deadline)}</strong></div></div></div>
      <div class="container cm-wb-layout">
        <aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CASE / CLIENT</span><strong>${esc(p.client)}</strong><span>REVIEWER</span><strong>${esc(p.reviewer)}</strong></div>${workbenchProgress()}<nav aria-label="Simulation steps">${navItems.map((x,i)=>workbenchNavButton(i+1,x.id,x.label)).join('')}</nav><div class="cm-security-note"><strong>Real-work grading</strong><br>No simulation answer key is sent to the browser. Numerical outputs and work notes are evaluated by the Worker and the official score is recorded in D1.</div><a class="btn btn-outline btn-block" href="#/career/${encodeURIComponent(pathwayId)}">Exit Workbench</a></aside>
        <main class="cm-wb-main">
          <section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>${esc(p.objective)}</h2><p>Work the assignment the way a junior professional would: inspect the source packet, build the requested outputs, react to a role-native mid-assignment update, QA the result, and send a structured reviewer-facing recommendation. This simulation tests job execution—not answer recognition.</p></div><div class="cm-wb-status"><b>${data.masteryScore}%</b><span>minimum standard</span><small>${esc(data.assessmentVersion)}</small></div></section>
          ${standards?`<section class="cm-wb-review-standard" aria-labelledby="cm-wb-standard-title"><div><div class="eyebrow">REVIEWER ACCEPTANCE STANDARD</div><h2 id="cm-wb-standard-title">What makes this deliverable decision-ready</h2><p>This is the quality bar your submission is reviewed against. It tells you the professional standard without exposing scoring keys or answers.</p></div><ol>${standards}</ol></section>`:''}
          <section class="cm-wb-stage" id="cm-wb-files" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">SOURCE PACKET</div><h2>Open the case files before building</h2><p>Trace every requested output back to the case data. All names and figures are synthetic training material.</p></div><span>${(p.files||[]).length} files</span></div>${workbenchGuide('generic','Open each source, identify the evidence it contains, and connect it to the requested work product before calculating or writing.')}<div class="cm-wb-files">${(p.files||[]).map(renderWorkbenchFile).join('')}</div></section>
          ${updateHtml}
          <form id="cm-official-form" data-structured-writing="true">
            ${sections.map((section,si)=>{const qs=data.questions.filter(q=>(q.workProduct?.section||'analysis')===section);return `<section class="cm-wb-stage" id="cm-wb-${esc(section)}" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">WORK PRODUCT ${String(si+1).padStart(2,'0')}</div><h2>${esc(String(section).replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()))}</h2><p>Produce the output in the format you would hand to your reviewer. Do not guess—use the source packet and document the logic.</p></div><span>${qs.length} required output${qs.length===1?'':'s'}</span></div>${workbenchGuide('generic','Use the source packet to produce this role-native output, document the logic, and review it against the acceptance standard.')}<div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>${esc(p.project.replace(/\s+/g,'_'))}_Working_v01</b><span>Training work product · synthetic data</span></div>${qs.map(q=>`<div class="cm-wb-row ${q.type==='text'?'cm-wb-row-text':''}"><div><strong>${esc(q.workProduct?.label||q.prompt)}</strong><p>${esc(q.workProduct?.instruction||'')}</p></div>${careerWorkbenchField(q)}</div>`).join('')}</div></section>`}).join('')}
            <section class="cm-wb-stage" id="cm-wb-email" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">FINAL REVIEW DELIVERABLE</div><h2>Send the manager handoff</h2><p>Write the four parts a reviewer needs to make a decision. Your case outputs should appear as evidence—not as an unsourced conclusion.</p></div><span>30 points</span></div>${workbenchGuide('generic','Package the decision, case evidence, material risk, and controlled next action into a concise manager-ready handoff.')}<div class="cm-wb-compose cm-wb-structured"><div><span>To</span><b>${esc(p.reviewer)}</b></div><div><span>Subject</span><b>${esc(p.project)} — analysis & recommendation</b></div><label><span>1 · Decision / recommendation</span><textarea name="writingDecision" maxlength="1200" minlength="30" required placeholder="State the decision directly and define any condition or boundary."></textarea></label><label><span>2 · Case evidence</span><textarea name="writingEvidence" maxlength="1800" minlength="100" required placeholder="Cite the calculated outputs and source-backed facts that support the decision."></textarea></label><label><span>3 · Material risk / what could change</span><textarea name="writingRisk" maxlength="1400" minlength="70" required placeholder="Name the material downside, assumption, constraint or exception and its decision impact."></textarea></label><label><span>4 · Controlled next action</span><textarea name="writingAction" maxlength="1200" minlength="60" required placeholder="State the diligence, rerun, escalation, implementation or monitoring step, including an owner or trigger where relevant."></textarea></label></div></section>
            <button class="btn btn-primary btn-block cm-wb-submit" type="submit">Submit Manager Handoff for Review →</button><div class="cm-wb-submit-note">This is the job simulation. The separate final checks knowledge, calculations and workflow judgment; it does not replace this work product.</div>
          </form>
        </main>
      </div>
    </section>`;
    bindWorkbenchInteractions(el);
    bindOfficialAssessmentSubmit(data,pathwayId,itemId);
  }

  function bindWorkbenchInteractions(root=document) {
    const shell=root.querySelector?.('.cm-wb-shell')||root.closest?.('.cm-wb-shell');
    if(!shell || shell.dataset.cmWorkbenchBound==='1') return;
    shell.dataset.cmWorkbenchBound='1';
    const buttons=[...shell.querySelectorAll('[data-cm-wb-target]')];
    let manualTarget='';
    let manualSelectionUntil=0;
    const setActive=button=>{
      buttons.forEach(x=>x.removeAttribute('aria-current'));
      button?.setAttribute('aria-current','step');
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const target=shell.querySelector(`#${CSS.escape(button.dataset.cmWbTarget||'')}`);
      if(!target) return;
      manualTarget=target.id;
      manualSelectionUntil=Date.now()+800;
      setActive(button);
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
      window.setTimeout(()=>target.focus({preventScroll:true}),reduced?0:350);
    }));
    if('IntersectionObserver' in window){
      const byId=new Map(buttons.map(x=>[x.dataset.cmWbTarget,x]));
      const observer=new IntersectionObserver(entries=>{
        const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(!visible) return;
        if(Date.now()<manualSelectionUntil && visible.target.id!==manualTarget) return;
        if(visible.target.id===manualTarget) manualSelectionUntil=0;
        setActive(byId.get(visible.target.id));
      },{rootMargin:'-18% 0px -62% 0px',threshold:[0,.15,.45]});
      byId.forEach((_,id)=>{const target=shell.querySelector(`#${CSS.escape(id||'')}`);if(target)observer.observe(target);});
    }
    const controls=[...shell.querySelectorAll('#cm-official-form input[required]:not([disabled]),#cm-official-form textarea[required]:not([disabled]),#cm-official-form select[required]:not([disabled])')];
    const updateProgress=()=>{
      const done=controls.filter(x=>x.type==='radio'?shell.querySelector(`input[name="${CSS.escape(x.name)}"]:checked`):String(x.value||'').trim()).length;
      const uniqueTotal=controls.filter((x,i,a)=>x.type!=='radio'||a.findIndex(y=>y.type==='radio'&&y.name===x.name)===i).length;
      const uniqueDone=controls.filter((x,i,a)=>x.type!=='radio'||a.findIndex(y=>y.type==='radio'&&y.name===x.name)===i).filter(x=>x.type==='radio'?shell.querySelector(`input[name="${CSS.escape(x.name)}"]:checked`):String(x.value||'').trim()).length;
      const pct=uniqueTotal?Math.round(uniqueDone/uniqueTotal*100):0;
      shell.querySelectorAll('[data-cm-wb-progress-text]').forEach(x=>x.textContent=`${uniqueDone} of ${uniqueTotal} outputs complete`);
      shell.querySelectorAll('[data-cm-wb-progress-bar]').forEach(x=>x.style.width=`${pct}%`);
      shell.querySelectorAll('.cm-wb-progress-track').forEach(x=>x.setAttribute('aria-valuenow',String(pct)));
      void done;
    };
    controls.forEach(x=>{x.addEventListener('input',updateProgress);x.addEventListener('change',updateProgress);});
    updateProgress();
    shell.querySelectorAll('.cm-wb-file').forEach(file=>file.addEventListener('toggle',()=>{
      const label=file.querySelector('.cm-wb-file-open-label');
      if(label)label.textContent=file.open?'Close file preview':'Open file preview';
    }));
  }

  function renderIbSimulationWorkbench(data, pathwayId, itemId, el) {
    const p = data.simulationProfile;
    const navItems=[
      ['cm-wb-inbox','Inbox'],['cm-wb-data','Data Room'],['cm-wb-model','Transaction Model'],
      ['cm-wb-valuation','Trading Comps'],['cm-wb-precedents','Precedents'],['cm-wb-dcf','DCF'],
      ['cm-wb-update','Management Update'],['cm-wb-qa','Model QA'],
      ['cm-wb-client-materials','Client Takeaway'],['cm-wb-email','Associate Email']
    ];
    el.innerHTML = `<section class="cm-wb-shell">
      <div class="cm-wb-top"><div class="container cm-wb-top-inner"><div><div class="eyebrow">PRACTICAL ANALYST JOB SIMULATION · NO MULTIPLE CHOICE</div><h1>${esc(p.project)}</h1><p>${esc(p.role)} · ${esc(p.desk)} · Build the actual work product.</p></div><div class="cm-wb-deadline"><span>Associate deadline</span><strong>${esc(p.deadline)}</strong></div></div></div>
      <div class="container cm-wb-layout">
        <aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CLIENT</span><strong>${esc(p.client)}</strong><span>TARGET</span><strong>${esc(p.target)}</strong></div>${workbenchProgress()}<nav aria-label="Orion case steps">${navItems.map((x,i)=>workbenchNavButton(i+1,x[0],x[1])).join('')}</nav><div class="cm-security-note"><strong>Authoritative grading</strong><br>The Worker grades every output and records the official result in D1. No answer key is sent to the browser.</div><a class="btn btn-outline btn-block" href="#/career/${encodeURIComponent(pathwayId)}">Exit Workbench</a></aside>
        <main class="cm-wb-main">
          <section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>${esc(p.objective)}</h2><p>This mirrors a junior analyst workday: read the request, inspect source files, build valuation outputs, react to new guidance, QA the model, and hand the decision to your Associate.</p></div><div class="cm-wb-status"><b>${data.masteryScore}%</b><span>minimum standard</span><small>${esc(data.assessmentVersion)}</small></div></section>
          <section class="cm-wb-quickstart" aria-labelledby="cm-wb-quickstart-title"><div><div class="eyebrow">START HERE</div><h2 id="cm-wb-quickstart-title">A clear path through the case</h2><p>Work left to right. Open the files when you need them, complete each model block, and use the final two steps to turn analysis into judgment.</p></div><ol>${navItems.map((x,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x[1])}</span></li>`).join('')}</ol></section>
          <section class="cm-wb-stage" id="cm-wb-inbox" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / INBOX</div><h2>Associate instructions</h2><p>Read the full assignment and the later change before beginning the work.</p></div><span>${p.inbox.length} messages</span></div>${workbenchGuide('inbox')}${p.inbox.map((m,i)=>`<article class="cm-wb-email ${i===1?'cm-wb-new':''}"><div class="cm-wb-email-meta"><b>${esc(m.from)}</b><span>${esc(m.time)}</span></div><h3>${esc(m.subject)}</h3><p>${esc(m.body)}</p></article>`).join('')}</section>
          <section class="cm-wb-stage" id="cm-wb-data" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">VIRTUAL DATA ROOM</div><h2>Open the project files</h2><p>Each card explains what the file is and what it supports. Open it for a realistic read-only preview.</p></div><span>${p.files.length} files</span></div>${workbenchGuide('data')}<div class="cm-wb-files">${p.files.map(renderWorkbenchFile).join('')}</div></section>
          <form id="cm-official-form" data-structured-writing="true">
            ${workbenchSection(data,'model','Transaction Model','Build the capitalization bridge and headline transaction multiple from the source files.')}
            ${workbenchSection(data,'valuation','Trading Comps & Implied Value','Calculate the defensible peer-set output from the selected comparable companies.')}
            ${workbenchSection(data,'precedents','Precedent Transactions','Spread the transaction multiples and calculate the implied value from the relevant precedent set.')}
            ${workbenchSection(data,'dcf','DCF Valuation','Use the forecast free cash flow, WACC and terminal-growth assumptions to build the intrinsic-value cross-check.')}
            ${workbenchSection(data,'update','Management Update','New information arrived at 2:17 PM. Update the forecast and every dependent output before continuing.')}
            ${workbenchSection(data,'qa','Model QA','Find, document and correct the material model issue before senior review.')}
            ${workbenchSection(data,'client-materials','Client / Senior-Review Takeaway','Turn the model outputs into the concise decision-relevant takeaway that belongs in senior-review materials.')}
            <section class="cm-wb-stage" id="cm-wb-email" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / COMPOSE</div><h2>Email the Associate</h2><p>Use the four-part handoff below so the reviewer can scan your conclusion, evidence, risks, and action.</p></div><span>30 points</span></div>${workbenchGuide('email')}<div class="cm-wb-compose cm-wb-structured"><div><span>To</span><b>${esc(p.associate)}</b></div><div><span>Cc</span><b>${esc(p.vp)}</b></div><div><span>Subject</span><b>${esc(p.project)} — updated valuation & recommendation</b></div><label><span>1 · Decision / recommendation</span><textarea name="writingDecision" maxlength="1200" minlength="30" required placeholder="State whether Northstar should continue diligence and any condition on that recommendation."></textarea></label><label><span>2 · Valuation evidence & management update</span><textarea name="writingEvidence" maxlength="1800" minlength="100" required placeholder="Reconcile the offer with comps, precedents, and DCF; quantify what changed after revised guidance."></textarea></label><label><span>3 · Material risks / diligence</span><textarea name="writingRisk" maxlength="1400" minlength="70" required placeholder="Name at least two case-specific risks and explain why they could change the decision."></textarea></label><label><span>4 · Controlled next action</span><textarea name="writingAction" maxlength="1200" minlength="60" required placeholder="State the next diligence, model, or review action and who should own it."></textarea></label></div></section>
            <button class="btn btn-primary btn-block cm-wb-submit" type="submit">Send Work for Associate Review →</button><div class="cm-wb-submit-note">Automatic pass standard: 80% overall, at least 75% of required work products accepted, and at least 20/30 on the professional writing rubric. You can revise and resubmit.</div>
          </form>
        </main>
      </div>
    </section>`;
    bindWorkbenchInteractions(el);
    bindOfficialAssessmentSubmit(data, pathwayId, itemId);
  }

  function bindOfficialAssessmentSubmit(data, pathwayId, itemId) {
    document.getElementById('cm-official-form')?.addEventListener('submit', async event => {
      const assignmentId=hashQuery().get('assignment')||'';
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
      const formData=new FormData(form);
      const writing = form.dataset.structuredWriting==='true'
        ? [
            `Decision / recommendation:\n${String(formData.get('writingDecision')||'')}`,
            `Case evidence:\n${String(formData.get('writingEvidence')||'')}`,
            `Material risk / what could change:\n${String(formData.get('writingRisk')||'')}`,
            `Controlled next action:\n${String(formData.get('writingAction')||'')}`
          ].join('\n\n')
        : String(formData.get('writing') || '');
      try {
        button.disabled = true;
        button.textContent = itemId === 'simulation' ? 'Sending to Associate review…' : 'Grading securely…';
        savedReviewCache.delete(savedReviewCacheKey(pathwayId,itemId));
        const result = await apiFetch('/assessment/submit', { method:'POST', body:JSON.stringify({ pathwayId:apiPathway(pathwayId), itemId, answers, writing, assignmentId:assignmentId||null }) });
        mirrorOfficialResult(pathwayId, itemId, result.score, result.passed);
        renderResult(pathwayId, itemId, result, assignmentId);
      } catch (error) {
        button.disabled = false;
        button.textContent = itemId === 'simulation' ? 'Send Work for Associate Review →' : 'Submit Again';
        showInlineError(form, error.message);
      }
    });
  }

  function professionalSimulationPayload(data){
    const kind=data?.simulationProfile?.kind;
    if(!['ib-deal-workbench-v2','career-workbench-v2'].includes(kind)) return false;
    if(!Array.isArray(data?.questions)||!data.questions.length) return false;
    return data.questions.every(q=>{
      if(!['numeric','text'].includes(q?.type)) return false;
      if(Array.isArray(q?.options)&&q.options.length) return false;
      return !!q?.workProduct;
    });
  }

  function renderProfessionalSimulationUnavailable(pathwayId,el){
    el.innerHTML=`<section class="section"><div class="container" style="max-width:860px"><div class="card cm-live-card cm-workbench-required"><div class="eyebrow">PROFESSIONAL JOB SIMULATION</div><h1 class="serif">Professional workbench update required.</h1><p>This pathway will not present a multiple-choice or answer-picking exercise as a job simulation. The official simulation must provide source files, calculated or authored work products, and a reviewer-facing handoff.</p><p class="muted">Your course progress is preserved. Return to the pathway while the secure workbench generation is updated.</p><div class="cm-result-actions"><a class="btn btn-primary" href="#/career/${encodeURIComponent(pathwayId)}">Back to pathway →</a><a class="btn btn-outline" href="#/learn/${encodeURIComponent(pathwayId)}/5">Review simulation briefing</a></div></div></div></section>`;
  }

  function localLearningComplete(pathwayId,itemId){
    const part=/^part-(\d+)$/.exec(itemId||'');
    if(!part) return true;
    try{
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      const completed=state?.careers?.[pathwayId]?.learningComplete;
      return Array.isArray(completed)&&completed.includes(Number(part[1]));
    }catch(_){ return false; }
  }

  function localSimulationPassed(pathwayId){
    try{
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      return Number(state?.careers?.[pathwayId]?.simulationScore||0)>=PASS;
    }catch(_){ return false; }
  }

  function learnerResumeHref(pathwayId,itemId){
    const stateApi=window.CM_COURSE_STATE;
    const current=/^part-\d+$/.test(itemId||'')?`${itemId}-assessment`:itemId;
    if(stateApi?.resolveLearnerCourseState){
      const course=stateApi.resolveLearnerCourseState(pathwayId,{track:stateApi.selectedTrack(pathwayId),authenticated:false});
      const stage=course.stages.find(entry=>entry.id===current);
      if(stage?.status==='locked'||stage?.passed) return course.nextDestination;
      if(stage?.route) return stage.route;
      return course.nextDestination;
    }
    const part=/^part-(\d+)$/.exec(itemId||'');
    return part?`#/learn/${encodeURIComponent(pathwayId)}/${part[1]}`:`#/career/${encodeURIComponent(pathwayId)}`;
  }

  function renderLockedAssessmentPreview(pathwayId,itemId,message='Complete the required course work first.'){
    const el=main(); if(!el) return;
    const part=/^part-(\d+)$/.exec(itemId||'');
    const label=itemId==='simulation'?'Job Simulation':itemId==='final'?'Professional Readiness Final':part?`Part ${Number(part[1])} Assessment`:'Course stage';
    el.innerHTML=`<section class="section cm-course-locked-preview"><div class="container" style="max-width:900px"><div class="card cm-live-card"><div class="eyebrow">LOOK AHEAD · READ-ONLY</div><span class="cm-lock-state">🔒 Locked for now</span><h1 class="serif">${esc(label)}</h1><p>You can preview where this stage fits, but questions and submission controls stay unavailable until every prerequisite is complete.</p><div class="cm-lock-requirements"><strong>Required first</strong><span>${esc(message)}</span><small>Your saved progress has not changed.</small></div><div class="cm-result-actions"><a class="btn btn-primary" href="${esc(learnerResumeHref(pathwayId,itemId))}">Continue where you left off →</a><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">View pathway</a></div></div></div></section>`;
  }

  async function renderAssessment(pathwayId, itemId) {
    if (!authReady()) {
      waitForAuthReady('Checking your account…');
      return;
    }
    clearAuthWait();
    if (!signedIn()) {
      renderAuthRequired();
      return;
    }

    const forceRetry=hashQuery().get('retake')==='1';
    const savedBest=mirroredBestScore(pathwayId,itemId);
    if(itemId!=='simulation' && savedBest>=PASS){
      await renderSavedAssessmentReview(pathwayId,itemId,savedBest);
      return;
    }
    if(itemId!=='simulation'&&!forceRetry){
      try{
        const saved=await apiFetch(`/assessment/review/${encodeURIComponent(apiPathway(pathwayId))}/${encodeURIComponent(itemId)}`);
        if(saved?.review){
          await renderSavedAssessmentReview(pathwayId,itemId,Number(saved.review.score||savedBest||0),saved.review);
          return;
        }
      }catch(error){
        if(Number(error?.status)!==404) console.warn('Could not preload assessment review:',error);
      }
    }
    const renderEpoch = secureRouteEpoch;
    const renderHash = location.hash;
    const signal = secureRouteController?.signal;
    renderLoading();
    try {
      const assignmentId=hashQuery().get('assignment')||'';
      const query=assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:'';
      const data = await apiFetch(`/assessment/${encodeURIComponent(apiPathway(pathwayId))}/${encodeURIComponent(itemId)}${query}`, { signal });
      if (!secureRouteCurrent(renderEpoch, renderHash)) return;
      if(data.reviewOnly&&itemId!=='simulation'){
        await renderSavedAssessmentReview(pathwayId,itemId,Number(data.bestScore||savedBest||0));
        return;
      }
      if(itemId!=='simulation'&&!localLearningComplete(pathwayId,itemId)){
        const n=Number((/^part-(\d+)$/.exec(itemId)||[])[1]||0);
        const priorMissing=n>1&&mirroredBestScore(pathwayId,`part-${n-1}`)<PASS;
        renderLockedAssessmentPreview(pathwayId,itemId,priorMissing
          ? `Pass Part ${n-1} assessment, then complete Part ${n} learning before starting this assessment.`
          : `Complete Part ${n} learning before starting its assessment.`);
        return;
      }
      if(itemId==='final'&&!localSimulationPassed(pathwayId)){
        renderLockedAssessmentPreview(pathwayId,itemId,'Pass the official Job Simulation before starting the Professional Readiness Final.');
        return;
      }
      const el = main();
      if (!el) return;
      const isSimulation = itemId === 'simulation';
      const isFinal = itemId === 'final';
      if (isSimulation && !professionalSimulationPayload(data)) {
        renderProfessionalSimulationUnavailable(pathwayId,el);
        return;
      }
      if (isSimulation && data.simulationProfile?.kind === 'ib-deal-workbench-v2') {
        renderIbSimulationWorkbench(data, pathwayId, itemId, el);
        return;
      }
      if (isSimulation && data.simulationProfile?.kind === 'career-workbench-v2') {
        renderCareerSimulationWorkbench(data, pathwayId, itemId, el);
        return;
      }
      const label = isSimulation ? 'OFFICIAL JOB SIMULATION' : isFinal ? 'FINAL EXAMINATION' : `OFFICIAL ${itemId.toUpperCase()} ASSESSMENT`;
      el.innerHTML = `<section class="cm-official-shell"><div class="container cm-official-wrap"><div class="cm-official-head"><div><div class="eyebrow">${label}</div><h1>${esc(data.pathway.title)}</h1><p>${data.questionCount} questions${isSimulation ? ' + written recommendation' : ''} · ${data.masteryScore}% required · Server graded</p></div><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Exit</a></div><div class="cm-security-note"><strong>Verified assessment:</strong> answers are graded by the Cloudflare Worker and official scores are stored in D1. Browser-edited scores cannot issue a credential.</div><form id="cm-official-form">${data.questions.map(questionHtml).join('')}${data.writingPrompt ? `<div class="cm-writing"><h3>Written recommendation</h3><p>${esc(data.writingPrompt)}</p><textarea name="writing" maxlength="5000" required placeholder="Write a concise, evidence-based recommendation…"></textarea></div>` : ''}<button class="btn btn-primary btn-block" type="submit">Submit Official ${isFinal ? 'Final Exam' : isSimulation ? 'Simulation' : 'Assessment'}</button></form></div></section>`;

      bindOfficialAssessmentSubmit(data, pathwayId, itemId);
    } catch (error) {
      if (error?.name === 'AbortError' || !secureRouteCurrent(renderEpoch, renderHash)) return;
      const el = main();
      if (!el) return;
      if([403,409].includes(Number(error?.status))||/complete|earn|prerequisite|already passed/i.test(String(error?.message||''))){
        if(/already passed/i.test(String(error?.message||''))&&itemId!=='simulation') await renderSavedAssessmentReview(pathwayId,itemId,savedBest);
        else renderLockedAssessmentPreview(pathwayId,itemId,error.message);
        return;
      }
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
      document.dispatchEvent(new CustomEvent('cm-progress-updated',{detail:{pathwayId,itemId,score:Number(score||0),passed:!!passed}}));
      window.CM_SYNC?.flush?.().catch(() => {});
    } catch (error) {
      console.warn('Could not mirror official result into learner UI state:', error);
    }
  }

  function mirroredBestScore(pathwayId,itemId){
    try {
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      const cs=state?.careers?.[pathwayId];
      if(!cs) return 0;
      const part=/^part-(\d+)$/.exec(itemId);
      if(part){
        const n=Number(part[1]);
        return n===5?Number(cs.simulationKnowledge||0):Number(cs.quizScores?.[n]||0);
      }
      if(itemId==='final') return Number(cs.finalScore||0);
      return 0;
    } catch (_) { return 0; }
  }

  function retryHref(pathwayId,itemId,assignmentId=''){
    const nonce=Date.now();
    if(itemId==='simulation'){
      const params=new URLSearchParams();
      if(assignmentId) params.set('assignment',assignmentId);
      params.set('retake','1'); params.set('attempt',String(nonce));
      return `#/official-simulation/${pathwayId}?${params.toString()}`;
    }
    if(itemId==='final') return `#/final/${pathwayId}?retake=1&attempt=${nonce}`;
    const n=Number(itemId.split('-')[1]);
    return `#/quiz/${pathwayId}/${n}?retake=1&attempt=${nonce}`;
  }

  function attemptReviewHref(pathwayId,itemId){
    if(itemId==='final') return `#/final/${encodeURIComponent(pathwayId)}?review=1`;
    const n=Number(String(itemId||'').split('-')[1]);
    return `#/quiz/${encodeURIComponent(pathwayId)}/${n}?review=1`;
  }

  function reviewQuestionHtml(item,index){
    const status=item.correct===true?'correct':'incorrect';
    const submitted=item.submitted===null||item.submitted===undefined||item.submitted===''?'No answer recorded':String(item.submitted);
    return `<article class="cm-review-item ${status}"><div class="cm-review-qhead"><span>${index+1}</span><div><strong>${esc(item.prompt||`Question ${index+1}`)}</strong><small>${item.correct===true?'Correct':'Needs review'}</small></div></div><div class="cm-review-answer"><small>Your submitted answer</small><p>${esc(submitted)}</p></div>${item.correctAnswer!==null&&item.correctAnswer!==undefined&&item.correctAnswer!==''?`<p class="cm-review-correct"><strong>Correct answer:</strong> ${esc(item.correctAnswer)}</p>`:''}${item.rationale?`<p class="cm-review-explain">${esc(item.rationale)}</p>`:''}</article>`;
  }

  function savedReviewCacheKey(pathwayId,itemId){
    return `${window.CM_AUTH?.user?.uid||'signed-out'}:${apiPathway(pathwayId)}:${itemId}`;
  }

  async function renderSavedAssessmentReview(pathwayId,itemId,best,providedReview=null){
    const el=main(); if(!el) return;
    if(el.querySelector('.cm-server-assessment-review')) return;
    const reviewHash=location.hash;
    const cacheKey=savedReviewCacheKey(pathwayId,itemId);
    const part=/^part-(\d+)$/.exec(itemId);
    const n=part?Number(part[1]):null;
    const label=itemId==='final'?'Professional Readiness Final':n===5?'Job Simulation Knowledge Check':`Part ${n} Assessment`;
    let review=providedReview||savedReviewCache.get(cacheKey)||null;
    if(!review){
      const reviewToken=String(++savedReviewSequence);
      el.innerHTML=`<section class="section cm-server-assessment-review" data-cm-review-token="${reviewToken}"><div class="container" style="max-width:980px"><div class="card cm-live-card"><div class="eyebrow">SAVED PASS · LOADING READ-ONLY REVIEW</div><h1 class="serif">${esc(label)}</h1><p>Loading your submitted attempt from the authoritative record…</p></div></div></section>`;
      try{
        const data=await apiFetch(`/assessment/review/${encodeURIComponent(apiPathway(pathwayId))}/${encodeURIComponent(itemId)}`);
        review=data.review||null;
      }catch(error){
        if(!/not found|available/i.test(String(error?.message||''))) console.warn('Assessment review unavailable:',error);
      }
      if(review) savedReviewCache.set(cacheKey,review);
      if(!el.isConnected||location.hash!==reviewHash||!el.querySelector(`[data-cm-review-token="${reviewToken}"]`)) return;
    }else{
      savedReviewCache.set(cacheKey,review);
      if(!el.isConnected||location.hash!==reviewHash) return;
    }
    const expectedRoot=itemId==='final'?'final':'quiz';
    if(!location.hash.startsWith(`#/${expectedRoot}/${pathwayId}`)) return;
    const questions=Array.isArray(review?.questions)?review.questions:[];
    const score=Math.max(Number(best||0),Number(review?.score||0));
    const correct=questions.filter(item=>item.correct===true).length;
    const passed=review?.passed===true||score>=PASS;
    el.innerHTML=`<section class="section cm-server-assessment-review"><div class="container" style="max-width:980px"><div class="card cm-result ${passed?'passed':'failed'} cm-assessment-review" data-score="${score}"><div class="eyebrow">${passed?'SAVED PASS':'SAVED ATTEMPT'} · READ-ONLY REVIEW</div><div class="cm-result-score">${questions.length?`${correct} / ${questions.length}`:`${score}%`}</div><h1 class="serif">${passed?`${esc(label)} already passed.`:'Review before retrying.'}</h1><p><strong>${score}% · ${passed?'Passed':'Retry required'}.</strong> ${passed?'This passed attempt is final. It is read from your authoritative record, creates no new attempt, and cannot be reopened as a blank assessment.':'Your submitted answers and feedback are saved. Review every question below; a new attempt begins only when you explicitly choose Retry.'}</p>${questions.length?`<div class="cm-review-list">${questions.map(reviewQuestionHtml).join('')}</div>`:`<div class="cm-review-history-note"><strong>${passed?'This pass predates saved-answer review.':'Answer details are unavailable for this older attempt.'}</strong><span>${passed?'The official score remains valid. Future submissions preserve the submitted answers, correctness, correct answer, rationale, score, and completion time for private review.':'Your score remains saved. You can review the learning before starting another attempt.'}</span></div>`}${review?.submittedAt?`<p class="small muted">Completed ${esc(formatDate(review.submittedAt))} · Attempt ${esc(review.attemptId||'')}</p>`:''}<div class="cm-result-actions">${passed?`<a class="btn btn-gold" data-cm-pass-continue href="${nextHref(pathwayId,itemId,true)}">Continue to next stage →</a>`:`<a class="btn btn-primary" href="${retryHref(pathwayId,itemId)}">Retry assessment →</a>`}<a class="btn btn-soft" href="#/learn/${encodeURIComponent(pathwayId)}/${n||5}">Review learning</a></div></div></div></section>`;
  }

  function nextHref(pathwayId, itemId, passed, assignmentId='') {
    if (!passed) return retryHref(pathwayId,itemId,assignmentId);
    if(/^part-\d+$/.test(itemId)&&window.CM_COURSE_STATE?.getNextCourseDestination){
      return window.CM_COURSE_STATE.getNextCourseDestination({pathway:pathwayId,currentStage:itemId,track:window.CM_COURSE_STATE.selectedTrack(pathwayId),assignmentId});
    }
    if (/^part-[1-4]$/.test(itemId)) {
      const n = Number(itemId.split('-')[1]);
      return `#/learn/${pathwayId}/${n+1}`;
    }
    if (itemId === 'part-5') return `#/official-simulation/${pathwayId}`;
    if (itemId === 'simulation') return assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/final/${pathwayId}`;
    return '#/credentials';
  }

  function renderResult(pathwayId, itemId, result, assignmentId='') {
    const el = main();
    if (!el) return;
    const issued = result.issuedCredentials || [];
    const completion = result.assignmentCompletion || null;
    const quality=result.qualityDecision||null;
    const rubric=Array.isArray(result.writingRubric)?result.writingRubric:[];
    const qualityHtml=itemId==='simulation'&&quality?`<section class="cm-quality-decision" aria-labelledby="cm-quality-title"><div><div class="eyebrow">AUTOMATIC QUALITY DECISION</div><h2 id="cm-quality-title">${quality.passed?'All professional floors met':'One or more professional floors need work'}</h2><p>The server applies the same auditable standard to every attempt; a high total cannot hide weak work products or a weak reviewer handoff.</p></div><div class="cm-quality-gates"><article class="${quality.scoreFloorMet?'met':'unmet'}"><b>${quality.scoreFloorMet?'✓':'!'}</b><span><strong>Overall</strong>${Number(result.score)}% / ${Number(quality.scoreFloor||PASS)}% required</span></article><article class="${quality.objectiveFloorMet?'met':'unmet'}"><b>${quality.objectiveFloorMet?'✓':'!'}</b><span><strong>Work products</strong>${Number(quality.objectivePercent||0)}% / ${Number(quality.objectiveFloor||75)}% required</span></article><article class="${quality.writingFloorMet?'met':'unmet'}"><b>${quality.writingFloorMet?'✓':'!'}</b><span><strong>Reviewer handoff</strong>${Number(result.writingScore||0)}/30 / ${Number(quality.writingFloor||20)}/30 required</span></article></div>${rubric.length?`<div class="cm-writing-rubric"><h3>Writing rubric</h3>${rubric.map(row=>`<div><span><strong>${esc(row.label)}</strong><small>${esc(row.evidence||'')}</small></span><b>${Number(row.earned)}/${Number(row.possible)}</b></div>`).join('')}</div>`:''}${Array.isArray(quality.reasons)&&quality.reasons.length?`<div class="cm-quality-next"><strong>What to improve next</strong><ul>${quality.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></div>`:''}</section>`:'';
    const resultHref=result.passed
      ? nextHref(pathwayId,itemId,true,assignmentId)
      : itemId==='simulation'?retryHref(pathwayId,itemId,assignmentId):attemptReviewHref(pathwayId,itemId);
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card cm-result ${result.passed ? 'passed' : 'failed'}" data-score="${Number(result.score)}"><div class="eyebrow">SERVER-GRADED RESULT</div><div class="cm-result-score">${Number(result.score)}%</div><h1 class="serif">${result.passed ? 'Official pass recorded.' : 'Not yet.'}</h1><p>${result.passed ? 'Your result has been stored in the authoritative D1 progress record.' : `You need ${PASS}% and every professional quality floor to pass. Your attempt is saved; review every answer before starting another attempt.`}</p>${result.objectiveTotal ? `<p class="muted">${itemId === 'simulation' ? 'Work products accepted' : 'Objective questions'}: ${result.objectiveCorrect}/${result.objectiveTotal}${result.writingScore !== null && result.writingScore !== undefined ? ` · Writing: ${result.writingScore}/30` : ''}</p>` : ''}${qualityHtml}${issued.length ? `<div class="cm-issued"><strong>Verified credential${issued.length > 1 ? 's' : ''} automatically issued:</strong>${issued.map(c => `<a href="#/verify/${encodeURIComponent(c.publicToken)}">${esc(c.title)} →</a>`).join('')}</div>` : ''}${completion ? `<div class="cm-issued cm-program-issued"><strong>Career Skills Program Completion Certificate issued:</strong><a href="#/verify/${encodeURIComponent(completion.publicToken)}">${esc(completion.title)} →</a><small>This completion certificate is separate from the five-level Standard 2.0 credential ladder.</small></div>` : ''}<div class="cm-result-actions"><a class="btn ${result.passed ? 'btn-gold' : 'btn-primary'}" href="${resultHref}">${result.passed ? (itemId === 'final' ? 'View Verified Credentials' : 'Continue') : (itemId === 'simulation' ? 'Revise and resubmit' : 'Review saved attempt')} →</a><a class="btn btn-outline" href="#/career/${encodeURIComponent(pathwayId)}">Pathway</a></div></div></div></section>`;
  }

  async function renderCredentials() {
    if (!authReady()) {
      waitForAuthReady('Checking your account…');
      return;
    }
    clearAuthWait();
    if (!signedIn()) {
      renderAuthRequired();
      return;
    }
    renderLoading('Loading credentials and program completions…');
    const el = main();
    try {
      const data = await apiFetch('/credentials/me');
      const credentials = data.credentials || [];
      const completions = data.programCompletions || [];
      const credentialSection = credentials.length
        ? `<div class="grid grid-3">${credentials.map(c => `<article class="card cm-credential-card"><span class="cm-status ${esc(c.status)}">${esc(c.status)}</span><div class="eyebrow">${esc(c.credential_level)}</div><h3>${esc(c.credential_title)}</h3><p><strong>Credential ID</strong><br><span class="small">${esc(c.credential_id)}</span></p><p><strong>Issued</strong><br>${formatDate(c.issued_at)}</p>${c.status === 'active' ? `<a class="btn btn-primary btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">Verify Credential →</a>` : `<div class="cm-live-error">This credential is ${esc(c.status)}.</div>`}</article>`).join('')}</div>`
        : `<div class="card"><h2>No verified Standard credentials yet.</h2><p>Complete official assessments at 80% or higher to earn verified credentials automatically.</p></div>`;
      const completionSection = completions.length
        ? `<section class="cm-program-completions"><div class="section-head"><div><div class="eyebrow">PROGRAM COMPLETIONS</div><h2>Career Skills completion certificates.</h2></div><p>These are server-backed program-completion records. They sit outside the five-level Standard 2.0 credential ladder and are not a sixth Standard credential.</p></div><div class="grid grid-3">${completions.map(c => `<article class="card cm-credential-card cm-program-completion-card"><span class="cm-status ${esc(c.status)}">${esc(c.status)}</span><div class="eyebrow">PROGRAM COMPLETION</div><h3>${esc(c.completion_title)}</h3><p><strong>Completion ID</strong><br><span class="small">${esc(c.completion_id)}</span></p><p><strong>Capstone</strong><br>${Number(c.capstone_score)}%</p><p><strong>Issued</strong><br>${formatDate(c.issued_at)}</p>${c.status === 'active' ? `<a class="btn btn-primary btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">Verify Program Completion →</a>` : `<a class="btn btn-outline btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">View ${esc(c.status)} Record →</a>`}</article>`).join('')}</div></section>`
        : '';
      el.innerHTML = `<section class="page-hero"><div class="container"><div class="eyebrow">VERIFIED CREDENTIALS & COMPLETIONS</div><h1>Your Capital Mastery records.</h1><p>Verified Standard credentials and Career Skills program completions are stored separately in the authoritative D1 database.</p></div></section><section class="section-tight"><div class="container"><div class="section-head"><div><div class="eyebrow">STANDARD 2.0 CREDENTIALS</div><h2>Verified career credentials.</h2></div><p>Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness make up the five-level verified ladder.</p></div>${credentialSection}${completionSection}${!credentials.length && !completions.length ? `<div class="card" style="margin-top:18px"><a class="btn btn-primary" href="#/careers">Explore pathways →</a></div>` : ''}</div></section>`;
    } catch (error) {
      el.innerHTML = errorCard('Could not load credentials.', error.message);
    }
  }

  async function renderVerify(publicToken) {
    renderLoading('Verifying record…');
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
      const isProgramCompletion = data.recordType === 'program_completion' || c?.recordType === 'program_completion';
      const competency=evidence.find(x=>x.type==='competency_profile');
      const competencies=competency?.competencies||[];
      const workEvidence=evidence.filter(x=>['assessment','role_lab','readiness'].includes(x.type));
      const completionEvidence=evidence.find(x=>x.type==='program_completion');
      const evidenceHtml=isProgramCompletion
        ? `<div class="cm-public-evidence"><div class="eyebrow">WHAT THIS PROGRAM COMPLETION PROVES</div><div class="grid grid-3"><div class="card"><strong>Verified Standard milestones</strong><p>${Number(completionEvidence?.requiredVerifiedCredentials||3)} required</p><small>Foundations · Essentials · Applied Skills</small></div><div class="card"><strong>Practical capstone</strong><p>${completionEvidence?.score!=null?`${Number(completionEvidence.score)}%`:'Verified pass'}</p><small>Minimum ${Number(completionEvidence?.minimumScore||PASS)}%</small></div><div class="card"><strong>Record type</strong><p>Program completion</p><small>Not a sixth Standard 2.0 credential</small></div></div></div>`
        : ((workEvidence.length||competencies.length)?`<div class="cm-public-evidence"><div class="eyebrow">WHAT THIS CREDENTIAL PROVES</div>${workEvidence.length?`<div class="grid grid-3">${workEvidence.map(x=>`<div class="card"><strong>${esc(x.title||x.type)}</strong><p>${x.score!=null?`${Number(x.score)}%`:x.overallScore!=null?`${Number(x.overallScore)}% readiness`:'Verified evidence'}</p>${x.evidenceCoverage!=null?`<small>${Number(x.evidenceCoverage)}% evidence coverage</small>`:''}</div>`).join('')}</div>`:''}${competencies.length?`<h3>Measured competencies</h3><div class="cm-public-skills">${competencies.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><b>${Number(x.score)}%</b><small>Target ${Number(x.minimumScore)}% · ${Number(x.evidenceCount)} evidence</small></div>`).join('')}</div>`:''}</div>`:'');
      const badge = data.valid
        ? (isProgramCompletion ? 'VERIFIED PROGRAM COMPLETION ✓' : 'VERIFIED ACTIVE CREDENTIAL ✓')
        : (isProgramCompletion ? `PROGRAM COMPLETION ${String(c.status||'NOT ACTIVE').toUpperCase()}` : 'NOT ACTIVE');
      const eyebrow = isProgramCompletion ? 'CAPITAL MASTERY PROGRAM COMPLETION' : 'CAPITAL MASTERY CREDENTIAL';
      const idLabel = isProgramCompletion ? 'Completion ID' : 'Credential ID';
      const classification = isProgramCompletion ? 'Career Skills program' : String(c.level||'').replace(/_/g,' ');
      const standardText = isProgramCompletion ? '3 verified Standard 2.0 milestones + capstone' : (c.standardVersion||'1.0 legacy');
      el.innerHTML = `<section class="section"><div class="container" style="max-width:980px"><div class="cm-verification ${data.valid ? 'valid' : 'invalid'}" data-record-type="${isProgramCompletion?'program_completion':'credential'}"><span class="cm-verify-badge ${data.valid?'':'invalid'}">${esc(badge)}</span><div class="eyebrow">${eyebrow}</div><h1 class="serif">${esc(c.title)}</h1><p>Issued to <strong>${esc(c.holderName)}</strong></p>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="grid grid-2"><div class="card"><strong>${idLabel}</strong><p>${esc(c.credentialId)}</p></div><div class="card"><strong>Issued</strong><p>${formatDate(c.issuedAt)}</p></div><div class="card"><strong>${isProgramCompletion?'Program':'Level'}</strong><p>${esc(classification)}</p></div><div class="card"><strong>${isProgramCompletion?'Completion standard':'Standard'}</strong><p>${esc(standardText)}</p></div></div>${evidenceHtml}${isProgramCompletion?'<div class="cm-security-note"><strong>Classification:</strong> This is an assignment-scoped Career Skills program-completion certificate supported by three verified Standard 2.0 credentials plus the practical capstone. It is not a sixth Standard 2.0 credential.</div>':''}<div class="cm-security-note"><strong>Verification source:</strong> Capital Mastery secure API → Cloudflare Worker → D1 authoritative ${isProgramCompletion?'program-completion':'credential and evidence'} records. Public verification excludes private account, organization, cohort and assignment identifiers.</div></div></div></section>`;
    } catch (error) {
      el.innerHTML = `<section class="section"><div class="container" style="max-width:780px"><div class="card"><span class="cm-verify-badge invalid">NOT VERIFIED</span><h1 class="serif">Verification record not found.</h1><p>${esc(error.message)}</p></div></div></section>`;
    }
  }

  function errorCard(title, message) {
    return `<section class="section"><div class="container" style="max-width:780px"><div class="card cm-live-card"><h1 class="serif">${esc(title)}</h1><p>${esc(message)}</p></div></div></section>`;
  }

  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value || '') : new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(d);
  }

  async function runRoute() {
    beginSecureRoute();
    const p = hashParts();
    const [root, a, b] = p;
    const adminQaPreview = window.CM_AUTH?.ready === true && window.CM_AUTH?.backendVerified === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';
    // The secure renderer never owns the protected Admin namespace. Entering it
    // aborts any in-flight learner request before that request can paint stale DOM.
    if (root === 'admin-preview') { clearAuthWait(); return; }
    if (adminQaPreview && root === 'official-simulation' && a) {
      clearAuthWait();
      location.replace(`#/admin-preview/simulation/${encodeURIComponent(a)}`);
      return;
    }
    // Admin QA deliberately falls back to local preview renderers. It does not call
    // authoritative submit endpoints, write D1 scores, or issue credentials.
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

  function route() {
    const authState = authReady()
      ? (window.CM_AUTH?.user?.uid ? `user:${window.CM_AUTH.user.uid}` : 'signed-out')
      : 'pending';
    const routeKey = `${location.hash || '#/'}|${authState}`;
    // Firebase can announce the same resolved identity more than once during
    // startup. Reuse the active render instead of aborting its assessment fetch
    // and leaving a deep-linked workbench on an empty app shell.
    if (routeInFlightPromise && routeInFlightKey === routeKey) return routeInFlightPromise;
    routeInFlightKey = routeKey;
    const task = runRoute().finally(() => {
      if (routeInFlightPromise === task) routeInFlightPromise = null;
    });
    routeInFlightPromise = task;
    return task;
  }

  function injectStyles() {
    if (document.getElementById('cm-live-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-live-styles';
    style.textContent = `
      .cm-official-shell{padding:50px 0 80px;background:var(--cream)}.cm-official-wrap{max-width:940px}.cm-official-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:24px}.cm-official-head h1{font-family:Georgia,"Times New Roman",serif;color:var(--navy);font-size:2.8rem;margin:4px 0 8px}.cm-security-note{padding:14px 16px;border:1px solid #c8d8cf;background:#f3fbf6;border-radius:12px;color:#315c49;margin:18px 0 24px}.cm-official-question{border:1px solid #dfe3e8;border-radius:16px;background:#fff;padding:20px;margin:0 0 16px}.cm-official-question legend{font-weight:800;color:var(--navy);padding:0 6px;display:flex;gap:10px}.cm-official-question legend span{width:28px;height:28px;border-radius:50%;background:#eef1f4;display:inline-grid;place-items:center;flex:none}.cm-official-option{display:grid;grid-template-columns:auto 30px 1fr;gap:10px;align-items:center;border:1px solid #e3e7eb;border-radius:12px;padding:11px 12px;margin:10px 0;cursor:pointer;background:#fff}.cm-official-option:hover{border-color:#c4a461}.cm-official-option>span{width:28px;height:28px;border-radius:50%;background:#f2f4f6;display:grid;place-items:center;font-weight:800}.cm-official-option p{margin:0}.cm-writing{background:#fff;border:1px solid #dfe3e8;border-radius:16px;padding:22px;margin:18px 0}.cm-writing textarea{width:100%;min-height:190px;border:1px solid #cbd2da;border-radius:12px;padding:14px;margin-top:8px}.cm-live-error{padding:12px 14px;border-radius:10px;background:#fff0f0;color:#8b3232;margin:12px 0}.cm-result{padding:34px;text-align:center}.cm-result-score{font-family:Georgia,"Times New Roman",serif;font-size:5rem;color:var(--navy);line-height:1}.cm-result.passed{border:1px solid #bad7c8}.cm-result.failed{border:1px solid #efcaca}.cm-issued{display:grid;gap:8px;text-align:left;background:#f7f1e4;border:1px solid #e2c991;border-radius:12px;padding:15px;margin:20px 0}.cm-issued a{color:var(--navy);font-weight:750;text-decoration:none}.cm-result-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.cm-quality-decision{text-align:left;margin:22px 0;padding:20px;border:1px solid #d5dee6;border-radius:14px;background:#f8fafb}.cm-quality-decision h2{margin:5px 0;color:#071a33}.cm-quality-decision p{margin:0;color:#5d6d7d}.cm-quality-gates{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:16px}.cm-quality-gates article{display:grid;grid-template-columns:28px 1fr;gap:8px;padding:11px;border:1px solid #d5dee6;border-radius:10px;background:#fff}.cm-quality-gates article>b{width:27px;height:27px;border-radius:50%;display:grid;place-items:center}.cm-quality-gates article.met>b{background:#dff1e6;color:#245b43}.cm-quality-gates article.unmet>b{background:#fde4e4;color:#8b3232}.cm-quality-gates span{display:grid;font-size:.72rem;color:#667586}.cm-quality-gates strong{color:#20364c}.cm-writing-rubric{margin-top:15px;border-top:1px solid #dce3e8;padding-top:12px}.cm-writing-rubric h3{margin:0 0 8px;color:#071a33}.cm-writing-rubric>div{display:grid;grid-template-columns:1fr auto;gap:12px;padding:9px 0;border-top:1px solid #e4e9ed}.cm-writing-rubric>div span{display:grid}.cm-writing-rubric small{color:#657588}.cm-quality-next{margin-top:12px;padding:11px 13px;background:#fff6e8;border-left:3px solid #b68a38;border-radius:8px}.cm-quality-next ul{margin:6px 0 0;padding-left:20px}.cm-status,.cm-verify-badge{display:inline-block;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;font-weight:900;border-radius:999px;padding:7px 10px;margin-bottom:12px}.cm-status.active,.cm-verify-badge{background:#e6f4eb;color:#245b43}.cm-status.revoked,.cm-status.reissued,.cm-verify-badge.invalid{background:#fff0f0;color:#8b3232}.cm-credential-card{display:flex;flex-direction:column}.cm-credential-card .btn{margin-top:auto}.cm-verification{background:#fff;border:1px solid #dfe3e8;border-radius:22px;padding:32px;box-shadow:var(--shadow-sm)}.cm-verification.valid{border-color:#bad7c8}.cm-verification.invalid{border-color:#efcaca}.cm-verification h1{font-size:2.8rem;color:var(--navy);margin:12px 0}.cm-live-card h1{color:var(--navy)}.cm-public-evidence{margin-top:24px;padding-top:22px;border-top:1px solid #e0e5e8}.cm-public-evidence h3{color:var(--navy);margin:22px 0 10px}.cm-public-skills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cm-public-skills>div{display:grid;grid-template-columns:1fr auto;gap:4px;background:#f5f7f8;border-radius:10px;padding:10px}.cm-public-skills small{grid-column:1/-1;color:#697580}
      .cm-wb-shell{min-height:100vh;background:#edf1f5;color:#172334}.cm-wb-top{background:#071a33;color:white;border-bottom:3px solid #c5a25d}.cm-wb-top-inner{display:flex;justify-content:space-between;gap:24px;align-items:center;padding-top:24px;padding-bottom:24px}.cm-wb-top h1{font-family:Georgia,"Times New Roman",serif;font-size:2.5rem;margin:5px 0}.cm-wb-top p{margin:0;color:#d6deea}.cm-wb-deadline{display:grid;text-align:right;gap:4px;padding:12px 16px;border:1px solid #53657d;border-radius:10px}.cm-wb-deadline span,.cm-wb-case-card span{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#718096;font-weight:850}.cm-wb-layout{display:grid;grid-template-columns:252px minmax(0,1fr);gap:24px;padding-top:24px;padding-bottom:60px}.cm-wb-sidebar{position:sticky;top:14px;align-self:start;background:#fff;border:1px solid #d8e0e7;border-radius:14px;padding:14px;box-shadow:0 7px 24px rgba(13,31,52,.08)}.cm-wb-case-card{display:grid;gap:5px;padding:10px 8px 15px;border-bottom:1px solid #e1e6eb;margin-bottom:8px}.cm-wb-case-card strong{color:#071a33}.cm-wb-sidebar nav{display:grid;gap:3px}.cm-wb-sidebar nav button{appearance:none;width:100%;display:grid;grid-template-columns:28px 1fr;align-items:center;gap:7px;padding:9px 10px;border:1px solid transparent;border-radius:9px;background:transparent;color:#34475d;font:inherit;font-weight:750;font-size:.84rem;text-align:left;cursor:pointer}.cm-wb-sidebar nav button b{font-size:.68rem;color:#78889a}.cm-wb-sidebar nav button:hover,.cm-wb-sidebar nav button:focus-visible{background:#eef3f7;color:#071a33;outline:2px solid #caa554;outline-offset:1px}.cm-wb-sidebar nav button[aria-current="step"]{background:#071a33;color:#fff;border-color:#071a33}.cm-wb-sidebar nav button[aria-current="step"] b{color:#e0c27d}.cm-wb-progress{display:grid;gap:7px;padding:10px 8px 13px}.cm-wb-progress>div:first-child{display:flex;justify-content:space-between;gap:8px;font-size:.68rem;color:#68798b}.cm-wb-progress strong{color:#20364c}.cm-wb-progress-track{height:6px;border-radius:999px;background:#e1e7ec;overflow:hidden}.cm-wb-progress-track span{display:block;height:100%;width:0;background:linear-gradient(90deg,#b48938,#dfc175);transition:width .2s ease}.cm-wb-main{min-width:0}.cm-wb-hero,.cm-wb-stage{background:#fff;border:1px solid #d8e0e7;border-radius:16px;padding:24px;margin-bottom:18px;box-shadow:0 5px 18px rgba(13,31,52,.055)}.cm-wb-stage:focus{outline:3px solid rgba(197,162,93,.5);outline-offset:3px}.cm-wb-hero{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start}.cm-wb-hero h2,.cm-wb-stage h2,.cm-wb-review-standard h2,.cm-wb-quickstart h2{font-family:Georgia,"Times New Roman",serif;color:#071a33;margin:6px 0 8px}.cm-wb-status{min-width:120px;text-align:center;background:#f7f2e7;border:1px solid #dcc79b;border-radius:12px;padding:12px}.cm-wb-status b{display:block;font-size:2rem;color:#071a33}.cm-wb-status span,.cm-wb-status small{display:block;font-size:.72rem;color:#6f6247}.cm-wb-quickstart{display:grid;grid-template-columns:.72fr 1.28fr;gap:22px;background:linear-gradient(135deg,#fff,#f8f2e6);border:1px solid #d9c394;border-radius:16px;padding:22px;margin-bottom:18px}.cm-wb-quickstart p{margin:0;color:#586779}.cm-wb-quickstart ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.cm-wb-quickstart li{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:8px;padding:9px;background:#fff;border:1px solid #e4d9c0;border-radius:8px;font-size:.77rem}.cm-wb-quickstart li b{color:#9b762f;font-size:.68rem}.cm-wb-review-standard{display:grid;grid-template-columns:.85fr 1.15fr;gap:24px;background:linear-gradient(135deg,#071a33,#123b61);color:#fff;border:1px solid #254d73;border-radius:16px;padding:22px;margin-bottom:18px;box-shadow:0 8px 22px rgba(7,26,51,.13)}.cm-wb-review-standard h2{color:#fff}.cm-wb-review-standard p{margin:0;color:#c7d4e1;font-size:.86rem}.cm-wb-review-standard ol{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.cm-wb-review-standard li{display:grid;grid-template-columns:28px 1fr;gap:9px;align-items:center;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:10px}.cm-wb-review-standard li b{color:#e0c27d;font-size:.7rem}.cm-wb-review-standard li span{font-size:.78rem;color:#edf3f8}.cm-wb-stage-head{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:16px}.cm-wb-stage-head>span{font-size:.72rem;font-weight:850;padding:7px 9px;border-radius:999px;background:#eef2f5;color:#4b5c6f}.cm-wb-guide{border:1px solid #cddae5;border-radius:12px;background:#f5f9fc;margin:0 0 16px;overflow:hidden}.cm-wb-guide summary{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;cursor:pointer;color:#173650;font-weight:850}.cm-wb-guide summary small{color:#667b8e;font-weight:650}.cm-wb-guide-body{padding:0 16px 14px;border-top:1px solid #d8e3eb}.cm-wb-guide-body p{margin:12px 0 8px}.cm-wb-guide-body ol{margin:8px 0 10px;padding-left:23px}.cm-wb-guide-body li{margin:5px 0}.cm-wb-guide-check{padding:9px 11px;background:#e7f2eb;border-left:3px solid #3f795b;border-radius:7px;color:#294d3b}.cm-wb-email{border:1px solid #dde3e9;border-left:4px solid #8ea0b3;border-radius:10px;padding:16px;margin-top:10px;background:#fbfcfd}.cm-wb-email.cm-wb-new{border-left-color:#c39439;background:#fffaf0}.cm-wb-email-meta{display:flex;justify-content:space-between;gap:16px;font-size:.82rem;color:#677586}.cm-wb-email h3{color:#071a33;margin:8px 0}.cm-wb-files{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cm-wb-file{border:1px solid #cfd9e2;border-radius:12px;background:#fff;overflow:hidden}.cm-wb-file[open]{grid-column:1/-1;border-color:#9eb1c2;box-shadow:0 8px 20px rgba(13,31,52,.08)}.cm-wb-file summary{list-style:none;padding:14px;cursor:pointer}.cm-wb-file summary::-webkit-details-marker{display:none}.cm-wb-file summary>p{margin:9px 0;color:#5f7082;font-size:.82rem;line-height:1.45}.cm-wb-file-head{display:flex;gap:10px;align-items:center}.cm-wb-file-head div{display:grid;min-width:0}.cm-wb-file-head strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#071a33}.cm-wb-file-head small{color:#738092}.cm-wb-file-type{font-size:.65rem;font-weight:900;background:#071a33;color:#fff;border-radius:5px;padding:5px 7px}.cm-wb-file-open{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 10px;background:#eef3f7;border-radius:7px;color:#173650;font-size:.75rem;font-weight:850}.cm-wb-file[open] .cm-wb-file-open{background:#071a33;color:#fff}.cm-wb-file-preview{border-top:1px solid #d8e1e8;padding:0 14px 14px;background:#fbfcfd}.cm-wb-file-preview-bar{display:flex;justify-content:space-between;gap:12px;padding:11px 0 2px;color:#68798b;font-size:.68rem}.cm-wb-file-preview-bar span{font-weight:900;letter-spacing:.06em}.cm-wb-sheet{border:1px solid #cfd8e1;border-radius:10px;overflow:hidden}.cm-wb-sheet-bar{display:flex;justify-content:space-between;gap:16px;background:#e7edf2;padding:10px 12px;font-size:.78rem;color:#526477}.cm-wb-sheet-bar b{color:#071a33}.cm-wb-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,330px);gap:18px;align-items:center;padding:16px;border-top:1px solid #e1e6eb}.cm-wb-row:first-of-type{border-top:0}.cm-wb-row p{margin:5px 0 0;color:#677586;font-size:.86rem}.cm-wb-input{display:flex;align-items:end;gap:8px}.cm-wb-input label{display:grid;gap:6px;width:100%;font-size:.76rem;font-weight:800;color:#536477}.cm-wb-input input,.cm-wb-input select,.cm-wb-compose textarea{width:100%;border:1px solid #aebdca;border-radius:7px;background:#fff;padding:11px;color:#071a33;font:inherit}.cm-wb-input input:focus,.cm-wb-input select:focus,.cm-wb-compose textarea:focus{outline:2px solid #caa554;outline-offset:1px}.cm-wb-cell{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.72rem;background:#eaf0f4;border:1px solid #ccd7df;padding:10px 7px;border-radius:6px;color:#536477}.cm-wb-compose{border:1px solid #d8e0e7;border-radius:10px;overflow:hidden}.cm-wb-compose>div{display:grid;grid-template-columns:70px 1fr;padding:9px 12px;border-bottom:1px solid #e3e7eb;font-size:.86rem}.cm-wb-compose>div span{color:#758294}.cm-wb-compose label{display:grid;gap:8px;padding:12px;font-weight:800;color:#536477;border-top:1px solid #e3e7eb}.cm-wb-compose textarea{min-height:220px;resize:vertical;font-weight:400}.cm-wb-compose.cm-wb-structured textarea{min-height:105px}.cm-wb-compose.cm-wb-structured label>span{font-size:.76rem;color:#334a61}.cm-wb-submit{margin-top:18px;min-height:52px}.cm-wb-submit-note{text-align:center;color:#536477;font-size:.78rem;margin:8px auto 0;max-width:760px}
      @media(max-width:900px){.cm-wb-layout{grid-template-columns:1fr}.cm-wb-sidebar{position:static}.cm-wb-sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-wb-files{grid-template-columns:1fr}.cm-wb-row{grid-template-columns:1fr}.cm-wb-top-inner,.cm-wb-hero,.cm-wb-review-standard,.cm-wb-quickstart{grid-template-columns:1fr;display:grid}.cm-wb-deadline{text-align:left}.cm-wb-sheet-bar{display:grid}}
      @media(max-width:600px){.cm-wb-sidebar nav{grid-template-columns:1fr 1fr}.cm-wb-top h1{font-size:2rem}.cm-wb-stage,.cm-wb-hero,.cm-wb-review-standard,.cm-wb-quickstart{padding:17px}.cm-wb-review-standard ol,.cm-wb-quickstart ol{grid-template-columns:1fr}.cm-wb-stage-head{display:block}.cm-wb-stage-head>span{display:inline-block;margin-top:7px}.cm-wb-email-meta,.cm-wb-file-preview-bar{display:grid}.cm-wb-compose>div{grid-template-columns:55px 1fr}.cm-wb-guide summary{display:grid}}
      .cm-official-context{margin:10px 0 12px;padding:12px 14px;border-left:4px solid var(--gold);background:#fbf7ee;color:#4e5966;border-radius:8px}.cm-official-table-wrap{overflow:auto;margin:12px 0}.cm-official-table{width:100%;border-collapse:collapse;font-size:.86rem}.cm-official-table th,.cm-official-table td{border:1px solid #d9e0e7;padding:9px 10px;text-align:right}.cm-official-table th:first-child,.cm-official-table td:first-child{text-align:left}.cm-official-numeric{display:block;margin-top:14px;font-weight:750;color:var(--navy)}.cm-official-numeric span{display:block;margin-bottom:6px}.cm-official-numeric input{width:min(100%,320px);padding:12px;border:1px solid #bcc9d5;border-radius:9px;background:#fff;color:var(--navy);font-size:1rem}.cm-official-question-numeric{background:linear-gradient(180deg,#fff,#fbfcfd)}
            @media(max-width:700px){.cm-public-skills,.cm-quality-gates{grid-template-columns:1fr}.cm-official-head{display:block}.cm-official-head .btn{margin-top:12px}.cm-official-head h1,.cm-verification h1{font-size:2.1rem}.cm-result-score{font-size:4rem}.cm-quality-decision{padding:15px}}
    `;
    document.head.appendChild(style);
  }

  window.CM_LIVE_ROUTE = route;
  window.CM_LIVE_WORKBENCH_BIND = bindWorkbenchInteractions;
  window.addEventListener('hashchange', () => setTimeout(route, 0));
  document.addEventListener('cm-auth-changed', () => { savedReviewCache.clear(); setTimeout(route, 0); });
  injectStyles();
  setTimeout(route, 0);
})();
