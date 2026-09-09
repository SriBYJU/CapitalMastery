import { readFile } from 'node:fs/promises';

const [indexHtml, resilience, enterprise, auth] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../safari-loading-resilience.js', import.meta.url), 'utf8'),
  readFile(new URL('../enterprise-v2.js', import.meta.url), 'utf8'),
  readFile(new URL('../firebase-auth.js', import.meta.url), 'utf8')
]);

function expect(condition, message) {
  if (!condition) throw new Error(`SAFARI LOADING RESILIENCE AUDIT FAIL: ${message}`);
}

expect(indexHtml.includes('safari-loading-resilience.js?v=20260909-safari1'), 'Safari resilience script is not loaded by index.html.');
expect(indexHtml.indexOf('firebase-auth.js') < indexHtml.indexOf('safari-loading-resilience.js'), 'Safari resilience must load after the primary Firebase auth implementation.');
expect(indexHtml.indexOf('safari-loading-resilience.js') < indexHtml.indexOf('firebase-sync.js'), 'Safari resilience must load before Firebase sync can depend on auth readiness.');
expect(/AUTH_TIMEOUT_MS\s*=\s*15000/.test(resilience), 'Auth-startup watchdog must remain bounded.');
expect(resilience.includes("auth.ready = true"), 'Timed-out auth startup must release routes from infinite loading.');
expect(resilience.includes("initializationTimedOut"), 'Timed-out auth startup must be explicitly marked as degraded, not treated as a successful sign-in.');
expect(resilience.includes("window.addEventListener('pageshow'"), 'Safari BFCache recovery must listen for pageshow.');
expect(resilience.includes('event.persisted !== true'), 'BFCache recovery must only reroute persisted restores.');
expect(resilience.includes('CM_ENTERPRISE_V2.route'), 'BFCache recovery must rerun the employer router.');
expect(resilience.includes("document.dispatchEvent(new CustomEvent('cm-auth-changed'"), 'Auth watchdog must notify existing route listeners.');
expect(enterprise.includes("document.addEventListener('cm-auth-changed'"), 'Employer router must continue listening for auth readiness changes.');
expect(auth.includes('onAuthStateChanged'), 'Primary Firebase auth state resolution must remain intact.');
expect(!resilience.includes('localStorage.clear('), 'Safari recovery must never clear browser state.');
expect(!resilience.includes('sessionStorage.clear('), 'Safari recovery must never clear session state.');
expect(!resilience.includes('indexedDB.deleteDatabase'), 'Safari recovery must never delete browser databases.');

console.log('SAFARI LOADING RESILIENCE AUDIT PASS: no permanent auth spinner; BFCache restores reroute safely; no workspace or browser-state deletion');
