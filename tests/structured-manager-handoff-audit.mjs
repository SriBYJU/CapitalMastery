import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(worker.includes('const CAREER_REVIEW_STANDARDS'),'Role-specific reviewer standards are missing');
ok(worker.includes("pathwayId:pathway.id")&&worker.includes('reviewStandard:CAREER_REVIEW_STANDARDS[pathway.id]'),'Safe role-specific standards must reach the workbench');
ok(worker.includes('function gradeCareerWorkbenchWriting'),'Non-IB manager handoffs need role-specific secure grading');
ok(worker.includes('careerWorkbenchNumberMention'),'Written scoring must require calculated case evidence');
ok(worker.includes("assessment.simulationProfile?.kind === \"career-workbench-v2\""),'Career-workbench written scoring dispatch is missing');
for(const field of ['writingDecision','writingEvidence','writingRisk','writingAction']) ok(live.includes(field),`Structured manager-handoff field missing: ${field}`);
ok(live.includes('data-structured-writing="true"'),'Structured handoff form must opt into composed secure submission');
ok(live.includes('REVIEWER ACCEPTANCE STANDARD'),'Learner must see the quality standard before submission');
ok(live.includes('This is the quality bar your submission is reviewed against. It tells you the professional standard without exposing scoring keys or answers.'),'Acceptance standard must distinguish guidance from answer leakage');
ok(live.includes('Submit Manager Handoff for Review'),'Simulation must end in a professional manager handoff');
ok(/<script\s+src=["']capital-mastery-live\.js\?v=[^"']+["']><\/script>/.test(index),'Structured workbench asset must be loaded by the production shell with a cache-busted production URL');
console.log('STRUCTURED MANAGER HANDOFF AUDIT PASS: role-specific standard + evidence-based secure scoring');
