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
      verifiedCredentialCount: 3,
      summary: 'Learn the role, practice the major technical and professional skills, complete applied work and finish a compact realistic job simulation.',
      milestones: [
        'Foundations credential',
        'Essentials credential',
        'Applied Skills credential',
        'Career Skills Program completion certificate'
      ],
      evidenceModel: '3 Standard 2.0 credentials + 1 evidence-backed program completion certificate'
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
    const pathwayRoutes = new Set(['career','learn','quiz','final']);
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
          <span>${t.awardCount} awards</span>
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
    return `<div class="cm-track-status" data-cm-track-status>
      <div>
        <strong>${esc(t.name)}</strong>
        <span class="cm-track-badge">${t.awardCount} awards</span>
        <p>${professional
          ? 'Complete the full pathway, Role Lab and Professional Readiness Final.'
          : 'Complete the core pathway and practical capstone. The fourth award is an evidence-backed program completion certificate; switch to Professional Readiness later without repeating completed stages.'}</p>
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
    badge.textContent = 'Professional Readiness only';
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
    badge.textContent = track === PROFESSIONAL ? 'Builds toward Role Lab' : 'Career Skills capstone';
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
      card.dataset.selected = String(card.dataset.cmTrackCard === track);
    });
    chooser.querySelectorAll('[data-cm-select-track]').forEach(button => {
      const selected = button.dataset.cmSelectTrack === track;
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Selected' : 'Choose this program';
      button.classList.toggle('btn-gold', selected);
      button.classList.toggle('btn-outline', !selected);
      button.onclick = () => setTrack(careerId, button.dataset.cmSelectTrack);
    });

    const pathList = root.querySelector('.career-summary .path-list');
    if (pathList) {
      root.querySelector('[data-cm-track-status]')?.remove();
      pathList.insertAdjacentHTML('beforebegin', selectedStatusHtml(track));
      root.querySelector('[data-cm-switch-track]')?.addEventListener('click', e => {
        setTrack(careerId, e.currentTarget.dataset.cmSwitchTrack);
      });
    }

    updateFinalGate(root, careerId, track);
    updateCapstoneBadge(root, track);
  }

  function decorateCareerDirectory() {
    document.querySelectorAll('.career-card .cred-count').forEach(el => {
      el.textContent = 'Career Skills: 4 awards · Professional Readiness: 5 credentials';
      el.classList.add('cm-track-count');
    });
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
      <p><strong>Career Skills</strong> is the shorter practical route with three Standard 2.0 credentials plus an evidence-backed completion certificate. <strong>Professional Readiness</strong> is the advanced route with all five career credentials, the full Role Lab and the flagship readiness credential. Work earned in the shorter route carries forward.</p>
      <div class="cm-track-mini">
        <div><strong>Career Skills</strong>Shorter practical route</div>
        <div><strong>4 awards</strong>3 credentials + completion certificate</div>
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
      <p>Career Skills produces four learner-facing awards: Foundations, Essentials, Applied Skills and a Career Skills Program completion certificate backed by those credentials plus capstone evidence. Professional Readiness remains the five-level Standard 2.0 career credential stack: Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness.</p>
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
    if (route !== 'final' || !pathwayId) return false;
    if (getTrack(pathwayId) === PROFESSIONAL) return false;
    sessionStorage.setItem(NOTICE_KEY, 'The Professional Readiness Final is part of the advanced program. Your Career Skills progress is preserved; upgrade when you want to continue.');
    location.replace(`#/career/${encodeURIComponent(pathwayId)}`);
    return true;
  }

  function apply() {
    if (guardAdvancedRoute()) return;
    decorateCareerDirectory();
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
