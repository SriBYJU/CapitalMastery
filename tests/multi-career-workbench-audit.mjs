import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const ids=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
for(const id of ids) ok(worker.includes(`'${id}': {`) || worker.includes(`\"${id}\": {`) || worker.includes(`${id}: {`),`Missing secure workbench blueprint for ${id}`);
ok(worker.includes("kind:'career-workbench-v2'"),'Worker must mark generic career simulations as workbenches');
ok(worker.includes("version:'2.1-workday'"),'Non-IB career workbenches must use the current workday-grade version');
ok(worker.includes("type:'text'")&&worker.includes("type:'numeric'"),'Workbenches must support real numeric and written work products');
ok(worker.includes('q.type === "text"'),'Secure grader must evaluate written work-product fields');
ok(worker.includes('evidenceGroups:[...(update.impactGroups||[]),...(update.actionGroups||[])]'),'Mid-assignment updates must grade evidence categories, not recognition');
ok(live.includes('PRACTICAL JOB SIMULATION · NO MULTIPLE CHOICE'),'Browser must render non-IB simulations as practical professional workbenches');
ok(live.includes('MID-ASSIGNMENT UPDATE · INBOX'),'Workbenches must include role-native changing-information pressure');
ok(live.includes('This simulation tests job execution—not answer recognition.'),'Workbench must explicitly frame job execution rather than answer recognition');
ok(live.includes('The separate final checks knowledge, calculations and workflow judgment'),'Workbench must distinguish the job simulation from the separate readiness final');
ok(live.includes("data.simulationProfile?.kind === 'career-workbench-v2'"),'Secure route must dispatch to career workbench renderer');
ok(worker.includes('"quant-finance": "quantitative-finance"')&&live.includes("'quant-finance': 'quantitative-finance'"),'Quant public/backend IDs must be aliased');
const mapStart=worker.indexOf('const CAREER_WORKBENCHES'); const mapEnd=worker.indexOf('function buildCareerWorkbenchSimulation',mapStart); const map=worker.slice(mapStart,mapEnd);
ok(!/options\s*:/.test(map),'Non-IB career workbench core must not contain MCQ option arrays');
for(const id of ids){
  const quoted=map.indexOf(`  '${id}': {`); const plain=quoted>=0?quoted:map.indexOf(`  ${id}: {`);
  ok(plain>=0,`${id}: workbench block missing`);
  const later=ids.map(other=>map.indexOf(`  '${other}': {`,plain+1)).filter(n=>n>plain);
  const treasury=map.indexOf('\n  treasury: {',plain+1); if(treasury>plain) later.push(treasury);
  const end=later.length?Math.min(...later):map.length;
  const block=map.slice(plain,end);
  ok((block.match(/sim(?:Num|Text)\(/g)||[]).length>=5,`${id}: workbench needs at least five role-native outputs`);
  ok(block.includes('files:['),`${id}: source packet missing`);
  ok(block.includes('writingPrompt:'),`${id}: manager/reviewer handoff missing`);
}
console.log('MULTI-CAREER PROFESSIONAL WORKBENCH AUDIT PASS: 15 non-IB careers use secure no-MCQ workdays with source packets, real outputs, live updates and reviewer handoffs');
