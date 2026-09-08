import fs from 'node:fs';
import assert from 'node:assert/strict';

const certificateName = fs.readFileSync(new URL('../certificate-name.js', import.meta.url), 'utf8');
const adminGuard = fs.readFileSync(new URL('../admin-route-guard.js', import.meta.url), 'utf8');

const gatedMatch = certificateName.match(/const GATED_ROOTS = new Set\(\[([\s\S]*?)\]\);/);
assert.ok(gatedMatch, 'Expected learner GATED_ROOTS in certificate-name.js');
assert.doesNotMatch(gatedMatch[1], /['"]admin-preview['"]/, 'Admin routes must not be part of learner credential-name gating');

const maybeStart = certificateName.indexOf('async function maybePromptForName(user)');
const maybeEnd = certificateName.indexOf('\n  async function enforceCurrentRoute()', maybeStart);
assert.ok(maybeStart >= 0 && maybeEnd > maybeStart, 'Expected maybePromptForName function');
const maybePrompt = certificateName.slice(maybeStart, maybeEnd);
assert.match(maybePrompt, /routeRoot\(\) === ['"]admin-preview['"]/);
assert.match(maybePrompt, /closeNameModal\(false\); return;/);

const enforceStart = certificateName.indexOf('async function enforceCurrentRoute()');
const enforceEnd = certificateName.indexOf('\n  function injectStyles()', enforceStart);
assert.ok(enforceStart >= 0 && enforceEnd > enforceStart, 'Expected enforceCurrentRoute function');
const enforce = certificateName.slice(enforceStart, enforceEnd);
assert.match(enforce, /routeRoot\(hash\) === ['"]admin-preview['"]/);
assert.ok(
  enforce.indexOf("routeRoot(hash) === 'admin-preview'") < enforce.indexOf('isGatedHash(hash)'),
  'Admin exclusion must run before learner route gating'
);

assert.match(adminGuard, /const ADMIN_PREFIX\s*=\s*['"]#\/admin-preview['"]/);
assert.match(adminGuard, /auth\?\.ready === true/);
assert.match(adminGuard, /auth\?\.backendVerified === true/);
assert.match(adminGuard, /auth\?\.isAdmin === true/);

console.log('ADMIN_CREDENTIAL_ONBOARDING_BOUNDARY_AUDIT=PASS');
