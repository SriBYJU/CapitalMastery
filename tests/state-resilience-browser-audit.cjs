const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const UID = 'state-audit-user';
const STATE_KEY = 'capitalMasteryLocalStateV1';
const USER_KEY = `capitalMasteryUserStateV1:${UID}`;

function assert(condition,message){if(!condition)throw new Error(message);}

function authStub(){
  return `(() => {
    const user={uid:'${UID}',email:'state-audit@example.invalid',displayName:'State Audit'};
    window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'state-audit-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
  })();`;
}

async function mockWorker(route){
  const url=new URL(route.request().url());
  let payload={ok:true};
  if(url.pathname.startsWith('/progress/')) payload={ok:true,progress:[]};
  else if(url.pathname==='/credentials/me') payload={ok:true,credentials:[]};
  else if(url.pathname==='/auth-check') payload={ok:true,isAdmin:false};
  else if(url.pathname.includes('/notifications')) payload={ok:true,notifications:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
}

function malformedState(){
  return {
    version:1,
    profile:{accountUid:UID,certificateName:'State Audit',certificateNameConfirmed:true},
    careers:{'investment-banking':'broken-career-shape','private-equity':null},
    credentials:{not:'an array'},
    preferences:['wrong','shape'],
    createdAt:'not-a-date',
    updatedAt:'also-not-a-date'
  };
}

async function waitForMain(page){
  await page.waitForSelector('#app main#main',{timeout:15000});
  await page.waitForTimeout(180);
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:430,height:932}});
  const severe=[];
  try{
    await context.addInitScript(({stateKey,userKey,uid,state})=>{
      localStorage.setItem(stateKey,JSON.stringify(state));
      localStorage.setItem(userKey,JSON.stringify(state));
      localStorage.setItem('capitalMasteryActiveUidV1',uid);
      localStorage.setItem(`cmCredentialNameOnboardedV3:${uid}`,'true');
    },{stateKey:STATE_KEY,userKey:USER_KEY,uid:UID,state:malformedState()});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,mockWorker);

    const page=await context.newPage();
    page.on('pageerror',error=>severe.push(`pageerror: ${error.message}`));
    page.on('requestfailed',request=>{
      if(request.url().startsWith(BASE)) severe.push(`same-origin request failed: ${request.url()}`);
    });
    page.on('console',msg=>{
      if(msg.type()==='error'&&!/Firebase|auth-check|Failed to fetch|favicon/i.test(msg.text())) severe.push(`console: ${msg.text()}`);
    });

    await page.goto(`${BASE}/#/career/investment-banking`,{waitUntil:'domcontentloaded',timeout:30000});
    await waitForMain(page);
    await page.waitForSelector('[data-cm-track-chooser]',{timeout:5000});
    assert((await page.textContent('#app')).includes('Investment Banking'),'Malformed state prevented career page from rendering');

    const repaired=await page.evaluate(({stateKey,userKey})=>{
      const current=JSON.parse(localStorage.getItem(stateKey));
      const saved=JSON.parse(localStorage.getItem(userKey));
      const shape=s=>({
        careersObject:!!s.careers&&typeof s.careers==='object'&&!Array.isArray(s.careers),
        ibObject:!!s.careers?.['investment-banking']&&typeof s.careers['investment-banking']==='object'&&!Array.isArray(s.careers['investment-banking']),
        learningArray:Array.isArray(s.careers?.['investment-banking']?.learningComplete),
        credentialsArray:Array.isArray(s.credentials),
        preferencesObject:!!s.preferences&&typeof s.preferences==='object'&&!Array.isArray(s.preferences),
        createdValid:!Number.isNaN(Date.parse(s.createdAt)),
        // The pre-boot guard removes a malformed updatedAt. Later legitimate state
        // writes may create a fresh ISO timestamp, so the durable contract is that
        // the corrupt value never survives: absent OR valid is correct.
        updatedRepaired:!('updatedAt' in s)||(!Number.isNaN(Date.parse(s.updatedAt))&&s.updatedAt!=='also-not-a-date')
      });
      return {current:shape(current),saved:shape(saved)};
    },{stateKey:STATE_KEY,userKey:USER_KEY});
    for(const [which,shape] of Object.entries(repaired)) {
      for(const [key,value] of Object.entries(shape)) assert(value,`${which} state repair missing ${key}: ${JSON.stringify(shape)}`);
    }

    // Hash history should survive normal Back / Forward instead of leaving a stale
    // async renderer on the wrong route.
    await page.evaluate(()=>{location.hash='#/learner-guide';});
    await page.waitForTimeout(250);
    assert(locationHash(await page.evaluate(()=>location.hash))==='#/learner-guide','Could not navigate to learner guide before history test');
    await page.goBack({waitUntil:'domcontentloaded'}).catch(()=>{});
    await page.waitForTimeout(300);
    assert(locationHash(await page.evaluate(()=>location.hash)).startsWith('#/career/investment-banking'),`Back navigation returned wrong hash: ${await page.evaluate(()=>location.hash)}`);
    assert((await page.textContent('#app')).includes('Investment Banking'),'Back navigation left stale non-career DOM');
    await page.goForward({waitUntil:'domcontentloaded'}).catch(()=>{});
    await page.waitForTimeout(300);
    assert(locationHash(await page.evaluate(()=>location.hash))==='#/learner-guide',`Forward navigation returned wrong hash: ${await page.evaluate(()=>location.hash)}`);
    assert((await page.textContent('#app')).includes('See exactly how you go from beginner to desk-ready.'),'Forward navigation left stale career DOM');

    // Once the shell/assets are loaded, losing network access must not blank local
    // navigation. Network-backed reconciliation may pause, but the learner keeps a
    // usable local experience and recovers after the online event.
    await context.setOffline(true);
    await page.evaluate(()=>{location.hash='#/career/private-equity';});
    await page.waitForTimeout(350);
    assert((await page.textContent('#app')).includes('Private Equity'),'Offline route change blanked the career page');
    assert(await page.locator('#app main#main').count()===1,'Offline route change lost the application shell');
    await context.setOffline(false);
    await page.evaluate(()=>window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(250);
    assert((await page.textContent('#app')).includes('Private Equity'),'Online recovery replaced the current career with stale content');

    assert([...new Set(severe)].length===0,`State-resilience browser audit captured failures: ${[...new Set(severe)].join(' | ')}`);
    console.log('STATE RESILIENCE BROWSER AUDIT PASS: malformed v1 snapshots, repaired timestamps, Back/Forward, offline navigation and online recovery');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});

function locationHash(value){return String(value||'');}
