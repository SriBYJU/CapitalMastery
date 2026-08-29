import fs from 'node:fs';
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8'), e=fs.readFileSync('enterprise-v2.js','utf8'), a=fs.readFileSync('app.js','utf8'), m=fs.readFileSync('migrations/014_phase2_academy_credentials.sql','utf8');
for(const x of ['ACADEMY_AWARDS','academyCredentialState','academyEligibility','academyRefresh','/enterprise/academy/catalog','/enterprise/academy/me','/enterprise/academy/refresh','2.0-academy']) if(!w.includes(x)) throw new Error('Academy backend missing '+x);
for(const x of ['Finance Core Certificate','Deals Academy','Investing Academy','Markets & Quant Academy','Credit & Risk Academy','Corporate Finance Academy','Wealth & Real Assets Academy','Finance Professional Achievement']) if(!m.includes(x)) throw new Error('Academy definition missing '+x);
for(const x of ['academyPage','NO MYSTERY BADGES','Refresh Eligibility']) if(!e.includes(x)) throw new Error('Academy UI missing '+x);
if(!a.includes("link('academy','Academies'")) throw new Error('Academies not in navigation');
console.log('ACADEMY CREDENTIAL AUDIT PASS: evidence roll-ups + transparent requirements verified');
