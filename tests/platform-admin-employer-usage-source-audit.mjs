import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [overlay, frontend, index, wrangler, guard, helpers] = await Promise.all([
  readFile(new URL('../v2/platform-admin-overlay.js', import.meta.url), 'utf8'),
  readFile(new URL('../founder-admin-employer-usage.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
  readFile(new URL('../admin-route-guard.js', import.meta.url), 'utf8'),
  readFile(new URL('../v2/enterprise-helpers.js', import.meta.url), 'utf8')
]);

assert.match(overlay, /PLATFORM_ADMIN_EMAIL\s*=\s*['"]awsomecoolsri2@gmail\.com['"]/);
assert.doesNotMatch(overlay, /avadhanula\.shriyan@gmail\.com/);
assert.match(overlay, /GET|request\.method\s*===\s*['"]GET['"]/);
assert.match(overlay, /\/enterprise\/admin\/organizations/);
assert.match(overlay, /o\.id\s+NOT LIKE\s+'demo_org_%'/);
assert.match(overlay, /startsWith\(['"]demo_org_['"]\)/);
assert.match(overlay, /callCoreAuthCheck/);
assert.match(overlay, /payload\.sub[^\n]+auth\.uid|auth\.uid[^\n]+payload\.sub/);
assert.match(overlay, /DISABLED_ADMIN_UID/);
assert.match(overlay, /platformAdminNamespace/);
assert.doesNotMatch(overlay, /email_normalized|holder_name|answers_json|response_json|role_lab_submissions/);

for (const role of ['owner','training_admin','content_manager','manager','viewer']) {
  assert.doesNotMatch(overlay, new RegExp(`isPlatformAdmin[^\\n]{0,120}${role}`), `Employer role ${role} must not become a platform-admin criterion`);
}

assert.match(helpers, /async function requireOrgMember|function requireOrgMember/);
assert.match(helpers, /async function requireOrgRole|function requireOrgRole/);
assert.match(helpers, /WHERE m\.org_id = \? AND m\.uid = \?/);

assert.match(guard, /ADMIN_PREFIX\s*=\s*['"]#\/admin-preview['"]/);
assert.match(frontend, /ADMIN_VIEW_PARAM\s*=\s*['"]adminView['"]/);
assert.match(frontend, /history\[replace \? 'replaceState' : 'pushState'\]/);
assert.match(frontend, /data-cm-open-employer-usage/);
assert.match(frontend, /backendVerified\s*===\s*true/);
assert.match(frontend, /Authorization:\s*`Bearer \$\{token\}`/);
assert.match(frontend, /Demo\/Test Lab organizations are excluded/);
assert.match(frontend, /does not add the platform administrator to any organization/);
assert.match(frontend, /Capital Mastery is the official onboarding training platform for the following firms:/);
assert.match(frontend, /Richmond, Virginia · Mergers &amp; Acquisitions/);
assert.match(frontend, /data-cm-firm-card=\"sterling-point-advisors\"/);
assert.match(frontend, /does not imply sponsorship, investment-services endorsement, exclusivity/);
assert.match(frontend, /assets\/sterling-point-logo\.svg/);
assert.doesNotMatch(frontend, /localStorage[^\n]*(?:isAdmin|admin)/i);

assert.match(index, /founder-admin-employer-usage\.css\?v=20260908-founderadmin2/);
assert.match(index, /founder-admin-employer-usage\.js\?v=20260908-founderadmin2/);
const config = JSON.parse(wrangler);
assert.equal(config.main, 'v2/platform-admin-overlay.js');
assert.equal(config.vars.ALLOWED_ORIGIN, 'https://sribyju.github.io');
assert.equal(String(config.vars.ALLOWED_ORIGIN).includes('capitalmastery.pages.dev'), false);

console.log('PLATFORM_ADMIN_EMPLOYER_USAGE_SOURCE_AUDIT=PASS');
