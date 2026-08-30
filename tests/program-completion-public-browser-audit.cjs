const { chromium } = require('playwright');
const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const UID='program-completion-browser-audit';
const assert=(v,m)=>{if(!v)throw new Error(m);};
const activeRecord={ok:true,valid:true,recordType:'program_completion',credential:{recordType:'program_completion',credentialId:'CM-CS-IB-2026-AUDIT',completionId:'CM-CS-IB-2026-AUDIT',holderName:'Audit Learner',pathwayId:'investment-banking',level:'career',programCode:'career_skills',title:'Investment Banking Career Skills Program Completion Certificate',status:'active',standardVersion:'2.0',issuedAt:'2026-08-30T18:00:00Z',revokedAt:null,description:'Completed the Career Skills program after earning three verified Standard 2.0 credentials and passing the practical capstone. This is a program-completion certificate, not a sixth Standard 2.0 credential.'},evidence:[{type:'program_completion',title:'Career Skills practical capstone',score:88,minimumScore:80,requiredVerifiedCredentials:3,verifiedCredentials:[{level:'foundations',title:'Investment Banking Foundations Credential',standardVersion:'2.0',issuedAt:'2026-08-01'}]}]};
const revokedRecord={...activeRecord,valid:false,credential:{...activeRecord.credential,credentialId:'CM-CS-IB-2026-REVOKED',completionId:'CM-CS-IB-2026-REVOKED',status:'revoked',revokedAt:'2026-08-31T00:00:00Z'}};
function authStub(){return `(()=>{const user={uid:'${UID}',email:'audit@example.invalid',displayName:'Audit Learner'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'program-completion-audit-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);})();`;}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  try{
    await context.addInitScript(({uid})=>localStorage.setItem('cmCredentialNameOnboardedV3:'+uid,'true'),{uid:UID});
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,async r=>{
      const u=new URL(r.request().url());
      if(u.pathname==='/credentials/me') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,credentials:[{credential_id:'CM-IB-F-2026-AUDIT',public_token:'cred-token',pathway_id:'investment-banking',credential_level:'foundations',credential_title:'Investment Banking Foundations Credential',holder_name:'Audit Learner',status:'active',issued_at:'2026-08-01T00:00:00Z'}],programCompletions:[{completion_id:'CM-CS-IB-2026-AUDIT',public_token:'pc-active',pathway_id:'investment-banking',program_code:'career_skills',completion_title:'Investment Banking Career Skills Program Completion Certificate',status:'active',capstone_score:88,issued_at:'2026-08-30T18:00:00Z'}]})});
      if(u.pathname.startsWith('/enterprise/verify/')) return r.fulfill({status:404,contentType:'application/json',body:JSON.stringify({ok:false,error:'not found'})});
      if(u.pathname==='/verify/pc-active') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(activeRecord)});
      if(u.pathname==='/verify/pc-revoked') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(revokedRecord)});
      if(u.pathname.startsWith('/progress/')) return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[]})});
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
    });
    const page=await context.newPage();
    await page.goto(BASE+'/#/credentials',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('.cm-program-completion-card',{timeout:10000});
    const recordsText=await page.locator('#app').innerText();
    assert(/STANDARD 2\.0 CREDENTIALS/.test(recordsText),'Verified credential section missing');
    assert(/PROGRAM COMPLETIONS/.test(recordsText),'Program Completions section missing');
    assert(/Completion ID/.test(recordsText),'Program completion card must use Completion ID');
    assert(/Verify Program Completion/.test(recordsText),'Program completion verification action missing');
    assert(!/org_secret|assignment_secret|cohort_secret|uid_secret/.test(recordsText),'Private scope identifiers leaked on learner records page');
    await page.getByRole('link',{name:/Verify Program Completion/}).click();
    await page.waitForSelector('.cm-verification[data-record-type="program_completion"]',{timeout:10000});
    await page.waitForSelector('.cm-public-certificate-section',{timeout:10000});
    let text=await page.locator('#app').innerText();
    assert(/VERIFIED PROGRAM COMPLETION/.test(text),'Active public program-completion badge missing');
    assert(/not a sixth Standard 2\.0 credential/i.test(text),'Five-level boundary explanation missing on public verifier');
    assert(/Completion ID/.test(text),'Public verifier must use Completion ID');
    const certText=await page.locator('.cm-public-certificate-section').innerText();
    assert(/program-completion certificate/i.test(certText),'Printable program-completion certificate wording missing');
    assert(/COMPLETION ID/.test(certText),'Printable certificate must use Completion ID');
    assert(!/CREDENTIAL ID/.test(certText),'Printable program completion must not label its identifier Credential ID');
    assert(!/org_secret|assignment_secret|cohort_secret|uid_secret/.test(text),'Public verifier leaked private scope identifiers');

    await page.evaluate(()=>location.hash='#/verify/pc-revoked');
    await page.waitForFunction(()=>document.querySelector('.cm-verification[data-record-type="program_completion"]')?.textContent?.includes('REVOKED'),null,{timeout:10000});
    text=await page.locator('#app').innerText();
    assert(/PROGRAM COMPLETION REVOKED/.test(text),'Revoked program completion must render as revoked, not valid');
    await page.waitForSelector('.cm-public-certificate-section',{timeout:10000});
    const revokedCert=await page.locator('.cm-public-certificate-section').innerText();
    assert(/Program completion is not currently active/.test(revokedCert),'Revoked printable certificate proof must be inactive');
    console.log('PROGRAM COMPLETION PUBLIC BROWSER AUDIT PASS: separate listing, active verification, privacy boundary, certificate semantics and revocation');
  }finally{await context.close().catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});