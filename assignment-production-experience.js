(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  const ACTIVE_ASSIGNMENT_KEY = 'cmActiveEmployerAssignmentV1';
  const reportCache = new Map();
  const assignmentCache = new Map();
  const recorded = new Set();
  const nativeFetch = window.fetch.bind(window);

  function esc(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function route() {
    const raw = String(location.hash || '#/').replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(query) };
  }

  function publicPathway(id) { return id === 'quantitative-finance' ? 'quant-finance' : id; }
  function apiPathway(id) { return id === 'quant-finance' ? 'quantitative-finance' : id; }
  function assignedTrackName(track) { return track === 'career_skills' ? 'Career Skills' : 'Professional Readiness'; }

  function assignmentIdFromRoute() {
    const r = route();
    if (r.parts[0] === 'assigned' && r.parts[1]) return decodeURIComponent(r.parts[1]);
    return r.query.get('assignment') || '';
  }

  function appendAssignment(href, assignmentId) {
    if (!href || !href.startsWith('#/')) return href;
    const allowed = /#\/(career|learn|quiz|diagnostic|v2-assessment|role-lab|official-simulation|simulation|readiness|skills)\//;
    if (!allowed.test(href)) return href;
    const [base, query = ''] = href.split('?');
    const params = new URLSearchParams(query);
    params.set('assignment', assignmentId);
    return `${base}?${params.toString()}`;
  }

  async function token() {
    return window.CM_AUTH?.getIdToken ? window.CM_AUTH.getIdToken() : null;
  }

  async function api(path, options = {}) {
    const idToken = await token();
    if (!idToken) throw new Error('Sign in to continue.');
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${idToken}` };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await nativeFetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  }

  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    try {
      const input = args[0];
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('/readiness-report?')) {
        const data = await response.clone().json();
        const report = data?.assignments?.[0];
        if (report?.assignment?.id) {
          reportCache.set(report.assignment.id, { orgId: data.orgId || '', report, cachedAt: Date.now() });
        }
      }
    } catch (_) {}
    return response;
  };

  async function loadAssignment(id) {
    if (!id) return null;
    if (assignmentCache.has(id)) return assignmentCache.get(id);
    const promise = api(`/enterprise/learner/assignments/${encodeURIComponent(id)}`).then(data => data.assignment);
    assignmentCache.set(id, promise);
    try { return await promise; }
    catch (error) { assignmentCache.delete(id); throw error; }
  }

  async function recordOpen(id) {
    if (!id || recorded.has(id)) return;
    recorded.add(id);
    try {
      await api(`/enterprise/learner/assignments/${encodeURIComponent(id)}/activity`, { method: 'POST', body: '{}' });
    } catch (_) {
      recorded.delete(id);
    }
  }

  function credentialSet(report) {
    return new Set((report?.credentials || []).filter(c => c.status === 'active').map(c => c.level));
  }

  function nextStep(assignment, report) {
    const levels = credentialSet(report);
    const pathway = publicPathway(assignment.pathwayId);
    const apiId = apiPathway(pathway);
    const id = encodeURIComponent(assignment.id);
    const pub = encodeURIComponent(pathway);
    const apiPath = encodeURIComponent(apiId);
    const essentialsKey = encodeURIComponent(apiId === 'investment-banking' ? 'ib-essentials-case' : `${apiId}-essentials-case`);
    const finalKey = encodeURIComponent(apiId === 'investment-banking' ? 'ib-professional-final' : `${apiId}-professional-final`);

    if (!levels.has('foundations')) return { label:'Start with Foundations', copy:'Begin here. Learn the role and technical core before the first required assessment.', href:`#/learn/${pub}/1?assignment=${id}` };

    if (assignment.track === 'career_skills') {
      if (!levels.has('essentials')) return { label:'Continue to Essentials', copy:'Your Foundations work is saved. Complete the required Essentials Mini Case next.', href:`#/v2-assessment/${essentialsKey}?assignment=${id}` };
      if (!levels.has('applied')) return { label:'Continue Applied Skills', copy:'Complete the practical toolkit and applied work. Your earned stages stay saved.', href:`#/learn/${pub}/3?assignment=${id}` };
      if (report?.programCompletion?.status !== 'active') return { label:'Complete the Career Skills Capstone', copy:'Finish the employer-assigned practical capstone to complete this program.', href:`#/official-simulation/${pub}?assignment=${id}` };
      return { label:'Assignment complete', copy:'Your Career Skills assignment is verified and saved.', href:`#/assigned/${id}` };
    }

    if (!report?.diagnostic) return { label:'Take the Baseline Diagnostic', copy:'Foundations are saved. Record the required baseline before advanced work.', href:`#/diagnostic/${apiPath}?assignment=${id}` };
    if (!levels.has('essentials')) return { label:'Continue to Essentials', copy:'Your baseline is saved. Complete the required Essentials Mini Case.', href:`#/v2-assessment/${essentialsKey}?assignment=${id}` };
    if (!levels.has('applied')) return { label:'Continue Applied Skills', copy:'Complete the professional toolkit and applied work next.', href:`#/learn/${pub}/3?assignment=${id}` };
    if (!levels.has('role_lab') && report?.roleLab?.status !== 'completed' && report?.roleLab?.status !== 'passed') return { label:'Open the Role Lab', copy:'Your prerequisites are saved. Perform the full employer-assigned professional workflow.', href:`#/role-lab/${apiPath}?assignment=${id}` };
    if (!report?.finalAssessment?.passed) return { label:'Take the Professional Final', copy:'Role Lab progress is saved. Complete the final required assessment.', href:`#/v2-assessment/${finalKey}?assignment=${id}` };
    return { label:'Review Readiness', copy:'Required work is complete. Review your saved evidence and readiness status.', href:`#/readiness/${apiPath}?assignment=${id}` };
  }

  async function decorateAssignedPage(id) {
    const main = document.querySelector('#app main#main');
    if (!main || main.querySelector('[data-cm-assignment-guidance]')) return;
    const hero = main.querySelector('.cmv2-assignment-hero');
    if (!hero || !window.CM_AUTH?.user) return;

    try {
      const assignment = await loadAssignment(id);
      sessionStorage.setItem(ACTIVE_ASSIGNMENT_KEY, id);
      await recordOpen(id);
      const data = await api(`/enterprise/learner/readiness-report/${encodeURIComponent(assignment.pathwayId)}?assignmentId=${encodeURIComponent(id)}`);
      const step = nextStep(assignment, data);
      const trackName = assignedTrackName(assignment.track);
      const due = assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : 'No deadline';

      const card = document.createElement('section');
      card.dataset.cmAssignmentGuidance = 'true';
      card.className = 'card cm-assignment-guidance';
      card.innerHTML = `
        <div class="cm-assignment-guide-top">
          <div><div class="eyebrow">EMPLOYER-ASSIGNED TRAINING · REQUIRED</div><h2>You have been assigned ${esc(trackName)}.</h2><p>Complete this exact program level for <strong>${esc(assignment.organizationName || 'your employer')}</strong>. The program level is locked for this assignment, so you cannot switch it to a different track.</p></div>
          <div class="cm-assignment-guide-meta"><span>Program</span><b>${esc(trackName)}</b><span>Due</span><b>${esc(due)}</b></div>
        </div>
        <div class="cm-assignment-start-here"><div><span>START HERE / CONTINUE HERE</span><h3>${esc(step.label)}</h3><p>${esc(step.copy)}</p></div><a class="btn btn-primary" href="${esc(step.href)}">${esc(step.label)} →</a></div>
        <div class="cm-assignment-save-note"><strong>✓ Progress saves automatically.</strong> Your assignment activity, assessment attempts, scores, evidence, and completion records are tied to your signed-in account. You can leave and resume later without starting over.</div>`;
      hero.insertAdjacentElement('afterend', card);

      main.querySelectorAll('a[href^="#/"]').forEach(link => {
        const next = appendAssignment(link.getAttribute('href'), id);
        if (next && next !== link.getAttribute('href')) link.setAttribute('href', next);
      });

      const trackApi = window.CM_TRAINING_TRACKS;
      if (trackApi) trackApi.setTrack(publicPathway(assignment.pathwayId), assignment.track === 'career_skills' ? trackApi.CAREER_SKILLS : trackApi.PROFESSIONAL);
    } catch (error) {
      console.warn('Assignment guidance could not finish loading', error);
    }
  }

  async function enforceScopedTrack(id) {
    if (!id || !window.CM_AUTH?.user) return;
    try {
      const assignment = await loadAssignment(id);
      const r = route();
      const trackApi = window.CM_TRAINING_TRACKS;
      const publicId = publicPathway(assignment.pathwayId);
      const required = assignment.track === 'career_skills' ? trackApi?.CAREER_SKILLS : trackApi?.PROFESSIONAL;
      if (trackApi && required && trackApi.getTrack(publicId) !== required) trackApi.setTrack(publicId, required);

      const isProfessionalOnly = r.parts[0] === 'role-lab' || (r.parts[0] === 'v2-assessment' && /professional-final$/i.test(r.parts[1] || ''));
      const isCareerSkillsOnly = ['official-simulation','simulation'].includes(r.parts[0]);
      if ((assignment.track === 'career_skills' && isProfessionalOnly) || (assignment.track === 'professional' && isCareerSkillsOnly)) {
        location.replace(`#/assigned/${encodeURIComponent(id)}`);
        return;
      }

      document.querySelectorAll('[data-cm-select-track],[data-cm-switch-track]').forEach(button => {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        button.title = `This employer assignment requires ${assignedTrackName(assignment.track)}.`;
        if (button.matches('[data-cm-select-track]')) button.textContent = button.getAttribute('aria-pressed') === 'true' ? 'Employer assigned ✓' : 'Not available for this assignment';
      });

      const chooser = document.querySelector('[data-cm-track-chooser] .cm-track-panel');
      if (chooser && !chooser.querySelector('[data-cm-assigned-track-lock]')) {
        chooser.insertAdjacentHTML('afterbegin', `<div class="cm-assigned-track-lock" data-cm-assigned-track-lock><strong>🔒 Employer-assigned program:</strong> ${esc(assignedTrackName(assignment.track))}. Complete the assigned level; track switching is disabled for this assignment. <a href="#/assigned/${encodeURIComponent(id)}">Return to assignment</a></div>`);
      }

      const learningStatus = document.querySelector('[data-cm-track-learning-status]');
      const change = learningStatus?.querySelector('a');
      if (change) {
        change.href = `#/assigned/${encodeURIComponent(id)}`;
        change.textContent = 'Employer-assigned level · Back to assignment';
      }
    } catch (_) {}
  }

  function secureGmailDraft(email, inviteUrl, context) {
    const subject = `Capital Mastery assignment: ${context.cohort}`;
    const body = `Hi,\n\nYou have been assigned ${context.program} in Capital Mastery.\n\nStart here: ${inviteUrl}\n\nPlease use this same email address when signing in. Your employer-assigned program level is required, and your progress saves to your account automatically so you can leave and resume later.\n\nDue: ${context.due}\n\nThank you.`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function decorateInviteSuccess() {
    const success = document.querySelector('.cmv2-success');
    const inviteBox = success?.querySelector('.cmv2-invite-links');
    if (!success || !inviteBox || inviteBox.querySelector('[data-cm-send-gmail]')) return;
    const rows = [...inviteBox.querySelectorAll('.cmv2-invite-row')].map(row => ({
      email: row.querySelector('span')?.textContent?.trim() || '',
      url: row.querySelector('[data-copy]')?.dataset.copy || ''
    })).filter(x => x.email && x.url);
    if (!rows.length) return;

    const cohort = success.querySelector('h1')?.textContent?.trim() || 'Capital Mastery training';
    const program = success.querySelector('h1 + p')?.textContent?.trim() || 'assigned training';
    const due = [...success.querySelectorAll('.cmv2-success-meta div')].find(x => /deadline/i.test(x.textContent || ''))?.querySelector('b')?.textContent?.trim() || 'No deadline';
    const context = { cohort, program, due };

    const wrap = document.createElement('div');
    wrap.className = 'cm-gmail-send-wrap';
    wrap.innerHTML = `<button class="btn btn-gold" type="button" data-cm-send-gmail>Send to Employees in Gmail →</button><p>Secure mode: each employee gets a separate pre-filled Gmail draft containing only their own private invitation link. Review and click Send.</p><div class="cm-gmail-draft-fallback"></div>`;
    inviteBox.prepend(wrap);

    wrap.querySelector('[data-cm-send-gmail]')?.addEventListener('click', () => {
      let blocked = 0;
      rows.forEach(row => {
        const opened = window.open(secureGmailDraft(row.email, row.url, context), '_blank', 'noopener');
        if (!opened) blocked += 1;
      });
      const fallback = wrap.querySelector('.cm-gmail-draft-fallback');
      if (blocked && fallback) {
        fallback.innerHTML = `<p><strong>Your browser blocked some Gmail tabs.</strong> Open the remaining drafts below:</p>${rows.map(row => `<a class="btn btn-outline btn-sm" target="_blank" rel="noopener" href="${esc(secureGmailDraft(row.email, row.url, context))}">Gmail draft · ${esc(row.email)}</a>`).join(' ')}`;
      }
    });
  }

  function latestReportForCurrentOrg() {
    const r = route();
    const orgId = r.parts[0] === 'employer' ? (r.parts[1] || '') : '';
    const entries = [...reportCache.values()].filter(item => !orgId || item.orgId === orgId).sort((a,b) => b.cachedAt - a.cachedAt);
    return entries[0]?.report || null;
  }

  function patchEmployerStartedUi() {
    const report = latestReportForCurrentOrg();
    if (!report?.learners?.length) return;
    const startedCount = report.learners.filter(x => x.started).length;

    document.querySelectorAll('.cmv2-kpis .card').forEach(card => {
      const label = card.querySelector('span')?.textContent?.trim();
      if (label === 'Started') {
        const strong = card.querySelector('strong');
        if (strong) strong.textContent = String(startedCount);
      }
    });

    report.learners.forEach((learner, index) => {
      if (!learner.started) return;
      const row = document.querySelector(`[data-report-learner="${index}"]`);
      const stage = row?.querySelector('.cmv2-stage-pill');
      if (stage && /not started|not complete/i.test(stage.textContent || '')) {
        stage.textContent = 'Started · In progress';
        stage.classList.remove('muted');
        stage.classList.add('active');
      }
      const signal = row?.querySelector('.cmv2-signal-btn');
      const signalTitle = signal?.querySelector('b');
      if (signalTitle && /not started/i.test(signalTitle.textContent || '')) {
        signalTitle.textContent = 'In progress';
        const copy = signal.querySelector('span');
        if (copy) copy.textContent = 'Assignment opened; monitor the next required stage';
        signal.classList.add('neutral');
      }
    });

    document.querySelectorAll('.cmv2-attention-list article').forEach(article => {
      const name = article.querySelector('div b')?.textContent?.trim();
      const learner = report.learners.find(x => (x.name || x.email || 'Learner') === name);
      if (learner?.started && /not started|no baseline/i.test(article.textContent || '')) article.remove();
    });

    document.querySelectorAll('.cmv2-attention-mini > div').forEach(item => {
      const name = item.querySelector('b')?.textContent?.trim();
      const learner = report.learners.find(x => (x.name || x.email || 'Learner') === name);
      if (learner?.started && /not started/i.test(item.textContent || '')) item.remove();
    });
  }

  function activeAssignmentForFlow() {
    const r = route();
    const direct = assignmentIdFromRoute();
    if (direct) return direct;
    const flowRoutes = new Set(['career','learn','quiz','diagnostic','v2-assessment','role-lab','official-simulation','simulation','readiness','skills']);
    if (flowRoutes.has(r.parts[0])) return sessionStorage.getItem(ACTIVE_ASSIGNMENT_KEY) || '';
    if (!['assigned'].includes(r.parts[0])) sessionStorage.removeItem(ACTIVE_ASSIGNMENT_KEY);
    return '';
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(async () => {
      scheduled = false;
      const r = route();
      if (r.parts[0] === 'assigned' && r.parts[1]) await decorateAssignedPage(decodeURIComponent(r.parts[1]));
      const active = activeAssignmentForFlow();
      if (active && !(r.parts[0] === 'assigned' && r.parts[1])) await enforceScopedTrack(active);
      decorateInviteSuccess();
      patchEmployerStartedUi();
    });
  }

  document.addEventListener('click', event => {
    const active = activeAssignmentForFlow();
    if (!active) return;
    const switcher = event.target.closest('[data-cm-select-track],[data-cm-switch-track]');
    if (switcher) {
      event.preventDefault();
      event.stopImmediatePropagation();
      schedule();
    }
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .cm-assignment-guidance{margin:18px 0 22px;border:1px solid rgba(185,138,67,.42);box-shadow:0 10px 30px rgba(7,26,51,.08)}
    .cm-assignment-guide-top{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:start}.cm-assignment-guide-top h2{margin:5px 0 8px;color:var(--navy)}
    .cm-assignment-guide-meta{min-width:185px;padding:13px;border-radius:12px;background:#f6f8fa;display:grid;gap:4px}.cm-assignment-guide-meta span{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#6f7a86;font-weight:800}.cm-assignment-guide-meta b{color:var(--navy);margin-bottom:6px}
    .cm-assignment-start-here{margin-top:16px;padding:16px;border-radius:13px;background:#071a33;color:white;display:flex;justify-content:space-between;align-items:center;gap:18px}.cm-assignment-start-here span{font-size:.72rem;letter-spacing:.1em;font-weight:850;color:#d6ad6d}.cm-assignment-start-here h3{color:white;margin:4px 0}.cm-assignment-start-here p{margin:0;color:#dbe3eb}
    .cm-assignment-save-note{margin-top:12px;padding:11px 13px;background:#eef7f2;border:1px solid #cfe5d7;border-radius:10px;color:#335a44;font-size:.86rem}
    .cm-assigned-track-lock{margin:0 0 16px;padding:12px 14px;border:1px solid #dfc99e;background:#fff8e9;border-radius:10px;color:#5a4828}.cm-assigned-track-lock a{font-weight:800}
    .cm-gmail-send-wrap{padding:14px;margin-bottom:14px;border:1px solid #d8e1e9;background:#f8fafb;border-radius:12px}.cm-gmail-send-wrap p{margin:8px 0 0;font-size:.82rem;color:#5c6975}.cm-gmail-draft-fallback{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cm-gmail-draft-fallback p{width:100%}
    @media(max-width:720px){.cm-assignment-guide-top{grid-template-columns:1fr}.cm-assignment-start-here{align-items:stretch;flex-direction:column}.cm-assignment-start-here .btn{width:100%}}
  `;
  document.head.appendChild(style);

  window.addEventListener('hashchange', schedule);
  document.addEventListener('cm-auth-changed', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, { childList:true, subtree:true });
  schedule();
})();
