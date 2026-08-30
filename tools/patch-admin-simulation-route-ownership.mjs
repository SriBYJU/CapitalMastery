import fs from 'node:fs';

function replaceOnce(path, before, after, label) {
  let src = fs.readFileSync(path, 'utf8');
  const at = src.indexOf(before);
  if (at < 0) throw new Error(`Missing patch target: ${label}`);
  if (src.indexOf(before, at + before.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  src = src.slice(0, at) + after + src.slice(at + before.length);
  fs.writeFileSync(path, src);
}

replaceOnce(
  'training-tracks.js',
  `  function adminQaPreviewActive() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.isAdmin === true &&\n      localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';\n  }`,
  `  function adminQaPreviewActive() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.backendVerified === true &&\n      window.CM_AUTH?.isAdmin === true &&\n      localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';\n  }`,
  'two-track Admin QA trust boundary'
);

replaceOnce(
  'admin-qa-simulation-fix.js',
  `  function isAdmin() {\n    return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true;\n  }`,
  `  function isAdmin() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.backendVerified === true &&\n      window.CM_AUTH?.isAdmin === true;\n  }`,
  'Admin QA helper verified-admin boundary'
);

replaceOnce(
  'capital-mastery-live.js',
  `    // Admin QA deliberately falls back to the local preview renderer for knowledge/final assessments.\n    // It does not call the authoritative submit endpoint, write D1 scores, or issue credentials.\n    if (adminQaPreview && (root === 'quiz' || root === 'final')) return;`,
  `    // Admin QA deliberately falls back to the local preview renderer for knowledge, final, and simulation routes.\n    // It does not call the authoritative submit endpoint, write D1 scores, or issue credentials.\n    if (adminQaPreview && (root === 'quiz' || root === 'final' || root === 'official-simulation')) return;`,
  'secure assessment Admin QA route ownership'
);

replaceOnce(
  'app.js',
  `      if(root==='quiz'){const c=careerById(a);return c?quizPage(c,Number(b||1),false):home();}\n      if(root==='simulation'){const c=careerById(a);return c?simulationPage(c):home();}`,
  `      if(root==='quiz'){const c=careerById(a);return c?quizPage(c,Number(b||1),false):home();}\n      if(root==='official-simulation'){\n        const c=careerById(a);\n        const adminQaPreview=window.CM_AUTH?.ready===true&&window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode();\n        if(adminQaPreview) return c?simulationPage(c):home();\n        // The secure assessment router owns this route for normal learners. Do not\n        // render Home first; that created a visible Home -> loading -> simulation flicker.\n        return;\n      }\n      if(root==='simulation'){const c=careerById(a);return c?simulationPage(c):home();}`,
  'base-router official simulation delegation'
);

replaceOnce(
  'madeline.js',
  `It has 16 career pathways with two program levels: Career Skills (4 verified credentials) and Professional Readiness (5 career credentials), with an \${PASS}% mastery standard on required assessed work.`,
  `It has 16 career pathways with two program levels: Career Skills (3 verified Standard 2.0 credentials + 1 program-completion certificate) and Professional Readiness (5 verified career credentials), with an \${PASS}% mastery standard on required assessed work.`,
  'Madeline Capital Mastery summary credential semantics'
);

replaceOnce(
  'madeline.js',
  `<b>Every career has two program levels:</b><br>• <b>Career Skills:</b> 4 verified credentials — Foundations, Essentials, Applied Skills, and the Career Skills Certificate after the practical capstone.<br>• <b>Professional Readiness:</b> 5 career credentials — Foundations, Essentials, Applied Skills, Role Lab, and the flagship Professional Readiness credential.`,
  `<b>Every career has two program levels:</b><br>• <b>Career Skills:</b> 3 verified Standard 2.0 credentials — Foundations, Essentials, and Applied Skills — plus a separate Career Skills Program Completion Certificate after the practical capstone.<br>• <b>Professional Readiness:</b> 5 verified career credentials — Foundations, Essentials, Applied Skills, Role Lab, and the flagship Professional Readiness credential.`,
  'Madeline two-track credential explanation'
);

replaceOnce(
  'tests/admin-runtime-stability-audit.mjs',
  `ok(madeline.includes('Career Skills (4 verified credentials)')&&madeline.includes('Professional Readiness (5 career credentials)'),'Madeline must explain current credential counts');`,
  `ok(madeline.includes('Career Skills (3 verified Standard 2.0 credentials + 1 program-completion certificate)')&&madeline.includes('Professional Readiness (5 verified career credentials)'),'Madeline must explain current credential counts without misclassifying the Career Skills completion certificate');`,
  'admin runtime Madeline semantics regression'
);

replaceOnce(
  '.github/workflows/failure-seeking-round2.yml',
  `          node --check tests/admin-route-zero-exposure-browser-audit.cjs\n          node --check tests/learner-guide-mobile-browser-audit.cjs`,
  `          node --check tests/admin-route-zero-exposure-browser-audit.cjs\n          node --check tests/admin-simulation-route-stability-browser-audit.cjs\n          node --check tests/learner-guide-mobile-browser-audit.cjs`,
  'failure-seeking browser syntax gate'
);

replaceOnce(
  '.github/workflows/failure-seeking-round2.yml',
  `          node tests/admin-runtime-stability-audit.mjs\n          node tests/admin-route-boundary-audit.mjs`,
  `          node tests/admin-runtime-stability-audit.mjs\n          node tests/admin-simulation-route-ownership-audit.mjs\n          node tests/admin-route-boundary-audit.mjs`,
  'failure-seeking static admin route gate'
);

replaceOnce(
  '.github/workflows/failure-seeking-round2.yml',
  `          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/admin-route-zero-exposure-browser-audit.cjs\n          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/learner-guide-mobile-browser-audit.cjs`,
  `          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/admin-route-zero-exposure-browser-audit.cjs\n          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/admin-simulation-route-stability-browser-audit.cjs\n          CM_AUDIT_URL=http://127.0.0.1:4173 node tests/learner-guide-mobile-browser-audit.cjs`,
  'failure-seeking positive admin simulation browser gate'
);

const staticAudit = `import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
const madeline=fs.readFileSync('madeline.js','utf8');
const ok=(v,m)=>{if(!v)throw new Error(m);};

ok(app.includes("if(root==='official-simulation')"),'Base SPA router must explicitly delegate the official simulation route');
ok(app.includes("window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode()"),'Admin local simulation preview must require backend-verified admin state');
ok(app.includes('The secure assessment router owns this route for normal learners'),'Normal official simulation must not transiently fall through to Home');
ok(live.includes("root === 'official-simulation'"),'Secure assessment router must yield official simulation during Admin QA preview');
ok(tracks.includes('window.CM_AUTH?.backendVerified === true'),'Two-track Admin QA bypass must require backend verification');
ok(admin.includes('window.CM_AUTH?.backendVerified === true'),'Admin QA shim must require backend verification');
ok(!madeline.includes('Career Skills (4 verified credentials)'),'Madeline must not misclassify the Career Skills completion certificate as a fourth verified credential');
ok(madeline.includes('3 verified Standard 2.0 credentials + 1 program-completion certificate'),'Madeline must describe Career Skills credential semantics accurately');
console.log('ADMIN SIMULATION ROUTE OWNERSHIP AUDIT PASS');
`;
fs.writeFileSync('tests/admin-simulation-route-ownership-audit.mjs', staticAudit);

const browserAudit = `const { chromium } = require('playwright');
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
    await context.route(/\\/firebase-auth\\.js(?:\\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\\/firebase-sync\\.js(?:\\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,flush:async()=>true};'}));
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
`;
fs.writeFileSync('tests/admin-simulation-route-stability-browser-audit.cjs', browserAudit);

for (const path of ['app.js','training-tracks.js','capital-mastery-live.js','admin-qa-simulation-fix.js','madeline.js','tests/admin-runtime-stability-audit.mjs','.github/workflows/failure-seeking-round2.yml','tests/admin-simulation-route-ownership-audit.mjs','tests/admin-simulation-route-stability-browser-audit.cjs']) {
  if (!fs.existsSync(path)) throw new Error(`Expected patched file missing: ${path}`);
}

console.log('Patched Admin simulation route ownership, corrected credential copy, and added positive browser regression.');
