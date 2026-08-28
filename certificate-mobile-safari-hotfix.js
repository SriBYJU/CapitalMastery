(() => {
  'use strict';

  let scheduled = false;

  function fitCertificate() {
    const frame = document.querySelector('.cm-cert-responsive-frame');
    const cert = frame?.querySelector('#certificate');
    if (!frame || !cert || window.innerWidth > 700) return;

    const parentWidth = frame.parentElement?.clientWidth || document.documentElement.clientWidth - 16;
    const available = Math.max(260, Math.min(parentWidth, document.documentElement.clientWidth - 16, 700));
    const baseWidth = 1000;
    const baseHeight = 707.2;
    const scale = available / baseWidth;

    frame.style.setProperty('width', `${available}px`, 'important');
    frame.style.setProperty('height', `${baseHeight * scale}px`, 'important');
    frame.style.setProperty('margin-left', 'auto', 'important');
    frame.style.setProperty('margin-right', 'auto', 'important');
    cert.style.setProperty('width', `${baseWidth}px`, 'important');
    cert.style.setProperty('height', `${baseHeight}px`, 'important');
    cert.style.setProperty('max-width', 'none', 'important');
    cert.style.setProperty('transform-origin', 'top left', 'important');
    cert.style.setProperty('transform', `scale(${scale})`, 'important');
    cert.style.setProperty('left', '0', 'important');
    cert.style.setProperty('top', '0', 'important');
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fitCertificate();
    });
  }

  window.addEventListener('resize', schedule, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(schedule, 120));
  window.addEventListener('hashchange', () => setTimeout(schedule, 40));
  document.addEventListener('cm-auth-changed', () => setTimeout(schedule, 60));

  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, { childList:true, subtree:true });

  setTimeout(schedule, 120);
})();