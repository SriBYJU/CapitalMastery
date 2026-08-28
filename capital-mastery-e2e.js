(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const DIRTY_KEY = 'cmOfficialResultDirtyV1';
  const DRAFT_PREFIX = 'cmOfficialDraftV3:';
  const PAGE_TOKEN = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const CONTACT_EMAIL = 'avadhanula.shriyan@gmail.com';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/shriyan-avadhanula-744190428/';

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parts(hash=location.hash) {
    return String(hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function state() {
    try {
      const x = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return x && x.version === 1 ? x : null;
    } catch (_) { return null; }
  }

  function isLearningMarked(pathway, part) {
    const list = state()?.careers?.[pathway]?.learningComplete;
    return Array.isArray(list) && list.includes(Number(part));
  }

  function dirty() {
    try { return JSON.parse(sessionStorage.getItem(DIRTY_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function setDirty() {
    sessionStorage.setItem(DIRTY_KEY, JSON.stringify({route: location.hash || '#/', pageToken: PAGE_TOKEN}));
  }

  function clearDirty() { sessionStorage.removeItem(DIRTY_KEY); }

  const oldDirty = dirty();
  if (oldDirty && oldDirty.pageToken !== PAGE_TOKEN) clearDirty();

  function hardNavigate(hash) {
    clearDirty();
    if (hash && hash !== location.hash) location.hash = hash;
    location.reload();
  }

  function enhanceLesson() {
    const [root, pathway, rawPart] = parts();
    if (root !== 'learn' || !pathway || !rawPart) return;
    const part = Number(rawPart);
    if (!Number.isFinite(part)) return;

    const actions = document.querySelector('.lesson-content .lesson-actions');
    if (!actions) return;
    const marked = isLearningMarked(pathway, part);
    const mode = marked ? 'marked' : 'unmarked';

    let guide = document.querySelector('.cm-e2e-complete-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.className = 'cm-e2e-complete-guide';
      actions.parentNode.insertBefore(guide, actions);
    }
    if (guide.dataset.mode !== mode) {
      guide.dataset.mode = mode;
      guide.innerHTML = marked
        ? '<span class="cm-e2e-step good">✓</span><div><strong>Learning marked complete.</strong><p>Your lesson completion is saved. Now take the official assessment and score 80% or higher to complete this part.</p></div>'
        : '<span class="cm-e2e-step">1</span><div><strong>Mark the lesson complete before taking the quiz.</strong><p>Click <b>Mark Learning Complete</b> below first. This records that you finished the lesson and unlocks the official assessment.</p></div>';
    }

    const mark = actions.querySelector('button[onclick*="CM.markPart"]');
    if (mark && mark.dataset.mode !== mode) {
      mark.dataset.mode = mode;
      mark.textContent = marked ? '✓ Learning Complete' : '✓ Mark Learning Complete';
      mark.disabled = marked;
      mark.classList.toggle('cm-e2e-marked', marked);
    }

    const quiz = actions.querySelector('a[href^="#/quiz/"]');
    if (quiz && quiz.dataset.mode !== mode) {
      quiz.dataset.mode = mode;
      quiz.classList.toggle('cm-e2e-locked', !marked);
      if (!marked) {
        quiz.setAttribute('aria-disabled','true');
        quiz.textContent = 'Mark Complete to Unlock Quiz →';
      } else {
        quiz.removeAttribute('aria-disabled');
        quiz.textContent = part === 5 ? 'Take Simulation Knowledge Check →' : 'Take Official Assessment →';
      }
    }
  }

  function flashGuide() {
    const g = document.querySelector('.cm-e2e-complete-guide');
    if (!g) return;
    g.classList.remove('flash');
    void g.offsetWidth;
    g.classList.add('flash');
    g.scrollIntoView({behavior:'smooth', block:'center'});
  }

  function draftKey() {
    const uid = window.CM_AUTH?.user?.uid || 'user';
    return `${DRAFT_PREFIX}${uid}:${location.hash || '#/'}`;
  }

  function saveDraft(form) {
    const answers = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(i => answers[i.name] = i.value);
    sessionStorage.setItem(draftKey(), JSON.stringify({answers, writing: form.querySelector('textarea[name="writing"]')?.value || ''}));
  }

  function enhanceOfficialForm() {
    const form = document.getElementById('cm-official-form');
    if (!form || form.dataset.cmE2eReady === '1') return;
    form.dataset.cmE2eReady = '1';

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(draftKey()) || 'null'); } catch (_) {}
    if (saved?.answers) {
      form.querySelectorAll('input[type="radio"]').forEach(i => { if (saved.answers[i.name] === i.value) i.checked = true; });
    }
    const writing = form.querySelector('textarea[name="writing"]');
    if (writing && saved?.writing) writing.value = saved.writing;
    form.addEventListener('change', () => saveDraft(form));
    form.addEventListener('input', () => saveDraft(form));

    const security = document.querySelector('.cm-security-note');
    if (security && !document.querySelector('.cm-e2e-save-note')) {
      const note = document.createElement('div');
      note.className = 'cm-e2e-save-note';
      note.innerHTML = '<strong>Your work is protected:</strong> answers are kept in this tab while you work. After you submit, the official score is saved to your account.';
      security.insertAdjacentElement('afterend', note);
    }
  }

  function enhanceResult() {
    const result = document.querySelector('.cm-result');
    if (!result || result.dataset.cmE2eReady === '1') return;
    result.dataset.cmE2eReady = '1';
    setDirty();
    sessionStorage.removeItem(draftKey());

    const note = document.createElement('div');
    note.className = 'cm-e2e-result-note';
    note.innerHTML = '<strong>Your official result is saved.</strong> If the pathway does not immediately show <b>Complete</b>, reload the page once to refresh the display. Capital Mastery also refreshes it automatically when you continue.';
    const actions = result.querySelector('.cm-result-actions');
    (actions || result).insertAdjacentElement(actions ? 'beforebegin' : 'beforeend', note);
  }

  function addFounderContact() {
    if (parts()[0] !== 'about') return;
    const founder = document.querySelector('.about-founder');
    if (!founder || document.querySelector('.cm-e2e-founder-contact')) return;
    const card = document.createElement('section');
    card.className = 'cm-e2e-founder-contact';
    card.innerHTML = `
      <div class="eyebrow">CONNECT WITH THE FOUNDER</div>
      <h3>Questions, feedback, or collaboration?</h3>
      <p>Reach Shriyan Avadhanula directly or connect on LinkedIn.</p>
      <div class="cm-e2e-contact-actions">
        <a class="btn btn-primary" href="mailto:${esc(CONTACT_EMAIL)}">Email Shriyan</a>
        <a class="btn btn-outline" href="${esc(LINKEDIN_URL)}" target="_blank" rel="noopener noreferrer">View LinkedIn ↗</a>
      </div>
      <div class="small muted" style="margin-top:12px">${esc(CONTACT_EMAIL)}</div>`;
    founder.insertAdjacentElement('afterend', card);
  }

  function cleanStaleCopy() {
    const root = parts()[0];
    if (root === 'learn') {
      document.querySelectorAll('.lesson-section > p').forEach(p => {
        if (p.textContent.includes('Save drafts locally')) {
          p.textContent = 'You now complete realistic smaller assignments. Drafts save automatically to your signed-in progress as you type, so you can revise them before taking the Part 4 assessment.';
        }
      });
    }
    if (root === 'admin-preview') {
      document.querySelectorAll('p').forEach(p => {
        if (p.textContent.includes('Firebase will later protect this area')) p.textContent = 'This QA area is restricted to the server-verified administrator account. Production learner scores and credentials remain authoritative in the secure backend.';
        if (p.textContent.includes('Firebase data is not involved')) p.textContent = 'This clears only local QA state. It does not delete Firestore progress or authoritative D1 assessment and credential records.';
      });
    }
    if (['privacy','terms','disclaimer','credential-policy'].includes(root)) {
      document.querySelectorAll('h3').forEach(h => {
        if (h.textContent.trim() === 'Production status' && h.nextElementSibling) {
          h.nextElementSibling.textContent = 'Live authentication, cross-device progress sync, server-graded assessments, authoritative D1 credential issuance, and public verification are connected.';
        }
      });
    }
  }

  function enhance() {
    enhanceLesson();
    enhanceOfficialForm();
    enhanceResult();
    addFounderContact();
    cleanStaleCopy();
  }

  document.addEventListener('click', e => {
    const q = e.target.closest('a[href^="#/quiz/"]');
    if (q && !e.defaultPrevented) {
      const [, pathway, rawPart] = parts(q.getAttribute('href'));
      if (pathway && rawPart && !isLearningMarked(pathway, Number(rawPart))) {
        e.preventDefault();
        e.stopPropagation();
        flashGuide();
        return;
      }
    }

    const resultLink = e.target.closest('.cm-result a[href^="#/"]');
    if (resultLink) {
      e.preventDefault();
      e.stopPropagation();
      hardNavigate(resultLink.getAttribute('href'));
    }
  }, true);

  document.addEventListener('submit', e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'cm-official-form') return;
    form.querySelectorAll('.cm-e2e-unanswered').forEach(x => x.classList.remove('cm-e2e-unanswered'));
    const fieldsets = [...form.querySelectorAll('.cm-official-question')];
    const missing = fieldsets.filter(f => !f.querySelector('input[type="radio"]:checked'));
    const writing = form.querySelector('textarea[name="writing"]');
    const missingWriting = !!writing && !writing.value.trim();
    if (!missing.length && !missingWriting) return saveDraft(form);

    e.preventDefault();
    e.stopImmediatePropagation();
    missing.forEach(f => f.classList.add('cm-e2e-unanswered'));
    if (missingWriting) writing.classList.add('cm-e2e-unanswered');
    form.querySelector('.cm-e2e-form-error')?.remove();
    const error = document.createElement('div');
    error.className = 'cm-e2e-form-error';
    error.textContent = `Complete every question${missingWriting ? ' and the written recommendation' : ''} before submitting.`;
    form.prepend(error);
    (missing[0] || writing || error).scrollIntoView({behavior:'smooth', block:'center'});
  }, true);

  window.addEventListener('hashchange', () => {
    const d = dirty();
    if (d && d.pageToken === PAGE_TOKEN && d.route !== location.hash) {
      clearDirty();
      setTimeout(() => location.reload(), 0);
      return;
    }
    setTimeout(enhance, 40);
  });

  window.addEventListener('pageshow', () => setTimeout(enhance, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(enhance, 60));

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, {childList:true, subtree:true});

  const style = document.createElement('style');
  style.id = 'cm-e2e-styles';
  style.textContent = `
    .cm-e2e-complete-guide{display:grid;grid-template-columns:40px 1fr;gap:13px;align-items:start;margin:25px 0 14px;padding:16px 17px;border:1px solid #dbe1e6;border-radius:14px;background:#f8fafb}.cm-e2e-complete-guide strong{color:var(--navy)}.cm-e2e-complete-guide p{margin:4px 0 0;line-height:1.5}.cm-e2e-step{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-weight:900}.cm-e2e-step.good{background:#e7f4ec;color:#245b43}.cm-e2e-complete-guide.flash{animation:cmE2eFlash 1s ease}.cm-e2e-locked{opacity:.55;cursor:not-allowed;filter:saturate(.45)}.cm-e2e-marked{opacity:.78}.cm-e2e-save-note,.cm-e2e-result-note{padding:12px 14px;border-radius:11px;margin:12px 0 19px;line-height:1.5}.cm-e2e-save-note{background:#f5f7fa;border:1px solid #e0e5ea;color:#4b5865}.cm-e2e-result-note{background:#f6f2e8;border:1px solid #e2d2a9;color:#5b5138;text-align:left}.cm-e2e-form-error{padding:12px 14px;border-radius:10px;background:#fff0f0;color:#8b3232;margin-bottom:16px;font-weight:700}.cm-e2e-unanswered{border-color:#d98989!important;box-shadow:0 0 0 2px rgba(180,60,60,.08)}.cm-e2e-founder-contact{max-width:1120px;margin:28px auto 0;padding:24px;border:1px solid #dfe4e8;border-radius:18px;background:#fff;box-shadow:var(--shadow-sm)}.cm-e2e-founder-contact h3{font-size:1.6rem;color:var(--navy);margin:6px 0 8px}.cm-e2e-founder-contact p{margin:0 0 16px}.cm-e2e-contact-actions{display:flex;gap:10px;flex-wrap:wrap}@keyframes cmE2eFlash{0%,100%{box-shadow:none}35%{box-shadow:0 0 0 5px rgba(185,138,67,.2);border-color:var(--gold)}}@media(max-width:700px){.cm-e2e-complete-guide{grid-template-columns:34px 1fr;padding:14px}.cm-e2e-step{width:32px;height:32px}.cm-e2e-founder-contact{margin:20px 16px 0}.cm-e2e-contact-actions .btn{width:100%}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  enhance();
})();
