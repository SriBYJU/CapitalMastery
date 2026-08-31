import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');

function assert(condition,message){ if(!condition) throw new Error(message); }

// Learners must never fall into the legacy local quiz-like simulation. Admin QA may
// still use a local preview namespace, but normal learners always enter the Worker-backed workbench.
assert(app.includes("if(!adminPreview && !qaMode()){ location.hash=`#/official-simulation/${c.id}`; return; }"), 'Every learner simulation must redirect to the secure official workbench');
assert(!app.includes("if(c.id==='investment-banking' && !adminPreview && !qaMode())"), 'Official-workbench routing must not be Investment-Banking-only');
const hasDirectPart5Route=app.includes("n===5 ? (passed?`official-simulation/${c.id}`:`quiz/${c.id}/5`)");
const hasHelperPart5Route=app.includes("if(n===5) return `official-simulation/${c.id}`;") && app.includes('function assessmentContinuePath');
assert(hasDirectPart5Route || hasHelperPart5Route, 'Part-5 knowledge pass must open the real practical workbench directly');
assert(app.includes("return nav(`official-simulation/${c.id}`)"), 'Final prerequisite recovery must point back to the official workbench');

// Practical simulation renderer: calculations + authored work only. No answer-picking UI.
const wbStart=live.indexOf('  function workbenchField(q) {');
const wbEnd=live.indexOf('\n  function renderWorkbenchFile',wbStart);
assert(wbStart>=0&&wbEnd>wbStart,'IB workbench field renderer missing');
const wbField=live.slice(wbStart,wbEnd);
assert(wbField.includes("if (q.type === 'numeric')"),'Workbench must support calculated numeric outputs');
assert(wbField.includes("if (q.type === 'text')"),'Workbench must support authored workpaper/reviewer text');
assert(wbField.includes('<textarea'),'Text work products must be authored, not selected');
assert(!wbField.includes('<select'),'Official IB workbench must not contain select-the-answer UI');
assert(!wbField.includes('q.options'),'Official IB workbench must not render answer options');
assert(live.includes('PRACTICAL JOB SIMULATION · NO MULTIPLE CHOICE'),'Career workbench must be explicitly framed as practical work');
assert(live.includes('PRACTICAL ANALYST JOB SIMULATION · NO MULTIPLE CHOICE'),'IB workbench must be explicitly framed as practical work');

// IB should actually use the valuation concepts taught in the course.
const ibStart=worker.indexOf('function buildInvestmentBankingSimulation(pathway) {');
const ibEnd=worker.indexOf('\nfunction ',ibStart+20);
assert(ibStart>=0&&ibEnd>ibStart,'IB simulation builder missing');
const ib=worker.slice(ibStart,ibEnd);
for(const marker of [
  'ib-sim-ev','ib-sim-comps-median','ib-sim-precedent-median','ib-sim-precedent-equity',
  'ib-sim-dcf-terminal','ib-sim-dcf-ev','ib-sim-dcf-equity','ib-sim-revised-revenue',
  'ib-sim-qa','ib-sim-slide-headline','06_Precedent_Transactions.xlsx','07_Orion_DCF.xlsx'
]) assert(ib.includes(marker),`IB real-job simulation missing ${marker}`);
assert(!/type:\s*["'](?:mc|choice)["']/.test(ib),'IB official simulation contains an MCQ/choice task');
assert(!/options\s*:/.test(ib),'IB official simulation should not expose answer options');
assert((ib.match(/type:\s*"numeric"/g)||[]).length>=8,'IB simulation should require a substantial set of calculated/model outputs');
assert((ib.match(/type:\s*"text"/g)||[]).length>=2,'IB simulation should require authored QA/client work products');
assert(ib.includes('trading comps, precedent transactions and DCF'),'IB Associate handoff must reconcile the valuation methods actually taught');

// The other 15 career workbenches are also task-based, not quiz banks.
const careerStart=worker.indexOf('const CAREER_WORKBENCHES = {');
const updateBoundary=worker.indexOf('\nconst CAREER_ROLELAB_UPDATES',careerStart);
const standardsBoundary=worker.indexOf('\nconst CAREER_REVIEW_STANDARDS',careerStart);
const careerEnd=updateBoundary>careerStart?updateBoundary:standardsBoundary;
assert(careerStart>=0&&careerEnd>careerStart,'Career workbench catalog missing');
const catalog=worker.slice(careerStart,careerEnd);
const careers=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
for(let i=0;i<careers.length;i++){
  const id=careers[i];
  const start=catalog.indexOf(`  '${id}': {`);
  const alt=start<0 ? catalog.indexOf(`  ${id}: {`) : start;
  assert(alt>=0,`Missing professional workbench for ${id}`);
  const nextPositions=careers.map(other=>catalog.indexOf(`  '${other}': {`,alt+1)).filter(x=>x>alt);
  const nextPlain=catalog.indexOf('\n  treasury: {',alt+1);
  if(nextPlain>alt) nextPositions.push(nextPlain);
  const end=nextPositions.length?Math.min(...nextPositions):catalog.length;
  const block=catalog.slice(alt,end);
  const taskCount=(block.match(/sim(?:Num|Text)\(/g)||[]).length;
  assert(taskCount>=5,`${id} needs at least five role-native work outputs, found ${taskCount}`);
  assert(block.includes('files:['),`${id} workbench needs a source packet`);
  assert(block.includes('writingPrompt:'),`${id} workbench needs a reviewer/manager handoff`);
  assert(!/\bmc\(/.test(block),`${id} workbench contains MCQ construction`);
}

const builderStart=worker.indexOf('function buildCareerWorkbenchSimulation(pathway) {');
const builderEnd=worker.indexOf('\nfunction ',builderStart+20);
const builder=worker.slice(builderStart,builderEnd);
const servesTasksDirectly=builder.includes('questions:b.tasks');
const servesExpandedWorkday=builder.includes('const questions=') && builder.includes('questions, writingPrompt:b.writingPrompt');
assert(servesTasksDirectly || servesExpandedWorkday,'Career simulations must serve role-native workbench tasks');
assert(!builder.includes('stageQuestions('),'Career simulation builder must not source quiz-bank questions');

console.log('OFFICIAL SIMULATION JOB REALISM AUDIT PASS: all 16 learner simulations are secure workbenches; IB uses model/comps/precedents/DCF/update/QA/client handoff; practical simulations contain no answer-picking UI');
