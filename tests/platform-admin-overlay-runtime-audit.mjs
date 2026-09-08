import assert from 'node:assert/strict';
import worker from '../v2/platform-admin-overlay.js';

const env = {
  ALLOWED_ORIGIN: 'https://sribyju.github.io',
  ADMIN_UID: 'uid_legacy_should_not_matter'
};

const unauthenticated = await worker.fetch(new Request(
  'https://capital-mastery-api.example.test/enterprise/admin/organizations',
  { headers: { Origin: 'https://sribyju.github.io' } }
), env);
assert.equal(unauthenticated.status, 401, 'unauthenticated platform-admin route must resolve to HTTP 401, not reject');
assert.equal(unauthenticated.headers.get('access-control-allow-origin'), 'https://sribyju.github.io');
const unauthBody = await unauthenticated.json();
assert.equal(unauthBody.ok, false);
assert.match(String(unauthBody.error || ''), /Authentication required/i);

const badOrigin = await worker.fetch(new Request(
  'https://capital-mastery-api.example.test/enterprise/admin/organizations',
  { headers: { Origin: 'https://not-approved.example.invalid' } }
), env);
assert.equal(badOrigin.status, 403, 'bad-origin platform-admin request must resolve to HTTP 403, not reject');

console.log('PLATFORM_ADMIN_OVERLAY_RUNTIME_AUDIT=PASS');
