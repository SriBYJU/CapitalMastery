(() => {
  'use strict';

  const QA_KEY = 'capitalMasteryQaPreviewV1';
  let scheduled = false;
  let wrapped = false;

  function parts(hash = location.hash) {
    return String(hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  }

  function isAdmin() {
    return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true;
  }

  function qaMode() {
    return localStorage.getItem(QA_KEY) === 'true';
  }

  function enableQa() {
    if (!isAdmin()) return false;
    localStorage.setItem(QA_KEY, 'true');
    return true;
  }

  function wrapAdminQaControls() {
    if (wrapped || !window.CM) return;
    wrapped = true;

    for (const name of ['qaProgress', 'qaScores', 'resetState']) {
      const original = window.CM[name];
      if (typeof original !== 'function') continue;
      window.CM[name] = function(...args) {
        if (!isAdmin()) {
          console.warn('Capital Mastery QA control blocked: administrator verification required.');
          return false;
        }
        enableQa();
        return original.apply(this, args);
      };
    }

    const originalToggle = window.CM.toggleQa;
    if (typeof originalToggle === 'function') {
      window.CM.toggleQa = function(...args) {
        if (!isAdmin()) {
          console.warn('Capital Mastery QA mode blocked: administrator verification required.');
          return false;
        }
        return originalToggle.apply(this, args);
      };
    }
  }

  function redirectOfficialSimulationForAdminPreview() {
    if (!isAdmin() || !qaMode()) return false;
    const [root, pathway] = parts();
    if (root !== 'official-simulation' || !pathway) return false;
    location.replace(`#/simulation/${encodeURIComponent(pathway)}`);
    return true;
  }

  function enhanceAdminLab() {
    if (!isAdmin() || parts()[0] !== 'admin-preview') return;

    document.querySelectorAll('.admin-card').forEach(card => {
      const heading = card.querySelector('h3')?.textContent.trim();

      if (heading === 'Progress States') {
        const p = card.querySelector('p');
        if (p) p.innerHTML = 'Set the flagship pathway to a <b>local admin QA state</b>. These buttons automatically enable QA Preview Mode and do not create official D1 progress.';
        if (!card.querySelector('.cm-admin-progress-note')) {
          const note = document.createElement('div');
          note.className = 'cm-admin-progress-note';
          note.innerHTML = '<strong>Important:</strong> 80% represents Parts 1–4 complete. In the real learner flow, Part 5 learning + the Part 5 knowledge check are still required before the official job simulation.';
          card.appendChild(note);
        }
      }

      if (heading === 'Boundary Tests') {
        const p = card.querySelector('p');
        if (p) p.innerHTML = 'Set local IB demo scores to 79, 80 or 100 for UI boundary testing. These buttons automatically enable QA Preview Mode; authoritative D1 scores are unchanged.';
      }

      if (heading === 'Boundary Tests') {
        if (!card.querySelector('.cm-admin-assessment-note')) {
          const note = document.createElement('div');
          note.className = 'cm-admin-official-note cm-admin-assessment-note';
          note.innerHTML = '<strong>Assessment preview:</strong> while QA Preview Mode is enabled, open any pathway Part 1–5 quiz or Final from the normal pathway UI. Your admin account bypasses learner prerequisites locally, but no authoritative D1 score or credential is created.';
          card.appendChild(note);
        }
      }

      if (heading === 'Simulation Lab') {
        const p = card.querySelector('p');
        if (p) p.innerHTML = '<b>Admin-only preview.</b> Open the practical simulation without completing prerequisites. This preview is local only and cannot issue an official score or credential.';
        const link = card.querySelector('a[href^="#/simulation/"]') || card.querySelector('a');
        if (link) {
          link.textContent = 'Open Admin Simulation Preview';
          link.setAttribute('data-cm-admin-sim-preview', 'true');
          link.href = '#/simulation/investment-banking';
        }
        if (!card.querySelector('.cm-admin-official-note')) {
          const note = document.createElement('div');
          note.className = 'cm-admin-official-note';
          note.innerHTML = '<strong>Official mode stays secure:</strong> disable QA Preview Mode when you want to test the real Worker/D1 prerequisite rules.';
          card.appendChild(note);
        }
      }
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      wrapAdminQaControls();
      if (redirectOfficialSimulationForAdminPreview()) return;
      enhanceAdminLab();
    });
  }

  document.addEventListener('click', event => {
    const adminPreview = event.target.closest?.('[data-cm-admin-sim-preview]');
    if (adminPreview && isAdmin()) {
      event.preventDefault();
      event.stopPropagation();
      enableQa();
      location.hash = adminPreview.getAttribute('href') || '#/simulation/investment-banking';
      return;
    }

    const official = event.target.closest?.('a[href^="#/official-simulation/"]');
    if (!official || !isAdmin() || !qaMode()) return;
    const [, pathway] = parts(official.getAttribute('href'));
    if (!pathway) return;
    event.preventDefault();
    event.stopPropagation();
    location.hash = `#/simulation/${encodeURIComponent(pathway)}`;
  }, true);

  window.addEventListener('hashchange', schedule);
  document.addEventListener('cm-auth-changed', schedule);

  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, { childList:true, subtree:true });

  const style = document.createElement('style');
  style.id = 'cm-admin-qa-simulation-fix-style';
  style.textContent = `
    .cm-admin-progress-note,.cm-admin-official-note{margin-top:12px;padding:10px 11px;border:1px solid #e0d3b3;border-radius:10px;background:#fbf7ee;color:#5d523b;font-size:.78rem;line-height:1.45}
    .cm-admin-progress-note strong,.cm-admin-official-note strong{color:var(--navy)}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  schedule();
})();
