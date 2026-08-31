import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnPython} from './python-runtime.mjs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const must=(v,m)=>{if(!v)throw new Error(m);};

must(worker.includes("assignment.accessRole!=='learner'"),'Completion issuance must require learner assignment access');
must(worker.includes("assignment.track!=='career_skills' || assignment.credential_target!=='career'"),'Completion issuance must enforce Career Skills track/target');
must(worker.includes("assignment.status!=='published'"),'Completion issuance must require a published assignment');
must(worker.includes("assignment.cohort_status!=='active'"),'Completion issuance must require an active cohort');
must(worker.includes("assignment.member_status!=='active'"),'Completion issuance must require active cohort membership');
must(worker.includes("credential_level IN ('foundations','essentials','applied')"),'Completion issuance must require the three shared verified credentials');
must(worker.includes("recordType:'program_completion'"),'Assignment completion must remain a program-completion record, not a sixth Standard credential');

const reportStart=worker.indexOf("parts[3] === 'readiness-report' && parts.length === 4");
const learnerReportStart=worker.indexOf("parts[1] === 'learner' && parts[2] === 'readiness-report'",reportStart);
const employerReport=worker.slice(reportStart,learnerReportStart);
must(reportStart>0&&learnerReportStart>reportStart,'Could not isolate employer report implementation');
must(employerReport.includes("FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=?"),'Employer report must bind uid + tenant + assignment + pathway');
must(!employerReport.includes("credential_level='career'"),'Employer report must not accept a generic public Career certificate');

const noteStart=worker.indexOf('async function refreshEnterpriseNotifications');
const noteEnd=worker.indexOf('// Generated state alerts are stateful',noteStart);
const notifications=worker.slice(noteStart,noteEnd);
must(notifications.includes("FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=?"),'Deadline notifications must use assignment-scoped Career Skills completion');

must(enterprise.includes('#/official-simulation/'),'Assigned Career Skills must link directly to the authoritative capstone');
must(enterprise.includes('?assignment=${encodeURIComponent(a.id)}'),'Assigned capstone route must preserve assignment identity');
must(enterprise.includes("const scopedCompletion=report.programCompletion?.status==='active'"),'Assigned progress must use scoped program completion');
must(enterprise.includes("report.assignment?.track==='career_skills' ? (report.programCompletion?.status==='active'?report.programCompletion:null)"),'Assigned capstone state must ignore unrelated public Career certificates');
must(live.includes('assignmentId:assignmentId||null'),'Official capstone submit must send assignment context');
must(live.includes('assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`'),'Assigned Career Skills must return to its assignment after capstone instead of Professional Final');
must(worker.includes('DELETE FROM program_completion_records WHERE uid=?'),'Account deletion must purge scoped program completions');
must(worker.includes('programCompletions:programCompletions.results||[]'),'Personal data export must include scoped program completions');

const migration=fs.readFileSync('migrations/017_phase2_program_completion_records.sql','utf8');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cm-assignment-scope-'));
const migrationPath=path.join(temp,'migration.sql');
fs.writeFileSync(migrationPath,migration);
const py=String.raw`
import sqlite3,sys
conn=sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''
CREATE TABLE organizations(id TEXT PRIMARY KEY);
CREATE TABLE cohorts(id TEXT PRIMARY KEY,org_id TEXT NOT NULL,FOREIGN KEY(org_id) REFERENCES organizations(id));
CREATE TABLE program_assignments(id TEXT PRIMARY KEY,org_id TEXT NOT NULL,cohort_id TEXT NOT NULL,pathway_id TEXT NOT NULL,FOREIGN KEY(org_id) REFERENCES organizations(id),FOREIGN KEY(cohort_id) REFERENCES cohorts(id));
''')
conn.executescript(open(sys.argv[1],encoding='utf8').read())
for org in ('org_a','org_b'):
    conn.execute('INSERT INTO organizations(id) VALUES(?)',(org,))
conn.execute("INSERT INTO cohorts(id,org_id) VALUES('coh_a','org_a')")
conn.execute("INSERT INTO cohorts(id,org_id) VALUES('coh_b','org_b')")
conn.execute("INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id) VALUES('asn_a','org_a','coh_a','private-equity')")
conn.execute("INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id) VALUES('asn_b','org_b','coh_b','private-equity')")
conn.execute("INSERT INTO program_completion_records(completion_id,public_token,uid,holder_name,pathway_id,program_code,completion_title,status,org_id,cohort_id,assignment_id,capstone_score) VALUES('cmp_b','tok_b','learner','Learner','private-equity','career_skills','PE Career Skills','active','org_b','coh_b','asn_b',91)")
q="SELECT completion_id FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active'"
assert conn.execute(q,('learner','org_a','asn_a','private-equity')).fetchone() is None
assert conn.execute(q,('learner','org_b','asn_b','private-equity')).fetchone()==('cmp_b',)
assert conn.execute('PRAGMA foreign_key_check').fetchall()==[]
print('SQLITE ASSIGNMENT SCOPE ATTACK FIXTURE PASS')
`;
const r=spawnPython(['-c',py,migrationPath],{encoding:'utf8'});
if(r.status!==0)throw new Error(`${r.stdout}\n${r.stderr}`);
process.stdout.write(r.stdout);
console.log('CAREER SKILLS ASSIGNMENT SCOPE AUDIT PASS: public/other-assignment evidence cannot satisfy a scoped employer assignment');
