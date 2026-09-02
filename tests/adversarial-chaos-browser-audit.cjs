const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const UID = 'chaos-audit-user';
const errors = [];
let workerRequestCount = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function authStub() {
  return `(() => {
    const user={uid:'${UID}',email:'chaos-audit@example.invalid',displayName:'Chaos Audit'};
    window.CM_AUTH={
      ready:true,
      user,
      isAdmin:false,
      backendVerified:true,
      getIdToken:async()=> 'chaos-audit-token',
      googleSignIn:async()=>user,
      emailSignIn:async()=>user,
      emailCreate:async()=>user,
      signOut:async()=>{},
      resetPassword:async()=>{},
      deleteAccount:async()=>{}
    };
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
  })();`;
}

async function mockWorker(route) {
  workerRequestCount += 1;
  const req = route.request();
  const url = new URL(req.url());

  // Deliberately vary latency so responses can arrive out of order while routes change.
  const delay = workerRequestCount % 3 === 0 ? 260 : workerRequestCount % 2 === 0 ? 85 : 15;
  await new Promise(resolve => setTimeout(resolve, delay));

  let payload = { ok:true };
  if (url.pathname.startsWith('/progress/')) payload = { ok:true, progress:[] };
  else if (url.pathname === '/credentials/me') payload = { ok:true, credentials:[] };
  else if (url.pathname === '/auth-check') payload = { ok:true, isAdmin:false };
  else if (url.pathname.includes('/notifications')) payload = { ok:true, notifications:[] };
  else if (url.pathname.includes('/organizations')) payload = { ok:true, organizations:[] };

  await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(payload) });
}

async function waitForMain(page, timeout = 15000) {
  await page.waitForSelector('#app main#main', { timeout });
  await page.waitForTimeout(180);
}

async function assertShell(page, label) {
  assert(await page.locator('#app').count() === 1, `${label}: #app missing or duplicated`);
  assert(await page.locator('#app main#main').count() === 1, `${label}: main shell missing or duplicated`);
  assert(await page.locator('[data-cm-track-chooser]').count() <= 1, `${label}: duplicate track chooser`);
  assert(await page.locator('[data-cm-track-status]').count() <= 1, `${label}: duplicate track status`);
  assert(await page.locator('[data-cm-track-sequence]').count() <= 1, `${label}: duplicate track sequence`);
}

