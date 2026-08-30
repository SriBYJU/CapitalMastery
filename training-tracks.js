(() => {
  'use strict';

  const STORE_PREFIX = 'capitalMasteryTrainingTrackV1:';
  const CAREER_SKILLS = 'career-skills';
  const PROFESSIONAL = 'professional-readiness';

  const TRACKS = {
    [CAREER_SKILLS]: {
      name: 'Career Skills Program',
      kicker: 'SHORTER · PRACTICAL · CREDENTIALED',
      credentialCount: 4,
      summary: 'Learn the role, practice the major technical and professional skills, complete applied work and finish a compact realistic job simulation.',
      milestones: ['Foundations', 'Essentials', 'Applied Skills', 'Career Skills Certificate']
    },
    [PROFESSIONAL]: {
      name: 'Professional Readiness Program',
      kicker: 'ADVANCED · FULL JOB-READINESS · FLAGSHIP',
      credentialCount: 5,
      summary: 'Train through the full workflow, produce professional work, complete the Role Lab, respond to review and pass the Professional Readiness Final.',
      milestones: ['Foundations', 'Essentials', 'Applied Skills', 'Role Lab', 'Professional Readiness']
    }
  };

  function esc(value='') {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function parts() {
    return (location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  }

  function currentCareerId() {
    const p = parts();
    return p[0] === 'career' && p[1] ? decodeURIComponent(p[1]) : '';
  }

  function getTrack(careerId) {
    const saved = localStorage.getItem(STORE_PREFIX + careerId);
    return saved === PROFESSIONAL ? PROFESSIONAL : CAREER_SKILLS;
  }

  function setTrack(careerId, track) {
    if (!careerId || !TRACKS[track]) return;
    localStorage.setItem(STORE_PREFIX + careerId, track);
    decorateCareerPage(careerId);
    window.dispatchEvent(new CustomEvent('capitalmastery:trackchange', { detail: { careerId, track } }));
  }

  function chooserHtml(careerId) {
    const selected = getTrack(careerId);
    const card = (id) => {
      const t = TRACKS[id];
      const professional = id === PROFESSIONAL;
      return `<article class="cm-track-card" data-cm-track-card="${id}" data-selected="${selected===id}">
        <div class="cm-track-kicker">${esc(t.kicker)}</div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.summary)}</p>
        <div class="cm-track-meta"><span>${t.credentialCount} credential${t.credentialCount===1?'':'s'}</span><span>${professional?'Full Role Lab + final':'Shorter capstone simulation'}</span><span>${professional?'Highest career credential':'Upgrade anytime'}</span></div>
        <ul class="cm-track-credentials">${t.milestones.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
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
      <div><strong>${esc(t.name)}</strong><span class="cm-track-badge">${t.credentialCount} credentials</span><p>${professional?'Complete the full pathway, Role Lab and Professional Readiness Final.':'Complete the core pathway and practical capstone. Switch to Professional Readiness later without repeating completed stages.'}</p></div>
      <button type="button" class="btn btn-soft btn-sm" data-cm-switch-track="${professional?CAREER_SKILLS:PROFESSIONAL}">${professional?'View shorter option':'Upgrade to Professional Readiness'}</button>
    </div>`;
  }

  function updateFinalGate(root, track) {
    const finalHeading = [...root.querySelectorAll('.path-step h3')].find(el => /Professional Readiness Final/i.test(el.textContent || ''));
    const finalStep = finalHeading?.closest('.path-step');
    if (!finalStep) return;
    finalStep.classList.add('cm-pr-only');
    finalStep.classList.toggle('cm-track-locked', track !== PROFESSIONAL);
    let badge = finalHeading.querySelector('.cm-track-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cm-track-badge';
      finalHeading.appendChild(badge);
    }
    badge.textContent = 'Professional Readiness only';
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

    const track = getTrack(careerId);
    chooser.querySelectorAll('[data-cm-track-card]').forEach(card => card.dataset.selected = String(card.dataset.cmTrackCard === track));
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
      root.querySelector('[data-cm-switch-track]')?.addEventListener('click', e => setTrack(careerId, e.currentTarget.dataset.cmSwitchTrack));
    }

    updateFinalGate(root, track);
    updateCapstoneBadge(root, track);
  }

  function decorateCareerDirectory() {
    document.querySelectorAll('.career-card .cred-count').forEach(el => {
      el.textContent = 'Career Skills: 4 credentials · Professional Readiness: 5';
      el.classList.add('cm-track-count');
    });
  }

  function decorateLearnerGuide() {
    const p = parts();
    if (p[0] !== 'learner-guide') return;
    const root = document.querySelector('#app main#main') || document.querySelector('#app');
    if (!root || root.querySelector('[data-cm-track-guide]')) return;
    const hero = root.querySelector('.page-hero, .learner-guide-hero, section');
    if (!hero) return;
    hero.insertAdjacentHTML('afterend', `<section class="section-tight" data-cm-track-guide><div class="container"><div class="card"><div class="eyebrow">TWO PROGRAM LEVELS</div><h2>Choose depth without losing progress.</h2><p><strong>Career Skills</strong> is the shorter practical route and culminates in four credential milestones. <strong>Professional Readiness</strong> is the advanced route with five career credentials, the full Role Lab and the flagship readiness credential. Work earned in the shorter route carries forward.</p><div class="cm-track-mini"><div><strong>Career Skills</strong>Shorter practical route</div><div><strong>4 credentials</strong>Includes Career Skills certificate</div><div><strong>Professional Readiness</strong>Full job-readiness route</div><div><strong>5 credentials</strong>Includes Role Lab + flagship credential</div></div></div></div></section>`);
  }

  function apply() {
    decorateCareerDirectory();
    const careerId = currentCareerId();
    if (careerId) decorateCareerPage(careerId);
    decorateLearnerGuide();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
  }

  window.CM_TRAINING_TRACKS = Object.freeze({
    CAREER_SKILLS,
    PROFESSIONAL,
    getTrack,
    setTrack,
    definitions: TRACKS
  });

  window.addEventListener('hashchange', schedule);
  window.addEventListener('capitalmastery:rendered', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  schedule();
})();
