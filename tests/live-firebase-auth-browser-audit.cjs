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

  async function deleteFirestoreTestDocs() {
    if (!created) return;
    await page.evaluate(async () => {
      const user = window.CM_AUTH?.user;
      if (!user) return;
      const SDK = '12.18.0';
      const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
      const fsApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`);
      const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
      const db = fsApi.getFirestore(app);
      await fsApi.deleteDoc(fsApi.doc(db, 'users', user.uid, 'progress', 'state'));
      await fsApi.deleteDoc(fsApi.doc(db, 'users', user.uid));
    });
  }

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

  async function requireAuthForms() {
    try {
      await page.locator('#cm-create-form input[name="email"]').waitFor({ state:'visible', timeout:7000 });
      await page.locator('#cm-signin-form input[name="email"]').waitFor({ state:'visible', timeout:7000 });
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
    await requireAuthForms();

    // Runtime intentionally removes the early inline Name field. Account creation
    // is email/password first, followed by a required one-time credential-name modal.
    assert(await page.locator('#cm-create-form input[name="name"]').count() === 0, 'Signup unexpectedly reverted to the obsolete inline Name field');
    await page.locator('#cm-create-form input[name="email"]').fill(email);
    await page.locator('#cm-create-form input[name="password"]').fill(password);
    await page.locator('#cm-create-form button[type="submit"]').click();

    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, { timeout: 30000 });
    created = true;
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    await page.locator('#cm-full-name-onboarding').waitFor({ state:'visible', timeout:20000 });
    await page.locator('#cm-full-name-input').fill(fullName);
    await page.locator('#cm-full-name-form button[type="submit"]').click();
    await page.waitForFunction(expected => window.CM_AUTH?.user?.displayName === expected, fullName, { timeout:30000 });
    await page.waitForFunction(() => window.CM_CERT_NAME?.confirmed?.() === true, null, { timeout:30000 });
    await page.locator('#cm-full-name-onboarding').waitFor({ state:'detached', timeout:30000 });
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    const createdState = await page.evaluate(() => ({
      email: window.CM_AUTH.user?.email || '',
      name: window.CM_AUTH.user?.displayName || '',
      confirmed: window.CM_CERT_NAME?.confirmed?.() === true,
      body: document.body.innerText
    }));
    assert(createdState.name === fullName, `One-time full-name onboarding did not persist to Firebase profile: ${createdState.name}`);
    assert(createdState.confirmed, 'Credential-name onboarding did not mark the account confirmed');
    assert(!/[âÃÂ�]/u.test(createdState.body), 'Mojibake rendered in live Firebase account/name UI');

    // Return to the account page, sign out, and remove all local onboarding/profile
    // state. This simulates a fresh device so the next login must recover the name
    // from Firebase/Firestore rather than a browser-only marker.
    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForFunction(() => window.CM_AUTH?.user?.email === email, null, { timeout:30000 });
    await page.locator('[data-cm-auth-action="signout"]').click();
    await page.waitForFunction(() => window.CM_AUTH?.user === null, null, { timeout:15000 });
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cmCredentialNameOnboardedV3:') ||
            key.startsWith('capitalMasteryUserStateV1:') ||
            key === 'capitalMasteryLocalStateV1' ||
            key === 'capitalMasteryActiveUidV1') localStorage.removeItem(key);
      }
      sessionStorage.clear();
    });
    await page.reload({ waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForFunction(() => window.CM_AUTH?.ready === true && window.CM_AUTH?.user === null, null, { timeout:30000 });
    await requireAuthForms();

    await page.locator('#cm-signin-form input[name="email"]').fill(email);
    await page.locator('#cm-signin-form input[name="password"]').fill(password);
    await page.locator('#cm-signin-form button[type="submit"]').click();
    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, { timeout:30000 });
    await page.waitForFunction(async expected => {
      if (window.CM_AUTH?.user?.displayName !== expected) return false;
      return window.CM_CERT_NAME?.check ? await window.CM_CERT_NAME.check() : false;
    }, fullName, { timeout:30000 });
    await page.waitForTimeout(500);

    const signedBackIn = await page.evaluate(() => ({
      name: window.CM_AUTH.user?.displayName || '',
      confirmed: window.CM_CERT_NAME?.confirmed?.() === true,
      onboardingModalPresent: !!document.getElementById('cm-full-name-onboarding'),
      storedName: window.CM_CERT_NAME?.get?.() || '',
      body: document.body.innerText
    }));
    assert(signedBackIn.name === fullName, 'Firebase display name disappeared after fresh-state sign-in');
    assert(signedBackIn.confirmed, 'Remote credential-name confirmation was not restored after clearing local state');
    assert(!signedBackIn.onboardingModalPresent, 'One-time full-name onboarding incorrectly repeated after remote persistence');
    assert(signedBackIn.storedName === fullName, `Recovered credential name mismatch: ${signedBackIn.storedName}`);
    assert(!/[âÃÂ�]/u.test(signedBackIn.body), 'Mojibake rendered after fresh-state sign-in');
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    await deleteFirestoreTestDocs();
    await cleanupIdentity();
    created = false;
    lastToken = '';
    console.log('LIVE FIREBASE AUTH BROWSER AUDIT PASS: real email/password create -> required one-time full-name onboarding -> remote fresh-state recovery -> Firebase/Firestore cleanup');
  } finally {
    try {
      if (created) {
        try { await deleteFirestoreTestDocs(); } catch (error) { console.error('Firestore cleanup error:', error); process.exitCode = 1; }
      }
      if (created || lastToken) await cleanupIdentity();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
    await api.dispose();
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
