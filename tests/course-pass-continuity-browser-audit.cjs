const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
function assert(c,m){if(!c)throw new Error(m);}
function authStub(){return `(() => {const user={uid:'continuity-audit-user',email:'continuity@example.invalid',displayName:'Course Continuity'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'continuity-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);})();`;}
function assessmentPayload(){return {ok:true,pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},itemId:'part-5',itemType:'knowledge',masteryScore:80,questionCount:10,assessmentVersion:'2.0',questions:Array.from({length:10},(_,i)=>({id:`continuity-q${i+1}`,type:'mc',prompt:`Continuity question ${i+1}`,options:['Correct','Wrong A','Wrong B','Wrong C']})),writingPrompt:null};}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let assessmentGets=0, submitCalls=0, submitScore=70, serverPass=false;
  const errors=[];
  try{
    await context.addInitScript(()=>localStorage.setItem('cmCredentialNameOnboardedV3:continuity-audit-user','true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/auth-check') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:false})});
      if(url.pathname==='/assessment/investment-banking/part-5'){
        assessmentGets++;
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(assessmentPayload())});
      }
      if(url.pathname==='/assessment/submit'){
        submitCalls++;
        const score=submitScore;
        if(score>=80) serverPass=true;
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,score,passed:score>=80,objectiveTotal:10,objectiveCorrect:Math.round(score/10),writingScore:null,issuedCredentials:[]})});
      }
      if(url.pathname==='/progress/investment-banking') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:serverPass?[{item_id:'part-5',completed:1,best_score:90}]:[]})});
      if(url.pathname==='/credentials/me') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,credentials:[],programCompletions:[]})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[]})});
    });

    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
    page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(`console:${m.text()}`);});
    await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#app main#main',{timeout:15000});
    await page.evaluate(()=>{
      const key='capitalMasteryLocalStateV1';
      const state=JSON.parse(localStorage.getItem(key)||'{"version":1,"careers":{},"credentials":[],"profile":{"name":"Course Continuity"}}');
      state.version=1;state.careers=state.careers||{};state.credentials=state.credentials||[];state.profile=state.profile||{name:'Course Continuity'};
      state.careers['investment-banking']={learningComplete:[1,2,3,4,5],completedParts:[1,2,3,4],quizScores:{1:90,2:90,3:90,4:90},simulationKnowledge:0,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null};
      localStorage.setItem(key,JSON.stringify(state));window.CM?.refreshLocalState?.();
      history.pushState({},'', '#/quiz/investment-banking/5?retake=1&attempt=initial');
      window.CM_LIVE_ROUTE?.();
    });
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:15000});

    for(let i=1;i<=10;i++) await page.locator(`input[name="continuity-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForSelector('.cm-result.failed',{timeout:10000});
    assert(submitCalls===1,'First failed assessment should submit exactly once');
    const getsBeforeRetry=assessmentGets;
    await page.getByRole('link',{name:/Try Again/}).click();
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000});
    assert(assessmentGets>getsBeforeRetry,`Try Again did not request a fresh secure assessment: before=${getsBeforeRetry}, after=${assessmentGets}, url=${page.url()}`);
    assert(/retake=1/.test(page.url())&&/attempt=\d+/.test(page.url()),`Retry did not own a unique retake route: ${page.url()}`);

    submitScore=90;
    for(let i=1;i<=10;i++) await page.locator(`input[name="continuity-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForSelector('.cm-result.passed',{timeout:10000});
    assert(submitCalls===2,'Passing retry should submit exactly once');

    const getsAfterPass=assessmentGets;
    await page.evaluate(()=>{location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    await page.waitForFunction(()=>/assessment already passed/i.test(document.querySelector('.lesson-actions')?.innerText||''),null,{timeout:10000});
    const passCta=page.locator('.lesson-actions [data-cm-passed-assessment="true"]');
    assert(await passCta.count()===1,'Reviewed lesson did not replace quiz CTA with saved-pass Continue');
    assert(/90%/.test(await passCta.textContent()),'Saved-pass lesson CTA did not show best score');
    assert((await passCta.getAttribute('href'))==='#/career/investment-banking','Professional Readiness Part 5 should continue to the pathway/Role Lab sequence, not retake the quiz');
    await passCta.click();
    await page.waitForFunction(()=>location.hash==='#/career/investment-banking',null,{timeout:10000});
    assert(assessmentGets===getsAfterPass,'Clicking Next/Continue after reviewing a passed lesson must not reopen the quiz');

    await page.evaluate(()=>{location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('[data-cm-review-passed]',{timeout:10000});
    await page.locator('[data-cm-review-passed]').click();
    await page.waitForSelector('.cm-continuity-review',{timeout:10000});
    assert(await page.locator('#cm-official-form').count()===0,'Reviewing an already-passed assessment should not silently open a blank quiz');
    assert(/90%/.test(await page.locator('.cm-continuity-review').innerText()),'Saved-pass review did not preserve best score');

    const getsBeforeOptional=assessmentGets;
    await page.getByRole('link',{name:/Retake assessment \(optional\)/}).click();
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000});
    assert(assessmentGets>getsBeforeOptional,'Explicit optional retake did not open a fresh secure assessment');

    await page.evaluate(()=>{
      const key='capitalMasteryLocalStateV1';const s=JSON.parse(localStorage.getItem(key));
      s.careers['investment-banking'].simulationKnowledge=0;
      localStorage.setItem(key,JSON.stringify(s));window.CM?.refreshLocalState?.();
      location.hash='#/learn/investment-banking/5';
    });
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    await page.waitForFunction(()=>/assessment already passed/i.test(document.querySelector('.lesson-actions')?.innerText||''),null,{timeout:10000});
    assert(/90%/.test(await page.locator('.lesson-actions').innerText()),'Authoritative server progress did not restore a pass after local score was cleared');

    await page.evaluate(()=>{localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking','career-skills');location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    await page.waitForFunction(()=>document.querySelector('.lesson-actions [data-cm-passed-assessment="true"]')?.getAttribute('href')==='#/official-simulation/investment-banking',null,{timeout:10000});
    assert((await page.locator('.lesson-actions [data-cm-passed-assessment="true"]').getAttribute('href'))==='#/official-simulation/investment-banking','Career Skills Part 5 should continue to its practical capstone after the knowledge check pass');

    assert(errors.length===0,`Course continuity browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('COURSE PASS CONTINUITY BROWSER AUDIT PASS: 70% retries cleanly; 90% pass survives lesson review; Next skips completed quiz; server restores pass cross-device; PR/CS continuation stays track-aware');
  } finally { await context.close(); await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
