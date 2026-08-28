(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const RESULT_DIRTY_KEY = 'cmOfficialResultNeedsFreshRenderV2';
  const DRAFT_PREFIX = 'cmOfficialAssessmentDraftV2:';
  const PASS = 80;
  const CONTACT_EMAIL = 'avadhanula.shriyan@gmail.com';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/shriyan-avadhanula-744190428/';

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function parts(hash = location.hash) {
    return String(hash || '#/')
      .replace(/^#\/?/, '')
      .split('?')[0]
      .split('/')
      .filter(Boolean);
  }

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) {
      return null;
    }
  }

  function careerState(pathwayId) {
    return readState()?.careers?.[pathwayId] || null;
  }

  function isLearningMarked(pathwayId, part) {
    return Array.isArray(careerState(pathwayId)?.learningComplete) &&
      careerState(pathwayId).learningComplete.includes(Number(part));
  }

  function draftKey() {
    const uid = window.CM_AUTH?.user?.uid || 'signed-out';
    return `${DRAFT_PREFIX}${uid}:${location.hash || '#/'}`;
  }

  function saveDraft(form) {
    if (!form) return;
    const answers = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(input => {
      answers[input.name] = input.value;
    });
    const writing = form.querySelector('textarea[name="writing"]')?.value || '';
    sessionStorage.setItem(draftKey(), JSON.stringify({ answers, writing, savedAt: Date.now() }));
  }

  function restoreDraft(form) {
    if (!form || form.dataset.cmDraftBound === '1') return;
    form.dataset.cmDraftBound = '1';
    let draft = null;
    try { draft = JSON.parse(sessionStorage.getItem(draftKey()) || 'null'); } catch (_) {}

    if (draft?.answers) {
      form.querySelectorAll('input[type="radio"]').forEach(input => {
        if (draft.answers[input.name] === input.value) input.checked = true;
      });
    }
    const writing = form.querySelector('textarea[name="writing"]');
    if (writing && draft?.writing) writing.value = draft.writing;

    form.addEventListener('change', () => saveDraft(form));
    form.addEventListener('input', () => saveDraft(form));
  }

  function clearDraft() {
    sessionStorage.removeItem(draftKey());
  }

  function enhanceLesson() {
    const [root, pathwayId, rawPart] = parts();
    if (root !== 'learn' || !pathwayId || !rawPart) return;
    const part = Number(rawPart);
    if (!Number.isFinite(part)) return;

    const actions = document.querySelector('.lesson-content .lesson-actions');
    if (!actions) return;

    const marked = isLearningMarked(pathwayId, part);
    let box = document.querySelector('.cm-mark-complete-guide');
    if (!box) {
      box = document.createElement('div');
      box.className = 'cm-mark-complete-guide';
      actions.insertAdjacentElement('beforebegin', box);
    }

    box.innerHTML = marked
      ? `<div class="cm-guide-icon done">✓</div><div><strong>Learning saved.</strong><p>You marked this lesson complete. Now take the official assessment and score ${PASS}% or higher to complete this part.</p></div>`
      : `<div class="cm-guide-icon">1</div><div><strong>Required before the quiz: click “Mark Learning Complete.”</strong><p>This records that you finished the lesson and saves the learning step to your account. After that, take the official assessment and score ${PASS}%+.</p></div>`;

    const markButton = actions.querySelector('button[onclick*="CM.markPart"]');
    if (markButton) {
      markButton.textContent = marked ? '✓ Learning Complete' : '✓ Mark Learning Complete';
      markButton.disabled = marked;
      markButton.classList.toggle('cm-learning-done', marked);
    }

    const quizLink = actions.querySelector('a[href^="#/quiz/"]');
    if (quizLink) {
      quizLink.dataset.cmPathway = pathwayId;
      quizLink.dataset.cmPart = String(part);
      quizLink.classList.toggle('cm-quiz-needs-mark', !marked);
      quizLink.setAttribute('aria-disabled', marked ? 'false' : 'true');
      quizLink.textContent = marked
        ? (part === 5 ? 'Take Official Knowledge Check →' : 'Take Official Assessment →')
        : 'Mark Complete to Unlock Quiz →';
    }
  }

  function flashGuide() {
    const box = document.querySelector('.cm-mark-complete-guide');
    if (!box) return;
    box.classList.remove('cm-guide-flash');
    void box.offsetWidth;
    box.classList.add('cm-guide-flash');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function enhanceOfficialForm() {
    const form = document.getElementById('cm-official-form');
    if (!form) return;
    restoreDraft(form);

    const security = document.querySelector('.cm-security-note');
    if (security && !document.querySelector('.cm-assessment-autosave-note')) {
      const note = document.createElement('div');
      note.className = 'cm-assessment-autosave-note';
      note.innerHTML = '<strong>Protected while you work:</strong> your selected answers are temporarily saved in this browser tab. Your official score is saved to your account only after you submit.';
      security.insertAdjacentElement('afterend', note);
    }
  }

  function markResultFreshnessNeeded() {
    sessionStorage.setItem(RESULT_DIRTY_KEY, JSON.stringify({ route: location.hash || '#/', at: Date.now() }));
  }

  function enhanceResult() {
    const result = document.querySelector('.cm-result');
    if (!result || result.dataset.cmPolishDone === '1') return;
    result.dataset.cmPolishDone = '1';
    clearDraft();
    markResultFreshnessNeeded();

    const actions = result.querySelector('.cm-result-actions');
    if (actions && !result.querySelector('.cm-result-save-reminder')) {
      const reminder = document.createElement('div');
      reminder.className = 'cm-result-save-reminder';
      reminder.innerHTML = '<strong>Saved ✓</strong> Your official result is recorded. When you continue, Capital Mastery refreshes the course display. If a completed quiz ever does not show as complete, reload the page once to refresh it.';
      actions.insertAdjacentElement('beforebegin', reminder);
    }
  }

  function enhanceProfileAccess() {
    const nav = document.querySelector('.site-header .nav');
    const mobileMenu = nav?.querySelector('.mobile-menu');
    if (nav && mobileMenu && !nav.querySelector('.cm-mobile-profile')) {
      const link = document.createElement('a');
      link.className = 'cm-mobile-profile';
      link.href = '#/login';
      link.setAttribute('aria-label', 'Open profile');
      link.innerHTML = '<span aria-hidden="true">●</span><b>Profile</b>';
      nav.insertBefore(link, mobileMenu);
    }

    const menuModal = document.querySelector('#cm-modal .modal');
    const title = menuModal?.querySelector('h2');
    const grid = menuModal?.querySelector('.grid');
    if (title?.textContent.trim() === 'Menu' && grid && !grid.querySelector('[data-cm-mobile-profile-menu]')) {
      const link = document.createElement('a');
      link.className = 'btn btn-primary';
      link.href = '#/login';
      link.dataset.cmMobileProfileMenu = '1';
      link.textContent = window.CM_AUTH?.user ? 'Profile / Account' : 'Sign in / Profile';
      link.addEventListener('click', () => window.CM?.closeModal?.());
      grid.appendChild(link);
    }
  }

  function enhanceAbout() {
    const [root] = parts();
    if (root !== 'about') return;
    const founder = document.querySelector('.about-founder');
    if (!founder || document.querySelector('.cm-founder-connect')) return;

    const wrap = document.createElement('div');
    wrap.className = 'container cm-founder-connect';
    wrap.innerHTML = `
      <div>
        <div class="eyebrow">CONNECT WITH THE FOUNDER</div>
        <h3>Questions, feedback, or collaboration?</h3>
        <p>Connect with Shriyan Avadhanula on LinkedIn or reach out by email.</p>
      </div>
      <div class="cm-founder-connect-actions">
        <a class="btn btn-primary" href="mailto:${esc(CONTACT_EMAIL)}">Email Shriyan</a>
        <a class="btn btn-outline" href="${esc(LINKEDIN_URL)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
      </div>
      <div class="small muted cm-founder-email">${esc(CONTACT_EMAIL)}</div>`;
    founder.closest('section')?.insertAdjacentElement('afterend', wrap);
  }

  function fixStaleCopy() {
    const [root] = parts();

    if (root === 'learn') {
      document.querySelectorAll('.lesson-section > p').forEach(p => {
        if (p.textContent.includes('Save drafts locally')) {
          p.textContent = 'You now complete realistic smaller assignments. Your signed-in work saves as you type, so you can revise it before taking the Part 4 assessment.';
        }
      });
    }

    if (root === 'admin-preview') {
      document.querySelectorAll('p').forEach(p => {
        if (p.textContent.includes('Firebase will later protect this area')) {
          p.textContent = 'This QA area is restricted to the server-verified administrator account.';
        }
        if (p.textContent.includes('Firebase data is not involved')) {
          p.textContent = 'This reset clears local QA state only. It does not delete authoritative D1 assessment or credential records.';
        }
      });
    }

    if (['privacy', 'terms', 'disclaimer', 'credential-policy'].includes(root)) {
      document.querySelectorAll('h3').forEach(h => {
        if (h.textContent.trim() === 'Production status' && h.nextElementSibling) {
          h.nextElementSibling.textContent = 'Live authentication, cross-device progress sync, server-graded assessments, authoritative D1 credential issuance, and public credential verification are connected.';
        }
      });
    }
  }

  function enhanceCareerReminder() {
    const [root] = parts();
    if (root !== 'career') return;
    const hero = document.querySelector('.career-hero, .page-hero');
    if (!hero || document.querySelector('.cm-course-refresh-tip')) return;
    const tip = document.createElement('div');
    tip.className = 'container cm-course-refresh-tip';
    tip.innerHTML = '<strong>Progress tip:</strong> after passing an official quiz, completion should refresh automatically. If a checkmark or score looks stale, reload the page once.';
    hero.insertAdjacentElement('afterend', tip);
  }

  function runEnhancements() {
    enhanceLesson();
    enhanceOfficialForm();
    enhanceResult();
    enhanceProfileAccess();
    enhanceAbout();
    enhanceCareerReminder();
    fixStaleCopy();
  }

  document.addEventListener('click', event => {
    const quizLink = event.target.closest('a[href^="#/quiz/"]');
    if (quizLink) {
      const hrefParts = parts(quizLink.getAttribute('href'));
      const pathwayId = hrefParts[1];
      const part = Number(hrefParts[2]);
      if (pathwayId && Number.isFinite(part) && !isLearningMarked(pathwayId, part)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        flashGuide();
        return;
      }
    }

    const resultLink = event.target.closest('.cm-result a[href^="#/"]');
    if (resultLink) {
      const target = resultLink.getAttribute('href');
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      sessionStorage.removeItem(RESULT_DIRTY_KEY);
      location.hash = target;
      setTimeout(() => location.reload(), 20);
    }
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'cm-official-form') return;

    form.querySelectorAll('.cm-unanswered').forEach(x => x.classList.remove('cm-unanswered'));
    form.querySelector('.cm-submit-validation')?.remove();

    const questions = [...form.querySelectorAll('.cm-official-question')];
    const unanswered = questions.filter(q => !q.querySelector('input[type="radio"]:checked'));
    const writing = form.querySelector('textarea[name="writing"]');
    const writingMissing = !!writing && !writing.value.trim();

    if (unanswered.length || writingMissing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      unanswered.forEach(q => q.classList.add('cm-unanswered'));
      if (writingMissing) writing.classList.add('cm-unanswered');
      const box = document.createElement('div');
      box.className = 'cm-submit-validation';
      box.textContent = `Complete every question${writingMissing ? ' and the written recommendation' : ''} before submitting.`;
      form.prepend(box);
      (unanswered[0] || writing || box).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (writing) writing.classList.remove('cm-unanswered');
    saveDraft(form);
  }, true);

  window.addEventListener('hashchange', () => {
    const dirtyRaw = sessionStorage.getItem(RESULT_DIRTY_KEY);
    if (dirtyRaw) {
      let dirty = null;
      try { dirty = JSON.parse(dirtyRaw); } catch (_) {}
      if (dirty?.route && dirty.route !== location.hash) {
        sessionStorage.removeItem(RESULT_DIRTY_KEY);
        setTimeout(() => location.reload(), 20);
        return;
      }
    }
    setTimeout(runEnhancements, 40);
  });

  window.addEventListener('pageshow', event => {
    setTimeout(() => {
      runEnhancements();
      if (!document.querySelector('.cm-result')) sessionStorage.removeItem(RESULT_DIRTY_KEY);
      if (event.persisted) location.reload();
    }, 250);
  });

  document.addEventListener('cm-auth-changed', () => setTimeout(runEnhancements, 80));
  document.addEventListener('cm-certificate-name-changed', () => setTimeout(runEnhancements, 80));

  const observer = new MutationObserver(() => runEnhancements());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.id = 'cm-polish-styles';
  style.textContent = `
    .cm-mark-complete-guide{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;margin:26px 0 14px;padding:17px 18px;border:1px solid #d6dde4;border-radius:14px;background:#f8fafb;color:#344250}.cm-mark-complete-guide strong{display:block;color:var(--navy);margin-bottom:4px}.cm-mark-complete-guide p{margin:0;line-height:1.55}.cm-guide-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-weight:900}.cm-guide-icon.done{background:#e8f4ed;color:#245b43}.cm-learning-done{opacity:.78;cursor:default}.cm-quiz-needs-mark{opacity:.55;filter:saturate(.4);cursor:not-allowed}.cm-guide-flash{animation:cmGuideFlash 1.1s ease}
    .cm-assessment-autosave-note,.cm-result-save-reminder,.cm-course-refresh-tip{padding:12px 14px;border-radius:11px;line-height:1.5}.cm-assessment-autosave-note{margin:12px 0 20px;background:#f5f7fa;border:1px solid #e0e5ea;color:#4d5a67}.cm-result-save-reminder{margin:18px 0;background:#eef6f1;border:1px solid #cfe0d6;color:#245b43;text-align:left}.cm-course-refresh-tip{margin-top:18px;margin-bottom:6px;background:#f7f3ea;border:1px solid #e5d8b7;color:#5b5138}.cm-submit-validation{padding:12px 14px;margin-bottom:16px;border-radius:10px;background:#fff0f0;color:#8b3232;font-weight:800}.cm-official-question.cm-unanswered,.cm-writing textarea.cm-unanswered{border-color:#cf7878!important;box-shadow:0 0 0 2px rgba(180,55,55,.08)}
    .cm-mobile-profile{display:none;align-items:center;gap:6px;text-decoration:none;color:var(--navy);font-size:.8rem;font-weight:800}.cm-mobile-profile span{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-size:.55rem}.cm-founder-connect{margin-top:28px;margin-bottom:34px;padding:24px;border:1px solid #dfe4e8;border-radius:18px;background:#fff;box-shadow:var(--shadow-sm);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.cm-founder-connect h3{font-size:1.55rem;color:var(--navy);margin:6px 0}.cm-founder-connect p{margin:0}.cm-founder-connect-actions{display:flex;gap:10px;flex-wrap:wrap}.cm-founder-email{grid-column:1/-1}
    @keyframes cmGuideFlash{0%,100%{box-shadow:none}35%{border-color:var(--gold);box-shadow:0 0 0 5px rgba(185,138,67,.18)}}
    @media(max-width:900px){.cm-mobile-profile{display:inline-flex}.cm-founder-connect{grid-template-columns:1fr}.cm-founder-connect-actions .btn{flex:1}.cm-founder-email{grid-column:auto}}
    @media(max-width:560px){.cm-mobile-profile b{display:none}.cm-mark-complete-guide{grid-template-columns:34px 1fr;padding:14px}.cm-guide-icon{width:32px;height:32px}.cm-founder-connect{margin-left:16px;margin-right:16px}.cm-founder-connect-actions{display:grid}.cm-founder-connect-actions .btn{width:100%}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  runEnhancements();
})();
