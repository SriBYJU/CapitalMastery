import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = (process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const QA_KEY = 'capitalMasteryQaPreviewV1';
const STATE_KEY = 'capitalMasteryLocalStateV1';
const QA_STATE_KEY = 'capitalMasteryQaStateV2';
const errors = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForApp(page) {
  await page.waitForSelector('#app main#main', { timeout:15000 });
  await page.waitForTimeout(180);
}

async function gotoHash(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(260);
  await waitForApp(page);
}

function attachErrorCapture(page, label) {
  page.on('pageerror', error => errors.push(`${label} pageerror: ${error.message}`));
  page.on('requestfailed', request => {
    if (request.url().startsWith(BASE)) {
      errors.push(`${label} same-origin request failed: ${request.method()} ${request.url()} :: ${request.failure()?.errorText || ''}`);
    }
  });
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text=msg.text();
    if (/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
    errors.push(`${label} console.error: ${text}`);
  });
}

function authStub({ signedIn, admin, uid }) {
  const user=signedIn ? `{uid:${JSON.stringify(uid)},email:'audit@example.invalid',displayName:'Browser Audit',metadata:{creationTime:'2026-08-01T00:00:00.000Z',lastSignInTime:'2026-08-29T00:00:00.000Z'}}` : 'null';
  return `(() => {
    const user=${user};
    window.CM_AUTH={
      ready:true,
      user,
      isAdmin:${admin ? 'true' : 'false'},
      backendVerified:true,
      getIdToken:async()=>user?'browser-audit-token':null,
      googleSignIn:async()=>user,
      emailSignIn:async()=>user,
      emailCreate:async()=>user,
      signOut:async()=>{},
      resetPassword:async()=>{},
      deleteAccount:async()=>{}
    };
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:${admin ? 'true' : 'false'},backendVerified:true}})),0);
  })();`;
}

async function mockWorker(route) {
  const req=route.request();
  const url=new URL(req.url());
  let payload={ok:true};
  if(url.pathname.startsWith('/progress/')) payload={ok:true,progress:[]};
  else if(url.pathname==='/credentials/me') payload={ok:true,credentials:[]};
  else if(url.pathname==='/auth-check') payload={ok:true,isAdmin:false};
  else if(url.pathname.includes('/notifications')) payload={ok:true,notifications:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
}

async function makePage(browser,{signedIn=false,admin=false,label='page'}={}) {
  const uid=admin?'browser-audit-admin':'browser-audit-user';
  const context=await browser.newContext();
  if(signedIn) {
    await context.addInitScript(({uid}) => {
      localStorage.setItem(`cmCredentialNameOnboardedV3:${uid}`,'true');
    },{uid});
  }
  await context.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:authStub({signedIn,admin,uid})
  }));
  await context.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({
    status:200,
    contentType:'application/javascript',
    body:`window.CM_SYNC={ready:true,flush:async()=>true};`
  }));
  await context.route(`${WORKER}/**`, mockWorker);
  const page=await context.newPage();
  attachErrorCapture(page,label);
  await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
  await waitForApp(page);
  return {context,page};
}

async function mutationCount(page,duration=700) {
  return page.evaluate(ms => new Promise(resolve => {
    const root=document.getElementById('app');
    let child=0;
    const observer=new MutationObserver(records => {
      for(const record of records) if(record.type==='childList') child += record.addedNodes.length + record.removedNodes.length;
    });
    observer.observe(root,{childList:true,subtree:true});
    setTimeout(()=>{observer.disconnect();resolve(child);},ms);
  }),duration);
}

async function assertNoOverflow(page,label) {
  const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert(Math.max(metrics.doc,metrics.body)<=metrics.innerWidth+2,`${label}: horizontal overflow ${Math.max(metrics.doc,metrics.body)}px > ${metrics.innerWidth}px`);
}

async function assertTrackUi(page) {
  try { await page.waitForSelector('[data-cm-track-chooser]',{timeout:2500}); }
  catch (_) {
    const diag=await page.evaluate(()=>({
      hash:location.hash,
      trackApi:typeof window.CM_TRAINING_TRACKS,
      heroCount:document.querySelectorAll('#app .page-hero').length,
      chooserCount:document.querySelectorAll('[data-cm-track-chooser]').length,
      statusCount:document.querySelectorAll('[data-cm-track-status]').length,
      sequenceCount:document.querySelectorAll('[data-cm-track-sequence]').length,
      gate:!!document.getElementById('cm-learning-gate'),
      mainText:(document.querySelector('#app main#main')?.innerText||'').slice(0,1000)
    }));
    throw new Error(`Track UI missing. diagnostics=${JSON.stringify(diag)}`);
  }
  assert(await page.locator('[data-cm-track-chooser]').count()===1,'Career page must have exactly one track chooser');
  assert(await page.locator('[data-cm-track-status]').count()===1,'Career page must have exactly one selected-track status');
  assert(await page.locator('[data-cm-track-sequence]').count()===1,'Career page must have exactly one track sequence');
}

