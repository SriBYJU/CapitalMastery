(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const USER_STATE_PREFIX = 'capitalMasteryUserStateV1:';
  const ACTIVE_UID_KEY = 'capitalMasteryActiveUidV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const DEFAULT_NAME = 'Jordan Smith';

  function parse(raw) {
    try {
      const state = JSON.parse(raw || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) { return null; }
  }

  function key(uid) { return `${USER_STATE_PREFIX}${uid}`; }

  function blank(user) {
    const now = new Date().toISOString();
    const displayName = String(user?.displayName || '').replace(/\s+/g, ' ').trim();
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

  function activate(user) {
    if (!user?.uid) return;
    const previousUid = localStorage.getItem(ACTIVE_UID_KEY);
    if (previousUid && previousUid !== user.uid) snapshot(previousUid);

    if (previousUid !== user.uid) localStorage.removeItem(QA_KEY);

    let state = parse(localStorage.getItem(key(user.uid)));
    if (!state || state.profile?.accountUid !== user.uid) state = blank(user);
    state.profile ||= {};
    state.profile.accountUid = user.uid;

    localStorage.setItem(ACTIVE_UID_KEY, user.uid);
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