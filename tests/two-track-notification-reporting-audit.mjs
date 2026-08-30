import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(worker.includes("a.track,a.credential_target"), 'Notification queries must load assignment track and credential target');
must(worker.includes("a.credential_target==='career'"), 'Generated notifications must branch on the Career Skills program-completion target');
must(worker.includes("SELECT completion_id AS credential_id FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active'"), 'Career Skills notifications must recognize only the matching assignment-scoped completion record');
must(worker.includes("const professional=a.track==='professional'"), 'Notification generation must branch by program level');
must(worker.includes("professional&&Number(lab?.revision_count||0)>0"), 'Role Lab revision alerts must be Professional Readiness only');
must(worker.includes("professional&&readiness"), 'Readiness-gap alerts must be Professional Readiness only');
must(worker.includes("status='archived'"), 'Resolved generated notifications must be archived');
must(worker.includes('archivedResolved'), 'Notification refresh must report resolved-alert cleanup');
must(worker.includes("enterprise_notifications.status='archived'"), 'A reactivated generated condition must reopen an archived notification');

must(enterprise.includes("function learnerProgressStage(x,track='professional')"), 'Employer learner stage must be program-aware');
must(enterprise.includes("function learnerAttention(x,track='professional')"), 'Employer attention logic must be program-aware');
must(enterprise.includes("if(track==='career_skills')"), 'Employer attention logic must explicitly support Career Skills');
must(enterprise.includes('Skill evidence gap'), 'Career Skills coaching must use skill-evidence language instead of Professional Readiness language');
must(enterprise.includes('reportTrack=report?.assignment?.track'), 'Command Center must use report assignment track');
must(enterprise.includes('learnerAttention(x,reportTrack)'), 'Command Center attention queue must pass program track');
must(enterprise.includes('learnerProgressStage(x,reportTrack)'), 'Command Center stage labels must pass program track');

console.log('two-track-notification-reporting-audit: PASS');
