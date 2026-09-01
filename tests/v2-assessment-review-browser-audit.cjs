const {chromium}=require('playwright');
const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
function authStub(){return `(()=>{const user={uid:'v2-review-user',email:'v2-review@example.invalid',displayName:'V2 Review'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'v2-review-token'};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0)})();`;}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let submits=0;
  let savedPassed=true;
  try{
    await context.addInitScript(()=>{localStorage.setItem('cmCredentialNameOnboardedV3:v2-review-user','true');localStorage.setItem('capitalMasteryActiveUidV1','v2-review-user');});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.pathname==='/enterprise/assessments/ib-essentials-case/review') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,review:{attemptId:savedPassed?'v2a_passed':'v2a_failed',assessmentKey:'ib-essentials-case',pathwayId:'investment-banking',score:savedPassed?100:50,passed:savedPassed,correct:savedPassed?2:1,total:2,submittedAt:'2026-08-30T12:00:00Z',questions:[{id:'q1',position:1,type:'numeric',prompt:'Calculate enterprise value.',submitted:'850',correct:true,correctAnswer:'850',rationale:'Equity value plus debt less cash.'},{id:'q2',position:2,type:'mc',prompt:'Choose the defensible peer.',submitted:savedPassed?'Similar business model':'Highest multiple',correct:savedPassed,correctAnswer:'Similar business model',rationale:'Business-model comparability is the defensible basis.'}]}})});
      if(url.pathname==='/enterprise/assessments/ib-essentials-case'&&request.method()==='GET') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,assessment:{key:'ib-essentials-case',pathwayId:'investment-banking',stage:'essentials',title:'IB Essentials Mini Case',description:'Apply the taught core.',passScore:75,scenario:{}},questions:[{id:'q1',position:1,type:'numeric',prompt:'Calculate enterprise value.',unit:'$m',tolerance:1},{id:'q2',position:2,type:'mc',prompt:'Choose the defensible peer.',options:['Similar business model','Highest multiple']}]})});
      if(url.pathname==='/enterprise/assessments/ib-essentials-case/submit') {submits++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,score:100,passed:true,correct:2,total:2,passScore:75,issuedCredentials:[]})});}
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
    });
    const page=await context.newPage();
    await page.goto(`${BASE}/#/v2-assessment/ib-essentials-case`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('.cmv2-saved-review',{timeout:15000});
    const text=await page.locator('.cmv2-saved-review').innerText();
    assert(/Your answer[\s\S]*850/i.test(text),`Saved numeric answer missing: ${JSON.stringify(text)}`);
    assert(/Similar business model/.test(text),'Saved correct answer must remain visible after submission');
    assert(/Business-model comparability/.test(text),'Saved rationale missing');
    assert(/2 \/ 2/.test(text)&&/100%[\s·]*Passed/i.test(text),'Saved pass must show count and percentage');
    assert(await page.locator('#cmv2-v2-assessment').count()===0,'Opening a saved attempt silently rendered a new assessment form');
    assert(await page.getByRole('button',{name:/Start new attempt/}).count()===0,'Passed V2 review must not offer another attempt');

    await page.evaluate(()=>{location.hash='#/v2-assessment/ib-essentials-case?retake=1&attempt=forged';});
    await page.waitForSelector('.cmv2-saved-review',{timeout:10000});
    assert(await page.locator('#cmv2-v2-assessment').count()===0,'A forged V2 retake query reopened a passed assessment');
    assert(submits===0,'A passed V2 route created an unexpected submission');

    savedPassed=false;
    await page.evaluate(()=>{location.hash='#/v2-assessment/ib-essentials-case?assignment=failed-review';});
    await page.waitForFunction(()=>/50%[\s·]*Retry required/i.test(document.querySelector('.cmv2-saved-review')?.innerText||''),null,{timeout:10000});
    const failedText=await page.locator('.cmv2-saved-review').innerText();
    assert(/1 \/ 2/.test(failedText),'Failed review must show its saved correct-answer count');
    assert(/Highest multiple/.test(failedText)&&/Similar business model/.test(failedText),'Failed review must preserve the submitted answer and correction');
    await page.getByRole('button',{name:/Retry required · Start new attempt/}).click();
    await page.waitForSelector('#cmv2-v2-assessment',{timeout:10000});
    assert(await page.locator('.cmv2-saved-review').count()===0,'Explicit failed retry did not replace read-only review');
    await page.locator('input[name="q1"]').fill('850');
    await page.locator('input[name="q2"]').first().check();
    await page.locator('#cmv2-v2-assessment button[type="submit"]').click();
    await page.waitForSelector('.cmv2-result-card',{timeout:10000});
    assert(submits===1,'Explicit failed retry should create exactly one new server submission');
    console.log('V2 ASSESSMENT REVIEW BROWSER AUDIT PASS: permanent pass, forged-retake resistance, saved counts/answers/corrections/rationale, and explicit failed-only retry verified');
  }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
