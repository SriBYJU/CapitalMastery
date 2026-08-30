const { chromium, request } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'https://sribyju.github.io/CapitalMastery/';
const runTag = `${Date.now()}-${Math.floor(Math.random()*1e9)}`;
const email = `cm.phase2.${runTag}@example.com`;
const password = `CmPhase2!${Date.now()}Aa9`;
const fullName = 'Phase Two Audit';
let apiKey = '';
let lastToken = '';
let created = false;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const api = await request.newContext();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  async function cleanupIdentity() {
    if (!apiKey) return;
    let token = lastToken;
    if (!token && created) {
      const signIn = await api.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
        data: { email, password, returnSecureToken: true }
      });
      if (signIn.ok()) token = (await signIn.json()).idToken || '';
    }
    if (!token) return;
    const deleted = await api.post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`, {
      data: { idToken: token }
    });
    if (!deleted.ok()) {
      const body = await deleted.text();
      throw new Error(`Firebase cleanup failed (${deleted.status()}): ${body.slice(0,500)}`);
    }
  }

  async function requireCreateForm() {
    try {
      await page.locator('#cm-create-form input[name="name"]').waitFor({ state:'visible', timeout:5000 });
    } catch (error) {
      const snapshot = await page.evaluate(() => {
        const main = document.querySelector('main#main');
        return {
          hash: location.hash,
          authReady: window.CM_AUTH?.ready,
          authUser: window.CM_AUTH?.user ? { uid:window.CM_AUTH.user.uid, email:window.CM_AUTH.user.email } : null,
          backendVerified: window.CM_AUTH?.backendVerified,
          mainAuthView: main?.dataset?.cmAuthView || '',
          mainText: (main?.innerText || '').slice(0,1600),
          mainHtml: (main?.innerHTML || '').slice(0,2600),
          createForms: document.querySelectorAll('#cm-create-form').length,
          signinForms: document.querySelectorAll('#cm-signin-form').length
        };
      });
      throw new Error(`Firebase account renderer did not own #/login after auth ready. SNAPSHOT=${JSON.stringify(snapshot)} PAGE_ERRORS=${JSON.stringify(pageErrors)} CONSOLE_ERRORS=${JSON.stringify(consoleErrors.slice(-12))}`);
    }
  }

  try {
    // Keep this audit Firebase-real but D1-neutral. Worker auth verification is covered separately.
    await page.route('**/auth-check', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, uid: 'firebase-live-audit', isAdmin: false })
      });
    });

    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.CM_AUTH?.ready === true, null, { timeout: 30000 });
    apiKey = await page.evaluate(() => window.CAPITAL_MASTERY_FIREBASE_CONFIG?.apiKey || '');
    assert(apiKey, 'Live page did not expose expected Firebase web config');
    await requireCreateForm();

    await page.locator('#cm-create-form input[name="name"]').fill(fullName);
    await page.locator('#cm-create-form input[name="email"]').fill(email);
    await page.locator('#cm-create-form input[name="password"]').fill(password);
    await page.locator('#cm-create-form button[type="submit"]').click();

    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, { timeout: 30000 });
    created = true;
    await page.waitForFunction(() => window.CM_AUTH?.backendVerified === true, null, { timeout: 15000 });
    const createdState = await page.evaluate(() => ({
      email: window.CM_AUTH.user?.email || '',
      name: window.CM_AUTH.user?.displayName || '',
      backendVerified: window.CM_AUTH.backendVerified,
      body: document.body.innerText
    }));
    assert(createdState.name === fullName, `Full-name onboarding did not persist: ${createdState.name}`);
    assert(createdState.backendVerified === true, 'Post-create account state did not reach verified UI state');
    assert(!/[âÃÂ�]/u.test(createdState.body), 'Mojibake rendered in live Firebase account UI');
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    await page.locator('[data-cm-auth-action="signout"]').click();
    await page.waitForFunction(() => window.CM_AUTH?.user === null, null, { timeout: 15000 });
    await requireCreateForm();
    await page.locator('#cm-signin-form input[name="email"]').fill(email);
    await page.locator('#cm-signin-form input[name="password"]').fill(password);
    await page.locator('#cm-signin-form button[type="submit"]').click();
    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, { timeout: 30000 });
    await page.waitForFunction(() => window.CM_AUTH?.backendVerified === true, null, { timeout: 15000 });
    const signedBackIn = await page.evaluate(() => ({
      name: window.CM_AUTH.user?.displayName || '',
      backendVerified: window.CM_AUTH.backendVerified,
      body: document.body.innerText
    }));
    assert(signedBackIn.name === fullName, 'Full name disappeared after sign-out/sign-in');
    assert(signedBackIn.backendVerified === true, 'Signed-back-in account did not reach verified UI state');
    assert(!/[âÃÂ�]/u.test(signedBackIn.body), 'Mojibake rendered after sign-out/sign-in');
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    await cleanupIdentity();
    created = false;
    lastToken = '';
    console.log('LIVE FIREBASE AUTH BROWSER AUDIT PASS: real create/full-name/sign-out/sign-in + guaranteed Firebase identity cleanup');
  } finally {
    try { if (created || lastToken) await cleanupIdentity(); } catch (error) { console.error(error); process.exitCode = 1; }
    await api.dispose();
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
