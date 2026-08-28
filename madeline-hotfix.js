(() => {
  'use strict';

  function closeMadeline() {
    const root = document.getElementById('cm-madeline-root');
    if (!root) return;
    const panel = root.querySelector('.cm-madeline-panel');
    const launch = root.querySelector('.cm-madeline-launch');
    if (panel) panel.hidden = true;
    if (launch) launch.setAttribute('aria-expanded', 'false');
    root.classList.remove('open');
  }

  function install() {
    const root = document.getElementById('cm-madeline-root');
    if (!root || root.dataset.cmCloseHotfix === '1') return;
    root.dataset.cmCloseHotfix = '1';

    // Madeline should always begin closed when a page is opened/refreshed.
    closeMadeline();

    root.addEventListener('click', event => {
      if (!event.target.closest('[data-cm-madeline-close]')) return;
      event.preventDefault();
      closeMadeline();
    }, true);
  }

  const style = document.createElement('style');
  style.id = 'cm-madeline-hotfix-style';
  style.textContent = `
    #cm-madeline-root .cm-madeline-panel[hidden]{display:none!important;visibility:hidden!important;pointer-events:none!important}
    #cm-madeline-root .cm-madeline-head [data-cm-madeline-close]{position:relative;z-index:5;pointer-events:auto;touch-action:manipulation;cursor:pointer}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMadeline();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();

  const observer = new MutationObserver(install);
  observer.observe(document.body || document.documentElement, { childList:true, subtree:true });
})();