const browser=await chromium.launch({headless:true});
const contexts=[];

try {
  // -------------------------------------------------------------------------
  // 1) Signed-out account gate: reason is clear and URL/DOM stay synchronized.
  // -------------------------------------------------------------------------
  const signedOut=await makePage(browser,{signedIn:false,label:'signed-out'});
  contexts.push(signedOut.context);
  const publicPage=signedOut.page;
  await gotoHash(publicPage,'#/career/investment-banking');
  try { await publicPage.waitForSelector('#cm-learning-gate',{timeout:3000}); }
  catch (error) {
    const diagnostic=await publicPage.evaluate(() => ({
      href:location.href,
      authReady:window.CM_AUTH?.ready,
      authUser:window.CM_AUTH?.user?.uid || null,
      certApi:typeof window.CM_CERT_NAME,
      pending:sessionStorage.getItem('cmPendingLearningRouteV1'),
      gate:!!document.getElementById('cm-learning-gate'),
      body:(document.body?.innerText || '').slice(0,1200)
    }));
    throw new Error(`Signed-out learning gate did not open. diagnostics=${JSON.stringify(diagnostic)} capturedErrors=${JSON.stringify(errors)}`);
  }
  await publicPage.waitForFunction(()=>location.hash==='#/');
  const gateText=await publicPage.locator('#cm-learning-gate').innerText();
  assert(gateText.includes('Sign in to save your progress and earn credentials.'),'Account gate must explain the reason for signing in');
  assert(/Save your progress/i.test(gateText)&&/official assessments/i.test(gateText)&&/verified credentials/i.test(gateText),'Account gate must explain progress, assessment, and credential benefits');
  assert(/free/i.test(gateText)&&/No payment information/i.test(gateText),'Account gate must make free/no-payment positioning explicit');
  assert(await publicPage.evaluate(()=>sessionStorage.getItem('cmPendingLearningRouteV1'))==='#/career/investment-banking','Gated career destination must be remembered');
  const underlying=await publicPage.textContent('#app main#main');
  assert(!/CAREER PATHWAY[\s\S]{0,180}Investment Banking/i.test(underlying||''),'Signed-out gate must not leave stale career DOM rendered while URL says Home');
  await publicPage.locator('[data-cm-gate-close]').click();
  await publicPage.waitForTimeout(100);
  assert(await publicPage.locator('#cm-learning-gate').count()===0,'Not now must close the account explanation cleanly');
  assert(await publicPage.evaluate(()=>location.hash)==='#/','Closing the account gate must leave the user on a coherent public Home route');

  // -------------------------------------------------------------------------
  // 2) Signed-in learner: two-track UI, route guards, QA non-bypass, route churn.
  // -------------------------------------------------------------------------
  const learner=await makePage(browser,{signedIn:true,admin:false,label:'learner'});
  contexts.push(learner.context);
  const page=learner.page;
  await gotoHash(page,'#/career/investment-banking');
  assert(await page.locator('#cm-learning-gate').count()===0,'Signed-in onboarded learner should not see account gate on a career route');
  await assertTrackUi(page);

  for(let i=0;i<12;i++) {
    const target=i%2===0?'career-skills':'professional-readiness';
    await page.locator(`[data-cm-select-track="${target}"]`).click();
    await page.waitForTimeout(45);
    assert(await page.locator('[data-cm-track-chooser]').count()===1,`Track switch ${i}: duplicate chooser`);
    assert(await page.locator('[data-cm-track-status]').count()===1,`Track switch ${i}: duplicate status`);
    assert(await page.locator('[data-cm-track-sequence]').count()===1,`Track switch ${i}: duplicate sequence`);
  }
  const settledMutations=await mutationCount(page,800);
  assert(settledMutations<20,`Career page did not settle after track switching; ${settledMutations} child-list mutations in 800ms`);

  const semantics=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll('[data-cm-select-track]')];
    return {count:buttons.length,pressed:buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,tags:buttons.map(b=>b.tagName)};
  });
  assert(semantics.count===2&&semantics.pressed===1&&semantics.tags.every(x=>x==='BUTTON'),'Track chooser must remain two keyboard-native buttons with exactly one selected state');

  // Professional Readiness must reject direct entry into the shorter capstone.
  await page.evaluate(()=>window.CM_TRAINING_TRACKS.setTrack('investment-banking','professional-readiness'));
  await gotoHash(page,'#/official-simulation/investment-banking');
  await page.waitForFunction(()=>location.hash.startsWith('#/career/investment-banking'),null,{timeout:2500});
  assert((await page.textContent('#app')).includes('Professional Readiness uses the deeper Role Lab'),'Professional simulation guard must explain why the shorter capstone is not the active gate');

  // Career Skills is allowed to use the authoritative compact simulation directly.
  await page.evaluate(()=>window.CM_TRAINING_TRACKS.setTrack('investment-banking','career-skills'));
  await gotoHash(page,'#/official-simulation/investment-banking');
  await page.waitForTimeout(180);
  assert((await page.evaluate(()=>location.hash)).startsWith('#/official-simulation/investment-banking'),'Career Skills must stay on its authoritative server-graded capstone route');

  // A normal learner cannot activate QA bypasses by setting localStorage manually.
  await gotoHash(page,'#/career/investment-banking');
  const guard=await page.evaluate(k=>{
    localStorage.setItem(k,'true');
    const before=localStorage.getItem('capitalMasteryLocalStateV1');
    const scoreResult=window.CM?.qaScores?.(100);
    const progressResult=window.CM?.qaProgress?.(100);
    const resetResult=window.CM?.resetState?.();
    const toggleResult=window.CM?.toggleQa?.();
    return {scoreResult,progressResult,resetResult,toggleResult,before,after:localStorage.getItem('capitalMasteryLocalStateV1'),qa:localStorage.getItem(k)};
  },QA_KEY);
  assert([guard.scoreResult,guard.progressResult,guard.resetResult,guard.toggleResult].every(v=>v===false),'All hidden QA state controls must fail closed for a non-admin');
  assert(guard.before===guard.after,'Blocked non-admin QA calls must not mutate learner state');
  assert(guard.qa==='true','The audit intentionally leaves a forged raw flag in place to test downstream non-bypass');

  // Even with the forged flag, client prerequisite guards must still behave as learner mode.
  await gotoHash(page,'#/quiz/investment-banking/1');
  await page.waitForSelector('.cm-course-locked-preview',{timeout:2500});
  assert((await page.evaluate(()=>location.hash)).startsWith('#/quiz/investment-banking/1'),'Locked direct quiz should remain visible only as a look-ahead route');
  assert(await page.locator('#cm-official-form,.quiz-form').count()===0,'Forged local QA flag bypassed direct-quiz answer-control guard');
  assert(/LOOK AHEAD · READ-ONLY/i.test(await page.locator('.cm-course-locked-preview').innerText()),'Forged local QA flag did not preserve the read-only prerequisite explanation');
  await page.evaluate(()=>window.CM_TRAINING_TRACKS.setTrack('investment-banking','career-skills'));
  await gotoHash(page,'#/simulation/investment-banking');
  await page.waitForTimeout(220);
  assert((await page.evaluate(()=>location.hash)).startsWith('#/official-simulation/investment-banking'),'Forged local QA flag must not expose legacy browser-scored simulation to a learner');
  await page.evaluate(k=>localStorage.removeItem(k),QA_KEY);

  // Route churn hunts stale async views and duplicate decorator output.
  const routes=['#/','#/careers','#/career/investment-banking','#/learner-guide','#/credentials','#/employers','#/trust','#/about'];
  for(let i=0;i<4;i++) {
    for(const route of routes) {
      await gotoHash(page,route);
      assert(await page.locator('#app main#main').count()===1,`Route ${route} lost the main shell`);
      assert(await page.locator('[data-cm-track-public-overview]').count()<=1,`Route ${route} duplicated public two-track overview`);
      assert(await page.locator('[data-cm-track-chooser]').count()<=1,`Route ${route} duplicated track chooser`);
    }
  }

  // Responsive overflow on the most mutation-heavy surfaces.
  for(const [width,height] of [[375,812],[430,932],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height});
    for(const route of ['#/','#/careers','#/career/investment-banking','#/learner-guide']) {
      await gotoHash(page,route);
      await assertNoOverflow(page,`${route} @ ${width}x${height}`);
    }
  }

  // -------------------------------------------------------------------------
  // 3) Verified Admin QA: controls, simulation preview, credential preview, reset.
  // -------------------------------------------------------------------------
  const admin=await makePage(browser,{signedIn:true,admin:true,label:'admin'});
  contexts.push(admin.context);
  const adminPage=admin.page;
  await gotoHash(adminPage,'#/admin-preview');
  assert((await adminPage.textContent('#app')).includes('Capital Mastery Release Lab'),'Verified admin must see the Admin / QA lab');
  assert(await adminPage.locator('.admin-card').count()>=6,'Admin / QA lab must expose the expected tool cards');
  assert(await adminPage.locator('[data-cm-admin-sim-preview]').count()===1,'Admin Simulation Lab must expose one explicit preview link');

  // Boundary score control works and automatically enables QA mode.
  await adminPage.getByRole('button',{name:'79%'}).click();
  await adminPage.waitForTimeout(120);
  const scoreState=await adminPage.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),QA_STATE_KEY);
  assert(scoreState?.careers?.['investment-banking']?.quizScores?.['1']===79,'Admin 79% boundary control did not update local QA state');
  assert(await adminPage.evaluate(k=>localStorage.getItem(k),QA_KEY)==='true','Admin boundary control must automatically enable QA mode');
  assert(await adminPage.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null')?.careers?.['investment-banking']?.quizScores?.['1']??null,STATE_KEY)===null,'Admin QA score contaminated normal learner progress');

  // Progress preset works.
  await adminPage.getByRole('button',{name:'60%'}).click();
  await adminPage.waitForTimeout(120);
  const progressState=await adminPage.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),QA_STATE_KEY);
  assert(JSON.stringify(progressState?.careers?.['investment-banking']?.completedParts||[])===JSON.stringify([1,2,3]),'Admin 60% progress preset did not create the expected local state');

  // Local simulation preview stays local and is not redirected to official learner mode.
  await adminPage.locator('[data-cm-admin-sim-preview]').click();
  await adminPage.waitForTimeout(220);
  assert((await adminPage.evaluate(()=>location.hash))==='#/admin-preview/simulation/investment-banking',`Admin simulation preview escaped the protected Admin namespace: ${await adminPage.evaluate(()=>location.hash)}`);
  assert(/Project Northstar|Northstar Technologies|Simulation/i.test(await adminPage.textContent('#app')||''),'Admin simulation preview did not render Project Northstar');
  const simMutations=await mutationCount(adminPage,650);
  assert(simMutations<20,`Admin simulation preview did not settle; ${simMutations} mutations`);

  // Credential compatibility previews stay local instead of being replaced by the live renderer.
  await gotoHash(adminPage,'#/admin-preview');
  const foundationPreview=adminPage.locator('a[href="#/certificate/investment-banking/foundations"]').first();
  assert(await foundationPreview.count()===1,'Admin Foundations certificate preview link missing');
  await foundationPreview.click();
  await adminPage.waitForTimeout(250);
  assert(await adminPage.locator('#certificate').count()===1,'Admin credential preview did not render the local certificate');
  assert(!/active issued credential is required/i.test(await adminPage.textContent('#app')||''),'Authoritative renderer overrode Admin credential preview');

  // Reset Local State is admin-only and actually works when invoked from the lab.
  await gotoHash(adminPage,'#/admin-preview');
  adminPage.once('dialog',dialog=>dialog.accept());
  await adminPage.getByRole('button',{name:'Reset Local State'}).click();
  await adminPage.waitForTimeout(120);
  const resetState=await adminPage.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null'),QA_STATE_KEY);
  assert(Object.keys(resetState?.careers||{}).length===0,'Admin Reset Local State did not clear QA career progress');
  assert(await adminPage.evaluate(key=>JSON.parse(localStorage.getItem(key)||'null')?.careers?.['investment-banking']?.quizScores?.['1']??null,STATE_KEY)===null,'QA reset modified normal learner progress');

  // -------------------------------------------------------------------------
  // 4) Runtime errors captured across all three browser personas are blockers.
  // -------------------------------------------------------------------------
  const severe=[...new Set(errors)];
  assert(severe.length===0,`Browser audit captured runtime failures:\n${severe.join('\n')}`);

  console.log('FAILURE-SEEKING BROWSER TORTURE AUDIT PASS');
} finally {
  for(const context of contexts) await context.close().catch(()=>{});
  await browser.close();
}
