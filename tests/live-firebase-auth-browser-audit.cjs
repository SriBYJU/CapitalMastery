const { chromium, request } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'https://sribyju.github.io/CapitalMastery/';
const email = `cm.phase2.${Date.now()}-${Math.floor(Math.random()*1e9)}@example.com`;
const password = `CmPhase2!${Date.now()}Aa9`;
const fullName = 'Phase Two Audit';
let apiKey = '';
let projectId = '';
let uid = '';
let lastToken = '';
let created = false;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const api = await request.newContext();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  async function freshToken() {
    if (!created || !apiKey) return '';
    const response = await api.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      data:{ email, password, returnSecureToken:true }
    });
    if (!response.ok()) return lastToken || '';
    const data = await response.json();
    uid ||= data.localId || '';
    lastToken = data.idToken || lastToken || '';
    return lastToken;
  }

  async function deleteFirestoreDocs() {
    if (!created || !projectId || !uid) return;
    const token = await freshToken();
    if (!token) return;
    const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
    for (const url of [`${root}/progress/state`, root]) {
      const response = await api.delete(url, { headers:{Authorization:`Bearer ${token}`} });
      if (![200,404].includes(response.status())) {
        throw new Error(`Firestore cleanup failed (${response.status()}) for ${url}: ${(await response.text()).slice(0,500)}`);
      }
    }
  }

  async function deleteIdentity() {
    if (!created || !apiKey) return;
    const token = await freshToken();
    if (!token) return;
    const response = await api.post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`, {
      data:{idToken:token}
    });
    if (!response.ok()) throw new Error(`Firebase identity cleanup failed (${response.status()}): ${(await response.text()).slice(0,500)}`);
    created = false;
    lastToken = '';
  }

  async function authFormsReady() {
    await page.locator('#cm-create-form input[name="email"]').waitFor({state:'visible',timeout:10000});
    await page.locator('#cm-signin-form input[name="email"]').waitFor({state:'visible',timeout:10000});
  }

  async function postSaveFailureSnapshot() {
    return page.evaluate(() => {
      let local = null;
      try { local = JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1') || 'null'); } catch (_) {}
      const error = document.querySelector('#cm-full-name-onboarding .cm-full-name-message.bad');
      return {
        href:location.href,
        authReady:window.CM_AUTH?.ready,
        email:window.CM_AUTH?.user?.email || '',
        displayName:window.CM_AUTH?.user?.displayName || '',
        confirmed:window.CM_CERT_NAME?.confirmed?.() === true,
        syncReady:window.CM_SYNC?.ready,
        syncStatus:window.CM_SYNC?.status || '',
        syncError:window.CM_SYNC?.error || '',
        modalError:error && !error.hidden ? error.textContent.trim() : '',
        modalPresent:!!document.getElementById('cm-full-name-onboarding'),
        localProfile:local?.profile || null
      };
    }).catch(error => ({snapshotError:String(error?.message || error)}));
  }

  try {
    // Real Firebase Auth + Firestore; D1 is intentionally neutral here because
    // Worker auth/data boundaries have separate release tests.
    await page.route('**/auth-check', route => route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({ok:true,uid:'firebase-live-audit',isAdmin:false})
    }));

    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`, {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(() => window.CM_AUTH?.ready === true, null, {timeout:30000});
    const config = await page.evaluate(() => window.CAPITAL_MASTERY_FIREBASE_CONFIG || null);
    apiKey = config?.apiKey || '';
    projectId = config?.projectId || '';
    assert(apiKey && projectId, 'Live page is missing Firebase web configuration');
    await authFormsReady();
    assert(await page.locator('#cm-create-form input[name="name"]').count() === 0, 'Signup reverted to obsolete inline Name field');

    await page.locator('#cm-create-form input[name="email"]').fill(email);
    await page.locator('#cm-create-form input[name="password"]').fill(password);
    await page.locator('#cm-create-form button[type="submit"]').click();
    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, {timeout:30000});
    created = true;
    ({uid,lastToken} = await page.evaluate(async () => ({uid:window.CM_AUTH.user.uid,lastToken:await window.CM_AUTH.getIdToken()})));

    await page.locator('#cm-full-name-onboarding').waitFor({state:'visible',timeout:20000});
    await page.locator('#cm-full-name-input').fill(fullName);
    const postSaveReload = page.waitForEvent('domcontentloaded', {timeout:30000});
    await page.locator('#cm-full-name-form button[type="submit"]').click();
    try {
      await postSaveReload;
      await page.waitForFunction(([expectedEmail,expectedName]) =>
        window.CM_AUTH?.ready === true &&
        window.CM_AUTH?.user?.email === expectedEmail &&
        window.CM_AUTH?.user?.displayName === expectedName &&
        window.CM_CERT_NAME?.confirmed?.() === true,
        [email,fullName], {timeout:30000});
    } catch (error) {
      const snapshot = await postSaveFailureSnapshot();
      throw new Error(`Credential-name save did not complete its intentional reload contract. SNAPSHOT=${JSON.stringify(snapshot)} PAGE_ERRORS=${JSON.stringify(pageErrors)} CONSOLE_ERRORS=${JSON.stringify(consoleErrors.slice(-12))} CAUSE=${error.message}`);
    }

    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());
    const afterSave = await page.evaluate(() => ({
      name:window.CM_AUTH.user?.displayName || '',
      confirmed:window.CM_CERT_NAME?.confirmed?.() === true,
      body:document.body.innerText
    }));
    assert(afterSave.name === fullName && afterSave.confirmed, 'Credential name was not stable after the intentional post-save reload');
    assert(!/[âÃÂ�]/u.test(afterSave.body), 'Mojibake rendered in live account/name UI');

    // Fresh-device simulation: sign out, erase all browser-only account/name state,
    // reload signed out, then sign in. Firestore must restore the credential name
    // without presenting the one-time onboarding again.
    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`, {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, {timeout:30000});
    await page.locator('[data-cm-auth-action="signout"]').click();
    await page.waitForFunction(() => window.CM_AUTH?.user === null, null, {timeout:15000});
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cmCredentialNameOnboardedV3:') ||
            key.startsWith('capitalMasteryUserStateV1:') ||
            key === 'capitalMasteryLocalStateV1' ||
            key === 'capitalMasteryActiveUidV1') localStorage.removeItem(key);
      }
      sessionStorage.clear();
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(() => window.CM_AUTH?.ready === true && window.CM_AUTH?.user === null, null, {timeout:30000});
    await authFormsReady();

    await page.locator('#cm-signin-form input[name="email"]').fill(email);
    await page.locator('#cm-signin-form input[name="password"]').fill(password);
    await page.locator('#cm-signin-form button[type="submit"]').click();
    await page.waitForFunction(expected => window.CM_AUTH?.user?.email === expected, email, {timeout:30000});
    await page.waitForFunction(async expected => {
      if (window.CM_AUTH?.user?.displayName !== expected) return false;
      return window.CM_CERT_NAME?.check ? await window.CM_CERT_NAME.check() : false;
    }, fullName, {timeout:30000});
    await page.waitForTimeout(750);
    const recovered = await page.evaluate(() => ({
      name:window.CM_AUTH?.user?.displayName || '',
      confirmed:window.CM_CERT_NAME?.confirmed?.() === true,
      storedName:window.CM_CERT_NAME?.get?.() || '',
      modalPresent:!!document.getElementById('cm-full-name-onboarding'),
      body:document.body.innerText
    }));
    assert(recovered.name === fullName, 'Firebase displayName disappeared after fresh-state sign-in');
    assert(recovered.confirmed, 'Remote credential-name confirmation was not restored after local state was erased');
    assert(recovered.storedName === fullName, `Recovered credential name mismatch: ${recovered.storedName}`);
    assert(!recovered.modalPresent, 'One-time full-name onboarding repeated despite remote confirmation');
    assert(!/[âÃÂ�]/u.test(recovered.body), 'Mojibake rendered after fresh-state sign-in');
    lastToken = await page.evaluate(() => window.CM_AUTH.getIdToken());

    await deleteFirestoreDocs();
    await deleteIdentity();
    console.log('LIVE FIREBASE AUTH BROWSER AUDIT PASS: real create -> one-time full-name save -> intentional reload -> fresh-state Firestore recovery -> REST cleanup');
  } finally {
    try {
      if (created) {
        await deleteFirestoreDocs();
        await deleteIdentity();
      }
    } catch (error) {
      console.error('Disposable Firebase cleanup error:', error);
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
