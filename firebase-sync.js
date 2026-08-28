(() => {
  'use strict';

  const SDK = '12.18.0';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const DEFAULT_NAME = 'Jordan Smith';

  let db = null;
  let fs = null;
  let user = null;
  let debounceTimer = null;
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
      return syncLocalToCloud(readLocalState());
    }
  };

  function setStatus(status, error = null) {
    CM_SYNC.status = status;
    CM_SYNC.error = error ? String(error.message || error) : null;
    document.dispatchEvent(new CustomEvent('cm-sync-changed', {
      detail: { status: CM_SYNC.status, lastSyncedAt: CM_SYNC.lastSyncedAt, error: CM_SYNC.error }
    }));
  }

  function readLocalState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return parsed && parsed.version === 1 ? parsed : null;
    } catch (_) {
      return null;
    }
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

  function mergeStates(remote, local, firebaseUser) {
    if (!remote && !local) return null;
    if (!remote) return normalizeState(local, firebaseUser);
    if (!local) return normalizeState(remote, firebaseUser);

    const remoteUpdated = stateUpdatedAt(remote);
    const localUpdated = stateUpdatedAt(local);
    const preferLocal = localUpdated >= remoteUpdated;
    const careerIds = new Set([
      ...Object.keys(remote.careers || {}),
      ...Object.keys(local.careers || {})
    ]);
    const careers = {};
    for (const id of careerIds) careers[id] = mergeCareer(remote.careers?.[id], local.careers?.[id], preferLocal);

    const firebaseName = firebaseUser?.displayName?.trim();
    const localName = local.profile?.name?.trim();
    const remoteName = remote.profile?.name?.trim();
    let name = preferLocal ? (localName || remoteName) : (remoteName || localName);
    if (!name || name === DEFAULT_NAME) name = firebaseName || name || DEFAULT_NAME;

    return {
      version: 1,
      profile: preferLocal
        ? { ...(remote.profile || {}), ...(local.profile || {}), name }
        : { ...(local.profile || {}), ...(remote.profile || {}), name },
      careers,
      credentials: [],
      preferences: preferLocal ? { ...(remote.preferences || {}), ...(local.preferences || {}) } : { ...(local.preferences || {}), ...(remote.preferences || {}) },
      createdAt: remote.createdAt || local.createdAt || new Date().toISOString(),
      updatedAt: isoFromMillis(Math.max(remoteUpdated, localUpdated))
    };
  }

  function normalizeState(state, firebaseUser) {
    const copy = JSON.parse(JSON.stringify(state || {}));
    copy.version = 1;
    copy.profile = copy.profile || {};
    if (!copy.profile.name || copy.profile.name === DEFAULT_NAME) {
      copy.profile.name = firebaseUser?.displayName?.trim() || copy.profile.name || DEFAULT_NAME;
    }
    copy.careers = copy.careers || {};
    copy.preferences = copy.preferences || {};
    copy.credentials = [];
    copy.createdAt = copy.createdAt || new Date().toISOString();
    copy.updatedAt = copy.updatedAt || copy.createdAt || new Date().toISOString();
    return copy;
  }

  function cloudPayload(state) {
    const clean = normalizeState(state, user);
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
      displayName: user.displayName || state.profile?.name || null,
      email: user.email || null,
      lastSeenAt: fs.serverTimestamp()
    };

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

    try {
      setStatus('syncing');
      const uid = user.uid;
      await writeRootProfile(state);
      await fs.setDoc(fs.doc(db, 'users', uid, 'progress', 'state'), cloudPayload(state), { merge: false });
      CM_SYNC.lastSyncedAt = new Date().toISOString();
      setStatus('synced');
      return true;
    } catch (error) {
      console.error('Capital Mastery Firestore sync failed:', error);
      setStatus('error', error);
      return false;
    }
  }

  async function hydrateFromCloud(firebaseUser) {
    if (!db || !fs || !firebaseUser || qaMode()) return;
    try {
      setStatus('loading');
      const ref = fs.doc(db, 'users', firebaseUser.uid, 'progress', 'state');
      const snap = await fs.getDoc(ref);
      const local = readLocalState();
      const remote = snap.exists() ? snap.data() : null;
      const merged = mergeStates(remote, local, firebaseUser);
      if (!merged) return;

      const currentComparable = local ? JSON.stringify({ ...local, credentials: [] }) : '';
      const mergedComparable = JSON.stringify(merged);
      const changed = currentComparable !== mergedComparable;

      if (changed) {
        suppressLocalHook = true;
        const currentCredentials = Array.isArray(local?.credentials) ? local.credentials : [];
        localStorage.setItem(STATE_KEY, JSON.stringify({ ...merged, credentials: currentCredentials }));
        suppressLocalHook = false;
      }

      await syncLocalToCloud({ ...merged, credentials: [] });

      // app.js keeps state inside its closure. Reload only when cloud hydration
      // actually changed learner-visible state, avoiding unnecessary reloads.
      const hydrationKey = `cmCloudHydrated:${firebaseUser.uid}`;
      if (changed && sessionStorage.getItem(hydrationKey) !== '1') {
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
    debounceTimer = setTimeout(() => syncLocalToCloud(state || readLocalState()), 700);
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
            parsed.updatedAt = new Date().toISOString();
            value = JSON.stringify(parsed);
            const result = original.call(this, key, value);
            queueSync(parsed);
            return result;
          }
        } catch (_) {}
      }

      const result = original.call(this, key, value);
      return result;
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
        await hydrateFromCloud(user);
      }
    } catch (error) {
      console.error('Capital Mastery Firestore failed to initialize:', error);
      setStatus('error', error);
    }
  }

  document.addEventListener('cm-auth-changed', async event => {
    user = event.detail?.user || null;
    rootProfileInitializedForUid = null;
    if (!CM_SYNC.ready) return;
    if (!user) {
      setStatus('signed-out');
      return;
    }
    await hydrateFromCloud(user);
  });

  initFirestore();
})();
