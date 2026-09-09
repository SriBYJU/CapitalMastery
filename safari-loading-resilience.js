(() => {
  'use strict';

  const AUTH_TIMEOUT_MS = 15000;
  let timedOut = false;

  function currentAuth() {
    return window.CM_AUTH || null;
  }

  function notifyAuthChanged(auth) {
    document.dispatchEvent(new CustomEvent('cm-auth-changed', {
      detail: {
        user: auth && auth.user ? auth.user : null,
        isAdmin: !!(auth && auth.isAdmin),
        backendVerified: !!(auth && auth.backendVerified),
        initializationTimedOut: true
      }
    }));
  }

  function showRecoverableLoginMessage() {
    const hash = location.hash || '#/';
    if (!(hash === '#/login' || hash.startsWith('#/login?'))) return;
    const main = document.querySelector('#app main#main');
    if (!main) return;
    const existing = main.querySelector('[data-cm-safari-auth-recovery]');
    if (existing) return;

    const section = document.createElement('section');
    section.className = 'section';
    section.setAttribute('data-cm-safari-auth-recovery', 'true');
    section.innerHTML = '<div class="container" style="max-width:760px"><div class="card"><div class="eyebrow">SECURE ACCOUNT</div><h1 class="serif" style="font-size:2.5rem;color:var(--navy)">Sign-in took too long to initialize.</h1><p>Capital Mastery did not receive Firebase\'s startup response in this browser session. Your account and workspace data have not been changed.</p><div class="hero-actions"><button type="button" class="btn btn-primary" data-cm-safari-auth-reload>Reload secure sign-in</button><a class="btn btn-outline" href="#/">Return home</a></div><p class="small muted" style="margin-top:14px">If this repeats in Safari, check that content blockers or private browsing settings are not blocking Google/Firebase resources.</p></div></div>';
    main.replaceChildren(section);
    section.querySelector('[data-cm-safari-auth-reload]')?.addEventListener('click', () => location.reload());
  }

  function releaseInfiniteAuthLoading() {
    const auth = currentAuth();
    if (auth && auth.ready) return;
    timedOut = true;

    if (auth) {
      auth.ready = true;
      auth.initializationTimedOut = true;
      auth.user = auth.user || null;
    } else {
      window.CM_AUTH = {
        ready: true,
        user: null,
        isAdmin: false,
        backendVerified: false,
        initializationTimedOut: true,
        async getIdToken() { return null; }
      };
    }

    notifyAuthChanged(window.CM_AUTH);
    setTimeout(showRecoverableLoginMessage, 0);
  }

  function rerouteAfterSafariRestore(event) {
    if (!event || event.persisted !== true) return;
    setTimeout(() => {
      const auth = currentAuth();
      if (auth && auth.ready) notifyAuthChanged(auth);
      if (window.CM_ENTERPRISE_V2 && typeof window.CM_ENTERPRISE_V2.route === 'function') {
        Promise.resolve(window.CM_ENTERPRISE_V2.route()).catch(() => {});
      }
    }, 0);
  }

  function clearRecoveryWhenAuthReturns() {
    const auth = currentAuth();
    if (!auth || !auth.user) return;
    timedOut = false;
    auth.initializationTimedOut = false;
  }

  setTimeout(releaseInfiniteAuthLoading, AUTH_TIMEOUT_MS);
  window.addEventListener('pageshow', rerouteAfterSafariRestore);
  document.addEventListener('cm-auth-changed', clearRecoveryWhenAuthReturns);

  window.CM_SAFARI_LOADING_RESILIENCE = Object.freeze({
    authTimeoutMs: AUTH_TIMEOUT_MS,
    get timedOut() { return timedOut; },
    recover: releaseInfiniteAuthLoading
  });
})();
