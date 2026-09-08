import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const write = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), value);

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Patch anchor is ambiguous: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceFunction(source, name, nextName, replacement) {
  const start = source.indexOf(`  function ${name}`);
  const end = source.indexOf(`\n  function ${nextName}`, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate function ${name}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

function patchCredentialsStability() {
  const rel = 'ux-stability.js';
  let source = read(rel);
  if (source.includes('cmCredentialRouteSettled')) return;
  const replacement = `  function repairCredentialRendererRace() {\n    const [root] = routeParts();\n    if (root !== 'credentials') {\n      credentialRepairCount = 0;\n      clearTimeout(credentialRepairTimer);\n      credentialRepairTimer = null;\n      return;\n    }\n\n    const main = document.querySelector('main#main');\n    if (!main) return;\n\n    // Both the local preview renderer and the authoritative D1 renderer are valid\n    // settled states. The previous watchdog treated .cm-credential-card (the real\n    // verified card) as a broken renderer and manually fired up to three extra\n    // hashchange events. Those synthetic route changes repeatedly rebuilt the page\n    // and caused the Credentials tab to jump up/down. Only repair a genuinely blank\n    // credentials route, and never a loading, error, preview, or verified state.\n    const cmCredentialRouteSettled = !!main.querySelector(\n      '.credentials-hero, .cm-live-card, .cm-live-error, .cm-live-credential, .cm-credential-card, [data-cm-credentials-live]'\n    ) || [...main.querySelectorAll('.page-hero .eyebrow')].some(node =>\n      /VERIFIED CREDENTIALS(?: & COMPLETIONS)?/i.test(String(node.textContent || ''))\n    );\n\n    if (cmCredentialRouteSettled) {\n      credentialRepairCount = 0;\n      clearTimeout(credentialRepairTimer);\n      credentialRepairTimer = null;\n      return;\n    }\n\n    if (credentialRepairCount >= 1 || credentialRepairTimer) return;\n    credentialRepairTimer = setTimeout(() => {\n      credentialRepairTimer = null;\n      const currentMain = document.querySelector('main#main');\n      if (routeParts()[0] !== 'credentials' || !currentMain) return;\n      const settled = !!currentMain.querySelector(\n        '.credentials-hero, .cm-live-card, .cm-live-error, .cm-live-credential, .cm-credential-card, [data-cm-credentials-live]'\n      ) || [...currentMain.querySelectorAll('.page-hero .eyebrow')].some(node =>\n        /VERIFIED CREDENTIALS(?: & COMPLETIONS)?/i.test(String(node.textContent || ''))\n      );\n      if (settled) return;\n      credentialRepairCount++;\n      window.dispatchEvent(new HashChangeEvent('hashchange'));\n    }, 320);\n  }`;
  source = replaceFunction(source, 'repairCredentialRendererRace()', 'enhance()', replacement);
  write(rel, source);
}

function patchFounderAdminAndFirmProof() {
  const rel = 'founder-admin-employer-usage.js';
  let source = read(rel);
  source = source.replace(
    "  const ADMIN_ROUTE = '#/admin-preview/employer-usage';",
    "  const ADMIN_ROUTE = '#/admin-preview?view=employer-usage';\n  const LEGACY_ADMIN_ROUTE = '#/admin-preview/employer-usage';"
  );

  if (!source.includes('function adminUsageRoute(')) {
    const anchor = `  function rootRoute() {\n    return String(location.hash || '#/').replace(/^#\\/?/, '').split(/[/?]/, 1)[0] || '';\n  }`;
    const extra = `${anchor}\n\n  function adminUsageRoute(hash = location.hash) {\n    const raw = String(hash || '#/');\n    if (raw.split('?', 1)[0] === LEGACY_ADMIN_ROUTE) return true;\n    const [route, query=''] = raw.split('?');\n    return route === '#/admin-preview' && new URLSearchParams(query).get('view') === 'employer-usage';\n  }`;
    source = replaceOnce(source, anchor, extra, 'founder admin usage route helper');
  }

  const proofReplacement = `  function officialPlatformSection(context = 'home') {\n    const section = document.createElement('section');\n    section.className = \`cm-official-platform-proof cm-official-platform-proof-\${context}\`;\n    section.dataset.cmOfficialPlatformProof = context;\n    section.setAttribute('aria-label', 'Firms using Capital Mastery for onboarding and training');\n    section.innerHTML = \`\n      <div class="container cm-official-platform-multi">\n        <div class="cm-official-platform-copy">\n          <div class="eyebrow">OFFICIAL ONBOARDING ADOPTION</div>\n          <h2>Capital Mastery is the official onboarding training platform for the following firms:</h2>\n          <p>Capital Mastery gives finance teams a structured pre-Day-1 layer for role training, realistic work, evidence-backed readiness, and cohort administration. This section is designed to grow as additional firms adopt the platform.</p>\n        </div>\n        <div class="cm-official-firms-grid" aria-label="Official onboarding firms">\n          <article class="cm-official-firm-card" data-cm-firm-card="sterling-point-advisors">\n            <div class="cm-official-firm-logo"><img src="assets/sterling-point-logo.svg" alt="Sterling Point Advisors" loading="lazy" /></div>\n            <div class="cm-official-firm-meta">\n              <span class="cm-official-firm-location">Richmond, Virginia · Mergers &amp; Acquisitions</span>\n              <h3>Sterling Point Advisors</h3>\n              <p>A specialized M&amp;A advisory firm serving closely held businesses. Its principals bring decades of transaction experience across industries, including work representing billions of dollars in aggregate deal value.</p>\n            </div>\n          </article>\n        </div>\n        <p class="cm-official-platform-note">Firm names and logos are displayed with permission in connection with onboarding/training use. Inclusion does not imply sponsorship, investment-services endorsement, exclusivity, or that these are the only firms Capital Mastery can support.</p>\n      </div>\`;
    return section;\n  }`;
  source = replaceFunction(source, 'officialPlatformSection(context = \'home\')', 'decoratePublicProof()', proofReplacement);

  source = source.replace(
    "    if (String(location.hash || '').split('?', 1)[0] !== ADMIN_ROUTE) return;",
    "    if (!adminUsageRoute()) return;"
  );
  source = source.replace(
    "      if (serial !== renderSerial || String(location.hash || '').split('?', 1)[0] !== ADMIN_ROUTE) return;",
    "      if (serial !== renderSerial || !adminUsageRoute()) return;"
  );

  const syncReplacement = `  function syncRoute() {\n    const normalized = String(location.hash || '').split('?', 1)[0];\n    if (normalized === LEGACY_ADMIN_ROUTE && verifiedAdmin()) {\n      location.replace(ADMIN_ROUTE);\n      return;\n    }\n    if (adminUsageRoute()) {\n      const page = document.querySelector('.cm-founder-admin-page');\n      const settled = page?.querySelector('.cm-founder-metric-grid, .cm-founder-admin-loading, .cm-founder-admin-denied');\n      if (!page || !settled) loadUsage();\n      return;\n    }\n    renderSerial += 1;\n    usageLoading = false;\n    decoratePublicProof();\n    decorateAdminCard();\n  }`;
  source = replaceFunction(source, 'syncRoute()', 'queueSync()', syncReplacement);
  write(rel, source);

  const cssRel = 'founder-admin-employer-usage.css';
  let css = read(cssRel);
  if (!css.includes('.cm-official-platform-multi')) {
    css += `\n/* Multi-firm official onboarding proof */\n.cm-official-platform-multi{display:grid;gap:22px}\n.cm-official-firms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:16px}\n.cm-official-firm-card{display:grid;grid-template-columns:minmax(160px,.72fr) minmax(0,1.28fr);gap:22px;align-items:center;padding:22px;border:1px solid #dfe5ec;border-radius:18px;background:#fff;box-shadow:0 14px 35px rgba(7,26,51,.07)}\n.cm-official-firm-logo{display:grid;place-items:center;min-height:116px;padding:15px;border:1px solid #edf0f4;border-radius:14px;background:#fbfcfd}\n.cm-official-firm-logo img{display:block;width:100%;max-width:360px;height:auto}\n.cm-official-firm-meta h3{margin:6px 0 8px;color:var(--navy,#071a33);font-size:1.45rem}\n.cm-official-firm-meta p{margin:0;color:#445166;line-height:1.58}\n.cm-official-firm-location{display:block;color:#8a672f;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}\n.cm-official-platform-multi>.cm-official-platform-note{margin:0;color:#68758a;font-size:.84rem}\n@media(max-width:680px){.cm-official-firm-card{grid-template-columns:1fr;padding:18px}.cm-official-firm-logo{min-height:96px}.cm-official-firm-meta h3{font-size:1.3rem}}\n`;
  }
  write(cssRel, css);
}

function patchTests() {
  let source = read('tests/platform-admin-employer-usage-source-audit.mjs');
  source = source.replace(
    "assert.match(frontend, /#\\/admin-preview\\/employer-usage/);",
    "assert.match(frontend, /#\\/admin-preview\\?view=employer-usage/);"
  );
  source = source.replace(
    "assert.match(frontend, /Capital Mastery is the official onboarding training platform for Sterling Point Advisors\\./);",
    "assert.match(frontend, /Capital Mastery is the official onboarding training platform for the following firms:/);\nassert.match(frontend, /Richmond, Virginia · Mergers &amp; Acquisitions/);\nassert.match(frontend, /data-cm-firm-card=\\\"sterling-point-advisors\\\"/);\nassert.match(frontend, /does not imply sponsorship, investment-services endorsement, exclusivity/);"
  );
  write('tests/platform-admin-employer-usage-source-audit.mjs', source);

  source = read('tests/platform-admin-employer-usage-browser-audit.cjs');
  source = source.replace(
    "    assert(/Capital Mastery is the official onboarding training platform for Sterling Point Advisors\\./.test(proof||''),'Home official-onboarding statement missing');",
    "    assert(/Capital Mastery is the official onboarding training platform for the following firms:/i.test(proof||''),'Home multi-firm onboarding statement missing');\n    assert(/Richmond, Virginia/i.test(proof||''),'Home firm location missing');\n    assert(/specialized M&A advisory firm/i.test(proof||''),'Home firm description missing');"
  );
  source = source.replace(
    "    assert(/official onboarding training platform for Sterling Point Advisors/i.test(proof||''),'Employer official-onboarding statement missing');",
    "    assert(/official onboarding training platform for the following firms/i.test(proof||''),'Employer multi-firm onboarding statement missing');\n    assert(await publicPage.locator('[data-cm-official-platform-proof=\"employers\"] [data-cm-firm-card=\"sterling-point-advisors\"]').count()===1,'Employer Sterling Point firm card missing');"
  );
  source = source.replaceAll('#/admin-preview/employer-usage', '#/admin-preview?view=employer-usage');
  write('tests/platform-admin-employer-usage-browser-audit.cjs', source);
}

function patchIndexAndBuildCopy() {
  let source = read('index.html');
  source = source.replace('founder-admin-employer-usage.css?v=20260908-founderadmin1', 'founder-admin-employer-usage.css?v=20260908-founderadmin2');
  source = source.replace('founder-admin-employer-usage.js?v=20260908-founderadmin1', 'founder-admin-employer-usage.js?v=20260908-founderadmin2');
  source = source.replace('ux-stability.js?v=20260901-courseintegrity1', 'ux-stability.js?v=20260908-credentials-stability1');
  write('index.html', source);

  const buildRel = 'tools/build-pages.mjs';
  let build = read(buildRel);
  build = build.replace('Cloudflare Pages bundle ready:', 'GitHub Pages bundle ready:');
  write(buildRel, build);
}

function insertWorkflowLine(rel, needle, addition, marker) {
  let source = read(rel);
  if (source.includes(marker)) return;
  source = replaceOnce(source, needle, `${needle}${addition}`, `${rel} ${marker}`);
  write(rel, source);
}

function patchWorkflows() {
  insertWorkflowLine(
    '.github/workflows/functional-persistence-reliability.yml',
    "      - 'tests/platform-admin-employer-usage-browser-audit.cjs'\n",
    "      - 'tests/credentials-route-stability-browser-audit.cjs'\n      - 'ux-stability.js'\n      - 'founder-admin-employer-usage.js'\n      - 'founder-admin-employer-usage.css'\n",
    'credentials-route-stability-browser-audit.cjs'
  );
  insertWorkflowLine(
    '.github/workflows/functional-persistence-reliability.yml',
    "          node tests/platform-admin-employer-usage-browser-audit.cjs\n",
    "          node tests/credentials-route-stability-browser-audit.cjs\n",
    'node tests/credentials-route-stability-browser-audit.cjs'
  );

  insertWorkflowLine(
    '.github/workflows/failure-seeking-round2.yml',
    "          node --check tests/firebase-direct-google-browser-audit.cjs\n",
    "          node --check tests/credentials-route-stability-browser-audit.cjs\n",
    'node --check tests/credentials-route-stability-browser-audit.cjs'
  );
  insertWorkflowLine(
    '.github/workflows/failure-seeking-round2.yml',
    "          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/employer-invite-lifecycle-browser-audit.cjs\n",
    "          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/credentials-route-stability-browser-audit.cjs\n",
    'CM_AUDIT_URL=http://127.0.0.1:4173 node tests/credentials-route-stability-browser-audit.cjs'
  );

  insertWorkflowLine(
    '.github/workflows/github-pages-live-readonly-audit.yml',
    "          CM_AUDIT_URL=\"${PRIMARY}/\" node tests/employer-invite-lifecycle-browser-audit.cjs\n",
    "          CM_AUDIT_URL=\"${PRIMARY}/\" node tests/credentials-route-stability-browser-audit.cjs\n",
    'node tests/credentials-route-stability-browser-audit.cjs'
  );

  insertWorkflowLine(
    '.github/workflows/cloudflare-production-release.yml',
    "          node --check tests/platform-admin-employer-usage-browser-audit.cjs\n",
    "          node --check tests/credentials-route-stability-browser-audit.cjs\n",
    'node --check tests/credentials-route-stability-browser-audit.cjs'
  );
  insertWorkflowLine(
    '.github/workflows/cloudflare-production-release.yml',
    "          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/platform-admin-employer-usage-browser-audit.cjs\n",
    "          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/credentials-route-stability-browser-audit.cjs\n",
    'CM_AUDIT_URL=http://127.0.0.1:4173 node tests/credentials-route-stability-browser-audit.cjs'
  );
  insertWorkflowLine(
    '.github/workflows/cloudflare-production-release.yml',
    "          CM_AUDIT_URL=\"${PRIMARY_URL}\" node tests/platform-admin-employer-usage-browser-audit.cjs\n",
    "          CM_AUDIT_URL=\"${PRIMARY_URL}\" node tests/credentials-route-stability-browser-audit.cjs\n",
    'CM_AUDIT_URL="${PRIMARY_URL}" node tests/credentials-route-stability-browser-audit.cjs'
  );

  let release = read('.github/workflows/cloudflare-production-release.yml');
  release = release.replaceAll('founder-admin-employer-usage.js?v=20260908-founderadmin1', 'founder-admin-employer-usage.js?v=20260908-founderadmin2');
  write('.github/workflows/cloudflare-production-release.yml', release);
}

patchCredentialsStability();
patchFounderAdminAndFirmProof();
patchTests();
patchIndexAndBuildCopy();
patchWorkflows();
console.log('Final platform polish patches applied.');
