const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
function assert(c,m){if(!c)throw new Error(m);}

function authStub(){return `(() => {
  const user={uid:'course-state-audit-user',email:'course-state@example.invalid',displayName:'Course Audit'};
  window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'course-state-token',googleSignIn:async()=>user,emailSignIn:async()=>user,emailCreate:async()=>user,signOut:async()=>{},resetPassword:async()=>{},deleteAccount:async()=>{}};
  setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0);
})();`;}

function assessmentPayload(){
  return {
    ok:true,
    pathway:{id:'investment-banking',title:'Investment Banking',role:'Investment Banking Analyst'},
    itemId:'part-5',itemType:'knowledge',masteryScore:80,questionCount:10,assessmentVersion:'2.0',
    questions:Array.from({length:10},(_,i)=>({id:`audit-q${i+1}`,type:'mc',prompt:`Audit question ${i+1}`,options:['Correct','Wrong A','Wrong B','Wrong C']})),
    writingPrompt:null
  };
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  let assessmentGets=0;
  let submitCalls=0;
  let submitScore=70;
  const errors=[];
  try{
    await context.addInitScript(()=>localStorage.setItem('cmCredentialNameOnboardedV3:course-state-audit-user','true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
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
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,score,passed:score>=80,objectiveTotal:10,objectiveCorrect:Math.round(score/10),writingScore:null,issuedCredentials:[]})});
      }
      if(url.pathname.startsWith('/progress/')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,progress:[]})});
      if(url.pathname==='/credentials/me') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,credentials:[],programCompletions:[]})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
    });

    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(`pageerror:${e.message}`));
    page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))errors.push(`console:${m.text()}`);});
    await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#app main#main',{timeout:15000});

    await page.evaluate(()=>{
      const key='capitalMasteryLocalStateV1';
      const state=JSON.parse(localStorage.getItem(key)||'{"version":1,"careers":{},"credentials":[],"profile":{"name":"Course Audit"}}');
      state.version=1; state.careers=state.careers||{}; state.credentials=state.credentials||[]; state.profile=state.profile||{name:'Course Audit'};
      state.careers['investment-banking']={learningComplete:[1,2,3,4,5],completedParts:[1,2,3,4],quizScores:{1:90,2:90,3:90,4:90},simulationKnowledge:0,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null};
      localStorage.setItem(key,JSON.stringify(state));
      window.CM?.refreshLocalState?.();
      location.hash='#/quiz/investment-banking/5?retake=1&attempt=initial';
    });
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:15000});
    const getsBeforeFail=assessmentGets;
    for(let i=1;i<=10;i++) await page.locator(`input[name="audit-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForFunction(()=>document.querySelector('.cm-result.failed')||document.querySelector('.cm-live-error'),null,{timeout:10000}).catch(async error=>{
      const snapshot=await page.locator('#app main#main').innerText().catch(()=>'<main unavailable>');
      throw new Error(`Failed attempt did not reach result UI. submitCalls=${submitCalls}; assessmentGets=${assessmentGets}; url=${page.url()}; main=${JSON.stringify(snapshot.slice(0,1600))}; errors=${JSON.stringify(errors)}; cause=${error.message}`);
    });
    assert(submitCalls===1,`Expected one server submit for first attempt, got ${submitCalls}`);
    assert(await page.locator('.cm-live-error').count()===0,`First submit rendered error: ${await page.locator('.cm-live-error').allTextContents()}`);
    assert(await page.locator('.cm-result.failed').count()===1,'Expected reproduced 70% failed result');
    assert((await page.locator('.cm-result-score').textContent()).trim()==='70%','Expected reproduced 70% failed result');
    const retry=page.getByRole('link',{name:/Try Again/});
    assert(await retry.count()===1,'Failed result missing Try Again link');
    const retryHref=await retry.getAttribute('href');
    assert(/retake=1/.test(retryHref||'')&&/attempt=\d+/.test(retryHref||''),`Retry href is not unique: ${retryHref}`);
    await retry.click();
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000});
    assert(assessmentGets>getsBeforeFail,'Try Again did not request/render a fresh assessment');
    assert(/retake=1/.test(page.url()),'Retry route lost explicit retake mode');

    submitScore=90;
    for(let i=1;i<=10;i++) await page.locator(`input[name="audit-q${i}"]`).first().check();
    await page.locator('#cm-official-form button[type="submit"]').click();
    await page.waitForSelector('.cm-result.passed',{timeout:10000});
    assert(submitCalls===2,`Expected two server submits after retake, got ${submitCalls}`);
    assert((await page.locator('.cm-result-score').textContent()).trim()==='90%','Expected 90% passed result');

    await page.evaluate(()=>{location.hash='#/learn/investment-banking/5';});
    await page.waitForSelector('.learning-shell',{timeout:10000});
    const learningText=await page.locator('#app main#main').innerText();
    assert(/Review passed knowledge check · 90%/.test(learningText),'Learning page forgot saved Part 5 pass');

    const reviewLink=page.getByRole('link',{name:/Review passed knowledge check/});
    await reviewLink.click();
    await page.waitForSelector('.cm-assessment-review',{timeout:10000});
    const reviewText=await page.locator('.cm-assessment-review').innerText();
    assert(/already passed/i.test(reviewText),'Review route did not render saved-pass state');
    assert(/90%/.test(reviewText),'Review route did not preserve best score');
    assert(await page.locator('#cm-official-form').count()===0,'Review route silently started a new blank assessment');

    const optional=page.getByRole('link',{name:/Retake assessment \(optional\)/});
    assert(await optional.count()===1,'Saved pass review is missing explicit optional retake');
    const getsBeforeOptional=assessmentGets;
    await optional.click();
    await page.waitForSelector('.cm-official-shell #cm-official-form',{timeout:10000});
    assert(assessmentGets>getsBeforeOptional,'Optional retake did not open a fresh assessment');

    assert(errors.length===0,`Course assessment browser errors: ${[...new Set(errors)].join(' | ')}`);
    console.log('COURSE ASSESSMENT STATE BROWSER AUDIT PASS: 70% retry opens fresh attempt; 90% pass survives course review; retake is explicit and optional');
  }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
