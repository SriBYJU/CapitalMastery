(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL || 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
  let rendering = false;
  let scheduled = false;
  let lastHubKey = '';
  const cache = new Map();

  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route = () => String(location.hash || '#/').split('?')[0].replace(/\/$/, '');
  const titleize = id => ({
    'investment-banking':'Investment Banking','private-equity':'Private Equity','venture-capital':'Venture Capital','equity-research':'Equity Research','asset-management':'Asset Management','hedge-funds':'Hedge Funds','sales-trading':'Sales & Trading','quantitative-finance':'Quantitative Finance','private-credit':'Private Credit','corporate-banking':'Corporate Banking','corporate-development':'Corporate Development','fp-and-a':'FP&A','treasury':'Treasury','wealth-management':'Wealth Management','risk-management':'Risk Management','real-estate':'Real Estate'
  }[String(id||'')] || String(id||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()));
  const trackTitle = t => t === 'career_skills' ? 'Career Skills' : t === 'professional' ? 'Professional Readiness' : String(t || '').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  const fmtDate = v => { if(!v) return 'No deadline'; const d=new Date(v); return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); };
  const fmtTime = v => { if(!v) return 'No activity yet'; const d=new Date(v); return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d); };
  const capabilities = role => ({
    manage:['owner','training_admin'].includes(role),
    reports:['owner','training_admin','manager','viewer'].includes(role),
    review:['owner','training_admin','manager'].includes(role)
  });

  async function token(){ return window.CM_AUTH?.getIdToken ? window.CM_AUTH.getIdToken() : null; }
  async function api(path, options={}){
    const t=await token(); if(!t) throw new Error('Sign in to continue.');
    const headers={...(options.headers||{}),Authorization:`Bearer ${t}`};
    if(options.body && !headers['Content-Type']) headers['Content-Type']='application/json';
    const res=await fetch(`${API}${path}`,{...options,headers});
    const data=await res.json().catch(()=>({}));
    if(!res.ok || data.ok===false) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function statusFor(x){
    if(x.complete) return {label:'Complete',tone:'complete'};
    if(x.started || x.final || x.roleLab || x.readiness || x.diagnostic || x.credential) return {label:'In progress',tone:'started'};
    return {label:'Not started',tone:'not-started'};
  }

  function gmailUrl(email, orgName, cohortName, inviteUrl){
    const subject=`${orgName} assigned you training in Capital Mastery`;
    const body=`Hi,\n\nYou've been added to ${cohortName} in Capital Mastery.\n\nOpen your secure invitation here:\n${inviteUrl}\n\nSign in or create your Capital Mastery account using this same email address. Your assigned program will show exactly what to complete and where to start.\n\nThanks.`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function hubMatch(){ const m=/^#\/employer\/([^/]+)\/cohort\/([^/]+)$/.exec(route()); return m ? {orgId:decodeURIComponent(m[1]),cohortId:decodeURIComponent(m[2])} : null; }
  function employerRoot(){ const m=/^#\/employer\/([^/]+)$/.exec(route()); return m ? decodeURIComponent(m[1]) : null; }

  function loadingHub(orgId){
    const main=document.querySelector('#app main#main'); if(!main) return;
    main.innerHTML=`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${esc(orgId)}">← Command center</a><div class="card cm-cohort-loading"><div class="eyebrow">COHORT HUB</div><h1>Loading cohort…</h1><p>Pulling the latest people, invitations, assignment and progress data.</p></div></div></section>`;
  }

  function personDetails(x, assignmentId, orgId){
    const s=statusFor(x);
    return `<div class="cm-cohort-person-detail" data-person-detail="${esc(x.uid)}">
      <button type="button" class="cm-cohort-close" data-close-person>Close ×</button>
      <div class="eyebrow">LEARNER PROGRESS</div><h2>${esc(x.name||x.email||'Learner')}</h2>
      <div class="cm-cohort-detail-grid">
        <div><span>Status</span><b>${esc(s.label)}</b></div>
        <div><span>Started</span><b>${x.startedAt?fmtTime(x.startedAt):(x.started?'Yes':'Not yet')}</b></div>
        <div><span>Last activity</span><b>${fmtTime(x.lastActivityAt)}</b></div>
        <div><span>Baseline</span><b>${x.diagnostic?`${Number(x.diagnostic.score)}%`:'—'}</b></div>
        <div><span>Readiness</span><b>${x.readiness?`${Number(x.readiness.overallScore)}%`:'—'}</b></div>
        <div><span>Evidence</span><b>${x.readiness?`${Number(x.readiness.evidenceCoverage)}%`:'—'}</b></div>
        <div><span>Role Lab</span><b>${x.roleLab?.score!=null?`${Number(x.roleLab.score)}%`:(x.roleLab?.status?String(x.roleLab.status).replace(/_/g,' '):'—')}</b></div>
        <div><span>Final</span><b>${x.final?.score!=null?`${Number(x.final.score)}%${x.final.passed?' · Passed':' · Attempted'}`:'—'}</b></div>
      </div>
      ${x.managerReview?`<div class="cm-cohort-review-note"><strong>Latest manager review</strong><p>${esc(x.managerReview.comment||'Review recorded')}</p></div>`:''}
      ${assignmentId?`<a class="btn btn-outline btn-sm" href="#/employer/${esc(orgId)}/reports?assignment=${encodeURIComponent(assignmentId)}">Open full readiness report →</a>`:''}
    </div>`;
  }

  async function renderHub(orgId, cohortId){
    const main=document.querySelector('#app main#main'); if(!main || rendering) return;
    const key=`${orgId}:${cohortId}`;
    if(main.dataset.cmCohortHub===key) return;
    rendering=true; lastHubKey=key; loadingHub(orgId);
    try{
      const [orgData, cohortsData, assignmentsData]=await Promise.all([
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}`),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts`),
        api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments`)
      ]);
      const role=orgData.membership?.role||'viewer', caps=capabilities(role);
      const cohort=(cohortsData.cohorts||[]).find(c=>c.id===cohortId);
      if(!cohort) throw new Error('Cohort not found.');
      const assignment=(assignmentsData.assignments||[]).find(a=>a.cohort_id===cohortId && a.status!=='archived') || null;
      let report=null, invites=[];
      if(caps.reports && assignment){
        const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(assignment.id)}`);
        report=r.assignments?.[0]||null;
      }
      if(caps.manage){
        const i=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`);
        invites=(i.invites||[]).filter(x=>x.cohort_id===cohortId);
      }
      const learners=report?.learners||[];
      const pending=invites.filter(x=>x.status==='pending' && (!x.expires_at || Date.parse(x.expires_at)>Date.now()));
      const started=learners.filter(x=>statusFor(x).label!=='Not started').length;
      const complete=learners.filter(x=>x.complete).length;
      const needAttention=learners.filter(x=>x.overdue || (x.roleLab && Number(x.roleLab.revisions||0)>0) || (x.readiness && Number(x.readiness.overallScore)<75)).length;
      const orgName=orgData.organization?.name||'Your organization';
      const track=assignment?.track||cohort.program_level;

      main.dataset.cmCohortHub=key;
      main.innerHTML=`<section class="cmv2-page cm-cohort-hub"><div class="container">
        <a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← All employer tools</a>
        <div class="cmv2-page-head cm-cohort-head"><div><div class="eyebrow">COHORT HUB</div><h1>${esc(cohort.name)}</h1><p>${esc(titleize(cohort.pathway_id))} · <strong>${esc(trackTitle(track))}</strong> · ${esc(cohort.status)}</p></div>
          <div class="cmv2-head-actions">${assignment?`<a class="btn btn-outline" href="#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}">Curriculum</a>`:''}${caps.reports&&assignment?`<a class="btn btn-primary" href="#/employer/${encodeURIComponent(orgId)}/reports?assignment=${encodeURIComponent(assignment.id)}">Full report →</a>`:''}</div>
        </div>
        <div class="cmv2-kpis cmv2-kpis-6 cm-cohort-kpis">
          <div class="card"><strong>${learners.length}</strong><span>In cohort</span></div>
          <div class="card"><strong>${pending.length}</strong><span>Pending invites</span></div>
          <div class="card"><strong>${started}</strong><span>Started</span></div>
          <div class="card"><strong>${complete}</strong><span>Complete</span></div>
          <div class="card"><strong>${needAttention}</strong><span>Need attention</span></div>
          <div class="card"><strong>${fmtDate(assignment?.due_at||cohort.deadline_at)}</strong><span>Deadline</span></div>
        </div>

        <div class="cm-cohort-top-grid">
          ${caps.manage?`<section class="card cm-cohort-add"><div class="eyebrow">ADD LEARNERS</div><h2>Add people to this cohort</h2><p>Enter one or more email addresses. Each person gets a secure invite tied directly to this cohort and its assigned track.</p>
            <form id="cm-cohort-add-form"><label>Employee / intern emails<textarea name="emails" rows="4" required placeholder="intern1@company.com\nintern2@company.com"></textarea></label><div class="cmv2-form-status" aria-live="polite"></div><button class="btn btn-primary" type="submit">Create Invitations →</button></form><div id="cm-cohort-new-invites"></div></section>`:''}
          <section class="card cm-cohort-program"><div class="eyebrow">ASSIGNED PROGRAM</div><h2>${esc(titleize(cohort.pathway_id))}</h2><div class="cm-cohort-program-lines"><div><span>Required track</span><b>${esc(trackTitle(track))}</b></div><div><span>Assignment status</span><b>${esc(assignment?.status||'No assignment')}</b></div><div><span>People cannot switch tracks</span><b>${assignment?'Enforced':'—'}</b></div></div>
            ${caps.manage?`<form id="cm-cohort-deadline-form" class="cm-cohort-deadline"><label>Deadline<input type="date" name="deadline" value="${esc(String(assignment?.due_at||cohort.deadline_at||'').slice(0,10))}"></label><button class="btn btn-soft btn-sm" type="submit">Save deadline</button><span class="cmv2-form-status"></span></form>`:''}
          </section>
        </div>

        <section class="card cm-cohort-people"><div class="cmv2-card-head"><div><div class="eyebrow">PEOPLE & PROGRESS</div><h2>Everyone in ${esc(cohort.name)}</h2><p>Opening the assignment or attempting work counts as started—even when an assessment is failed.</p></div>${caps.manage?`<button class="btn btn-soft btn-sm" type="button" data-focus-add>+ Add people</button>`:''}</div>
          ${caps.reports?`<div class="cmv2-table-scroll"><table class="cmv2-report-table cm-cohort-table"><thead><tr><th>Person</th><th>Status</th><th>Last activity</th><th>Readiness</th><th>Evidence</th><th>Action</th></tr></thead><tbody>
            ${learners.map((x,i)=>{const s=statusFor(x);return `<tr><td><b>${esc(x.name||x.email||'Learner')}</b><small>${esc(x.email||'')}</small></td><td><span class="cm-cohort-status ${s.tone}">${esc(s.label)}</span>${x.overdue?'<small class="cm-cohort-overdue">Overdue</small>':''}</td><td>${esc(fmtTime(x.lastActivityAt||x.startedAt))}</td><td>${x.readiness?`${Number(x.readiness.overallScore)}%`:'—'}</td><td>${x.readiness?`${Number(x.readiness.evidenceCoverage)}%`:'—'}</td><td><button class="cmv2-signal-btn neutral" type="button" data-open-person="${i}"><b>View progress</b><span>Attempts, work & evidence</span></button></td></tr>`}).join('') || '<tr><td colspan="6">No accepted learners yet.</td></tr>'}
            ${pending.map(x=>`<tr class="cm-cohort-pending-row"><td><b>${esc(x.email_normalized)}</b><small>Invitation sent / created</small></td><td><span class="cm-cohort-status pending">Pending invite</span></td><td>—</td><td>—</td><td>—</td><td>${caps.manage?`<button class="btn btn-soft btn-sm" type="button" data-fresh-invite="${esc(x.email_normalized)}">Email fresh invite</button>`:''}</td></tr>`).join('')}
          </tbody></table></div><div id="cm-cohort-person-detail"></div>`:`<div class="cmv2-privacy-boundary"><h3>Learner progress is restricted for this workspace role.</h3><p>You can inspect the cohort and assigned curriculum, but employee performance is intentionally limited to authorized reporting roles.</p></div>`}
        </section>
      </div></section>`;

      document.querySelector('[data-focus-add]')?.addEventListener('click',()=>document.querySelector('#cm-cohort-add-form textarea')?.focus());
      document.querySelectorAll('[data-open-person]').forEach(btn=>btn.addEventListener('click',()=>{
        const x=learners[Number(btn.dataset.openPerson)]; const box=document.getElementById('cm-cohort-person-detail'); if(!box||!x)return; box.innerHTML=personDetails(x,assignment?.id||'',orgId); box.scrollIntoView({behavior:'smooth',block:'nearest'}); box.querySelector('[data-close-person]')?.addEventListener('click',()=>box.innerHTML='');
      }));

      async function createInvite(email, openGmail=false){
        const r=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`,{method:'POST',body:JSON.stringify({email,role:'learner',cohortId,expiresDays:14})});
        const inviteUrl=`${location.origin}${location.pathname}#/join/${encodeURIComponent(r.invite.token)}`;
        if(openGmail) window.open(gmailUrl(email,orgName,cohort.name,inviteUrl),'_blank','noopener');
        return {email,inviteUrl};
      }

      document.getElementById('cm-cohort-add-form')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget, st=form.querySelector('.cmv2-form-status'), btn=form.querySelector('button[type="submit"]');
        const emails=String(new FormData(form).get('emails')||'').split(/[\n,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
        if(!emails.length){st.textContent='Enter at least one email address.';return;}
        btn.disabled=true; st.textContent='Creating secure invitations…'; const made=[]; const failed=[];
        for(const email of emails){try{made.push(await createInvite(email,false));}catch(err){failed.push({email,error:err.message});}}
        const box=document.getElementById('cm-cohort-new-invites');
        if(box) box.innerHTML=`${made.length?`<div class="cm-cohort-created"><strong>${made.length} invitation${made.length===1?'':'s'} ready</strong><p>Open each Gmail draft below. Each draft is addressed only to that learner with their own secure link.</p>${made.map(x=>`<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="${esc(gmailUrl(x.email,orgName,cohort.name,x.inviteUrl))}">Email ${esc(x.email)} in Gmail →</a>`).join('')}</div>`:''}${failed.length?`<div class="cmv2-warning-soft">${failed.map(x=>`${esc(x.email)}: ${esc(x.error)}`).join('<br>')}</div>`:''}`;
        st.textContent=failed.length?'Some invitations need attention.':'Invitations created successfully.'; form.reset(); btn.disabled=false;
      });

      document.querySelectorAll('[data-fresh-invite]').forEach(btn=>btn.addEventListener('click',async()=>{
        const email=btn.dataset.freshInvite; btn.disabled=true; const old=btn.textContent; btn.textContent='Creating…';
        try{await createInvite(email,true);btn.textContent='Gmail opened ✓';}catch(err){btn.textContent=err.message;setTimeout(()=>{btn.textContent=old;btn.disabled=false;},2500);}
      }));

      document.getElementById('cm-cohort-deadline-form')?.addEventListener('submit',async e=>{
        e.preventDefault(); const form=e.currentTarget, st=form.querySelector('.cmv2-form-status'), btn=form.querySelector('button'); btn.disabled=true; st.textContent='Saving…';
        const value=String(new FormData(form).get('deadline')||''); const due=value?new Date(`${value}T23:59:59`).toISOString():null;
        try{
          await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts/${encodeURIComponent(cohortId)}`,{method:'PATCH',body:JSON.stringify({deadlineAt:due})});
          if(assignment) await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/assignments/${encodeURIComponent(assignment.id)}`,{method:'PATCH',body:JSON.stringify({dueAt:due})});
          st.textContent='Deadline saved.'; setTimeout(()=>{main.removeAttribute('data-cm-cohort-hub');renderHub(orgId,cohortId);},500);
        }catch(err){st.textContent=err.message;btn.disabled=false;}
      });
    }catch(err){
      main.innerHTML=`<section class="cmv2-page"><div class="container cmv2-narrow"><a class="cmv2-back" href="#/employer/${encodeURIComponent(orgId)}">← Command center</a><div class="card cmv2-error"><div class="eyebrow">COHORT HUB</div><h1>Could not open this cohort.</h1><p>${esc(err.message)}</p></div></div></section>`;
    }finally{rendering=false;}
  }

  async function enhanceCommandCenter(orgId){
    const main=document.querySelector('#app main#main'); if(!main || main.dataset.cmCohortsEnhanced===orgId) return;
    const cohortCard=[...main.querySelectorAll('.card')].find(card=>card.querySelector('.eyebrow')?.textContent.trim()==='COHORTS');
    if(!cohortCard) return;
    try{
      let cohorts=cache.get(orgId); if(!cohorts){const d=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/cohorts`);cohorts=d.cohorts||[];cache.set(orgId,cohorts);setTimeout(()=>cache.delete(orgId),15000);}
      const byName=new Map(cohorts.map(c=>[String(c.name),c]));
      cohortCard.querySelectorAll('.cmv2-list-row').forEach(row=>{
        const name=row.querySelector('b')?.textContent?.trim(); const cohort=byName.get(name); if(!cohort||row.dataset.cmCohortLink)return;
        row.dataset.cmCohortLink=cohort.id; row.tabIndex=0; row.setAttribute('role','link'); row.setAttribute('aria-label',`Open cohort ${name}`); row.classList.add('cm-cohort-clickable');
        const right=row.children?.[1]; if(right){const open=document.createElement('button');open.type='button';open.className='cm-cohort-open-button';open.textContent='Open cohort →';open.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();location.hash=`#/employer/${encodeURIComponent(orgId)}/cohort/${encodeURIComponent(cohort.id)}`;});right.appendChild(open);}
        row.addEventListener('click',()=>location.hash=`#/employer/${encodeURIComponent(orgId)}/cohort/${encodeURIComponent(cohort.id)}`);
        row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();location.hash=`#/employer/${encodeURIComponent(orgId)}/cohort/${encodeURIComponent(cohort.id)}`;}});
      });
      main.dataset.cmCohortsEnhanced=orgId;
    }catch{}
  }

  function run(){
    const hub=hubMatch(); if(hub){renderHub(hub.orgId,hub.cohortId);return;}
    const orgId=employerRoot(); if(orgId) enhanceCommandCenter(orgId);
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;run();},40);}
  window.addEventListener('hashchange',schedule);
  document.addEventListener('cm-auth-changed',schedule);
  const app=document.getElementById('app'); if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});

  const style=document.createElement('style'); style.id='cm-cohort-hub-style'; style.textContent=`
    .cm-cohort-clickable{cursor:pointer;transition:background .15s ease,border-color .15s ease}.cm-cohort-clickable:hover,.cm-cohort-clickable:focus{background:#f5f8fb;outline:2px solid rgba(12,77,132,.16);outline-offset:2px}.cm-cohort-open-button{display:block;margin-top:6px;border:0;background:transparent;color:#0c4d84;font-weight:800;font-size:.78rem;cursor:pointer;padding:0}
    .cm-cohort-top-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:18px;margin:18px 0}.cm-cohort-add textarea{width:100%;margin-top:6px}.cm-cohort-created{display:grid;gap:8px;margin-top:14px;padding:12px;border-radius:12px;background:#f4f8fb}.cm-cohort-created .btn{justify-content:flex-start;width:100%}.cm-cohort-program-lines{display:grid;gap:10px;margin:16px 0}.cm-cohort-program-lines>div{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid #e7ebef}.cm-cohort-program-lines span{color:#607080}.cm-cohort-deadline{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.cm-cohort-deadline label{flex:1;min-width:190px}.cm-cohort-table td{vertical-align:middle}.cm-cohort-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:.75rem;font-weight:800}.cm-cohort-status.complete{background:#e9f7ef;color:#17663a}.cm-cohort-status.started{background:#edf5fb;color:#0c4d84}.cm-cohort-status.not-started{background:#f3f4f6;color:#59636e}.cm-cohort-status.pending{background:#fff6df;color:#7c5b06}.cm-cohort-overdue{display:block;color:#a63a2d;margin-top:4px}.cm-cohort-person-detail{position:relative;margin-top:18px;padding:18px;border:1px solid #dce3e8;border-radius:14px;background:#f8fafc}.cm-cohort-close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#526170;cursor:pointer}.cm-cohort-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.cm-cohort-detail-grid>div{padding:12px;border-radius:10px;background:#fff;border:1px solid #e3e8ed}.cm-cohort-detail-grid span{display:block;color:#667586;font-size:.76rem;margin-bottom:4px}.cm-cohort-review-note{margin:12px 0;padding:12px;border-left:3px solid #d8b55c;background:#fff}.cm-cohort-review-note p{margin:4px 0 0}.cm-cohort-loading{margin-top:20px}.cm-cohort-kpis .card strong{font-size:1.35rem}
    @media(max-width:900px){.cm-cohort-top-grid{grid-template-columns:1fr}.cm-cohort-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:600px){.cm-cohort-detail-grid{grid-template-columns:1fr}.cm-cohort-program-lines>div{display:grid;gap:4px}.cm-cohort-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  `; document.head.appendChild(style); schedule();
})();