async function assertNoOverflow(page, label) {
  const x = await page.evaluate(() => ({
    viewport: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  const widest = Math.max(x.html, x.body);
  assert(widest <= x.viewport + 2, `${label}: horizontal overflow ${widest}px > ${x.viewport}px`);
}

async function gotoHash(page, hash, settle = 220) {
  await page.evaluate(value => { location.hash = value; }, hash);
  await page.waitForTimeout(settle);
  await waitForMain(page);
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{ width:430, height:932 } });

  try {
    await context.addInitScript(({uid}) => {
      localStorage.setItem(`cmCredentialNameOnboardedV3:${uid}`, 'true');
      // Seed corruption once per tab. addInitScript runs again on reload, so
      // re-seeding here would destroy the valid value we are trying to verify.
      if (sessionStorage.getItem('cmChaosCorruptTrackSeededV1') !== 'true') {
        localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking', 'garbage-track-value');
        localStorage.setItem('capitalMasteryTrainingTrackV1:private-equity', '{not-json-or-track}');
        sessionStorage.setItem('cmChaosCorruptTrackSeededV1', 'true');
      }
    }, { uid:UID });

    await context.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({
      status:200,
      contentType:'application/javascript',
      body:authStub()
    }));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({
      status:200,
      contentType:'application/javascript',
      body:'window.CM_SYNC={ready:true,flush:async()=>true};'
    }));
    await context.route(`${WORKER}/**`, mockWorker);

    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('crash', () => errors.push('page crashed'));
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
      errors.push(`console.error: ${text}`);
    });
    page.on('requestfailed', request => {
      if (request.url().startsWith(BASE)) {
        errors.push(`same-origin request failed: ${request.method()} ${request.url()} :: ${request.failure()?.errorText || ''}`);
      }
    });

    await page.goto(`${BASE}/#/`, { waitUntil:'domcontentloaded', timeout:30000 });
    await waitForMain(page);

    // 1) A non-admin direct deep-link must never expose the Admin Release Lab.
    await gotoHash(page, '#/admin-preview');
    const adminText = await page.textContent('#app');
    assert(!/Capital Mastery Release Lab/i.test(adminText || ''), 'Non-admin direct deep-link exposed Admin / QA Release Lab');
    await assertShell(page, 'non-admin admin-preview deep link');

    // 2) Invalid stored track values must normalize to one valid selected program.
    await gotoHash(page, '#/career/investment-banking', 420);
    await page.waitForSelector('[data-cm-track-chooser]', { timeout:5000 });
    const normalized = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[data-cm-select-track]')];
      return {
        count: buttons.length,
        selected: buttons.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.getAttribute('data-cm-select-track'))
      };
    });
    assert(normalized.count === 2, `Invalid persisted track value damaged chooser: ${JSON.stringify(normalized)}`);
    assert(normalized.selected.length === 1, `Invalid persisted track value did not normalize to exactly one selection: ${JSON.stringify(normalized)}`);
    assert(['career-skills','professional-readiness'].includes(normalized.selected[0]), `Invalid normalized track: ${normalized.selected[0]}`);

    // 3) Keyboard operation must survive real state changes, not just look accessible.
    const cs = page.locator('[data-cm-select-track="career-skills"]');
    const pr = page.locator('[data-cm-select-track="professional-readiness"]');
    await cs.focus();
    await cs.press('Enter');
    await page.waitForTimeout(90);
    assert(await cs.getAttribute('aria-pressed') === 'true', 'Career Skills did not activate with Enter');
    await pr.focus();
    await pr.press('Space');
    await page.waitForTimeout(90);
    assert(await pr.getAttribute('aria-pressed') === 'true', 'Professional Readiness did not activate with Space');

    // 4) Per-career selection must not leak across careers.
    await page.evaluate(() => {
      window.CM_TRAINING_TRACKS.setTrack('investment-banking', 'career-skills');
      window.CM_TRAINING_TRACKS.setTrack('private-equity', 'professional-readiness');
    });
    await gotoHash(page, '#/career/investment-banking');
    assert(await page.locator('[data-cm-select-track="career-skills"]').getAttribute('aria-pressed') === 'true', 'Investment Banking track leaked or failed to persist');
    await gotoHash(page, '#/career/private-equity');
    assert(await page.locator('[data-cm-select-track="professional-readiness"]').getAttribute('aria-pressed') === 'true', 'Private Equity track leaked or failed to persist');

    // 5) Route-race torture: rapidly change routes while delayed API responses are in flight.
    const raceRoutes = [
      '#/career/investment-banking', '#/learner-guide', '#/careers', '#/career/private-equity',
      '#/credentials', '#/about', '#/career/venture-capital', '#/trust', '#/career/private-equity'
    ];
    for (let round = 0; round < 5; round++) {
      for (const route of raceRoutes) {
        await page.evaluate(value => { location.hash = value; }, route);
        await page.waitForTimeout(8);
      }
      await page.waitForTimeout(650);
      await waitForMain(page);
      const hash = await page.evaluate(() => location.hash);
      assert(hash.startsWith('#/career/private-equity'), `Route race ended on wrong hash: ${hash}`);
      const h1 = (await page.locator('h1').first().innerText().catch(() => '')) || '';
      const appText = await page.textContent('#app');
      assert(/Private Equity/i.test(`${h1}\n${appText || ''}`), `Slow/stale response overwrote final Private Equity route in round ${round}`);
      await assertShell(page, `route race round ${round}`);
    }

    // 6) Unknown and malformed deep links must fail safely rather than throwing or destroying the shell.
    const hostileHashes = [
      '#/this-route-does-not-exist',
      '#/career/not-a-real-career',
      '#/career/%ZZ',
      '#/quiz/investment-banking/999',
      '#/learn/investment-banking/999',
      '#/official-simulation/not-a-real-career',
      '#////',
      '#/%E0%A4%A'
    ];
    for (const hash of hostileHashes) {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForTimeout(320);
      await waitForMain(page);
      await assertShell(page, `hostile route ${hash}`);
    }

    // 7) Resize + route churn at the same time to provoke observer/layout races.
    const sizes = [[320,568],[375,812],[430,932],[768,1024],[1024,768],[1440,900]];
    const resizeRoutes = ['#/learner-guide','#/career/investment-banking','#/careers','#/career/private-equity'];
    for (let i = 0; i < 20; i++) {
      const [width,height] = sizes[i % sizes.length];
      await page.setViewportSize({ width, height });
      await page.evaluate(value => { location.hash = value; }, resizeRoutes[i % resizeRoutes.length]);
      await page.waitForTimeout(35);
    }
    await page.waitForTimeout(500);
    await waitForMain(page);
    await assertShell(page, 'resize-route churn settled state');
    await assertNoOverflow(page, 'resize-route churn settled state');

    // 8) Repeated track toggles + reload must preserve one coherent final selection.
    await gotoHash(page, '#/career/investment-banking');
    for (let i = 0; i < 31; i++) {
      const target = i % 2 === 0 ? 'career-skills' : 'professional-readiness';
      await page.locator(`[data-cm-select-track="${target}"]`).click();
      await page.waitForTimeout(18);
    }
    assert(await page.locator('[data-cm-select-track="career-skills"]').getAttribute('aria-pressed') === 'true', 'Rapid toggle final state was not Career Skills before reload');
    await page.reload({ waitUntil:'domcontentloaded', timeout:30000 });
    await waitForMain(page);
    await page.waitForSelector('[data-cm-track-chooser]', { timeout:5000 });
    assert(await page.locator('[data-cm-select-track="career-skills"]').getAttribute('aria-pressed') === 'true', 'Reload lost the final rapid-toggle Career Skills selection');
    await assertShell(page, 'post-reload track persistence');

    // 9) The app must settle after abuse; no perpetual MutationObserver/render loop.
    const mutationCount = await page.evaluate(() => new Promise(resolve => {
      const root = document.getElementById('app');
      let changes = 0;
      const observer = new MutationObserver(records => {
        for (const record of records) if (record.type === 'childList') changes += record.addedNodes.length + record.removedNodes.length;
      });
      observer.observe(root, { childList:true, subtree:true });
      setTimeout(() => { observer.disconnect(); resolve(changes); }, 1000);
    }));
    assert(mutationCount < 24, `App never settled after chaos sequence: ${mutationCount} child-list mutations in 1s`);

    const severe = [...new Set(errors)];
    assert(severe.length === 0, `Adversarial chaos audit captured runtime failures:\n${severe.join('\n')}`);

    console.log('ADVERSARIAL CHAOS BROWSER AUDIT PASS: hostile deep links, route races, delayed API responses, invalid persisted tracks, keyboard churn, resize churn, admin non-bypass, reload persistence and render-loop settlement');
  } finally {
    await context.close().catch(() => {});
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
