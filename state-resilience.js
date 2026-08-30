(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const USER_STATE_PREFIX = 'capitalMasteryUserStateV1:';

  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

  function normalizeCareer(value) {
    const career = isObject(value) ? value : {};
    if (!Array.isArray(career.learningComplete)) career.learningComplete = [];
    if (!Array.isArray(career.completedParts)) career.completedParts = [];
    if (!isObject(career.quizScores)) career.quizScores = {};
    if (!isObject(career.applied)) career.applied = {};
    if (!isObject(career.simResponses)) career.simResponses = {};
    if (!isObject(career.conceptPractice)) career.conceptPractice = {};
    return career;
  }

  function normalizeState(value) {
    // Unknown schema versions are intentionally left alone so a future migration
    // can own them. This guard only repairs malformed objects that already claim
    // to be the current v1 schema.
    if (!isObject(value) || value.version !== 1) return null;

    const state = value;
    if (!isObject(state.profile)) state.profile = {};
    if (!isObject(state.careers)) state.careers = {};
    if (!Array.isArray(state.credentials)) state.credentials = [];
    if (!isObject(state.preferences)) state.preferences = {};

    for (const [careerId, career] of Object.entries(state.careers)) {
      state.careers[careerId] = normalizeCareer(career);
    }

    if (!state.createdAt || Number.isNaN(Date.parse(state.createdAt))) {
      state.createdAt = new Date().toISOString();
    }
    if (state.updatedAt && Number.isNaN(Date.parse(state.updatedAt))) delete state.updatedAt;
    return state;
  }

  function repairKey(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (_) { return false; } // app.js already falls back safely for invalid JSON.

    const normalized = normalizeState(parsed);
    if (!normalized) return false;
    const next = JSON.stringify(normalized);
    if (next === raw) return false;
    try {
      localStorage.setItem(key, next);
      return true;
    } catch (_) {
      // Storage can be unavailable/quota-limited. Never make startup depend on
      // a successful repair write; app.js still has its in-memory fallback.
      return false;
    }
  }

  try {
    repairKey(STATE_KEY);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(USER_STATE_PREFIX)) repairKey(key);
    }
  } catch (_) {
    // Access to localStorage itself can be restricted. Startup must continue.
  }

  window.CM_STATE_RESILIENCE = { normalizeState };
})();
