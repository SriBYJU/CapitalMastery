import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const ids=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
for(const id of ids) ok(worker.includes(`'${id}': {`) || worker.includes(`\"${id}\": {`) || worker.includes(`${id}: {`),`Missing secure workbench blueprint for ${id}`);
ok(worker.includes("kind:'career-workbench-v2'"),'Worker must mark generic career simulations as workbenches');
ok(worker.includes("type:'text'")&&worker.includes("type:'numeric'"),'Workbenches must support real numeric and written work products');
ok(worker.includes('q.type === "text"'),'Secure grader must evaluate written work-product fields');
ok(live.includes('PROFESSIONAL WORKBENCH · SYNTHETIC CASE'),'Browser must render non-IB simulations as professional workbenches');
ok(live.includes('This is the job simulation. MCQ knowledge testing remains'),'Workbench must distinguish job simulation from MCQ exams');
ok(live.includes("data.simulationProfile?.kind === 'career-workbench-v2'"),'Secure route must dispatch to career workbench renderer');
ok(worker.includes('"quant-finance": "quantitative-finance"')&&live.includes("'quant-finance': 'quantitative-finance'"),'Quant public/backend IDs must be aliased');
const mapStart=worker.indexOf('const CAREER_WORKBENCHES'); const mapEnd=worker.indexOf('function buildCareerWorkbenchSimulation',mapStart); const map=worker.slice(mapStart,mapEnd);
ok(!/options\s*:/.test(map),'Non-IB career workbench core must not contain MCQ option arrays');
console.log('MULTI-CAREER PROFESSIONAL WORKBENCH AUDIT PASS: 15 non-IB careers + IB reference');
