(() => {
  'use strict';

  const ONBOARD_PREFIX = 'cmCredentialNameOnboardedV3:';
  const STATE_KEY = 'capitalMasteryLocalStateV1';

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

    // Migration only: an established account that already has a real first + last
    // display name can be treated as having completed the old setup. Brand-new
    // Google/email accounts still go through the required one-time name screen.
    if (isEstablishedAccount(user) && looksLikeFullName(user.displayName)) {
      migrateProfileName(user);
      localStorage.setItem(key, 'true');
    }
  }

  document.addEventListener('cm-auth-changed', event => migrate(event.detail?.user || null));

  if (window.CM_AUTH?.ready && window.CM_AUTH.user) migrate(window.CM_AUTH.user);
})();