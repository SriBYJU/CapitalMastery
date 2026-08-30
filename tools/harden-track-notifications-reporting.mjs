import fs from 'node:fs';

const load=p=>fs.readFileSync(p,'utf8');
const save=(p,s)=>fs.writeFileSync(p,s);
function once(text,from,to,label){const i=text.indexOf(from);if(i<0)throw new Error(`Missing patch target: ${label}`);if(text.indexOf(from,i+from.length)>=0)throw new Error(`Ambiguous patch target: ${label}`);return text.slice(0,i)+to+text.slice(i+from.length);}
function regexOnce(text,re,to,label){const flags=re.flags.includes('g')?re.flags:re.flags+'g';const matches=[...text.matchAll(new RegExp(re.source,flags))];if(matches.length!==1)throw new Error(`${label}: expected one match, found ${matches.length}`);return text.replace(re,to);}

const workerPath='v2/worker-v2-phase1-release.js';
let worker=load(workerPath);

worker=once(
  worker,
  "ON CONFLICT(recipient_uid,dedupe_key) DO UPDATE SET severity=excluded.severity,title=excluded.title,body=excluded.body,action_hash=excluded.action_hash,updated_at=CURRENT_TIMESTAMP`)",
  "ON CONFLICT(recipient_uid,dedupe_key) DO UPDATE SET severity=excluded.severity,title=excluded.title,body=excluded.body,action_hash=excluded.action_hash,status=CASE WHEN enterprise_notifications.status='archived' THEN 'unread' ELSE enterprise_notifications.status END,updated_at=CURRENT_TIMESTAMP`)",
  'notification reactivation semantics'
);

