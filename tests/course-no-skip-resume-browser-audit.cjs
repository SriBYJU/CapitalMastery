const {chromium}=require('playwright');

const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
function authStub(){return `(()=>{const user={uid:'no-skip-audit-user',email:'no-skip@example.invalid',displayName:'No Skip Audit'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'no-skip-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0)})();`;}
function assessmentPayload(itemId){return {ok:true,pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},itemId,itemType:'knowledge',masteryScore:80,questionCount:10,assessmentVersion:'2.0',questions:Array.from({length:10},(_,i)=>({id:`lock-q${i+1}`,type:'mc',prompt:`Protected question ${i+1}`,options:['Correct','Wrong A','Wrong B','Wrong C']})),writingPrompt:null};}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let assessmentGets=0, roleLabStarts=0;
  const errors=[];
  try{
    await context.addInitScript(()=>{
      const state={version:1,careers:{'investment-banking':{learningComplete:[],completedParts:[],quizScores:{},simulationKnowledge:null,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null}},credentials:[],profile:{name:'No Skip Audit',accountUid:'no-skip-audit-user'}};
      if(!localStorage.getItem('capitalMasteryLocalStateV1')) localStorage.setItem('capitalMasteryLocalStateV1',JSON.stringify(state));
      if(!localStorage.getItem('capitalMasteryUserStateV1:no-skip-audit-user')) localStorage.setItem('capitalMasteryUserStateV1:no-skip-audit-user',JSON.stringify(state));
      localStorage.setItem('capitalMasteryActiveUidV1','no-skip-audit-user');
      localStorage.setItem('cmCredentialNameOnboardedV3:no-skip-audit-user','true');
    });
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.pathname==='/auth-check') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:false})});
      if(url.pathname.startsWith('/progress/')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[]})});
      if(url.pathname==='/credentials/me') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,credentials:[],programCompletions:[]})});
      if(url.pathname.startsWith('/assessment/review/')) return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'No saved attempt'})});
      if(url.pathname.startsWith('/assessment/investment-banking/')){assessmentGets++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(assessmentPayload(url.pathname.split('/').pop()))});}
      if(url.pathname==='/enterprise/catalog') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,pathways:[{id:'investment-banking',title:'Investment Banking'}],credentialLadder:[],programCompletions:[]})});
      if(url.pathname==='/enterprise/role-labs/investment-banking') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,labs:[{labKey:'ib-role-lab',pathwayId:'investment-banking',roleTitle:'Investment Banking Analyst',title:'Orion Systems Transaction',clientName:'Orion Systems',passScore:80,scenario:{context:'A guided analyst workflow.',workflow:['Review the inbox','Build the transaction model']}}],access:{status:'locked',missing:['Applied Skills credential'],reason:'Complete Applied Skills credential before starting the Role Lab.'}})});
      if(url.pathname==='/enterprise/role-labs/ib-role-lab/start'){roleLabStarts++;return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Prerequisites incomplete'})});}
      if(url.pathname==='/enterprise/assessments/ib-professional-final/review') return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'No saved attempt'})});
      if(url.pathname==='/enterprise/assessments/ib-professional-final') return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Complete the Role Lab before starting the Professional Readiness Final.'})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
    });

    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`pageerror:${error.message}`));
    page.on('console',message=>{if(message.type()==='error'&&!/favicon|Failed to load resource/i.test(message.text()))errors.push(`console:${message.text()}`);});
    await page.goto(`${BASE}/#/quiz/investment-banking/1`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('.cm-course-locked-preview',{timeout:15000});
    let lockedText=await page.locator('.cm-course-locked-preview').innerText();
    assert(/LOOK AHEAD · READ-ONLY/i.test(lockedText)&&/Complete Part 1 learning/i.test(lockedText),'Direct Part 1 quiz did not explain its prerequisite');
    assert(await page.locator('#cm-official-form,.quiz-form').count()===0,'Direct Part 1 quiz exposed answer controls before learning completion');
    assert(!/Protected question 1/.test(lockedText),'Locked direct route leaked secure question content');

    await page.evaluate(()=>{location.hash='#/learn/investment-banking/3';});
    await page.waitForSelector('.cm-course-locked-preview',{timeout:10000});
    lockedText=await page.locator('.cm-course-locked-preview').innerText();
    assert(/Preview only|LOOK AHEAD · READ-ONLY/i.test(lockedText)&&/Complete Part 2/i.test(lockedText),'Future learning route was not a clear read-only preview');
    assert(await page.locator('#app main#main textarea,#app main#main form').count()===0,'Future learning preview exposed work controls');

    await page.evaluate(()=>{location.hash='#/learn/investment-banking/1';});
    await page.waitForSelector('.learning-shell',{timeout:10000});
    assert(await page.getByText('Complete learning to unlock assessment',{exact:true}).count()===1,'Current lesson did not make its locked assessment state clear');
    assert(await page.locator('a[href="#/quiz/investment-banking/1"]').count()===0,'Current lesson linked to the quiz before learning completion');
    await page.getByRole('button',{name:'Mark learning complete'}).click();
    await page.waitForFunction(()=>document.querySelector('a[href="#/quiz/investment-banking/1"]')&&/Learning complete/i.test(document.querySelector('.lesson-actions')?.innerText||''),null,{timeout:10000}).catch(async error=>{
      const snapshot=await page.evaluate(()=>({hash:location.hash,main:(document.querySelector('#app main#main')?.innerText||'').slice(-1200),actions:document.querySelector('.lesson-actions')?.innerHTML||'',state:JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null')}));
      throw new Error(`Learning completion did not unlock Part 1 assessment: ${JSON.stringify(snapshot)}; cause=${error.message}`);
    });

    await page.evaluate(()=>{location.hash='#/';});
    await page.waitForSelector('[data-cm-primary-resume] a',{timeout:10000});
    const resume=page.locator('[data-cm-primary-resume] a');
    assert((await resume.getAttribute('href'))==='#/quiz/investment-banking/1',`Primary resume skipped the newly unlocked Part 1 assessment: ${await resume.getAttribute('href')}`);
    assert(/Continue where you left off/.test(await resume.innerText()),'Primary resume action is not clearly labeled');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-cm-primary-resume] a',{timeout:10000});
    const reloadedResumeHref=await page.locator('[data-cm-primary-resume] a').getAttribute('href');
    assert(reloadedResumeHref==='#/quiz/investment-banking/1',`Reload lost or changed the exact resume destination: ${reloadedResumeHref}`);

    await page.evaluate(()=>{location.hash='#/quiz/investment-banking/2';});
    await page.waitForSelector('.cm-course-locked-preview',{timeout:10000});
    assert(await page.locator('#cm-official-form,.quiz-form').count()===0,'Part 2 assessment could be started before Part 1 was passed');
    assert(/Pass Part 1 assessment/i.test(await page.locator('.cm-course-locked-preview').innerText()),'Part 2 lock did not identify the missing prerequisite');

    await page.evaluate(()=>{location.hash='#/quiz/investment-banking/1';});
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000});
    assert(assessmentGets>=2,'Newly unlocked Part 1 assessment was not available after learning completion');

    await page.evaluate(()=>{location.hash='#/final/investment-banking';});
    await page.waitForFunction(()=>location.hash==='#/career/investment-banking',null,{timeout:10000});
    assert(await page.locator('#cm-official-form,.quiz-form').count()===0,'Retired legacy final exposed controls instead of returning to the canonical pathway');
    await page.waitForFunction(()=>/legacy final is no longer a program gate|Professional Readiness uses the deeper Role Lab/i.test(document.querySelector('#app main#main')?.innerText||''),null,{timeout:3000});

    await page.evaluate(()=>{location.hash='#/role-lab/investment-banking';});
    await page.waitForFunction(()=>/LOCKED FOR NOW/.test(document.querySelector('#app main#main')?.innerText||''),null,{timeout:10000});
    assert(await page.locator('#cmv2-start-lab').count()===0,'Locked Role Lab exposed a start action');
    assert(roleLabStarts===0,'Viewing a locked Role Lab created a run');
    assert(/WHAT YOU WILL DO · READ-ONLY PREVIEW/.test(await page.locator('#app main#main').innerText()),'Locked Role Lab did not provide a safe workflow preview');

    await page.evaluate(()=>{location.hash='#/v2-assessment/ib-professional-final';});
    await page.waitForSelector('.cm-course-locked-preview',{timeout:10000});
    assert(await page.locator('#cmv2-v2-assessment').count()===0,'Professional Final exposed answer controls before Role Lab completion');
    assert(/Complete the Role Lab/.test(await page.locator('.cm-course-locked-preview').innerText()),'Professional Final lock did not identify the missing Role Lab');

    assert(errors.length===0,`No-skip/resume browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('COURSE NO-SKIP + RESUME BROWSER AUDIT PASS: direct/future routes remain read-only, prerequisites unlock in order, exact resume survives reload, Role Lab cannot start early, and Professional Final stays gated');
  }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
