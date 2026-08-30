import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const guard = fs.readFileSync('admin-route-guard.js', 'utf8');
const auth = fs.readFileSync('firebase-auth.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const guardIndex = index.indexOf('admin-route-guard.js');
const appIndex = index.indexOf('app.js');
const authIndex = index.indexOf('firebase-auth.js');

assert(guardIndex >= 0, 'index.html does not load admin-route-guard.js');
assert(authIndex >= 0 && authIndex < guardIndex, 'Admin route guard must load after Firebase auth initializes CM_AUTH');
assert(appIndex >= 0 && guardIndex < appIndex, 'Admin route guard must load before app.js SPA router');

assert(/backendVerified\s*===\s*true/.test(guard), 'Admin route gate does not require secure backend verification');
assert(/isAdmin\s*===\s*true/.test(guard), 'Admin route gate does not require explicit admin role');
assert(/ready\s*===\s*true/.test(guard), 'Admin route gate does not require resolved auth state');
assert(/window\.addEventListener\(['"]hashchange['"],\s*blockUnverifiedAdminRoute/.test(guard), 'Admin route gate does not intercept later forged hash navigation');
assert(/blockUnverifiedAdminRoute\(\);[\s\S]*window\.addEventListener/.test(guard), 'Admin route gate does not protect the initial direct deep link before routing');
assert(/sessionStorage/.test(guard), 'Pending admin destination is not session-scoped');
assert(/clearPending\(\)[\s\S]*backendVerified/.test(guard) || /backendVerified[\s\S]*clearPending\(\)/.test(guard), 'Verified non-admin flow does not clear pending privileged destination');
assert(/cm-auth-changed/.test(guard), 'Admin route gate does not react to secure auth-role resolution');
assert(/backendVerified:\s*false/.test(auth), 'Firebase auth does not default backendVerified to false');
assert(/CM_AUTH\.isAdmin\s*=\s*identity\?\.isAdmin\s*===\s*true/.test(auth), 'Firebase auth admin flag is not assigned from Worker-verified identity');

console.log('ADMIN ROUTE BOUNDARY AUDIT PASS: admin preview is pre-router gated by resolved, backend-verified admin identity with session-safe pending-route handling');
