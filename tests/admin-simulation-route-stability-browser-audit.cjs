const { chromium } = require('playwright');
const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const UID = 'admin-simulation-stability-audit';
function assert(v,m){if(!v)throw new Error(m);}
function authStub(){
  return "(() => { const user={uid:'"+UID+"',email:'admin-sim@example.invalid',displayName:'Admin Simulation Audit'}; window.CM_AUTH={ready:true,user,isAdmin:true,backendVerified:true,getIdToken:async()=> 'admin-sim-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}}; setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:true,backendVerified:true}})),0); })();";
}
async function installArtifactWatch(page){
  await page.evaluate(() => {
    window.__cmPreviewArtifacts=[];
    window.__cmPreviewObserver?.disconnect?.();
    const scan=()=>{
      const app=document.getElementById('app');
      if(!app)return;
      const text=app.textContent||'';
      if(/Loading secure assessment|SECURE CAPITAL MASTERY/i.test(text)) window.__cmPreviewArtifacts.push('secure-assessment-loading');
      if(app.querySelector('.hero') && /Master finance careers/i.test(text)) window.__cmPreviewArtifacts.push('home-render');
    };
    const app=document.getElementById('app');
    if(app){ window.__cmPreviewObserver=new MutationObserver(scan); window.__cmPreviewObserver.observe(app,{childList:true,subtree:true,characterData:true}); }
  });
}
async function stableState(page,label){
  await page.waitForSelector('.sim-shell',{timeout:10000});
  await page.waitForTimeout(700);
  const s=await page.evaluate(()=>({hash:location.hash,sim:!!document.querySelector('.sim-shell'),secure:!!document.querySelector('.cm-live-card'),artifacts:[...(window.__cmPreviewArtifacts||[])]}));
  assert(s.sim,label+': simulation shell missing');
  assert(!s.secure,label+': secure assessment renderer stole the Admin QA preview');
  assert(s.artifacts.length===0,label+': transient route collision detected: '+JSON.stringify(s.artifacts));
  return s;
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  try{
    await context.addInitScript(({uid})=>{localStorage.setItem('capitalMasteryQaPreviewV1','true');localStorage.setItem('cmCredentialNameOnboardedV3:'+uid,'true');},{uid:UID});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    const page=await context.newPage();
    await page.goto(BASE+'/#/admin-preview',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('[data-cm-admin-sim-preview]',{timeout:10000});
    await installArtifactWatch(page);
    await page.click('[data-cm-admin-sim-preview]');
    let s=await stableState(page,'Admin preview click');
    assert(s.hash==='#/simulation/investment-banking','Admin preview click landed on wrong route: '+s.hash);

    await page.goBack();
    await page.waitForSelector('[data-cm-admin-sim-preview]',{timeout:10000});
    await installArtifactWatch(page);
    await page.goForward();
    s=await stableState(page,'Back/Forward return');
    assert(s.hash==='#/simulation/investment-banking','Back/Forward returned to wrong route: '+s.hash);

    await installArtifactWatch(page);
    await page.evaluate(()=>{location.hash='#/official-simulation/investment-banking';});
    s=await stableState(page,'Direct official route while Admin QA is active');
    assert(['#/simulation/investment-banking','#/official-simulation/investment-banking'].includes(s.hash),'Admin official route settled somewhere unexpected: '+s.hash);
    console.log('ADMIN SIMULATION ROUTE STABILITY BROWSER AUDIT PASS: click, direct route, Back and Forward never expose Home or secure-assessment loading during verified Admin QA preview');
  }finally{await context.close().catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
