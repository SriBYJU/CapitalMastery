(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const PASS = 80;

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parts() {
    return String(location.hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return s && s.version === 1 ? s : null;
    } catch (_) { return null; }
  }

  function qaMode() {
    return localStorage.getItem(QA_KEY) === 'true';
  }

  function learningMarked(pathway, part) {
    const list = readState()?.careers?.[pathway]?.learningComplete;
    return Array.isArray(list) && list.includes(Number(part));
  }

  function enforceDirectQuizGate() {
    const [root, pathway, rawPart] = parts();
    if (root !== 'quiz' || !pathway || !rawPart || qaMode() || !window.CM_AUTH?.ready || !window.CM_AUTH?.user) return false;
    const part = Number(rawPart);
    if (!Number.isFinite(part) || part < 1 || part > 5 || learningMarked(pathway, part)) return false;
    location.replace(`#/learn/${encodeURIComponent(pathway)}/${part}`);
    return true;
  }

  function assessmentContext() {
    const [root, pathway, rawPart] = parts();
    if (!pathway) return null;
    if (root === 'quiz' && rawPart) {
      const part = Number(rawPart);
      if (!Number.isFinite(part)) return null;
      return {
        pathway,
        itemId:`part-${part}`,
        next:part < 5 ? `#/learn/${pathway}/${part+1}` : `#/official-simulation/${pathway}`
      };
    }
    if (root === 'official-simulation') return { pathway, itemId:'simulation', next:`#/final/${pathway}` };
    if (root === 'final') return { pathway, itemId:'final', next:'#/credentials' };
    return null;
  }

  async function authToken() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function showPriorPass() {
    const form = document.getElementById('cm-official-form');
    const ctx = assessmentContext();
    if (!form || !ctx || form.dataset.cmPriorPassChecked === '1' || !window.CM_AUTH?.user || !API) return;
    form.dataset.cmPriorPassChecked = '1';
    try {
      const token = await authToken();
      if (!token) return;
      const response = await fetch(`${API}/progress/${encodeURIComponent(ctx.pathway)}`, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const row = (data.progress || []).find(x => x.item_id === ctx.itemId);
      if (!row || Number(row.completed) !== 1 || Number(row.best_score || 0) < PASS || document.querySelector('.cm-prior-pass')) return;
      const box = document.createElement('div');
      box.className = 'cm-prior-pass';
      box.innerHTML = `<div><strong>✓ You already passed this requirement.</strong><p>Your official best score is <b>${Number(row.best_score)}%</b> and is saved to your account. You may retake it, or continue without redoing the quiz.</p></div><a class="btn btn-gold btn-sm" href="${esc(ctx.next)}">Continue →</a>`;
      form.parentNode.insertBefore(box, form);
    } catch (_) {}
  }

  function refreshPolicyCopy() {
    const [root] = parts();
    if (!['privacy','terms','disclaimer','credential-policy'].includes(root)) return;
    const card = document.querySelector('main#main .card');
    if (!card || card.dataset.cmPolicyUpdated === '1') return;
    card.dataset.cmPolicyUpdated = '1';
    const first = card.querySelector(':scope > p');
    if (root === 'privacy' && first) {
      first.textContent = 'Capital Mastery uses account information, learning progress, assessment results, and credential records to provide signed-in learning, cross-device progress, secure grading, and credential verification. Public verification is designed not to expose a learner’s Firebase UID or email.';
    }
    if (root === 'terms' && first) {
      first.textContent = 'Capital Mastery is an educational platform. Users may not misrepresent credentials, interfere with assessment integrity, impersonate another learner, or misuse verification records.';
    }
    const status = [...card.querySelectorAll('h3')].find(h => h.textContent.trim() === 'Production status');
    if (status?.nextElementSibling) {
      status.nextElementSibling.textContent = 'Live authentication, Firestore learning-progress sync, server-graded assessments, authoritative D1 credential issuance, and public credential verification are connected.';
    }
  }

  function enhance() {
    if (enforceDirectQuizGate()) return;
    refreshPolicyCopy();
    showPriorPass();
  }

  window.addEventListener('hashchange', () => setTimeout(enhance, 30));
  document.addEventListener('cm-auth-changed', () => setTimeout(enhance, 50));
  window.addEventListener('pagehide', () => { window.CM_SYNC?.flush?.().catch(() => {}); });

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList:true, subtree:true });

  const style = document.createElement('style');
  style.id = 'cm-course-continuity-styles';
  style.textContent = `
    .cm-prior-pass{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px 15px;border-radius:12px;background:#eaf6ef;border:1px solid #c7dfd1;color:#245b43;margin:0 0 18px}.cm-prior-pass strong{color:#245b43}.cm-prior-pass p{margin:3px 0 0}.cm-prior-pass .btn{flex:0 0 auto}
    @media(max-width:680px){.cm-prior-pass{display:grid}.cm-prior-pass .btn{width:100%}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  enhance();
})();
