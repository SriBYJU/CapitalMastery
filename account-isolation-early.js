(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const USER_STATE_PREFIX = 'capitalMasteryUserStateV1:';
  const ACTIVE_UID_KEY = 'capitalMasteryActiveUidV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const ONBOARD_PREFIX = 'cmCredentialNameOnboardedV3:';
  const DEFAULT_NAME = 'Jordan Smith';

  function parse(raw) {
    try {
      const state = JSON.parse(raw || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) { return null; }
  }

  function key(uid) { return `${USER_STATE_PREFIX}${uid}`; }

  function cleanName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function blank(user) {
    const now = new Date().toISOString();
    const displayName = cleanName(user?.displayName);
    return {
      version: 1,
      profile: {
        accountUid: user?.uid || null,
        name: displayName || DEFAULT_NAME,
        ...(displayName ? { certificateName: displayName } : {})
      },
      careers: {},
      credentials: [],
      preferences: {},
      createdAt: now,
      updatedAt: now
    };
  }

  function snapshot(uid) {
    if (!uid) return;
    const current = parse(localStorage.getItem(STATE_KEY));
    if (!current) return;
    const owner = current.profile?.accountUid;
    if (owner !== uid) return;
    localStorage.setItem(key(uid), JSON.stringify(current));
  }

  function safeLegacyStateFor(user) {
    const legacy = parse(localStorage.getItem(STATE_KEY));
    if (!legacy || legacy.profile?.accountUid) return null;

    const firebaseName = cleanName(user.displayName);
    const legacyName = cleanName(legacy.profile?.certificateName || legacy.profile?.name);
    const uidWasOnboarded = localStorage.getItem(`${ONBOARD_PREFIX}${user.uid}`) === 'true';

    // Preserve old unsynced state only when there is strong evidence that it
    // belongs to this exact Firebase account. Otherwise discard it rather than
    // risk moving another user's name/progress into this account.
    if (!uidWasOnboarded && (!firebaseName || !legacyName || firebaseName !== legacyName)) return null;

    legacy.profile ||= {};
    legacy.profile.accountUid = user.uid;
    if (firebaseName && legacyName !== firebaseName) {
      legacy.profile.name = firebaseName;
      legacy.profile.certificateName = firebaseName;
    }
    return legacy;
  }

  function activate(user) {
    if (!user?.uid) return;
    const previousUid = localStorage.getItem(ACTIVE_UID_KEY);
    if (previousUid && previousUid !== user.uid) snapshot(previousUid);

    if (previousUid !== user.uid) localStorage.removeItem(QA_KEY);

    // A repeated auth-ready/backend-verification event for the SAME Firebase user
    // must never roll current course progress back to an older per-user snapshot.
    // Prefer the active shared state when it is already owned by this UID; use the
    // stored per-user snapshot only when activating/switching into the account.
    const activeShared = parse(localStorage.getItem(STATE_KEY));
    let state = activeShared?.profile?.accountUid === user.uid
      ? activeShared
      : parse(localStorage.getItem(key(user.uid)));
    if (!state || state.profile?.accountUid !== user.uid) {
      state = !previousUid ? safeLegacyStateFor(user) : null;
    }
    if (!state) state = blank(user);

    state.profile ||= {};
    state.profile.accountUid = user.uid;

    localStorage.setItem(ACTIVE_UID_KEY, user.uid);
    localStorage.setItem(key(user.uid), JSON.stringify(state));
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function deactivate() {
    const previousUid = localStorage.getItem(ACTIVE_UID_KEY);
    if (previousUid) snapshot(previousUid);
    localStorage.removeItem(ACTIVE_UID_KEY);
    localStorage.removeItem(QA_KEY);
    localStorage.setItem(STATE_KEY, JSON.stringify(blank(null)));
  }

  // This listener is deliberately loaded before onboarding/name logic. Even if
  // Firestore is still initializing, the shared app.js state is swapped to the
  // correct Firebase user before any credential-name checks run.
  document.addEventListener('cm-auth-changed', event => {
    const user = event.detail?.user || null;
    if (user) activate(user);
    else deactivate();
  });

  // Handle the rare case where auth finished before this file loaded.
  if (window.CM_AUTH?.ready) {
    if (window.CM_AUTH.user) activate(window.CM_AUTH.user);
    else deactivate();
  }
})();