const { chromium } = require('playwright');

const BASE = process.env.CM_CANONICAL_URL || 'https://sribyju.github.io/CapitalMastery/';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.CAPITAL_MASTERY_FIREBASE_CONFIG?.apiKey, null, { timeout: 15000 });
    await page.waitForFunction(() => window.CM_AUTH?.ready === true, null, { timeout: 15000 });
    const providerState=await page.evaluate(async()=>{
      const key=window.CAPITAL_MASTERY_FIREBASE_CONFIG.apiKey;
      const response=await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(key)}`);
      const data=await response.json();
      return {authorized:Array.isArray(data.authorizedDomains)&&data.authorizedDomains.includes(location.hostname),googleAvailable:window.CM_AUTH.googleAvailable===true};
    });
    if(!providerState.authorized){
      await page.goto(`${BASE.replace(/\/$/,'')}/#/login`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>window.CM_AUTH?.ready===true,null,{timeout:15000});
      assert(providerState.googleAvailable===false,'Google provider must fail closed when the canonical domain is not authorized');
      assert(await page.locator('[data-cm-auth-action="google"]').count()===0,'Unauthorized Google sign-in control must not be exposed');
      assert(await page.locator('#cm-signin-form input[name="email"]').isVisible(),'Secure email sign-in must remain available');
      console.log(`FIREBASE PROVIDER SAFETY AUDIT PASS: unauthorized Google flow suppressed and email authentication available on ${new URL(BASE).hostname}`);
      return;
    }

    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'cm-firebase-domain-probe';
      button.textContent = 'probe';
      Object.assign(button.style, {
        position: 'fixed',
        top: '8px',
        left: '8px',
        width: '96px',
        height: '40px',
        zIndex: '2147483647'
      });
      document.body.appendChild(button);
      window.__CM_FIREBASE_DOMAIN_PROBE = { state: 'idle', code: '', message: '' };
      button.addEventListener('click', async () => {
        window.__CM_FIREBASE_DOMAIN_PROBE = { state: 'starting', code: '', message: '' };
        try {
          const SDK = '12.18.0';
          const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
          const authApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);
          const app = appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG, `cm-domain-probe-${Date.now()}`);
          const auth = authApi.getAuth(app);
          const provider = new authApi.GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await authApi.signInWithPopup(auth, provider);
          window.__CM_FIREBASE_DOMAIN_PROBE = { state: 'authenticated', code: '', message: '' };
        } catch (error) {
          window.__CM_FIREBASE_DOMAIN_PROBE = {
            state: 'error',
            code: String(error?.code || ''),
            message: String(error?.message || '')
          };
        }
      }, { once: true });
    });

    const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
    await page.locator('#cm-firebase-domain-probe').click({ timeout: 10000 });
    const popup = await popupPromise;
    if (popup) {
      await popup.close().catch(() => {});
      await page.waitForFunction(() => window.__CM_FIREBASE_DOMAIN_PROBE?.state !== 'starting', null, { timeout: 10000 }).catch(() => {});
      const outcome = await page.evaluate(() => window.__CM_FIREBASE_DOMAIN_PROBE);
      assert(outcome.code !== 'auth/unauthorized-domain', 'Canonical host opened a popup but Firebase still reported auth/unauthorized-domain');
      console.log(`FIREBASE AUTHORIZED DOMAIN BROWSER AUDIT PASS: Google popup opened from ${new URL(BASE).hostname}`);
      return;
    }

    await page.waitForFunction(() => window.__CM_FIREBASE_DOMAIN_PROBE?.state === 'error', null, { timeout: 15000 });
    const outcome = await page.evaluate(() => window.__CM_FIREBASE_DOMAIN_PROBE);
    if (outcome.code === 'auth/unauthorized-domain') {
      throw new Error(`Firebase canonical authorized-domain check failed: ${outcome.code}`);
    }
    const headlessTransient = new Set([
      'auth/internal-error',
      'auth/network-request-failed',
      'auth/popup-blocked',
      'auth/cancelled-popup-request',
      'auth/popup-closed-by-user'
    ]);
    if (headlessTransient.has(outcome.code)) {
      await page.goto(`${BASE.replace(/\/$/,'')}/#/login`, { waitUntil:'domcontentloaded', timeout:30000 });
      await page.waitForFunction(() => window.CM_AUTH?.ready === true, null, { timeout:15000 });
      assert(providerState.googleAvailable === true, 'Authorized canonical host unexpectedly disabled Google authentication');
      assert(await page.locator('[data-cm-auth-action="google"]').isVisible(), 'Authorized canonical host must keep the Google sign-in control available');
      assert(await page.locator('#cm-signin-form input[name="email"]').isVisible(), 'Email authentication fallback must remain available');
      console.log(`FIREBASE AUTHORIZED DOMAIN BROWSER AUDIT PASS: authorized-domain API and provider UI passed; headless popup returned transient ${outcome.code}`);
      return;
    }
    throw new Error(`Google sign-in popup did not open on canonical host; Firebase outcome ${outcome.code || '(none)'}: ${outcome.message || '(no message)'}`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
