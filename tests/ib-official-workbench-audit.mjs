import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const app=fs.readFileSync('app.js','utf8');

ok(worker.includes('ib-deal-workbench-v2'),'Worker must expose IB deal workbench metadata');
ok(worker.includes('01_Orion_Capitalization.xlsx'),'Workbench must include source-file style data room');
ok(worker.includes('NEW INFO — management guidance changed'),'Workbench must include a changing-information event');
ok(worker.includes('Material QA finding'),'Workbench must grade model QA');
ok(worker.includes('2.0-workbench'),'IB workbench must remain independently versioned');

ok(live.includes('PRACTICAL ANALYST JOB SIMULATION · NO MULTIPLE CHOICE'),'Official IB simulation must render as a practical analyst workbench');
ok(live.includes('VIRTUAL DATA ROOM'),'Official simulation must expose a data room');
ok(live.includes('Northstar_Orion_Valuation_v03.xlsx'),'Official simulation must expose workbook-style work product');
for(const marker of ['Transaction Model','Trading Comps & Implied Value','Precedent Transactions','DCF Valuation','Management Update','Model QA','Client / Senior-Review Takeaway']){
  ok(live.includes(marker),`Official IB workbench missing ${marker}`);
}
ok(live.includes('OUTLOOK / COMPOSE'),'Final recommendation must render as an Associate email');
ok(!live.includes("data.simulationProfile?.kind === 'ib-deal-workbench-v2') {\n        return;"),'IB workbench branch must actually render');

// The secure official workbench is now the learner route for every career, including IB.
ok(app.includes("if(!adminPreview && !qaMode()){ location.hash=`#/official-simulation/${c.id}`; return; }"),'Normal learner simulation traffic must redirect to the secure official workbench');
ok(!app.includes("if(c.id==='investment-banking' && !adminPreview && !qaMode())"),'IB must not be a one-off exception now that all career simulations use the secure workbench');
ok(app.includes('const adminPreview = forceAdminPreview && qaMode();'),'Only an explicit protected Admin preview invocation may bypass the secure learner redirect');
ok(app.includes("root==='admin-preview'&&a==='simulation'")&&app.includes('simulationPage(c,true)'),'Admin IB preview must live in the protected Admin namespace and explicitly invoke the local preview renderer');
ok(app.includes("function qaMode(){ return window.CM_AUTH?.ready === true && window.CM_AUTH?.backendVerified === true && window.CM_AUTH?.isAdmin === true"),'The preview exception must depend on backend-verified Admin QA mode, not a raw localStorage flag');

const wbStart=live.indexOf('  function workbenchField(q) {');
const wbEnd=live.indexOf('\n  function renderWorkbenchFile',wbStart);
ok(wbStart>=0&&wbEnd>wbStart,'IB practical work-product field renderer missing');
const wbField=live.slice(wbStart,wbEnd);
ok(wbField.includes("if (q.type === 'numeric')"),'IB workbench must support calculated outputs');
ok(wbField.includes("if (q.type === 'text')"),'IB workbench must support authored work products');
ok(!wbField.includes('q.options'),'IB workbench must not render answer options');

const pub=worker.slice(worker.indexOf('function publicQuestion'),worker.indexOf('function otherValues'));
ok(!/answer:/.test(pub),'public question payload must not expose correct answers');
console.log('IB OFFICIAL ANALYST WORKBENCH AUDIT PASS: secure no-MCQ learner route + VDR + model/comps/precedents/DCF/update/QA/client takeaway + Associate handoff');
