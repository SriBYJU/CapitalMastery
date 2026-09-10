(() => {
  'use strict';

  const BUTTON_ATTR = 'data-cm-employer-workspace-entry';
  let scheduled = false;

  function isHomeRoute() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '').split('?')[0];
    return raw === '';
  }

  function addEmployerWorkspaceEntry() {
    scheduled = false;
    if (!isHomeRoute()) return;

    const actions = document.querySelector('.hero .hero-actions');
    if (!actions || actions.querySelector(`[${BUTTON_ATTR}]`)) return;

    const link = document.createElement('a');
    link.className = 'btn btn-gold';
    link.href = '#/employer';
    link.setAttribute(BUTTON_ATTR, 'true');
    link.textContent = 'Employer Workspace →';
    actions.appendChild(link);
  }

  function scheduleEntry() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(addEmployerWorkspaceEntry);
  }

  scheduleEntry();
  window.addEventListener('hashchange', scheduleEntry);
  document.addEventListener('cm-auth-changed', scheduleEntry);

  const app = document.getElementById('app');
  if (app && typeof MutationObserver !== 'undefined') {
    new MutationObserver(scheduleEntry).observe(app, { childList: true, subtree: true });
  }
})();
