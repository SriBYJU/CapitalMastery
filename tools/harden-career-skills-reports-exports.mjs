import fs from 'node:fs';

const load=p=>fs.readFileSync(p,'utf8');
const save=(p,s)=>fs.writeFileSync(p,s);
function once(text,from,to,label){const i=text.indexOf(from);if(i<0)throw new Error(`Missing patch target: ${label}`);if(text.indexOf(from,i+from.length)>=0)throw new Error(`Ambiguous patch target: ${label}`);return text.slice(0,i)+to+text.slice(i+from.length);}
function regexOnce(text,re,to,label){const flags=re.flags.includes('g')?re.flags:re.flags+'g';const matches=[...text.matchAll(new RegExp(re.source,flags))];if(matches.length!==1)throw new Error(`${label}: expected one match, found ${matches.length}`);return text.replace(re,to);}

const workerPath='v2/worker-v2-phase1-release.js';
let worker=load(workerPath);
worker=once(
  worker,
  "assignment:assignment?{id:assignment.id,orgId,cohortId:assignment.cohort_id,dueAt:assignment.due_at,curriculumVersion:assignment.curriculum_version}:null",
  "assignment:assignment?{id:assignment.id,orgId,cohortId:assignment.cohort_id,track:assignment.track,credentialTarget:assignment.credential_target,dueAt:assignment.due_at,curriculumVersion:assignment.curriculum_version}:null",
  'learner readiness assignment scope'
);
save(workerPath,worker);

const enterprisePath='enterprise-v2.js';
let enterprise=load(enterprisePath);
enterprise=once(
  enterprise,
  "const d=await api(`/enterprise/learner/readiness-report/${encodeURIComponent(pathwayId)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`); const r=d.readiness; const skills=d.competencies||[]; const creds=d.credentials||[];",
  "const d=await api(`/enterprise/learner/readiness-report/${encodeURIComponent(pathwayId)}${assignmentId?`?assignmentId=${encodeURIComponent(assignmentId)}`:''}`); const r=d.readiness; const skills=d.competencies||[]; const creds=d.credentials||[]; const track=d.assignment?.track||(window.CM_TRAINING_TRACKS?.getTrack?.(publicPathId(pathwayId))==='career-skills'?'career_skills':'professional'); const professional=track==='professional'; const careerVerified=creds.some(c=>c.level==='career'&&c.status==='active');",
  'learner report program scope'
);
enterprise=once(enterprise,'<div class="eyebrow">VERIFIED READINESS REPORT</div>','<div class="eyebrow">${professional?\'VERIFIED READINESS REPORT\':\'VERIFIED CAREER SKILLS REPORT\'}</div>','learner report title');
enterprise=once(enterprise,"<span>${esc(readinessLabel(r?.status))}</span>","<span>${esc(professional?readinessLabel(r?.status):(careerVerified?'Career Skills verified':'Career Skills evidence'))}</span>",'learner score label');
enterprise=once(enterprise,"<small>${r?Number(r.evidenceCoverage):0}% evidence coverage</small>","<small>${r?Number(r.evidenceCoverage):0}% ${professional?'professional':'Career Skills'} evidence coverage</small>",'learner evidence scope');
enterprise=once(
  enterprise,
  '<div class="cmv2-kpis"><div class="card"><strong>${d.diagnostic?Number(d.diagnostic.score):\'—\'}</strong><span>Baseline</span></div><div class="card"><strong>${r?Number(r.overallScore):\'—\'}</strong><span>Current readiness</span></div><div class="card"><strong>${r&&r.improvement!=null?(Number(r.improvement)>=0?\'+\':\'\')+Number(r.improvement):\'—\'}</strong><span>Improvement</span></div><div class="card"><strong>${d.roleLab?.score??\'—\'}</strong><span>Role Lab</span></div></div>',
  '<div class="cmv2-kpis"><div class="card"><strong>${professional?(d.diagnostic?Number(d.diagnostic.score):\'—\'):\'N/A\'}</strong><span>${professional?\'Baseline\':\'Baseline not required\'}</span></div><div class="card"><strong>${r?Number(r.overallScore):\'—\'}</strong><span>${professional?\'Current readiness\':\'Measured skill score\'}</span></div><div class="card"><strong>${professional?(r&&r.improvement!=null?(Number(r.improvement)>=0?\'+\':\'\')+Number(r.improvement):\'—\'):(careerVerified?\'✓\':\'—\')}</strong><span>${professional?\'Improvement\':\'Career Skills credential\'}</span></div><div class="card"><strong>${professional?(d.roleLab?.score??\'—\'):\'N/A\'}</strong><span>${professional?\'Role Lab\':\'Role Lab not required\'}</span></div></div>',
  'learner report KPI scope'
);
enterprise=once(
  enterprise,
  '<div><span>Diagnostic</span><b>${d.diagnostic?`${Number(d.diagnostic.score)}%`:\'Not completed\'}</b></div><div><span>Role Lab</span><b>${d.roleLab?`${Number(d.roleLab.score||0)}% · ${esc(d.roleLab.status)}`:\'Not completed\'}</b></div><div><span>Professional Final</span><b>${d.finalAssessment?`${Number(d.finalAssessment.score)}% · ${d.finalAssessment.passed?\'Passed\':\'Not passed\'}`:\'Not completed\'}</b></div>',
  '<div><span>Diagnostic</span><b>${professional?(d.diagnostic?`${Number(d.diagnostic.score)}%`:\'Not completed\'):\'Not required\'}</b></div><div><span>Role Lab</span><b>${professional?(d.roleLab?`${Number(d.roleLab.score||0)}% · ${esc(d.roleLab.status)}`:\'Not completed\'):\'Not required\'}</b></div><div><span>Professional Final</span><b>${professional?(d.finalAssessment?`${Number(d.finalAssessment.score)}% · ${d.finalAssessment.passed?\'Passed\':\'Not passed\'}`:\'Not completed\'):\'Not required\'}</b></div>',
  'learner report work evidence scope'
);

