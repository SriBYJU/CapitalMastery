const { chromium } = require('playwright');

const BASE = process.env.CM_CANONICAL_URL || 'https://capitalmastery.pages.dev/';

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
    throw new Error(`Google sign-in popup did not open on canonical host; Firebase outcome ${outcome.code || '(none)'}: ${outcome.message || '(no message)'}`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
