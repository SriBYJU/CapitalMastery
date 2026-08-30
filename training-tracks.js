(() => {
  'use strict';

  const STORE_PREFIX = 'capitalMasteryTrainingTrackV1:';
  const NOTICE_KEY = 'capitalMasteryTrainingTrackNoticeV1';
  const CAREER_SKILLS = 'career-skills';
  const PROFESSIONAL = 'professional-readiness';

  const TRACKS = {
    [CAREER_SKILLS]: {
      name: 'Career Skills Program',
      kicker: 'SHORTER · PRACTICAL · CREDENTIALED',
      awardCount: 4,
      verifiedCredentialCount: 4,
      summary: 'Learn the role, practice the major technical and professional skills, complete applied work and finish a compact realistic job simulation.',
      milestones: [
        'Foundations credential',
        'Essentials credential',
        'Applied Skills credential',
        'Career Skills Certificate'
      ],
      evidenceModel: '4 verified credentials · Career Skills ends at the practical capstone'
    },
    [PROFESSIONAL]: {
      name: 'Professional Readiness Program',
      kicker: 'ADVANCED · FULL JOB-READINESS · FLAGSHIP',
      awardCount: 5,
      verifiedCredentialCount: 5,
      summary: 'Train through the full workflow, produce professional work, complete the Role Lab, respond to review and pass the Professional Readiness Final.',
      milestones: [
        'Foundations credential',
        'Essentials credential',
        'Applied Skills credential',
        'Role Lab credential',
        'Professional Readiness credential'
      ],
      evidenceModel: '5 Standard 2.0 career credentials'
    }
  };

  function esc(value='') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function routeParts() {
    return (location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  }

  function routeContext() {
    const p = routeParts();
    const route = p[0] || '';
    const pathwayRoutes = new Set(['career','learn','quiz','simulation','official-simulation','final','role-lab']);
    const pathwayId = pathwayRoutes.has(route) && p[1] ? decodeURIComponent(p[1]) : '';
    return { route, pathwayId, parts:p };
  }

  function storedTrack(careerId) {
    if (!careerId) return null;
    const saved = localStorage.getItem(STORE_PREFIX + careerId);
    return saved === CAREER_SKILLS || saved === PROFESSIONAL ? saved : null;
  }

  function getTrack(careerId) {
    // Preserve the pre-existing full pathway for learners who have not made a
    // track choice yet. Career Skills becomes active only after an explicit choice.
    return storedTrack(careerId) || PROFESSIONAL;
  }

  function adminQaPreviewActive() {
    return window.CM_AUTH?.ready === true &&
      window.CM_AUTH?.isAdmin === true &&
      localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';
  }

  function setTrack(careerId, track) {
    if (!careerId || !TRACKS[track]) return;
    localStorage.setItem(STORE_PREFIX + careerId, track);
    apply();
    window.dispatchEvent(new CustomEvent('capitalmastery:trackchange', {
      detail: { careerId, track }
    }));
  }

  function chooserHtml(careerId) {
    const selected = getTrack(careerId);
    const card = id => {
      const t = TRACKS[id];
      const professional = id === PROFESSIONAL;
      return `<article class="cm-track-card" data-cm-track-card="${id}" data-selected="${selected===id}">
        <div class="cm-track-kicker">${esc(t.kicker)}</div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.summary)}</p>
        <div class="cm-track-meta">
          <span>${t.verifiedCredentialCount} credentials</span>
          <span>${professional?'Full Role Lab + final':'Shorter capstone simulation'}</span>
          <span>${professional?'Highest career credential':'Upgrade anytime'}</span>
        </div>
        <ul class="cm-track-credentials">${t.milestones.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
        <div class="cm-track-evidence-model">${esc(t.evidenceModel)}</div>
        <button class="btn ${selected===id?'btn-gold':'btn-outline'}" type="button" data-cm-select-track="${id}" aria-pressed="${selected===id}">${selected===id?'Selected':'Choose this program'}</button>
      </article>`;
    };
    return `<section class="cm-track-shell" data-cm-track-chooser><div class="container"><div class="cm-track-panel">
      <div class="eyebrow">CHOOSE YOUR LEVEL OF PREPARATION</div>
      <h2>One career. Two levels of training.</h2>
      <p>Start with the shorter practical program or go all the way to full Professional Readiness. Your completed work carries forward, so upgrading never means repeating earned stages.</p>
      <div class="cm-track-grid">${card(CAREER_SKILLS)}${card(PROFESSIONAL)}</div>
      <div class="cm-track-stack"><strong>Stacking rule:</strong> Career Skills is an on-ramp, not a separate dead end. Foundations, Essentials and Applied Skills carry directly into Professional Readiness. The advanced path adds the full Role Lab, reviewer-quality work and the Professional Readiness Final.</div>
    </div></div></section>`;
  }

  function selectedStatusHtml(track) {
    const t = TRACKS[track];
    const professional = track === PROFESSIONAL;
    return `<div class="cm-track-status" data-cm-track-status data-cm-track-status-id="${track}">
      <div>
        <strong>${esc(t.name)}</strong>
        <span class="cm-track-badge">${t.verifiedCredentialCount} credentials</span>
        <p>${professional
          ? 'Complete the full pathway, Role Lab and Professional Readiness Final.'
          : 'Complete the core pathway and practical capstone to earn the Career Skills Certificate. Switch to Professional Readiness later without repeating completed stages.'}</p>
      </div>
      <button type="button" class="btn btn-soft btn-sm" data-cm-switch-track="${professional?CAREER_SKILLS:PROFESSIONAL}">${professional?'View shorter option':'Upgrade to Professional Readiness'}</button>
    </div>`;
  }

  function setAdvancedGateState(finalStep, careerId, track) {
    if (!finalStep) return;
    const link = finalStep.querySelector('a.btn');
    finalStep.classList.add('cm-pr-only');
    finalStep.classList.toggle('cm-track-locked', track !== PROFESSIONAL);

    if (track !== PROFESSIONAL) {
      if (link) {
        if (link.getAttribute('href')) link.dataset.cmOriginalHref = link.getAttribute('href');
        link.removeAttribute('href');
        link.setAttribute('aria-disabled','true');
        link.setAttribute('tabindex','-1');
        link.textContent = 'Upgrade to unlock →';
      }
      if (!finalStep.querySelector('[data-cm-pr-note]')) {
        finalStep.insertAdjacentHTML('beforeend', '<span class="small muted cm-pr-note" data-cm-pr-note>Available in Professional Readiness.</span>');
      }
    } else {
      finalStep.querySelector('[data-cm-pr-note]')?.remove();
      if (link) {
        const restore = link.dataset.cmOriginalHref || `#/final/${encodeURIComponent(careerId)}`;
        link.setAttribute('href', restore);
        link.removeAttribute('aria-disabled');
        link.removeAttribute('tabindex');
        if (/Upgrade to unlock/i.test(link.textContent || '')) link.textContent = 'Take Readiness Final →';
      }
    }
  }

  function updateFinalGate(root, careerId, track) {
    const finalHeading = [...root.querySelectorAll('.path-step h3')].find(el => /Professional Readiness Final/i.test(el.textContent || ''));
    const finalStep = finalHeading?.closest('.path-step');
    if (!finalStep) return;
    let badge = finalHeading.querySelector('.cm-track-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cm-track-badge';
      finalHeading.appendChild(badge);
    }
    if(badge.textContent !== 'Professional Readiness only') badge.textContent = 'Professional Readiness only';
    setAdvancedGateState(finalStep, careerId, track);
  }

  function updateCapstoneBadge(root, track) {
    const headings = [...root.querySelectorAll('.path-step h3')];
    const capstone = headings.find(el => /Job Simulation|Role Lab|Simulation/i.test(el.textContent || '') && !/Professional Readiness Final/i.test(el.textContent || ''));
    if (!capstone) return;
    let badge = capstone.querySelector('.cm-track-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cm-track-badge';
      capstone.appendChild(badge);
    }
    const badgeCopy=track === PROFESSIONAL ? 'Builds toward Role Lab' : 'Career Skills capstone';
    if(badge.textContent!==badgeCopy) badge.textContent=badgeCopy;
  }

  function apiPathway(careerId) {
    return careerId === 'quant-finance' ? 'quantitative-finance' : careerId;
  }

  function publicPathway(pathwayId) {
    return pathwayId === 'quantitative-finance' ? 'quant-finance' : pathwayId;
  }

  function v2AssessmentKey(careerId, stage) {
    const id = apiPathway(careerId);
    if (id === 'investment-banking') return stage === 'essentials' ? 'ib-essentials-case' : 'ib-professional-final';
    return `${id}-${stage === 'essentials' ? 'essentials-case' : 'professional-final'}`;
  }

  function trackSequenceHtml(careerId, trackId) {
    const id=encodeURIComponent(careerId), api=encodeURIComponent(apiPathway(careerId));
    const essentials=encodeURIComponent(v2AssessmentKey(careerId,'essentials'));
    const finalKey=encodeURIComponent(v2AssessmentKey(careerId,'final'));
    const professional=trackId===PROFESSIONAL;
    const steps=professional ? [
      ['01','Foundations','Learn the role + technical core and earn Foundations',`#/learn/${id}/1`],
      ['02','Baseline','Measure starting readiness; this does not count against you',`#/diagnostic/${api}`],
      ['03','Essentials','Complete the secure mini case and earn Essentials',`#/v2-assessment/${essentials}`],
      ['04','Applied Skills','Complete Toolkit + Applied Work',`#/learn/${id}/3`],
      ['05','Role Lab','Perform the full professional workflow with review and revisions',`#/role-lab/${api}`],
      ['06','Professional Final','Clear the final calculation + judgment gate',`#/v2-assessment/${finalKey}`],
      ['07','Readiness','Review evidence coverage and professional readiness',`#/readiness/${api}`]
    ] : [
      ['01','Foundations','Learn the role + technical core and earn Foundations',`#/learn/${id}/1`],
      ['02','Essentials','Apply the core concepts in the secure mini case',`#/v2-assessment/${essentials}`],
      ['03','Applied Skills','Complete Toolkit + Applied Work',`#/learn/${id}/3`],
      ['04','Career Skills Capstone','Complete the realistic server-graded job simulation and earn Career Skills',`#/official-simulation/${id}`]
    ];
    return `<section class="cm-track-sequence" data-cm-track-sequence data-cm-track-id="${trackId}"><div class="cm-track-sequence-head"><div><div class="eyebrow">${professional?'PROFESSIONAL READINESS SEQUENCE':'CAREER SKILLS SEQUENCE'}</div><h3>${professional?'Five verified credentials. Full role-readiness evidence.':'Four verified credentials. Shorter, still practical.'}</h3></div><span>${professional?'Advanced':'Shorter'}</span></div><div class="cm-track-sequence-grid">${steps.map(([n,title,copy,href])=>`<a href="${href}"><b>${n}</b><strong>${title}</strong><span>${copy}</span></a>`).join('')}</div></section>`;
  }

  function shapeCareerPath(root, careerId, trackId) {
    const pathList=root.querySelector('.career-summary .path-list');
    if(!pathList) return;
    const headings=[...pathList.querySelectorAll('.path-step h3')];
    const legacyFinal=headings.find(x=>/Professional Readiness Final/i.test(x.textContent||''))?.closest('.path-step');
    const legacySimulation=headings.find(x=>/^Job Simulation$/i.test((x.textContent||'').trim()))?.closest('.path-step');
    if(legacyFinal){ legacyFinal.hidden=true; legacyFinal.setAttribute('aria-hidden','true'); }
    if(legacySimulation){
      const hide=trackId===PROFESSIONAL;
      legacySimulation.hidden=hide;
      legacySimulation.setAttribute('aria-hidden',String(hide));
    }
    const existing=root.querySelector('[data-cm-track-sequence]');
    if(existing?.dataset.cmTrackId===trackId) return;
    if(existing) existing.remove();
    pathList.insertAdjacentHTML('afterend',trackSequenceHtml(careerId,trackId));
  }

  function advancedRouteCareer() {
    const p=routeParts();
    if(p[0]==='role-lab'&&p[1]) return publicPathway(decodeURIComponent(p[1]));
    if(p[0]==='v2-assessment'&&p[1]&&/professional-final$/i.test(p[1])) {
      const key=decodeURIComponent(p[1]);
      if(key==='ib-professional-final') return 'investment-banking';
      return publicPathway(key.replace(/-professional-final$/i,''));
    }
    return '';
  }

  function noticeHtml() {
    const message = sessionStorage.getItem(NOTICE_KEY);
    if (!message) return '';
    sessionStorage.removeItem(NOTICE_KEY);
    return `<div class="cm-track-notice" role="status" aria-live="polite"><strong>Program level:</strong> ${esc(message)}</div>`;
  }

  function decorateCareerPage(careerId) {
    const root = document.querySelector('#app main#main') || document.querySelector('#app');
    if (!root || !careerId) return;
    const hero = root.querySelector('.page-hero');
    if (!hero) return;

    let chooser = root.querySelector('[data-cm-track-chooser]');
    if (!chooser) {
      hero.insertAdjacentHTML('afterend', chooserHtml(careerId));
      chooser = root.querySelector('[data-cm-track-chooser]');
    }

    if (!root.querySelector('[data-cm-track-notice]')) {
      const notice = noticeHtml();
      if (notice) {
        chooser.insertAdjacentHTML('beforebegin', notice.replace('class="cm-track-notice"','class="cm-track-notice" data-cm-track-notice'));
      }
    }

    const track = getTrack(careerId);
    chooser.querySelectorAll('[data-cm-track-card]').forEach(card => {
      const value=String(card.dataset.cmTrackCard === track);
      if(card.dataset.selected!==value) card.dataset.selected=value;
    });
    chooser.querySelectorAll('[data-cm-select-track]').forEach(button => {
      const selected = button.dataset.cmSelectTrack === track;
      const pressed=String(selected);
      const label=selected ? 'Selected' : 'Choose this program';
      if(button.getAttribute('aria-pressed')!==pressed) button.setAttribute('aria-pressed',pressed);
      if(button.textContent!==label) button.textContent=label;
      button.classList.toggle('btn-gold', selected);
      button.classList.toggle('btn-outline', !selected);
      button.onclick = () => setTrack(careerId, button.dataset.cmSelectTrack);
    });

    const pathList = root.querySelector('.career-summary .path-list');
    if (pathList) {
      let status=root.querySelector('[data-cm-track-status]');
      if(!status || status.dataset.cmTrackStatusId!==track){
        status?.remove();
        pathList.insertAdjacentHTML('beforebegin', selectedStatusHtml(track));
        status=root.querySelector('[data-cm-track-status]');
      }
      const switchButton=status?.querySelector('[data-cm-switch-track]');
      if(switchButton) switchButton.onclick = e => setTrack(careerId, e.currentTarget.dataset.cmSwitchTrack);
    }

    updateFinalGate(root, careerId, track);
    updateCapstoneBadge(root, track);
    shapeCareerPath(root, careerId, track);
  }

  function decorateCareerDirectory() {
    document.querySelectorAll('.career-card .cred-count').forEach(el => {
      const copy='Career Skills: 4 credentials · Professional Readiness: 5 credentials';
      if(el.textContent!==copy) el.textContent=copy;
      if(!el.classList.contains('cm-track-count')) el.classList.add('cm-track-count');
    });
  }

  function publicTrackOverviewHtml(audience='learner') {
    const employer=audience==='employer';
    return `<section class="section cm-track-public-overview" data-cm-track-public-overview><div class="container">
      <div class="section-head"><div><div class="eyebrow">TWO PROGRAM LEVELS · EVERY CAREER</div><h2>Choose the depth that matches the goal.</h2></div><p>Both routes teach before they test and require real application. Professional Readiness goes further into full role simulation, review and readiness evidence.</p></div>
      <div class="cm-track-public-grid">
        <article class="card"><div class="cm-track-public-top"><span>CAREER SKILLS</span><b>4 verified credentials</b></div><h3>Shorter. Practical. Still real work.</h3><p>Foundations → Essentials → Applied Skills → Career Skills Capstone. Built for meaningful role preparation without requiring the full advanced onboarding-style sequence.</p><ul><li>Role-native learning and guided practice</li><li>Applied work, not MCQ-only completion</li><li>Realistic practical capstone</li><li>Upgrade later without repeating earned stages</li></ul><a class="btn btn-outline" href="#/careers">${employer?'Preview Career Skills':'Explore Career Skills'} →</a></article>
        <article class="card cm-track-public-flagship"><div class="cm-track-public-top"><span>PROFESSIONAL READINESS</span><b>5 verified credentials</b></div><h3>Full job-readiness preparation.</h3><p>Foundations → Essentials → Applied Skills → Role Lab → Professional Readiness, with the baseline, advanced simulation, revision cycle and Professional Final supporting the flagship evidence standard.</p><ul><li>Full role-specific professional workflow</li><li>Manager-style review and revisions</li><li>Professional Final + evidence coverage</li><li>Flagship Professional Readiness credential</li></ul><a class="btn btn-primary" href="#/careers">${employer?'Preview Professional Readiness':'Explore Professional Readiness'} →</a></article>
      </div>
      <div class="cm-track-public-note"><strong>Shared foundation:</strong> Foundations, Essentials and Applied Skills carry forward when a learner moves from Career Skills into Professional Readiness. The shorter credential never substitutes for the advanced Role Lab or Professional Readiness credential.</div>
      ${employer?'<p class="cm-track-employer-use"><strong>Employer use:</strong> assign Career Skills for shorter practical preparation or Professional Readiness for internship, new-hire and pre-Day-1 role readiness. Reporting and completion rules stay separate automatically.</p>':''}
    </div></section>`;
  }

  function decorateHomeTrackOverview() {
    const { route }=routeContext();
    if(route!=='') return;
    const root=document.querySelector('#app main#main')||document.querySelector('#app');
    if(!root||root.querySelector('[data-cm-track-public-overview]')) return;
    const hero=root.querySelector('section');
    if(hero) hero.insertAdjacentHTML('afterend',publicTrackOverviewHtml('learner'));
  }

  function decorateEmployerTrackOverview() {
    const { route }=routeContext();
    if(route!=='employers') return;
    const root=document.querySelector('#app main#main')||document.querySelector('#app');
    if(!root||root.querySelector('[data-cm-track-public-overview]')) return;
    const hero=root.querySelector('section');
    if(hero) hero.insertAdjacentHTML('afterend',publicTrackOverviewHtml('employer'));
  }

  function decorateLearnerGuide() {
    const { route } = routeContext();
    if (route !== 'learner-guide') return;
    const root = document.querySelector('#app main#main') || document.querySelector('#app');
    if (!root || root.querySelector('[data-cm-track-guide]')) return;
    const hero = root.querySelector('.page-hero, .learner-guide-hero, section');
    if (!hero) return;
    hero.insertAdjacentHTML('afterend', `<section class="section-tight" data-cm-track-guide><div class="container"><div class="card">
      <div class="eyebrow">TWO PROGRAM LEVELS</div>
      <h2>Choose depth without losing progress.</h2>
      <p><strong>Career Skills</strong> is the shorter practical route with four verified credentials: Foundations, Essentials, Applied Skills and the Career Skills Certificate. <strong>Professional Readiness</strong> is the advanced five-credential Standard 2.0 route with the full Role Lab and flagship readiness credential. Work earned in the shorter route carries forward.</p>
      <div class="cm-track-mini">
        <div><strong>Career Skills</strong>Shorter practical route</div>
        <div><strong>4 credentials</strong>Ends with Career Skills Certificate</div>
        <div><strong>Professional Readiness</strong>Full job-readiness route</div>
        <div><strong>5 credentials</strong>Includes Role Lab + flagship credential</div>
      </div>
    </div></div></section>`);
  }

  function decorateCredentialsPage() {
    const { route } = routeContext();
    if (route !== 'credentials') return;
    const root = document.querySelector('#app main#main') || document.querySelector('#app');
    if (!root || root.querySelector('[data-cm-track-credential-model]')) return;
    const firstSection = root.querySelector('.page-hero, section');
    if (!firstSection) return;
    firstSection.insertAdjacentHTML('afterend', `<section class="section-tight" data-cm-track-credential-model><div class="container"><div class="card cm-track-credential-model">
      <div class="eyebrow">CREDENTIAL MODEL</div>
      <h2>Stackable evidence, not certificate spam.</h2>
      <p>Career Skills produces four verified credentials: Foundations, Essentials, Applied Skills and the Career Skills Certificate, which requires the practical capstone simulation. Professional Readiness is the five-level Standard 2.0 career stack: Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness. The two end credentials are intentionally different so a Career Skills completion is never mistaken for full Professional Readiness.</p>
    </div></div></section>`);
  }

  function decorateLearningRoute(careerId) {
    const root = document.querySelector('#app main#main') || document.querySelector('#app');
    if (!root || !careerId || root.querySelector('[data-cm-track-learning-status]')) return;
    const target = root.querySelector('.lesson-top, .cm-wb-hero, .cm-live-card');
    if (!target) return;
    const track = getTrack(careerId);
    const t = TRACKS[track];
    target.insertAdjacentHTML('afterend', `<div class="cm-track-learning-status" data-cm-track-learning-status><strong>${esc(t.name)}</strong><span>${esc(t.evidenceModel)}</span><a href="#/career/${encodeURIComponent(careerId)}">Change program level</a></div>`);
  }

  function guardAdvancedRoute() {
    const { route, pathwayId } = routeContext();
    if(route==='final'&&pathwayId){
      sessionStorage.setItem(NOTICE_KEY,'The legacy final is no longer a program gate. Career Skills ends at its capstone; Professional Readiness uses the Standard 2.0 Role Lab and Professional Final shown on the pathway.');
      location.replace(`#/career/${encodeURIComponent(pathwayId)}`); return true;
    }
    if((route==='simulation'||route==='official-simulation')&&pathwayId&&getTrack(pathwayId)===PROFESSIONAL&&!adminQaPreviewActive()){
      sessionStorage.setItem(NOTICE_KEY,'Professional Readiness uses the deeper Role Lab instead of the shorter Career Skills capstone.');
      location.replace(`#/career/${encodeURIComponent(pathwayId)}`); return true;
    }
    const advancedCareer=advancedRouteCareer();
    if(advancedCareer&&getTrack(advancedCareer)!==PROFESSIONAL){
      sessionStorage.setItem(NOTICE_KEY,'Role Lab and the Professional Readiness Final are reserved for the advanced program. Your Career Skills work remains saved.');
      location.replace(`#/career/${encodeURIComponent(advancedCareer)}`); return true;
    }
    return false;
  }

  function apply() {
    if (guardAdvancedRoute()) return;
    decorateCareerDirectory();
    decorateHomeTrackOverview();
    decorateEmployerTrackOverview();
    const { route, pathwayId } = routeContext();
    if (route === 'career' && pathwayId) decorateCareerPage(pathwayId);
    if (['learn','quiz'].includes(route) && pathwayId) decorateLearningRoute(pathwayId);
    decorateLearnerGuide();
    decorateCredentialsPage();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  }

  window.CM_TRAINING_TRACKS = Object.freeze({
    CAREER_SKILLS,
    PROFESSIONAL,
    getTrack,
    setTrack,
    storedTrack,
    definitions: TRACKS
  });

  window.addEventListener('hashchange', schedule);
  window.addEventListener('capitalmastery:rendered', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true
  });
  schedule();
})();
