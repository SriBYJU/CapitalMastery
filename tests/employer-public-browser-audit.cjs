const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';

function assert(condition,message){if(!condition)throw new Error(message);}

function signedOutAuthStub(){
  return `(() => { const user=null; window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=>null,googleSignIn:async()=>null,emailSignIn:async()=>null,emailCreate:async()=>null,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}}; setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0); })();`;
}

async function mockWorker(route){
  const url=new URL(route.request().url());
  let payload={ok:true};
  if(url.pathname==='/enterprise/catalog') payload={ok:true,pathways:[],credentialLadder:[]};
  else if(url.pathname==='/auth-check') payload={ok:true,isAdmin:false};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
}

async function assertContained(page,label){
  const m=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert(Math.max(m.doc,m.body)<=m.inner+2,`${label}: horizontal overflow ${Math.max(m.doc,m.body)}px > ${m.inner}px`);
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const [width,height] of [[375,812],[430,932],[768,1024],[1440,900]]){
      const context=await browser.newContext({viewport:{width,height}});
      await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:signedOutAuthStub()}));
      await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
      await context.route(`${WORKER}/**`,mockWorker);
      const page=await context.newPage();
      const runtimeErrors=[];
      page.on('pageerror',error=>runtimeErrors.push(error.message));
      page.on('requestfailed',request=>{if(request.url().startsWith(BASE))runtimeErrors.push(`same-origin request failed: ${request.url()}`);});
      page.on('console',msg=>{if(msg.type()==='error'&&!/Firebase|auth-check|Failed to fetch|favicon/i.test(msg.text()))runtimeErrors.push(msg.text());});

      await page.goto(`${BASE}/#/employers`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('[data-employer-tour-tab]',{timeout:15000});
      const pageText=await page.textContent('#app');
      assert(/FREE TO USE/i.test(pageText||'')&&/No employer subscription, seat fee or trial gate/i.test(pageText||''),`Employer free positioning missing @ ${width}`);
      assert(/not an ROI forecast/i.test(pageText||''),`Employer calculator caveat missing @ ${width}`);
      await assertContained(page,`Employer landing @ ${width}`);

      const tabs=await page.locator('[data-employer-tour-tab]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-employer-tour-tab')));
      assert(JSON.stringify(tabs)===JSON.stringify(['program','work','evidence','govern']),`Employer tour steps changed @ ${width}: ${JSON.stringify(tabs)}`);
      for(let i=0;i<tabs.length;i++){
        const id=tabs[i];
        const button=page.locator(`[data-employer-tour-tab="${id}"]`);
        if(i%2===0){await button.focus();await page.keyboard.press('Enter');}else await button.click();
        await page.waitForTimeout(70);
        assert(await page.locator(`[data-employer-tour-panel="${id}"].active`).count()===1,`Employer ${id} panel did not activate @ ${width}`);
        assert(await button.getAttribute('aria-selected')==='true',`Employer ${id} tab missing aria-selected @ ${width}`);
        await assertContained(page,`Employer ${id} tour @ ${width}`);
      }

      const form=page.locator('#cmv2-ramp-calculator');
      assert(await form.count()===1,`Employer scenario calculator missing @ ${width}`);
      await form.locator('[name="cohort"]').fill('12');
      await form.locator('[name="daily"]').fill('600');
      await form.locator('[name="days"]').fill('4');
      await form.locator('[name="gap"]').fill('25');
      await page.waitForTimeout(50);
      const output=await form.locator('[data-ramp-output]').textContent();
      const formula=await form.locator('[data-ramp-formula]').textContent();
      assert((output||'').replace(/\s/g,'').includes('$7,200'),`Employer calculator returned wrong scenario output @ ${width}: ${output}`);
      assert(/12 learners/.test(formula||'')&&/25% assumed productivity gap/.test(formula||''),`Employer calculator formula disclosure did not update @ ${width}`);
      await assertContained(page,`Employer calculator updated @ ${width}`);

      assert(runtimeErrors.length===0,`Employer public browser runtime errors @ ${width}: ${[...new Set(runtimeErrors)].join(' | ')}`);
      await context.close();
    }
    console.log('EMPLOYER PUBLIC WALKTHROUGH/CALCULATOR BROWSER AUDIT PASS');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
