import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const ids=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
const start=worker.indexOf('const CAREER_ROLELAB_UPDATES');
const end=worker.indexOf('const CAREER_REVIEW_STANDARDS',start);
const updates=worker.slice(start,end);
for(const id of ids) ok(updates.includes(`'${id}': {`),`Missing material Role Lab update for ${id}`);
ok(worker.includes("task_type:'mixed_fields'"),'Role Lab change checkpoint must collect more than one controlled work output');
ok(worker.includes('changeEvent:true'),'Role Lab change checkpoint must be explicitly marked in the public task brief');
ok(worker.includes("lab_version:'2.1'"),'Role Lab change-control release must be versioned');
ok(worker.includes("id:`${pathway.code.toLowerCase()}rl-update`"),'Change-control task needs a stable task identity');
ok(worker.includes("['update','changed','revised','new information']"),'Final manager recommendation must explain the mid-case change');
ok(enterprise.includes('task.brief?.changeEvent'),'Breaking-update UI must be driven by a real case event');
ok(!enterprise.includes('Number(task.stageNo)>=6'),'Final-stage number must never fabricate a case update');
ok(enterprise.includes('NEW INFORMATION RECEIVED · MATERIAL CASE UPDATE'),'Role Lab must clearly distinguish the change-control checkpoint');
console.log('ROLE LAB CHANGE-CONTROL AUDIT PASS: 15 role-native updates + controlled impact/action evidence');
