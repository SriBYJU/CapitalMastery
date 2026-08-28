(() => {
  'use strict';

  const ONBOARD_PREFIX = 'cmCredentialNameOnboardedV2:';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const CREATE_INTENT_KEY = 'cmAccountCreateIntentV1';
  const GOOGLE_INTENT_KEY = 'cmGoogleAuthIntentV1';

  function accountWasJustCreatedInThisSession(user) {
    const creation = Date.parse(user?.metadata?.creationTime || 0);
    const lastSignIn = Date.parse(user?.metadata?.lastSignInTime || 0);
    const recentCreation = Number.isFinite(creation) && Number.isFinite(lastSignIn) && Math.abs(lastSignIn - creation) < 120000;
    const createIntent = sessionStorage.getItem(CREATE_INTENT_KEY) === '1';
    const googleIntent = sessionStorage.getItem(GOOGLE_INTENT_KEY) === '1';
    return recentCreation && (createIntent || googleIntent);
  }

  function cloudOrLocalNameAlreadyConfirmed() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      const profile = state?.profile || {};
      return profile.certificateNameConfirmed === true && !!String(profile.certificateName || profile.name || '').trim();
    } catch (_) {
      return false;
    }
  }

  document.addEventListener('submit', event => {
    if (event.target?.id === 'cm-create-form') {
      sessionStorage.setItem(CREATE_INTENT_KEY, '1');
    }
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-cm-auth-action="google"]');
    if (button) sessionStorage.setItem(GOOGLE_INTENT_KEY, '1');
  }, true);

  document.addEventListener('cm-auth-changed', event => {
    const user = event.detail?.user || null;
    if (!user) {
      sessionStorage.removeItem(CREATE_INTENT_KEY);
      sessionStorage.removeItem(GOOGLE_INTENT_KEY);
      return;
    }

    const key = `${ONBOARD_PREFIX}${user.uid}`;
    if (localStorage.getItem(key) === 'true' || cloudOrLocalNameAlreadyConfirmed()) {
      localStorage.setItem(key, 'true');
      sessionStorage.removeItem(CREATE_INTENT_KEY);
      sessionStorage.removeItem(GOOGLE_INTENT_KEY);
      return;
    }

    // Existing accounts should never be forced through certificate-name setup again
    // merely because they signed in on a new browser/device. The required modal is
    // reserved for the account-creation session only.
    if (!accountWasJustCreatedInThisSession(user)) {
      localStorage.setItem(key, 'true');
    }

    sessionStorage.removeItem(CREATE_INTENT_KEY);
    sessionStorage.removeItem(GOOGLE_INTENT_KEY);
  }, true);
})();
