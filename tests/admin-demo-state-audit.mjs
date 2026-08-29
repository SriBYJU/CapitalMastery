import fs from 'node:fs';
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const e=fs.readFileSync('enterprise-v2.js','utf8');
for(const x of ['demoStateProfile','setEnterpriseDemoLearnerState','/enterprise/admin/demo/learner-state','/enterprise/admin/demo/permission-matrix','ENTERPRISE_PERMISSION_LAB','demo_uid_']) if(!w.includes(x)) throw new Error('Admin state backend missing '+x);
for(const x of ['SYNTHETIC LEARNER STATE LAB','data-demo-state','PERMISSION LAB','/enterprise/admin/demo/learner-state','employer-start','employer-onboarding']) if(!e.includes(x)) throw new Error('Admin state UI missing '+x);
if(!e.includes("['employers','employer','employer-start','employer-onboarding'")) throw new Error('Employer onboarding route allowlist regression');
console.log('ADMIN DEMO STATE/PERMISSION AUDIT PASS');
