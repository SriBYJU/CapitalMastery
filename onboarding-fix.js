(() => {
  'use strict';

  const ONBOARD_PREFIX = 'cmCredentialNameOnboardedV3:';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PENDING_ROUTE_KEY = 'cmPendingLearningRouteV1';

  function isEstablishedAccount(user) {
    const creation = Date.parse(user?.metadata?.creationTime || 0);
    const lastSignIn = Date.parse(user?.metadata?.lastSignInTime || 0);
    if (!Number.isFinite(creation) || !Number.isFinite(lastSignIn)) return false;
    return Math.abs(lastSignIn - creation) > 120000;
  }

  function looksLikeFullName(value) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    const pieces = cleaned.split(' ').filter(Boolean);
    return cleaned.length >= 3 && pieces.length >= 2 && pieces.every(piece => /[\p{L}]/u.test(piece));
  }

  function localProfileConfirmed() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      const profile = state?.profile || {};
      const name = String(profile.certificateName || profile.name || '').replace(/\s+/g, ' ').trim();
      return profile.certificateNameConfirmed === true && looksLikeFullName(name);
    } catch (_) {
      return false;
    }
  }

  function migrateProfileName(user) {
    if (!user || !looksLikeFullName(user.displayName)) return false;
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!state || state.version !== 1) return false;
      state.profile ||= {};
      state.profile.name = user.displayName.trim();
      state.profile.certificateName = user.displayName.trim();
      state.profile.certificateNameConfirmed = true;
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      window.CM_SYNC?.flush?.().catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function migrate(user) {
    if (!user) return;
    const key = `${ONBOARD_PREFIX}${user.uid}`;
    if (localStorage.getItem(key) === 'true' || localProfileConfirmed()) {
      localStorage.setItem(key, 'true');
      return;
    }

    // Migration only: established accounts that already have a real first + last
    // display name can be treated as having completed the older setup. Brand-new
    // Google/email accounts still go through the required one-time name screen.
    if (isEstablishedAccount(user) && looksLikeFullName(user.displayName)) {
      migrateProfileName(user);
      localStorage.setItem(key, 'true');
    }
  }

  function clearPendingLearningRoute() {
    sessionStorage.removeItem(PENDING_ROUTE_KEY);
  }

  async function resumePendingRouteIfReady(user) {
    if (!user) return;
    const pending = sessionStorage.getItem(PENDING_ROUTE_KEY) || '';
    if (!pending || pending === '#/login') return;
    if (!location.hash.startsWith('#/login')) return;

    try {
      const confirmed = window.CM_CERT_NAME?.check
        ? await window.CM_CERT_NAME.check()
        : localProfileConfirmed() || localStorage.getItem(`${ONBOARD_PREFIX}${user.uid}`) === 'true';
      if (!confirmed) return;
      clearPendingLearningRoute();
      location.hash = pending;
    } catch (_) {}
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-cm-gate-close]')) {
      clearPendingLearningRoute();
      return;
    }
    const backdrop = event.target.closest('#cm-learning-gate');
    if (backdrop && event.target === backdrop) clearPendingLearningRoute();
  }, true);

  document.addEventListener('cm-auth-changed', event => {
    const user = event.detail?.user || null;
    migrate(user);
    if (user) setTimeout(() => resumePendingRouteIfReady(user), 260);
    else clearPendingLearningRoute();
  });

  document.addEventListener('cm-certificate-name-changed', event => {
    const user = event.detail?.user || window.CM_AUTH?.user || null;
    if (user) setTimeout(() => resumePendingRouteIfReady(user), 80);
  });

  if (window.CM_AUTH?.ready && window.CM_AUTH.user) {
    migrate(window.CM_AUTH.user);
    setTimeout(() => resumePendingRouteIfReady(window.CM_AUTH.user), 260);
  }
})();