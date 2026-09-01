const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
function assert(c,m){if(!c)throw new Error(m);}
function authStub(){return `(() => {const user={uid:'continuity-audit-user',email:'continuity@example.invalid',displayName:'Course Continuity'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'continuity-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);})();`;}
function assessmentPayload(){return {ok:true,pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},itemId:'part-5',itemType:'knowledge',masteryScore:80,questionCount:10,assessmentVersion:'2.0',questions:Array.from({length:10},(_,i)=>({id:`continuity-q${i+1}`,type:'mc',prompt:`Continuity question ${i+1}`,options:['Correct','Wrong A','Wrong B','Wrong C']})),writingPrompt:null};}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let assessmentGets=0, submitCalls=0, submitScore=70, serverPass=false, latestSubmittedScore=null;
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
      if(url.pathname==='/assessment/review/investment-banking/part-5'){
        if(latestSubmittedScore===null) return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'No saved attempt'})});
        const correct=Math.round(latestSubmittedScore/10);
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,review:{attemptId:serverPass?'continuity-pass':'continuity-failure',pathwayId:'investment-banking',itemId:'part-5',score:latestSubmittedScore,passed:serverPass,correct,total:10,submittedAt:'2026-09-01T12:00:00Z',questions:Array.from({length:10},(_,i)=>({id:`continuity-q${i+1}`,position:i+1,prompt:`Continuity question ${i+1}`,submitted:'Correct',correct:i<correct,correctAnswer:'Correct',rationale:i<correct?'Correct application.':'Review the underlying assumption.'}))}})});
      }
      if(url.pathname==='/assessment/submit'){
        submitCalls++;
        const score=submitScore;
        latestSubmittedScore=score;
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
      state.profile.accountUid='continuity-audit-user';state.profile.name='Course Continuity';state.profile.certificateName='Course Continuity';
      state.careers['investment-banking']={learningComplete:[1,2,3,4,5],completedParts:[1,2,3,4],quizScores:{1:90,2:90,3:90,4:90},simulationKnowledge:0,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null};
      localStorage.setItem(key,JSON.stringify(state));
      localStorage.setItem('capitalMasteryUserStateV1:continuity-audit-user',JSON.stringify(state));
      localStorage.setItem('capitalMasteryActiveUidV1','continuity-audit-user');
      window.CM?.refreshLocalState?.();
      history.pushState({},'', '#/quiz/investment-banking/5?retake=1&attempt=initial');
      window.CM_LIVE_ROUTE?.();
    });
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:15000});

    for(let i=1;i<=10;i++) await page.locator(`input[name="continuity-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForSelector('.cm-result.failed',{timeout:10000});
    assert(submitCalls===1,'First failed assessment should submit exactly once');
    await page.getByRole('link',{name:/Review saved attempt/}).click();
    await page.waitForSelector('.cm-server-assessment-review .cm-review-item',{timeout:10000});
    assert(/7 \/ 10/.test(await page.locator('.cm-server-assessment-review').innerText()),'Failed attempt review did not preserve the answer count');
    const getsBeforeRetry=assessmentGets;
    await page.getByRole('link',{name:/Retry assessment/}).click();
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000}).catch(async error=>{
      const snapshot=await page.evaluate(()=>({href:location.href,hash:location.hash,liveRoute:typeof window.CM_LIVE_ROUTE,continuity:!!window.CM_COURSE_CONTINUITY,track:localStorage.getItem('capitalMasteryTrainingTrackV1:investment-banking'),activeUid:localStorage.getItem('capitalMasteryActiveUidV1'),state:JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null'),userState:JSON.parse(localStorage.getItem('capitalMasteryUserStateV1:continuity-audit-user')||'null'),main:(document.querySelector('#app main#main')?.innerText||'<main unavailable>').slice(0,2200),form:!!document.querySelector('#cm-official-form'),failed:!!document.querySelector('.cm-result.failed'),loading:!!document.querySelector('.cm-live-card')}));
      throw new Error(`Retry did not reopen secure form. assessmentGets=${assessmentGets}; submitCalls=${submitCalls}; snapshot=${JSON.stringify(snapshot)}; errors=${JSON.stringify(errors)}; cause=${error.message}`);
    });
    assert(assessmentGets>getsBeforeRetry,`Explicit Retry did not request a fresh secure assessment: before=${getsBeforeRetry}, after=${assessmentGets}, url=${page.url()}`);
    assert(/retake=1/.test(page.url())&&/attempt=\d+/.test(page.url()),`Retry did not own a unique retake route: ${page.url()}`);

    submitScore=90;
    for(let i=1;i<=10;i++) await page.locator(`input[name="continuity-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForSelector('.cm-result.passed,.cm-server-assessment-review,.cm-course-release-review,.cm-continuity-review',{timeout:10000});
    assert(submitCalls===2,'Passing retry should submit exactly once');

    const storedAfterPass=await page.evaluate(()=>JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null')?.careers?.['investment-banking']?.simulationKnowledge||0);
    assert(Number(storedAfterPass)===90,`Secure pass was not mirrored into learner state: ${storedAfterPass}`);
    await page.evaluate(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user:window.CM_AUTH.user,isAdmin:false,backendVerified:true}})));
    await page.waitForTimeout(60);
    const storedAfterRepeatedAuth=await page.evaluate(()=>JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null')?.careers?.['investment-banking']?.simulationKnowledge||0);
    assert(Number(storedAfterRepeatedAuth)===90,`Repeated same-user auth event rolled back the recorded pass: ${storedAfterRepeatedAuth}`);

    const getsAfterPass=assessmentGets;
    await page.evaluate(()=>{location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    const passCta=page.getByRole('link',{name:/^Continue — assessment already passed/});
    await passCta.waitFor({state:'visible',timeout:10000}).catch(async error=>{
      const snapshot=await page.evaluate(()=>({href:location.href,actions:document.querySelector('.lesson-actions')?.innerHTML||'',state:JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null'),main:(document.querySelector('#app main#main')?.innerText||'').slice(0,1800)}));
      throw new Error(`Reviewed lesson never stabilized into saved-pass Continue CTA. snapshot=${JSON.stringify(snapshot)}; cause=${error.message}`);
    });
    assert(/90%/.test(await passCta.textContent()),'Saved-pass lesson CTA did not show best score');
    assert((await passCta.getAttribute('href'))==='#/role-lab/investment-banking','Professional Readiness Part 5 should continue directly to the Role Lab, not retake the quiz');
    await passCta.click();
    await page.waitForFunction(()=>location.hash==='#/role-lab/investment-banking',null,{timeout:10000});
    assert(assessmentGets===getsAfterPass,'Clicking Next/Continue after reviewing a passed lesson must not reopen the quiz');

    await page.evaluate(()=>{location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('[data-cm-review-passed]',{timeout:10000});
    await page.locator('[data-cm-review-passed]').first().click();
    await page.waitForSelector('.cm-server-assessment-review .cm-review-item',{timeout:10000});
    assert(await page.locator('#cm-official-form').count()===0,'Reviewing an already-passed assessment should not silently open a blank quiz');
    const savedPassReviewText=await page.locator('.cm-server-assessment-review').innerText();
    assert(/90%/.test(savedPassReviewText),`Saved-pass review did not preserve best score: ${JSON.stringify(savedPassReviewText.slice(0,800))}`);
    assert(await page.getByRole('link',{name:/Retake assessment/i}).count()===0,'A permanent saved pass must not expose a retake action');
    const getsBeforeForgery=assessmentGets, submitsBeforeForgery=submitCalls;
    await page.evaluate(()=>{location.hash='#/quiz/investment-banking/5?retake=1&attempt=forged-after-pass';});
    await page.waitForSelector('.cm-server-assessment-review,.cm-course-release-review,.cm-continuity-review',{timeout:10000});
    assert(await page.locator('#cm-official-form').count()===0,'A forged retake hash reopened a permanently passed assessment');
    assert(assessmentGets===getsBeforeForgery&&submitCalls===submitsBeforeForgery,'A forged retake hash reached assessment generation or submission after pass');

    await page.evaluate(()=>{
      const key='capitalMasteryLocalStateV1';const s=JSON.parse(localStorage.getItem(key));
      s.careers['investment-banking'].simulationKnowledge=0;
      localStorage.setItem(key,JSON.stringify(s));window.CM?.refreshLocalState?.();
      location.hash='#/learn/investment-banking/5';
    });
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    await page.waitForFunction(()=>[...document.querySelectorAll('.lesson-actions')].some(actions=>/Continue — assessment already passed/.test(actions.innerText||'')&&/90%/.test(actions.innerText||'')),null,{timeout:10000}).catch(async error=>{
      const snapshot=await page.evaluate(()=>({href:location.href,actions:[...document.querySelectorAll('.lesson-actions')].map(x=>x.innerText),state:JSON.parse(localStorage.getItem('capitalMasteryLocalStateV1')||'null')}));
      throw new Error(`Authoritative server progress did not restore a stable pass after local score was cleared. snapshot=${JSON.stringify(snapshot)}; cause=${error.message}`);
    });

    await page.evaluate(()=>{localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking','career-skills');location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('.lesson-actions',{timeout:10000});
    const careerSkillsContinue=page.getByRole('link',{name:/^Continue — assessment already passed/});
    await careerSkillsContinue.waitFor({state:'visible',timeout:10000});
    await page.waitForFunction(()=>[...document.querySelectorAll('.lesson-actions a')].some(a=>/^Continue — assessment already passed/.test(a.textContent||'')&&a.getAttribute('href')==='#/official-simulation/investment-banking'),null,{timeout:10000});
    assert((await careerSkillsContinue.getAttribute('href'))==='#/official-simulation/investment-banking','Career Skills Part 5 should continue to its practical capstone after the knowledge check pass');

    assert(errors.length===0,`Course continuity browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('COURSE PASS CONTINUITY BROWSER AUDIT PASS: 70% retries cleanly; 90% pass remains permanent through review, forged routes, and repeated auth; Next skips completed quiz; server restores pass cross-device; PR/CS continuation stays track-aware');
  } finally { await context.close(); await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
