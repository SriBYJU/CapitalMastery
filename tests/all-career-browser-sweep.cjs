const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function authStub() {
  return `(() => {
    const user={uid:'all-career-audit-user',email:'career-audit@example.invalid',displayName:'Career Audit'};
    window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'career-audit-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
  })();`;
}

async function mockWorker(route) {
  const url = new URL(route.request().url());
  let payload={ok:true};
  if (url.pathname.startsWith('/progress/')) payload={ok:true,progress:[]};
  else if (url.pathname==='/credentials/me') payload={ok:true,credentials:[]};
  else if (url.pathname==='/auth-check') payload={ok:true,isAdmin:false};
  else if (url.pathname.includes('/notifications')) payload={ok:true,notifications:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
}

async function gotoHash(page, hash) {
  await page.evaluate(h => { location.hash=h; }, hash);
  await page.waitForTimeout(170);
  await page.waitForSelector('#app main#main',{timeout:10000});
}

async function assertContained(page, label) {
  const m=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert(Math.max(m.doc,m.body)<=m.inner+2,`${label}: horizontal overflow ${Math.max(m.doc,m.body)}px > ${m.inner}px`);
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const runtimeErrors=[];
  try {
    await context.addInitScript(()=>localStorage.setItem('cmCredentialNameOnboardedV3:all-career-audit-user','true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,mockWorker);
    const page=await context.newPage();
    page.on('pageerror',error=>runtimeErrors.push(`pageerror: ${error.message}`));
    page.on('requestfailed',request=>{if(request.url().startsWith(BASE)) runtimeErrors.push(`same-origin request failed: ${request.url()}`);});
    page.on('console',msg=>{if(msg.type()==='error'&&!/Firebase|auth-check|Failed to fetch|favicon/i.test(msg.text()))runtimeErrors.push(`console: ${msg.text()}`);});

    await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#app main#main',{timeout:15000});
    const careers=await page.evaluate(()=>window.CM_DATA?.careers?.map(c=>({id:c.id,title:c.title}))||[]);
    assert(careers.length===16,`Expected 16 browser-visible careers, got ${careers.length}`);

    for(const career of careers) {
      await gotoHash(page,`#/career/${career.id}`);
      await page.waitForSelector('[data-cm-track-chooser]',{timeout:3000});
      assert(await page.locator('#cm-learning-gate').count()===0,`${career.id}: signed-in learner hit account gate`);
      assert(await page.locator('[data-cm-track-chooser]').count()===1,`${career.id}: track chooser missing/duplicated`);
      assert(await page.locator('[data-cm-track-status]').count()===1,`${career.id}: track status missing/duplicated`);
      assert(await page.locator('[data-cm-track-sequence]').count()===1,`${career.id}: track sequence missing/duplicated`);
      const controls=page.locator('[data-cm-select-track]');
      assert(await controls.count()===2,`${career.id}: expected two training-track controls`);
      assert((await page.textContent('#app')).includes(career.title),`${career.id}: career title not rendered`);

      await page.locator('[data-cm-select-track="career-skills"]').click();
      await page.waitForTimeout(45);
      assert((await page.textContent('[data-cm-track-status]')).includes('Career Skills'),`${career.id}: Career Skills selection did not persist to status`);
      assert(await page.locator('[data-cm-track-chooser]').count()===1,`${career.id}: Career Skills selection duplicated chooser`);

      await page.locator('[data-cm-select-track="professional-readiness"]').click();
      await page.waitForTimeout(45);
      assert((await page.textContent('[data-cm-track-status]')).includes('Professional Readiness'),`${career.id}: Professional Readiness selection did not persist to status`);
      assert(await page.locator('[data-cm-track-sequence]').count()===1,`${career.id}: Professional selection duplicated sequence`);
    }

    // Release-width sweep across all 16 career landing pages. This catches
    // role-specific long titles, badges, workbook labels or track sequences that
    // only overflow at phone, large-phone, tablet or desktop breakpoints.
    const releaseWidths=[[375,812],[430,932],[768,1024],[1440,900]];
    for(const [width,height] of releaseWidths) {
      await page.setViewportSize({width,height});
      for(const career of careers) {
        await gotoHash(page,`#/career/${career.id}`);
        await page.waitForSelector('[data-cm-track-chooser]',{timeout:3000});
        await assertContained(page,`${career.id} @ ${width}px`);
        assert(await page.locator('[data-cm-track-chooser]').count()===1,`${career.id} @ ${width}px: chooser disappeared or duplicated`);
      }
    }

    assert(runtimeErrors.length===0,`All-career browser sweep runtime errors: ${[...new Set(runtimeErrors)].join(' | ')}`);
    console.log(`ALL-CAREER TWO-TRACK BROWSER SWEEP PASS: ${careers.length} careers × both tracks + 4 release widths`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
