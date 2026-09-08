const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';

function authStub() {
  return `(() => {
    const user={uid:'credentials-stability-audit',email:'learner.audit@example.invalid',displayName:'Credential Audit'};
    window.CM_AUTH={
      ready:true,
      user,
      isAdmin:false,
      backendVerified:true,
      googleAvailable:false,
      getIdToken:async()=> 'credentials-stability-token',
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

const credentialPayload = {
  ok:true,
  credentials:[{
    credential_id:'CM-AUDIT-FOUNDATIONS-001',
    credential_title:'Investment Banking Foundations',
    credential_level:'foundations',
    pathway_id:'investment-banking',
    status:'active',
    issued_at:'2026-09-08T18:00:00.000Z',
    public_token:'audit-public-token'
  }],
  programCompletions:[]
};

async function installRoutes(context, counters) {
  await context.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:authStub()
  }));
  await context.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.CM_SYNC={ready:true,status:'synced',lastSyncedAt:new Date().toISOString(),error:null,flush:async()=>true};`
  }));
  // Credential-name persistence is covered by its own dedicated tests. Keeping it
  // inert here isolates route/render stability from Firestore network timing.
  await context.route(/\/certificate-name\.js(?:\?.*)?$/, route => route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.CM_CERT_NAME={get:()=> 'Credential Audit'};`
  }));
  await context.route(`${WORKER}/**`, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/credentials/me') {
      counters.credentialsRequests += 1;
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(credentialPayload)});
    }
    if (url.pathname === '/enterprise/catalog') {
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,pathways:[],credentialLadder:[],programCompletions:[]})});
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:true,isAdmin:false})});
  });
}

async function runViewport(browser, viewport) {
  const counters = { credentialsRequests:0 };
  const context = await browser.newContext({ viewport });
  await installRoutes(context, counters);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

  await page.goto(`${BASE}/#/`, {waitUntil:'domcontentloaded', timeout:30000});
  await page.waitForSelector('main#main', {timeout:15000});
  await page.waitForFunction(() => window.CM_AUTH?.ready === true, null, {timeout:10000});

  await page.evaluate(() => {
    window.__cmCredentialSyntheticHashchanges = 0;
    window.__cmCredentialHashchanges = 0;
    window.__cmCredentialAppMutations = 0;
    window.addEventListener('hashchange', event => {
      const root = String(location.hash || '').replace(/^#\/?/,'').split(/[/?]/,1)[0];
      if (root !== 'credentials') return;
      window.__cmCredentialHashchanges += 1;
      if (event.isTrusted === false) window.__cmCredentialSyntheticHashchanges += 1;
    });
    const app = document.getElementById('app');
    if (app) {
      new MutationObserver(records => {
        window.__cmCredentialAppMutations += records.reduce((sum, record) => sum + record.addedNodes.length + record.removedNodes.length, 0);
      }).observe(app, {childList:true,subtree:true});
    }
  });

  // Open the route itself rather than a particular nav presentation. At 320px
  // the desktop nav link is intentionally hidden inside the mobile menu.
  await page.evaluate(() => { location.hash = '#/credentials'; });
  await page.waitForFunction(() => location.hash === '#/credentials', null, {timeout:5000});
  await page.waitForSelector('.cm-credential-card', {timeout:15000});
  await page.waitForFunction(() => /VERIFIED CREDENTIALS/i.test(document.querySelector('main#main')?.textContent || ''), null, {timeout:15000});

  // Start the stability window only after the authoritative page has rendered.
  const baseline = await page.evaluate(() => ({
    synthetic:window.__cmCredentialSyntheticHashchanges || 0,
    hashes:window.__cmCredentialHashchanges || 0,
    mutations:window.__cmCredentialAppMutations || 0,
    y:window.scrollY
  }));

  const samples = [];
  for (let i=0; i<8; i++) {
    await page.waitForTimeout(150);
    samples.push(await page.evaluate(() => ({
      y:window.scrollY,
      synthetic:window.__cmCredentialSyntheticHashchanges || 0,
      hashes:window.__cmCredentialHashchanges || 0,
      mutations:window.__cmCredentialAppMutations || 0,
      title:document.querySelector('main#main h1')?.textContent || '',
      cards:document.querySelectorAll('.cm-credential-card').length
    })));
  }

  const final = samples.at(-1);
  assert.equal(final.synthetic, baseline.synthetic, `Credentials route generated synthetic hashchange(s) after settling at ${viewport.width}px.`);
  assert.equal(final.hashes, baseline.hashes, `Credentials route changed route after settling at ${viewport.width}px.`);
  assert.equal(final.mutations, baseline.mutations, `Credentials page rebuilt after settling at ${viewport.width}px.`);
  assert.equal(counters.credentialsRequests, 1, `Credentials endpoint was fetched ${counters.credentialsRequests} times instead of once at ${viewport.width}px.`);
  assert.equal(final.cards, 1, `Expected one authoritative credential card at ${viewport.width}px.`);
  assert.match(final.title, /Capital Mastery records/i);

  const scrollValues = [baseline.y, ...samples.map(item => item.y)];
  assert.ok(Math.max(...scrollValues) - Math.min(...scrollValues) <= 2, `Credentials scroll position bounced at ${viewport.width}px: ${scrollValues.join(', ')}`);

  const containment = await page.evaluate(() => ({
    width:innerWidth,
    doc:document.documentElement.scrollWidth,
    body:document.body.scrollWidth
  }));
  assert.ok(Math.max(containment.doc, containment.body) <= containment.width + 2, `Credentials page overflowed horizontally at ${viewport.width}px.`);
  assert.deepEqual(pageErrors, [], `Unexpected credentials page errors at ${viewport.width}px: ${pageErrors.join('\n')}`);

  await context.close();
}

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const viewport of [
      {width:320,height:700},
      {width:768,height:900},
      {width:1440,height:900}
    ]) {
      await runViewport(browser, viewport);
    }
    console.log('CREDENTIALS_ROUTE_STABILITY_BROWSER_AUDIT=PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