const newRefresh=`async function refreshEnterpriseNotifications(env,user){
  const activeKeys=[];
  const activeSet=new Set();
  const remember=key=>{ if(key){ activeKeys.push(key); activeSet.add(key); } };
  const completionCredential=async(uid,a)=>{
    if(a.credential_target==='career'){
      return env.DB.prepare(\`SELECT credential_id FROM credentials WHERE uid=? AND pathway_id=? AND credential_level='career' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.pathway_id).first();
    }
    return env.DB.prepare(\`SELECT credential_id FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.id).first();
  };
  const memberships=(await env.DB.prepare(\`SELECT org_id,role FROM organization_members WHERE uid=? AND status='active'\`).bind(user.sub).all()).results||[];
  for(const m of memberships){
    if(ENTERPRISE_EMPLOYER_ROLES.includes(m.role)){
      const assignments=(await env.DB.prepare(\`SELECT a.id,a.cohort_id,a.pathway_id,a.track,a.credential_target,a.due_at,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status='published'\`).bind(m.org_id).all()).results||[];
      for(const a of assignments){
        const professional=a.track==='professional';
        const programLabel=professional?'Professional Readiness':'Career Skills';
        const learners=(await env.DB.prepare(\`SELECT cm.uid,MAX(i.email_normalized) AS email,MAX(cr.holder_name) AS holder_name FROM cohort_members cm LEFT JOIN organization_invites i ON i.org_id=cm.org_id AND i.cohort_id=cm.cohort_id AND i.accepted_by_uid=cm.uid LEFT JOIN credentials cr ON cr.uid=cm.uid WHERE cm.cohort_id=? AND cm.org_id=? AND cm.status='active' GROUP BY cm.uid\`).bind(a.cohort_id,m.org_id).all()).results||[];
        for(const l of learners){
          const name=l.holder_name||l.email||'Learner';
          const cred=await completionCredential(l.uid,a);
          const lab=professional?await env.DB.prepare(\`SELECT score,revision_count,status FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1\`).bind(l.uid,a.id).first():null;
          const readiness=professional?await env.DB.prepare(\`SELECT overall_score,evidence_coverage FROM readiness_snapshots WHERE uid=? AND assignment_id=? ORDER BY created_at DESC LIMIT 1\`).bind(l.uid,a.id).first():null;
          const due=a.due_at?Date.parse(a.due_at):null, days=due?Math.ceil((due-Date.now())/86400000):null;
          let note=null,key=null;
          if(due&&due<Date.now()&&!cred){key=\`employer:overdue:\${a.id}:\${l.uid}\`;note={category:'overdue',severity:'urgent',title:\`Overdue · \${name}\`,body:\`\${a.cohort_name} is past due and \${programLabel} is not complete.\`,actionHash:\`#/employer/\${m.org_id}/reports?assignment=\${a.id}\`};}
          else if(professional&&Number(lab?.revision_count||0)>0&&lab?.status!=='passed'){key=\`employer:revision:\${a.id}:\${l.uid}\`;note={category:'revision',severity:'attention',title:\`Revision cycle · \${name}\`,body:\`\${Number(lab.revision_count)} Role Lab revision cycle\${Number(lab.revision_count)===1?'':'s'} recorded. Review the recurring work-product weakness.\`,actionHash:\`#/employer/\${m.org_id}/reports?assignment=\${a.id}\`};}
          else if(professional&&readiness&&Number(readiness.evidence_coverage||0)>=.7&&Number(readiness.overall_score)<75){key=\`employer:readiness:\${a.id}:\${l.uid}\`;note={category:'readiness',severity:'attention',title:\`Readiness gap · \${name}\`,body:\`Readiness is \${Number(readiness.overall_score)} with \${Math.round(Number(readiness.evidence_coverage)*100)}% evidence coverage.\`,actionHash:\`#/employer/\${m.org_id}/reports?assignment=\${a.id}\`};}
          else if(days!=null&&days>=0&&days<=3&&!cred){key=\`employer:deadline:\${a.id}:\${l.uid}\`;note={category:'deadline',severity:'info',title:\`Due soon · \${name}\`,body:\`\${a.cohort_name} is due in \${days} day\${days===1?'':'s'} · \${programLabel}.\`,actionHash:\`#/employer/\${m.org_id}/reports?assignment=\${a.id}\`};}
          if(note){remember(key);await upsertEnterpriseNotification(env,{recipientUid:user.sub,orgId:m.org_id,assignmentId:a.id,dedupeKey:key,...note});}
        }
      }
    }
  }

  // Learner-side assigned deadlines/revisions. Career Skills never receives
  // Role Lab or Professional Readiness-gap alerts because those are not its gates.
  const learnerAssignments=(await env.DB.prepare(\`SELECT a.id,a.org_id,a.pathway_id,a.track,a.credential_target,a.due_at,c.name AS cohort_name FROM cohort_members cm JOIN program_assignments a ON a.cohort_id=cm.cohort_id AND a.org_id=cm.org_id JOIN cohorts c ON c.id=a.cohort_id WHERE cm.uid=? AND cm.status='active' AND a.status='published'\`).bind(user.sub).all()).results||[];
  for(const a of learnerAssignments){
    const professional=a.track==='professional';
    const cred=await completionCredential(user.sub,a);
    const lab=professional?await env.DB.prepare(\`SELECT revision_count,status FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1\`).bind(user.sub,a.id).first():null;
    const due=a.due_at?Date.parse(a.due_at):null,days=due?Math.ceil((due-Date.now())/86400000):null;
    let note=null,key=null;
    if(due&&due<Date.now()&&!cred){key=\`learner:overdue:\${a.id}\`;note={category:'overdue',severity:'urgent',title:'Assigned training is overdue',body:\`\${a.cohort_name} is past due. Open the assigned \${professional?'Professional Readiness':'Career Skills'} program to continue.\`,actionHash:\`#/assigned/\${a.id}\`};}
    else if(professional&&lab&&Number(lab.revision_count||0)>0&&lab.status!=='passed'){key=\`learner:revision:\${a.id}\`;note={category:'revision',severity:'attention',title:'Role Lab revision required',body:'Manager-style feedback is waiting in your Role Lab. Revise the current work product before continuing.',actionHash:\`#/role-lab/\${a.pathway_id}?assignment=\${a.id}\`};}
    else if(days!=null&&days>=0&&days<=3&&!cred){key=\`learner:deadline:\${a.id}\`;note={category:'deadline',severity:'info',title:'Assigned training due soon',body:\`\${a.cohort_name} is due in \${days} day\${days===1?'':'s'}.\`,actionHash:\`#/assigned/\${a.id}\`};}
    if(note){remember(key);await upsertEnterpriseNotification(env,{recipientUid:user.sub,orgId:a.org_id,assignmentId:a.id,dedupeKey:key,...note});}
  }

  // Generated state alerts are stateful, not permanent inbox messages. Once the
  // condition clears, archive the old alert so a resolved deadline/revision does
  // not remain active. If it becomes true again, the upsert above re-opens it.
  const existing=(await env.DB.prepare(\`SELECT id,dedupe_key FROM enterprise_notifications WHERE recipient_uid=? AND status!='archived' AND category IN ('overdue','revision','readiness','deadline')\`).bind(user.sub).all()).results||[];
  let archivedResolved=0;
  for(const row of existing){
    const key=String(row.dedupe_key||'');
    if((key.startsWith('employer:')||key.startsWith('learner:'))&&!activeSet.has(key)){
      const r=await env.DB.prepare(\`UPDATE enterprise_notifications SET status='archived',updated_at=CURRENT_TIMESTAMP WHERE id=? AND recipient_uid=?\`).bind(row.id,user.sub).run();
      archivedResolved+=Number(r.meta?.changes||0);
    }
  }
  return {activeGenerated:activeKeys.length,archivedResolved};
}`;
worker=regexOnce(worker,/async function refreshEnterpriseNotifications\(env,user\)\{[\s\S]*?return \{activeGenerated:activeKeys\.length\};\n\}/,newRefresh,'track-aware notification refresh');
save(workerPath,worker);

