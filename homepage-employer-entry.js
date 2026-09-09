(() => {
  'use strict';

  const BUTTON_ATTR = 'data-cm-employer-workspace-entry';

  function addEmployerWorkspaceEntry() {
    const actions = document.querySelector('.hero .hero-actions');
    if (!actions || actions.querySelector(`[${BUTTON_ATTR}]`)) return;

    const link = document.createElement('a');
    link.className = 'btn btn-gold';
    link.href = '#/employer';
    link.setAttribute(BUTTON_ATTR, 'true');
    link.textContent = 'Employer Workspace →';
    actions.appendChild(link);
  }

  addEmployerWorkspaceEntry();
  window.addEventListener('hashchange', () => requestAnimationFrame(addEmployerWorkspaceEntry));
})();
