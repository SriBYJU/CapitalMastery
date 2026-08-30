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

async function pageSnapshot(page){
  if(page.isClosed()) return {closed:true,url:page.url()};
  const appCount=await page.locator('#app').count().catch(()=>-1);
  const mainCount=await page.locator('#app main#main').count().catch(()=>-1);
  const body=await page.locator('body').innerText({timeout:1500}).catch(error=>`<body-read-failed:${error.message}>`);
  return {closed:false,url:page.url(),appCount,mainCount,body:body.slice(0,500)};
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:430,height:932}});
  const severe=[];
  const navEvents=[];
  const offlineAssetFailures=[];
  let offlineMode=false;
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
    page.on('crash',()=>severe.push('page crashed'));
    page.on('close',()=>severe.push('page closed unexpectedly'));
    page.on('framenavigated',frame=>{if(frame===page.mainFrame())navEvents.push(`nav:${frame.url()}`);});
    page.on('requestfailed',request=>{
      const url=request.url();
      if(request.isNavigationRequest()) {
        navEvents.push(`failed-nav:${url}::${request.failure()?.errorText||''}`);
        severe.push(`navigation request failed: ${url}`);
        return;
      }
      if(url.startsWith(BASE)) {
        if(offlineMode) offlineAssetFailures.push(url);
        else severe.push(`same-origin request failed: ${url}`);
      }
    });
    page.on('console',msg=>{
      if(msg.type()!=='error') return;
      const text=msg.text();
      if(/Firebase|auth-check|Failed to fetch|favicon/i.test(text)) return;
      if(offlineMode&&/ERR_INTERNET_DISCONNECTED/i.test(text)) return;
      severe.push(`console: ${text}`);
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
        updatedRepaired:!('updatedAt' in s)||(!Number.isNaN(Date.parse(s.updatedAt))&&s.updatedAt!=='also-not-a-date')
      });
      return {current:shape(current),saved:shape(saved)};
    },{stateKey:STATE_KEY,userKey:USER_KEY});
    for(const [which,shape] of Object.entries(repaired)) {
      for(const [key,value] of Object.entries(shape)) assert(value,`${which} state repair missing ${key}: ${JSON.stringify(shape)}`);
    }

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

    const beforeOffline=await pageSnapshot(page);
    offlineMode=true;
    await context.setOffline(true);
    await page.evaluate(()=>{location.hash='#/career/private-equity';});
    await page.waitForTimeout(500);
    const offlineSnapshot=await pageSnapshot(page);
    assert(offlineSnapshot.appCount===1&&offlineSnapshot.mainCount===1,
      `Offline route change lost the loaded app shell. before=${JSON.stringify(beforeOffline)} after=${JSON.stringify(offlineSnapshot)} navEvents=${JSON.stringify(navEvents.slice(-12))}`);
    assert(offlineSnapshot.body.includes('Private Equity'),
      `Offline route change did not render Private Equity. snapshot=${JSON.stringify(offlineSnapshot)} navEvents=${JSON.stringify(navEvents.slice(-12))}`);

    const unexpectedOfflineAssets=offlineAssetFailures.filter(url=>!/\/assets\/logo-mark\.svg(?:[?#]|$)/i.test(url));
    assert(unexpectedOfflineAssets.length===0,`Unexpected same-origin assets failed during offline SPA navigation: ${unexpectedOfflineAssets.join(', ')}`);
    const logoFailures=offlineAssetFailures.filter(url=>/\/assets\/logo-mark\.svg(?:[?#]|$)/i.test(url));
    if(logoFailures.length) {
      const fallbackCount=await page.locator('img[data-cm-asset-fallback="true"]').count();
      assert(fallbackCount>0,`Logo request failed offline but inline brand fallback was not installed: ${logoFailures.join(', ')}`);
    }

    await context.setOffline(false);
    offlineMode=false;
    await page.evaluate(()=>window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(250);
    assert((await page.textContent('#app')).includes('Private Equity'),'Online recovery replaced the current career with stale content');

    assert([...new Set(severe)].length===0,`State-resilience browser audit captured failures: ${[...new Set(severe)].join(' | ')} navEvents=${JSON.stringify(navEvents.slice(-12))}`);
    console.log('STATE RESILIENCE BROWSER AUDIT PASS: malformed state, repaired timestamps, Back/Forward, offline SPA navigation, inline logo fallback and online recovery');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});

function locationHash(value){return String(value||'');}
