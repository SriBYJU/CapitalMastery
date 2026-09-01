(() => {
  'use strict';

  const PASS = 80;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const TRACK_PREFIX = 'capitalMasteryTrainingTrackV1:';
  const CAREER_SKILLS = 'career-skills';
  const REVIEW_PREFIX = 'capitalMasteryAssessmentReviewV3:';
  let scheduled = false;
  let replacingAdminPreview = false;

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function parts(hash=location.hash) {
    const [path, query=''] = String(hash || '#/').replace(/^#\/?/, '').split('?');
    const p = path.split('/').filter(Boolean);
    return { root:p[0] || '', pathway:p[1] ? safeDecode(p[1]) : '', part:p[2] || '', query:new URLSearchParams(query), raw:p };
  }

  function safeDecode(v='') {
    try { return decodeURIComponent(String(v)); } catch (_) { return ''; }
  }

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) { return null; }
  }

  function isAdminQa() {
    return window.CM_AUTH?.ready === true &&
      window.CM_AUTH?.backendVerified === true &&
      window.CM_AUTH?.isAdmin === true &&
      localStorage.getItem(QA_KEY) === 'true';
  }

  function apiPathway(pathway) {
    if (pathway === 'quant-finance') return 'quantitative-finance';
    if (pathway === 'fpa' || pathway === 'fp-a' || pathway === 'fp&a') return 'fp-and-a';
    return pathway;
  }

  function selectedTrack(pathway) {
    const raw = localStorage.getItem(TRACK_PREFIX + pathway);
    return raw === CAREER_SKILLS ? CAREER_SKILLS : 'professional-readiness';
  }

  function correctContinueHref(pathway, part) {
    if(window.CM_COURSE_STATE?.getNextCourseDestination){
      return window.CM_COURSE_STATE.getNextCourseDestination({pathway,currentStage:`part-${Number(part)}`,track:selectedTrack(pathway)});
    }
    const id = encodeURIComponent(pathway);
    const n = Number(part);
    if (n === 1) return `#/learn/${id}/2`;
    if (n === 2) return `#/achievement/${id}/foundations`;
    if (n === 3) return `#/learn/${id}/4`;
    if (n === 4) return `#/achievement/${id}/applied`;
    if (n === 5) {
      return selectedTrack(pathway) === CAREER_SKILLS
        ? `#/official-simulation/${id}`
        : `#/role-lab/${encodeURIComponent(apiPathway(pathway))}`;
    }
    return `#/career/${id}`;
  }

  function localBest(pathway, part) {
    const cs = readState()?.careers?.[pathway];
    if (!cs) return 0;
    const n = Number(part);
    return n === 5
      ? Number(cs.simulationKnowledge || 0)
      : Number(cs.quizScores?.[n] || 0);
  }

  function reviewKey(pathway, part) {
    const uid = window.CM_AUTH?.user?.uid || 'local-preview';
    return `${REVIEW_PREFIX}${uid}:${pathway}:${Number(part)}`;
  }

  function loadReview(pathway, part) {
    try {
      const data = JSON.parse(localStorage.getItem(reviewKey(pathway, part)) || 'null');
      return data && data.version === 3 ? data : null;
    } catch (_) { return null; }
  }

  function saveReview(pathway, part, patch) {
    if (!pathway || !Number.isFinite(Number(part))) return;
    const prior = loadReview(pathway, part) || {};
    const next = {
      version:3,
      pathway,
      part:Number(part),
      savedAt:new Date().toISOString(),
      ...prior,
      ...patch
    };
    try { localStorage.setItem(reviewKey(pathway, part), JSON.stringify(next)); } catch (_) {}
  }

  function captureLocalQuiz(form, pathway, part) {
    setTimeout(() => {
      try {
        const session = JSON.parse(sessionStorage.getItem('cmCurrentQuiz') || 'null');
        if (!session || session.careerId !== pathway || Number(session.n) !== Number(part) || !Array.isArray(session.q)) return;
        let right = 0;
        const items = session.q.map((q, i) => {
          const selected = form.querySelector(`input[name="q${i}"]:checked`)?.value || '';
          const correct = selected === q.answer;
          if (correct) right++;
          return {
            prompt:q.prompt || `Question ${i+1}`,
            selected,
            correct,
            correctAnswer:q.answer || '',
            explanation:q.explain || ''
          };
        });
        const score = Math.round((right / Math.max(1, items.length)) * 100);
        saveReview(pathway, part, { source:'local-qa', score, passed:score >= PASS, items });
      } catch (_) {}
    }, 30);
  }

  function captureSecureQuiz(form, pathway, part) {
    try {
      const items = [...form.querySelectorAll('fieldset')].map((field, i) => {
        const legend = (field.querySelector('legend')?.textContent || `Question ${i+1}`).replace(/^\s*\d+\s*/, '').trim();
        const selected = field.querySelector('input[type="radio"]:checked')?.value
          ?? field.querySelector('input[type="number"]')?.value
          ?? field.querySelector('textarea')?.value
          ?? '';
        return {
          prompt:legend,
          selected,
          correct:null,
          correctAnswer:'',
          explanation:''
        };
      }).filter(x => x.prompt || x.selected);
      if (items.length) saveReview(pathway, part, { source:'secure', items });
    } catch (_) {}
  }

  function enrichSecureReviewFromResult(pathway, part) {
    const result = document.querySelector('#app main#main .cm-result');
    if (!result) return;
    const score = Number((result.querySelector('.cm-result-score')?.textContent || '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(score)) return;
    saveReview(pathway, part, { score, passed:score >= PASS });
  }

  function reviewItemHtml(item, index) {
    const status = item.correct === true ? 'correct' : item.correct === false ? 'incorrect' : 'recorded';
    const statusLabel = item.correct === true ? 'Correct' : item.correct === false ? 'Review this' : 'Your submitted answer';
    const correct = item.correctAnswer
      ? `<p class="cm-review-correct"><strong>Correct answer:</strong> ${esc(item.correctAnswer)}</p>`
      : '';
    const explanation = item.explanation
      ? `<p class="cm-review-explain">${esc(item.explanation)}</p>`
      : '';
    return `<article class="cm-review-item ${status}">
      <div class="cm-review-qhead"><span>${index+1}</span><strong>${esc(item.prompt)}</strong></div>
      <div class="cm-review-answer"><small>${statusLabel}</small><p>${esc(item.selected || 'No answer recorded')}</p></div>
      ${correct}${explanation}
    </article>`;
  }

  function renderReadOnlyReview(pathway, part, best) {
    const route = parts();
    if (route.root !== 'quiz' || route.pathway !== pathway || Number(route.part) !== Number(part)) return false;
    const main = document.querySelector('#app main#main');
    if (!main) return false;
    const saved = loadReview(pathway, part);
    const score = Math.max(Number(best || 0), Number(saved?.score || 0));
    const passed=score>=PASS||saved?.passed===true;
    if(!passed&&route.query.get('retake')==='1') return false;
    const hasItems = Array.isArray(saved?.items) && saved.items.length > 0;
    const correctCount = hasItems ? saved.items.filter(item => item.correct === true).length : null;
    if (main.querySelector('.cm-server-assessment-review')) return true;
    const current=main.querySelector('.cm-course-release-review,.cm-continuity-review');
    if(current&&Number(current.dataset.best||0)>=score) return true;

    main.innerHTML = `<section class="section cm-readonly-review-shell"><div class="container" style="max-width:980px">
      <div class="card cm-assessment-review cm-course-release-review ${passed?'passed':'failed'}" data-best="${score}">
        <div class="eyebrow">${passed?'SAVED PASS':'SAVED ATTEMPT'} · READ-ONLY REVIEW</div>
        <div class="cm-result-score">${correctCount===null?`${score}%`:`${correctCount} / ${saved.items.length}`}</div>
        <h1 class="serif">${passed?'Assessment already passed.':'Review before retrying.'}</h1>
        <p><strong>${score}% · ${passed?'Passed':'Retry required'}.</strong> ${passed?'Your passed attempt is final and preserved. Review shows your completed answers and never creates another attempt.':'Your prior answers and feedback are saved below. A new attempt starts only when you explicitly choose Retry.'}</p>
        ${hasItems
          ? `<div class="cm-review-list">${saved.items.map(reviewItemHtml).join('')}</div>`
          : `<div class="cm-review-history-note"><strong>Attempt answers are not available for this older pass.</strong><span>The pass is preserved. New attempts now save a private read-only answer history in this browser so Review can show exactly what you submitted.</span></div>`}
        <div class="cm-result-actions">
          ${passed?`<a class="btn btn-gold" data-cm-pass-continue href="${esc(correctContinueHref(pathway, part))}">Continue to next stage →</a>`:`<a class="btn btn-primary" data-cm-release-retry href="#/quiz/${encodeURIComponent(pathway)}/${Number(part)}?retake=1&attempt=${Date.now()}">Retry assessment →</a>`}
          <a class="btn btn-soft" href="#/learn/${encodeURIComponent(pathway)}/${Number(part)}">Review learning</a>
        </div>
      </div>
    </div></section>`;
    return true;
  }

  function repairPassedLessonLinks() {
    const route = parts();
    if (route.root !== 'learn' || !route.pathway) return;
    const part = Number(route.part);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    const best = Math.max(localBest(route.pathway, part), Number(document.querySelector('[data-cm-best-score]')?.dataset.cmBestScore || 0));
    const passedLink = document.querySelector('#app main#main [data-cm-passed-assessment], #app main#main a[data-cm-pass-continue]');
    if (passedLink && best >= PASS) {
      passedLink.href = correctContinueHref(route.pathway, part);
      if (passedLink.matches('[data-cm-passed-assessment]')) {
        passedLink.textContent = `Continue — assessment already passed · ${best}% →`;
      }
    }
    const review = document.querySelector('#app main#main [data-cm-review-passed]');
    if (review) {
      review.href = `#/quiz/${encodeURIComponent(route.pathway)}/${part}?review=1`;
      review.setAttribute('data-cm-release-review', 'true');
    }
  }

  function repairSavedPassContinue() {
    const route = parts();
    if (route.root !== 'quiz' || !route.pathway) return;
    const part = Number(route.part);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    const best = localBest(route.pathway, part);
    const passCard = document.querySelector('#app main#main .cm-assessment-review, #app main#main .cm-continuity-review');
    if (!passCard || best < PASS) return;
    const continueLink = passCard.querySelector('a.btn-gold, [data-cm-pass-continue]');
    if (continueLink) {
      continueLink.href = correctContinueHref(route.pathway, part);
      continueLink.textContent = 'Continue to next stage →';
    }
    renderReadOnlyReview(route.pathway, part, best);
  }

  function normalizeLegacySimulationRoute() {
    const route = parts();
    if (route.root !== 'simulation' || !route.pathway) return false;
    const target = isAdminQa()
      ? `#/admin-preview/simulation/${encodeURIComponent(route.pathway)}`
      : `#/official-simulation/${encodeURIComponent(route.pathway)}`;
    if (location.hash !== target) location.replace(target);
    return true;
  }

  function careerById(pathway) {
    const careers = window.CM_DATA?.careers || [];
    return careers.find(c => c.id === pathway) || careers.find(c => apiPathway(c.id) === apiPathway(pathway)) || null;
  }

  function adminPreviewData(pathway) {
    const c = careerById(pathway);
    const title = c?.title || pathway.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    const role = c?.role || `${title} Analyst`;
    const project = c?.sim_title || (pathway === 'investment-banking' ? 'Project Northstar' : `${title} Role Simulation`);
    const context = c?.sim_context || `You are the ${role}. Complete a realistic work assignment and send a reviewer-ready recommendation.`;
    const steps = Array.isArray(c?.sim_steps) ? c.sim_steps : [
      'Review the source packet and identify the decision.',
      'Build the required quantitative outputs.',
      'Respond to new information and update dependent work.',
      'QA the analysis and prepare the reviewer handoff.'
    ];
    const twists = Array.isArray(c?.twists) ? c.twists : ['A material assumption changes after your first draft.'];
    return { c, title, role, project, context, steps, twists };
  }

  function genericAdminWorkbench(pathway) {
    const d = adminPreviewData(pathway);
    const deliverables = Array.isArray(d.c?.deliverables) && d.c.deliverables.length
      ? d.c.deliverables.slice(0,4)
      : ['calculated workpaper','quality-control note','decision memo','manager handoff'];
    return `<section class="cm-wb-shell cm-admin-workbench-preview" data-cm-admin-workbench="1">
      <div class="cm-wb-top"><div class="container cm-wb-top-inner"><div>
        <div class="eyebrow">ADMIN QA · PRACTICAL JOB SIMULATION · NO MULTIPLE CHOICE</div>
        <h1>${esc(d.project)}</h1><p>${esc(d.role)} · Local preview of the same real-work simulation standard used by the learner flow.</p>
      </div><div class="cm-wb-deadline"><span>Preview mode</span><strong>No D1 write</strong></div></div></div>
      <div class="container cm-wb-layout">
        <aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CAREER</span><strong>${esc(d.title)}</strong><span>ROLE</span><strong>${esc(d.role)}</strong></div>
          <nav><a href="#cm-admin-inbox">01 · Inbox</a><a href="#cm-admin-files">02 · Source Packet</a><a href="#cm-admin-work">03 · Work Products</a><a href="#cm-admin-update">04 · Live Update</a><a href="#cm-admin-qa">05 · QA</a><a href="#cm-admin-handoff">06 · Manager Handoff</a></nav>
          <div class="cm-security-note"><strong>Admin-only local preview.</strong><br>This route never submits an authoritative learner score or credential.</div>
          <a class="btn btn-outline btn-block" href="#/admin-preview">Exit Preview</a>
        </aside>
        <main class="cm-wb-main">
          <section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>${esc(d.context)}</h2><p>Complete the work like a junior professional: trace inputs, calculate outputs, react to a material update, QA the work, and communicate the decision.</p></div><div class="cm-wb-status"><b>80%</b><span>minimum standard</span><small>workbench v2</small></div></section>
          <section class="cm-wb-stage" id="cm-admin-inbox"><div class="cm-wb-stage-head"><div><div class="eyebrow">INBOX</div><h2>Manager assignment</h2></div><span>NEW</span></div><article class="cm-wb-email cm-wb-new"><div class="cm-wb-email-meta"><b>Manager / Reviewer</b><span>Today · 8:42 AM</span></div><h3>${esc(d.project)} — analysis needed</h3><p>${esc(d.context)}</p><p>Use the source packet, document assumptions, and send me the decision, evidence, material risk, and controlled next action.</p></article></section>
          <section class="cm-wb-stage" id="cm-admin-files"><div class="cm-wb-stage-head"><div><div class="eyebrow">SOURCE PACKET</div><h2>Review before building</h2></div><span>4 files</span></div><div class="cm-wb-files">
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Operating_Case_v03.xlsx</strong><small>Historical + forecast operating drivers</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">PDF</span><div><strong>Management_Update.pdf</strong><small>New information received after first draft</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Market_Reference_Set.xlsx</strong><small>Role-specific market / peer / benchmark data</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">DOCX</span><div><strong>Reviewer_Instructions.docx</strong><small>Decision standard and deliverables</small></div></div></article>
          </div></section>
          <section class="cm-wb-stage" id="cm-admin-work"><div class="cm-wb-stage-head"><div><div class="eyebrow">WORK PRODUCTS</div><h2>Build the actual deliverables</h2></div><span>${deliverables.length} outputs</span></div><div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>${esc(d.project.replace(/\s+/g,'_'))}_Working_v01</b><span>Admin QA preview</span></div>
            ${deliverables.map((x,i)=>`<div class="cm-wb-row"><div><strong>${esc(x)}</strong><p>${esc(d.steps[i] || d.steps[d.steps.length-1])}</p></div><label class="cm-wb-text-output"><span>Reviewer-ready output</span><textarea disabled placeholder="Interactive learner version accepts the role-specific calculated or written work product here."></textarea></label></div>`).join('')}
          </div></section>
          <section class="cm-wb-stage cm-wb-live-update" id="cm-admin-update"><div class="cm-wb-stage-head"><div><div class="eyebrow">MID-ASSIGNMENT UPDATE · INBOX</div><h2>New information — revise the work</h2><p>Your first draft is no longer enough. Re-open every dependent output.</p></div><span>NEW</span></div><article class="cm-wb-email cm-wb-new"><p>${esc(d.twists[0] || 'A material assumption changed. Update the analysis and trace the impact through the recommendation.')}</p></article></section>
          <section class="cm-wb-stage" id="cm-admin-qa"><div class="cm-wb-stage-head"><div><div class="eyebrow">QUALITY CONTROL</div><h2>Reviewer check before submission</h2></div><span>REQUIRED</span></div><ul><li>Trace every material output to a source.</li><li>Recalculate dependent outputs after the update.</li><li>Flag assumptions, exceptions, and unresolved diligence.</li><li>Make the recommendation consistent with the final workpaper.</li></ul></section>
          <section class="cm-wb-stage" id="cm-admin-handoff"><div class="cm-wb-stage-head"><div><div class="eyebrow">FINAL DELIVERABLE</div><h2>Manager handoff</h2></div><span>Decision-ready</span></div><div class="cm-wb-compose cm-wb-structured">
            <label><span>1 · Decision / recommendation</span><textarea disabled></textarea></label>
            <label><span>2 · Case evidence</span><textarea disabled></textarea></label>
            <label><span>3 · Material risk / what could change</span><textarea disabled></textarea></label>
            <label><span>4 · Controlled next action</span><textarea disabled></textarea></label>
          </div><button class="btn btn-primary btn-block" type="button" disabled>Admin preview — submission disabled</button></section>
        </main>
      </div>
    </section>`;
  }

  function ibAdminWorkbench() {
    return `<section class="cm-wb-shell cm-admin-workbench-preview" data-cm-admin-workbench="1">
      <div class="cm-wb-top"><div class="container cm-wb-top-inner"><div><div class="eyebrow">ADMIN QA · PRACTICAL ANALYST JOB SIMULATION · NO MULTIPLE CHOICE</div><h1>Project Northstar</h1><p>Investment Banking Analyst · M&A Advisory · Build the actual analyst work product.</p></div><div class="cm-wb-deadline"><span>Associate deadline</span><strong>Today · 5:30 PM</strong></div></div></div>
      <div class="container cm-wb-layout">
        <aside class="cm-wb-sidebar"><div class="cm-wb-case-card"><span>CLIENT</span><strong>Northstar Holdings</strong><span>TARGET</span><strong>Orion Systems</strong></div><nav aria-label="Orion case steps"><button type="button" data-cm-wb-target="cm-wb-inbox" aria-controls="cm-wb-inbox" aria-current="step"><b>01</b><span>Inbox</span></button><button type="button" data-cm-wb-target="cm-wb-data" aria-controls="cm-wb-data"><b>02</b><span>Data Room</span></button><button type="button" data-cm-wb-target="cm-wb-model" aria-controls="cm-wb-model"><b>03</b><span>Transaction Model</span></button><button type="button" data-cm-wb-target="cm-wb-valuation" aria-controls="cm-wb-valuation"><b>04</b><span>Trading Comps</span></button><button type="button" data-cm-wb-target="cm-wb-precedents" aria-controls="cm-wb-precedents"><b>05</b><span>Precedents</span></button><button type="button" data-cm-wb-target="cm-wb-dcf" aria-controls="cm-wb-dcf"><b>06</b><span>DCF</span></button><button type="button" data-cm-wb-target="cm-wb-update" aria-controls="cm-wb-update"><b>07</b><span>Management Update</span></button><button type="button" data-cm-wb-target="cm-wb-qa" aria-controls="cm-wb-qa"><b>08</b><span>Model QA</span></button><button type="button" data-cm-wb-target="cm-wb-client-materials" aria-controls="cm-wb-client-materials"><b>09</b><span>Client Takeaway</span></button><button type="button" data-cm-wb-target="cm-wb-email" aria-controls="cm-wb-email"><b>10</b><span>Associate Email</span></button></nav><div class="cm-security-note"><strong>Admin-only preview.</strong><br>No official score, D1 progress, or credential is written.</div><a class="btn btn-outline btn-block" href="#/admin-preview">Exit Workbench</a></aside>
        <main class="cm-wb-main">
          <section class="cm-wb-hero"><div><div class="eyebrow">ASSIGNMENT</div><h2>Update the buy-side valuation and diligence view for Orion Systems.</h2><p>Build the capitalization bridge and valuation outputs, respond to management's revised guidance, QA the model, then send the Associate a decision-ready recommendation. This tests job execution, not answer recognition.</p></div><div class="cm-wb-status"><b>80%</b><span>minimum standard</span><small>IB deal workbench v2</small></div></section>
          <section class="cm-wb-stage" id="cm-wb-inbox"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / INBOX</div><h2>Associate instructions</h2></div><span>2 messages</span></div><article class="cm-wb-email"><div class="cm-wb-email-meta"><b>Maya Chen · Associate</b><span>8:16 AM</span></div><h3>Northstar / Orion — valuation refresh</h3><p>Please refresh EV, trading comps, precedents and DCF, then flag the two diligence items that could change our view. I need the updated range and recommendation before the client call.</p></article><article class="cm-wb-email cm-wb-new"><div class="cm-wb-email-meta"><b>Maya Chen · Associate</b><span>2:17 PM</span></div><h3>New management guidance</h3><p>Management cut forward revenue and EBITDA guidance. Update every dependent output before you send anything.</p></article></section>
          <section class="cm-wb-stage" id="cm-wb-data"><div class="cm-wb-stage-head"><div><div class="eyebrow">VIRTUAL DATA ROOM</div><h2>Project files</h2></div><span>6 files</span></div><div class="cm-wb-files">
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Orion_Historical_Financials.xlsx</strong><small>Revenue, EBITDA, FCF, debt and cash</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Orion_Management_Forecast.xlsx</strong><small>Base forecast + revised guidance case</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Trading_Comps.xlsx</strong><small>Peer operating metrics and market values</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>Precedent_Transactions.xlsx</strong><small>Selected M&A transaction multiples</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">XLSX</span><div><strong>DCF_Assumptions.xlsx</strong><small>FCF, WACC and terminal growth sensitivities</small></div></div></article>
            <article class="cm-wb-file"><div class="cm-wb-file-head"><span class="cm-wb-file-type">PDF</span><div><strong>Diligence_Update.pdf</strong><small>Customer concentration and contract-renewal notes</small></div></div></article>
          </div></section>
          ${[
            ['cm-wb-model','TRANSACTION MODEL','Capitalization bridge & transaction multiple','Build enterprise value from equity value, debt, cash and other claims; then calculate the headline transaction multiple.'],
            ['cm-wb-valuation','TRADING COMPS','Peer set & implied valuation','Select defensible peers, calculate relevant trading multiples and derive an implied valuation range.'],
            ['cm-wb-precedents','PRECEDENT TRANSACTIONS','Control-value cross-check','Spread relevant transaction multiples, normalize outliers and calculate the implied enterprise-value range.'],
            ['cm-wb-dcf','DCF VALUATION','Intrinsic-value cross-check','Build the FCF present value, terminal value and WACC / terminal-growth sensitivity range.']
          ].map(([id,k,h,p])=>`<section class="cm-wb-stage" id="${id}"><div class="cm-wb-stage-head"><div><div class="eyebrow">${k}</div><h2>${h}</h2><p>${p}</p></div><span>Required</span></div><div class="cm-wb-sheet"><div class="cm-wb-sheet-bar"><b>Northstar_Orion_Valuation_v03.xlsx</b><span>$ in millions unless noted</span></div><div class="cm-wb-row"><div><strong>Calculated output</strong><p>Trace the source and calculation. Do not choose from options.</p></div><label class="cm-wb-text-output"><span>Admin preview field</span><textarea disabled placeholder="Learner version accepts the calculated / written analyst output."></textarea></label></div></div></section>`).join('')}
          <section class="cm-wb-stage cm-wb-live-update" id="cm-wb-update"><div class="cm-wb-stage-head"><div><div class="eyebrow">MANAGEMENT UPDATE · 2:17 PM</div><h2>Guidance changed — reopen the model</h2><p>Revenue and EBITDA expectations were reduced. Re-run the forecast, valuation sensitivities and client takeaway; document what changed.</p></div><span>NEW</span></div></section>
          <section class="cm-wb-stage" id="cm-wb-qa"><div class="cm-wb-stage-head"><div><div class="eyebrow">MODEL QA</div><h2>Find and resolve the material issue</h2><p>Check sign conventions, enterprise/equity value consistency, peer formulas, DCF sensitivities, and whether the management update flows through every dependent output.</p></div><span>Required</span></div></section>
          <section class="cm-wb-stage" id="cm-wb-client-materials" tabindex="-1"><div class="cm-wb-stage-head"><div><div class="eyebrow">CLIENT / SENIOR REVIEW</div><h2>Turn the model into a decision-useful takeaway</h2><p>State the valuation range, what moved after the update, and the two diligence issues that deserve the most attention.</p></div><span>Required</span></div></section>
          <section class="cm-wb-stage" id="cm-wb-email"><div class="cm-wb-stage-head"><div><div class="eyebrow">OUTLOOK / COMPOSE</div><h2>Email the Associate</h2></div><span>Manager handoff</span></div><div class="cm-wb-compose cm-wb-structured"><div><span>To</span><b>Maya Chen · Associate</b></div><div><span>Subject</span><b>Project Northstar — updated valuation & diligence view</b></div><label><span>Decision / recommendation</span><textarea disabled></textarea></label><label><span>Valuation & evidence</span><textarea disabled></textarea></label><label><span>Two material diligence issues</span><textarea disabled></textarea></label><label><span>Controlled next action</span><textarea disabled></textarea></label></div><button class="btn btn-primary btn-block" type="button" disabled>Admin preview — submission disabled</button></section>
        </main>
      </div>
    </section>`;
  }

  function replaceAdminPreview() {
    const route = parts();
    if (route.root !== 'admin-preview' || route.raw[1] !== 'simulation' || !route.raw[2] || !isAdminQa()) return;
    const pathway = safeDecode(route.raw[2]);
    const main = document.querySelector('#app main#main');
    if (!main || main.querySelector('[data-cm-admin-workbench="1"]') || replacingAdminPreview) return;
    if (!main.querySelector('.sim-shell, .cm-live-card, .quiz-shell, .section')) return;
    replacingAdminPreview = true;
    main.innerHTML = pathway === 'investment-banking' ? ibAdminWorkbench() : genericAdminWorkbench(pathway);
    window.CM_LIVE_WORKBENCH_BIND?.(main);
    replacingAdminPreview = false;
  }

  function repairCareerSimulationLinks() {
    document.querySelectorAll('#app a[href^="#/simulation/"]').forEach(link => {
      const route = parts(link.getAttribute('href'));
      if (!route.pathway) return;
      link.href = `#/official-simulation/${encodeURIComponent(route.pathway)}`;
      if (/Practical Simulation|Job Simulation|Simulation/i.test(link.textContent || '')) {
        link.textContent = link.textContent.replace(/Practical Simulation/i, 'Open Job Simulation').replace(/^Simulation$/i, 'Open Job Simulation');
      }
    });
  }

  function maybeRenderReview() {
    const route = parts();
    if (route.root !== 'quiz' || !route.pathway) return;
    const part = Number(route.part);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    const best = localBest(route.pathway, part);
    const saved=loadReview(route.pathway,part);
    if (best < PASS && !saved) return;
    if(best<PASS&&route.query.get('retake')==='1') return;
    if (document.querySelector('#app main#main .cm-server-assessment-review')) return;
    renderReadOnlyReview(route.pathway, part, best);
  }

  function enhance() {
    if (normalizeLegacySimulationRoute()) return;
    const route = parts();
    // Capture the just-returned server result before any saved-review renderer
    // can replace the result card. Otherwise an older failed score can win the
    // mutation race and hide a newly recorded pass.
    if (route.root === 'quiz' && route.pathway) {
      const part = Number(route.part);
      if (Number.isFinite(part)) enrichSecureReviewFromResult(route.pathway, part);
    }
    repairCareerSimulationLinks();
    repairPassedLessonLinks();
    repairSavedPassContinue();
    replaceAdminPreview();
    maybeRenderReview();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const route = parts();
    if (route.root !== 'quiz' || !route.pathway) return;
    const part = Number(route.part);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    if (form.id === 'quiz-form') captureLocalQuiz(form, route.pathway, part);
    if (form.id === 'cm-official-form') captureSecureQuiz(form, route.pathway, part);
  }, true);

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    if (/^#\/simulation\//.test(href)) {
      const route = parts(href);
      if (!route.pathway) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.hash = isAdminQa()
        ? `#/admin-preview/simulation/${encodeURIComponent(route.pathway)}`
        : `#/official-simulation/${encodeURIComponent(route.pathway)}`;
      return;
    }

    if (link.matches('[data-cm-review-passed], [data-cm-release-review]')) {
      const route = parts();
      if (route.root !== 'learn' || !route.pathway) return;
      const part = Number(route.part);
      if (!Number.isFinite(part)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.hash = `#/quiz/${encodeURIComponent(route.pathway)}/${part}?review=1`;
      return;
    }

    if (link.matches('[data-cm-pass-continue]')) {
      const route = parts();
      if (route.root !== 'quiz' || !route.pathway) return;
      const part = Number(route.part);
      if (!Number.isFinite(part)) return;
      const target = correctContinueHref(route.pathway, part);
      if (href !== target) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.hash = target;
      }
    }
  }, true);

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('cm-auth-changed', schedule);
  document.addEventListener('cm-progress-updated', schedule);
  window.addEventListener('capitalmastery:trackchange', schedule);

  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, {childList:true, subtree:true});

  const style = document.createElement('style');
  style.id = 'cm-course-release-fix-style';
  style.textContent = `
    .cm-readonly-review-shell .cm-assessment-review{text-align:center;padding:34px}
    .cm-review-list{display:grid;gap:12px;text-align:left;margin:26px 0}
    .cm-review-item{border:1px solid #dce3e9;border-radius:14px;background:#fff;padding:16px}
    .cm-review-item.correct{border-left:4px solid #4a8a67}.cm-review-item.incorrect{border-left:4px solid #b45a5a}.cm-review-item.recorded{border-left:4px solid #70839a}
    .cm-review-qhead{display:grid;grid-template-columns:32px 1fr;gap:10px;align-items:start;color:var(--navy)}
    .cm-review-qhead>span{width:30px;height:30px;border-radius:50%;background:#eef2f5;display:grid;place-items:center;font-weight:850}
    .cm-review-answer{margin:12px 0 0 42px;padding:11px 13px;background:#f5f7f9;border-radius:10px}.cm-review-answer small{font-weight:800;color:#617084;text-transform:uppercase;letter-spacing:.06em}.cm-review-answer p{margin:5px 0 0}
    .cm-review-correct,.cm-review-explain{margin:10px 0 0 42px}.cm-review-explain{color:#52606d}
    .cm-review-history-note{display:grid;gap:5px;text-align:left;margin:24px 0;padding:14px 16px;border:1px solid #e0d3b3;border-radius:12px;background:#fbf7ee;color:#5d523b}
    .cm-admin-workbench-preview textarea[disabled]{opacity:1;background:#f7f9fb;color:#65758a;min-height:90px}
    @media(max-width:680px){.cm-review-answer,.cm-review-correct,.cm-review-explain{margin-left:0}.cm-review-qhead{grid-template-columns:30px 1fr}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.CM_COURSE_RELEASE_FIX = Object.freeze({
    correctContinueHref,
    normalizeLegacySimulationRoute,
    renderReadOnlyReview,
    loadReview
  });

  schedule();
})();
