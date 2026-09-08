import './patch-final-platform-polish-v3.mjs';
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

function patchFounderRouterSafeView() {
  const rel = 'founder-admin-employer-usage.js';
  let source = read(rel);

  source = replaceOnce(
    source,
    "  const ADMIN_ROUTE = '#/admin-preview?view=employer-usage';\n  const LEGACY_ADMIN_ROUTE = '#/admin-preview/employer-usage';",
    "  const ADMIN_ROUTE = '#/admin-preview';\n  const LEGACY_ADMIN_ROUTE = '#/admin-preview/employer-usage';\n  const ADMIN_VIEW_PARAM = 'adminView';\n  const ADMIN_VIEW = 'employer-usage';",
    'router-safe admin constants'
  );

  const routeHelper = `  function adminUsageRoute(hash = location.hash) {\n    const normalized = String(hash || '#/').split('?', 1)[0].replace(/\\/$/, '');\n    return normalized === ADMIN_ROUTE && new URLSearchParams(location.search).get(ADMIN_VIEW_PARAM) === ADMIN_VIEW;\n  }\n\n  function legacyAdminUsageRoute(hash = location.hash) {\n    const raw = String(hash || '#/');\n    if (raw.split('?', 1)[0].replace(/\\/$/, '') === LEGACY_ADMIN_ROUTE) return true;\n    const [route, query=''] = raw.split('?');\n    return route.replace(/\\/$/, '') === ADMIN_ROUTE && new URLSearchParams(query).get('view') === ADMIN_VIEW;\n  }\n\n  function setAdminUsageView(active, { replace = false } = {}) {\n    const url = new URL(location.href);\n    if (active) url.searchParams.set(ADMIN_VIEW_PARAM, ADMIN_VIEW);\n    else url.searchParams.delete(ADMIN_VIEW_PARAM);\n    url.hash = ADMIN_ROUTE;\n    const next = \`\${url.pathname}\${url.search}\${url.hash}\`;\n    history[replace ? 'replaceState' : 'pushState']({ cmAdminView: active ? ADMIN_VIEW : null }, '', next);\n    syncRoute();\n  }`;
  source = replaceFunction(source, 'adminUsageRoute(hash = location.hash)', 'main()', routeHelper);

  const cardFunction = `  function decorateAdminCard() {\n    const normalized = String(location.hash || '#/').split('?', 1)[0].replace(/\\/$/, '');\n    if (normalized !== ADMIN_ROUTE) return;\n    if (adminUsageRoute()) return;\n    if (!verifiedAdmin()) return;\n    const grid = document.querySelector('.admin-grid');\n    if (!grid || grid.querySelector('[data-cm-employer-usage-card]')) return;\n\n    const card = document.createElement('div');\n    card.className = 'admin-card';\n    card.dataset.cmEmployerUsageCard = 'true';\n    card.innerHTML = \`\n      <div class="eyebrow">PLATFORM ADMIN</div>\n      <h3>Employer Usage</h3>\n      <p>View aggregate real-employer workspace usage across Capital Mastery. Demo/Test Lab organizations and learner identity details are excluded.</p>\n      <button class="btn btn-primary btn-sm" type="button" data-cm-open-employer-usage>Open Employer Usage →</button>\`;
    card.querySelector('[data-cm-open-employer-usage]')?.addEventListener('click', () => setAdminUsageView(true));\n    grid.prepend(card);\n  }`;
  source = replaceFunction(source, 'decorateAdminCard()', 'renderShell(inner)', cardFunction);

  const renderShellFunction = `  function renderShell(inner) {\n    const pageMain = main();\n    if (!pageMain) return false;\n    pageMain.innerHTML = \`<section class="cm-founder-admin-page"><div class="container">\${inner}</div></section>\`;\n    pageMain.querySelectorAll('[data-cm-founder-admin-back]').forEach((control) => {\n      control.addEventListener('click', () => setAdminUsageView(false));\n    });\n    return true;\n  }`;
  source = replaceFunction(source, 'renderShell(inner)', 'renderLoading()', renderShellFunction);

  source = source.replaceAll(
    '<a class="cm-founder-admin-back" href="#/admin-preview">← Admin / QA</a>',
    '<button class="cm-founder-admin-back" type="button" data-cm-founder-admin-back>← Admin / QA</button>'
  );

  const syncFunction = `  function syncRoute() {\n    const normalized = String(location.hash || '#/').split('?', 1)[0].replace(/\\/$/, '');\n    if (legacyAdminUsageRoute() && verifiedAdmin()) {\n      setAdminUsageView(true, { replace: true });\n      return;\n    }\n    if (adminUsageRoute()) {\n      const page = document.querySelector('.cm-founder-admin-page');\n      const settled = page?.querySelector('.cm-founder-metric-grid, .cm-founder-admin-loading, .cm-founder-admin-denied');\n      if (!page || !settled) loadUsage();\n      return;\n    }\n    if (normalized !== ADMIN_ROUTE && new URLSearchParams(location.search).has(ADMIN_VIEW_PARAM)) {\n      const url = new URL(location.href);\n      url.searchParams.delete(ADMIN_VIEW_PARAM);\n      history.replaceState(history.state, '', \`\${url.pathname}\${url.search}\${url.hash}\`);\n    }\n    renderSerial += 1;\n    usageLoading = false;\n    decoratePublicProof();\n    decorateAdminCard();\n  }`;
  source = replaceFunction(source, 'syncRoute()', 'queueSync()', syncFunction);

  source = source.replace(
    "  window.addEventListener('hashchange', () => setTimeout(syncRoute, 0));",
    "  window.addEventListener('hashchange', () => setTimeout(syncRoute, 0));\n  window.addEventListener('popstate', () => setTimeout(syncRoute, 0));"
  );

  write(rel, source);
}

function patchFounderTests() {
  let source = read('tests/platform-admin-employer-usage-source-audit.mjs');
  source = source.replace(
    "assert.match(frontend, /#\\/admin-preview\\?view=employer-usage/);",
    "assert.match(frontend, /ADMIN_VIEW_PARAM\\s*=\\s*['\"]adminView['\"]/);\nassert.match(frontend, /history\\[replace \\? 'replaceState' : 'pushState'\\]/);\nassert.match(frontend, /data-cm-open-employer-usage/);"
  );
  write('tests/platform-admin-employer-usage-source-audit.mjs', source);

  source = read('tests/platform-admin-employer-usage-browser-audit.cjs');
  source = source.replace(
    "      await page.locator('[data-cm-employer-usage-card] a').click();",
    "      await page.locator('[data-cm-open-employer-usage]').click();\n      await page.waitForFunction(() => new URLSearchParams(location.search).get('adminView') === 'employer-usage');"
  );
  source = source.replace(
    "    await deniedPage.goto(`${BASE}/#/admin-preview?view=employer-usage`,{waitUntil:'domcontentloaded',timeout:30000});",
    "    await deniedPage.goto(`${BASE}/?adminView=employer-usage#/admin-preview`,{waitUntil:'domcontentloaded',timeout:30000});"
  );
  // The v3 patch converts any old child-route string in this file to the hash-query
  // form. Replace that form too so the test reflects the router-safe URL shape.
  source = source.replaceAll('#/admin-preview?view=employer-usage', '#/admin-preview');
  write('tests/platform-admin-employer-usage-browser-audit.cjs', source);
}

patchFounderRouterSafeView();
patchFounderTests();
console.log('Founder Employer Usage view moved outside the hash router safely.');
