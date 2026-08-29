import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const app=fs.readFileSync('app.js','utf8');
ok(worker.includes('ib-deal-workbench-v2'),'Worker must expose IB deal workbench metadata');
ok(worker.includes('01_Orion_Capitalization.xlsx'),'Workbench must include source-file style data room');
ok(worker.includes('NEW INFO — management guidance changed'),'Workbench must include a changing-information event');
ok(worker.includes('Material QA finding'),'Workbench must grade model QA');
ok(worker.includes('2.0-workbench'),'Workbench must be versioned independently');
ok(live.includes('LIVE-STYLE ANALYST WORKBENCH'),'Official simulation must render as analyst workbench');
ok(live.includes('VIRTUAL DATA ROOM'),'Official simulation must expose a data room');
ok(live.includes('Northstar_Orion_Valuation_v03.xlsx'),'Official simulation must expose workbook-style work product');
ok(live.includes('OUTLOOK / COMPOSE'),'Final recommendation must render as an Associate email');
ok(!live.includes("data.simulationProfile?.kind === 'ib-deal-workbench-v2') {\n        return;"),'Workbench branch must actually render');
ok(app.includes("if(c.id==='investment-banking'){ location.hash=`#/official-simulation/${c.id}`; return; }"),'Legacy IB simulation route must redirect to secure workbench');
const pub=worker.slice(worker.indexOf('function publicQuestion'),worker.indexOf('function otherValues'));
ok(!/answer:/.test(pub),'public question payload must not expose correct answers');
console.log('IB OFFICIAL ANALYST WORKBENCH AUDIT PASS');
