const {chromium}=require('playwright');

const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const A={uid:'account-a',email:'a@example.invalid',displayName:'Account Alpha'};
const B={uid:'account-b',email:'b@example.invalid',displayName:'Account Beta'};
const STATE_KEY='capitalMasteryLocalStateV1';
const USER_PREFIX='capitalMasteryUserStateV1:';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const state=(user,careerMarker)=>({version:1,profile:{accountUid:user.uid,name:user.displayName,certificateName:user.displayName,certificateNameConfirmed:true},careers:careerMarker?{[careerMarker]:{learningComplete:[1],completedParts:[1],quizScores:{1:90},applied:{},simResponses:{}}}:{},credentials:[],preferences:{},createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'});

function authStub(){
  return `(()=>{const user=${JSON.stringify(A)};window.CM_AUTH={ready:true,user,isAdmin:true,backendVerified:true,getIdToken:async()=>'switch-token',signOut:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:true,backendVerified:true}})),0)})();`;
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const errors=[];
  try{
    await context.addInitScript(({a,b,stateKey,userPrefix,stateA,stateB})=>{
      localStorage.setItem(stateKey,JSON.stringify(stateA));
      localStorage.setItem(userPrefix+a.uid,JSON.stringify(stateA));
      localStorage.setItem(userPrefix+b.uid,JSON.stringify(stateB));
      localStorage.setItem('capitalMasteryActiveUidV1',a.uid);
      localStorage.setItem(`cmCredentialNameOnboardedV3:${a.uid}`,'true');
      localStorage.setItem(`cmCredentialNameOnboardedV3:${b.uid}`,'true');
    },{a:A,b:B,stateKey:STATE_KEY,userPrefix:USER_PREFIX,stateA:state(A,'investment-banking'),stateB:state(B,'private-equity')});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));

    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${BASE}/#/admin-preview`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('.admin-state',{timeout:15000});
    assert((await page.locator('.admin-state').innerText()).includes('account-a'),'Initial app state did not belong to account A');

    await page.evaluate(user=>{
      window.CM_AUTH.user=user;
      window.CM_AUTH.isAdmin=true;
      window.CM_AUTH.backendVerified=true;
      document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:true,backendVerified:true}}));
    },B);
    await page.waitForFunction(()=>document.querySelector('.admin-state')?.textContent.includes('account-b'),null,{timeout:10000});
    const switched=JSON.parse(await page.locator('.admin-state').innerText());
    assert(switched.profile.accountUid===B.uid,'Rendered app closure retained account A after switching to B');
    assert(switched.careers['private-equity']&&!switched.careers['investment-banking'],'Rendered account B contained account A progress');

    await page.evaluate(()=>window.CM.markPart('investment-banking',1));
    const saved=await page.evaluate(({stateKey,userPrefix,a,b})=>({shared:JSON.parse(localStorage.getItem(stateKey)),a:JSON.parse(localStorage.getItem(userPrefix+a.uid)),b:JSON.parse(localStorage.getItem(userPrefix+b.uid))}),{stateKey:STATE_KEY,userPrefix:USER_PREFIX,a:A,b:B});
    assert(saved.shared.profile.accountUid===B.uid&&saved.b.profile.accountUid===B.uid,'A post-switch app write was not owned by account B');
    assert(saved.shared.careers['investment-banking'],'Account B did not receive its own post-switch mutation');
    assert(saved.b.profile.accountUid===B.uid&&saved.b.careers['private-equity'],'Account B cached snapshot was replaced with another account');
    assert(saved.a.profile.accountUid===A.uid&&saved.a.careers['investment-banking'].quizScores['1']===90,'Account A snapshot was changed by account B');
    assert(errors.length===0,`Account-switch browser errors: ${errors.join(' | ')}`);
    console.log('ACCOUNT SWITCH APP STATE BROWSER AUDIT PASS: same-tab auth changes replace in-memory state before render/write and preserve both per-user snapshots');
  }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
