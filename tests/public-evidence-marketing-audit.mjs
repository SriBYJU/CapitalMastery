import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
const evidence=read('public-evidence.js'), app=read('app.js'), ent=read('enterprise-v2.js'), idx=read('index.html');
const fail=[]; const ok=(v,m)=>{if(!v)fail.push(m)};
for(const marker of ['12%','50%','69%','2×','Gallup','SHRM','Microsoft','not Capital Mastery outcome claims']) ok(evidence.includes(marker),`public evidence missing ${marker}`);
for(const url of ['techcommunity.microsoft.com','shrm.org/topics-tools/topics/onboarding','shrm.org/topics-tools/news/talent-acquisition/7-ways-to-set-new-hire-success','shrm.org/topics-tools/topics/onboarding/measuring-success']) ok(evidence.includes(url),`public source missing ${url}`);
ok(app.includes('THE BUSINESS CASE FOR BETTER PREPARATION'),'homepage evidence section missing');
ok(app.includes('Evidence, not hype.'),'homepage evidence caveat missing');
ok(ent.includes('WHY PRE-DAY-1 PREPARATION MATTERS'),'employer evidence section missing');
ok(ent.includes('Not another HR onboarding portal. A finance-readiness layer.'),'employer positioning distinction missing');
ok(ent.includes('ILLUSTRATIVE RAMP-VALUE MODEL'),'employer scenario calculator missing');
ok(ent.includes('cohort*daily*days*gap'),'ramp calculator formula missing');
ok(ent.includes('[name=\"cohort\"]'),'ramp calculator direct input binding missing');
ok(ent.includes('Not an ROI forecast.'),'ramp calculator anti-overclaim missing');
ok(idx.includes('public-evidence.js'),'public evidence asset not loaded');
ok(idx.includes('Finance Workforce Readiness Infrastructure'),'Phase 2 metadata positioning missing');
if(fail.length){console.error('PUBLIC EVIDENCE MARKETING AUDIT FAILED\n - '+fail.join('\n - '));process.exit(1)}
console.log('PUBLIC EVIDENCE MARKETING AUDIT PASS: source-linked claims, caveats, positioning and scenario calculator verified');