const enterprisePath='enterprise-v2.js';
let enterprise=load(enterprisePath);
enterprise=regexOnce(enterprise,/  function learnerProgressStage\(x\) \{[\s\S]*?\n  \}/,`  function learnerProgressStage(x,track='professional') {\n    if(track==='career_skills'){\n      if(x.complete) return {rank:4,label:'Career Skills verified',tone:'good'};\n      if(x.credential?.status==='active') return {rank:4,label:'Career Skills credential earned',tone:'good'};\n      if(x.readiness) return {rank:2,label:'Career Skills evidence in progress',tone:'active'};\n      return {rank:0,label:'Career Skills · not complete',tone:'muted'};\n    }\n    if (x.complete) return {rank:5,label:'Professional Readiness verified',tone:'good'};\n    if (x.final?.passed) return {rank:4,label:'Final passed · credential pending',tone:'good'};\n    if (x.roleLab?.status === 'passed') return {rank:3,label:'Role Lab passed · final next',tone:'active'};\n    if (x.roleLab) return {rank:2,label:Number(x.roleLab.revisions||0)>0?'Role Lab · revision cycle':'Role Lab in progress',tone:Number(x.roleLab.revisions||0)>0?'warn':'active'};\n    if (x.diagnostic) return {rank:1,label:'Technical / applied training',tone:'active'};\n    return {rank:0,label:'Not started',tone:'muted'};\n  }`,'track-aware learner stage');
enterprise=regexOnce(enterprise,/  function learnerAttention\(x\) \{[\s\S]*?\n  \}/,`  function learnerAttention(x,track='professional') {\n    const stage=learnerProgressStage(x,track);\n    if (x.overdue && !x.complete) return {priority:100,label:'Overdue',reason:\`\${stage.label}; deadline has passed.\`,action:'Follow up on completion plan'};\n    if (x.managerReview?.reviewStatus==='needs_attention') return {priority:95,label:'Manager review',reason:x.managerReview.comment||'Manager marked this learner for attention.',action:'Follow the recorded manager coaching note'};\n    if(track==='career_skills'){\n      if(x.readiness && Number(x.readiness.evidenceCoverage||0)>=70 && Number(x.readiness.overallScore||0)<75) return {priority:70,label:'Skill evidence gap',reason:\`Current measured skill evidence is \${Number(x.readiness.overallScore)} with \${Number(x.readiness.evidenceCoverage)}% evidence coverage.\`,action:'Review the lowest measured Career Skills competencies'};\n      return null;\n    }\n    if (x.roleLab?.revisions>1) return {priority:90,label:'Repeated revisions',reason:\`\${Number(x.roleLab.revisions||0)} Role Lab revisions; review the feedback pattern.\`,action:'Coach the weakest work-product skill'};\n    if (x.readiness && Number(x.readiness.evidenceCoverage||0)>=70 && Number(x.readiness.overallScore||0)<75) return {priority:80,label:'Readiness gap',reason:\`\${Number(x.readiness.overallScore)}% readiness with \${Number(x.readiness.evidenceCoverage)}% evidence coverage.\`,action:'Target lowest measured competencies'};\n    if (x.roleLab?.score!=null && Number(x.roleLab.score)<80) return {priority:70,label:'Role Lab below standard',reason:\`Role Lab \${Number(x.roleLab.score)}%; applied performance needs development.\`,action:'Review Role Lab feedback and revision'};\n    return null;\n  }`,'track-aware learner attention');

enterprise=once(
  enterprise,
  "const learners=report?.learners||[]; const attention=learners.map(x=>({learner:x,signal:learnerAttention(x)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority).slice(0,6);\n      const readyCount=learners.filter(x=>x.complete || x.readiness?.status==='ready').length;\n      const startedCount=learners.filter(x=>x.diagnostic||x.roleLab||x.final).length;",
  "const learners=report?.learners||[]; const reportTrack=report?.assignment?.track||as[0]?.track||'professional'; const attention=learners.map(x=>({learner:x,signal:learnerAttention(x,reportTrack)})).filter(x=>x.signal).sort((a,b)=>b.signal.priority-a.signal.priority).slice(0,6);\n      const readyCount=learners.filter(x=>x.complete || (reportTrack==='professional'&&x.readiness?.status==='ready')).length;\n      const startedCount=learners.filter(x=>x.complete||x.credential||x.readiness||x.diagnostic||x.roleLab||x.final).length;",
  'command-center track-aware signals'
);
enterprise=once(enterprise,'${esc(learnerProgressStage(x).label)}','${esc(learnerProgressStage(x,reportTrack).label)}','command-center learner stage label');
enterprise=once(enterprise,'done:learners.some(x=>learnerAttention(x))','done:learners.some(x=>learnerAttention(x,report?.assignment?.track||assignments[0]?.track||\'professional\'))','guide coaching completion');
save(enterprisePath,enterprise);

console.log('Program-aware notifications and reporting hardening applied.');
