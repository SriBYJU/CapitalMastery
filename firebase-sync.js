(() => {
  'use strict';

  const SDK = '12.18.0';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const USER_STATE_PREFIX = 'capitalMasteryUserStateV1:';
  const ACTIVE_UID_KEY = 'capitalMasteryActiveUidV1';
  const IDENTITY_GUARD_PREFIX = 'cmCredentialIdentityGuardV1:';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const QA_STATE_KEY = 'capitalMasteryQaStateV2';
  const DEFAULT_NAME = 'Jordan Smith';

  let db = null;
  let fs = null;
  let user = null;
  let debounceTimer = null;
  let syncTail = Promise.resolve(true);
  let suppressLocalHook = false;
  let initialized = false;
  let rootProfileInitializedForUid = null;

  const CM_SYNC = window.CM_SYNC = {
    ready: false,
    status: 'starting',
    lastSyncedAt: null,
    error: null,
    async flush() {
      if (!user) return false;
      return scheduleCloudSync(readLocalState());
    }
  };

  function setStatus(status, error = null) {
    CM_SYNC.status = status;
    CM_SYNC.error = error ? String(error.message || error) : null;
    document.dispatchEvent(new CustomEvent('cm-sync-changed', {
      detail: { status: CM_SYNC.status, lastSyncedAt: CM_SYNC.lastSyncedAt, error: CM_SYNC.error }
    }));
  }

  function parseState(raw) {
    try {
      const parsed = JSON.parse(raw || 'null');
      return parsed && parsed.version === 1 ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function readLocalState() {
    return parseState(localStorage.getItem(STATE_KEY));
  }

  function userStateKey(uid) {
    return `${USER_STATE_PREFIX}${uid}`;
  }

  function readCachedUserState(uid) {
    return uid ? parseState(localStorage.getItem(userStateKey(uid))) : null;
  }

  function qaMode() {
    return localStorage.getItem(QA_KEY) === 'true';
  }

  function stateUpdatedAt(state) {
    const value = Date.parse(state?.updatedAt || state?.createdAt || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function isoFromMillis(value) {
    const ms = Number(value || 0);
    return new Date(ms > 0 ? ms : Date.now()).toISOString();
  }

  function maxScore(a, b) {
    const av = Number(a || 0);
    const bv = Number(b || 0);
    return Math.max(av, bv) || null;
  }

  function unionNumbers(a, b) {
    return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]
      .map(Number)
      .filter(Number.isFinite))].sort((x, y) => x - y);
  }

  function looksLikeFullName(value) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    return cleaned.split(' ').filter(Boolean).length >= 2;
  }

  function blankState(firebaseUser = null) {
    const now = new Date().toISOString();
    const displayName = String(firebaseUser?.displayName || '').replace(/\s+/g, ' ').trim();
    return {
      version: 1,
      profile: {
        accountUid: firebaseUser?.uid || null,
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

  function directWriteState(state) {
    suppressLocalHook = true;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      const uid = state?.profile?.accountUid;
      if (uid) localStorage.setItem(userStateKey(uid), JSON.stringify(state));
    } finally {
      suppressLocalHook = false;
    }
  }

  function snapshotUserState(uid) {
    if (!uid) return;
    const current = readLocalState();
    if (!current) return;
    const owner = current.profile?.accountUid;
    const activeUid = localStorage.getItem(ACTIVE_UID_KEY);
    if (owner === uid || (!owner && activeUid === uid)) {
      current.profile ||= {};
      current.profile.accountUid = uid;
      localStorage.setItem(userStateKey(uid), JSON.stringify(current));
    }
  }

  function activateUserState(firebaseUser) {
    const uid = firebaseUser.uid;
    const previousUid = localStorage.getItem(ACTIVE_UID_KEY);
    const switched = !!previousUid && previousUid !== uid;

    if (previousUid && previousUid !== uid) snapshotUserState(previousUid);

    // QA Preview Mode is intentionally session/account-specific. Never allow an
    // admin's local QA bypass to follow them into another learner account.
    if (previousUid !== uid) {
      localStorage.removeItem(QA_KEY);
      localStorage.removeItem(QA_STATE_KEY);
    }

    let next = readCachedUserState(uid);
    if (!next || next.profile?.accountUid !== uid) next = blankState(firebaseUser);
    next.profile ||= {};
    next.profile.accountUid = uid;

    directWriteState(next);
    localStorage.setItem(ACTIVE_UID_KEY, uid);
    return switched || previousUid !== uid;
  }

  function deactivateUserState(previousUid) {
    if (previousUid) snapshotUserState(previousUid);
    localStorage.removeItem(ACTIVE_UID_KEY);
    localStorage.removeItem(QA_KEY);
    localStorage.removeItem(QA_STATE_KEY);
    directWriteState(blankState(null));
  }

  function normalizeState(state, firebaseUser, source = 'local') {
    const copy = JSON.parse(JSON.stringify(state || blankState(firebaseUser)));
    copy.version = 1;
    copy.profile = copy.profile || {};

    const uid = firebaseUser?.uid || null;
    const firebaseName = String(firebaseUser?.displayName || '').replace(/\s+/g, ' ').trim();
    const owner = copy.profile.accountUid || null;

    // A state explicitly owned by a different Firebase account is never merged.
    if (uid && owner && owner !== uid) return blankState(firebaseUser);

    copy.profile.accountUid = uid;

    const profileName = String(copy.profile.certificateName || copy.profile.name || '').replace(/\s+/g, ' ').trim();

    // Legacy records did not have accountUid. Firebase displayName is safe as the
    // repair source because saving a credential name also updates that account's
    // Firebase displayName. This prevents a name copied from another browser user
    // from becoming canonical for the current account.
    if (uid && !owner && firebaseName && profileName && profileName !== firebaseName) {
      copy.profile.name = firebaseName;
      copy.profile.certificateName = firebaseName;
      copy.profile.certificateNameConfirmed = looksLikeFullName(firebaseName) && copy.profile.certificateNameConfirmed === true;
    } else if (!copy.profile.name || copy.profile.name === DEFAULT_NAME) {
      copy.profile.name = firebaseName || copy.profile.name || DEFAULT_NAME;
    }

    if (source === 'local' && uid && copy.profile.accountUid !== uid) return blankState(firebaseUser);

    copy.careers = copy.careers || {};
    copy.preferences = copy.preferences || {};
    copy.credentials = Array.isArray(copy.credentials) ? copy.credentials : [];
    copy.createdAt = copy.createdAt || new Date().toISOString();
    copy.updatedAt = copy.updatedAt || copy.createdAt || new Date().toISOString();

    // A short-lived local identity guard protects first-time credential setup
    // from any older hydration already in flight. It expires quickly so a later
    // cross-device credential-name edit can still become authoritative.
    if (uid) {
      try {
        const guard = JSON.parse(localStorage.getItem(`${IDENTITY_GUARD_PREFIX}${uid}`) || 'null');
        const guardedName = String(guard?.name || '').replace(/\s+/g,' ').trim();
        if (Number(guard?.expiresAt || 0) > Date.now() && looksLikeFullName(guardedName)) {
          copy.profile.name = guardedName;
          copy.profile.certificateName = guardedName;
          copy.profile.certificateNameConfirmed = true;
        }
      } catch (_) {}
    }
    return copy;
  }

  function mergeCareer(remote = {}, local = {}, preferLocal = true) {
    const quizScores = {};
    const keys = new Set([
      ...Object.keys(remote.quizScores || {}),
      ...Object.keys(local.quizScores || {})
    ]);
    for (const key of keys) quizScores[key] = Math.max(Number(remote.quizScores?.[key] || 0), Number(local.quizScores?.[key] || 0));

    return {
      learningComplete: unionNumbers(remote.learningComplete, local.learningComplete),
      completedParts: unionNumbers(remote.completedParts, local.completedParts),
      quizScores,
      simulationKnowledge: maxScore(remote.simulationKnowledge, local.simulationKnowledge),
      simulationScore: maxScore(remote.simulationScore, local.simulationScore),
      finalScore: maxScore(remote.finalScore, local.finalScore),
      applied: preferLocal ? { ...(remote.applied || {}), ...(local.applied || {}) } : { ...(local.applied || {}), ...(remote.applied || {}) },
      simResponses: preferLocal ? { ...(remote.simResponses || {}), ...(local.simResponses || {}) } : { ...(local.simResponses || {}), ...(remote.simResponses || {}) },
      readiness: maxScore(remote.readiness, local.readiness)
    };
  }

  function mergeStates(remoteRaw, localRaw, firebaseUser) {
    const remote = remoteRaw ? normalizeState(remoteRaw, firebaseUser, 'remote') : null;
    const local = localRaw ? normalizeState(localRaw, firebaseUser, 'local') : null;
    if (!remote && !local) return blankState(firebaseUser);
    if (!remote) return local;
    if (!local) return remote;

    const remoteUpdated = stateUpdatedAt(remote);
    const localUpdated = stateUpdatedAt(local);
    const preferLocal = localUpdated >= remoteUpdated;
    const careerIds = new Set([
      ...Object.keys(remote.careers || {}),
      ...Object.keys(local.careers || {})
    ]);
    const careers = {};
    for (const id of careerIds) careers[id] = mergeCareer(remote.careers?.[id], local.careers?.[id], preferLocal);

    const firebaseName = String(firebaseUser?.displayName || '').replace(/\s+/g, ' ').trim();
    const localName = String(local.profile?.certificateName || local.profile?.name || '').trim();
    const remoteName = String(remote.profile?.certificateName || remote.profile?.name || '').trim();
    let name = preferLocal ? (localName || remoteName) : (remoteName || localName);
    if (!name || name === DEFAULT_NAME) name = firebaseName || name || DEFAULT_NAME;

    const profile = preferLocal
      ? { ...(remote.profile || {}), ...(local.profile || {}) }
      : { ...(local.profile || {}), ...(remote.profile || {}) };
    profile.accountUid = firebaseUser.uid;
    profile.name = name;
    if (profile.certificateNameConfirmed === true) profile.certificateName = name;

    return {
      version: 1,
      profile,
      careers,
      credentials: [],
      preferences: preferLocal ? { ...(remote.preferences || {}), ...(local.preferences || {}) } : { ...(local.preferences || {}), ...(remote.preferences || {}) },
      createdAt: remote.createdAt || local.createdAt || new Date().toISOString(),
      updatedAt: isoFromMillis(Math.max(remoteUpdated, localUpdated))
    };
  }

  function cloudPayload(state) {
    const clean = normalizeState(state, user, 'local');
    delete clean.credentials;
    return {
      version: 1,
      profile: clean.profile,
      careers: clean.careers,
      preferences: clean.preferences,
      createdAt: clean.createdAt,
      updatedAt: clean.updatedAt,
      syncVersion: 1,
      serverUpdatedAt: fs.serverTimestamp()
    };
  }

  async function writeRootProfile(state) {
    const uid = user.uid;
    const ref = fs.doc(db, 'users', uid);
    const base = {
      displayName: state.profile?.certificateName || user.displayName || state.profile?.name || null,
      email: user.email || null,
      lastSeenAt: fs.serverTimestamp()
    };
    const credentialName = String(state.profile?.certificateName || '').replace(/\s+/g, ' ').trim();
    if (state.profile?.certificateNameConfirmed === true && looksLikeFullName(credentialName)) {
      base.credentialName = credentialName;
      base.credentialNameConfirmed = true;
      base.credentialNameUpdatedAt = fs.serverTimestamp();
    }

    if (rootProfileInitializedForUid !== uid) {
      const snap = await fs.getDoc(ref);
      if (!snap.exists()) base.createdAt = fs.serverTimestamp();
      rootProfileInitializedForUid = uid;
    }

    await fs.setDoc(ref, base, { merge: true });
  }

  async function syncLocalToCloud(state) {
    if (!db || !fs || !user || !state) return false;
    if (qaMode()) {
      setStatus('qa-local-only');
      return false;
    }

    const clean = normalizeState(state, user, 'local');
    if (clean.profile?.accountUid !== user.uid) {
      console.warn('Blocked cross-account Capital Mastery state sync.');
      return false;
    }

    try {
      setStatus('syncing');
      await fs.setDoc(fs.doc(db, 'users', user.uid, 'progress', 'state'), cloudPayload(clean), { merge: false });
      // Progress is an owner-only UX mirror and must remain available during a
      // rolling Firestore-rules deployment. The protected root identity is
      // attempted independently so a stale root rule cannot stop course sync.
      try {
        await writeRootProfile(clean);
      } catch (rootError) {
        console.warn('Protected account-profile mirror will retry after rules convergence:', rootError);
      }
      localStorage.setItem(userStateKey(user.uid), JSON.stringify(clean));
      CM_SYNC.lastSyncedAt = new Date().toISOString();
      setStatus('synced');
      return true;
    } catch (error) {
      console.error('Capital Mastery Firestore sync failed:', error);
      setStatus('error', error);
      return false;
    }
  }

  function scheduleCloudSync(state) {
    // Serialize cloud writes so an older first-login hydration can never finish
    // after a newer credential/profile write and silently roll it back.
    const snapshot = state ? JSON.parse(JSON.stringify(state)) : state;
    const run = () => syncLocalToCloud(snapshot);
    const task = syncTail.then(run, run);
    syncTail = task.catch(() => false);
    return task;
  }

  async function hydrateFromCloud(firebaseUser, { forceReload = false } = {}) {
    if (!db || !fs || !firebaseUser || qaMode()) return;
    // Preserve the identity state observed when hydration began. A newly-created
    // Firebase user has no full display name yet; its one-time credential setup
    // must finish before any account-switch hydration is allowed to reload.
    const identityIncompleteAtStart = !looksLikeFullName(firebaseUser.displayName);
    try {
      setStatus('loading');
      const ref = fs.doc(db, 'users', firebaseUser.uid, 'progress', 'state');
      const snap = await fs.getDoc(ref);
      const localRaw = readLocalState();
      const local = localRaw?.profile?.accountUid === firebaseUser.uid ? localRaw : blankState(firebaseUser);
      const remote = snap.exists() ? snap.data() : null;
      const merged = mergeStates(remote, local, firebaseUser);

      const currentComparable = JSON.stringify({ ...(local || {}), credentials: [] });
      const mergedComparable = JSON.stringify({ ...merged, credentials: [] });
      const changed = currentComparable !== mergedComparable;

      const currentCredentials = Array.isArray(local?.credentials) ? local.credentials : [];
      directWriteState({ ...merged, credentials: currentCredentials });
      localStorage.setItem(userStateKey(firebaseUser.uid), JSON.stringify({ ...merged, credentials: currentCredentials }));

      await scheduleCloudSync({ ...merged, credentials: [] });

      // app.js keeps state inside its closure. Reload whenever the active account
      // changes or cloud hydration materially changes state, so another account's
      // in-memory profile/progress cannot remain on screen.
      const hydrationKey = `cmCloudHydrated:${firebaseUser.uid}`;
      let identitySetupBusy = identityIncompleteAtStart || !!document.getElementById('cm-full-name-onboarding');
      try {
        const guard = JSON.parse(localStorage.getItem(`${IDENTITY_GUARD_PREFIX}${firebaseUser.uid}`) || 'null');
        identitySetupBusy ||= Number(guard?.expiresAt || 0) > Date.now();
      } catch (_) {}
      if ((forceReload || changed) && !identitySetupBusy && sessionStorage.getItem(hydrationKey) !== '1') {
        sessionStorage.setItem(hydrationKey, '1');
        location.reload();
      }
    } catch (error) {
      console.error('Capital Mastery cloud hydration failed:', error);
      setStatus('error', error);
    }
  }

  function queueSync(state) {
    if (!user || qaMode() || suppressLocalHook) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => scheduleCloudSync(state || readLocalState()), 700);
  }

  function installLocalStorageHook() {
    if (Storage.prototype.__cmSyncPatched) return;
    const original = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, '__cmSyncPatched', { value: true, configurable: false });

    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && key === STATE_KEY && !suppressLocalHook) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.version === 1) {
            parsed.profile ||= {};
            if (user?.uid) parsed.profile.accountUid = user.uid;
            parsed.updatedAt = new Date().toISOString();
            value = JSON.stringify(parsed);
            const result = original.call(this, key, value);
            if (user?.uid) original.call(this, userStateKey(user.uid), value);
            queueSync(parsed);
            return result;
          }
        } catch (_) {}
      }

      return original.call(this, key, value);
    };
  }

  async function initFirestore() {
    if (initialized) return;
    initialized = true;
    installLocalStorageHook();
    try {
      const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
      fs = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`);
      const firebaseApp = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
      db = fs.getFirestore(firebaseApp);
      CM_SYNC.ready = true;
      setStatus('ready');

      if (window.CM_AUTH?.ready && window.CM_AUTH.user) {
        user = window.CM_AUTH.user;
        rootProfileInitializedForUid = null;
        const switched = activateUserState(user);
        await hydrateFromCloud(user, { forceReload: switched });
      }
    } catch (error) {
      console.error('Capital Mastery Firestore failed to initialize:', error);
      setStatus('error', error);
    }
  }

  document.addEventListener('cm-auth-changed', async event => {
    const previousUid = user?.uid || localStorage.getItem(ACTIVE_UID_KEY) || null;
    const nextUser = event.detail?.user || null;
    const sameActiveUser = !!nextUser && user?.uid === nextUser.uid && localStorage.getItem(ACTIVE_UID_KEY) === nextUser.uid;

    if (previousUid && (!nextUser || previousUid !== nextUser.uid)) snapshotUserState(previousUid);
    user = nextUser;
    rootProfileInitializedForUid = null;

    if (!CM_SYNC.ready) return;

    if (!user) {
      deactivateUserState(previousUid);
      setStatus('signed-out');
      return;
    }

    // Worker role verification emits a second auth event for the same Firebase
    // user. Do not start a duplicate hydration that can race first-time setup.
    if (sameActiveUser) return;

    const switched = activateUserState(user);
    await hydrateFromCloud(user, { forceReload: switched });
  });

  initFirestore();
})();
