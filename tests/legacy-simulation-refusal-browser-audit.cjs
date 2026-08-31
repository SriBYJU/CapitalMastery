const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
function assert(c,m){if(!c)throw new Error(m);}
function authStub(){return `(() => {
  const user={uid:'legacy-sim-audit',email:'legacy-sim@example.invalid',displayName:'Legacy Sim Audit'};
  window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'legacy-sim-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
  setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
})();`;}
const legacyPayload={
  ok:true,pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},itemId:'simulation',itemType:'simulation',masteryScore:80,questionCount:5,assessmentVersion:'1.0',simulationProfile:null,
  questions:[
    {id:'old-1',type:'mc',prompt:'Which value should be paired with EBITDA in an EV/EBITDA multiple?',options:['Enterprise value','Equity value','Net income','Book value']},
    {id:'old-2',type:'numeric',prompt:'Orion has $790m equity value, $95m debt and $35m cash. What is implied enterprise value ($m)?',unit:'$m'},
    {id:'old-3',type:'numeric',prompt:'Using $850m enterprise value and $80m EBITDA, what is EV/EBITDA (x)?',unit:'x'},
    {id:'old-4',type:'mc',prompt:'Management cuts revenue guidance after your first valuation. Best next step?',options:['Update forecast assumptions','Keep original valuation','Remove all comparable companies','Use only the highest precedent multiple']},
    {id:'old-5',type:'mc',prompt:'Which peer is usually most defensible?',options:['Similar business model','Same broad sector label','Highest multiple','Closest share price']}
  ],
  writingPrompt:'Write a concise recommendation to the Associate.'
};

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const errors=[];
  try{
    await context.addInitScript(()=>localStorage.setItem('cmCredentialNameOnboardedV3:legacy-sim-audit','true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,async r=>{
      const u=new URL(r.request().url());
      if(u.pathname==='/assessment/investment-banking/simulation') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(legacyPayload)});
      if(u.pathname==='/auth-check') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:false})});
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[],credentials:[],programCompletions:[]})});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
    page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(`console:${m.text()}`);});
    await page.goto(`${BASE}/#/official-simulation/investment-banking`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('.cm-workbench-required',{timeout:15000});
    const text=await page.locator('#app main#main').innerText();
    assert(/Professional workbench update required/i.test(text),'Stale Worker payload did not enter safe workbench-required state');
    assert(/will not present a multiple-choice or answer-picking exercise as a job simulation/i.test(text),'Professional no-MCQ standard not visible');
    assert(!/Which value should be paired with EBITDA/.test(text),'Legacy MCQ leaked into learner UI');
    assert(!/Management cuts revenue guidance/.test(text),'Legacy answer-picking task leaked into learner UI');
    assert(await page.locator('input[type="radio"]').count()===0,'Legacy simulation rendered radio-button answers');
    assert(await page.locator('select').count()===0,'Legacy simulation rendered select-answer UI');
    assert(await page.locator('#cm-official-form').count()===0,'Legacy simulation rendered an official submission form');
    assert(errors.length===0,`Browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('LEGACY SIMULATION REFUSAL BROWSER AUDIT PASS: stale MCQ Worker payload is blocked and never presented as an official job simulation');
  }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
