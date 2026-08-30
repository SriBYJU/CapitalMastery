const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const ORG_ID = 'org-role-audit';

function assert(condition,message){ if(!condition) throw new Error(message); }

function authStub(role){
  return `(() => {
    const user={uid:'role-${role}',email:'${role}@example.invalid',displayName:'Role Audit'};
    window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'role-audit-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
    setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
  })();`;
}

async function mockWorker(route,role){
  const url=new URL(route.request().url());
  const path=url.pathname;
  let payload={ok:true};
  if(path==='/enterprise/catalog') payload={ok:true,pathways:[{id:'investment-banking',title:'Investment Banking'}],credentialLadder:[]};
  else if(path===`/enterprise/organizations/${ORG_ID}`) payload={ok:true,organization:{id:ORG_ID,name:'Role Matrix Capital'},membership:{role}};
  else if(path===`/enterprise/organizations/${ORG_ID}/cohorts`) payload={ok:true,cohorts:[]};
  else if(path===`/enterprise/organizations/${ORG_ID}/assignments`) payload={ok:true,assignments:[]};
  else if(path===`/enterprise/organizations/${ORG_ID}/readiness-report`) payload={ok:true,summary:{learners:0,cohorts:0,assignments:0},assignments:[]};
  else if(path==='/enterprise/me') payload={ok:true,organizations:[{id:ORG_ID,name:'Role Matrix Capital',role}]};
  else if(path==='/auth-check') payload={ok:true,isAdmin:false};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
}

async function openRole(browser,role){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(({uid})=>localStorage.setItem(`cmCredentialNameOnboardedV3:${uid}`,'true'),{uid:`role-${role}`});
  await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub(role)}));
  await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
  await context.route(`${WORKER}/**`,route=>mockWorker(route,role));
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Firebase|Failed to fetch|favicon/i.test(m.text()))errors.push(`console:${m.text()}`)});
  await page.goto(`${BASE}/#/employer/${ORG_ID}`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('.cmv2-role-capability-strip',{timeout:15000});
  return {context,page,errors};
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const matrix={
    owner:{assign:true,content:true,reports:true,review:true,people:true,audit:true},
    training_admin:{assign:true,content:true,reports:true,review:true,people:true,audit:true},
    content_manager:{assign:false,content:true,reports:false,review:false,people:false,audit:false},
    manager:{assign:false,content:false,reports:true,review:true,people:false,audit:false},
    viewer:{assign:false,content:false,reports:true,review:false,people:false,audit:false}
  };
  try{
    for(const [role,expected] of Object.entries(matrix)){
      const {context,page,errors}=await openRole(browser,role);
      const appText=await page.textContent('#app');
      assert((appText||'').toLowerCase().includes(role.replace(/_/g,' ')),`${role}: command center did not identify current role`);

      const visible=async href=>await page.locator(`a[href="${href}"]`).count()>0;
      assert((await visible(`#/employer/${ORG_ID}/quick-assign`))===expected.assign,`${role}: Quick Assign visibility mismatch`);
      assert(await visible(`#/employer/${ORG_ID}/curriculum`),`${role}: curriculum entry should remain visible`);
      assert((await visible(`#/employer/${ORG_ID}/reports`))===expected.reports,`${role}: Readiness Reports visibility mismatch`);
      assert((await visible(`#/employer/${ORG_ID}/team`))===expected.people,`${role}: Team & Roles visibility mismatch`);
      assert((await visible(`#/employer/${ORG_ID}/audit`))===expected.audit,`${role}: Audit Log visibility mismatch`);

      const strip=await page.locator('.cmv2-role-capability-strip').innerText();
      for(const [needle,want] of [
        ['Assign programs',expected.assign],['Manage Firm Layer',expected.content],['View learner reports',expected.reports],['Review learners',expected.review],['Manage access',expected.people]
      ]){
        const row=page.locator('.cmv2-role-capabilities span',{hasText:needle});
        assert(await row.count()===1,`${role}: missing capability label ${needle}`);
        assert((await row.getAttribute('class')||'').includes(want?'yes':'no'),`${role}: capability strip mismatch for ${needle}; strip=${strip}`);
      }

      if(!expected.assign){
        await page.evaluate(id=>{location.hash=`#/employer/${id}/quick-assign`;},ORG_ID);
        await page.waitForTimeout(250);
        const denied=await page.textContent('#app');
        assert(/Assignment management is not part of/i.test(denied||'')&&/Owners and Training Admins/i.test(denied||''),`${role}: direct Quick Assign route did not fail least-privilege`);
      }
      if(!expected.reports){
        await page.evaluate(id=>{location.hash=`#/employer/${id}/reports`;},ORG_ID);
        await page.waitForTimeout(250);
        const denied=await page.textContent('#app');
        assert(/LEAST-PRIVILEGE ACCESS/i.test(denied||'')&&/learner reporting is not part of/i.test(denied||''),`${role}: direct report route did not fail least-privilege`);
      }

      assert(errors.length===0,`${role}: browser runtime errors: ${[...new Set(errors)].join(' | ')}`);
      await context.close();
    }
    console.log('EMPLOYER ROLE MATRIX BROWSER AUDIT PASS: owner, training admin, content manager, manager and viewer UI/direct-route boundaries verified');
  } finally {
    await browser.close();
  }
})().catch(err=>{console.error(err);process.exit(1)});
