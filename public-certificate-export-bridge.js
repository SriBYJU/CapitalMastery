(() => {
  'use strict';

  let scheduled = false;

  function installBridge() {
    scheduled = false;
    const section = document.querySelector('.cm-public-certificate-section');
    const cert = section?.querySelector('#certificate');
    if (!section || !cert) return;

    // The public verification page intentionally shows only Download PDF.
    // The certificate renderer, however, historically exposes its clean canvas
    // through the PNG export button. Provide an invisible renderer trigger so
    // PDF generation can use the exact same high-quality certificate artwork.
    if (!section.querySelector('[data-cm-live-png]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.hidden = true;
      button.tabIndex = -1;
      button.setAttribute('aria-hidden', 'true');
      button.setAttribute('data-cm-live-png', 'true');
      button.className = 'cm-public-cert-render-trigger';
      button.textContent = 'Render certificate image';
      section.appendChild(button);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(installBridge);
  }

  window.addEventListener('hashchange', schedule);
  document.addEventListener('cm-auth-changed', schedule);

  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, { childList:true, subtree:true });

  schedule();
})();
