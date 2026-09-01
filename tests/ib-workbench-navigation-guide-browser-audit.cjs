const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
function assert(value,message){if(!value)throw new Error(message);}
function authStub(){return `(() => {
  const user={uid:'ib-workbench-navigation-audit',email:'ib-workbench-navigation@example.invalid',displayName:'IB Workbench Audit'};
  window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'ib-navigation-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
  setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
})();`;}

const sections=['model','valuation','precedents','dcf','update','qa','client-materials'];
const payload={
  ok:true,
  pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},
  itemId:'simulation',itemType:'simulation',masteryScore:80,assessmentVersion:'2.0-workbench',questionCount:7,
  questions:sections.map((section,index)=>({
    id:`audit-${section}`,type:index<5?'numeric':'text',prompt:`Complete ${section}`,
    unit:index<5?'$m':null,
    workProduct:{section,label:`${section} output`,cell:`A${index+1}`,instruction:'Use the matching source file, complete the work, and review it before submission.'}
  })),
  writingPrompt:'Draft the Associate handoff.',
  simulationProfile:{
    kind:'ib-deal-workbench-v2',project:'Project Northstar',role:'Investment Banking Analyst',desk:'M&A Advisory',associate:'Maya Chen, Associate',vp:'Daniel Brooks, Vice President',client:'Northstar Technologies',target:'Orion Systems',deadline:'5:30 PM — same day',objective:'Refresh Orion valuation and prepare a decision-ready recommendation.',
    inbox:[{time:'9:08 AM',from:'Maya Chen · Associate',subject:'Valuation refresh',body:'Refresh all valuation outputs.'},{time:'2:17 PM',from:'Maya Chen · Associate',subject:'NEW INFO',body:'Management lowered guidance; update dependent outputs.'}],
    files:[
      {id:'cap',name:'01_Orion_Capitalization.xlsx',type:'Excel',label:'Capitalization',description:'Offer price, share count, debt, and cash for the enterprise-value bridge.',useFor:'Transaction model',rows:[['Metric','Value'],['Equity value','$790m'],['Debt','$95m'],['Cash','$35m']]},
      {id:'comps',name:'03_Trading_Comps.xlsx',type:'Excel',label:'Trading comps',description:'Peer enterprise values, EBITDA, and fit notes for the selected comparable-company set.',useFor:'Trading comps',rows:[['Peer','EV','EBITDA'],['Aster','$1,020m','$100m']]}
    ]
  }
};

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1365,height:900}});
  const errors=[];
  try{
    await context.addInitScript(()=>{
      localStorage.setItem('cmCredentialNameOnboardedV3:ib-workbench-navigation-audit','true');
      localStorage.setItem('capitalMasteryActiveUidV1','ib-workbench-navigation-audit');
      localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking','career-skills');
    });
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/assessment/investment-banking/simulation') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
      if(path==='/auth-check') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:false})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[],credentials:[],programCompletions:[]})});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`pageerror:${error.message}`));
    page.on('console',message=>{if(message.type()==='error'&&!/favicon/i.test(message.text()))errors.push(`console:${message.text()}`);});
    await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#app main#main',{timeout:15000});
    await page.evaluate(()=>{location.hash='#/official-simulation/investment-banking?retake=1';});
    await page.waitForSelector('.cm-wb-shell [data-cm-wb-target]',{timeout:15000});

    const expectedHash='#/official-simulation/investment-banking?retake=1';
    const nav=page.locator('.cm-wb-sidebar [data-cm-wb-target]');
    assert(await nav.count()===10,'Orion workbench must expose ten navigable steps');
    assert(await page.locator('.cm-wb-sidebar a[href^="#cm-wb-"]').count()===0,'Fragment anchors must not remain in SPA workbench navigation');
    for(let index=0;index<10;index++){
      const button=nav.nth(index);
      const target=await button.getAttribute('data-cm-wb-target');
      await button.click();
      await page.waitForTimeout(30);
      assert(await page.evaluate(()=>location.hash)===expectedHash,`Step ${index+1} changed the SPA route`);
      assert(await button.getAttribute('aria-current')==='step',`Step ${index+1} did not become active`);
      assert(await page.locator(`#${target}`).count()===1,`Step ${index+1} points to a missing section`);
    }

    assert(await page.locator('.cm-wb-guide').count()>=9,'Guidance must appear throughout the beginner workbench');
    assert(await page.getByText('A clear path through the case').count()===1,'Visual case roadmap is missing');
    const files=page.locator('details.cm-wb-file');
    assert(await files.count()===2,'Mock data-room file cards did not render');
    assert((await files.first().innerText()).includes('Offer price, share count, debt, and cash'),'File summary does not explain what the file contains');
    await files.first().locator('summary').click();
    assert(await files.first().getAttribute('open')!==null,'File preview did not open');
    assert(await files.first().locator('table').isVisible(),'Opened file did not reveal a readable preview');
    assert((await files.first().innerText()).includes('Use for: Transaction model'),'Opened file did not explain how it is used');

    const firstInput=page.locator('#cm-official-form input[required]').first();
    await firstInput.fill('850');
    await page.locator('#cm-official-form textarea[name="writingDecision"]').fill('Continue diligence subject to the valuation and quality-control findings.');
    assert(/^2 of /.test(await page.locator('[data-cm-wb-progress-text]').innerText()),'Interactive completion progress did not count numeric and structured writing fields');
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    try { await page.waitForSelector('.cm-wb-shell #cm-official-form',{timeout:15000}); }
    catch (error) {
      const diagnostic=await page.evaluate(()=>({href:location.href,hash:location.hash,authReady:window.CM_AUTH?.ready,user:window.CM_AUTH?.user?.uid||null,body:(document.body?.innerText||'').slice(0,1200)}));
      throw new Error(`Workbench did not return after draft-recovery reload. diagnostics=${JSON.stringify(diagnostic)} errors=${JSON.stringify(errors)}`);
    }
    assert(await page.locator('#cm-official-form input[required]').first().inputValue()==='850','Numeric workbench draft did not recover after reload');
    assert((await page.locator('#cm-official-form textarea[name="writingDecision"]').inputValue()).startsWith('Continue diligence'),'Structured Associate handoff draft did not recover after reload');
    assert((await page.locator('[data-cm-draft-status]').innerText()).includes('Draft recovered'),'Recovered workbench draft was not explained to the learner');
    assert(errors.length===0,`Browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('IB WORKBENCH NAVIGATION + GUIDANCE BROWSER AUDIT PASS: SPA-safe ten-step navigation, openable explained files, guides, roadmap, live progress and seven-day draft recovery verified');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
