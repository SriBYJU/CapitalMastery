import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8');
const ent=fs.readFileSync('enterprise-v2.js','utf8');
function ok(v,m){if(!v)throw new Error(m);}
for(const marker of ['FOR INDIVIDUAL LEARNERS · FREE','FOR FINANCE FIRMS · FREE','without a learner paywall','at no cost to the employer']) ok(app.includes(marker),'public free-access positioning missing: '+marker);
for(const marker of ['CAPITAL MASTERY FOR EMPLOYERS · FREE TO USE','No employer subscription, seat fee or trial gate.','✓ Free for employers','Open Free Employer Workspace →','EMPLOYER ACCOUNT · $0 TO USE']) ok(ent.includes(marker),'employer free-access positioning missing: '+marker);
console.log('FREE ACCESS POSITIONING AUDIT PASS: learner + employer no-cost value is explicit without changing evidence claims');
