import { chromium } from 'playwright';

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const QA_KEY = 'capitalMasteryQaPreviewV1';
const errors = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForApp(page) {
  await page.waitForSelector('#app main#main', { timeout: 15000 });
  await page.waitForTimeout(250);
}

async function gotoHash(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(350);
  await waitForApp(page);
}

async function stabilizeAuth(page, { admin=false }={}) {
  await page.waitForFunction(() => window.CM_AUTH && typeof window.CM_AUTH === 'object', null, { timeout:15000 });
  await page.evaluate(adminFlag => {
    window.CM_AUTH.ready = true;
    window.CM_AUTH.user = { uid:'browser-audit-user', email:'audit@example.invalid', displayName:'Browser Audit' };
    window.CM_AUTH.isAdmin = adminFlag;
    window.CM_AUTH.backendVerified = true;
    window.CM_AUTH.getIdToken = async () => 'browser-audit-token';
    document.dispatchEvent(new CustomEvent('cm-auth-changed', { detail:{ user:window.CM_AUTH.user, isAdmin:adminFlag, backendVerified:true } }));
  }, admin);
  await page.waitForTimeout(120);
}

async function mutationCount(page, duration=700) {
  return page.evaluate(ms => new Promise(resolve => {
    const root = document.getElementById('app');
    let child = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) if (record.type === 'childList') child += record.addedNodes.length + record.removedNodes.length;
    });
    observer.observe(root, { childList:true, subtree:true });
    setTimeout(() => { observer.disconnect(); resolve(child); }, ms);
  }), duration);
}

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  assert(Math.max(metrics.doc, metrics.body) <= metrics.innerWidth + 2,
    `${label}: horizontal overflow ${Math.max(metrics.doc,metrics.body)}px > ${metrics.innerWidth}px`);
}

async function trackDiagnostics(page) {
  return page.evaluate(() => ({
    hash: location.hash,
    trackApi: typeof window.CM_TRAINING_TRACKS,
    trackDefinitions: Object.keys(window.CM_TRAINING_TRACKS?.definitions || {}),
    heroCount: document.querySelectorAll('#app .page-hero').length,
    chooserCount: document.querySelectorAll('[data-cm-track-chooser]').length,
    statusCount: document.querySelectorAll('[data-cm-track-status]').length,
    sequenceCount: document.querySelectorAll('[data-cm-track-sequence]').length,
    trainingScript: [...document.scripts].map(s=>s.src).find(src=>src.includes('training-tracks.js')) || '',
    mainText: (document.querySelector('#app main#main')?.innerText || '').slice(0,1200)
  }));
}