enterprise=regexOnce(enterprise,/  function downloadReportCsv\(report\) \{[\s\S]*?\n  \}/,`  function downloadReportCsv(report) {
    const track=report?.assignment?.track||'professional';
    const professional=track==='professional';
    const program=professional?'Professional Readiness':'Career Skills';
    const rows=[['Program','Learner','Email','Progress Stage','Measured Score','Evidence Coverage','Diagnostic','Role Lab','Role Lab Revisions','Professional Final','Manager Review','Complete','Overdue']];
    for(const x of report.learners||[]) rows.push([
      program,
      x.name||'',
      x.email||'',
      learnerProgressStage(x,track).label,
      x.readiness?.overallScore??'',
      x.readiness?.evidenceCoverage??'',
      professional?(x.diagnostic?.score??''):'Not required',
      professional?(x.roleLab?.score??''):'Not required',
      professional?(x.roleLab?.revisions??''):'Not required',
      professional?(x.final?.score??''):'Not required',
      x.managerReview?.reviewStatus||'',
      x.complete?'Yes':'No',
      x.overdue?'Yes':'No'
    ]);
    const csv=rows.map(row=>row.map(v=>\`"\${String(v??'').replace(/"/g,'""')}"\`).join(',')).join('\\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=professional?'capital-mastery-professional-readiness-report.csv':'capital-mastery-career-skills-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }`,'track-aware CSV export');
enterprise=regexOnce(enterprise,/  function downloadReportJson\(report\) \{[^\n]*\}/,`  function downloadReportJson(report) {
    const track=report?.assignment?.track||'professional';
    const professional=track==='professional';
    const exportPayload={
      exportedAt:new Date().toISOString(),
      standard:'Capital Mastery 2.0',
      programScope:{
        track,
        program:professional?'Professional Readiness':'Career Skills',
        roleLabRequired:professional,
        professionalFinalRequired:professional,
        completionCredential:professional?'professional_readiness':'career'
      },
      report
    };
    const blob=new Blob([JSON.stringify(exportPayload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=professional?'capital-mastery-professional-readiness-evidence.json':'capital-mastery-career-skills-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }`,'track-aware JSON export');

