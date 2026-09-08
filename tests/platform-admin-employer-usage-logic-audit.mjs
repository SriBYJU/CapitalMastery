import assert from 'node:assert/strict';
import {
  PLATFORM_ADMIN_EMAIL,
  DISABLED_ADMIN_UID,
  coreEnvForRequest,
  isPlatformAdminEmail,
  platformAdminNamespace,
  requirePlatformAdmin,
  sanitizeOrganizationRows,
  summarizeOrganizationRows
} from '../v2/platform-admin-overlay.js';

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
function fakeRequest(email, sub='uid_test') {
  const token = `${b64url({alg:'RS256',kid:'test'})}.${b64url({sub,email,email_verified:true})}.signature`;
  return new Request('https://capital-mastery-api.example.test/enterprise/admin/organizations', {
    headers: { Authorization:`Bearer ${token}`, Origin:'https://sribyju.github.io' }
  });
}

assert.equal(PLATFORM_ADMIN_EMAIL, 'awsomecoolsri2@gmail.com');
assert.equal(isPlatformAdminEmail(' AWSOMECOOLSRI2@gmail.com '), true);
assert.equal(isPlatformAdminEmail('avadhanula.shriyan@gmail.com'), false);
assert.equal(isPlatformAdminEmail('other@example.com'), false);

const env = { ADMIN_UID:'uid_real_admin', DB:{ marker:true }, ALLOWED_ORIGIN:'https://sribyju.github.io' };
assert.equal(coreEnvForRequest(fakeRequest(PLATFORM_ADMIN_EMAIL), env).ADMIN_UID, 'uid_real_admin');
const downgraded = coreEnvForRequest(fakeRequest('avadhanula.shriyan@gmail.com'), env);
assert.equal(downgraded.ADMIN_UID, DISABLED_ADMIN_UID);
assert.equal(downgraded.DB, env.DB, 'D1 binding must be preserved while legacy admin fallback is disabled');

assert.equal(platformAdminNamespace('/admin/integrity'), true);
assert.equal(platformAdminNamespace('/enterprise/admin/demo'), true);
assert.equal(platformAdminNamespace('/enterprise/admin/organizations'), true);
assert.equal(platformAdminNamespace('/enterprise/org_123'), false);

const allowed = await requirePlatformAdmin(fakeRequest(PLATFORM_ADMIN_EMAIL), env, async () => ({ email:PLATFORM_ADMIN_EMAIL, uid:'uid_real_admin' }));
assert.equal(allowed.email, PLATFORM_ADMIN_EMAIL);

for (const role of ['owner','training_admin','manager','viewer','content_manager','learner']) {
  await assert.rejects(
    requirePlatformAdmin(fakeRequest('avadhanula.shriyan@gmail.com'), env, async () => ({ email:'avadhanula.shriyan@gmail.com', uid:`uid_${role}`, role })),
    (error) => error?.status === 403,
    `${role} must not imply platform-admin access`
  );
}

const organizations = sanitizeOrganizationRows([
  { id:'org_real_1', name:'Test', status:'active', created_at:'2026-09-08 12:00:00', staff_count:2, learner_count:3, cohort_count:1, assignment_count:2, published_assignment_count:1, last_activity:'2026-09-08 13:00:00' },
  { id:'demo_org_should_never_leak', name:'Demo', status:'active', staff_count:99, learner_count:99, cohort_count:99, assignment_count:99, published_assignment_count:99 },
  { id:'org_real_2', name:'Example Partners', status:'active', staff_count:1, learner_count:4, cohort_count:2, assignment_count:3, published_assignment_count:2 }
]);
assert.equal(organizations.length, 2, 'demo_org_* must be excluded even after SQL filtering');
assert.equal(organizations.some((org) => org.id.startsWith('demo_org_')), false);
assert.deepEqual(summarizeOrganizationRows(organizations), {
  realEmployers:2,
  staff:3,
  learners:7,
  cohorts:3,
  assignments:5,
  publishedAssignments:3
});
for (const org of organizations) {
  assert.equal(Object.hasOwn(org, 'email'), false);
  assert.equal(Object.hasOwn(org, 'uid'), false);
  assert.equal(Object.hasOwn(org, 'answers'), false);
  assert.equal(Object.hasOwn(org, 'submissions'), false);
}

console.log('PLATFORM_ADMIN_EMPLOYER_USAGE_LOGIC_AUDIT=PASS');
