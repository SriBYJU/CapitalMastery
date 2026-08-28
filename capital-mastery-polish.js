(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PASS = 80;
  const DIRTY_KEY = 'cmOfficialUiDirtyV3';
  const DRAFT_PREFIX = 'cmOfficialDraftV2:';
  const PAGE_TOKEN = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const CONTACT_EMAIL = 'avadhanula.shriyan@gmail.com';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/shriyan-avadhanula-744190428/';
  const API_ALIASES = { fpa: 'fp-and-a', 'fp-a': 'fp-and-a', 'fp&a': 'fp-and-a' };

  let reconcileBusy = false;
  let lastReconcileAt = 0;

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function routeParts(hash = location.hash) {
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

  function learningMarked(pathwayId, part) {
    return Array.isArray(careerState(pathwayId)?.learningComplete) &&
      careerState(pathwayId).learningComplete.includes(Number(part));
  }

  function signedIn() {
    return !!window.CM_AUTH?.user;
  }

  async function idToken() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  function apiPathway(id) {
    return API_ALIASES[id] || id;
  }

  async function apiFetch(path, options = {}) {
    const token = await idToken();
    if (!token) throw new Error('Sign in to continue.');
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  function getDirty() {
    try { return JSON.parse(sessionStorage.getItem(DIRTY_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function setDirty() {
    sessionStorage.setItem(DIRTY_KEY, JSON.stringify({ route: location.hash || '#/', pageToken: PAGE_TOKEN, at: Date.now() }));
  }

  function clearDirty() {
    sessionStorage.removeItem(DIRTY_KEY);
  }

  const initialDirty = getDirty();
  if (initialDirty && initialDirty.pageToken !== PAGE_TOKEN) clearDirty();

  function hardNavigate(hash) {
    clearDirty();
    if (hash && hash !== location.hash) location.hash = hash;
    location.reload();
  }

  function enhanceLessonCompletion() {
    const [root, pathwayId, rawPart] = routeParts();
    if (root !== 'learn' || !pathwayId || !rawPart) return;
    const part = Number(rawPart);
    if (!Number.isFinite(part)) return;

    const actions = document.querySelector('.lesson-content .lesson-actions');
    if (!actions) return;

    const marked = learningMarked(pathwayId, part);
    let callout = document.querySelector('.cm-completion-gate');
    if (!callout) {
      callout = document.createElement('div');
      callout.className = 'cm-completion-gate';
      actions.parentNode.insertBefore(callout, actions);
    }

    callout.innerHTML = marked
      ? `<div class="cm-step-check">✓</div><div><strong>Learning marked complete.</strong><p>Your lesson completion is saved in your progress. You can now take the official assessment; score ${PASS}% or higher to complete this part.</p></div>`
      : `<div class="cm-step-number">1</div><div><strong>Before you take the quiz: mark this lesson complete.</strong><p>Click <b>Mark Learning Complete</b> below first. That records that you finished the lesson and unlocks the assessment. Then you still need ${PASS}%+ on the quiz to complete the part.</p></div>`;

    const markButton = actions.querySelector('button[onclick*="CM.markPart"]');
    if (markButton) {
      if (marked) {
        markButton.textContent = '✓ Learning Complete';
        markButton.disabled = true;
        markButton.classList.add('cm-marked-button');
      } else {
        markButton.textContent = '✓ Mark Learning Complete';
        markButton.disabled = false;
        markButton.classList.remove('cm-marked-button');
      }
    }

    const quizLink = actions.querySelector(`a[href^="#/quiz/${CSS.escape(pathwayId)}/${part}"]`) || actions.querySelector('a[href^="#/quiz/"]');
    if (quizLink) {
      quizLink.dataset.cmQuizPathway = pathwayId;
      quizLink.dataset.cmQuizPart = String(part);
      if (marked) {
        quizLink.classList.remove('cm-quiz-locked');
        quizLink.removeAttribute('aria-disabled');
        quizLink.textContent = part === 5 ? 'Take Simulation Knowledge Check →' : 'Take Official Assessment →';
      } else {
        quizLink.classList.add('cm-quiz-locked');
        quizLink.setAttribute('aria-disabled', 'true');
        quizLink.textContent = 'Mark Complete to Unlock Quiz →';
      }
    }
  }

  function flashCompletionGate() {
    const box = document.querySelector('.cm-completion-gate');
    if (!box) return;
    box.classList.remove('cm-flash');
    void box.offsetWidth;
    box.classList.add('cm-flash');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function draftKey() {
    const uid = window.CM_AUTH?.user?.uid || 'anonymous';
    return `${DRAFT_PREFIX}${uid}:${location.hash || '#/'}`;
  }

  function saveOfficialDraft(form) {
    if (!form) return;
    const answers = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(input => { answers[input.name] = input.value; });
    const writing = form.querySelector('textarea[name="writing"]')?.value || '';
    sessionStorage.setItem(draftKey(), JSON.stringify({ answers, writing, at: Date.now() }));
  }

  function restoreOfficialDraft(form) {
    if (!form || form.dataset.cmDraftReady === '1') return;
    form.dataset.cmDraftReady = '1';
    let draft = null;
    try { draft = JSON.parse(sessionStorage.getItem(draftKey()) || 'null'); } catch (_) {}
    if (draft?.answers) {
      for (const input of form.querySelectorAll('input[type="radio"]')) {
        if (draft.answers[input.name] === input.value) input.checked = true;
      }
    }
    const writing = form.querySelector('textarea[name="writing"]');
    if (writing && draft?.writing) writing.value = draft.writing;
    form.addEventListener('change', () => saveOfficialDraft(form));
    form.addEventListener('input', () => saveOfficialDraft(form));
  }

  function clearOfficialDraft() {
    sessionStorage.removeItem(draftKey());
  }

  function showFormError(form, message, firstFieldset = null) {
    form.querySelector('.cm-polish-error')?.remove();
    const box = document.createElement('div');
    box.className = 'cm-polish-error';
    box.textContent = message;
    form.prepend(box);
    (firstFieldset || box).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function addPassedBanner() {
    const form = document.getElementById('cm-official-form');
    if (!form || form.dataset.cmPassChecked === '1' || !signedIn()) return;
    form.dataset.cmPassChecked = '1';

    const [root, pathwayId, rawPart] = routeParts();
    let itemId = '';
    if (root === 'quiz' && pathwayId && rawPart) itemId = `part-${Number(rawPart)}`;
    if (root === 'official-simulation' && pathwayId) itemId = 'simulation';
    if (root === 'final' && pathwayId) itemId = 'final';
    if (!pathwayId || !itemId) return;

    try {
      const data = await apiFetch(`/progress/${encodeURIComponent(apiPathway(pathwayId))}`);
      const row = (data.progress || []).find(x => x.item_id === itemId);
      if (!row || Number(row.completed) !== 1 || Number(row.best_score || 0) < PASS) return;

      const banner = document.createElement('div');
      banner.className = 'cm-already-passed';
      banner.innerHTML = `<strong>✓ Already passed — best score ${Number(row.best_score)}%.</strong><span>Your official progress is saved. You may retake this assessment if you want; your best recorded score stays on your progress.</span>`;
      form.parentNode.insertBefore(banner, form);
    } catch (error) {
      console.warn('Could not check prior official result:', error);
    }
  }

  function enhanceOfficialAssessment() {
    const form = document.getElementById('cm-official-form');
    if (!form) return;
    restoreOfficialDraft(form);
    addPassedBanner();

    if (!document.querySelector('.cm-assessment-save-note')) {
      const security = document.querySelector('.cm-security-note');
      if (security) {
        const note = document.createElement('div');
        note.className = 'cm-assessment-save-note';
        note.innerHTML = '<strong>Progress protection:</strong> your answers are temporarily saved in this tab while you work. Your official result is saved to your account after you submit.';
        security.insertAdjacentElement('afterend', note);
      }
    }
  }

  function enhanceResult() {
    const result = document.querySelector('.cm-result');
    if (!result || result.dataset.cmPolished === '1') return;
    result.dataset.cmPolished = '1';
    setDirty();
    clearOfficialDraft();

    const note = document.createElement('div');
    note.className = 'cm-result-refresh-note';
    note.innerHTML = '<strong>Your official result is saved.</strong> If a pathway card does not immediately show <b>Complete</b>, reload the page once to refresh the display. Capital Mastery will also refresh progress automatically when you continue.';
    const actions = result.querySelector('.cm-result-actions');
    if (actions) actions.insertAdjacentElement('beforebegin', note);
    else result.appendChild(note);
  }

  async function reconcileOfficialProgress({ force = false } = {}) {
    if (reconcileBusy || !signedIn()) return false;
    const now = Date.now();
    if (!force && now - lastReconcileAt < 25000) return false;

    const [root, pathwayId] = routeParts();
    if (!pathwayId || !['career', 'learn', 'quiz', 'official-simulation', 'simulation', 'final', 'achievement', 'credential', 'certificate'].includes(root)) return false;
    const state = readState();
    if (!state) return false;

    reconcileBusy = true;
    lastReconcileAt = now;
    try {
      const data = await apiFetch(`/progress/${encodeURIComponent(apiPathway(pathwayId))}`);
      const rows = Array.isArray(data.progress) ? data.progress : [];
      state.careers ||= {};
      state.careers[pathwayId] ||= { learningComplete: [], completedParts: [], quizScores: {}, simulationKnowledge: null, simulationScore: null, finalScore: null, applied: {}, simResponses: {}, readiness: null };
      const cs = state.careers[pathwayId];
      cs.learningComplete ||= [];
      cs.completedParts ||= [];
      cs.quizScores ||= {};
      let changed = false;

      const add = (arr, value) => {
        if (!arr.includes(value)) { arr.push(value); changed = true; }
      };
      const setMax = (key, score) => {
        const current = Number(cs[key] || 0);
        const next = Math.max(current, Number(score || 0));
        if (next !== current) { cs[key] = next; changed = true; }
      };

      for (const row of rows) {
        const score = Number(row.best_score || 0);
        const passed = Number(row.completed) === 1 && score >= PASS;
        const partMatch = /^part-(\d)$/.exec(String(row.item_id || ''));
        if (partMatch) {
          const part = Number(partMatch[1]);
          if (part <= 4) {
            const current = Number(cs.quizScores[part] || 0);
            if (score > current) { cs.quizScores[part] = score; changed = true; }
          } else if (part === 5) {
            setMax('simulationKnowledge', score);
          }
          if (passed) {
            add(cs.learningComplete, part);
            add(cs.completedParts, part);
          }
        } else if (row.item_id === 'simulation') {
          setMax('simulationScore', score);
          if (passed) { add(cs.learningComplete, 5); add(cs.completedParts, 5); }
        } else if (row.item_id === 'final') {
          setMax('finalScore', score);
        }
      }

      if (changed) {
        cs.learningComplete.sort((a, b) => a - b);
        cs.completedParts.sort((a, b) => a - b);
        state.updatedAt = new Date().toISOString();
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        window.CM_SYNC?.flush?.().catch(() => {});
      }
      return changed;
    } catch (error) {
      console.warn('Official progress reconciliation failed:', error);
      return false;
    } finally {
      reconcileBusy = false;
    }
  }

  function enhanceAbout() {
    const [root] = routeParts();
    if (root !== 'about') return;
    const founder = document.querySelector('.about-founder');
    if (!founder || document.querySelector('.cm-founder-contact')) return;

    const section = document.createElement('section');
    section.className = 'cm-founder-contact';
    section.innerHTML = `
      <div class="eyebrow">CONNECT WITH THE FOUNDER</div>
      <h3>Questions, feedback, or collaboration?</h3>
      <p>Reach Shriyan Avadhanula directly or connect on LinkedIn.</p>
      <div class="cm-founder-contact-actions">
        <a class="btn btn-primary" href="mailto:${esc(CONTACT_EMAIL)}">Email Shriyan</a>
        <a class="btn btn-outline" href="${esc(LINKEDIN_URL)}" target="_blank" rel="noopener noreferrer">View LinkedIn ↗</a>
      </div>
      <div class="small muted cm-founder-contact-meta">${esc(CONTACT_EMAIL)}</div>`;
    founder.insertAdjacentElement('afterend', section);
  }

  function fixStaleCopy() {
    const [root] = routeParts();

    if (root === 'learn') {
      document.querySelectorAll('.lesson-section > p').forEach(p => {
        if (p.textContent.includes('Save drafts locally')) {
          p.textContent = 'You now complete realistic smaller assignments. Drafts save automatically to your signed-in progress as you type, so you can revise them before taking the Part 4 assessment.';
        }
      });
    }

    if (root === 'admin-preview') {
      document.querySelectorAll('p').forEach(p => {
        if (p.textContent.includes('Firebase will later protect this area')) {
          p.textContent = 'This QA area is restricted to the server-verified administrator account. Production learner scores and credentials remain authoritative in the secure backend.';
        }
        if (p.textContent.includes('Firebase data is not involved')) {
          p.textContent = 'This clears only local QA state. It does not delete Firestore progress or authoritative D1 assessment and credential records.';
        }
      });
    }

    if (['privacy', 'terms', 'disclaimer', 'credential-policy'].includes(root)) {
      document.querySelectorAll('h3').forEach(h => {
        if (h.textContent.trim() === 'Production status') {
          const p = h.nextElementSibling;
          if (p) p.textContent = 'Live account authentication, cross-device progress sync, server-graded assessments, and authoritative D1 credential issuance are connected. Public credential verification uses the secure Capital Mastery API.';
        }
      });
    }
  }

  function enhanceAll() {
    enhanceLessonCompletion();
    enhanceOfficialAssessment();
    enhanceResult();
    enhanceAbout();
    fixStaleCopy();
  }

  document.addEventListener('click', event => {
    const quizLink = event.target.closest('a[href^="#/quiz/"]');
    if (quizLink && !event.defaultPrevented) {
      const [, pathwayId, rawPart] = routeParts(quizLink.getAttribute('href'));
      const part = Number(rawPart);
      if (pathwayId && Number.isFinite(part) && !learningMarked(pathwayId, part)) {
        event.preventDefault();
        event.stopPropagation();
        flashCompletionGate();
        return;
      }
    }

    const anchor = event.target.closest('.cm-result a[href^="#/"]');
    if (!anchor) return;
    const target = anchor.getAttribute('href') || '';
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    hardNavigate(target);
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'cm-official-form') return;

    const fieldsets = [...form.querySelectorAll('.cm-official-question')];
    fieldsets.forEach(f => f.classList.remove('cm-unanswered'));
    const unanswered = fieldsets.filter(f => !f.querySelector('input[type="radio"]:checked'));
    const writing = form.querySelector('textarea[name="writing"]');
    const writingMissing = !!writing && !writing.value.trim();

    if (unanswered.length || writingMissing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      unanswered.forEach(f => f.classList.add('cm-unanswered'));
      if (writingMissing) writing.classList.add('cm-unanswered-writing');
      showFormError(form, `Complete every question${writingMissing ? ' and the written recommendation' : ''} before submitting.`, unanswered[0] || writing);
      return;
    }

    if (writing) writing.classList.remove('cm-unanswered-writing');
    saveOfficialDraft(form);
  }, true);

  window.addEventListener('hashchange', () => {
    const dirty = getDirty();
    if (dirty && dirty.pageToken === PAGE_TOKEN && dirty.route !== location.hash) {
      clearDirty();
      setTimeout(() => location.reload(), 0);
      return;
    }
    setTimeout(async () => {
      enhanceAll();
      const changed = await reconcileOfficialProgress({ force: true });
      if (changed && !document.querySelector('.cm-result')) location.reload();
    }, 80);
  });

  window.addEventListener('pageshow', event => {
    setTimeout(async () => {
      enhanceAll();
      if (event.persisted) {
        const changed = await reconcileOfficialProgress({ force: true });
        if (changed) location.reload();
      }
    }, 80);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    setTimeout(async () => {
      const changed = await reconcileOfficialProgress();
      if (changed && !document.querySelector('.cm-result')) location.reload();
    }, 120);
  });

  document.addEventListener('cm-auth-changed', () => setTimeout(enhanceAll, 100));

  const observer = new MutationObserver(() => enhanceAll());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.id = 'cm-polish-styles';
  style.textContent = `
    .cm-completion-gate{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;margin:26px 0 14px;padding:17px 18px;border:1px solid #d6dde4;border-radius:14px;background:#f8fafb;color:#344250}
    .cm-completion-gate strong{display:block;color:var(--navy);font-size:1rem;margin-bottom:4px}.cm-completion-gate p{margin:0;line-height:1.55}
    .cm-step-number,.cm-step-check{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:var(--navy);color:#fff}.cm-step-check{background:#e8f4ed;color:#245b43}
    .cm-completion-gate.cm-flash{animation:cmFlash 1.05s ease}.cm-marked-button{opacity:.78;cursor:default}.cm-quiz-locked{opacity:.58;cursor:not-allowed;filter:saturate(.45)}
    .cm-assessment-save-note,.cm-already-passed,.cm-result-refresh-note{padding:13px 15px;border-radius:11px;margin:12px 0 20px;line-height:1.5}
    .cm-assessment-save-note{background:#f5f7fa;border:1px solid #e0e5ea;color:#4b5865}.cm-already-passed{display:grid;gap:3px;background:#eaf6ef;border:1px solid #c7dfd1;color:#245b43}.cm-result-refresh-note{background:#f6f2e8;border:1px solid #e1d1a8;color:#5b5138;text-align:left}
    .cm-polish-error{padding:12px 14px;border-radius:10px;background:#fff0f0;color:#8b3232;margin:0 0 16px;font-weight:700}.cm-official-question.cm-unanswered{border-color:#d98989;box-shadow:0 0 0 2px rgba(180,60,60,.08)}.cm-unanswered-writing{border-color:#d98989!important}
    .cm-founder-contact{max-width:1120px;margin:28px auto 0;padding:24px;border:1px solid #dfe4e8;border-radius:18px;background:#fff;box-shadow:var(--shadow-sm)}.cm-founder-contact h3{font-size:1.6rem;color:var(--navy);margin:6px 0 8px}.cm-founder-contact p{margin:0 0 16px}.cm-founder-contact-actions{display:flex;gap:10px;flex-wrap:wrap}.cm-founder-contact-meta{margin-top:14px}
    @keyframes cmFlash{0%,100%{box-shadow:none}35%{box-shadow:0 0 0 5px rgba(185,138,67,.2);border-color:var(--gold)}}
    @media(max-width:700px){.cm-completion-gate{grid-template-columns:34px 1fr;padding:14px}.cm-step-number,.cm-step-check{width:32px;height:32px}.cm-founder-contact{margin:20px 16px 0}.cm-founder-contact-actions .btn{width:100%}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  enhanceAll();
  setTimeout(async () => {
    enhanceAll();
    const changed = await reconcileOfficialProgress({ force: true });
    if (changed && !document.querySelector('.cm-result')) location.reload();
  }, 250);
})();
