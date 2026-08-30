const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const UID = 'admin-boundary-audit-user';
const FORBIDDEN = /Capital Mastery Release Lab|CURRENT LOCAL STATE|Boundary Tests|QA Preview Mode|Enterprise Demo\/Test Lab|Simulation Lab/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function authStub() {
  return `(() => {
    const user={uid:'${UID}',email:'admin-boundary@example.invalid',displayName:'Boundary Audit'};
    window.CM_AUTH={
      ready:true,
      user,
      isAdmin:false,
      backendVerified:true,
      getIdToken:async()=> 'admin-boundary-token',
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

(async () => {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{ width:430, height:932 } });

  try {
    await context.addInitScript(({uid}) => {
      localStorage.setItem(`cmCredentialNameOnboardedV3:${uid}`, 'true');
      localStorage.setItem('capitalMasteryQaPreviewV1', 'true');
      window.__cmAdminExposure = [];
      const forbidden = /Capital Mastery Release Lab|CURRENT LOCAL STATE|Boundary Tests|QA Preview Mode|Enterprise Demo\/Test Lab|Simulation Lab/i;
      const scan = node => {
        const text = node && typeof node.textContent === 'string' ? node.textContent : '';
        if (forbidden.test(text)) window.__cmAdminExposure.push(text.slice(0, 180));
      };
      new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes || []) scan(node);
          if (record.type === 'characterData') scan(record.target);
        }
      }).observe(document, { childList:true, subtree:true, characterData:true });
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

    const page = await context.newPage();

    // Initial hostile deep link: the pre-router gate must replace the hash before
    // app.js can ever create privileged Admin / QA markup.
    await page.goto(`${BASE}/#/admin-preview`, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForSelector('#app main#main', { timeout:15000 });
    await page.waitForTimeout(250);

    let state = await page.evaluate(() => ({
      hash: location.hash,
      text: document.getElementById('app')?.textContent || '',
      exposure: [...(window.__cmAdminExposure || [])],
      pending: sessionStorage.getItem('capitalMasteryPendingAdminRouteV1'),
      guard: !!window.CM_ADMIN_ROUTE_GUARD
    }));
    assert(state.guard, 'Pre-router admin security gate was not loaded');
    assert(!state.hash.startsWith('#/admin-preview'), `Verified non-admin remained on privileged hash: ${state.hash}`);
    assert(!FORBIDDEN.test(state.text), 'Verified non-admin received privileged Admin / QA DOM');
    assert(state.exposure.length === 0, `Privileged Admin / QA markup appeared transiently: ${JSON.stringify(state.exposure)}`);
    assert(state.pending === null, 'Verified non-admin retained a stale pending admin destination');

    // Repeated forged hash navigation + forged local QA mode must still produce
    // zero transient exposure, not merely an eventual access-denied repaint.
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => { location.hash = '#/admin-preview'; });
      await page.waitForTimeout(8);
    }
    await page.waitForTimeout(250);
    state = await page.evaluate(() => ({
      hash: location.hash,
      text: document.getElementById('app')?.textContent || '',
      exposure: [...(window.__cmAdminExposure || [])],
      pending: sessionStorage.getItem('capitalMasteryPendingAdminRouteV1')
    }));
    assert(!state.hash.startsWith('#/admin-preview'), `Repeated forged hashes escaped the admin route gate: ${state.hash}`);
    assert(!FORBIDDEN.test(state.text), 'Repeated forged hashes rendered privileged Admin / QA DOM');
    assert(state.exposure.length === 0, `Repeated forged hashes caused transient privileged DOM exposure: ${JSON.stringify(state.exposure)}`);
    assert(state.pending === null, 'Repeated denied attempts retained a privileged destination');

    // A client that merely looks admin but lacks completed backend verification is
    // still untrusted. This guards against role-state races during auth startup.
    await page.evaluate(() => {
      window.CM_AUTH.isAdmin = true;
      window.CM_AUTH.backendVerified = false;
      location.hash = '#/admin-preview';
    });
    await page.waitForTimeout(250);
    state = await page.evaluate(() => ({
      hash: location.hash,
      text: document.getElementById('app')?.textContent || '',
      exposure: [...(window.__cmAdminExposure || [])]
    }));
    assert(!state.hash.startsWith('#/admin-preview'), 'Unverified admin-looking client state bypassed the route gate');
    assert(!FORBIDDEN.test(state.text), 'Unverified admin-looking state rendered privileged Admin / QA DOM');
    assert(state.exposure.length === 0, `Unverified admin-looking state caused transient privileged DOM exposure: ${JSON.stringify(state.exposure)}`);

    console.log('ADMIN ROUTE ZERO-EXPOSURE BROWSER AUDIT PASS: direct, repeated and auth-race admin deep links never render privileged QA DOM for unverified/non-admin clients');
  } finally {
    await context.close().catch(() => {});
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
