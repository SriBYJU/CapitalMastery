const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';

function assert(condition, message) { if (!condition) throw new Error(message); }
function authStub(isAdmin) {
  return `(() => { const user={uid:'platform-admin-browser-audit',email:'${isAdmin ? 'awsomecoolsri2@gmail.com' : 'avadhanula.shriyan@gmail.com'}',displayName:'Audit User'}; window.CM_AUTH={ready:true,user,isAdmin:${isAdmin},backendVerified:true,getIdToken:async()=> 'platform-admin-browser-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}}; setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:${isAdmin},backendVerified:true}})),0); })();`;
}
const usagePayload = {
  ok:true, scope:'platform-aggregate', demoOrganizationsExcluded:true,
  totals:{realEmployers:2,staff:3,learners:7,cohorts:3,assignments:5,publishedAssignments:3},
  organizations:[
    {id:'org_test',name:'Test',status:'active',createdAt:'2026-09-08 12:00:00',staffCount:2,learnerCount:3,cohortCount:1,assignmentCount:2,publishedAssignmentCount:1,lastActivity:'2026-09-08 13:00:00'},
    {id:'org_example',name:'Example Partners',status:'active',createdAt:'2026-09-07 12:00:00',staffCount:1,learnerCount:4,cohortCount:2,assignmentCount:3,publishedAssignmentCount:2,lastActivity:'2026-09-08 12:30:00'}
  ]
};

async function installCommonRoutes(context, isAdmin) {
  await context.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({status:200,contentType:'application/javascript',body:authStub(isAdmin)}));
  await context.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
  await context.route(`${WORKER}/**`, async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/enterprise/admin/organizations') return route.fulfill({status:isAdmin?200:403,contentType:'application/json',body:JSON.stringify(isAdmin?usagePayload:{ok:false,error:'Platform administrator access required'})});
    if (path === '/enterprise/catalog') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,pathways:[],credentialLadder:[]})});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:true,isAdmin})});
  });
}

async function contained(page, label) {
  const m = await page.evaluate(() => ({inner:innerWidth, doc:document.documentElement.scrollWidth, body:document.body.scrollWidth}));
  assert(Math.max(m.doc,m.body) <= m.inner + 2, `${label}: horizontal body overflow ${Math.max(m.doc,m.body)} > ${m.inner}`);
}

async function waitForUsage(page, width) {
  try {
    await page.waitForSelector('.cm-founder-metric-grid',{timeout:15000});
  } catch (error) {
    const state = await page.evaluate(() => ({
      hash: location.hash,
      auth: window.CM_AUTH ? {ready:window.CM_AUTH.ready,isAdmin:window.CM_AUTH.isAdmin,backendVerified:window.CM_AUTH.backendVerified,user:window.CM_AUTH.user?.email || null} : null,
      reliability: window.CM_RELIABILITY?.issues || [],
      appText: (document.getElementById('app')?.textContent || '').replace(/\s+/g,' ').trim().slice(0,2000),
      founderPage: !!document.querySelector('.cm-founder-admin-page'),
      loading: !!document.querySelector('.cm-founder-admin-loading'),
      denied: !!document.querySelector('.cm-founder-admin-denied')
    }));
    console.error(`EMPLOYER_USAGE_DEBUG @ ${width}: ${JSON.stringify(state)}`);
    throw error;
  }
}

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const publicContext = await browser.newContext({viewport:{width:375,height:812}});
    await installCommonRoutes(publicContext, false);
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`${BASE}/#/`, {waitUntil:'domcontentloaded',timeout:30000});
    await publicPage.waitForSelector('[data-cm-official-platform-proof="home"]',{timeout:15000});
    let proof = await publicPage.textContent('[data-cm-official-platform-proof="home"]');
    assert(/Capital Mastery is the official onboarding training platform for Sterling Point Advisors\./.test(proof||''),'Home official-onboarding statement missing');
    assert(await publicPage.locator('[data-cm-official-platform-proof="home"] img[alt="Sterling Point Advisors"]').count()===1,'Home Sterling Point logo missing');
    await contained(publicPage,'home proof mobile');

    await publicPage.goto(`${BASE}/#/employers`, {waitUntil:'domcontentloaded',timeout:30000});
    await publicPage.waitForSelector('[data-cm-official-platform-proof="employers"]',{timeout:15000});
    proof = await publicPage.textContent('[data-cm-official-platform-proof="employers"]');
    assert(/official onboarding training platform for Sterling Point Advisors/i.test(proof||''),'Employer official-onboarding statement missing');
    await contained(publicPage,'employer proof mobile');
    await publicContext.close();

    for (const viewport of [{width:320,height:700},{width:768,height:900},{width:1440,height:900}]) {
      const context = await browser.newContext({viewport});
      await installCommonRoutes(context, true);
      const page = await context.newPage();
      const browserErrors = [];
      page.on('pageerror', error => browserErrors.push(String(error?.stack || error)));
      page.on('console', msg => { if (['error','warning','warn'].includes(msg.type())) browserErrors.push(`${msg.type()}: ${msg.text()}`); });
      await page.goto(`${BASE}/#/admin-preview`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('[data-cm-employer-usage-card]',{timeout:15000});
      assert(/Employer Usage/.test(await page.textContent('[data-cm-employer-usage-card]')||''),`Admin card missing @ ${viewport.width}`);
      await page.locator('[data-cm-employer-usage-card] a').click();
      try { await waitForUsage(page, viewport.width); }
      catch (error) { if (browserErrors.length) console.error(`EMPLOYER_USAGE_BROWSER_ERRORS @ ${viewport.width}: ${browserErrors.join(' | ')}`); throw error; }
      const text = await page.textContent('#app');
      assert(/Real Employers/.test(text||'') && /Total Learners/.test(text||'') && /Total Cohorts/.test(text||'') && /Total Assignments/.test(text||''),`Summary cards missing @ ${viewport.width}`);
      assert(/Test/.test(text||'') && /Example Partners/.test(text||''),`Aggregate organization rows missing @ ${viewport.width}`);
      assert(!/demo_org_/i.test(text||''),`Demo org leaked into aggregate UI @ ${viewport.width}`);
      assert(!/learner@example|answers_json|response_json/i.test(text||''),`Private learner detail leaked @ ${viewport.width}`);
      const metrics = await page.locator('.cm-founder-metric strong').allTextContents();
      assert(metrics.map(x=>x.trim()).join(',') === '2,7,3,5',`Wrong dashboard totals @ ${viewport.width}: ${metrics}`);
      const table = await page.locator('.cm-founder-table-wrap').count();
      assert(table===1,`Scrollable usage table missing @ ${viewport.width}`);
      await contained(page,`admin usage @ ${viewport.width}`);
      await context.close();
    }

    const deniedContext = await browser.newContext({viewport:{width:430,height:932}});
    await installCommonRoutes(deniedContext, false);
    const deniedPage = await deniedContext.newPage();
    await deniedPage.goto(`${BASE}/#/admin-preview/employer-usage`,{waitUntil:'domcontentloaded',timeout:30000});
    await deniedPage.waitForTimeout(350);
    const deniedState = await deniedPage.evaluate(() => ({hash:location.hash,text:document.getElementById('app')?.textContent||''}));
    assert(!deniedState.hash.startsWith('#/admin-preview'),`Non-admin stayed on protected employer usage hash: ${deniedState.hash}`);
    assert(!/Real Employers|Real employer workspaces/.test(deniedState.text),'Non-admin saw employer usage dashboard content');
    await deniedContext.close();

    console.log('PLATFORM_ADMIN_EMPLOYER_USAGE_BROWSER_AUDIT=PASS');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
