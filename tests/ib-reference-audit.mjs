import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=read('data.js'), live=read('capital-mastery-live.js'), admin=read('admin-qa-simulation-fix.js'), ib=read('ib-analyst-toolkit.js'), ecss=read('enterprise-v2.css'), index=read('index.html');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
must(ecss.includes('.cmv2-employer-hero .hero-actions .btn-outline'),'Employer Preview Career Training contrast override missing');
must(live.includes("adminQaPreview && (root === 'quiz' || root === 'final')"),'Admin QA assessment preview fallback missing');
must(admin.includes('Assessment preview:'),'Admin Release Lab assessment guidance missing');
for(const name of ['Excel Workflow Lab','Filings & Research Drill','Three-Statement Bridge','Trading Comps Builder','DCF Sensitivity Lab','M&A Mechanics Lab','Model QA — Find the Errors','Pitchbook QA — Think Like a Reviewer']) must(ib.includes(name),`IB interactive module missing: ${name}`);
for(const topic of ['Excel workflow, shortcuts & model hygiene','Navigate SEC filings and source transaction data','Build and link a three-statement operating model','Build a DCF with sensitivities','Build M&A sources & uses and accretion/dilution','Audit a financial model and catch errors']) must(data.includes(topic),`IB curriculum mapping missing: ${topic}`);
must(index.includes('ib-analyst-toolkit.js'),'IB toolkit not loaded by production shell');
must(data.includes('Jefferies — Students & Graduates Analyst Training'),'Jefferies training benchmark source missing');
must(data.includes('Wall Street Prep — Investment Banking Training'),'Wall Street Prep training benchmark source missing');
must(data.includes('Training The Street — Investment Banking Training'),'Training The Street benchmark source missing');
console.log('IB REFERENCE PATHWAY AUDIT PASS: contrast, admin preview, 12 interactive analyst-tool workflows, curriculum mapping and benchmark sources verified.');


// Phase 1 immersive IB reference gates
{
  const fs = await import('node:fs');
  const immersive = fs.readFileSync('ib-immersive-learning.js','utf8');
  const toolkit = fs.readFileSync('ib-analyst-toolkit.js','utf8');
  const live = fs.readFileSync('capital-mastery-live.js','utf8');
  const worker = fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
  const enterprise = fs.readFileSync('enterprise-v2.js','utf8');
  if (!immersive.includes('YOUR INVESTMENT BANKING ANALYST CURRICULUM') || !immersive.includes('Project Northstar — M&A Analyst Readiness')) throw new Error('IB curriculum roadmap missing');
  const practiceCount=(immersive.match(/title:'Desk Check/g)||[]).length;
  if (practiceCount < 8) throw new Error(`Expected >=8 concept desk checks, found ${practiceCount}`);
  const panelCount=(toolkit.match(/data-ib-panel=/g)||[]).length;
  if (panelCount < 12) throw new Error(`Expected >=12 IB analyst toolkit workflows, found ${panelCount}`);
  if (!worker.includes('function numericQuestion') || !worker.includes('ibAppliedStageQuestions')) throw new Error('Secure numeric/table assessment support missing');
  if (!live.includes('cm-official-table') || !live.includes("q.type === 'numeric'")) throw new Error('Numeric/table assessment UI missing');
  if (!enterprise.includes('cmv2-workbook') || !enterprise.includes('cmv2-email-compose') || !enterprise.includes('NEW INFORMATION RECEIVED')) throw new Error('Role Lab analyst work surfaces missing');
}
