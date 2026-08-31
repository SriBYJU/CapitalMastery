const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const PENDING_INVITE = 'cmPendingEnterpriseInviteV2';
const EMPLOYER_INTENT = 'cmEmployerOnboardingIntentV2';
const PENDING_ROUTE = 'cmPendingLearningRouteV1';

function assert(value,message){if(!value)throw new Error(message);}

function mutableAuthStub(){
  return `(() => {
    let user=null;
    window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=>user?'invite-audit-token':null,googleSignIn:async()=>null,emailSignIn:async()=>null,emailCreate:async()=>null,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
    window.CM_TEST_SIGN_IN=()=>{user={uid:'invite-user',email:'learner@example.com',displayName:'Invite Audit Learner'};window.CM_AUTH.user=user;document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}}));};
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user:null,isAdmin:false,backendVerified:true}})),0);
  })();`;
}

async function contextFor(browser,{acceptStatus=200,previewStatus=200}={}){
  const accepted=[];
  const context=await browser.newContext({viewport:{width:1280,height:850}});
  await context.addInitScript(({EMPLOYER_INTENT})=>{
    localStorage.setItem(EMPLOYER_INTENT,'1');
    localStorage.setItem('cmCredentialNameOnboardedV3:invite-user','true');
  },{EMPLOYER_INTENT});
  await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:mutableAuthStub()}));
  await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
  await context.route(`${WORKER}/**`,async route=>{
    const request=route.request();
    const url=new URL(request.url());
    let status=200;
    let payload={ok:true};
    if(url.pathname==='/enterprise/catalog') payload={ok:true,pathways:[{id:'investment-banking',title:'Investment Banking'}],credentialLadder:[]};
    else if(url.pathname==='/auth-check') payload={ok:true,isAdmin:false};
    else if(url.pathname.startsWith('/enterprise/invites/preview/')){
      status=previewStatus;
      payload=previewStatus===200
        ? {ok:true,invite:{organizationName:'Northstar Advisory',cohortName:'2027 Analyst Cohort',pathwayTitle:'Investment Banking',expiresAt:'2027-06-30T00:00:00Z'}}
        : {ok:false,error:'Invitation has expired'};
    }else if(url.pathname==='/enterprise/invites/accept'){
      accepted.push(JSON.parse(request.postData()||'{}'));
      status=acceptStatus;
      payload=acceptStatus===200
        ? {ok:true,organizationId:'org-invite',cohortId:'cohort-invite',role:'learner'}
        : {ok:false,error:'This invite was issued to a different email address'};
    }else if(url.pathname==='/enterprise/learner/assignments') payload={ok:true,assignments:[]};
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(payload)});
  });
  return {context,accepted};
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    {
      const {context}=await contextFor(browser);
      const page=await context.newPage();
      await page.goto(`${BASE}/#/assigned`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('.cmv2-auth-gate a.btn-primary',{timeout:15000});
      const cta=page.locator('.cmv2-auth-gate a.btn-primary');
      assert(await cta.getAttribute('href')==='#/login','Signed-out employee was not sent to the shared account login');
      assert(!/Employer Sign in/i.test(await cta.textContent()||''),'Signed-out employee still sees the employer-onboarding CTA');
      const state=await page.evaluate(({PENDING_ROUTE,EMPLOYER_INTENT})=>({pending:sessionStorage.getItem(PENDING_ROUTE),employerIntent:localStorage.getItem(EMPLOYER_INTENT)}),{PENDING_ROUTE,EMPLOYER_INTENT});
      assert(state.pending==='#/assigned',`Employee destination was not preserved: ${JSON.stringify(state)}`);
      assert(state.employerIntent===null,'Employee route did not clear stale employer-onboarding intent');
      await context.close();
    }

    {
      const {context,accepted}=await contextFor(browser);
      const page=await context.newPage();
      await page.goto(`${BASE}/#/join/invite_success`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('.cmv2-invite-preview',{timeout:15000});
      const copy=await page.textContent('#app');
      assert(/Northstar Advisory/.test(copy||'')&&/2027 Analyst Cohort/.test(copy||''),'Invitation preview lacks employer/cohort context');
      await page.locator('.cmv2-auth-gate a.btn-primary').click();
      await page.waitForFunction(()=>location.hash.startsWith('#/login'));
      await page.evaluate(()=>window.CM_TEST_SIGN_IN());
      await page.waitForFunction(()=>location.hash==='#/assigned',{timeout:10000});
      assert(accepted.some(body=>body.token==='invite_success'),'Post-auth invitation acceptance did not submit the original secure token');
      assert(await page.evaluate(key=>localStorage.getItem(key),PENDING_INVITE)===null,'Accepted invitation remained pending in local storage');
      await context.close();
    }

    {
      const {context}=await contextFor(browser,{acceptStatus:403});
      const page=await context.newPage();
      await page.goto(`${BASE}/#/join/invite_wrong_email`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('.cmv2-invite-preview',{timeout:15000});
      await page.locator('.cmv2-auth-gate a.btn-primary').click();
      await page.waitForFunction(()=>location.hash.startsWith('#/login'));
      await page.evaluate(()=>window.CM_TEST_SIGN_IN());
      await page.waitForFunction(()=>/Invitation email does not match/i.test(document.querySelector('#app')?.textContent||''),{timeout:10000});
      assert(await page.evaluate(key=>localStorage.getItem(key),PENDING_INVITE)==='invite_wrong_email','Wrong-email invitation should remain available for sign-out and correct-account retry');
      await context.close();
    }

    {
      const {context}=await contextFor(browser,{previewStatus:410});
      const page=await context.newPage();
      await page.goto(`${BASE}/#/join/invite_expired`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>/Invitation unavailable/i.test(document.querySelector('#app')?.textContent||''),{timeout:10000});
      assert(await page.evaluate(key=>localStorage.getItem(key),PENDING_INVITE)===null,'Expired invitation remained pending and would poison later sign-ins');
      await context.close();
    }

    console.log('EMPLOYER / EMPLOYEE INVITE BROWSER AUDIT PASS: learner login return, contextual invite, post-auth acceptance, mismatch recovery and expiry cleanup verified');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
