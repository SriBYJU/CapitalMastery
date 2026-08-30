const { chromium } = require('playwright');
const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const UID = 'admin-simulation-stability-audit';
const QA_KEY = 'capitalMasteryQaPreviewV1';
function assert(v,m){if(!v)throw new Error(m);}
function authStub(){
  return "(() => { const user={uid:'"+UID+"',email:'admin-sim@example.invalid',displayName:'Admin Simulation Audit'}; window.CM_AUTH={ready:false,user:null,isAdmin:false,backendVerified:false,getIdToken:async()=> 'admin-sim-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}}; setTimeout(()=>{window.CM_AUTH.ready=true;window.CM_AUTH.user=user;document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:false}}));},120); setTimeout(()=>{window.CM_AUTH.isAdmin=true;window.CM_AUTH.backendVerified=true;document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:true,backendVerified:true}}));},420); })();";
}
async function installArtifactWatch(page){
  await page.evaluate(() => {
    window.__cmPreviewArtifacts=[];
    window.__cmPreviewObserver?.disconnect?.();
    const scan=()=>{
      const app=document.getElementById('app');
      if(!app)return;
      const text=app.textContent||'';
      if(/Loading secure assessment|SECURE CAPITAL MASTERY/i.test(text)) window.__cmPreviewArtifacts.push('secure-assessment-render');
      if(app.querySelector('.hero') && /Master finance careers/i.test(text)) window.__cmPreviewArtifacts.push('home-render');
      if(/Not available yet/i.test(text)) window.__cmPreviewArtifacts.push('stale-secure-error');
    };
    const app=document.getElementById('app');
    if(app){window.__cmPreviewObserver=new MutationObserver(scan);window.__cmPreviewObserver.observe(app,{childList:true,subtree:true,characterData:true});scan();}
  });
}
async function stableState(page,label,wait=900){
  await page.waitForSelector('.sim-shell',{timeout:10000});
  await page.waitForTimeout(wait);
  const s=await page.evaluate(()=>({hash:location.hash,sim:!!document.querySelector('.sim-shell'),secure:!!document.querySelector('.cm-live-card'),artifacts:[...(window.__cmPreviewArtifacts||[])],text:(document.querySelector('#app')?.textContent||'').slice(0,5000)}));
  assert(s.sim,label+': simulation shell missing');
  assert(!s.secure,label+': secure renderer owns the Admin preview DOM');
  assert(!/Loading secure assessment|SECURE CAPITAL MASTERY|Not available yet/i.test(s.text),label+': secure assessment UI remains visible');
  assert(s.artifacts.length===0,label+': transient route collision detected: '+JSON.stringify(s.artifacts));
  return s;
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  let secureRequests=0;
  try{
    await context.addInitScript(({uid})=>{localStorage.removeItem('capitalMasteryQaPreviewV1');localStorage.setItem('cmCredentialNameOnboardedV3:'+uid,'true');},{uid:UID});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    await context.route(/\/assessment\//,async r=>{secureRequests++;await new Promise(resolve=>setTimeout(resolve,700));await r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'delayed secure audit failure'})}).catch(()=>{});});
    const page=await context.newPage();

    // Real auth lifecycle: admin route is requested before Firebase and backend role verification settle.
    await page.goto(BASE+'/#/admin-preview',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('[data-cm-admin-sim-preview]',{timeout:10000});
    assert(await page.evaluate(()=>window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true),'Admin backend verification did not settle');
    await installArtifactWatch(page);
    await page.click('[data-cm-admin-sim-preview]');
    let s=await stableState(page,'Admin preview click after delayed role verification');
    assert(s.hash==='#/admin-preview/simulation/investment-banking','Admin preview must use protected Admin namespace, got '+s.hash);
    assert(secureRequests===0,'Admin preview click must never call secure learner assessment API');

    await page.goBack();
    await page.waitForSelector('[data-cm-admin-sim-preview]',{timeout:10000});
    await installArtifactWatch(page);
    await page.goForward();
    s=await stableState(page,'Back/Forward return');
    assert(s.hash==='#/admin-preview/simulation/investment-banking','Back/Forward returned to wrong Admin preview route: '+s.hash);

    // Legacy official route entered while verified Admin QA is active must be normalized without flashing secure UI.
    await installArtifactWatch(page);
    await page.evaluate(()=>{location.hash='#/official-simulation/investment-banking';});
    s=await stableState(page,'Legacy official route normalization');
    assert(s.hash==='#/admin-preview/simulation/investment-banking','Verified Admin QA official route did not normalize to protected preview namespace: '+s.hash);

    // Start a real secure request, then switch to Admin preview before its delayed response arrives.
    // A stale response/error must be aborted or ignored and can never repaint the Admin DOM.
    await page.evaluate(key=>{localStorage.removeItem(key);location.hash='#/official-simulation/investment-banking';},QA_KEY);
    await page.waitForSelector('.cm-live-card',{timeout:5000});
    await page.waitForTimeout(120);
    assert(secureRequests>=1,'Secure assessment race setup never issued the delayed request');
    await page.evaluate(key=>{localStorage.setItem(key,'true');location.hash='#/admin-preview/simulation/investment-banking';},QA_KEY);
    await installArtifactWatch(page);
    s=await stableState(page,'Delayed secure response after Admin navigation',1200);
    assert(s.hash==='#/admin-preview/simulation/investment-banking','Delayed response changed the protected Admin route: '+s.hash);

    console.log('ADMIN SIMULATION CRITICAL RACE AUDIT PASS: real auth timing, protected Admin route ownership, Back/Forward, legacy normalization, and stale secure-request cancellation are stable');
  }finally{await context.close().catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
