import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(worker.includes('track:assignment.track,credentialTarget:assignment.credential_target'), 'Learner evidence report must expose assignment program scope');
must(enterprise.includes("const track=d.assignment?.track"), 'Learner evidence report must resolve the selected/assigned program');
must(enterprise.includes("'VERIFIED CAREER SKILLS REPORT'"), 'Career Skills learner report title missing');
must(enterprise.includes("'Baseline not required'"), 'Career Skills learner report must not show baseline as missing');
must(enterprise.includes("'Role Lab not required'"), 'Career Skills learner report must not show Role Lab as missing');
must(enterprise.includes("professional?(d.finalAssessment"), 'Career Skills learner report must scope Professional Final evidence');

must(enterprise.includes("const program=professional?'Professional Readiness':'Career Skills'"), 'CSV must identify program level');
must(enterprise.includes("professional?(x.roleLab?.score??''):'Not required'"), 'Career Skills CSV must mark Role Lab not required');
must(enterprise.includes("professional?(x.final?.score??''):'Not required'"), 'Career Skills CSV must mark Professional Final not required');
must(enterprise.includes("capital-mastery-career-skills-report.csv"), 'Career Skills CSV filename missing');
must(enterprise.includes('programScope:{'), 'Evidence JSON must describe program scope');
must(enterprise.includes("completionCredential:professional?'professional_readiness':'career'"), 'Evidence JSON must identify the correct completion credential');
must(enterprise.includes('capital-mastery-career-skills-evidence.json'), 'Career Skills evidence JSON filename missing');

must(enterprise.includes("learnerAttention(x,reportTrack)"), 'Employer readiness report coaching must use assignment track');
must(enterprise.includes("learnerProgressStage(x,reportTrack)"), 'Employer readiness report stage must use assignment track');
must(enterprise.includes("'Avg. measured score'"), 'Career Skills employer KPI must avoid falsely labeling measured score as Professional Readiness');
must(enterprise.includes("professional?'Revision cycles':'Need attention'"), 'Career Skills employer KPI must not imply Role Lab revisions are required');
must(enterprise.includes("'Not required'"), 'Advanced-only fields must expose not-required state');

console.log('career-skills-report-export-audit: PASS');
