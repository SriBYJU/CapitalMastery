(() => {
  'use strict';

  const ADMIN_PREFIX = '#/admin-preview';
  const LOGIN_GATE = '#/login?admin=gate';
  const PENDING_KEY = 'capitalMasteryPendingAdminRouteV1';

  function isAdminRoute(hash = location.hash) {
    return String(hash || '').startsWith(ADMIN_PREFIX);
  }

  function verifiedAdmin() {
    const auth = window.CM_AUTH;
    return auth?.ready === true && auth?.backendVerified === true && auth?.isAdmin === true;
  }

  function rememberPending(hash) {
    try { sessionStorage.setItem(PENDING_KEY, hash || ADMIN_PREFIX); } catch (_) {}
  }

  function pendingRoute() {
    try { return sessionStorage.getItem(PENDING_KEY) || ''; } catch (_) { return ''; }
  }

  function clearPending() {
    try { sessionStorage.removeItem(PENDING_KEY); } catch (_) {}
  }

  function blockUnverifiedAdminRoute() {
    if (!isAdminRoute() || verifiedAdmin()) return false;
    rememberPending(location.hash || ADMIN_PREFIX);
    if (location.hash !== LOGIN_GATE) location.replace(LOGIN_GATE);
    return true;
  }

  // This script is intentionally loaded before app.js. Its hashchange listener is
  // therefore registered before the SPA router and can replace an unauthorized
  // admin hash before the router has any opportunity to render privileged QA DOM.
  blockUnverifiedAdminRoute();
  window.addEventListener('hashchange', blockUnverifiedAdminRoute, true);

  document.addEventListener('cm-auth-changed', () => {
    const auth = window.CM_AUTH;
    const pending = pendingRoute();
    if (!pending) return;

    if (auth?.ready === true && auth?.backendVerified === true && auth?.isAdmin === true) {
      clearPending();
      if (String(location.hash || '').startsWith('#/login')) location.replace(pending);
      return;
    }

    // A completed backend verification that is explicitly non-admin closes the
    // pending request. Signed-out or still-verifying states keep it so a genuine
    // administrator can sign in and be returned to the requested admin route.
    if (auth?.ready === true && auth?.backendVerified === true && auth?.isAdmin !== true) {
      clearPending();
    }
  });

  window.CM_ADMIN_ROUTE_GUARD = Object.freeze({
    isAdminRoute,
    verifiedAdmin,
    blockUnverifiedAdminRoute
  });
})();
