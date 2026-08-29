import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const ent=fs.readFileSync('enterprise-v2.js','utf8');
const app=fs.readFileSync('app.js','utf8');
ok(worker.includes('DEMO_PRESETS'),'Worker must define safe demo presets');
ok(worker.includes('demo_org_')&&worker.includes('demo_uid_'),'Demo records must use isolated prefixes');
ok(worker.includes('/enterprise/admin/demo/create')&&worker.includes('/enterprise/admin/demo/reset'),'Admin must have create/reset demo endpoints');
ok(worker.includes('requireAdmin(request,env)'),'Demo mutation must require server admin');
ok(worker.includes("WHERE id LIKE 'demo_org_%'")||worker.includes("org_id LIKE 'demo_org_%'"),'Demo reset must be prefix-scoped');
ok(ent.includes('ADMIN · DEMO / TEST LAB'),'Admin must have visual Demo/Test Lab');
ok(ent.includes('Generate Synthetic Firm'),'Admin must be able to create a synthetic firm');
ok(ent.includes('Mixed cohort')&&ent.includes('Weak modeling cohort')&&ent.includes('Revision cycle'),'Admin must have meaningful scenario presets');
ok(ent.includes('Open Employer View')&&ent.includes('Launch Guide')&&ent.includes('Reports'),'Admin must have direct scenario preview links');
ok(app.includes('#/admin-demo'),'Existing admin page must expose the Demo/Test Lab');
ok(ent.includes('roleLab.revisions'),'Manager attention must use report revision field');
console.log('ADMIN DEMO/TEST LAB AUDIT PASS');
