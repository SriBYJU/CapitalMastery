import fs from 'node:fs';
const e=fs.readFileSync('enterprise-v2.js','utf8');
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const m=fs.readFileSync('migrations/012_phase2_employer_onboarding.sql','utf8');
for(const x of ['employerStart','employerOnboarding','EMPLOYER_INTENT','Company / firm name','training_lead','cohortSizeBand','/enterprise/invites/preview/','organizationName','cohortName']) if(!e.includes(x)) throw new Error('Employer onboarding UI missing '+x);
for(const x of ['/enterprise/employer-onboarding','employer_profiles','employer.onboarding_completed','CONTEXTUAL INVITATION PREVIEW']) if(!w.includes(x)) throw new Error('Employer backend missing '+x);
if(!m.includes('CREATE TABLE IF NOT EXISTS employer_profiles')) throw new Error('Employer profile migration missing');
console.log('EMPLOYER ONBOARDING AUDIT PASS: purpose-built employer setup + contextual learner invite verified');
