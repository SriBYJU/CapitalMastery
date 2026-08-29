(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  const PENDING_INVITE = 'cmPendingEnterpriseInviteV2';
  const STANDARD_STAGES = {
    foundations: [
      { id:'foundations-core', title:'Career Foundations', copy:'Understand the role, team, workflow, terminology and fundamental finance concepts.', required:true },
      { id:'foundations-assessment', title:'Foundations Assessment', copy:'Prove baseline understanding before earning the Foundations Certificate.', required:true },
      { id:'essentials-mini-case', title:'Essentials Mini Case', copy:'Apply the fundamentals in a short guided case.', required:true },
      { id:'essentials-assessment', title:'Essentials Assessment', copy:'Earn the Essentials Certificate by applying the core concepts.', required:true },
      { id:'optional-interview-prep', title:'Interview Prep', copy:'Optional role-specific interview and recruiting practice.', required:false }
    ],
    professional: [
      { id:'diagnostic', title:'Baseline Diagnostic', copy:'Measure starting readiness without counting against the learner.', required:true },
      { id:'technical-core', title:'Professional Technical Core', copy:'Role-specific technical knowledge, applied exercises and quality-control work.', required:true },
      { id:'applied-skills', title:'Applied Skills', copy:'Complete practical work products before the capstone simulation.', required:true },
      { id:'role-lab', title:'Role Lab', copy:'Perform a realistic analyst workflow with changing information, review comments and revisions.', required:true },
      { id:'final-assessment', title:'Final Readiness Assessment', copy:'Meet the Capital Mastery competency floors and final mastery standard.', required:true },
      { id:'optional-interview-prep', title:'Interview Prep', copy:'Optional recruiting practice that can be hidden for employer cohorts.', required:false }
    ]
  };

  let catalog = null;
  let busy = false;

  function esc(v='') {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parts() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '');
    const [path, query=''] = raw.split('?');
    return { parts:path.split('/').filter(Boolean), query:new URLSearchParams(query) };
  }

  function main() { return document.querySelector('#app main#main'); }
  function authReady() { return !!window.CM_AUTH?.ready; }
  function signedIn() { return !!window.CM_AUTH?.user; }
  async function idToken() { return window.CM_AUTH?.getIdToken ? window.CM_AUTH.getIdToken() : null; }

  function fmtDate(value) {
    if (!value) return 'No deadline';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d);
  }

  function pathTitle(id) {
    return catalog?.pathways?.find(p => p.id === id)?.title || String(id || '').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  function targetTitle(id) {
    return catalog?.credentialLadder?.find(c => c.id === id)?.title || String(id || '').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  async function api(path, options={}, auth=true) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = await idToken();
      if (!token) throw new Error('Sign in to continue.');
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function loadCatalog() {
    if (catalog) return catalog;
    catalog = await api('/enterprise/catalog', {}, false);
    return catalog;
  }

  function setMain(html) {
    const el = main();
    if (el) el.innerHTML = html;
  }

  function loading(title='Loading Capital Mastery for Employers…') {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="cmv2-loading card"><span class="cmv2-spinner" aria-hidden="true"></span><div><div class="eyebrow">CAPITAL MASTERY V2</div><h1>${esc(title)}</h1><p>Loading the secure workspace.</p></div></div></div></section>`);
  }

  function errorPage(title, message, back='#/employer') {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-error"><div class="eyebrow">CAPITAL MASTERY V2</div><h1>${esc(title)}</h1><p>${esc(message)}</p><a class="btn btn-primary" href="${esc(back)}">Continue →</a></div></div></section>`);
  }

  function authGate(kind='employer') {
    const title = kind === 'learner' ? 'Your assigned training is tied to your account.' : 'Sign in to open your employer workspace.';
    const copy = kind === 'learner'
      ? 'Use the same Capital Mastery account that received or accepted your company invitation.'
      : 'Employer workspaces use the same secure Capital Mastery account system as the learner platform.';
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-auth-gate"><div class="eyebrow">SECURE ACCOUNT REQUIRED</div><h1>${esc(title)}</h1><p>${esc(copy)}</p><a class="btn btn-primary" href="#/login">Sign in / Create Account →</a><a class="btn btn-outline" href="#/employers">Learn about Capital Mastery for Employers</a></div></div></section>`);
  }

  function employerLanding() {
    setMain(`<section class="cmv2-employer-hero"><div class="container cmv2-hero-grid"><div><div class="eyebrow">CAPITAL MASTERY FOR EMPLOYERS</div><h1>Make new finance talent productive sooner.</h1><p>Role-specific finance preparation, realistic work simulations, competency measurement and verified evidence—before Day 1.</p><div class="hero-actions"><a class="btn btn-primary" href="#/employer">Open Employer Workspace →</a><a class="btn btn-outline" href="#/careers">Preview Career Training</a></div><div class="cmv2-trust-row"><span>✓ Standardized readiness</span><span>✓ Firm customization</span><span>✓ No learner-data spreadsheets</span></div></div><div class="cmv2-preview-panel"><div class="cmv2-preview-top"><span>2027 Summer Analysts</span><b>Readiness 87</b></div><div class="cmv2-meter"><i style="width:87%"></i></div><div class="cmv2-mini-grid"><div><strong>92</strong><span>Accounting</span></div><div><strong>89</strong><span>Valuation</span></div><div><strong>81</strong><span>Modeling</span></div><div><strong>90</strong><span>Communication</span></div></div><div class="cmv2-alert">2 analysts need additional model-review practice.</div></div></div></section>
    <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">HOW IT WORKS</div><h2>Set up a real pre-onboarding cohort in minutes.</h2></div><p>The complexity stays underneath. Employers choose the role, people and deadline; Capital Mastery handles the standard.</p></div><div class="grid grid-4 cmv2-steps"><div class="card"><b>01</b><h3>Create a cohort</h3><p>Summer analysts, interns, new hires or a targeted development group.</p></div><div class="card"><b>02</b><h3>Assign readiness</h3><p>Choose Foundations or the full Professional Readiness track.</p></div><div class="card"><b>03</b><h3>Practice real work</h3><p>Learners complete diagnostics, applied tasks and realistic Role Labs.</p></div><div class="card"><b>04</b><h3>See readiness</h3><p>Managers get competency profiles, improvement and actionable coaching signals.</p></div></div></div></section>
    <section class="section section-white"><div class="container"><div class="cmv2-standard-split"><div><div class="eyebrow">CAPITAL MASTERY STANDARD + FIRM LAYER</div><h2>Your standards, without weakening ours.</h2><p>Employers can preview the full Capital Mastery program, add firm-specific material, reorder their additions, and hide optional content. Required credential components stay protected.</p></div><div class="cmv2-layer-card"><div class="cmv2-layer locked">🔒 Capital Mastery Standard</div><div class="cmv2-plus">+</div><div class="cmv2-layer">✦ Your Firm Layer</div><small>Firm content can be hidden, archived and restored. It is never permanently deleted by employers.</small></div></div></div></section>`);
  }

  async function employerHome() {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Opening your employer workspaces…');
    try {
      await loadCatalog();
      const data = await api('/enterprise/me');
      const orgs = data.organizations || [];
      setMain(`<section class="cmv2-page"><div class="container"><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER WORKSPACES</div><h1>Capital Mastery for Employers</h1><p>Create a cohort, assign readiness, then focus on the coaching that actually needs you.</p></div><a class="btn btn-outline" href="#/assigned">My Assigned Training</a></div>${orgs.length ? `<div class="grid grid-3">${orgs.map(o=>`<a class="card cmv2-org-card" href="#/employer/${encodeURIComponent(o.id)}"><span class="cmv2-role">${esc(o.role.replace(/_/g,' '))}</span><h3>${esc(o.name)}</h3><p>Open cohorts, assignments, readiness and Firm Layer customization.</p><span class="cmv2-arrow">Open workspace →</span></a>`).join('')}<button class="card cmv2-new-org" data-cmv2-new-org><span>＋</span><h3>Add another workspace</h3><p>Create a separate employer organization.</p></button></div>` : `<div class="cmv2-empty card"><div class="cmv2-empty-icon">▦</div><h2>Create your employer workspace.</h2><p>It takes one step. You can create your first cohort immediately afterward.</p><button class="btn btn-primary" data-cmv2-new-org>Create Employer Workspace →</button></div>`}</div></section>`);
      document.querySelectorAll('[data-cmv2-new-org]').forEach(b => b.addEventListener('click', renderCreateOrg));
    } catch (e) { errorPage('Could not open employer workspaces.', e.message); }
  }

  function renderCreateOrg() {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer">← Employer workspaces</a><div class="card cmv2-form-card"><div class="eyebrow">NEW WORKSPACE</div><h1>Create your employer workspace.</h1><p>You can add cohorts, managers and Firm Layer content after setup.</p><form id="cmv2-create-org"><label>Organization name<input name="name" maxlength="120" autocomplete="organization" required placeholder="Example Advisory Partners"></label><button class="btn btn-primary btn-block" type="submit">Create Workspace →</button><div class="cmv2-form-status" aria-live="polite"></div></form></div></div></section>`);
    document.getElementById('cmv2-create-org')?.addEventListener('submit', async e => {
      e.preventDefault(); const form=e.currentTarget; const status=form.querySelector('.cmv2-form-status'); const btn=form.querySelector('button');
      try { btn.disabled=true; status.textContent='Creating secure workspace…'; const d=await api('/enterprise/organizations',{method:'POST',body:JSON.stringify({name:new FormData(form).get('name')})}); location.hash=`#/employer/${d.organization.id}`; }
      catch(err){ status.textContent=err.message; btn.disabled=false; }
    });
  }

  async function orgDashboard(orgId) {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Loading employer command center…');
    try {
      await loadCatalog();
      const [org, dash, cohorts, assignments] = await Promise.all([
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}`),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/dashboard`),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts`),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`)
      ]);
      const s=dash.summary || {}; const cs=cohorts.cohorts||[]; const as=assignments.assignments||[];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer">← Employer workspaces</a><div class="cmv2-page-head cmv2-org-head"><div><div class="eyebrow">EMPLOYER COMMAND CENTER</div><h1>${esc(org.organization.name)}</h1><p>${esc(org.membership.role.replace(/_/g,' '))} access · Capital Mastery Enterprise Core</p></div><div class="cmv2-head-actions"><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/curriculum">Curriculum & Firm Layer</a><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/reports">Readiness Reports</a>${['owner','training_admin'].includes(org.membership.role)?`<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/team">Team & Roles</a><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/audit">Audit Log</a>`:''}</div></div><div class="cmv2-kpis"><div class="card"><strong>${Number(s.learners||0)}</strong><span>Active learners</span></div><div class="card"><strong>${Number(s.cohorts||0)}</strong><span>Cohorts</span></div><div class="card"><strong>${s.averageReadiness == null ? '—' : esc(s.averageReadiness)}</strong><span>Avg. readiness</span></div><div class="card"><strong>${Number(s.assignments||0)}</strong><span>Assignments</span></div></div><div class="cmv2-two-col"><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">COHORTS</div><h2>Training groups</h2></div><a href="#/employer/${encodeURIComponent(orgId)}/quick-assign">+ New</a></div>${cs.length?`<div class="cmv2-list">${cs.map(c=>`<div class="cmv2-list-row"><div><b>${esc(c.name)}</b><span>${esc(pathTitle(c.pathway_id))} · ${esc(c.program_level)}</span></div><div><span class="cmv2-status ${esc(c.status)}">${esc(c.status)}</span><small>${fmtDate(c.deadline_at)}</small></div></div>`).join('')}</div>`:`<div class="cmv2-empty-inline">No cohorts yet. Quick Assign creates the cohort and program together.</div>`}</section><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">ASSIGNMENTS</div><h2>Active programs</h2></div></div>${as.length?`<div class="cmv2-list">${as.map(a=>`<a class="cmv2-list-row" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(a.id)}"><div><b>${esc(pathTitle(a.pathway_id))}</b><span>${esc(targetTitle(a.credential_target))}</span></div><div><span class="cmv2-status ${esc(a.status)}">${esc(a.status)}</span><small>${fmtDate(a.due_at)}</small></div></a>`).join('')}</div>`:`<div class="cmv2-empty-inline">No programs assigned yet.</div>`}</section></div><section class="card cmv2-next-card"><div><div class="eyebrow">NEEDS ATTENTION</div><h2>${s.readinessSnapshots ? 'Cohort coaching signals will appear here.' : 'Readiness data appears after learners begin.'}</h2><p>Capital Mastery will surface weak competencies, overdue learners, Role Lab outcomes and improvement from diagnostic to final.</p></div><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/reports">Open Readiness Reports →</a></section></div></section>`);
    } catch(e) { errorPage('Could not load employer command center.',e.message,'#/employer'); }
  }

  async function quickAssign(orgId) {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Preparing Quick Assign…');
    try {
      await loadCatalog();
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">QUICK ASSIGN</div><h1>Set up pre-onboarding in a few steps.</h1><p>Choose the role, level, people and deadline. Capital Mastery handles the standardized pathway underneath.</p></div></div><form id="cmv2-quick-assign" class="card cmv2-wizard"><div class="cmv2-wizard-step"><span>1</span><div><h3>Who are you preparing?</h3><label>Cohort name<input name="cohortName" required maxlength="120" placeholder="2027 Investment Banking Summer Analysts"></label><label>Career pathway<select name="pathwayId" required>${catalog.pathways.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('')}</select></label></div></div><div class="cmv2-wizard-step"><span>2</span><div><h3>Choose the readiness level.</h3><div class="cmv2-track-options"><label><input type="radio" name="track" value="foundations"><b>Foundations</b><small>Beginner-friendly role introduction + Essentials mini case.</small></label><label><input type="radio" name="track" value="professional" checked><b>Professional Readiness</b><small>Diagnostic, technical work, applied skills, Role Lab, final readiness.</small></label></div></div></div><div class="cmv2-wizard-step"><span>3</span><div><h3>Add learners.</h3><label>Emails <small>One per line or separated by commas</small><textarea name="emails" rows="5" placeholder="analyst1@example.com&#10;analyst2@example.com"></textarea></label><p class="cmv2-help">You can also create the cohort now and invite people later.</p></div></div><div class="cmv2-wizard-step"><span>4</span><div><h3>Set a deadline.</h3><label>Due date<input name="dueDate" type="date"></label></div></div><div class="cmv2-form-status" aria-live="polite"></div><button class="btn btn-primary btn-block" type="submit">Create & Publish Assignment →</button></form></div></section>`);
      document.getElementById('cmv2-quick-assign')?.addEventListener('submit', e => submitQuickAssign(e, orgId));
    } catch(e) { errorPage('Could not load Quick Assign.',e.message,`#/employer/${orgId}`); }
  }

  async function submitQuickAssign(event, orgId) {
    event.preventDefault(); if (busy) return; busy=true;
    const form=event.currentTarget; const btn=form.querySelector('button[type=submit]'); const status=form.querySelector('.cmv2-form-status');
    btn.disabled=true; const fd=new FormData(form); const track=String(fd.get('track')||'professional'); const pathwayId=String(fd.get('pathwayId'));
    const dueRaw=String(fd.get('dueDate')||''); const dueAt=dueRaw?`${dueRaw}T23:59:59Z`:null;
    const emails=String(fd.get('emails')||'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
    try {
      status.textContent='Creating cohort…';
      const c=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts`,{method:'POST',body:JSON.stringify({name:String(fd.get('cohortName')),pathwayId,programLevel:track==='professional'?'professional':'foundations',deadlineAt:dueAt})});
      status.textContent='Assigning readiness program…';
      const a=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`,{method:'POST',body:JSON.stringify({cohortId:c.cohort.id,pathwayId,track,credentialTarget:track==='professional'?'professional_readiness':'essentials',dueAt})});
      await Promise.all([
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts/${encodeURIComponent(c.cohort.id)}`,{method:'PATCH',body:JSON.stringify({status:'active'})}),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments/${encodeURIComponent(a.assignment.id)}`,{method:'PATCH',body:JSON.stringify({status:'published'})})
      ]);
      const inviteResults=[];
      for (let i=0;i<emails.length;i++) {
        status.textContent=`Creating invitation ${i+1} of ${emails.length}…`;
        try { const inv=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`,{method:'POST',body:JSON.stringify({email:emails[i],role:'learner',cohortId:c.cohort.id,expiresDays:14})}); inviteResults.push(inv.invite); }
        catch(err){ inviteResults.push({email:emails[i],error:err.message}); }
      }
      renderQuickAssignSuccess(orgId,c.cohort,a.assignment,inviteResults);
    } catch(err) { status.textContent=err.message; btn.disabled=false; }
    finally { busy=false; }
  }

  function renderQuickAssignSuccess(orgId, cohort, assignment, invites) {
    const links=invites.filter(i=>i.token).map(i=>({email:i.email,url:`${location.origin}${location.pathname}#/join/${encodeURIComponent(i.token)}`}));
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-success"><div class="cmv2-success-icon">✓</div><div class="eyebrow">ASSIGNMENT PUBLISHED</div><h1>${esc(cohort.name)}</h1><p>${esc(pathTitle(assignment.pathwayId))} · ${esc(targetTitle(assignment.credentialTarget))}</p><div class="cmv2-success-meta"><div><span>Status</span><b>Published</b></div><div><span>Deadline</span><b>${fmtDate(assignment.dueAt)}</b></div></div>${links.length?`<div class="cmv2-invite-links"><h3>Invitation links</h3><p>Share each private link with the matching learner. Automated email delivery comes later; the secure invitation itself is already active.</p>${links.map(x=>`<div class="cmv2-invite-row"><span>${esc(x.email)}</span><button class="btn btn-soft btn-sm" data-copy="${esc(x.url)}">Copy invite</button></div>`).join('')}</div>`:''}${invites.some(i=>i.error)?`<div class="cmv2-warning">${invites.filter(i=>i.error).map(i=>`${esc(i.email)}: ${esc(i.error)}`).join('<br>')}</div>`:''}<div class="cmv2-success-actions"><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}">Open Command Center →</a><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">Customize Program</a></div></div></div></section>`);
    document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);b.textContent='Copied ✓';}catch{prompt('Copy this invitation link:',b.dataset.copy);}}));
  }

  async function curriculum(orgId, selectedAssignment='') {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Loading curriculum & Firm Layer…');
    try {
      await loadCatalog();
      const aData=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`); const assignments=aData.assignments||[];
      const chosen=assignments.find(a=>a.id===selectedAssignment) || assignments[0] || null;
      const content=chosen ? (await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content?assignmentId=${encodeURIComponent(chosen.id)}`)).content || [] : [];
      const stages=chosen?STANDARD_STAGES[chosen.track]||STANDARD_STAGES.professional:[];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">CURRICULUM & FIRM LAYER</div><h1>Preview everything. Customize safely.</h1><p>Capital Mastery Standard content is protected. Your firm can add material, hide optional items and archive or restore its own content.</p></div></div>${assignments.length?`<div class="card cmv2-program-picker"><label>Program<select id="cmv2-assignment-picker">${assignments.map(a=>`<option value="${esc(a.id)}" ${a.id===chosen?.id?'selected':''}>${esc(pathTitle(a.pathway_id))} · ${esc(targetTitle(a.credential_target))} · ${esc(a.status)}</option>`).join('')}</select></label></div><div class="cmv2-curriculum-grid"><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">CAPITAL MASTERY STANDARD</div><h2>Protected core</h2></div><span class="cmv2-lock-pill">🔒 STANDARD</span></div><div class="cmv2-stage-list">${stages.map(s=>`<div class="cmv2-stage" data-stage="${esc(s.id)}"><div class="cmv2-stage-icon">${s.required?'🔒':'◌'}</div><div><b>${esc(s.title)}</b><p>${esc(s.copy)}</p>${s.required?'<small>Required for the standardized credential.</small>':`<button class="cmv2-text-button" data-standard-toggle="${esc(s.id)}" data-assignment="${esc(chosen.id)}">Hide optional module</button>`}</div></div>`).join('')}</div></section><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">YOUR FIRM LAYER</div><h2>Company-specific material</h2></div><button class="btn btn-soft btn-sm" data-cmv2-add-content>+ Add content</button></div>${content.length?`<div class="cmv2-firm-list">${content.map(x=>`<article class="cmv2-firm-item ${esc(x.visibility)}"><div><span>${esc(x.contentType.replace(/_/g,' '))}</span><h3>${esc(x.title)}</h3><small>Version ${Number(x.currentVersion||1)} · ${esc(x.visibility)}</small></div><div class="cmv2-item-actions">${x.visibility!=='visible'?`<button data-content-vis="visible" data-content-id="${esc(x.id)}">Restore</button>`:''}${x.visibility==='visible'?`<button data-content-vis="hidden" data-content-id="${esc(x.id)}">Hide</button><button data-content-vis="archived" data-content-id="${esc(x.id)}">Archive</button>`:''}</div></article>`).join('')}</div>`:`<div class="cmv2-empty-inline">No firm-specific content yet. Add an introduction, internal expectations, resource, case or manager note.</div>`}<div class="cmv2-no-delete"><b>No permanent delete.</b> Firm content is versioned and can only be hidden, archived or restored.</div></section></div>`:`<div class="card cmv2-empty"><h2>Create an assignment first.</h2><p>Quick Assign creates a cohort and standardized program in one flow.</p><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a></div>`}</div></section>`);
      document.getElementById('cmv2-assignment-picker')?.addEventListener('change',e=>{location.hash=`#/employer/${orgId}/curriculum?assignment=${encodeURIComponent(e.target.value)}`;});
      document.querySelector('[data-cmv2-add-content]')?.addEventListener('click',()=>renderAddContent(orgId,chosen));
      document.querySelectorAll('[data-content-vis]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api(`/enterprise/organizations/${orgId}/firm-content/${b.dataset.contentId}`,{method:'PATCH',body:JSON.stringify({visibility:b.dataset.contentVis})});await curriculum(orgId,chosen.id);}catch(e){alert(e.message);b.disabled=false;}}));
      document.querySelectorAll('[data-standard-toggle]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api(`/enterprise/organizations/${orgId}/assignments/${chosen.id}/standard-visibility`,{method:'PATCH',body:JSON.stringify({standardContentId:b.dataset.standardToggle,visibility:'hidden'})});b.textContent='Hidden for this cohort ✓';}catch(e){alert(e.message);b.disabled=false;}}));
    } catch(e) { errorPage('Could not load curriculum.',e.message,`#/employer/${orgId}`); }
  }

  function renderAddContent(orgId, assignment) {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">← Curriculum</a><div class="card cmv2-form-card"><div class="eyebrow">FIRM LAYER</div><h1>Add company-specific content.</h1><p>This creates a versioned Firm Layer item. It never modifies the Capital Mastery Standard.</p><form id="cmv2-add-content"><label>Content type<select name="contentType"><option value="intro">Firm introduction</option><option value="lesson">Lesson</option><option value="resource">Resource</option><option value="exercise">Exercise</option><option value="case">Custom case</option><option value="manager_note">Manager note</option></select></label><label>Title<input name="title" maxlength="160" required placeholder="Our modeling standards"></label><label>Content<textarea name="text" rows="9" required placeholder="Explain your firm's terminology, expectations, workflow or custom exercise…"></textarea></label><div class="cmv2-form-status"></div><button class="btn btn-primary btn-block" type="submit">Add to Firm Layer →</button></form></div></div></section>`);
    document.getElementById('cmv2-add-content')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);const status=form.querySelector('.cmv2-form-status');const btn=form.querySelector('button');btn.disabled=true;try{status.textContent='Saving versioned content…';await api(`/enterprise/organizations/${orgId}/firm-content`,{method:'POST',body:JSON.stringify({assignmentId:assignment.id,pathwayId:assignment.pathway_id,contentType:String(fd.get('contentType')),title:String(fd.get('title')),body:{text:String(fd.get('text'))},positionKey:`firm-${Date.now()}`})});location.hash=`#/employer/${orgId}/curriculum?assignment=${encodeURIComponent(assignment.id)}`;}catch(err){status.textContent=err.message;btn.disabled=false;}});
  }

  async function assignedHome() {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('learner');
    loading('Loading assigned training…');
    try {
      await loadCatalog(); const d=await api('/enterprise/learner/assignments'); const list=d.assignments||[];
      setMain(`<section class="cmv2-page"><div class="container"><div class="cmv2-page-head"><div><div class="eyebrow">ASSIGNED TO ME</div><h1>Your company training.</h1><p>Company-assigned programs stay separate from the finance pathways you choose to learn independently.</p></div><div class="cmv2-head-actions"><a class="btn btn-outline" href="#/careers">Explore Public Learning</a><a class="btn btn-outline" href="#/my-data">My Data</a></div></div>${list.length?`<div class="grid grid-3">${list.map(a=>`<a class="card cmv2-assigned-card" href="#/assigned/${encodeURIComponent(a.assignment_id)}"><span class="cmv2-company">${esc(a.org_name)}</span><h3>${esc(pathTitle(a.pathway_id))}</h3><p>${esc(a.cohort_name)}</p><div class="cmv2-assigned-meta"><span>${esc(targetTitle(a.credential_target))}</span><b>${fmtDate(a.due_at)}</b></div><div class="cmv2-arrow">Open assigned program →</div></a>`).join('')}</div>`:`<div class="card cmv2-empty"><div class="cmv2-empty-icon">✓</div><h2>No company assignments yet.</h2><p>You can still use every public Capital Mastery career pathway independently.</p><a class="btn btn-primary" href="#/careers">Explore Careers →</a></div>`}</div></section>`);
    } catch(e) { errorPage('Could not load assigned training.',e.message,'#/'); }
  }

  async function assignedDetail(id) {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('learner');
    loading('Opening assigned program…');
    try {
      await loadCatalog(); const d=await api(`/enterprise/learner/assignments/${encodeURIComponent(id)}`); const a=d.assignment; const firm=d.firmContent||[]; const stages=STANDARD_STAGES[a.track]||STANDARD_STAGES.professional; const hidden=new Set((d.standardPreferences||[]).filter(x=>x.visibility==='hidden').map(x=>x.standard_content_id));
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/assigned">← Assigned training</a><div class="cmv2-assignment-hero"><div><span class="cmv2-company">${esc(a.organizationName)}</span><div class="eyebrow">${esc(a.cohortName)}</div><h1>${esc(pathTitle(a.pathwayId))}</h1><p>${esc(targetTitle(a.credentialTarget))} · Curriculum ${esc(a.curriculumVersion)}</p></div><div class="cmv2-due"><span>Due</span><b>${fmtDate(a.dueAt)}</b></div></div>${firm.length?`<section class="card cmv2-firm-banner"><div class="eyebrow">YOUR FIRM LAYER</div><h2>Company-specific preparation</h2>${firm.map(x=>`<article><b>${esc(x.title)}</b><p>${esc(x.body?.text||'')}</p></article>`).join('')}</section>`:''}<section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">YOUR READINESS PATH</div><h2>Complete the work. Prove the skills.</h2></div><span class="cmv2-lock-pill">CAPITAL MASTERY STANDARD</span></div><div class="cmv2-learner-stages">${stages.filter(s=>!hidden.has(s.id)).map((s,i)=>`<div class="cmv2-learner-stage"><span>${String(i+1).padStart(2,'0')}</span><div><b>${esc(s.title)}</b><p>${esc(s.copy)}</p></div><div class="cmv2-stage-state">${s.id==='role-lab'?'Role Lab':'Required'}</div></div>`).join('')}</div><div class="cmv2-program-actions">${a.track==='professional'?`<a class="btn btn-primary" href="#/diagnostic/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">1 · Baseline Diagnostic</a><a class="btn btn-outline" href="#/v2-assessment/ib-essentials-case?assignment=${encodeURIComponent(a.id)}">2 · Essentials Mini Case</a><a class="btn btn-gold" href="#/role-lab/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">3 · Open Role Lab</a><a class="btn btn-primary" href="#/v2-assessment/ib-professional-final?assignment=${encodeURIComponent(a.id)}">4 · Professional Final</a><a class="btn btn-outline" href="#/readiness/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Readiness Report</a><a class="btn btn-outline" href="#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Skill Profile</a>`:`<a class="btn btn-primary" href="#/career/${encodeURIComponent(a.pathwayId)}">Open Foundations Learning</a><a class="btn btn-gold" href="#/v2-assessment/ib-essentials-case?assignment=${encodeURIComponent(a.id)}">Essentials Mini Case</a><a class="btn btn-outline" href="#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Skill Profile</a>`}</div></section></div></section>`);
    } catch(e) { errorPage('Assigned program unavailable.',e.message,'#/assigned'); }
  }

  function evidencePhaseLabel(phase) {
    return ({baseline:'Baseline only',applied_evidence:'Applied evidence',role_lab_evidence:'Role Lab evidence',final_evidence:'Final evidence'})[phase] || String(phase || 'Baseline');
  }

  function readinessLabel(status) {
    return ({developing:'Developing',near_ready:'Near ready',ready_with_development:'Ready with targeted development',ready:'Ready'})[status] || String(status || 'Not measured');
  }

  async function diagnosticPage(pathwayId, assignmentId='') {
    if (!authReady()) return loading('Preparing your diagnostic…');
    if (!signedIn()) return authGate('learner');
    loading('Loading baseline diagnostic…');
    try {
      await loadCatalog();
      const d=await api(`/enterprise/diagnostic/${encodeURIComponent(pathwayId)}`);
      const questions=d.questions||[];
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(pathwayId)}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">BASELINE DIAGNOSTIC · 0% CREDENTIAL WEIGHT</div><h1>${esc(d.pathway.title)} Diagnostic</h1><p>This measures your starting point. It does not count against your credential and is used to personalize readiness evidence.</p></div></div><form id="cmv2-diagnostic" class="cmv2-diagnostic-list">${questions.map((q,i)=>`<fieldset class="card cmv2-question"><legend><span>${String(i+1).padStart(2,'0')}</span>${esc(q.prompt)}</legend><div class="cmv2-options">${q.options.map((o,j)=>`<label><input type="radio" name="${esc(q.id)}" value="${esc(o)}" required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`).join('')}<div class="card cmv2-submit-bar"><div><b>Baseline only.</b><span>Your score will not reduce credential eligibility.</span></div><button class="btn btn-primary" type="submit">Submit Diagnostic →</button></div><div class="cmv2-form-status"></div></form></div></section>`);
      document.getElementById('cmv2-diagnostic')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget; const btn=form.querySelector('button'); const status=form.querySelector('.cmv2-form-status'); btn.disabled=true;
        try { status.textContent='Scoring securely…'; const fd=new FormData(form); const answers={}; questions.forEach(q=>answers[q.id]=String(fd.get(q.id)||'')); const result=await api('/enterprise/diagnostic/submit',{method:'POST',body:JSON.stringify({pathwayId,assignmentId:assignmentId||null,answers})}); renderDiagnosticResult(pathwayId,assignmentId,result); }
        catch(err){ status.textContent=err.message; btn.disabled=false; }
      });
    } catch(e) { errorPage('Diagnostic unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function renderDiagnosticResult(pathwayId, assignmentId, result) {
    const r=result.readiness||{};
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-result-card"><div class="cmv2-result-score"><strong>${Number(result.score||0)}</strong><span>Baseline diagnostic</span></div><div><div class="eyebrow">DIAGNOSTIC COMPLETE</div><h1>Your starting point is recorded.</h1><p>You answered ${Number(result.correct||0)} of ${Number(result.total||0)} questions correctly. This score has <b>0% credential weight</b>.</p><div class="cmv2-evidence-note"><b>${esc(readinessLabel(r.status))}</b><span>${Number(r.evidenceCoverage||0)}% professional evidence coverage · ${esc(evidencePhaseLabel(r.evidencePhase))}</span></div><div class="cmv2-success-actions"><a class="btn btn-primary" href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">View Skill Profile →</a><a class="btn btn-outline" href="#/v2-assessment/ib-essentials-case${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Continue to Essentials →</a></div></div></div></div></section>`);
  }

  async function skillsPage(pathwayId, assignmentId='') {
    if (!authReady()) return loading('Loading skill profile…');
    if (!signedIn()) return authGate('learner');
    loading('Building your competency profile…');
    try {
      await loadCatalog();
      const d=await api(`/enterprise/learner/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`);
      const r=d.readiness; const skills=d.competencies||[];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(pathwayId)}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">COMPETENCY PROFILE</div><h1>${esc(d.pathway.title)} Readiness</h1><p>Every score below is tied to stored assessment or Role Lab evidence—not a self-rating.</p></div></div>${r?`<div class="cmv2-readiness-summary"><div class="cmv2-readiness-score">${Number(r.overallScore||0)}</div><div><b>${esc(readinessLabel(r.status))}</b><span>${Number(r.evidenceCoverage||0)}% professional evidence coverage</span><small>${esc(evidencePhaseLabel(r.evidencePhase))}</small></div></div>`:''}<div class="cmv2-skill-grid">${skills.length?skills.map(x=>`<article class="card cmv2-skill-card"><div class="cmv2-skill-head"><div><span>${esc(String(x.category||'').replace(/_/g,' '))}</span><h3>${esc(x.name)}</h3></div><strong>${Number(x.score||0)}</strong></div><div class="cmv2-skill-meter"><i style="width:${Math.max(0,Math.min(100,Number(x.score||0)))}%"></i><b style="left:${Math.max(0,Math.min(100,Number(x.minimum_score||0)))}%"></b></div><div class="cmv2-skill-foot"><span>Evidence: ${Number(x.evidence_count||0)}</span><span>Target: ${Number(x.minimum_score||0)}${Number(x.critical)===1?' · Critical':''}</span></div></article>`).join(''):`<div class="card cmv2-empty"><h2>No evidence yet.</h2><p>Take the diagnostic to establish a baseline.</p><a class="btn btn-primary" href="#/diagnostic/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Take Diagnostic →</a></div>`}</div>${r?`<section class="card cmv2-readiness-explainer"><div><div class="eyebrow">WHY THE STATUS MAY TRAIL THE SCORE</div><h2>Capital Mastery requires evidence coverage, not just a high number.</h2><p>A strong diagnostic can produce a high baseline score, but professional readiness is capped until applied work, the Role Lab and final evidence cover the required competencies.</p>${assignmentId?`<a class="btn btn-outline btn-sm" href="#/readiness/${encodeURIComponent(pathwayId)}?assignment=${encodeURIComponent(assignmentId)}">Open Full Readiness Report →</a>`:''}</div>${r.baselineScore!=null?`<div class="cmv2-improvement"><span>Baseline</span><b>${Number(r.baselineScore)}</b><span>Current skill estimate</span><b>${Number(r.overallScore)}</b><span>Change</span><b>${Number(r.improvement)>=0?'+':''}${Number(r.improvement||0)}</b></div>`:''}</section>`:''}</div></section>`);
    } catch(e){ errorPage('Could not load skill profile.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  async function teamPage(orgId) {
    if(!authReady()) return loading('Loading team access…'); if(!signedIn()) return authGate('employer'); loading('Loading organization roles…');
    try {
      const [members,invites]=await Promise.all([api(`/enterprise/organizations/${encodeURIComponent(orgId)}/members`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`)]); const list=members.members||[]; const pending=(invites.invites||[]).filter(x=>x.status==='pending');
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">TEAM & ROLES</div><h1>Control who can manage the workspace.</h1><p>Owner, Training Admin, Content Manager, Manager, Viewer and Learner permissions are enforced by the Worker—not trusted from the browser.</p></div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">INVITE STAFF</div><h2>Add employer access</h2><form id="cmv2-staff-invite" class="cmv2-simple-form"><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Role<select name="role"><option value="training_admin">Training Admin</option><option value="content_manager">Content Manager</option><option value="manager">Manager / Reviewer</option><option value="viewer">Viewer</option></select></label><button class="btn btn-primary" type="submit">Create Secure Invite →</button><div class="cmv2-form-status" aria-live="polite"></div></form>${pending.length?`<div class="cmv2-pending"><h3>Pending invitations</h3>${pending.map(x=>`<div><span>${esc(x.email_normalized)}</span><b>${esc(x.role.replace(/_/g,' '))}</b></div>`).join('')}</div>`:''}</section><section class="card"><div class="eyebrow">PERMISSION MODEL</div><h2>Least privilege by default</h2><div class="cmv2-evidence-list"><div><span>Owner</span><b>All organization controls</b></div><div><span>Training Admin</span><b>Cohorts, invites, reports</b></div><div><span>Content Manager</span><b>Firm Layer content</b></div><div><span>Manager</span><b>Readiness visibility</b></div><div><span>Viewer</span><b>Read-only employer views</b></div><div><span>Learner</span><b>Own assigned work only</b></div></div></section></div><section class="card cmv2-report-table-card"><div class="cmv2-card-head"><div><div class="eyebrow">ACTIVE MEMBERS</div><h2>Workspace access</h2></div></div><div class="cmv2-table-scroll"><table class="cmv2-report-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Save</th></tr></thead><tbody>${list.map(x=>`<tr data-member="${esc(x.uid)}"><td><b>${esc(x.name||x.email||'Member')}</b><small>${esc(x.email||x.uid)}</small></td><td><select data-member-role><option value="owner" ${x.role==='owner'?'selected':''}>Owner</option><option value="training_admin" ${x.role==='training_admin'?'selected':''}>Training Admin</option><option value="content_manager" ${x.role==='content_manager'?'selected':''}>Content Manager</option><option value="manager" ${x.role==='manager'?'selected':''}>Manager</option><option value="viewer" ${x.role==='viewer'?'selected':''}>Viewer</option><option value="learner" ${x.role==='learner'?'selected':''}>Learner</option></select></td><td><select data-member-status><option value="active" ${x.status==='active'?'selected':''}>Active</option><option value="archived" ${x.status==='archived'?'selected':''}>Archived</option></select></td><td><button class="btn btn-soft btn-sm" data-save-member>Save</button></td></tr>`).join('')}</tbody></table></div><div class="cmv2-form-status" id="cmv2-team-status" aria-live="polite"></div></section></div></section>`);
      document.getElementById('cmv2-staff-invite')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),st=f.querySelector('.cmv2-form-status'),btn=f.querySelector('button');btn.disabled=true;try{const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`,{method:'POST',body:JSON.stringify({email:String(fd.get('email')||''),role:String(fd.get('role')||'viewer'),expiresDays:7})});const link=`${location.origin}${location.pathname}#/join/${encodeURIComponent(r.invite.token)}`;await navigator.clipboard?.writeText?.(link);st.textContent='Secure invite created. The link was copied to your clipboard.';setTimeout(()=>teamPage(orgId),600);}catch(err){st.textContent=err.message;btn.disabled=false;}});
      document.querySelectorAll('[data-save-member]').forEach(btn=>btn.addEventListener('click',async()=>{const row=btn.closest('[data-member]'),st=document.getElementById('cmv2-team-status');btn.disabled=true;try{await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(row.dataset.member)}`,{method:'PATCH',body:JSON.stringify({role:row.querySelector('[data-member-role]').value,status:row.querySelector('[data-member-status]').value})});st.textContent='Member access updated and audited.';await teamPage(orgId);}catch(err){st.textContent=err.message;btn.disabled=false;}}));
    } catch(e){errorPage('Team access unavailable.',e.message,`#/employer/${orgId}`);}
  }

  async function auditPage(orgId) {
    if(!authReady()) return loading('Loading audit history…'); if(!signedIn()) return authGate('employer'); loading('Loading enterprise audit log…');
    try { const d=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/audit?limit=150`); const events=d.events||[]; setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">AUDIT LOG</div><h1>Server-recorded organization history.</h1><p>Material organization, cohort, assignment, content, invitation and permission changes are recorded in D1.</p></div></div><section class="card"><div class="cmv2-audit-list">${events.length?events.map(x=>`<article><time>${esc(fmtDate(x.createdAt))}</time><div><b>${esc(x.action.replace(/\./g,' · '))}</b><span>${esc(x.targetType||'event')} ${x.targetId?`· ${esc(x.targetId)}`:''}</span><code>${esc(JSON.stringify(x.details||{}))}</code></div></article>`).join(''):'<p>No enterprise audit events yet.</p>'}</div></section></div></section>`); } catch(e){errorPage('Audit log unavailable.',e.message,`#/employer/${orgId}`);}
  }

  async function myDataPage() {
    if(!authReady()) return loading('Preparing your data tools…'); if(!signedIn()) return authGate('learner');
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/assigned">← Assigned training</a><div class="card cmv2-form-card"><div class="eyebrow">YOUR DATA</div><h1>Export your Capital Mastery enterprise data.</h1><p>Your export includes memberships, cohorts, credentials, diagnostic metadata, competency scores, readiness snapshots, Role Lab run metadata and assessment results. It intentionally excludes secure answer keys and hidden grading rules.</p><button class="btn btn-primary btn-block" id="cmv2-export-my-data">Download JSON Export →</button><div class="cmv2-form-status" aria-live="polite"></div></div></div></section>`);
    document.getElementById('cmv2-export-my-data')?.addEventListener('click',async e=>{const btn=e.currentTarget,st=btn.parentElement.querySelector('.cmv2-form-status');btn.disabled=true;try{st.textContent='Building export…';const d=await api('/enterprise/me/export');const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='capital-mastery-data-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);st.textContent='Export ready.';}catch(err){st.textContent=err.message;btn.disabled=false;}});
  }

  function scenarioHtml(scenario={}) {
    const entries=Object.entries(scenario||{}).filter(([,v])=>['string','number','boolean'].includes(typeof v)).slice(0,8);
    if(!entries.length) return '';
    return `<div class="cmv2-case-context">${entries.map(([k,v])=>`<div><span>${esc(k.replace(/_/g,' '))}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
  }

  async function v2AssessmentPage(key, assignmentId='') {
    if(!authReady()) return loading('Preparing secure assessment…');
    if(!signedIn()) return authGate('learner');
    loading('Loading server-defined assessment…');
    try {
      const d=await api(`/enterprise/assessments/${encodeURIComponent(key)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`);
      const a=d.assessment; const questions=d.questions||[];
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(a.pathwayId)}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">${esc(String(a.stage||'assessment').replace(/_/g,' ').toUpperCase())} · SERVER GRADED</div><h1>${esc(a.title)}</h1><p>${esc(a.description||'')} · ${Number(a.passScore)}% required.</p></div></div>${scenarioHtml(a.scenario)}<form id="cmv2-v2-assessment" class="cmv2-diagnostic-list">${questions.map((q,i)=>`<fieldset class="card cmv2-question"><legend><span>${String(i+1).padStart(2,'0')}</span>${esc(q.prompt)}</legend><div class="cmv2-options">${(q.options||[]).map(o=>`<label><input type="radio" name="${esc(q.id)}" value="${esc(o)}" required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`).join('')}<div class="card cmv2-submit-bar"><div><b>${Number(a.passScore)}% mastery required.</b><span>Answer keys stay on the secure Worker.</span></div><button class="btn btn-primary" type="submit">Submit ${a.stage==='final'?'Professional Final':'Assessment'} →</button></div><div class="cmv2-form-status" aria-live="polite"></div></form></div></section>`);
      document.getElementById('cmv2-v2-assessment')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget; const btn=form.querySelector('button[type="submit"]'); const status=form.querySelector('.cmv2-form-status'); btn.disabled=true;
        try { const fd=new FormData(form); const answers={}; questions.forEach(q=>answers[q.id]=String(fd.get(q.id)||'')); status.textContent='Grading securely…'; const result=await api(`/enterprise/assessments/${encodeURIComponent(key)}/submit`,{method:'POST',body:JSON.stringify({assignmentId:assignmentId||null,answers})}); renderV2AssessmentResult(a,assignmentId,result); }
        catch(err){status.textContent=err.message;btn.disabled=false;}
      });
    } catch(e){ errorPage('Assessment unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function renderV2AssessmentResult(assessment, assignmentId, result) {
    const r=result.readiness||{}; const issued=result.issuedCredentials||[]; const next=assessment.stage==='final'?(assignmentId?`#/readiness/${encodeURIComponent(assessment.pathwayId)}?assignment=${encodeURIComponent(assignmentId)}`:'#/credentials'):(assignmentId?`#/role-lab/${encodeURIComponent(assessment.pathwayId)}?assignment=${encodeURIComponent(assignmentId)}`:`#/role-lab/${encodeURIComponent(assessment.pathwayId)}`);
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-result-card"><div class="cmv2-result-score"><strong>${Number(result.score||0)}</strong><span>${result.passed?'Passed':'Needs revision'}</span></div><div><div class="eyebrow">SERVER-GRADED RESULT</div><h1>${result.passed?'Evidence recorded.':'Review and try again.'}</h1><p>${Number(result.correct||0)} of ${Number(result.total||0)} items correct · ${Number(result.passScore||assessment.passScore||0)}% required.</p>${r.status?`<div class="cmv2-evidence-note"><b>${esc(readinessLabel(r.status))}</b><span>${Number(r.evidenceCoverage||0)}% professional evidence coverage · ${esc(evidencePhaseLabel(r.evidencePhase))}</span></div>`:''}${issued.length?`<div class="cmv2-issued-v2"><b>New verified credential${issued.length>1?'s':''}</b>${issued.map(c=>`<a href="#/credential/${encodeURIComponent(assessment.pathwayId)}/${encodeURIComponent(c.level)}">${esc(c.title)} →</a>`).join('')}</div>`:''}<div class="cmv2-success-actions"><a class="btn btn-primary" href="${result.passed?next:`#/v2-assessment/${encodeURIComponent(assessment.key)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}`}">${result.passed?(assessment.stage==='final'?'View Readiness Report →':'Continue to Role Lab →'):'Retake Assessment →'}</a>${assignmentId?`<a class="btn btn-outline" href="#/assigned/${encodeURIComponent(assignmentId)}">Assigned Program</a>`:''}</div></div></div></div></section>`);
  }

  async function learnerReadinessReport(pathwayId, assignmentId='') {
    if(!authReady()) return loading('Building readiness report…');
    if(!signedIn()) return authGate('learner');
    loading('Loading verified readiness evidence…');
    try {
      const d=await api(`/enterprise/learner/readiness-report/${encodeURIComponent(pathwayId)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`); const r=d.readiness; const skills=d.competencies||[]; const creds=d.credentials||[];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(pathwayId)}`}">← Back</a><div class="cmv2-report-hero"><div><div class="eyebrow">VERIFIED READINESS REPORT</div><h1>${esc(d.pathway.title)}</h1><p>${esc(d.pathway.role)} · Generated ${fmtDate(d.generatedAt)}</p></div><div class="cmv2-report-score"><strong>${r?Number(r.overallScore):'—'}</strong><span>${esc(readinessLabel(r?.status))}</span><small>${r?Number(r.evidenceCoverage):0}% evidence coverage</small></div></div><div class="cmv2-kpis"><div class="card"><strong>${d.diagnostic?Number(d.diagnostic.score):'—'}</strong><span>Baseline</span></div><div class="card"><strong>${r?Number(r.overallScore):'—'}</strong><span>Current readiness</span></div><div class="card"><strong>${r&&r.improvement!=null?(Number(r.improvement)>=0?'+':'')+Number(r.improvement):'—'}</strong><span>Improvement</span></div><div class="card"><strong>${d.roleLab?.score??'—'}</strong><span>Role Lab</span></div></div><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">COMPETENCY EVIDENCE</div><h2>What the readiness score represents</h2></div><a href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Detailed profile →</a></div><div class="cmv2-report-competencies">${skills.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><div class="cmv2-report-bar"><i style="width:${Math.max(0,Math.min(100,Number(x.score)))}%"></i><b style="left:${Math.max(0,Math.min(100,Number(x.minimumScore)))}%"></b></div><strong>${Number(x.score)}</strong><small>${Number(x.evidenceCount)} evidence records</small></div>`).join('')||'<p>No competency evidence yet.</p>'}</div></section><div class="cmv2-two-col"><section class="card"><div class="eyebrow">WORK EVIDENCE</div><h2>Applied proof</h2><div class="cmv2-evidence-list"><div><span>Diagnostic</span><b>${d.diagnostic?`${Number(d.diagnostic.score)}%`:'Not completed'}</b></div><div><span>Role Lab</span><b>${d.roleLab?`${Number(d.roleLab.score||0)}% · ${esc(d.roleLab.status)}`:'Not completed'}</b></div><div><span>Professional Final</span><b>${d.finalAssessment?`${Number(d.finalAssessment.score)}% · ${d.finalAssessment.passed?'Passed':'Not passed'}`:'Not completed'}</b></div></div></section><section class="card"><div class="eyebrow">VERIFIED CREDENTIALS</div><h2>Stackable achievements</h2><div class="cmv2-evidence-list">${creds.map(c=>`<a href="#/credential/${encodeURIComponent(pathwayId)}/${encodeURIComponent(c.level)}"><span>${esc(c.title)}</span><b>${esc(c.status)}</b></a>`).join('')||'<p>No credentials yet.</p>'}</div></section></div></div></section>`);
    } catch(e){ errorPage('Readiness report unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function downloadReportCsv(report) {
    const rows=[['Learner','Email','Readiness','Status','Evidence Coverage','Diagnostic','Role Lab','Final','Complete','Overdue']];
    for(const x of report.learners||[]) rows.push([x.name||'',x.email||'',x.readiness?.overallScore??'',x.readiness?.status||'',x.readiness?.evidenceCoverage??'',x.diagnostic?.score??'',x.roleLab?.score??'',x.final?.score??'',x.complete?'Yes':'No',x.overdue?'Yes':'No']);
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='capital-mastery-readiness-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function employerReadinessReport(orgId, selectedAssignment='') {
    if(!authReady()) return loading('Loading employer report…'); if(!signedIn()) return authGate('employer'); loading('Building cohort readiness report…');
    try {
      await loadCatalog(); const as=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`); const assignments=(as.assignments||[]).filter(x=>x.status!=='archived'); const chosen=assignments.find(x=>x.id===selectedAssignment)||assignments[0];
      if(!chosen) return setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="card cmv2-empty"><h2>No assignment to report yet.</h2><p>Create and publish a cohort first.</p><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a></div></div></section>`);
      const data=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(chosen.id)}`); const report=data.assignments?.[0]; if(!report) throw new Error('No report data returned.'); const s=report.summary; const weak=(report.competencies||[]).slice(0,3);
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER READINESS REPORT</div><h1>${esc(report.assignment.cohortName)}</h1><p>${esc(pathTitle(report.assignment.pathwayId))} · ${esc(targetTitle(report.assignment.credentialTarget))} · Generated ${fmtDate(data.generatedAt)}</p></div><button class="btn btn-outline" id="cmv2-export-report">Export CSV</button></div><div class="card cmv2-program-picker"><label>Assignment<select id="cmv2-report-picker">${assignments.map(x=>`<option value="${esc(x.id)}" ${x.id===chosen.id?'selected':''}>${esc(pathTitle(x.pathway_id))} · ${esc(x.status)} · ${fmtDate(x.due_at)}</option>`).join('')}</select></label></div><div class="cmv2-kpis"><div class="card"><strong>${Number(s.learners)}</strong><span>Learners</span></div><div class="card"><strong>${s.averageReadiness??'—'}</strong><span>Avg. readiness</span></div><div class="card"><strong>${s.averageImprovement==null?'—':(Number(s.averageImprovement)>=0?'+':'')+Number(s.averageImprovement)}</strong><span>Avg. improvement</span></div><div class="card"><strong>${Number(s.completed)}</strong><span>Completed</span></div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">COACHING SIGNALS</div><h2>Lowest measured competencies</h2><div class="cmv2-evidence-list">${weak.length?weak.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><b>${Number(x.averageScore)}%</b></div>`).join(''):'<p>Competency signals appear after learners begin.</p>'}</div></section><section class="card"><div class="eyebrow">ATTENTION</div><h2>What needs a manager</h2><div class="cmv2-evidence-list"><div><span>Overdue</span><b>${Number(s.overdue)}</b></div><div><span>Measured</span><b>${Number(s.measured)}</b></div><div><span>Still incomplete</span><b>${Math.max(0,Number(s.learners)-Number(s.completed))}</b></div></div></section></div><section class="card cmv2-report-table-card"><div class="cmv2-card-head"><div><div class="eyebrow">LEARNERS</div><h2>Individual readiness</h2></div></div><div class="cmv2-table-scroll"><table class="cmv2-report-table"><thead><tr><th>Learner</th><th>Diagnostic</th><th>Readiness</th><th>Evidence</th><th>Role Lab</th><th>Final</th><th>Status</th></tr></thead><tbody>${(report.learners||[]).map(x=>`<tr><td><b>${esc(x.name||x.email||'Learner')}</b><small>${esc(x.email||'')}</small></td><td>${x.diagnostic?Number(x.diagnostic.score)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.overallScore)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.evidenceCoverage)+'%':'—'}</td><td>${x.roleLab?.score!=null?Number(x.roleLab.score)+'%':'—'}</td><td>${x.final?.score!=null?Number(x.final.score)+'%':'—'}</td><td><span class="cmv2-status ${x.complete?'completed':x.overdue?'archived':'draft'}">${x.complete?'Complete':x.overdue?'Overdue':'In progress'}</span></td></tr>`).join('')||'<tr><td colspan="7">No learners yet.</td></tr>'}</tbody></table></div></section></div></section>`);
      document.getElementById('cmv2-report-picker')?.addEventListener('change',e=>employerReadinessReport(orgId,e.target.value)); document.getElementById('cmv2-export-report')?.addEventListener('click',()=>downloadReportCsv(report));
    } catch(e){ errorPage('Could not load readiness report.',e.message,`#/employer/${orgId}`); }
  }

  async function roleLabLanding(pathwayId, assignmentId='') {
    if (!authReady()) return loading('Preparing Role Lab…');
    if (!signedIn()) return authGate('learner');
    loading('Loading professional Role Lab…');
    try {
      await loadCatalog(); const d=await api(`/enterprise/role-labs/${encodeURIComponent(pathwayId)}`); const lab=(d.labs||[])[0]; if(!lab) throw new Error('A professional Role Lab for this pathway is not live yet.'); const s=lab.scenario||{};
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(pathwayId)}`}">← Back</a><div class="cmv2-rolelab-hero"><div><div class="eyebrow">ROLE LAB · ${esc(lab.roleTitle)}</div><h1>${esc(lab.title)}</h1><p>${esc(s.context||'')}</p><div class="cmv2-rolelab-meta"><span><b>Desk</b>${esc(s.desk||'')}</span><span><b>Associate</b>${esc(s.associate||'')}</span><span><b>Client</b>${esc(lab.clientName||s.buyer||'')}</span><span><b>Pass standard</b>${Number(lab.passScore||80)}%</span></div></div><div class="cmv2-rolelab-badge">LIVE-STYLE<br>WORKFLOW</div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">WHAT YOU WILL DO</div><h2>Perform the work—not answer trivia.</h2><div class="cmv2-work-list"><div><b>01</b><span>Build a transaction snapshot from raw case information.</span></div><div><b>02</b><span>Run trading-comps valuation and reconcile EV to equity value.</span></div><div><b>03</b><span>Complete a DCF cross-check.</span></div><div><b>04</b><span>Analyze a proposed acquisition price.</span></div><div><b>05</b><span>Find material errors in an imperfect model.</span></div><div><b>06</b><span>React to a management forecast change.</span></div><div><b>07</b><span>Send the Associate a concise recommendation.</span></div></div></section><section class="card cmv2-start-lab"><div class="eyebrow">PROJECT FILE</div><h2>${esc(s.target||'Target Company')}</h2><p>Historical financials, capitalization, forecasts, trading comps, precedents and DCF assumptions are provided inside the case.</p><div class="cmv2-warning-soft">All companies, people and data are synthetic training materials. No proprietary employer information is used.</div><button class="btn btn-primary btn-block" id="cmv2-start-lab">Start / Resume Role Lab →</button><a class="btn btn-outline btn-block" href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">View Skill Profile</a><div class="cmv2-form-status"></div></section></div></div></section>`);
      document.getElementById('cmv2-start-lab')?.addEventListener('click',async e=>{const b=e.currentTarget;const st=b.parentElement.querySelector('.cmv2-form-status');b.disabled=true;try{st.textContent='Opening your secure run…';const r=await api(`/enterprise/role-labs/${encodeURIComponent(lab.labKey)}/start`,{method:'POST',body:JSON.stringify({assignmentId:assignmentId||null})});location.hash=`#/role-lab-run/${encodeURIComponent(r.runId)}`;}catch(err){st.textContent=err.message;b.disabled=false;}});
    } catch(e){ errorPage('Role Lab unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function roleLabFieldHtml(field) {
    const id=esc(field.id); const label=esc(field.label||field.id); const type=field.type||'number';
    if(type==='choice') return `<label class="cmv2-lab-field"><span>${label}</span><select name="${id}" required><option value="">Choose…</option>${(field.options||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`;
    if(type==='textarea') return `<label class="cmv2-lab-field"><span>${label}</span><textarea name="${id}" rows="8" maxlength="${Number(field.maxLength||2200)}" required placeholder="Write the concise work product you would send to your Associate…"></textarea></label>`;
    return `<label class="cmv2-lab-field"><span>${label}</span><div class="cmv2-number-wrap">${field.prefix?`<i>${esc(field.prefix)}</i>`:''}<input type="number" step="any" name="${id}" required>${field.suffix?`<i>${esc(field.suffix)}</i>`:''}</div></label>`;
  }

  function roleLabTaskForm(task) {
    const b=task.brief||{};
    if(task.taskType==='multi_select' && b.field) return `<div class="cmv2-lab-checks">${(b.field.options||[]).map(o=>`<label><input type="checkbox" name="${esc(b.field.id)}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div>`;
    return `<div class="cmv2-lab-fields">${(b.fields||[]).map(roleLabFieldHtml).join('')}</div>`;
  }

  async function roleLabRun(runId) {
    if (!authReady()) return loading('Opening your Role Lab desk…');
    if (!signedIn()) return authGate('learner');
    loading('Opening analyst workspace…');
    try {
      const d=await api(`/enterprise/role-lab-runs/${encodeURIComponent(runId)}`); const task=d.currentTask; const s=d.lab?.scenario||{}; const completed=d.completed||[];
      if(d.complete || d.run?.status==='passed') {
        setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-lab-complete"><div class="cmv2-success-icon">✓</div><div class="eyebrow">ROLE LAB PASSED</div><h1>${esc(d.lab.title)}</h1><div class="cmv2-result-score"><strong>${Number(d.run.score||d.overallScore||0)}</strong><span>Role Lab score</span></div><p>You completed all required desk tasks, including model review, a changing management assumption and the final Associate recommendation.</p><div class="cmv2-success-actions"><a class="btn btn-primary" href="#/skills/${encodeURIComponent(d.run.pathwayId)}${d.run.assignmentId?`?assignment=${encodeURIComponent(d.run.assignmentId)}`:''}">View Updated Skill Profile →</a><a class="btn btn-outline" href="${d.run.assignmentId?`#/assigned/${encodeURIComponent(d.run.assignmentId)}`:`#/career/${encodeURIComponent(d.run.pathwayId)}`}">Back to Program</a></div></div></div></section>`); return;
      }
      if(!task) throw new Error('No current Role Lab task is available.');
      const latestForTask=completed.filter(x=>x.taskId===task.id).sort((a,b)=>b.attemptNo-a.attemptNo)[0];
      setMain(`<section class="cmv2-rolelab-page"><div class="container"><div class="cmv2-deskbar"><div><span>${esc(s.timeline||'Analyst Desk')}</span><b>${esc(s.desk||d.lab.roleTitle)}</b></div><div><span>Project</span><b>${esc(s.target||d.lab.title)}</b></div><div><span>Overall</span><b>${Number(d.overallScore||0)}%</b></div><a href="${d.run.assignmentId?`#/assigned/${encodeURIComponent(d.run.assignmentId)}`:'#/careers'}">Exit desk</a></div><div class="cmv2-desk-grid"><aside class="card cmv2-data-room"><div class="eyebrow">DATA ROOM</div><h3>${esc(s.target||'Target')}</h3><details open><summary>Historical financials</summary><table><thead><tr><th>Year</th><th>Revenue</th><th>EBITDA</th></tr></thead><tbody>${Object.entries(s.historicals||{}).map(([y,v])=>`<tr><td>${esc(y)}</td><td>$${esc(v.revenue)}m</td><td>$${esc(v.ebitda)}m</td></tr>`).join('')}</tbody></table></details><details><summary>Capitalization</summary><div class="cmv2-data-pairs">${Object.entries(s.capitalization||{}).map(([k,v])=>`<span>${esc(k.replace(/_/g,' '))}<b>${esc(v)}</b></span>`).join('')}</div></details><details><summary>Management forecast</summary><table><thead><tr><th>Year</th><th>Revenue</th><th>Margin</th></tr></thead><tbody>${Object.entries(s.management_forecast||{}).map(([y,v])=>`<tr><td>${esc(y)}</td><td>$${esc(v.revenue)}m</td><td>${Math.round(Number(v.ebitda_margin||0)*1000)/10}%</td></tr>`).join('')}</tbody></table></details><details><summary>Trading comps</summary><table><thead><tr><th>Peer</th><th>EV</th><th>EBITDA</th></tr></thead><tbody>${(s.comps||[]).map(v=>`<tr><td>${esc(v.name)}</td><td>$${esc(v.ev)}m</td><td>$${esc(v.ebitda)}m</td></tr>`).join('')}</tbody></table></details><details><summary>DCF assumptions</summary><div class="cmv2-data-pairs"><span>FCF<b>${esc((s.dcf?.fcf||[]).join(', '))}</b></span><span>WACC<b>${Number(s.dcf?.wacc||0)*100}%</b></span><span>Terminal growth<b>${Number(s.dcf?.terminal_growth||0)*100}%</b></span></div></details></aside><main class="card cmv2-workbench"><div class="cmv2-email"><div class="cmv2-email-head"><div class="cmv2-avatar">MC</div><div><b>${esc(task.brief?.from||'Associate')}</b><span>${esc(task.brief?.timestamp||'')}</span></div><em>Stage ${Number(task.stageNo)}</em></div><h1>${esc(task.title)}</h1><p>${esc(task.brief?.message||'')}</p></div>${latestForTask && latestForTask.score < Number(task.passScore)?`<div class="cmv2-manager-feedback"><div class="eyebrow">ASSOCIATE COMMENTS · REVISION REQUIRED</div><strong>${Number(latestForTask.score)}%</strong><p>${esc(latestForTask.feedback?.managerNote||'Revise and resubmit.')}</p><ul>${(latestForTask.feedback?.messages||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<form id="cmv2-lab-task">${roleLabTaskForm(task)}<div class="cmv2-task-foot"><div><span>Task pass threshold</span><b>${Number(task.passScore)}%</b><small>Attempt ${Number(latestForTask?.attemptNo||0)+1} of ${Number(task.maxAttempts)}</small></div><button class="btn btn-primary" type="submit">Submit Work →</button></div><div class="cmv2-form-status"></div></form></main><aside class="card cmv2-run-progress"><div class="eyebrow">DESK PROGRESS</div><h3>${completed.filter(x=>x.score>=70).length} accepted submissions</h3><div class="cmv2-run-history">${completed.sort((a,b)=>String(a.taskId).localeCompare(String(b.taskId))).map(x=>`<div class="${x.score>=70?'good':'revise'}"><span>${esc(x.taskId.toUpperCase())} · Attempt ${Number(x.attemptNo)}</span><b>${Number(x.score)}%</b></div>`).join('')||'<p>No submissions yet.</p>'}</div><div class="cmv2-no-answer">Answer keys stay server-side. Only your feedback and evidence scores return to the browser.</div></aside></div></div></section>`);
      document.getElementById('cmv2-lab-task')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget; const btn=form.querySelector('button'); const status=form.querySelector('.cmv2-form-status'); btn.disabled=true;
        try { const fd=new FormData(form); const response={}; if(task.taskType==='multi_select'&&task.brief?.field){response[task.brief.field.id]=fd.getAll(task.brief.field.id).map(String);} else {(task.brief?.fields||[]).forEach(f=>{const v=fd.get(f.id);response[f.id]=f.type==='number'||!f.type?Number(v):String(v||'');});} status.textContent='Submitting to the secure grader…'; const result=await api(`/enterprise/role-lab-runs/${encodeURIComponent(runId)}/submit`,{method:'POST',body:JSON.stringify({taskId:task.id,response})}); renderLabSubmissionResult(runId,task,result); }
        catch(err){status.textContent=err.message;btn.disabled=false;}
      });
    } catch(e){ errorPage('Could not open Role Lab.',e.message,'#/assigned'); }
  }

  function renderLabSubmissionResult(runId, task, result) {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-submission-result ${result.passed?'pass':'revise'}"><div class="eyebrow">${result.passed?'WORK ACCEPTED':'ASSOCIATE REVIEW'}</div><div class="cmv2-result-score"><strong>${Number(result.score||0)}</strong><span>${esc(task.title)}</span></div><h1>${result.passed?'Continue to the next desk task.':'Revision required before you continue.'}</h1><p>${esc(result.feedback?.managerNote||'')}</p>${(result.feedback?.messages||[]).length?`<ul>${result.feedback.messages.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<div class="cmv2-breakdown">${(result.feedback?.breakdown||[]).map(x=>`<div><span>${esc(String(x.field).replace(/_/g,' '))}</span><b>${Number(x.points)}/${Number(x.possible)}</b><small>${esc(x.detail||'')}</small></div>`).join('')}</div><button class="btn btn-primary btn-block" id="cmv2-continue-lab">${result.complete?'View Completion →':result.passed?'Continue →':'Revise Task →'}</button></div></div></section>`);
    document.getElementById('cmv2-continue-lab')?.addEventListener('click',()=>roleLabRun(runId));
  }

  async function joinInvite(token) {
    if (!token) return errorPage('Invalid invitation.','The invitation link is missing its secure token.','#/');
    localStorage.setItem(PENDING_INVITE, token);
    if (!authReady()) return loading('Checking your invitation…');
    if (!signedIn()) {
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-auth-gate"><div class="eyebrow">COMPANY INVITATION</div><h1>Sign in to join your training cohort.</h1><p>After you sign in, Capital Mastery will securely accept this invitation for the matching account.</p><a class="btn btn-primary" href="#/login">Sign in / Create Account →</a></div></div></section>`);
      return;
    }
    loading('Accepting company invitation…');
    try { await api('/enterprise/invites/accept',{method:'POST',body:JSON.stringify({token})}); localStorage.removeItem(PENDING_INVITE); location.hash='#/assigned'; }
    catch(e){ errorPage('Could not accept invitation.',e.message,'#/assigned'); }
  }

  async function acceptPendingInviteAfterAuth() {
    const token=localStorage.getItem(PENDING_INVITE); if(!token||!signedIn()) return;
    if (!['login'].includes(parts().parts[0]||'')) return;
    try { await api('/enterprise/invites/accept',{method:'POST',body:JSON.stringify({token})}); localStorage.removeItem(PENDING_INVITE); location.hash='#/assigned'; }
    catch(e) { console.warn('Pending Capital Mastery employer invite not accepted:',e); }
  }

  async function route() {
    const {parts:p,query}=parts(); const [root,a,b]=p;
    if (!['employers','employer','assigned','join','diagnostic','skills','readiness','v2-assessment','role-lab','role-lab-run','my-data'].includes(root)) return false;
    if (root==='employers') { employerLanding(); return true; }
    if (root==='employer' && !a) { await employerHome(); return true; }
    if (root==='employer' && a && b==='quick-assign') { await quickAssign(a); return true; }
    if (root==='employer' && a && b==='curriculum') { await curriculum(a,query.get('assignment')||''); return true; }
    if (root==='employer' && a && b==='reports') { await employerReadinessReport(a,query.get('assignment')||''); return true; }
    if (root==='employer' && a && b==='team') { await teamPage(a); return true; }
    if (root==='employer' && a && b==='audit') { await auditPage(a); return true; }
    if (root==='employer' && a) { await orgDashboard(a); return true; }
    if (root==='assigned' && !a) { await assignedHome(); return true; }
    if (root==='assigned' && a) { await assignedDetail(a); return true; }
    if (root==='my-data') { await myDataPage(); return true; }
    if (root==='diagnostic' && a) { await diagnosticPage(a,query.get('assignment')||''); return true; }
    if (root==='skills' && a) { await skillsPage(a,query.get('assignment')||''); return true; }
    if (root==='readiness' && a) { await learnerReadinessReport(a,query.get('assignment')||''); return true; }
    if (root==='v2-assessment' && a) { await v2AssessmentPage(a,query.get('assignment')||''); return true; }
    if (root==='role-lab' && a) { await roleLabLanding(a,query.get('assignment')||''); return true; }
    if (root==='role-lab-run' && a) { await roleLabRun(a); return true; }
    if (root==='join' && a) { await joinInvite(decodeURIComponent(a)); return true; }
    return false;
  }

  function boot() {
    window.addEventListener('hashchange',()=>setTimeout(route,0));
    document.addEventListener('cm-auth-changed',()=>{ setTimeout(route,0); setTimeout(acceptPendingInviteAfterAuth,50); });
    setTimeout(route,0);
  }

  window.CM_ENTERPRISE_V2 = { route, api, loadCatalog };
  boot();
})();