enterprise=once(
  enterprise,
  "const data=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(chosen.id)}`); const report=data.assignments?.[0]; if(!report) throw new Error('No report data returned.'); const summary=report.summary; const weak=(report.competencies||[]).slice(0,5); const learners=report.learners||[];\n      const attention=learners.map(x=>({learner:x,signal:learnerAttention(x)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority);\n      const ready=learners.filter(x=>x.complete||x.readiness?.status==='ready').length; const revisions=learners.filter(x=>Number(x.roleLab?.revisions||0)>0).length; const avgEvidence=learners.length?Math.round(learners.reduce((n,x)=>n+Number(x.readiness?.evidenceCoverage||0),0)/learners.length):null;",
  "const data=await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/readiness-report?assignmentId=${encodeURIComponent(chosen.id)}`); const report=data.assignments?.[0]; if(!report) throw new Error('No report data returned.'); const summary=report.summary; const weak=(report.competencies||[]).slice(0,5); const learners=report.learners||[]; const reportTrack=report.assignment?.track||chosen.track||'professional'; const professional=reportTrack==='professional';\n      const attention=learners.map(x=>({learner:x,signal:learnerAttention(x,reportTrack)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority);\n      const ready=learners.filter(x=>x.complete||(professional&&x.readiness?.status==='ready')).length; const revisions=professional?learners.filter(x=>Number(x.roleLab?.revisions||0)>0).length:0; const avgEvidence=learners.length?Math.round(learners.reduce((n,x)=>n+Number(x.readiness?.evidenceCoverage||0),0)/learners.length):null;",
  'employer report program scope'
);
enterprise=once(enterprise,"<span>Avg. readiness</span>","<span>${professional?'Avg. readiness':'Avg. measured score'}</span>",'employer average label');
enterprise=once(enterprise,"<div class=\"card\"><strong>${revisions}</strong><span>Revision cycles</span></div>","<div class=\"card\"><strong>${professional?revisions:attention.length}</strong><span>${professional?'Revision cycles':'Need attention'}</span></div>",'employer advanced KPI scope');
enterprise=once(enterprise,"const stage=learnerProgressStage(x),sig=learnerAttention(x);","const stage=learnerProgressStage(x,reportTrack),sig=learnerAttention(x,reportTrack);",'employer table track-aware stage');
enterprise=once(enterprise,"<td>${x.diagnostic?Number(x.diagnostic.score)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.overallScore)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.evidenceCoverage)+'%':'—'}</td><td>${x.roleLab?.score!=null?Number(x.roleLab.score)+'%':'—'}</td><td>${Number(x.roleLab?.revisions||0)||'—'}</td><td>${x.final?.score!=null?Number(x.final.score)+'%':'—'}</td>","<td>${professional?(x.diagnostic?Number(x.diagnostic.score)+'%':'—'):'Not required'}</td><td>${x.readiness?Number(x.readiness.overallScore)+'%':'—'}</td><td>${x.readiness?Number(x.readiness.evidenceCoverage)+'%':'—'}</td><td>${professional?(x.roleLab?.score!=null?Number(x.roleLab.score)+'%':'—'):'Not required'}</td><td>${professional?(Number(x.roleLab?.revisions||0)||'—'):'Not required'}</td><td>${professional?(x.final?.score!=null?Number(x.final.score)+'%':'—'):'Not required'}</td>",'employer table advanced fields');
enterprise=once(enterprise,"const x=learners[Number(b.dataset.openLearner)],sig=learnerAttention(x),stage=learnerProgressStage(x);","const x=learners[Number(b.dataset.openLearner)],sig=learnerAttention(x,reportTrack),stage=learnerProgressStage(x,reportTrack);",'manager drilldown track-aware state');
enterprise=once(enterprise,"<div><span>Role Lab revisions</span><b>${Number(x.roleLab?.revisions||0)}</b></div>","<div><span>${professional?'Role Lab revisions':'Advanced Role Lab'}</span><b>${professional?Number(x.roleLab?.revisions||0):'Not required'}</b></div>",'manager drilldown advanced scope');
save(enterprisePath,enterprise);

console.log('Career Skills reports/exports hardening applied.');
