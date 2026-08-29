(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  const PENDING_INVITE = 'cmPendingEnterpriseInviteV2';
  const EMPLOYER_INTENT = 'cmEmployerOnboardingIntentV2';
  const STANDARD_STAGES = {
    foundations: [
      { id:'foundations-core', title:'Career Foundations', copy:'Understand the role, team, workflow, terminology and fundamental finance concepts.', required:true },
      { id:'foundations-assessment', title:'Foundations Assessment', copy:'Prove baseline understanding before earning the Foundations Certificate.', required:true },
      { id:'essentials-mini-case', title:'Essentials Mini Case', copy:'Apply the fundamentals in a short guided case.', required:true },
      { id:'essentials-assessment', title:'Essentials Assessment', copy:'Earn the Essentials Certificate by applying the core concepts.', required:true },
      { id:'optional-interview-prep', title:'Interview Prep', copy:'Optional role-specific interview and recruiting practice.', required:false }
    ],
    professional: [
      { id:'foundations-core', title:'Foundations + Technical Academy', copy:'Learn the role and technical core first, then earn the Foundations credential before advanced work.', required:true },
      { id:'diagnostic', title:'Baseline Diagnostic', copy:'Measure starting readiness without counting against the learner. This is the only pre-teaching diagnostic.', required:true },
      { id:'essentials-mini-case', title:'Essentials Mini Case', copy:'Apply the taught foundations in a short secure case and earn Essentials.', required:true },
      { id:'applied-skills', title:'Professional Toolkit + Applied Work', copy:'Learn the real tools visually, complete guided practice, then independent work products and the Applied Skills credential.', required:true },
      { id:'role-lab', title:'Professional Role Lab', copy:'Perform the actual job workflow with source files, manager instructions, feedback and revisions.', required:true },
      { id:'final-assessment', title:'Professional Readiness Final', copy:'Complete the final knowledge/calculation gate after the work simulation.', required:true },
      { id:'optional-interview-prep', title:'Interview Prep', copy:'Optional role-specific recruiting practice that can be hidden for employer cohorts.', required:false }
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

  function publicPathId(id) { return id === 'quantitative-finance' ? 'quant-finance' : id; }
  function orgCapabilities(role='viewer') {
    const r=String(role||'viewer');
    return {
      role:r,
      employer:['owner','training_admin','content_manager','manager','viewer'].includes(r),
      manageAssignments:['owner','training_admin'].includes(r),
      managePeople:['owner','training_admin'].includes(r),
      manageContent:['owner','training_admin','content_manager'].includes(r),
      viewReports:['owner','training_admin','manager','viewer'].includes(r),
      reviewLearners:['owner','training_admin','manager'].includes(r),
      viewAudit:['owner','training_admin'].includes(r)
    };
  }
  function assessmentKey(pathwayId, stage) {
    if (pathwayId === 'investment-banking') return stage === 'essentials' ? 'ib-essentials-case' : 'ib-professional-final';
    return `${pathwayId}-${stage === 'essentials' ? 'essentials-case' : 'professional-final'}`;
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
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-auth-gate"><div class="eyebrow">SECURE ACCOUNT REQUIRED</div><h1>${esc(title)}</h1><p>${esc(copy)}</p><a class="btn btn-primary" href="#/employer-start">Employer Sign in / Create Account →</a><a class="btn btn-outline" href="#/employers">Learn about Capital Mastery for Employers</a></div></div></section>`);
  }

  function employerEvidenceCards(){
    const ev=window.CM_PUBLIC_EVIDENCE||{};
    return (ev.onboarding||[]).map(x=>`<article class="cmv2-proof-stat"><strong>${esc(x.value)}</strong><h3>${esc(x.label)}</h3><p>${esc(x.detail)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.publisher)} ↗</a></article>`).join('');
  }

  function bindRampValueCalculator(){
    const form=document.getElementById('cmv2-ramp-calculator');
    if(!form) return;
    const calc=()=>{
      const cohort=Math.max(0,Number(form.querySelector('[name="cohort"]')?.value||0));
      const daily=Math.max(0,Number(form.querySelector('[name="daily"]')?.value||0));
      const days=Math.max(0,Number(form.querySelector('[name="days"]')?.value||0));
      const gap=Math.max(0,Math.min(100,Number(form.querySelector('[name="gap"]')?.value||0)))/100;
      const value=cohort*daily*days*gap;
      const output=form.querySelector('[data-ramp-output]');
      const formula=form.querySelector('[data-ramp-formula]');
      if(output) output.textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
      if(formula) formula.textContent=`${cohort} learners × $${Math.round(daily).toLocaleString()}/day × ${days} days × ${Math.round(gap*100)}% assumed productivity gap`;
    };
    form.querySelectorAll('input').forEach(x=>x.addEventListener('input',calc));
    calc();
  }

  function employerLanding() {
    const caveat=window.CM_PUBLIC_EVIDENCE?.caveat||'Public research is shown for context and is not a Capital Mastery performance guarantee.';
    setMain(`<section class="cmv2-employer-hero"><div class="container cmv2-hero-grid"><div><div class="eyebrow">CAPITAL MASTERY FOR EMPLOYERS · FREE TO USE</div><h1>Make new finance talent productive sooner.</h1><p>Role-specific finance preparation, realistic work simulations, competency measurement and verified evidence—before Day 1. No employer subscription, seat fee or trial gate.</p><div class="hero-actions"><a class="btn btn-primary" href="#/employer-start">Open Free Employer Workspace →</a><a class="btn btn-outline" href="#/careers">Preview Career Training</a></div><div class="cmv2-trust-row"><span>✓ Free for employers</span><span>✓ Standardized readiness</span><span>✓ Firm customization</span><span>✓ Evidence-backed coaching</span></div></div><div class="cmv2-preview-panel"><div class="cmv2-preview-top"><span>2027 Summer Analysts</span><b>Readiness 87</b></div><div class="cmv2-meter"><i style="width:87%"></i></div><div class="cmv2-mini-grid"><div><strong>92</strong><span>Accounting</span></div><div><strong>89</strong><span>Valuation</span></div><div><strong>81</strong><span>Modeling</span></div><div><strong>90</strong><span>Communication</span></div></div><div class="cmv2-alert">2 analysts need additional model-review practice.</div></div></div></section>
    <section class="section cmv2-proof-section"><div class="container"><div class="section-head"><div><div class="eyebrow">WHY PRE-DAY-1 PREPARATION MATTERS</div><h2>The onboarding problem is measurable.</h2></div><p>These are public workforce findings—not Capital Mastery outcome claims. They explain why employers care about time-to-productivity, retention and role clarity in the first place.</p></div><div class="cmv2-proof-grid">${employerEvidenceCards()}</div><div class="cmv2-proof-caveat"><strong>Important:</strong> ${esc(caveat)}</div></div></section>
    <section class="section section-white"><div class="container"><div class="cmv2-readiness-thesis"><div><div class="eyebrow">CAPITAL MASTERY'S LAYER</div><h2>Not another HR onboarding portal. A finance-readiness layer.</h2><p>Orientation answers “Where do I go and how does the firm work?” Capital Mastery answers “Can this analyst perform the role-specific work at the required standard?” The two should complement each other.</p><div class="cmv2-readiness-compare"><article><span>Traditional onboarding</span><b>Policies · logistics · systems · culture</b><p>Essential for joining the organization.</p></article><article><span>Capital Mastery</span><b>Technical work · tools · Role Labs · evidence</b><p>Focused on finance-role readiness before managers rely on the work.</p></article></div></div><div class="cmv2-readiness-stack"><div><b>01</b><span>Baseline diagnostic</span><small>Measure starting point without penalizing the learner.</small></div><div><b>02</b><span>Teach the actual work</span><small>Models, research, underwriting, planning, risk and client work.</small></div><div><b>03</b><span>Role Lab + revision</span><small>Secure, realistic work products with changing information.</small></div><div><b>04</b><span>Readiness evidence</span><small>Competency floors, final assessment and manager-readable proof.</small></div></div></div></div></section>
    <section class="section cmv2-ramp-section"><div class="container"><div class="cmv2-ramp-grid"><div><div class="eyebrow">ILLUSTRATIVE RAMP-VALUE MODEL</div><h2>Put your own assumptions into the business case.</h2><p>Instead of claiming a universal ROI, this calculator shows simple arithmetic using the assumptions a firm chooses. Change every input.</p><div class="cmv2-warning-soft"><strong>Not an ROI forecast.</strong> This does not estimate profit, guarantee savings, or assume a new hire is completely unproductive during ramp-up.</div></div><form id="cmv2-ramp-calculator" class="card cmv2-ramp-calculator"><div class="cmv2-ramp-inputs"><label>Cohort size<input type="number" name="cohort" min="0" value="10"></label><label>Fully loaded cost / learner / workday<input type="number" name="daily" min="0" value="500"></label><label>Illustrative faster-ramp days<input type="number" name="days" min="0" value="5"></label><label>Assumed productivity gap during those days<input type="number" name="gap" min="0" max="100" value="40"><span>%</span></label></div><div class="cmv2-ramp-output" role="status" aria-live="polite"><span>Illustrative productive-capacity equivalent</span><strong data-ramp-output>$10,000</strong><small data-ramp-formula></small></div><p>Use this only as a scenario-planning prompt. A firm should validate actual time-to-productivity using its own KPIs, as SHRM recommends.</p><a href="https://www.shrm.org/topics-tools/topics/onboarding/measuring-success" target="_blank" rel="noopener">SHRM · Measuring onboarding success ↗</a></form></div></div></section>
    <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">HOW IT WORKS</div><h2>Set up a real pre-onboarding cohort in minutes.</h2></div><p>The complexity stays underneath. Employers choose the role, people and deadline; Capital Mastery handles the standard.</p></div><div class="grid grid-4 cmv2-steps"><div class="card"><b>01</b><h3>Create a cohort</h3><p>Summer analysts, interns, new hires or a targeted development group.</p></div><div class="card"><b>02</b><h3>Assign readiness</h3><p>Choose Foundations or the full Professional Readiness track.</p></div><div class="card"><b>03</b><h3>Practice real work</h3><p>Learners complete diagnostics, applied tasks and realistic Role Labs.</p></div><div class="card"><b>04</b><h3>See readiness</h3><p>Managers get competency profiles, improvement and actionable coaching signals.</p></div></div></div></section>
    <section class="section section-white"><div class="container"><div class="cmv2-standard-split"><div><div class="eyebrow">CAPITAL MASTERY STANDARD + FIRM LAYER</div><h2>Your standards, without weakening ours.</h2><p>Employers can preview the full Capital Mastery program, add firm-specific material, reorder their additions, and hide optional content. Required credential components stay protected.</p></div><div class="cmv2-layer-card"><div class="cmv2-layer locked">🔒 Capital Mastery Standard</div><div class="cmv2-plus">+</div><div class="cmv2-layer">✦ Your Firm Layer</div><small>Firm content can be hidden, archived and restored. It is never permanently deleted by employers.</small></div></div></div></section>`);
    bindRampValueCalculator();
  }

  function employerStart() {
    if (!authReady()) return loading('Preparing employer onboarding…');
    if (signedIn()) { localStorage.removeItem(EMPLOYER_INTENT); location.hash='#/employer-onboarding'; return; }
    localStorage.setItem(EMPLOYER_INTENT,'1');
    setMain(`<section class="cmv2-page cmv2-employer-start"><div class="container cmv2-narrow-wide"><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER ACCOUNT · $0 TO USE</div><h1>Set up Capital Mastery for your firm.</h1><p>Use the same secure account system as Capital Mastery learning, with an employer-specific setup flow after sign-in. Employer workspaces, cohorts, readiness reports and Firm Layer tools are free to use.</p></div></div><div class="cmv2-two-col"><section class="card"><h2>1 · Secure account</h2><p>Sign in with your existing Capital Mastery account or create one with email / Google.</p><a class="btn btn-primary btn-block" href="#/login" data-employer-auth>Sign in / Create Employer Account →</a><p class="small muted">After authentication, you will return directly to employer setup.</p></section><section class="card"><h2>What happens next</h2><div class="cmv2-evidence-list"><div><span>Identity</span><b>Confirm your full name</b></div><div><span>Firm</span><b>Company / organization name</b></div><div><span>Your role</span><b>Training lead, partner, manager, HR/recruiter, other</b></div><div><span>Scale</span><b>Optional cohort-size range</b></div><div><span>Launch</span><b>Command Center + interactive guide</b></div></div></section></div><div class="card cmv2-security-note"><b>One identity system, two experiences.</b><p>Employer and learner accounts share Firebase Authentication, while organization roles, tenant access, assignments, readiness data and admin rights are enforced by the Capital Mastery Worker + D1.</p></div></div></section>`);
  }

  async function employerOnboarding() {
    if (!authReady()) return loading('Preparing employer onboarding…');
    if (!signedIn()) return employerStart();
    loading('Checking employer setup…');
    try {
      const existing=await api('/enterprise/me');
      if((existing.organizations||[]).length && !parts().query.has('new')) { localStorage.removeItem(EMPLOYER_INTENT); location.hash=`#/employer/${encodeURIComponent(existing.organizations[0].id)}`; return; }
      const u=window.CM_AUTH?.user||{};
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="#/employers">← For Employers</a><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER ONBOARDING · ABOUT 60 SECONDS</div><h1>Create your firm workspace.</h1><p>This information personalizes the employer experience. It does not change the standardized Capital Mastery credential requirements.</p></div></div><div class="cmv2-onboard-grid"><form id="cmv2-employer-onboarding" class="card cmv2-form-card"><label>Full name<input name="fullName" maxlength="120" autocomplete="name" required value="${esc(u.displayName||'')}" placeholder="Your full name"></label><label>Company / firm name<input name="companyName" maxlength="120" autocomplete="organization" required placeholder="Example Advisory Partners"></label><label>Your role<select name="employerRole" required><option value="training_lead">Training / learning lead</option><option value="founder_partner">Founder / partner / senior leader</option><option value="manager">Manager / reviewer</option><option value="recruiter_hr">Recruiter / HR / talent</option><option value="other">Other</option></select></label><label>Approximate cohort size <small>Optional</small><select name="cohortSizeBand"><option value="unspecified">Not sure yet</option><option value="1_10">1–10 learners</option><option value="11_25">11–25</option><option value="26_50">26–50</option><option value="51_100">51–100</option><option value="100_plus">100+</option></select></label><div class="cmv2-form-status" aria-live="polite"></div><button class="btn btn-primary btn-block" type="submit">Create Firm Workspace →</button></form><aside class="card cmv2-onboard-preview"><div class="eyebrow">YOU'LL LAND HERE</div><h2>Employer Command Center</h2><div class="cmv2-guide-kpis"><span><b>—</b> Learners</span><span><b>—</b> Readiness</span><span><b>0</b> Alerts</span></div><ol><li>Run the interactive Launch Guide.</li><li>Create your first role-specific cohort.</li><li>Preview and customize the Firm Layer.</li><li>Invite learners and managers.</li><li>Monitor evidence, readiness and coaching needs.</li></ol><div class="cmv2-warning-soft">No demo-only setup is required. This creates a real production employer workspace.</div></aside></div></div></section>`);
      document.getElementById('cmv2-employer-onboarding')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),st=f.querySelector('.cmv2-form-status'),btn=f.querySelector('button');btn.disabled=true;try{st.textContent='Creating secure employer workspace…';const r=await api('/enterprise/employer-onboarding',{method:'POST',body:JSON.stringify({fullName:String(fd.get('fullName')||''),companyName:String(fd.get('companyName')||''),employerRole:String(fd.get('employerRole')||'other'),cohortSizeBand:String(fd.get('cohortSizeBand')||'unspecified')})});localStorage.removeItem(EMPLOYER_INTENT);location.hash=`#/employer/${encodeURIComponent(r.organization.id)}/guide`;}catch(err){st.textContent=err.message;btn.disabled=false;}});
    } catch(e){ errorPage('Employer onboarding unavailable.',e.message,'#/employers'); }
  }

  async function employerHome() {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Opening your employer workspaces…');
    try {
      await loadCatalog();
      const data = await api('/enterprise/me');
      const orgs = data.organizations || [];
      setMain(`<section class="cmv2-page"><div class="container"><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER WORKSPACES</div><h1>Capital Mastery for Employers</h1><p>Create a cohort, assign readiness, then focus on the coaching that actually needs you.</p></div><a class="btn btn-outline" href="#/assigned">My Assigned Training</a></div>${orgs.length ? `<div class="grid grid-3">${orgs.map(o=>`<a class="card cmv2-org-card" href="#/employer/${encodeURIComponent(o.id)}"><span class="cmv2-role">${esc(o.role.replace(/_/g,' '))}</span><h3>${esc(o.name)}</h3><p>Open cohorts, assignments, readiness and Firm Layer customization.</p><span class="cmv2-arrow">Open workspace →</span></a>`).join('')}<button class="card cmv2-new-org" data-cmv2-new-org><span>＋</span><h3>Add another workspace</h3><p>Create a separate employer organization.</p></button></div>` : `<div class="cmv2-empty card"><div class="cmv2-empty-icon">▦</div><h2>Create your employer workspace.</h2><p>It takes one step. You can create your first cohort immediately afterward.</p><button class="btn btn-primary" onclick="location.hash='#\/employer-onboarding?new=1'">Create Employer Workspace →</button></div>`}</div></section>`);
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


  function learnerProgressStage(x) {
    if (x.complete) return {rank:5,label:'Ready / complete',tone:'good'};
    if (x.final?.passed) return {rank:4,label:'Final passed · credential pending',tone:'good'};
    if (x.roleLab?.status === 'passed') return {rank:3,label:'Role Lab passed · final next',tone:'active'};
    if (x.roleLab) return {rank:2,label:Number(x.roleLab.revisions||0)>0?'Role Lab · revision cycle':'Role Lab in progress',tone:Number(x.roleLab.revisions||0)>0?'warn':'active'};
    if (x.diagnostic) return {rank:1,label:'Technical / applied training',tone:'active'};
    return {rank:0,label:'Not started',tone:'muted'};
  }

  function learnerAttention(x) {
    const stage=learnerProgressStage(x);
    if (x.overdue && !x.complete) return {priority:100,label:'Overdue',reason:`${stage.label}; deadline has passed.`,action:'Follow up on completion plan'};
    if (x.managerReview?.reviewStatus==='needs_attention') return {priority:95,label:'Manager review',reason:x.managerReview.comment||'Manager marked this learner for attention.',action:'Follow the recorded manager coaching note'};
    if (x.roleLab?.revisions>1) return {priority:90,label:'Repeated revisions',reason:`${Number(x.roleLab.revisions||0)} Role Lab revisions; review the feedback pattern.`,action:'Coach the weakest work-product skill'};
    if (x.readiness && Number(x.readiness.evidenceCoverage||0)>=70 && Number(x.readiness.overallScore||0)<75) return {priority:80,label:'Readiness gap',reason:`${Number(x.readiness.overallScore)}% readiness with ${Number(x.readiness.evidenceCoverage)}% evidence coverage.`,action:'Target lowest measured competencies'};
    if (x.roleLab?.score!=null && Number(x.roleLab.score)<80) return {priority:70,label:'Role Lab below standard',reason:`Role Lab ${Number(x.roleLab.score)}%; applied performance needs development.`,action:'Review Role Lab feedback and revision'};
    if (x.diagnostic && !x.roleLab && Number(x.diagnostic.score)<65) return {priority:60,label:'Foundation gap',reason:`Baseline ${Number(x.diagnostic.score)}%; learner may need additional technical reinforcement.`,action:'Use skill profile to focus practice'};
    if (!x.diagnostic) return {priority:50,label:'Not started',reason:'No baseline diagnostic recorded yet.',action:'Confirm learner has opened the assignment'};
    return null;
  }

  function employerGuideKey(orgId){ return `capitalMasteryEmployerGuideV2:${orgId}`; }
  function guideAcknowledged(orgId){ try{return new Set(JSON.parse(localStorage.getItem(employerGuideKey(orgId))||'[]'))}catch{return new Set()} }
  function saveGuideAcknowledged(orgId,set){ localStorage.setItem(employerGuideKey(orgId),JSON.stringify([...set])); }
  function employerGuideSteps(orgId, org, cohorts, assignments, report, role='viewer') {
    const learners=report?.learners||[],caps=orgCapabilities(role);
    const steps=[
      {id:'workspace',title:'Understand the Command Center',copy:caps.viewReports?'See what Capital Mastery measures, where manager attention appears, and what the readiness score does—and does not—mean.':'See the program and curriculum controls available to your role without exposing learner-performance data.',done:true,href:`#/employer/${orgId}`,visual:'command'},
      {id:'assign',title:caps.manageAssignments?'Create a cohort & assign a role':'Inspect assigned programs',copy:caps.manageAssignments?'Choose the career, readiness level, learners and deadline. Capital Mastery protects the standardized core underneath.':'Your role can inspect published programs and their protected curriculum without changing cohort or assignment configuration.',done:assignments.length>0,href:caps.manageAssignments?`#/employer/${orgId}/quick-assign`:`#/employer/${orgId}/curriculum${assignments[0]?`?assignment=${encodeURIComponent(assignments[0].id)}`:''}`,visual:caps.manageAssignments?'assign':'curriculum'},
      {id:'curriculum',title:'Inspect the curriculum before launch',copy:'Preview exactly what learners will be taught and tested on. Add a Firm Layer without weakening required credential components.',done:assignments.length>0,href:`#/employer/${orgId}/curriculum${assignments[0]?`?assignment=${encodeURIComponent(assignments[0].id)}`:''}`,visual:'curriculum'}
    ];
    if(caps.viewReports){steps.push(
      {id:'people',title:'Understand learner progress',copy:'Learn how baseline, evidence coverage, Role Lab work, revisions and final readiness combine into a manager-readable learner state.',done:learners.length>0,href:`#/employer/${orgId}/reports${assignments[0]?`?assignment=${encodeURIComponent(assignments[0].id)}`:''}`,visual:'progress'},
      {id:'coach',title:'Use the Manager Attention Queue',copy:'Do not chase every learner. Capital Mastery prioritizes overdue work, repeated revisions and evidence-backed skill gaps so managers know where coaching is useful.',done:learners.some(x=>learnerAttention(x)),href:`#/employer/${orgId}/reports${assignments[0]?`?assignment=${encodeURIComponent(assignments[0].id)}`:''}`,visual:'coach'}
    );}
    steps.push({id:'govern',title:'Know the controls before rollout',copy:caps.managePeople?'Roles, Firm Layer changes and material actions are server-enforced and audited. Review Team & Roles and the Audit Log before a real cohort launch.':'Your access is intentionally scoped. Review the curriculum controls and Trust Center to understand what your role can inspect versus change.',done:false,href:caps.managePeople?`#/employer/${orgId}/team`:'#/trust',visual:'govern'});
    return steps;
  }

  function employerGuideVisual(kind) {
    if(kind==='command') return `<div class="cmv2-guide-demo"><div class="cmv2-guide-kpis"><span><b>24</b> Learners</span><span><b>86</b> Readiness</span><span><b>5</b> Need attention</span></div><div class="cmv2-guide-callout"><b>Manager principle</b><p>Completion tells you who finished. Readiness evidence tells you what they can actually do.</p></div></div>`;
    if(kind==='assign') return `<div class="cmv2-guide-demo cmv2-guide-flow"><span>Career</span><i>→</i><span>Readiness track</span><i>→</i><span>Cohort</span><i>→</i><span>Deadline</span><i>→</i><span>Publish</span></div>`;
    if(kind==='curriculum') return `<div class="cmv2-guide-demo"><div class="cmv2-guide-layers"><div>🔒 <b>Capital Mastery Standard</b><small>Required, versioned, credential-linked</small></div><strong>+</strong><div>✦ <b>Your Firm Layer</b><small>Terminology, resources, cases, manager notes</small></div></div></div>`;
    if(kind==='progress') return `<div class="cmv2-guide-demo"><div class="cmv2-guide-progress"><span>Baseline</span><i style="width:28%"></i><span>Technical</span><i style="width:48%"></i><span>Role Lab</span><i style="width:72%"></i><span>Final evidence</span><i style="width:94%"></i></div><small>Evidence coverage rises as the learner produces professional work—not simply by clicking through pages.</small></div>`;
    if(kind==='coach') return `<div class="cmv2-guide-demo"><div class="cmv2-guide-attn"><article><b>1 · Overdue</b><span>Follow up on completion plan</span></article><article><b>2 · Repeated revisions</b><span>Coach the recurring work-product weakness</span></article><article><b>3 · Readiness gap</b><span>Target lowest measured competencies</span></article></div></div>`;
    return `<div class="cmv2-guide-demo"><div class="cmv2-guide-controls"><span>Owner</span><span>Training Admin</span><span>Content Manager</span><span>Manager</span><span>Viewer</span><b>Every material change → D1 audit event</b></div></div>`;
  }

  async function employerGuidePage(orgId) {
    if(!authReady()) return loading('Opening employer guide…'); if(!signedIn()) return authGate('employer');
    loading('Building your guided launch path…');
    try {
      await loadCatalog();
      const [orgData,cohortData,assignmentData]=await Promise.all([api(`/enterprise/organizations/${encodeURIComponent(orgId)}`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`)]);
      const cohorts=cohortData.cohorts||[], assignments=(assignmentData.assignments||[]).filter(x=>x.status!=='archived'); let report=null;
      if(assignments[0]) { try { const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(assignments[0].id)}`); report=r.assignments?.[0]||null; } catch {} }
      const ack=guideAcknowledged(orgId); const steps=employerGuideSteps(orgId,orgData.organization,cohorts,assignments,report,orgData.membership?.role); const understood=steps.filter(x=>ack.has(x.id)).length;
      setMain(`<section class="cmv2-page cmv2-guide-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-guide-hero"><div><div class="eyebrow">INTERACTIVE EMPLOYER GUIDE</div><h1>Launch Capital Mastery without needing a training call.</h1><p>This guide teaches the product in the order a real training lead or manager will use it. Each step explains the decision, shows the interface logic, then links directly into the real workspace.</p></div><div class="cmv2-guide-meter"><strong>${understood}/${steps.length}</strong><span>guide steps understood</span><i><b style="width:${Math.round(understood/steps.length*100)}%"></b></i></div></div><div class="cmv2-guide-layout"><nav class="card cmv2-guide-nav">${steps.map((x,i)=>`<button type="button" data-guide-tab="${esc(x.id)}" class="${i===0?'active':''}"><span>${ack.has(x.id)?'✓':String(i+1).padStart(2,'0')}</span><div><b>${esc(x.title)}</b><small>${x.done?'Workspace signal detected':'Learn this step'}</small></div></button>`).join('')}</nav><div class="cmv2-guide-panels">${steps.map((x,i)=>`<article class="card cmv2-guide-panel ${i===0?'active':''}" data-guide-panel="${esc(x.id)}"><div class="cmv2-guide-panel-head"><div><div class="eyebrow">STEP ${i+1} OF ${steps.length}</div><h2>${esc(x.title)}</h2><p>${esc(x.copy)}</p></div><span class="cmv2-status ${x.done?'completed':'draft'}">${x.done?'Detected in workspace':'Guide step'}</span></div>${employerGuideVisual(x.visual)}<div class="cmv2-guide-why"><b>What good looks like</b><p>${esc(({workspace:'You can explain the difference between completion, readiness, evidence coverage and manager attention.',assign:'A published cohort has the correct role, track, learners and deadline before anyone starts.',curriculum:'You have reviewed the standardized learner journey and only added firm material that genuinely helps Day-1 readiness.',people:'You can identify exactly where each learner is in the workflow and what evidence supports the status.',coach:'You know which people need manager time and what specific coaching action is most useful.',govern:'The right people have the right access, and you know where to inspect the organization audit trail.'})[x.id])}</p></div><div class="cmv2-guide-actions"><a class="btn btn-primary" href="${x.href}">Open this in the real workspace →</a><button class="btn btn-outline" type="button" data-guide-understood="${esc(x.id)}">${ack.has(x.id)?'Understood ✓':'Mark this step understood'}</button></div></article>`).join('')}</div></div><section class="card cmv2-guide-finish"><div><div class="eyebrow">BEFORE A REAL FIRM ROLLOUT</div><h2>Use the guide as a launch checklist.</h2><p>Review the curriculum, test an assignment, inspect reports, verify permissions and run the Demo/Test Lab before inviting a real cohort.</p></div><a class="btn btn-gold" href="#/employer/${encodeURIComponent(orgId)}">Return to Command Center →</a></section></div></section>`);
      document.querySelectorAll('[data-guide-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-guide-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-guide-panel]').forEach(x=>x.classList.toggle('active',x.dataset.guidePanel===b.dataset.guideTab));}));
      document.querySelectorAll('[data-guide-understood]').forEach(b=>b.addEventListener('click',()=>{const set=guideAcknowledged(orgId);set.add(b.dataset.guideUnderstood);saveGuideAcknowledged(orgId,set);employerGuidePage(orgId);}));
    } catch(e){ errorPage('Employer guide unavailable.',e.message,`#/employer/${orgId}`); }
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
      const summary=dash.summary || {}; const cs=cohorts.cohorts||[]; const as=(assignments.assignments||[]).filter(x=>x.status!=='archived'); const caps=orgCapabilities(org.membership?.role);
      let report=null;
      if(caps.viewReports && as[0]) { try { const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(as[0].id)}`); report=r.assignments?.[0]||null; } catch {} }
      const learners=report?.learners||[]; const attention=learners.map(x=>({learner:x,signal:learnerAttention(x)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority).slice(0,6);
      const readyCount=learners.filter(x=>x.complete || x.readiness?.status==='ready').length;
      const startedCount=learners.filter(x=>x.diagnostic||x.roleLab||x.final).length;
      const avgEvidence=learners.length?Math.round(learners.reduce((n,x)=>n+Number(x.readiness?.evidenceCoverage||0),0)/learners.length):null;
      const launchSteps=employerGuideSteps(orgId,org.organization,cs,as,report,org.membership?.role); const launchDone=launchSteps.filter(x=>x.done).length; const kpiHtml=caps.viewReports?`<div class="cmv2-kpis cmv2-kpis-6"><div class="card"><strong>${Number(summary.learners||0)}</strong><span>Active learners</span></div><div class="card"><strong>${startedCount||0}</strong><span>Started</span></div><div class="card"><strong>${readyCount||0}</strong><span>Ready / complete</span></div><div class="card"><strong>${summary.averageReadiness == null ? '—' : esc(summary.averageReadiness)}</strong><span>Avg. readiness</span></div><div class="card"><strong>${avgEvidence==null?'—':avgEvidence+'%'}</strong><span>Avg. evidence coverage</span></div><div class="card"><strong>${attention.length}</strong><span>Need attention</span></div></div>`:`<div class="cmv2-kpis cmv2-kpis-4"><div class="card"><strong>${Number(summary.cohorts||0)}</strong><span>Active cohorts</span></div><div class="card"><strong>${Number(summary.assignments||0)}</strong><span>Assigned programs</span></div><div class="card"><strong>2.0</strong><span>Protected standard</span></div><div class="card"><strong>Scoped</strong><span>Learner data access</span></div></div>`;
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer">← Employer workspaces</a><div class="cmv2-page-head cmv2-org-head"><div><div class="eyebrow">EMPLOYER COMMAND CENTER</div><h1>${esc(org.organization.name)}</h1><p>${esc(org.membership.role.replace(/_/g,' '))} access · Capital Mastery Enterprise</p></div><div class="cmv2-head-actions"><a class="btn btn-gold" href="#/employer/${encodeURIComponent(orgId)}/guide">Interactive Launch Guide</a><a class="btn btn-outline" href="#/notifications">Notifications</a>${caps.manageAssignments?`<a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a>`:''}<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/curriculum">Curriculum & Firm Layer</a>${caps.viewReports?`<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/reports">Readiness Reports</a>`:''}${caps.managePeople?`<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/team">Team & Roles</a>`:''}${caps.viewAudit?`<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/audit">Audit Log</a>`:''}</div></div><section class="card cmv2-role-capability-strip"><div><span>YOUR WORKSPACE ROLE</span><b>${esc(org.membership.role.replace(/_/g,' '))}</b></div><div class="cmv2-role-capabilities"><span class="${caps.manageAssignments?'yes':'no'}">${caps.manageAssignments?'✓':'—'} Assign programs</span><span class="${caps.manageContent?'yes':'no'}">${caps.manageContent?'✓':'—'} Manage Firm Layer</span><span class="${caps.viewReports?'yes':'no'}">${caps.viewReports?'✓':'—'} View learner reports</span><span class="${caps.reviewLearners?'yes':'no'}">${caps.reviewLearners?'✓':'—'} Review learners</span><span class="${caps.managePeople?'yes':'no'}">${caps.managePeople?'✓':'—'} Manage access</span></div></section><section class="card cmv2-launch-strip"><div><div class="eyebrow">LAUNCH READINESS</div><h2>${launchDone}/${launchSteps.length} workspace signals ready</h2><p>Use the interactive guide before a real firm rollout. It explains what each employer view means and links directly into the live workflow.</p></div><div class="cmv2-launch-progress"><i><b style="width:${Math.round(launchDone/launchSteps.length*100)}%"></b></i><a href="#/employer/${encodeURIComponent(orgId)}/guide">Continue guided setup →</a></div></section>${kpiHtml}<div class="cmv2-two-col"><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">COHORTS</div><h2>Training groups</h2></div>${caps.manageAssignments?`<a href="#/employer/${encodeURIComponent(orgId)}/quick-assign">+ New</a>`:'<span class="cmv2-lock-pill">VIEW ONLY</span>'}</div>${cs.length?`<div class="cmv2-list">${cs.map(c=>`<div class="cmv2-list-row"><div><b>${esc(c.name)}</b><span>${esc(pathTitle(c.pathway_id))} · ${esc(c.program_level)}</span></div><div><span class="cmv2-status ${esc(c.status)}">${esc(c.status)}</span><small>${fmtDate(c.deadline_at)}</small></div></div>`).join('')}</div>`:`<div class="cmv2-empty-inline">No cohorts yet. ${caps.manageAssignments?'Quick Assign creates the cohort and program together.':'An Owner or Training Admin can create and publish the first cohort.'}</div>`}</section><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">ASSIGNMENTS</div><h2>Active programs</h2></div></div>${as.length?`<div class="cmv2-list">${as.map(a=>`<a class="cmv2-list-row" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(a.id)}"><div><b>${esc(pathTitle(a.pathway_id))}</b><span>${esc(targetTitle(a.credential_target))}</span></div><div><span class="cmv2-status ${esc(a.status)}">${esc(a.status)}</span><small>${fmtDate(a.due_at)}</small></div></a>`).join('')}</div>`:`<div class="cmv2-empty-inline">No programs assigned yet.</div>`}</section></div>${caps.viewReports?`<section class="card cmv2-attention-card"><div class="cmv2-card-head"><div><div class="eyebrow">MANAGER ATTENTION QUEUE</div><h2>Spend manager time where it changes the outcome.</h2><p>Prioritized from deadline, revision and evidence signals—not arbitrary engagement scores.</p></div><a href="#/employer/${encodeURIComponent(orgId)}/reports${as[0]?`?assignment=${encodeURIComponent(as[0].id)}`:''}">Full cohort report →</a></div>${attention.length?`<div class="cmv2-attention-list">${attention.map(({learner:x,signal:g},i)=>`<article><span class="cmv2-attention-rank">${i+1}</span><div><b>${esc(x.name||x.email||'Learner')}</b><small>${esc(learnerProgressStage(x).label)}</small><p>${esc(g.reason)}</p></div><div><strong>${esc(g.label)}</strong><span>${esc(g.action)}</span></div></article>`).join('')}</div>`:`<div class="cmv2-empty-inline"><b>No urgent coaching signals right now.</b><p>${learners.length?'The current cohort has no overdue/revision/readiness alerts from the available evidence.':'Signals appear once learners begin producing evidence.'}</p></div>`}</section>`:`<section class="card cmv2-privacy-boundary"><div class="eyebrow">LEAST-PRIVILEGE DATA BOUNDARY</div><h2>Learner performance is intentionally restricted.</h2><p>Your Content Manager role can manage the Firm Layer and inspect assigned curriculum without access to employee readiness, evidence exports, manager reviews or coaching signals.</p><a class="btn btn-outline" href="#/trust">Review security model →</a></section>`}</div></section>`);
    } catch(e) { errorPage('Could not load employer command center.',e.message,'#/employer'); }
  }


  async function quickAssign(orgId) {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('employer');
    loading('Preparing Quick Assign…');
    try {
      const orgData=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}`); const caps=orgCapabilities(orgData.membership?.role);
      if(!caps.manageAssignments) return setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="card cmv2-permission-denied"><div class="eyebrow">ROLE-BASED ACCESS</div><h1>Assignment management is not part of ${esc(caps.role.replace(/_/g,' '))} access.</h1><p>Your server-verified role can inspect the curriculum and readiness reporting available to this workspace. Cohort creation and assignment publishing are limited to Owners and Training Admins.</p><div class="cmv2-success-actions"><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/curriculum">Review Curriculum →</a><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/reports">Readiness Reports</a></div></div></div></section>`);
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
      const [aData,orgData]=await Promise.all([api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}`)]); const assignments=aData.assignments||[];
      const chosen=assignments.find(a=>a.id===selectedAssignment) || assignments[0] || null;
      const content=chosen ? (await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content?assignmentId=${encodeURIComponent(chosen.id)}`)).content || [] : [];
      const stages=chosen?STANDARD_STAGES[chosen.track]||STANDARD_STAGES.professional:[];
      const membershipRole=orgData.membership?.role||'viewer',canManageContent=orgCapabilities(membershipRole).manageContent;
      const previewApi=window.CM_PROFESSIONAL_PREVIEW,reviewMeta=chosen&&previewApi?.meta?previewApi.meta(chosen.pathway_id):null;
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">CURRICULUM & FIRM LAYER</div><h1>Preview everything. Customize safely.</h1><p>Capital Mastery Standard content is protected. Your firm can add material, hide optional items and archive or restore its own content.</p></div></div>${assignments.length?`<div class="card cmv2-program-picker"><label>Program<select id="cmv2-assignment-picker">${assignments.map(a=>`<option value="${esc(a.id)}" ${a.id===chosen?.id?'selected':''}>${esc(pathTitle(a.pathway_id))} · ${esc(targetTitle(a.credential_target))} · ${esc(a.status)}</option>`).join('')}</select></label></div><div class="cmv2-curriculum-grid"><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">CAPITAL MASTERY STANDARD</div><h2>Protected core</h2></div><span class="cmv2-lock-pill">🔒 STANDARD</span></div><div class="cmv2-stage-list">${stages.map(s=>`<div class="cmv2-stage" data-stage="${esc(s.id)}"><div class="cmv2-stage-icon">${s.required?'🔒':'◌'}</div><div><b>${esc(s.title)}</b><p>${esc(s.copy)}</p>${s.required?'<small>Required for the standardized credential.</small>':canManageContent?`<button class="cmv2-text-button" data-standard-toggle="${esc(s.id)}" data-assignment="${esc(chosen.id)}">Hide optional module</button>`:'<small>Optional module · visibility managed by authorized curriculum roles.</small>'}</div></div>`).join('')}</div></section><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">YOUR FIRM LAYER</div><h2>Company-specific material</h2></div>${canManageContent?'<button class="btn btn-soft btn-sm" data-cmv2-add-content>+ Add content</button>':'<span class="cmv2-lock-pill">READ ONLY</span>'}</div>${content.length?`<div class="cmv2-firm-list">${content.map((x,i)=>`<article class="cmv2-firm-item ${esc(x.visibility)}" data-content-row="${esc(x.id)}"><div><span>${esc(x.contentType.replace(/_/g,' '))}</span><h3>${esc(x.title)}</h3><small>Version ${Number(x.currentVersion||1)} · ${esc(x.visibility)} · position ${i+1}</small></div><div class="cmv2-item-actions"><button type="button" data-content-history="${esc(x.id)}">History</button>${canManageContent?`<button type="button" data-content-move="up" data-content-id="${esc(x.id)}" ${i===0?'disabled':''}>↑</button><button type="button" data-content-move="down" data-content-id="${esc(x.id)}" ${i===content.length-1?'disabled':''}>↓</button><button type="button" data-content-edit="${esc(x.id)}">Edit</button>${x.visibility!=='visible'?`<button data-content-vis="visible" data-content-id="${esc(x.id)}">Restore</button>`:''}${x.visibility==='visible'?`<button data-content-vis="hidden" data-content-id="${esc(x.id)}">Hide</button><button data-content-vis="archived" data-content-id="${esc(x.id)}">Archive</button>`:''}`:''}</div></article>`).join('')}</div>`:`<div class="cmv2-empty-inline">No firm-specific content yet. Add an introduction, internal expectations, resource, case or manager note.</div>`}<div class="cmv2-no-delete"><b>No permanent delete.</b> Firm content is versioned and can only be hidden, archived or restored.</div></section></div>${reviewMeta?`<section class="card cmv2-curriculum-review-room"><div class="cmv2-card-head"><div><div class="eyebrow">INTERACTIVE CURRICULUM REVIEW ROOM</div><h2>Inspect the learner experience before rollout.</h2><p>Review the actual professional toolkit, independent work format and Role Lab sequence without changing learner progress, evidence or credentials.</p></div><span class="cmv2-lock-pill">${esc(membershipRole.replace(/_/g,' '))} REVIEW</span></div><div class="cmv2-review-room-controls"><div class="cmv2-review-tabs"><button class="active" type="button" data-review-mode="toolkit">Professional Toolkit</button><button type="button" data-review-mode="applied">Applied Work</button><button type="button" data-review-mode="rolelab">Role Lab Sequence</button></div><div class="cmv2-review-pickers"><label>Career<select id="cmv2-review-career">${catalog.pathways.map(p=>`<option value="${esc(p.id)}" ${p.id===chosen.pathway_id?'selected':''}>${esc(p.title)}</option>`).join('')}</select></label><label>Module<select id="cmv2-review-module"></select></label></div></div><div id="cmv2-review-room-panel" class="cmv2-review-room-panel"></div><div class="cmv2-review-room-foot"><span>✓ No learner state changes</span><span>✓ No answer keys exposed</span><span>✓ Same role-specific work surfaces used in training</span><span>✓ Firm Layer remains separate from the Standard</span></div></section>`:''}`:`<div class="card cmv2-empty"><h2>Create an assignment first.</h2><p>Quick Assign creates a cohort and standardized program in one flow.</p><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a></div>`}</div></section>`);
      document.getElementById('cmv2-assignment-picker')?.addEventListener('change',e=>{location.hash=`#/employer/${orgId}/curriculum?assignment=${encodeURIComponent(e.target.value)}`;});
      if(reviewMeta&&previewApi){const panel=document.getElementById('cmv2-review-room-panel'),picker=document.getElementById('cmv2-review-module'),careerPicker=document.getElementById('cmv2-review-career');let reviewMode='toolkit',reviewPathwayId=chosen.pathway_id,currentMeta=previewApi.meta(reviewPathwayId)||reviewMeta;const optionsFor=()=>reviewMode==='toolkit'?currentMeta.toolkit:reviewMode==='applied'?currentMeta.applied:[currentMeta.simulationTitle];const drawReview=()=>{const opts=optionsFor();picker.innerHTML=opts.map((x,i)=>`<option value="${i}">${esc(x)}</option>`).join('')||'<option value="0">Overview</option>';panel.innerHTML=previewApi.render(reviewPathwayId,reviewMode,Number(picker.value||0));previewApi.bind?.();};const redraw=()=>{panel.innerHTML=previewApi.render(reviewPathwayId,reviewMode,Number(picker.value||0));previewApi.bind?.();};document.querySelectorAll('[data-review-mode]').forEach(b=>b.addEventListener('click',()=>{reviewMode=b.dataset.reviewMode;document.querySelectorAll('[data-review-mode]').forEach(x=>x.classList.toggle('active',x===b));drawReview();}));careerPicker?.addEventListener('change',()=>{reviewPathwayId=careerPicker.value;currentMeta=previewApi.meta(reviewPathwayId)||reviewMeta;drawReview();});picker?.addEventListener('change',redraw);drawReview();}
      document.querySelector('[data-cmv2-add-content]')?.addEventListener('click',()=>{location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum/add?assignment=${encodeURIComponent(chosen.id)}`;});
      document.querySelectorAll('[data-content-edit]').forEach(b=>b.addEventListener('click',()=>{location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum/content/${encodeURIComponent(b.dataset.contentEdit)}/edit?assignment=${encodeURIComponent(chosen.id)}`;}));
      document.querySelectorAll('[data-content-history]').forEach(b=>b.addEventListener('click',()=>{location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum/content/${encodeURIComponent(b.dataset.contentHistory)}/history?assignment=${encodeURIComponent(chosen.id)}`;}));
      document.querySelectorAll('[data-content-move]').forEach(b=>b.addEventListener('click',async()=>{const idx=content.findIndex(x=>x.id===b.dataset.contentId),delta=b.dataset.contentMove==='up'?-1:1,target=idx+delta;if(idx<0||target<0||target>=content.length)return;const order=content.map(x=>x.id);[order[idx],order[target]]=[order[target],order[idx]];b.disabled=true;try{await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content/reorder`,{method:'POST',body:JSON.stringify({assignmentId:chosen.id,order})});await curriculum(orgId,chosen.id);}catch(err){alert(err.message);b.disabled=false;}}));
      document.querySelectorAll('[data-content-vis]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api(`/enterprise/organizations/${orgId}/firm-content/${b.dataset.contentId}`,{method:'PATCH',body:JSON.stringify({visibility:b.dataset.contentVis})});await curriculum(orgId,chosen.id);}catch(e){alert(e.message);b.disabled=false;}}));
      document.querySelectorAll('[data-standard-toggle]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await api(`/enterprise/organizations/${orgId}/assignments/${chosen.id}/standard-visibility`,{method:'PATCH',body:JSON.stringify({standardContentId:b.dataset.standardToggle,visibility:'hidden'})});b.textContent='Hidden for this cohort ✓';}catch(e){alert(e.message);b.disabled=false;}}));
    } catch(e) { errorPage('Could not load curriculum.',e.message,`#/employer/${orgId}`); }
  }

  async function firmLayerRouteContext(orgId, assignmentId, { manage=false, contentId='' }={}) {
    if (!authReady()) { loading('Checking your account…'); return null; }
    if (!signedIn()) { authGate('employer'); return null; }
    if (!assignmentId) throw new Error('Choose a program before opening Firm Layer content.');
    await loadCatalog();
    const [aData,orgData]=await Promise.all([
      api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`),
      api(`/enterprise/organizations/${encodeURIComponent(orgId)}`)
    ]);
    const assignment=(aData.assignments||[]).find(a=>a.id===assignmentId);
    if(!assignment) throw new Error('Program not found in this workspace.');
    const caps=orgCapabilities(orgData.membership?.role);
    if(manage && !caps.manageContent) throw new Error('Firm Layer editing is not part of your workspace role.');
    let item=null;
    if(contentId){
      const d=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content?assignmentId=${encodeURIComponent(assignment.id)}`);
      item=(d.content||[]).find(x=>x.id===contentId)||null;
      if(!item) throw new Error('Firm Layer item not found in this program.');
    }
    return {assignment,caps,item};
  }

  async function firmLayerAddPage(orgId, assignmentId) {
    loading('Opening Firm Layer editor…');
    try { const ctx=await firmLayerRouteContext(orgId,assignmentId,{manage:true}); if(ctx) renderAddContent(orgId,ctx.assignment); }
    catch(e){ errorPage('Firm Layer editor unavailable.',e.message,`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignmentId||'')}`); }
  }

  async function firmLayerEditPage(orgId, assignmentId, contentId) {
    loading('Opening Firm Layer version editor…');
    try { const ctx=await firmLayerRouteContext(orgId,assignmentId,{manage:true,contentId}); if(ctx) renderEditContent(orgId,ctx.assignment,ctx.item); }
    catch(e){ errorPage('Firm Layer editor unavailable.',e.message,`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignmentId||'')}`); }
  }

  async function firmLayerHistoryPage(orgId, assignmentId, contentId) {
    loading('Loading Firm Layer version history…');
    try {
      const ctx=await firmLayerRouteContext(orgId,assignmentId,{contentId}); if(!ctx) return;
      const h=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content/${encodeURIComponent(contentId)}/versions`);
      renderContentHistory(orgId,ctx.assignment,h);
    } catch(e){ errorPage('Firm Layer history unavailable.',e.message,`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignmentId||'')}`); }
  }

  function renderAddContent(orgId, assignment) {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">← Curriculum</a><div class="card cmv2-form-card"><div class="eyebrow">FIRM LAYER</div><h1>Add company-specific content.</h1><p>This creates a versioned Firm Layer item. It never modifies the Capital Mastery Standard.</p><form id="cmv2-add-content"><label>Content type<select name="contentType"><option value="intro">Firm introduction</option><option value="lesson">Lesson</option><option value="resource">Resource</option><option value="exercise">Exercise</option><option value="case">Custom case</option><option value="manager_note">Manager note</option></select></label><label>Title<input name="title" maxlength="160" required placeholder="Our modeling standards"></label><label>Content<textarea name="text" rows="9" required placeholder="Explain your firm's terminology, expectations, workflow or custom exercise…"></textarea></label><div class="cmv2-form-status"></div><button class="btn btn-primary btn-block" type="submit">Add to Firm Layer →</button></form></div></div></section>`);
    document.getElementById('cmv2-add-content')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);const status=form.querySelector('.cmv2-form-status');const btn=form.querySelector('button');btn.disabled=true;try{status.textContent='Saving versioned content…';await api(`/enterprise/organizations/${orgId}/firm-content`,{method:'POST',body:JSON.stringify({assignmentId:assignment.id,pathwayId:assignment.pathway_id,contentType:String(fd.get('contentType')),title:String(fd.get('title')),body:{text:String(fd.get('text'))},positionKey:`firm-${Date.now()}`})});status.textContent='Saved. Returning to Curriculum…';location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}`;}catch(err){status.textContent=err.message;btn.disabled=false;}});
  }

  function renderEditContent(orgId,assignment,item) {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">← Curriculum</a><div class="card cmv2-form-card"><div class="eyebrow">FIRM LAYER · VERSION ${Number(item.currentVersion||1)}</div><h1>Edit ${esc(item.title)}</h1><p>Saving creates a new immutable version. Previous versions remain in history.</p><form id="cmv2-edit-content"><label>Title<input name="title" maxlength="160" required value="${esc(item.title)}"></label><label>Content<textarea name="text" rows="10" required>${esc(item.body?.text||'')}</textarea></label><div class="cmv2-form-status"></div><button class="btn btn-primary btn-block" type="submit">Save New Version →</button></form></div></div></section>`);
    document.getElementById('cmv2-edit-content')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),st=f.querySelector('.cmv2-form-status'),b=f.querySelector('button');b.disabled=true;try{st.textContent='Saving a new version…';await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/firm-content/${encodeURIComponent(item.id)}`,{method:'PATCH',body:JSON.stringify({title:String(fd.get('title')||''),body:{text:String(fd.get('text')||'')}})});st.textContent='Version saved. Returning to Curriculum…';location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}`;}catch(err){st.textContent=err.message;b.disabled=false;}});
  }
  function renderContentHistory(orgId,assignment,data) {
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">← Curriculum</a><div class="cmv2-page-head"><div><div class="eyebrow">FIRM LAYER VERSION HISTORY</div><h1>${esc(data.content?.title||'Firm content')}</h1><p>Every content edit, visibility change and reorder creates a preserved version.</p></div></div><div class="cmv2-version-list">${(data.versions||[]).map(v=>`<article class="card"><div><span>VERSION ${Number(v.version)}</span><b>${fmtDate(v.createdAt)}</b></div><h3>${esc(v.snapshot?.title||'Untitled')}</h3><p>${esc(v.snapshot?.body?.text||'')}</p><div class="cmv2-version-meta"><span>${esc(v.snapshot?.visibility||'visible')}</span><span>${esc(v.snapshot?.positionKey||'')}</span><span>Actor: ${esc(v.createdByUid||'system')}</span></div></article>`).join('')||'<div class="card">No versions found.</div>'}</div></div></section>`);
  }

  function academyRequirementText(a) {
    if(a.pathwayId==='finance-core') return 'Foundations in 4+ careers across 3+ finance domains.';
    if(a.pathwayId==='finance-professional') return 'Finance Core + Professional Readiness in 4+ careers across 3+ domains.';
    if(Array.isArray(a.required)) return `Professional Readiness required in: ${a.required.map(pathTitle).join(' + ')}.`;
    if(Array.isArray(a.pool)) return `${Number(a.minimum||2)} Professional Readiness credentials from: ${a.pool.map(pathTitle).join(', ')}.`;
    return 'Evidence-backed cross-career requirement.';
  }
  async function academyPage() {
    loading('Loading Capital Mastery Academies…');
    try {
      await loadCatalog(); const cat=await api('/enterprise/academy/catalog',{},false); let mine=null;
      if(authReady()&&signedIn()) { try{mine=await api('/enterprise/academy/me');}catch{} }
      const byId=new Map((mine?.statuses||[]).map(x=>[x.definition.id,x]));
      const awards=cat.awards||[];
      setMain(`<section class="cmv2-page cmv2-academy-page"><div class="container"><div class="cmv2-page-head"><div><div class="eyebrow">CAPITAL MASTERY ACADEMIES</div><h1>Prove breadth after you prove the individual jobs.</h1><p>Academy credentials do not replace career credentials. They roll up multiple verified Foundations or Professional Readiness records so the evidence trail stays visible.</p></div><div class="cmv2-head-actions">${signedIn()?'<button class="btn btn-primary" id="cmv2-refresh-academy">Refresh Eligibility</button>':'<a class="btn btn-primary" href="#/login">Sign in to see eligibility →</a>'}<a class="btn btn-outline" href="#/credentials">My Credentials</a></div></div><section class="card cmv2-academy-core"><div><div class="eyebrow">CROSS-FUNCTIONAL FOUNDATION</div><h2>Finance Core</h2><p>Build enough breadth to understand how major finance functions connect before claiming cross-functional mastery.</p></div><div class="cmv2-academy-rule"><b>4+</b><span>Foundations credentials</span><b>3+</b><span>finance domains</span></div></section><div class="cmv2-academy-grid">${awards.map(a=>{const st=byId.get(a.id),earned=!!st?.credential;return `<article class="card cmv2-academy-card ${earned?'earned':''}"><div class="cmv2-academy-icon">${earned?'✓':'◇'}</div><div><span>${a.level==='finance_professional'?'HIGHEST ACHIEVEMENT':a.level==='finance_core'?'FINANCE CORE':'ROLE-FAMILY ACADEMY'}</span><h3>${esc(a.title)}</h3><p>${esc(academyRequirementText(a))}</p>${st?`<div class="cmv2-academy-progress"><b>${esc(st.summary||'')}</b>${st.missing?`<small>${esc(st.missing)}</small>`:'<small>Requirement satisfied.</small>'}</div>`:'<div class="cmv2-academy-progress"><small>Sign in to compare your authoritative credentials with this requirement.</small></div>'}${earned?`<div class="cmv2-status completed">Issued · ${esc(st.credential.issuedAt?fmtDate(st.credential.issuedAt):'Verified')}</div>`:st?.eligible?'<div class="cmv2-status draft">Eligible — refresh to issue</div>':''}</div></article>`}).join('')}</div><section class="card cmv2-academy-proof"><div><div class="eyebrow">NO MYSTERY BADGES</div><h2>Every roll-up points back to the work.</h2><p>Public verification for Academy credentials includes the supporting Capital Mastery career credentials. Academy status never upgrades a weak career score or bypasses a Role Lab.</p></div><a class="btn btn-outline" href="#/trust">Trust Center →</a></section></div></section>`);
      document.getElementById('cmv2-refresh-academy')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Checking evidence…';try{await api('/enterprise/academy/refresh',{method:'POST',body:'{}'});await academyPage();}catch(err){alert(err.message);b.disabled=false;b.textContent='Refresh Eligibility';}});
    } catch(e){ errorPage('Academies unavailable.',e.message,'#/careers'); }
  }

  async function assignedHome() {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('learner');
    loading('Loading assigned training…');
    try {
      await loadCatalog(); const d=await api('/enterprise/learner/assignments'); const list=d.assignments||[];
      setMain(`<section class="cmv2-page"><div class="container"><div class="cmv2-page-head"><div><div class="eyebrow">ASSIGNED TO ME</div><h1>Your company training.</h1><p>Company-assigned programs stay separate from the finance pathways you choose to learn independently.</p></div><div class="cmv2-head-actions"><a class="btn btn-outline" href="#/careers">Explore Public Learning</a><a class="btn btn-outline" href="#/notifications">Notifications</a><a class="btn btn-outline" href="#/my-data">My Data</a></div></div>${list.length?`<div class="grid grid-3">${list.map(a=>`<a class="card cmv2-assigned-card" href="#/assigned/${encodeURIComponent(a.assignment_id)}"><span class="cmv2-company">${esc(a.org_name)}</span><h3>${esc(pathTitle(a.pathway_id))}</h3><p>${esc(a.cohort_name)}</p><div class="cmv2-assigned-meta"><span>${esc(targetTitle(a.credential_target))}</span><b>${fmtDate(a.due_at)}</b></div><div class="cmv2-arrow">Open assigned program →</div></a>`).join('')}</div>`:`<div class="card cmv2-empty"><div class="cmv2-empty-icon">✓</div><h2>No company assignments yet.</h2><p>You can still use every public Capital Mastery career pathway independently.</p><a class="btn btn-primary" href="#/careers">Explore Careers →</a></div>`}</div></section>`);
    } catch(e) { errorPage('Could not load assigned training.',e.message,'#/'); }
  }


  function assignedStageState(stage, report={}) {
    const creds=Array.isArray(report.credentials)?report.credentials:[];
    const activeLevel=level=>creds.find(c=>c.level===level && c.status==='active');
    const foundations=activeLevel('foundations');
    const essentials=activeLevel('essentials');
    const applied=activeLevel('applied');
    const roleCredential=activeLevel('role_lab');
    const readinessCredential=activeLevel('professional_readiness');
    const diagnostic=report.diagnostic||null;
    const lab=report.roleLab||null;
    const final=report.finalAssessment||null;
    if(stage.id==='foundations-core') return foundations?{label:'Complete · Foundations earned',tone:'complete'}:{label:'Start here',tone:'ready'};
    if(stage.id==='foundations-assessment') return foundations?{label:'Complete',tone:'complete'}:{label:'Required',tone:'required'};
    if(stage.id==='diagnostic') return diagnostic?{label:`Complete · ${Number(diagnostic.score)}% baseline`,tone:'complete'}:{label:foundations?'Ready to take':'Required after Foundations',tone:foundations?'ready':'required'};
    if(stage.id==='essentials-mini-case'||stage.id==='essentials-assessment') return essentials?{label:'Complete · Essentials earned',tone:'complete'}:{label:diagnostic?'Ready to take':'Locked · baseline first',tone:diagnostic?'ready':'locked'};
    if(stage.id==='applied-skills') return applied?{label:'Complete · Applied Skills earned',tone:'complete'}:{label:essentials?'Ready to complete':'Locked · Essentials first',tone:essentials?'ready':'locked'};
    if(stage.id==='role-lab') {
      if(roleCredential||lab?.status==='completed') return {label:`Complete${lab?.score!=null?` · ${Number(lab.score)}%`:''}`,tone:'complete'};
      if(lab) return {label:`${String(lab.status||'in progress').replace(/_/g,' ')}${lab.score!=null?` · ${Number(lab.score)}%`:''}`,tone:'active'};
      return applied&&essentials?{label:'Ready · Open workbench',tone:'ready'}:{label:'Locked · prerequisites',tone:'locked'};
    }
    if(stage.id==='final-assessment') {
      if(final) return {label:`${final.passed?'Passed':'Needs revision'} · ${Number(final.score)}%`,tone:final.passed?'complete':'active'};
      const labDone=roleCredential||lab?.status==='completed'||Number(lab?.score||0)>=80;
      return labDone?{label:'Ready to take',tone:'ready'}:{label:'Locked · Role Lab first',tone:'locked'};
    }
    if(stage.id==='optional-interview-prep') return {label:'Optional',tone:'optional'};
    if(readinessCredential) return {label:'Complete',tone:'complete'};
    return {label:stage.required?'Required':'Optional',tone:stage.required?'required':'optional'};
  }

  function assignedProgressSummary(report={}) {
    const creds=Array.isArray(report.credentials)?report.credentials:[];
    const levels=new Set(creds.filter(c=>c.status==='active').map(c=>c.level));
    const complete=[levels.has('foundations'),!!report.diagnostic,levels.has('essentials'),levels.has('applied'),levels.has('role_lab')||report.roleLab?.status==='completed',!!report.finalAssessment?.passed].filter(Boolean).length;
    const total=6;
    return {complete,total,pct:Math.round((complete/total)*100),ready:levels.has('professional_readiness')||report.readiness?.status==='ready'};
  }

  async function assignedDetail(id) {
    if (!authReady()) return loading('Checking your account…');
    if (!signedIn()) return authGate('learner');
    loading('Opening assigned program…');
    try {
      await loadCatalog(); const d=await api(`/enterprise/learner/assignments/${encodeURIComponent(id)}`); const a=d.assignment; const firm=d.firmContent||[]; const stages=STANDARD_STAGES[a.track]||STANDARD_STAGES.professional; const hidden=new Set((d.standardPreferences||[]).filter(x=>x.visibility==='hidden').map(x=>x.standard_content_id));
      let report={}; try { report=await api(`/enterprise/learner/readiness-report/${encodeURIComponent(a.pathwayId)}?assignmentId=${encodeURIComponent(a.id)}`); } catch {}
      const progress=assignedProgressSummary(report);
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/assigned">← Assigned training</a><div class="cmv2-assignment-hero"><div><span class="cmv2-company">${esc(a.organizationName)}</span><div class="eyebrow">${esc(a.cohortName)}</div><h1>${esc(pathTitle(a.pathwayId))}</h1><p>${esc(targetTitle(a.credentialTarget))} · Curriculum ${esc(a.curriculumVersion)}</p><div class="cmv2-assignment-progress"><div><b>${progress.complete}/${progress.total}</b><span>professional gates complete</span></div><div class="cmv2-assignment-progress-bar"><i style="width:${progress.pct}%"></i></div><strong>${progress.ready?'Professional Readiness verified':`${progress.pct}% through the evidence path`}</strong></div></div><div class="cmv2-due"><span>Due</span><b>${fmtDate(a.dueAt)}</b></div></div>${firm.length?`<section class="card cmv2-firm-banner"><div class="eyebrow">YOUR FIRM LAYER</div><h2>Company-specific preparation</h2>${firm.map(x=>`<article><b>${esc(x.title)}</b><p>${esc(x.body?.text||'')}</p></article>`).join('')}</section>`:''}<section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">YOUR READINESS PATH</div><h2>Complete the work. Prove the skills.</h2><p>Stage status below is read from your authoritative assessment, credential and Role Lab evidence—not browser completion state.</p></div><span class="cmv2-lock-pill">CAPITAL MASTERY STANDARD</span></div><div class="cmv2-learner-stages">${stages.filter(s=>!hidden.has(s.id)).map((s,i)=>{const st=assignedStageState(s,report);return `<div class="cmv2-learner-stage ${esc(st.tone)}"><span>${st.tone==='complete'?'✓':String(i+1).padStart(2,'0')}</span><div><b>${esc(s.title)}</b><p>${esc(s.copy)}</p></div><div class="cmv2-stage-state ${esc(st.tone)}">${esc(st.label)}</div></div>`}).join('')}</div><div class="cmv2-program-actions">${a.track==='professional'?`<a class="btn btn-primary" href="#/career/${encodeURIComponent(publicPathId(a.pathwayId))}">1 · Learn Foundations + Technical Core</a><a class="btn btn-outline" href="#/diagnostic/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">2 · Baseline Diagnostic</a><a class="btn btn-outline" href="#/v2-assessment/${encodeURIComponent(assessmentKey(a.pathwayId,'essentials'))}?assignment=${encodeURIComponent(a.id)}">3 · Essentials Mini Case</a><a class="btn btn-primary" href="#/learn/${encodeURIComponent(publicPathId(a.pathwayId))}/3">4 · Professional Toolkit</a><a class="btn btn-primary" href="#/learn/${encodeURIComponent(publicPathId(a.pathwayId))}/4">5 · Applied Work</a><a class="btn btn-gold" href="#/role-lab/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">6 · Open Role Lab · Professional Workbench</a><a class="btn btn-primary" href="#/v2-assessment/${encodeURIComponent(assessmentKey(a.pathwayId,'final'))}?assignment=${encodeURIComponent(a.id)}">7 · Professional Final</a><a class="btn btn-outline" href="#/readiness/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Readiness Report</a><a class="btn btn-outline" href="#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Skill Profile</a>`:`<a class="btn btn-primary" href="#/career/${encodeURIComponent(publicPathId(a.pathwayId))}">1 · Open Foundations Learning</a><a class="btn btn-gold" href="#/v2-assessment/${encodeURIComponent(assessmentKey(a.pathwayId,'essentials'))}?assignment=${encodeURIComponent(a.id)}">2 · Essentials Mini Case</a><a class="btn btn-outline" href="#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}">Skill Profile</a>`}</div></section></div></section>`);
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
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(pathwayId))}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">BASELINE DIAGNOSTIC · 0% CREDENTIAL WEIGHT</div><h1>${esc(d.pathway.title)} Diagnostic</h1><p>This measures your starting point. It does not count against your credential and is used to personalize readiness evidence.</p></div></div><form id="cmv2-diagnostic" class="cmv2-diagnostic-list">${questions.map((q,i)=>`<fieldset class="card cmv2-question"><legend><span>${String(i+1).padStart(2,'0')}</span>${esc(q.prompt)}</legend><div class="cmv2-options">${q.options.map((o,j)=>`<label><input type="radio" name="${esc(q.id)}" value="${esc(o)}" required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`).join('')}<div class="card cmv2-submit-bar"><div><b>Baseline only.</b><span>Your score will not reduce credential eligibility.</span></div><button class="btn btn-primary" type="submit">Submit Diagnostic →</button></div><div class="cmv2-form-status"></div></form></div></section>`);
      document.getElementById('cmv2-diagnostic')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget; const btn=form.querySelector('button'); const status=form.querySelector('.cmv2-form-status'); btn.disabled=true;
        try { status.textContent='Scoring securely…'; const fd=new FormData(form); const answers={}; questions.forEach(q=>{const raw=fd.get(q.id);answers[q.id]=q.type==='numeric'?Number(raw):String(raw||'');}); const result=await api('/enterprise/diagnostic/submit',{method:'POST',body:JSON.stringify({pathwayId,assignmentId:assignmentId||null,answers})}); renderDiagnosticResult(pathwayId,assignmentId,result); }
        catch(err){ status.textContent=err.message; btn.disabled=false; }
      });
    } catch(e) { errorPage('Diagnostic unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function renderDiagnosticResult(pathwayId, assignmentId, result) {
    const r=result.readiness||{};
    setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-result-card"><div class="cmv2-result-score"><strong>${Number(result.score||0)}</strong><span>Baseline diagnostic</span></div><div><div class="eyebrow">DIAGNOSTIC COMPLETE</div><h1>Your starting point is recorded.</h1><p>You answered ${Number(result.correct||0)} of ${Number(result.total||0)} questions correctly. This score has <b>0% credential weight</b>.</p><div class="cmv2-evidence-note"><b>${esc(readinessLabel(r.status))}</b><span>${Number(r.evidenceCoverage||0)}% professional evidence coverage · ${esc(evidencePhaseLabel(r.evidencePhase))}</span></div><div class="cmv2-success-actions"><a class="btn btn-primary" href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">View Skill Profile →</a><a class="btn btn-outline" href="#/v2-assessment/${encodeURIComponent(assessmentKey(pathwayId,'essentials'))}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Continue to Essentials →</a></div></div></div></div></section>`);
  }

  async function skillsPage(pathwayId, assignmentId='') {
    if (!authReady()) return loading('Loading skill profile…');
    if (!signedIn()) return authGate('learner');
    loading('Building your competency profile…');
    try {
      await loadCatalog();
      const d=await api(`/enterprise/learner/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`);
      const r=d.readiness; const skills=d.competencies||[];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(pathwayId))}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">COMPETENCY PROFILE</div><h1>${esc(d.pathway.title)} Readiness</h1><p>Every score below is tied to stored assessment or Role Lab evidence—not a self-rating.</p></div></div>${r?`<div class="cmv2-readiness-summary"><div class="cmv2-readiness-score">${Number(r.overallScore||0)}</div><div><b>${esc(readinessLabel(r.status))}</b><span>${Number(r.evidenceCoverage||0)}% professional evidence coverage</span><small>${esc(evidencePhaseLabel(r.evidencePhase))}</small></div></div>`:''}<div class="cmv2-skill-grid">${skills.length?skills.map(x=>`<article class="card cmv2-skill-card"><div class="cmv2-skill-head"><div><span>${esc(String(x.category||'').replace(/_/g,' '))}</span><h3>${esc(x.name)}</h3></div><strong>${Number(x.score||0)}</strong></div><div class="cmv2-skill-meter"><i style="width:${Math.max(0,Math.min(100,Number(x.score||0)))}%"></i><b style="left:${Math.max(0,Math.min(100,Number(x.minimum_score||0)))}%"></b></div><div class="cmv2-skill-foot"><span>Evidence: ${Number(x.evidence_count||0)}</span><span>Target: ${Number(x.minimum_score||0)}${Number(x.critical)===1?' · Critical':''}</span></div></article>`).join(''):`<div class="card cmv2-empty"><h2>No evidence yet.</h2><p>Take the diagnostic to establish a baseline.</p><a class="btn btn-primary" href="#/diagnostic/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Take Diagnostic →</a></div>`}</div>${r?`<section class="card cmv2-readiness-explainer"><div><div class="eyebrow">WHY THE STATUS MAY TRAIL THE SCORE</div><h2>Capital Mastery requires evidence coverage, not just a high number.</h2><p>A strong diagnostic can produce a high baseline score, but professional readiness is capped until applied work, the Role Lab and final evidence cover the required competencies.</p>${assignmentId?`<a class="btn btn-outline btn-sm" href="#/readiness/${encodeURIComponent(pathwayId)}?assignment=${encodeURIComponent(assignmentId)}">Open Full Readiness Report →</a>`:''}</div>${r.baselineScore!=null?`<div class="cmv2-improvement"><span>Baseline</span><b>${Number(r.baselineScore)}</b><span>Current skill estimate</span><b>${Number(r.overallScore)}</b><span>Change</span><b>${Number(r.improvement)>=0?'+':''}${Number(r.improvement||0)}</b></div>`:''}</section>`:''}</div></section>`);
    } catch(e){ errorPage('Could not load skill profile.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  async function teamPage(orgId) {
    if(!authReady()) return loading('Loading team access…'); if(!signedIn()) return authGate('employer'); loading('Loading organization roles…');
    try {
      const [members,invites]=await Promise.all([api(`/enterprise/organizations/${encodeURIComponent(orgId)}/members`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`)]); const list=members.members||[]; const pending=(invites.invites||[]).filter(x=>x.status==='pending');
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">TEAM & ROLES</div><h1>Control who can manage the workspace.</h1><p>Owner, Training Admin, Content Manager, Manager, Viewer and Learner permissions are enforced by the Worker—not trusted from the browser.</p></div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">INVITE STAFF</div><h2>Add employer access</h2><form id="cmv2-staff-invite" class="cmv2-simple-form"><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Role<select name="role"><option value="training_admin">Training Admin</option><option value="content_manager">Content Manager</option><option value="manager">Manager / Reviewer</option><option value="viewer">Viewer</option></select></label><button class="btn btn-primary" type="submit">Create Secure Invite →</button><div class="cmv2-form-status" aria-live="polite"></div></form>${pending.length?`<div class="cmv2-pending"><h3>Pending invitations</h3>${pending.map(x=>`<div><span>${esc(x.email_normalized)}</span><b>${esc(x.role.replace(/_/g,' '))}</b></div>`).join('')}</div>`:''}</section><section class="card"><div class="eyebrow">PERMISSION MODEL</div><h2>Least privilege by default</h2><div class="cmv2-evidence-list"><div><span>Owner</span><b>All organization controls</b></div><div><span>Training Admin</span><b>Cohorts, invites, reports</b></div><div><span>Content Manager</span><b>Firm Layer content</b></div><div><span>Manager</span><b>Readiness visibility</b></div><div><span>Viewer</span><b>Read-only employer views</b></div><div><span>Learner</span><b>Own assigned work only</b></div></div></section></div><section class="card cmv2-report-table-card"><div class="cmv2-card-head"><div><div class="eyebrow">ACTIVE MEMBERS</div><h2>Workspace access</h2></div></div><div class="cmv2-table-scroll"><table class="cmv2-report-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Save</th></tr></thead><tbody>${list.map(x=>`<tr data-member="${esc(x.uid)}"><td><b>${esc(x.name||x.email||'Member')}</b><small>${esc(x.email||x.uid)}</small></td><td><select data-member-role><option value="owner" ${x.role==='owner'?'selected':''}>Owner</option><option value="training_admin" ${x.role==='training_admin'?'selected':''}>Training Admin</option><option value="content_manager" ${x.role==='content_manager'?'selected':''}>Content Manager</option><option value="manager" ${x.role==='manager'?'selected':''}>Manager</option><option value="viewer" ${x.role==='viewer'?'selected':''}>Viewer</option><option value="learner" ${x.role==='learner'?'selected':''}>Learner</option></select></td><td><select data-member-status><option value="active" ${x.status==='active'?'selected':''}>Active</option><option value="archived" ${x.status==='archived'?'selected':''}>Archived</option></select></td><td><button class="btn btn-soft btn-sm" data-save-member>Save</button></td></tr>`).join('')}</tbody></table></div><div class="cmv2-form-status" id="cmv2-team-status" aria-live="polite"></div></section></div></section>`);
      document.getElementById('cmv2-staff-invite')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),st=f.querySelector('.cmv2-form-status'),btn=f.querySelector('button');btn.disabled=true;try{const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`,{method:'POST',body:JSON.stringify({email:String(fd.get('email')||''),role:String(fd.get('role')||'viewer'),expiresDays:7})});const link=`${location.origin}${location.pathname}#/join/${encodeURIComponent(r.invite.token)}`;let copied=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);copied=true;}}catch{}st.innerHTML=`<span class="cmv2-invite-success">Secure invite created${copied?' and copied to clipboard':''}.</span><label class="cmv2-invite-link-label">Invitation link<input class="cmv2-invite-link" type="text" readonly value="${esc(link)}" aria-label="Invitation link"></label><button type="button" class="cmv2-btn cmv2-btn-secondary" data-copy="${esc(link)}">Copy invitation link</button>`;const copy=st.querySelector('[data-copy]');copy?.addEventListener('click',()=>{const value=copy.dataset.copy||link;navigator.clipboard?.writeText?.(value).then(()=>{copy.textContent='Copied ✓';}).catch(()=>{const input=st.querySelector('.cmv2-invite-link');input?.focus();input?.select();});});f.reset();btn.disabled=false;}catch(err){st.textContent=err.message;btn.disabled=false;}});
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
    const files=Array.isArray(scenario.files)?scenario.files:[];
    return `${entries.length?`<div class="cmv2-case-context">${entries.map(([k,v])=>`<div><span>${esc(k.replace(/_/g,' '))}</span><b>${esc(v)}</b></div>`).join('')}</div>`:''}${files.length?`<section class="card cmv2-assessment-files"><div class="eyebrow">CASE FILES</div><h2>Use the source packet—not memory.</h2><div class="cmv2-lab-file-list">${files.map((f,i)=>`<details ${i===0?'open':''}><summary><span>${esc(f.type||'File')}</span><b>${esc(f.name||`Case File ${i+1}`)}</b><small>${esc(f.label||'Source material')}</small></summary>${Array.isArray(f.rows)?`<table><tbody>${f.rows.map((r,ri)=>`<tr>${r.map(v=>ri===0?`<th>${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</details>`).join('')}</div></section>`:''}`;
  }

  function v2AssessmentQuestionHtml(q,i) {
    if(q.type==='numeric') return `<fieldset class="card cmv2-question cmv2-numeric-question"><legend><span>${String(i+1).padStart(2,'0')}</span>${esc(q.prompt)}</legend><div class="cmv2-numeric-entry"><label><span>Your calculated output${q.unit?` · ${esc(q.unit)}`:''}</span><input type="number" step="any" name="${esc(q.id)}" required inputmode="decimal" autocomplete="off"></label><small>Show your working in the case workpaper before entering the final requested output. Reasonable rounding is accepted.</small></div></fieldset>`;
    return `<fieldset class="card cmv2-question"><legend><span>${String(i+1).padStart(2,'0')}</span>${esc(q.prompt)}</legend><div class="cmv2-options">${(q.options||[]).map(o=>`<label><input type="radio" name="${esc(q.id)}" value="${esc(o)}" required><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
  }

  async function v2AssessmentPage(key, assignmentId='') {
    if(!authReady()) return loading('Preparing secure assessment…');
    if(!signedIn()) return authGate('learner');
    loading('Loading server-defined assessment…');
    try {
      const d=await api(`/enterprise/assessments/${encodeURIComponent(key)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`);
      const a=d.assessment; const questions=d.questions||[];
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(a.pathwayId))}`}">← Back</a><div class="cmv2-page-head"><div><div class="eyebrow">${esc(String(a.stage||'assessment').replace(/_/g,' ').toUpperCase())} · SERVER GRADED</div><h1>${esc(a.title)}</h1><p>${esc(a.description||'')} · ${Number(a.passScore)}% required.</p></div></div>${scenarioHtml(a.scenario)}<form id="cmv2-v2-assessment" class="cmv2-diagnostic-list">${questions.map(v2AssessmentQuestionHtml).join('')}<div class="card cmv2-submit-bar"><div><b>${Number(a.passScore)}% mastery required.</b><span>Answer keys stay on the secure Worker.</span></div><button class="btn btn-primary" type="submit">Submit ${a.stage==='final'?'Professional Final':'Assessment'} →</button></div><div class="cmv2-form-status" aria-live="polite"></div></form></div></section>`);
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
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(pathwayId))}`}">← Back</a><div class="cmv2-report-hero"><div><div class="eyebrow">VERIFIED READINESS REPORT</div><h1>${esc(d.pathway.title)}</h1><p>${esc(d.pathway.role)} · Generated ${fmtDate(d.generatedAt)}</p></div><div class="cmv2-report-score"><strong>${r?Number(r.overallScore):'—'}</strong><span>${esc(readinessLabel(r?.status))}</span><small>${r?Number(r.evidenceCoverage):0}% evidence coverage</small></div></div><div class="cmv2-kpis"><div class="card"><strong>${d.diagnostic?Number(d.diagnostic.score):'—'}</strong><span>Baseline</span></div><div class="card"><strong>${r?Number(r.overallScore):'—'}</strong><span>Current readiness</span></div><div class="card"><strong>${r&&r.improvement!=null?(Number(r.improvement)>=0?'+':'')+Number(r.improvement):'—'}</strong><span>Improvement</span></div><div class="card"><strong>${d.roleLab?.score??'—'}</strong><span>Role Lab</span></div></div><section class="card"><div class="cmv2-card-head"><div><div class="eyebrow">COMPETENCY EVIDENCE</div><h2>What the readiness score represents</h2></div><a href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">Detailed profile →</a></div><div class="cmv2-report-competencies">${skills.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><div class="cmv2-report-bar"><i style="width:${Math.max(0,Math.min(100,Number(x.score)))}%"></i><b style="left:${Math.max(0,Math.min(100,Number(x.minimumScore)))}%"></b></div><strong>${Number(x.score)}</strong><small>${Number(x.evidenceCount)} evidence records</small></div>`).join('')||'<p>No competency evidence yet.</p>'}</div></section><div class="cmv2-two-col"><section class="card"><div class="eyebrow">WORK EVIDENCE</div><h2>Applied proof</h2><div class="cmv2-evidence-list"><div><span>Diagnostic</span><b>${d.diagnostic?`${Number(d.diagnostic.score)}%`:'Not completed'}</b></div><div><span>Role Lab</span><b>${d.roleLab?`${Number(d.roleLab.score||0)}% · ${esc(d.roleLab.status)}`:'Not completed'}</b></div><div><span>Professional Final</span><b>${d.finalAssessment?`${Number(d.finalAssessment.score)}% · ${d.finalAssessment.passed?'Passed':'Not passed'}`:'Not completed'}</b></div></div></section><section class="card"><div class="eyebrow">VERIFIED CREDENTIALS</div><h2>Stackable achievements</h2><div class="cmv2-evidence-list">${creds.map(c=>`<a href="#/credential/${encodeURIComponent(pathwayId)}/${encodeURIComponent(c.level)}"><span>${esc(c.title)}</span><b>${esc(c.status)}</b></a>`).join('')||'<p>No credentials yet.</p>'}</div></section></div></div></section>`);
    } catch(e){ errorPage('Readiness report unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function downloadReportCsv(report) {
    const rows=[['Learner','Email','Progress Stage','Readiness','Status','Evidence Coverage','Diagnostic','Role Lab','Role Lab Revisions','Final','Manager Review','Complete','Overdue']];
    for(const x of report.learners||[]) rows.push([x.name||'',x.email||'',learnerProgressStage(x).label,x.readiness?.overallScore??'',x.readiness?.status||'',x.readiness?.evidenceCoverage??'',x.diagnostic?.score??'',x.roleLab?.score??'',x.roleLab?.revisions??'',x.final?.score??'',x.managerReview?.reviewStatus||'',x.complete?'Yes':'No',x.overdue?'Yes':'No']);
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='capital-mastery-readiness-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function downloadReportJson(report) { const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),standard:'Capital Mastery 2.0',report},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='capital-mastery-readiness-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

  async function employerReadinessReport(orgId, selectedAssignment='') {
    if(!authReady()) return loading('Loading employer report…'); if(!signedIn()) return authGate('employer'); loading('Building cohort readiness report…');
    try {
      await loadCatalog(); const [as,orgData]=await Promise.all([api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`),api(`/enterprise/organizations/${encodeURIComponent(orgId)}`)]); const caps=orgCapabilities(orgData.membership?.role); if(!caps.viewReports) return setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="card cmv2-permission-denied"><div class="eyebrow">LEAST-PRIVILEGE ACCESS</div><h1>Learner reporting is not part of ${esc(caps.role.replace(/_/g,' '))} access.</h1><p>Content administration is separated from employee performance data. Your role can manage the Firm Layer without access to readiness scores, evidence exports, manager reviews or coaching signals.</p><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/curriculum">Open Curriculum & Firm Layer →</a></div></div></section>`); const assignments=(as.assignments||[]).filter(x=>x.status!=='archived'); const chosen=assignments.find(x=>x.id===selectedAssignment)||assignments[0]; const canReview=caps.reviewLearners;
      if(!chosen) return setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="card cmv2-empty"><h2>No assignment to report yet.</h2><p>Create and publish a cohort first.</p><a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/quick-assign">Quick Assign →</a></div></div></section>`);
      const data=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(chosen.id)}`); const report=data.assignments?.[0]; if(!report) throw new Error('No report data returned.'); const summary=report.summary; const weak=(report.competencies||[]).slice(0,5); const learners=report.learners||[];
      const attention=learners.map(x=>({learner:x,signal:learnerAttention(x)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority);
      const ready=learners.filter(x=>x.complete||x.readiness?.status==='ready').length; const revisions=learners.filter(x=>Number(x.roleLab?.revisions||0)>0).length; const avgEvidence=learners.length?Math.round(learners.reduce((n,x)=>n+Number(x.readiness?.evidenceCoverage||0),0)/learners.length):null;
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="cmv2-page-head"><div><div class="eyebrow">EMPLOYER READINESS REPORT</div><h1>${esc(report.assignment.cohortName)}</h1><p>${esc(pathTitle(report.assignment.pathwayId))} · ${esc(targetTitle(report.assignment.credentialTarget))} · Generated ${fmtDate(data.generatedAt)}</p></div><div class="cmv2-head-actions"><a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/guide">How to read this report</a><button class="btn btn-outline" id="cmv2-export-report">Export CSV</button><button class="btn btn-outline" id="cmv2-export-evidence">Export Evidence JSON</button></div></div><div class="card cmv2-program-picker"><label>Assignment<select id="cmv2-report-picker">${assignments.map(x=>`<option value="${esc(x.id)}" ${x.id===chosen.id?'selected':''}>${esc(pathTitle(x.pathway_id))} · ${esc(x.status)} · ${fmtDate(x.due_at)}</option>`).join('')}</select></label></div><div class="cmv2-kpis cmv2-kpis-6"><div class="card"><strong>${Number(summary.learners)}</strong><span>Learners</span></div><div class="card"><strong>${ready}</strong><span>Ready / complete</span></div><div class="card"><strong>${summary.averageReadiness??'—'}</strong><span>Avg. readiness</span></div><div class="card"><strong>${avgEvidence==null?'—':avgEvidence+'%'}</strong><span>Avg. evidence coverage</span></div><div class="card"><strong>${Number(summary.overdue)}</strong><span>Overdue</span></div><div class="card"><strong>${revisions}</strong><span>Revision cycles</span></div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">COACHING SIGNALS</div><h2>Lowest measured competencies</h2><p>These are cohort-level averages, useful for deciding whether the group needs another teaching/review session.</p><div class="cmv2-evidence-list">${weak.length?weak.map(x=>`<div><span>${esc(x.name)}${x.critical?' · Critical':''}</span><b>${Number(x.averageScore)}%</b></div>`).join(''):'<p>Competency signals appear after learners begin.</p>'}</div></section><section class="card"><div class="eyebrow">MANAGER ATTENTION</div><h2>${attention.length} learner${attention.length===1?'':'s'} currently flagged</h2><p>Flags are explainable: deadline, revision history, baseline gap or evidence-backed readiness weakness.</p><div class="cmv2-attention-mini">${attention.slice(0,4).map(({learner:x,signal:g})=>`<div><b>${esc(x.name||x.email||'Learner')}</b><span>${esc(g.label)}</span><small>${esc(g.action)}</small></div>`).join('')||'<span>No urgent coaching flags.</span>'}</div></section></div><section class="card cmv2-report-table-card"><div class="cmv2-card-head"><div><div class="eyebrow">LEARNERS</div><h2>Individual readiness & progress</h2><p>Use progress to understand where they are; use readiness/evidence to understand what they have demonstrated.</p></div></div><div class="cmv2-table-scroll"><table class="cmv2-report-table cmv2-report-table-wide"><thead><tr><th>Learner</th><th>Progress stage</th><th>Baseline</th><th>Readiness</th><th>Evidence</th><th>Role Lab</th><th>Revisions</th><th>Final</th><th>Manager review</th></tr></thead><tbody>${learners.map((x,i)=>{const stage=learnerProgressStage(x),sig=learnerAttention(x);return `<tr data-report-learner="${i}"><td><b>${esc(x.name||x.email||'Learner')}</b><small>${esc(x.email||'')}</small></td><td><span class="cmv2-stage-pill ${esc(stage.tone)}">${esc(stage.label)}</span></td><td>${x.diagnostic?Number(x.diagnostic.score)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.overallScore)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.evidenceCoverage)+'%':'—'}</td><td>${x.roleLab?.score!=null?Number(x.roleLab.score)+'%':'—'}</td><td>${Number(x.roleLab?.revisions||0)||'—'}</td><td>${x.final?.score!=null?Number(x.final.score)+'%':'—'}</td><td><button class="cmv2-signal-btn ${sig?'':'neutral'}" type="button" data-open-learner="${i}"><b>${esc(sig?.label||(x.managerReview?'Review recorded':'Review learner'))}</b><span>${esc(sig?.action||(x.managerReview?`${String(x.managerReview.reviewStatus||'note').replace(/_/g,' ')} · open evidence`:'Open evidence & add review'))}</span></button></td></tr>`}).join('')||'<tr><td colspan="9">No learners yet.</td></tr>'}</tbody></table></div></section><div id="cmv2-signal-detail"></div></div></section>`);
      document.getElementById('cmv2-report-picker')?.addEventListener('change',e=>employerReadinessReport(orgId,e.target.value)); document.getElementById('cmv2-export-report')?.addEventListener('click',()=>downloadReportCsv(report)); document.getElementById('cmv2-export-evidence')?.addEventListener('click',()=>downloadReportJson(report));
      document.querySelectorAll('[data-open-learner]').forEach(b=>b.addEventListener('click',()=>{const x=learners[Number(b.dataset.openLearner)],sig=learnerAttention(x),stage=learnerProgressStage(x);const box=document.getElementById('cmv2-signal-detail');box.innerHTML=`<section class="card cmv2-learner-drilldown"><button type="button" class="cmv2-text-button" id="cmv2-close-signal">Close ×</button><div class="eyebrow">MANAGER EVIDENCE REVIEW</div><h2>${esc(x.name||x.email||'Learner')}</h2><div class="cmv2-drill-grid"><div><span>Current stage</span><b>${esc(stage.label)}</b></div><div><span>Readiness</span><b>${x.readiness?Number(x.readiness.overallScore)+'%':'Not measured'}</b></div><div><span>Evidence coverage</span><b>${x.readiness?Number(x.readiness.evidenceCoverage)+'%':'0%'}</b></div><div><span>Role Lab revisions</span><b>${Number(x.roleLab?.revisions||0)}</b></div></div>${sig?`<div class="cmv2-coach-prescription"><strong>${esc(sig.label)}</strong><p>${esc(sig.reason)}</p><b>Suggested manager action</b><p>${esc(sig.action)}</p></div>`:''}${x.managerReview?`<div class="cmv2-manager-review-existing"><div class="eyebrow">LATEST MANAGER REVIEW</div><b>${esc(x.managerReview.reviewStatus.replace(/_/g,' '))}${x.managerReview.rating?` · ${Number(x.managerReview.rating)}/5`:''}</b><p>${esc(x.managerReview.comment)}</p><small>${fmtDate(x.managerReview.createdAt)}</small></div>`:''}${canReview?`<form class="cmv2-manager-review-form" data-review-user="${esc(x.uid)}"><div class="eyebrow">ADD MANAGER REVIEW</div><div class="cmv2-review-controls"><label>Status<select name="reviewStatus"><option value="note">Note</option><option value="needs_attention">Needs attention</option><option value="commended">Commended</option><option value="resolved">Resolved</option></select></label><label>Rating<select name="rating"><option value="">No rating</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n}/5</option>`).join('')}</select></label></div><label>Coaching / review note<textarea name="comment" rows="4" maxlength="2400" required placeholder="Record the work-product feedback, what needs to change, or what the learner did well…"></textarea></label><div class="cmv2-form-status"></div><button class="btn btn-primary btn-sm" type="submit">Save Audited Review</button></form>`:''}<div class="cmv2-evidence-note"><b>Evidence-first interpretation</b><span>Manager reviews add coaching context; they do not overwrite standardized Capital Mastery scores or credential thresholds.</span></div></section>`;box.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('cmv2-close-signal')?.addEventListener('click',()=>box.innerHTML='');const form=box.querySelector('.cmv2-manager-review-form');form?.addEventListener('submit',async ev=>{ev.preventDefault();const fd=new FormData(form),btn=form.querySelector('button'),st=form.querySelector('.cmv2-form-status');btn.disabled=true;try{st.textContent='Saving audited manager review…';await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/reviews`,{method:'POST',body:JSON.stringify({assignmentId:chosen.id,learnerUid:x.uid,artifactType:x.roleLab?'role_lab':'readiness',artifactRef:x.roleLab?.id||null,reviewStatus:String(fd.get('reviewStatus')||'note'),rating:fd.get('rating')?Number(fd.get('rating')):null,comment:String(fd.get('comment')||'')})});await employerReadinessReport(orgId,chosen.id);}catch(err){st.textContent=err.message;btn.disabled=false;}});}));
    } catch(e){ errorPage('Could not load readiness report.',e.message,`#/employer/${orgId}`); }
  }

  async function notificationsPage() {
    if(!authReady()) return loading('Loading notifications…'); if(!signedIn()) return authGate('learner'); loading('Refreshing deadlines and coaching alerts…');
    try { const d=await api('/enterprise/notifications'); const notes=d.notifications||[]; setMain(`<section class="cmv2-page"><div class="container cmv2-narrow-wide"><div class="cmv2-page-head"><div><div class="eyebrow">NOTIFICATIONS & DEADLINES</div><h1>What needs your attention now.</h1><p>Generated from authoritative assignments, deadlines, Role Lab revision states and manager reviews.</p></div><button class="btn btn-outline" id="cmv2-refresh-notifications">Refresh</button></div>${notes.length?`<div class="cmv2-notification-list">${notes.map(n=>`<article class="card cmv2-notification ${esc(n.severity)} ${n.status==='read'?'read':''}"><span>${n.severity==='urgent'?'!':n.severity==='attention'?'△':n.severity==='positive'?'✓':'i'}</span><div><div class="eyebrow">${esc(n.category.replace(/_/g,' '))}</div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><small>${fmtDate(n.updatedAt||n.createdAt)}</small></div><div>${n.actionHash?`<a class="btn btn-primary btn-sm" href="${esc(n.actionHash)}">Open →</a>`:''}${n.status!=='read'?`<button class="btn btn-soft btn-sm" type="button" data-read-note="${esc(n.id)}">Mark read</button>`:''}</div></article>`).join('')}</div>`:`<div class="card cmv2-empty"><div class="cmv2-empty-icon">✓</div><h2>Nothing urgent right now.</h2><p>Deadline, revision, readiness and manager-review alerts will appear here when they need action.</p></div>`}</div></section>`); document.getElementById('cmv2-refresh-notifications')?.addEventListener('click',async()=>{await api('/enterprise/notifications/refresh',{method:'POST',body:'{}'});await notificationsPage();});document.querySelectorAll('[data-read-note]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;await api(`/enterprise/notifications/${encodeURIComponent(b.dataset.readNote)}`,{method:'PATCH',body:JSON.stringify({status:'read'})});await notificationsPage();})); }
    catch(e){errorPage('Notifications unavailable.',e.message,'#/');}
  }

  function roleLabScenarioFiles(s={}) {
    if(Array.isArray(s.files) && s.files.length) return `<div class="cmv2-lab-file-list">${s.files.map((f,i)=>`<details ${i===0?'open':''}><summary><span>${esc(f.type||'File')}</span><b>${esc(f.name||`Case File ${i+1}`)}</b><small>${esc(f.label||'Source material')}</small></summary>${Array.isArray(f.rows)?`<table><tbody>${f.rows.map((r,ri)=>`<tr>${r.map((v,ci)=>ri===0?`<th>${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</details>`).join('')}</div>`;
    return `<details open><summary>Historical financials</summary><table><thead><tr><th>Year</th><th>Revenue</th><th>EBITDA</th></tr></thead><tbody>${Object.entries(s.historicals||{}).map(([y,v])=>`<tr><td>${esc(y)}</td><td>$${esc(v.revenue)}m</td><td>$${esc(v.ebitda)}m</td></tr>`).join('')}</tbody></table></details><details><summary>Capitalization</summary><div class="cmv2-data-pairs">${Object.entries(s.capitalization||{}).map(([k,v])=>`<span>${esc(k.replace(/_/g,' '))}<b>${esc(v)}</b></span>`).join('')}</div></details><details><summary>Management forecast</summary><table><thead><tr><th>Year</th><th>Revenue</th><th>Margin</th></tr></thead><tbody>${Object.entries(s.management_forecast||{}).map(([y,v])=>`<tr><td>${esc(y)}</td><td>$${esc(v.revenue)}m</td><td>${Math.round(Number(v.ebitda_margin||0)*1000)/10}%</td></tr>`).join('')}</tbody></table></details><details><summary>Trading comps</summary><table><thead><tr><th>Peer</th><th>EV</th><th>EBITDA</th></tr></thead><tbody>${(s.comps||[]).map(v=>`<tr><td>${esc(v.name)}</td><td>$${esc(v.ev)}m</td><td>$${esc(v.ebitda)}m</td></tr>`).join('')}</tbody></table></details><details><summary>DCF assumptions</summary><div class="cmv2-data-pairs"><span>FCF<b>${esc((s.dcf?.fcf||[]).join(', '))}</b></span><span>WACC<b>${Number(s.dcf?.wacc||0)*100}%</b></span><span>Terminal growth<b>${Number(s.dcf?.terminal_growth||0)*100}%</b></span></div></details>`;
  }

  async function roleLabLanding(pathwayId, assignmentId='') {
    if (!authReady()) return loading('Preparing Role Lab…');
    if (!signedIn()) return authGate('learner');
    loading('Loading professional Role Lab…');
    try {
      await loadCatalog(); const d=await api(`/enterprise/role-labs/${encodeURIComponent(pathwayId)}`); const lab=(d.labs||[])[0]; if(!lab) throw new Error('A professional Role Lab for this pathway is not live yet.'); const s=lab.scenario||{};
      const workflow=(s.workflow||[]).length?s.workflow:['Open the case source files and identify the requested work product.','Build or update the analysis using the taught workflow.','Check the work before manager review.','Respond to feedback or new information.','Send a decision-ready final recommendation.'];
      setMain(`<section class="cmv2-page"><div class="container"><a class="cmv2-back" href="${assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(pathwayId))}`}">← Back</a><div class="cmv2-rolelab-hero"><div><div class="eyebrow">ROLE LAB · ${esc(lab.roleTitle)}</div><h1>${esc(lab.title)}</h1><p>${esc(s.context||'')}</p><div class="cmv2-rolelab-meta"><span><b>Desk</b>${esc(s.desk||pathTitle(pathwayId))}</span><span><b>Reviewer</b>${esc(s.reviewer||s.associate||'Manager')}</span><span><b>Client / project</b>${esc(lab.clientName||s.client||s.buyer||'Synthetic case')}</span><span><b>Pass standard</b>${Number(lab.passScore||80)}%</span></div></div><div class="cmv2-rolelab-badge">LIVE-STYLE<br>WORKFLOW</div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">WHAT YOU WILL DO</div><h2>Perform the work—not answer trivia.</h2><div class="cmv2-work-list">${workflow.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x)}</span></div>`).join('')}</div></section><section class="card cmv2-start-lab"><div class="eyebrow">PROJECT FILE</div><h2>${esc(s.project||s.target||lab.clientName||lab.title)}</h2><p>${s.deadline?`<b>Deadline:</b> ${esc(s.deadline)}<br>`:''}The source files and work instructions are provided inside the secure case. Your outputs and revisions become competency evidence.</p><div class="cmv2-warning-soft">All companies, people and data are synthetic training materials. No proprietary employer information is used.</div><button class="btn btn-primary btn-block" id="cmv2-start-lab">Start / Resume Role Lab →</button><a class="btn btn-outline btn-block" href="#/skills/${encodeURIComponent(pathwayId)}${assignmentId?`?assignment=${encodeURIComponent(assignmentId)}`:''}">View Skill Profile</a><div class="cmv2-form-status"></div></section></div></div></section>`);
      document.getElementById('cmv2-start-lab')?.addEventListener('click',async e=>{const b=e.currentTarget;const st=b.parentElement.querySelector('.cmv2-form-status');b.disabled=true;try{st.textContent='Opening your secure run…';const r=await api(`/enterprise/role-labs/${encodeURIComponent(lab.labKey)}/start`,{method:'POST',body:JSON.stringify({assignmentId:assignmentId||null})});location.hash=`#/role-lab-run/${encodeURIComponent(r.runId)}`;}catch(err){st.textContent=err.message;b.disabled=false;}});
    } catch(e){ errorPage('Role Lab unavailable.',e.message,assignmentId?`#/assigned/${assignmentId}`:'#/careers'); }
  }

  function roleLabFieldHtml(field) {
    const id=esc(field.id); const label=esc(field.label||field.id); const type=field.type||'number';
    if(type==='choice') return `<label class="cmv2-lab-field"><span>${label}</span><select name="${id}" required><option value="">Choose…</option>${(field.options||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`;
    if(type==='textarea') return `<label class="cmv2-lab-field"><span>${label}</span><textarea name="${id}" rows="8" maxlength="${Number(field.maxLength||2200)}" required placeholder="Write the concise work product you would send to your Associate…"></textarea></label>`;
    return `<label class="cmv2-lab-field"><span>${label}</span><div class="cmv2-number-wrap">${field.prefix?`<i>${esc(field.prefix)}</i>`:''}<input type="number" step="any" name="${id}" required>${field.suffix?`<i>${esc(field.suffix)}</i>`:''}</div></label>`;
  }

  function roleLabFileName(task) {
    if(task?.brief?.fileName) return task.brief.fileName;
    const n=Number(task.stageNo||1);
    if(n<=3) return `Project_Northstar_Model_v${String(5+n).padStart(2,'0')}.xlsx`;
    if(n===4) return 'Project_Northstar_Merger_Analysis_v09.xlsx';
    if(n===5) return 'Project_Northstar_ModelCheck_v10.xlsx';
    if(n===6) return 'Project_Northstar_Update_v11.xlsx';
    return 'Project_Northstar_VP_Update_v04.pptx';
  }

  function roleLabDeliverable(task) {
    if(task?.brief?.deliverable) return task.brief.deliverable;
    const n=Number(task.stageNo||1);
    return ({1:'Transaction snapshot / capitalization bridge',2:'Trading comparables output',3:'DCF valuation cross-check',4:'Acquisition economics',5:'Model QA markup',6:'Revised forecast impact',7:'Associate recommendation email'})[n] || 'Analyst work product';
  }

  function roleLabTaskForm(task) {
    const b=task.brief||{};
    if(task.taskType==='multi_select' && b.field) return `<div class="cmv2-model-check"><div class="cmv2-sheet-tabs"><b>Model Check</b><span>${esc(roleLabFileName(task))}</span></div><table><thead><tr><th>Flag?</th><th>Review item</th><th>Analyst note</th></tr></thead><tbody>${(b.field.options||[]).map((o,i)=>`<tr><td><input type="checkbox" name="${esc(b.field.id)}" value="${esc(o)}" aria-label="Flag review item ${i+1}"></td><td>${esc(o)}</td><td>${i<4?'Potential model-impact item':'Check whether this is actually material'}</td></tr>`).join('')}</tbody></table></div>`;
    if(task.taskType==='numeric_fields') return `<div class="cmv2-workbook"><div class="cmv2-sheet-tabs"><b>Analysis</b><span>${esc(roleLabFileName(task))}</span></div><table><thead><tr><th>Model line</th><th>Your output</th><th>Format</th></tr></thead><tbody>${(b.fields||[]).map(f=>`<tr><td>${esc(f.label||f.id)}</td><td>${roleLabFieldHtml({...f,label:''})}</td><td>${esc([f.prefix,f.suffix].filter(Boolean).join(' … ')||'Number')}</td></tr>`).join('')}</tbody></table><div class="cmv2-sheet-foot">Enter only the requested outputs. The secure grader checks the underlying result; answer keys never load into this workbook.</div></div>`;
    if(task.taskType==='written_decision') {
      const fields=b.fields||[]; const stance=fields.find(f=>f.type==='choice'); const text=fields.find(f=>f.type==='textarea');
      return `<div class="cmv2-email-compose"><div class="cmv2-email-compose-row"><span>To</span><b>${esc(b.from||'Manager / Reviewer')}</b></div><div class="cmv2-email-compose-row"><span>Subject</span><b>${esc(b.deliverable||task.title)} — recommendation / update</b></div>${stance?roleLabFieldHtml(stance):''}${text?roleLabFieldHtml(text):''}<div class="cmv2-email-compose-note">Keep it decision-ready: conclusion → evidence → material risk/change → next step.</div></div>`;
    }
    return `<div class="cmv2-mixed-work"><div class="cmv2-sheet-tabs"><b>Transaction Analysis</b><span>${esc(roleLabFileName(task))}</span></div><div class="cmv2-lab-fields">${(b.fields||[]).map(roleLabFieldHtml).join('')}</div></div>`;
  }

  async function roleLabRun(runId) {
    if (!authReady()) return loading('Opening your Role Lab desk…');
    if (!signedIn()) return authGate('learner');
    loading('Opening analyst workspace…');
    try {
      const d=await api(`/enterprise/role-lab-runs/${encodeURIComponent(runId)}`); const task=d.currentTask; const s=d.lab?.scenario||{}; const completed=d.completed||[];
      if(d.complete || d.run?.status==='passed') {
        setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-lab-complete"><div class="cmv2-success-icon">✓</div><div class="eyebrow">ROLE LAB PASSED</div><h1>${esc(d.lab.title)}</h1><div class="cmv2-result-score"><strong>${Number(d.run.score||d.overallScore||0)}</strong><span>Role Lab score</span></div><p>You completed the required professional work products, review/revision cycle and final manager-facing recommendation.</p><div class="cmv2-success-actions"><a class="btn btn-primary" href="#/skills/${encodeURIComponent(d.run.pathwayId)}${d.run.assignmentId?`?assignment=${encodeURIComponent(d.run.assignmentId)}`:''}">View Updated Skill Profile →</a><a class="btn btn-outline" href="${d.run.assignmentId?`#/assigned/${encodeURIComponent(d.run.assignmentId)}`:`#/career/${encodeURIComponent(publicPathId(d.run.pathwayId))}`}">Back to Program</a></div></div></div></section>`); return;
      }
      if(!task) throw new Error('No current Role Lab task is available.');
      const latestForTask=completed.filter(x=>x.taskId===task.id).sort((a,b)=>b.attemptNo-a.attemptNo)[0];
      setMain(`<section class="cmv2-rolelab-page"><div class="container"><div class="cmv2-deskbar"><div><span>${esc(s.timeline||'Analyst Desk')}</span><b>${esc(s.desk||d.lab.roleTitle)}</b></div><div><span>Project</span><b>${esc(s.target||d.lab.title)}</b></div><div><span>Overall</span><b>${Number(d.overallScore||0)}%</b></div><a href="${d.run.assignmentId?`#/assigned/${encodeURIComponent(d.run.assignmentId)}`:'#/careers'}">Exit desk</a></div><div class="cmv2-desk-grid"><aside class="card cmv2-data-room"><div class="eyebrow">CASE FILES / DATA ROOM</div><h3>${esc(s.project||s.target||d.lab.title)}</h3>${roleLabScenarioFiles(s)}</aside><main class="card cmv2-workbench"><div class="cmv2-workbar"><div><span>ACTIVE FILE</span><b>${esc(roleLabFileName(task))}</b></div><div><span>DELIVERABLE</span><b>${esc(roleLabDeliverable(task))}</b></div><div><span>DUE / UPDATE</span><b>${esc(task.brief?.timestamp||'Today')}</b></div></div>${Number(task.stageNo)>=6?`<div class="cmv2-breaking-update"><strong>NEW INFORMATION RECEIVED</strong><span>The case changed after your initial work. Update affected assumptions and outputs before you continue.</span></div>`:''}<div class="cmv2-email"><div class="cmv2-email-head"><div class="cmv2-avatar">MC</div><div><b>${esc(task.brief?.from||'Associate')}</b><span>${esc(task.brief?.timestamp||'')}</span></div><em>Stage ${Number(task.stageNo)}</em></div><h1>${esc(task.title)}</h1><p>${esc(task.brief?.message||'')}</p></div>${latestForTask && latestForTask.score < Number(task.passScore)?`<div class="cmv2-manager-feedback"><div class="eyebrow">ASSOCIATE COMMENTS · REVISION REQUIRED</div><strong>${Number(latestForTask.score)}%</strong><p>${esc(latestForTask.feedback?.managerNote||'Revise and resubmit.')}</p><ul>${(latestForTask.feedback?.messages||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<form id="cmv2-lab-task">${roleLabTaskForm(task)}<div class="cmv2-task-foot"><div><span>Task pass threshold</span><b>${Number(task.passScore)}%</b><small>Attempt ${Number(latestForTask?.attemptNo||0)+1} of ${Number(task.maxAttempts)}</small></div><button class="btn btn-primary" type="submit">Submit Work →</button></div><div class="cmv2-form-status"></div></form></main><aside class="card cmv2-run-progress"><div class="eyebrow">DESK PROGRESS</div><h3>${completed.filter(x=>x.score>=70).length} accepted submissions</h3><div class="cmv2-run-history">${completed.sort((a,b)=>String(a.taskId).localeCompare(String(b.taskId))).map(x=>`<div class="${x.score>=70?'good':'revise'}"><span>${esc(x.taskId.toUpperCase())} · Attempt ${Number(x.attemptNo)}</span><b>${Number(x.score)}%</b></div>`).join('')||'<p>No submissions yet.</p>'}</div><div class="cmv2-no-answer">Answer keys stay server-side. Only your feedback and evidence scores return to the browser.</div></aside></div></div></section>`);
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
    let preview=null;
    try { preview=await api(`/enterprise/invites/preview/${encodeURIComponent(token)}`,{},false); } catch(e) { return errorPage('Invitation unavailable.',e.message,'#/'); }
    const inv=preview.invite||{};
    if (!authReady()) return loading(`Opening ${inv.organizationName||'company'} invitation…`);
    if (!signedIn()) {
      setMain(`<section class="cmv2-page"><div class="container cmv2-narrow"><div class="card cmv2-auth-gate"><div class="eyebrow">INVITED BY ${esc(inv.organizationName||'YOUR EMPLOYER')}</div><h1>Join ${esc(inv.cohortName||'your assigned training')}.</h1><p>${inv.pathwayTitle?`${esc(inv.pathwayTitle)} · `:''}Your invitation is tied to the account you sign in with. After authentication, Capital Mastery will accept the invitation and take you directly to Assigned Training.</p><div class="cmv2-invite-preview"><span>Firm<b>${esc(inv.organizationName||'—')}</b></span><span>Cohort<b>${esc(inv.cohortName||'—')}</b></span><span>Training<b>${esc(inv.pathwayTitle||'Assigned program')}</b></span><span>Expires<b>${esc(fmtDate(inv.expiresAt))}</b></span></div><a class="btn btn-primary btn-block" href="#/login">Sign in / Create Account →</a></div></div></section>`);
      return;
    }
    loading(`Joining ${inv.organizationName||'company'} training…`);
    try { await api('/enterprise/invites/accept',{method:'POST',body:JSON.stringify({token})}); localStorage.removeItem(PENDING_INVITE); location.hash='#/assigned'; }
    catch(e){ errorPage('Could not accept invitation.',e.message,'#/assigned'); }
  }

  async function acceptPendingInviteAfterAuth() {
    const token=localStorage.getItem(PENDING_INVITE); if(!token||!signedIn()) return;
    if (!['login'].includes(parts().parts[0]||'')) return;
    try { await api('/enterprise/invites/accept',{method:'POST',body:JSON.stringify({token})}); localStorage.removeItem(PENDING_INVITE); location.hash='#/assigned'; }
    catch(e) { console.warn('Pending Capital Mastery employer invite not accepted:',e); }
  }


  function demoPresetCard(id,title,copy,signal) {
    return `<label class="cmv2-demo-preset"><input type="radio" name="preset" value="${esc(id)}"><span><b>${esc(title)}</b><small>${esc(copy)}</small><em>${esc(signal)}</em></span></label>`;
  }

  async function adminDemoLab() {
    if(!authReady()) return loading('Checking administrator access…');
    if(!signedIn()) return authGate('employer');
    loading('Opening Demo & Test Lab…');
    try {
      await api('/admin/check'); await loadCatalog(); const [state,perm]=await Promise.all([api('/enterprise/admin/demo'),api('/enterprise/admin/demo/permission-matrix')]); const demos=state.demos||[]; const permissionRoles=perm.roles||{};
      setMain(`<section class="cmv2-page cmv2-demo-lab"><div class="container"><a class="cmv2-back" href="#/admin-preview">← Admin / QA</a><div class="cmv2-demo-hero"><div><div class="eyebrow">ADMIN · DEMO / TEST LAB</div><h1>Test the firm experience without real people.</h1><p>Create synthetic employer workspaces, open the same Command Center a firm would see, inspect reports, test edge cases, then reset everything in one click.</p></div><div class="cmv2-demo-seal">SYNTHETIC<br>DATA ONLY</div></div><div class="cmv2-two-col"><section class="card"><div class="eyebrow">ONE-CLICK SCENARIO</div><h2>Generate a realistic demo cohort</h2><form id="cmv2-demo-create"><label>Career pathway<select name="pathwayId">${catalog.pathways.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('')}</select></label><label>Cohort size<input name="size" type="number" min="3" max="30" value="12"></label><div class="cmv2-demo-presets">${demoPresetCard('mixed_cohort','Mixed cohort','A realistic blend of not-started, learning, revision, final and ready learners.','Best default employer demo')}${demoPresetCard('new_cohort','New cohort','Nobody has started yet.','Onboarding / empty states')}${demoPresetCard('completed_cohort','Completed cohort','Full readiness and synthetic Professional Readiness credentials.','Reports / proof of completion')}${demoPresetCard('weak_modeling','Weak modeling cohort','Learners are progressing but modeling / QA evidence is weak.','Manager coaching demo')}${demoPresetCard('overdue_cohort','Overdue cohort','Deadline has passed for incomplete learners.','Attention queue / follow-up')}${demoPresetCard('revision_cycle','Revision cycle','Repeated Role Lab revisions and manager feedback signals.','Applied-work coaching') }</div><div class="cmv2-form-status" aria-live="polite"></div><button class="btn btn-primary btn-block" type="submit">Generate Synthetic Firm →</button></form></section><section class="card"><div class="eyebrow">WHAT YOU CAN TEST</div><h2>Founder control surface</h2><div class="cmv2-demo-capabilities"><div><b>Employer</b><span>Command Center, Launch Guide, Quick Assign, curriculum, reports, permissions, audit.</span></div><div><b>Learner states</b><span>Not started, baseline, applied evidence, revision cycles, final, ready.</span></div><div><b>Manager signals</b><span>Overdue, weak skill evidence, repeated revisions and coaching prescriptions.</span></div><div><b>Trust</b><span>Tenant isolation, role restrictions, audit events and synthetic-data labeling.</span></div></div><div class="cmv2-warning-soft"><strong>Safety boundary:</strong> demo learners are synthetic D1 records, not real Firebase accounts. They cannot sign in, receive real credentials, or appear as real people.</div></section></div><section class="card cmv2-demo-existing"><div class="cmv2-card-head"><div><div class="eyebrow">ACTIVE DEMO TENANTS</div><h2>${demos.length} synthetic workspace${demos.length===1?'':'s'}</h2></div><button class="btn btn-danger btn-sm" id="cmv2-reset-demos" ${demos.length?'':'disabled'}>Reset All Demo Data</button></div>${demos.length?`<div class="cmv2-demo-list">${demos.map(d=>`<article><div><span>DEMO</span><h3>${esc(d.name)}</h3><p>${Number(d.learners||0)} learners · ${Number(d.assignments||0)} assignment${Number(d.assignments||0)===1?'':'s'} · created ${fmtDate(d.created_at)}</p></div><div class="cmv2-demo-actions"><a class="btn btn-primary btn-sm" href="#/employer/${encodeURIComponent(d.id)}">Open Employer View</a><a class="btn btn-outline btn-sm" href="#/employer/${encodeURIComponent(d.id)}/guide">Launch Guide</a><a class="btn btn-outline btn-sm" href="#/employer/${encodeURIComponent(d.id)}/reports">Reports</a><a class="btn btn-outline btn-sm" href="#/employer/${encodeURIComponent(d.id)}/curriculum">Curriculum</a></div></article>`).join('')}</div>`:`<div class="cmv2-empty-inline"><h3>No demo tenants yet.</h3><p>Generate the Mixed Cohort preset for a complete employer walkthrough.</p></div>`}</section>${demos.length?`<section class="card cmv2-demo-state-lab"><div class="cmv2-card-head"><div><div class="eyebrow">SYNTHETIC LEARNER STATE LAB</div><h2>Move any demo learner through the lifecycle.</h2><p>Change the authoritative demo records, then reopen Reports to test empty, progress, revision and readiness states instantly.</p></div></div><div class="cmv2-demo-state-grid"><label>Demo tenant<select id="cmv2-demo-state-org"><option value="">Choose demo workspace…</option>${demos.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Synthetic learner<select id="cmv2-demo-state-user" disabled><option value="">Choose a workspace first…</option></select></label></div><div class="cmv2-demo-state-buttons">${[['new','Not Started'],['baseline','Baseline'],['learning','Learning / Applied'],['revision','Revision Required'],['final','Final Stage'],['ready','Ready / Complete']].map(([id,label])=>`<button type="button" class="btn btn-soft btn-sm" data-demo-state="${id}" disabled>${label}</button>`).join('')}</div><div class="cmv2-form-status" id="cmv2-demo-state-status"></div></section>`:''}<section class="card cmv2-permission-lab"><div><div class="eyebrow">PERMISSION LAB</div><h2>See what each organization role can do.</h2><p>This mirrors the server permission model used to design route-level access and gives you a fast QA checklist before a firm demo.</p></div><div class="cmv2-permission-grid">${Object.entries(permissionRoles).map(([role,actions])=>`<article><b>${esc(role.replace(/_/g,' '))}</b>${actions.map(a=>`<span>${esc(a.replace(/\./g,' · '))}</span>`).join('')}</article>`).join('')}</div><div class="cmv2-warning-soft"><b>Negative-control expectation:</b> learners never manage tenants; viewers never mutate content; managers see readiness but do not manage members; Content Managers do not become Owners through the browser.</div></section><section class="card cmv2-demo-playbook"><div><div class="eyebrow">DEMO PLAYBOOK</div><h2>Show a firm the product in this order.</h2></div><ol><li><b>Command Center:</b> show who needs attention without opening spreadsheets.</li><li><b>Curriculum:</b> prove the Standard is visible, realistic and protected while Firm Layer stays customizable.</li><li><b>Learner Report:</b> distinguish completion from evidence-backed readiness.</li><li><b>Role Lab / Workbench:</b> show the actual job work, revision cycle and secure grading.</li><li><b>Trust:</b> show server roles, audit history and synthetic / firm-data boundaries.</li></ol></section></div></section>`);
      document.querySelector('input[name="preset"][value="mixed_cohort"]')?.click();
      document.getElementById('cmv2-demo-create')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,fd=new FormData(form),btn=form.querySelector('button[type="submit"]'),status=form.querySelector('.cmv2-form-status');btn.disabled=true;try{status.textContent='Seeding isolated synthetic tenant…';const r=await api('/enterprise/admin/demo/create',{method:'POST',body:JSON.stringify({preset:String(fd.get('preset')||'mixed_cohort'),size:Number(fd.get('size')||12),pathwayId:String(fd.get('pathwayId')||'investment-banking')})});status.textContent='Demo workspace created. Opening employer view…';location.hash=`#/employer/${encodeURIComponent(r.demo.orgId)}`;}catch(err){status.textContent=err.message;btn.disabled=false;}});
      const demoOrg=document.getElementById('cmv2-demo-state-org'), demoUser=document.getElementById('cmv2-demo-state-user'), demoStatus=document.getElementById('cmv2-demo-state-status');
      demoOrg?.addEventListener('change',async()=>{demoUser.disabled=true;document.querySelectorAll('[data-demo-state]').forEach(b=>b.disabled=true);if(!demoOrg.value){demoUser.innerHTML='<option>Choose a workspace first…</option>';return;}try{demoStatus.textContent='Loading synthetic learners…';const d=await api(`/enterprise/admin/demo/${encodeURIComponent(demoOrg.value)}/learners`);demoUser.innerHTML=`<option value="">Choose learner…</option>${(d.learners||[]).map(x=>`<option value="${esc(x.uid)}">${esc(x.holder_name||x.email||x.uid)}</option>`).join('')}`;demoUser.disabled=false;demoStatus.textContent='';}catch(err){demoStatus.textContent=err.message;}});
      demoUser?.addEventListener('change',()=>document.querySelectorAll('[data-demo-state]').forEach(b=>b.disabled=!demoUser.value));
      document.querySelectorAll('[data-demo-state]').forEach(b=>b.addEventListener('click',async()=>{if(!demoOrg?.value||!demoUser?.value)return;document.querySelectorAll('[data-demo-state]').forEach(x=>x.disabled=true);try{demoStatus.textContent=`Moving synthetic learner to ${b.textContent}…`;await api('/enterprise/admin/demo/learner-state',{method:'POST',body:JSON.stringify({orgId:demoOrg.value,uid:demoUser.value,state:b.dataset.demoState})});demoStatus.innerHTML=`State changed. <a href="#/employer/${encodeURIComponent(demoOrg.value)}/reports">Open employer report →</a>`;}catch(err){demoStatus.textContent=err.message;}finally{document.querySelectorAll('[data-demo-state]').forEach(x=>x.disabled=!demoUser.value);}}));
      document.getElementById('cmv2-reset-demos')?.addEventListener('click',async e=>{if(!confirm('Delete every synthetic Capital Mastery demo tenant? Real organizations are not touched.'))return;const b=e.currentTarget;b.disabled=true;b.textContent='Resetting…';try{await api('/enterprise/admin/demo/reset',{method:'POST',body:'{}'});await adminDemoLab();}catch(err){alert(err.message);b.disabled=false;b.textContent='Reset All Demo Data';}});
    } catch(e){ errorPage('Demo/Test Lab unavailable.',e.message,'#/admin-preview'); }
  }

  async function route() {
    const {parts:p,query}=parts(); const [root,a,b,c,d,e]=p;
    if (!['employers','employer','employer-start','employer-onboarding','academy','notifications','assigned','join','diagnostic','skills','readiness','v2-assessment','role-lab','role-lab-run','my-data','admin-demo'].includes(root)) return false;
    if (root==='admin-demo') { await adminDemoLab(); return true; }
    if (root==='academy') { await academyPage(); return true; }
    if (root==='notifications') { await notificationsPage(); return true; }
    if (root==='employers') { employerLanding(); return true; }
    if (root==='employer-start') { employerStart(); return true; }
    if (root==='employer-onboarding') { await employerOnboarding(); return true; }
    if (root==='employer' && !a) { await employerHome(); return true; }
    if (root==='employer' && a && b==='guide') { await employerGuidePage(a); return true; }
    if (root==='employer' && a && b==='quick-assign') { await quickAssign(a); return true; }
    if (root==='employer' && a && b==='curriculum' && c==='add') { await firmLayerAddPage(a,query.get('assignment')||''); return true; }
    if (root==='employer' && a && b==='curriculum' && c==='content' && d && e==='edit') { await firmLayerEditPage(a,query.get('assignment')||'',decodeURIComponent(d)); return true; }
    if (root==='employer' && a && b==='curriculum' && c==='content' && d && e==='history') { await firmLayerHistoryPage(a,query.get('assignment')||'',decodeURIComponent(d)); return true; }
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
    document.addEventListener('cm-auth-changed',()=>{ if(signedIn() && localStorage.getItem(EMPLOYER_INTENT) && !localStorage.getItem(PENDING_INVITE)){ localStorage.removeItem(EMPLOYER_INTENT); location.hash='#/employer-onboarding'; return; } setTimeout(route,0); setTimeout(acceptPendingInviteAfterAuth,50); });
    setTimeout(route,0);
  }

  window.CM_ENTERPRISE_V2 = { route, api, loadCatalog };
  boot();
})();