const browser = await chromium.launch({ headless:true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('requestfailed', request => {
  if (request.url().startsWith(BASE)) errors.push(`same-origin request failed: ${request.method()} ${request.url()} :: ${request.failure()?.errorText || ''}`);
});
page.on('console', msg => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
  if (/Firebase|auth-check|Failed to fetch/i.test(text)) return;
  errors.push(`console.error: ${text}`);
});

try {
  await page.goto(`${BASE}/#/`, { waitUntil:'domcontentloaded', timeout:30000 });
  await waitForApp(page);

  // -------------------------------------------------------------------------
  // 1) Repeated two-track switching must settle, not create a mutation loop.
  // -------------------------------------------------------------------------
  await gotoHash(page, '#/career/investment-banking');
  try {
    await page.waitForSelector('[data-cm-track-chooser]', { timeout:2500 });
  } catch (_) {
    const diag=await trackDiagnostics(page);
    // Trigger the documented render event once only as a diagnostic. If this
    // suddenly repairs the UI, the failure is event/scheduling related rather
    // than a selector or timing assumption.
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('capitalmastery:rendered')));
    await page.waitForTimeout(180);
    diag.afterExplicitRenderEvent = await page.locator('[data-cm-track-chooser]').count();
    throw new Error(`Career track chooser missing in real browser. diagnostics=${JSON.stringify(diag)} runtimeErrors=${JSON.stringify(errors)}`);
  }
  assert(await page.locator('[data-cm-track-chooser]').count() === 1, 'Career page must have exactly one track chooser');
  assert(await page.locator('[data-cm-track-status]').count() === 1, 'Career page must have exactly one selected-track status');
  assert(await page.locator('[data-cm-track-sequence]').count() === 1, 'Career page must have exactly one track sequence');

  for (let i=0; i<12; i++) {
    const target = i % 2 === 0 ? 'career-skills' : 'professional-readiness';
    await page.locator(`[data-cm-select-track="${target}"]`).click();
    await page.waitForTimeout(35);
    assert(await page.locator('[data-cm-track-chooser]').count() === 1, `Track switch ${i}: duplicate chooser`);
    assert(await page.locator('[data-cm-track-status]').count() === 1, `Track switch ${i}: duplicate status`);
    assert(await page.locator('[data-cm-track-sequence]').count() === 1, `Track switch ${i}: duplicate sequence`);
  }
  const settledMutations = await mutationCount(page, 800);
  assert(settledMutations < 20, `Career page did not settle after track switching; ${settledMutations} child-list mutations in 800ms`);

  const chooserSemantics = await page.evaluate(() => {
    const buttons=[...document.querySelectorAll('[data-cm-select-track]')];
    return { count:buttons.length, pressed:buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length, tags:buttons.map(b=>b.tagName) };
  });
  assert(chooserSemantics.count === 2, 'Track chooser must expose exactly two controls');
  assert(chooserSemantics.pressed === 1, 'Exactly one track must be aria-pressed');
  assert(chooserSemantics.tags.every(x => x === 'BUTTON'), 'Track chooser controls must remain keyboard-native buttons');

  // -------------------------------------------------------------------------
  // 2) Professional Readiness cannot deep-link the shorter Career Skills sim.
  // -------------------------------------------------------------------------
  await page.evaluate(() => window.CM_TRAINING_TRACKS.setTrack('investment-banking','professional-readiness'));
  await gotoHash(page, '#/official-simulation/investment-banking');
  await page.waitForTimeout(180);
  assert(locationHash(await page.evaluate(() => location.hash)).startsWith('#/career/investment-banking'),
    'Professional Readiness deep-link to Career Skills simulation must return to career page');
  assert((await page.textContent('#app')).includes('Professional Readiness uses the deeper Role Lab'),
    'Professional simulation guard should explain why the Career Skills capstone is not the active gate');

  // -------------------------------------------------------------------------
  // 3) Admin QA: direct local simulation preview must stay local and stable.
  // -------------------------------------------------------------------------
  await stabilizeAuth(page, { admin:true });
  await gotoHash(page, '#/admin-preview');
  assert((await page.textContent('#app')).includes('Capital Mastery Release Lab'), 'Verified admin should see Admin / QA lab');
  const adminCards = await page.locator('.admin-card').count();
  assert(adminCards >= 6, `Admin page unexpectedly sparse (${adminCards} cards)`);
  const simLink = page.locator('[data-cm-admin-sim-preview]');
  assert(await simLink.count() === 1, 'Admin Simulation Lab must expose one explicit preview link');
  await simLink.click();
  await page.waitForTimeout(250);
  assert(locationHash(await page.evaluate(() => location.hash)).startsWith('#/simulation/investment-banking'),
    `Admin simulation preview was redirected away: ${await page.evaluate(() => location.hash)}`);
  const simText = await page.textContent('#app');
  assert(/Project Northstar|Simulation|Northstar Technologies/i.test(simText || ''), 'Admin simulation preview did not render the local simulation');
  assert(await page.evaluate(k => localStorage.getItem(k), QA_KEY) === 'true', 'Admin simulation preview must enable isolated QA mode');
  const adminSimMutations = await mutationCount(page, 650);
  assert(adminSimMutations < 20, `Admin simulation preview did not settle; ${adminSimMutations} mutations`);

  await gotoHash(page, '#/admin-preview');
  const foundationPreview = page.locator('a[href="#/certificate/investment-banking/foundations"]').first();
  assert(await foundationPreview.count() === 1, 'Admin legacy credential preview link missing');
  await foundationPreview.click();
  await page.waitForTimeout(300);
  assert(await page.locator('#certificate').count() === 1, 'Admin credential preview did not render a certificate');
  const credentialPreviewText = await page.textContent('#app');
  assert(!/active issued credential is required/i.test(credentialPreviewText || ''), 'Authoritative renderer overrode Admin credential preview');

  // -------------------------------------------------------------------------
  // 4) Non-admin callers cannot invoke hidden QA controls from the console.
  // -------------------------------------------------------------------------
  await page.evaluate(k => localStorage.removeItem(k), QA_KEY);
  await stabilizeAuth(page, { admin:false });
  const consoleGuard = await page.evaluate(k => {
    const before = localStorage.getItem('capitalMasteryLocalStateV1');
    const scoreResult = window.CM?.qaScores?.(100);
    const progressResult = window.CM?.qaProgress?.(100);
    const toggleResult = window.CM?.toggleQa?.();
    return {
      scoreResult,
      progressResult,
      toggleResult,
      qa:localStorage.getItem(k),
      before,
      after:localStorage.getItem('capitalMasteryLocalStateV1')
    };
  }, QA_KEY);
  assert(consoleGuard.scoreResult === false && consoleGuard.progressResult === false && consoleGuard.toggleResult === false,
    'Non-admin QA functions must fail closed');
  assert(consoleGuard.qa !== 'true', 'Non-admin console call activated QA mode');
  assert(consoleGuard.before === consoleGuard.after, 'Non-admin QA console call mutated learner local state');

  await gotoHash(page, '#/admin-preview');
  await page.waitForTimeout(150);
  const blockedText = await page.textContent('#app');
  assert(/Access denied|Sign in required|Checking administrator access/i.test(blockedText || ''), 'Non-admin direct Admin route was not blocked');

  // -------------------------------------------------------------------------
  // 5) Route churn / stale async views: hammer common routes repeatedly.
  // -------------------------------------------------------------------------
  await page.evaluate(() => { window.CM_AUTH.user = null; window.CM_AUTH.isAdmin = false; window.CM_AUTH.backendVerified = false; document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user:null,isAdmin:false,backendVerified:false}})); });
  const routes = ['#/','#/careers','#/career/investment-banking','#/learner-guide','#/credentials','#/employers','#/trust','#/about'];
  for (let i=0;i<5;i++) {
    for (const route of routes) {
      await gotoHash(page, route);
      assert(await page.locator('#app main#main').count() === 1, `Route ${route} lost the main application shell`);
      assert(await page.locator('[data-cm-track-public-overview]').count() <= 1, `Route ${route} duplicated public track overview`);
      assert(await page.locator('[data-cm-track-chooser]').count() <= 1, `Route ${route} duplicated track chooser`);
    }
  }

  // -------------------------------------------------------------------------
  // 6) Responsive overflow sweep on the surfaces most likely to glitch.
  // -------------------------------------------------------------------------
  const viewports = [
    [375,812], [430,932], [768,1024], [1440,900]
  ];
  for (const [width,height] of viewports) {
    await page.setViewportSize({width,height});
    for (const route of ['#/','#/careers','#/career/investment-banking','#/learner-guide']) {
      await gotoHash(page, route);
      await assertNoOverflow(page, `${route} @ ${width}x${height}`);
    }
  }

  const severe = [...new Set(errors)];
  assert(severe.length === 0, `Browser audit captured runtime failures:\n${severe.join('\n')}`);

  console.log('FAILURE-SEEKING BROWSER TORTURE AUDIT PASS');
} finally {
  await browser.close();
}

function locationHash(value) {
  return String(value || '');
}
