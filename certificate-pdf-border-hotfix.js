(() => {
  'use strict';

  const style = document.createElement('style');
  style.id = 'cm-pdf-border-hotfix-styles';
  style.textContent = `
    .cm-pdf-export-stage .cm-pdf-certificate{
      border:10px solid #071a33!important;
      box-shadow:inset 0 0 0 2px #d1af6b!important;
      background:#fffdf8!important;
    }
    .cm-pdf-export-stage .cm-pdf-certificate:before{
      content:""!important;
      position:absolute!important;
      inset:11px!important;
      border:1px solid #b98a43!important;
      pointer-events:none!important;
    }
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  function labelButton() {
    const button = document.querySelector('[data-cm-live-pdf], [data-cm-live-print]');
    if (button && button.textContent.trim() !== 'Download PDF') button.textContent = 'Download PDF';
  }

  window.addEventListener('hashchange', () => setTimeout(labelButton, 60));
  const app = document.getElementById('app');
  if (app) new MutationObserver(labelButton).observe(app, { childList:true, subtree:true });
  setTimeout(labelButton, 120);
})();
