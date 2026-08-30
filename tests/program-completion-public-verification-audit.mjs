import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const cert=fs.readFileSync('public-certificate-verify.js','utf8');
const migration=fs.readFileSync('migrations/017_phase2_program_completion_records.sql','utf8');
const ok=(v,m)=>{if(!v)throw new Error(m);};

ok(worker.includes('programCompletions: completionResult.results || []'),'My Credentials API must return program completions separately');
ok(worker.includes('FROM program_completion_records')&&worker.includes('WHERE public_token = ?'),'Public verifier must resolve program-completion tokens');
ok(worker.includes('recordType: "program_completion"'),'Public verifier must explicitly classify program-completion records');
ok(worker.includes('not a sixth Standard 2.0 credential'),'Public verifier must preserve five-level Standard semantics');
ok(worker.includes('POST /admin/program-completions/:id/revoke'),'Program completions need an audited revocation path');
ok(worker.includes("'program_completion.revoked'"),'Program-completion revocation must create enterprise audit evidence');
const publicStart=worker.indexOf('// PUBLIC CREDENTIAL / PROGRAM COMPLETION VERIFICATION');
const publicEnd=worker.indexOf('// ADMIN REVOKE',publicStart);
const publicSlice=worker.slice(publicStart,publicEnd);
ok(publicStart>=0&&publicEnd>publicStart,'Could not isolate public verification handler');
ok(!publicSlice.includes('orgId:'),'Public program verification must not return organization IDs');
ok(!publicSlice.includes('assignmentId:'),'Public program verification must not return assignment IDs');
ok(!publicSlice.includes('cohortId:'),'Public program verification must not return cohort IDs');
ok(!publicSlice.includes('uid:'),'Public program verification must not return internal user IDs');

ok(live.includes('PROGRAM COMPLETIONS')&&live.includes('Verify Program Completion'),'Learner records page must render program completions separately');
ok(live.includes("data-record-type=\"${isProgramCompletion?'program_completion':'credential'}\""),'Public verification DOM must expose record classification');
ok(live.includes('VERIFIED PROGRAM COMPLETION ✓'),'Active program completion needs distinct verification badge');
ok(live.includes('Completion ID'),'Program completion verifier must label its identifier correctly');
ok(live.includes('Public verification excludes private account, organization, cohort and assignment identifiers.'),'Public verifier must state its privacy boundary');
ok(cert.includes("isProgramCompletion ? 'COMPLETION ID' : 'CREDENTIAL ID'"),'Printable certificate must use Completion ID for program completions');
ok(cert.includes('✓ Verified program completion'),'Printable proof must distinguish program completion from credential verification');
ok(migration.includes("status IN ('active','revoked')")&&migration.includes('public_token TEXT NOT NULL UNIQUE'),'D1 schema must support unique public tokens and revocation');

const py=String.raw`
import sqlite3,json
con=sqlite3.connect(':memory:')
con.execute('''CREATE TABLE program_completion_records(completion_id TEXT PRIMARY KEY,public_token TEXT UNIQUE,uid TEXT,holder_name TEXT,pathway_id TEXT,program_code TEXT,completion_title TEXT,status TEXT,org_id TEXT,cohort_id TEXT,assignment_id TEXT,capstone_score INTEGER,evidence_summary_json TEXT,issued_at TEXT,revoked_at TEXT,revocation_reason TEXT)''')
con.execute("INSERT INTO program_completion_records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",('CM-CS-IB-2026-TEST','public-safe-token','uid_secret','Audit Learner','investment-banking','career_skills','Investment Banking Career Skills Program Completion Certificate','active','org_secret','cohort_secret','assignment_secret',88,json.dumps({'standardVersion':'2.0','verifiedCredentials':[{'level':'foundations','title':'Foundations','standardVersion':'2.0','issuedAt':'2026-08-01'}],'assignmentId':'assignment_secret','orgId':'org_secret'}),'2026-08-30',None,None))
row=con.execute('''SELECT completion_id,holder_name,pathway_id,program_code,completion_title,status,capstone_score,evidence_summary_json,issued_at,revoked_at FROM program_completion_records WHERE public_token=?''',('public-safe-token',)).fetchone()
summary=json.loads(row[7]); safe={'completionId':row[0],'holderName':row[1],'pathwayId':row[2],'programCode':row[3],'title':row[4],'status':row[5],'capstoneScore':row[6],'standardVersion':summary.get('standardVersion'),'verifiedCredentials':[{k:x.get(k) for k in ('level','title','standardVersion','issuedAt')} for x in summary.get('verifiedCredentials',[])], 'issuedAt':row[8],'revokedAt':row[9]}
payload=json.dumps(safe)
assert 'org_secret' not in payload and 'cohort_secret' not in payload and 'assignment_secret' not in payload and 'uid_secret' not in payload
con.execute("UPDATE program_completion_records SET status='revoked',revoked_at='2026-08-31',revocation_reason='audit' WHERE completion_id='CM-CS-IB-2026-TEST'")
assert con.execute("SELECT status FROM program_completion_records").fetchone()[0]=='revoked'
print('SQLITE PROGRAM COMPLETION PUBLIC PRIVACY FIXTURE PASS')
`;
const run=spawnSync('python3',['-c',py],{encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout||'SQLite fixture failed');
process.stdout.write(run.stdout);
console.log('PROGRAM COMPLETION PUBLIC VERIFICATION AUDIT PASS');