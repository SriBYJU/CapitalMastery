const MIGRATION_016=String.raw`
PRAGMA defer_foreign_keys = ON;
CREATE TABLE cohorts_phase2 (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, pathway_id TEXT NOT NULL,
  program_level TEXT NOT NULL CHECK (program_level IN ('foundations','essentials','career_skills','professional')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  deadline_at TEXT, created_by_uid TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (org_id) REFERENCES organizations(id)
);
INSERT INTO cohorts_phase2 (id,org_id,name,pathway_id,program_level,status,deadline_at,created_by_uid,created_at,updated_at)
SELECT id,org_id,name,pathway_id,program_level,status,deadline_at,created_by_uid,created_at,updated_at FROM cohorts;
DROP TABLE cohorts;
ALTER TABLE cohorts_phase2 RENAME TO cohorts;
CREATE INDEX IF NOT EXISTS idx_cohorts_org_status ON cohorts(org_id,status);
CREATE TABLE program_assignments_phase2 (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL, cohort_id TEXT NOT NULL, pathway_id TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('foundations','career_skills','professional')),
  credential_target TEXT NOT NULL CHECK (credential_target IN ('foundations','essentials','applied','career','role_lab','professional_readiness')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','completed','archived')),
  due_at TEXT, curriculum_version TEXT NOT NULL DEFAULT '2.0', created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id), FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
);
INSERT INTO program_assignments_phase2 (id,org_id,cohort_id,pathway_id,track,credential_target,status,due_at,curriculum_version,created_by_uid,created_at,updated_at)
SELECT id,org_id,cohort_id,pathway_id,track,credential_target,status,due_at,curriculum_version,created_by_uid,created_at,updated_at FROM program_assignments;
DROP TABLE program_assignments;
ALTER TABLE program_assignments_phase2 RENAME TO program_assignments;
CREATE INDEX IF NOT EXISTS idx_assignments_org_cohort ON program_assignments(org_id,cohort_id,status);
PRAGMA defer_foreign_keys = OFF;
`;

const MIGRATION_017=String.raw`
CREATE TABLE IF NOT EXISTS program_completion_records (
  completion_id TEXT PRIMARY KEY, public_token TEXT NOT NULL UNIQUE, uid TEXT NOT NULL, holder_name TEXT NOT NULL,
  pathway_id TEXT NOT NULL, program_code TEXT NOT NULL CHECK (program_code IN ('career_skills')),
  completion_title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  org_id TEXT NOT NULL, cohort_id TEXT NOT NULL, assignment_id TEXT NOT NULL,
  capstone_score INTEGER NOT NULL CHECK (capstone_score >= 0 AND capstone_score <= 100),
  evidence_summary_json TEXT NOT NULL DEFAULT '{}', issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT, revocation_reason TEXT, FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id), FOREIGN KEY (assignment_id) REFERENCES program_assignments(id),
  UNIQUE(uid,assignment_id,program_code)
);
CREATE INDEX IF NOT EXISTS idx_program_completion_uid_assignment ON program_completion_records(uid,assignment_id,status);
CREATE INDEX IF NOT EXISTS idx_program_completion_org_assignment ON program_completion_records(org_id,assignment_id,status);
CREATE INDEX IF NOT EXISTS idx_program_completion_pathway ON program_completion_records(uid,pathway_id,program_code,status);
`;

const MIGRATION_018=String.raw`
CREATE TABLE IF NOT EXISTS assessment_attempt_reviews (
  attempt_id TEXT PRIMARY KEY, uid TEXT NOT NULL, pathway_id TEXT NOT NULL, item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed INTEGER NOT NULL CHECK (passed IN (0,1)), answers_json TEXT NOT NULL DEFAULT '{}',
  review_json TEXT NOT NULL DEFAULT '[]', submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempt_reviews_owner ON assessment_attempt_reviews(uid,pathway_id,item_id,passed,score,submitted_at);
`;

const COUNT_TABLES=['organizations','organization_members','cohorts','cohort_members','program_assignments','firm_content','credentials','official_progress','program_completion_records','assessment_attempts','assessment_attempt_reviews'];

function response(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function assert(value,message){if(!value)throw new Error(message);}
function norm(value){return String(value||'').replace(/\s+/g,' ').toLowerCase();}
async function rows(db,sql,...bindings){const result=await db.prepare(sql).bind(...bindings).all();return result.results||[];}
async function schemas(db){return new Map((await rows(db,"SELECT name,sql FROM sqlite_master WHERE type='table' AND name IN ('cohorts','program_assignments','program_completion_records','assessment_attempt_reviews') ORDER BY name")).map(row=>[row.name,row]));}
async function columns(db,table){return (await rows(db,`PRAGMA table_info(${table})`)).map(row=>String(row.name));}
async function requireColumns(db,table,required){const got=new Set(await columns(db,table));const missing=required.filter(name=>!got.has(name));assert(!missing.length,`${table} is an unknown/partial schema; missing columns: ${missing.join(', ')}`);}
async function explicitObjects(db,table){return rows(db,"SELECT type,name FROM sqlite_master WHERE tbl_name=? AND type IN ('index','trigger') AND sql IS NOT NULL ORDER BY type,name",table);}
async function snapshotCounts(db){const existing=new Set((await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).map(row=>row.name));const result={};for(const table of COUNT_TABLES.filter(name=>existing.has(name))){const row=(await rows(db,`SELECT COUNT(*) AS n FROM ${table}`))[0];result[table]=Number(row?.n||0);}return result;}
function assertUnchanged(before,after){for(const table of COUNT_TABLES){if(before[table]===undefined||after[table]===undefined)continue;assert(before[table]===after[table],`${table} row count changed unexpectedly: ${before[table]} -> ${after[table]}`);}}

async function prepare(db){
  const beforeCounts=await snapshotCounts(db);
  let map=await schemas(db);
  assert(map.has('cohorts')&&map.has('program_assignments'),'Expected cohorts and program_assignments tables are missing; refusing migration');
  await requireColumns(db,'cohorts',['id','org_id','name','pathway_id','program_level','status','deadline_at','created_by_uid','created_at','updated_at']);
  await requireColumns(db,'program_assignments',['id','org_id','cohort_id','pathway_id','track','credential_target','status','due_at','curriculum_version','created_by_uid','created_at','updated_at']);
  const cohortCareer=norm(map.get('cohorts').sql).includes("'career_skills'");
  const assignmentSql=norm(map.get('program_assignments').sql);
  const assignmentCareer=assignmentSql.includes("'career_skills'")&&assignmentSql.includes("'career'");
  assert(cohortCareer===assignmentCareer,'Partial Career Skills constraint migration detected; refusing automatic repair');

  let applied016=false;
  if(!cohortCareer){
    const allowed={cohorts:new Set(['idx_cohorts_org_status']),program_assignments:new Set(['idx_assignments_org_cohort'])};
    for(const table of Object.keys(allowed)){
      const unexpected=(await explicitObjects(db,table)).filter(row=>!allowed[table].has(String(row.name))).map(row=>`${row.type}:${row.name}`);
      assert(!unexpected.length,`${table} has production indexes/triggers not recreated by migration 016 (${unexpected.join(', ')}); refusing automatic rebuild`);
    }
    await db.exec(MIGRATION_016);
    applied016=true;
    map=await schemas(db);
    const cohortSql=norm(map.get('cohorts')?.sql), nextAssignmentSql=norm(map.get('program_assignments')?.sql);
    assert(cohortSql.includes("'career_skills'")&&nextAssignmentSql.includes("'career_skills'")&&nextAssignmentSql.includes("'career'"),'Migration 016 did not produce the expected constraints');
  }

  map=await schemas(db);
  let applied017=false;
  if(!map.has('program_completion_records')){await db.exec(MIGRATION_017);applied017=true;}
  await requireColumns(db,'program_completion_records',['completion_id','public_token','uid','holder_name','pathway_id','program_code','completion_title','status','org_id','cohort_id','assignment_id','capstone_score','evidence_summary_json','issued_at','revoked_at','revocation_reason']);
  const completionSql=norm((await schemas(db)).get('program_completion_records')?.sql);
  assert(completionSql.includes('public_token text not null unique'),'program_completion_records public_token uniqueness contract missing');
  assert(completionSql.includes("program_code in ('career_skills')"),'program_completion_records program_code CHECK contract missing');
  assert(completionSql.includes("status in ('active','revoked')"),'program_completion_records status CHECK contract missing');
  const completionIndexes=new Set((await rows(db,"SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='program_completion_records'")).map(row=>row.name));
  for(const name of ['idx_program_completion_uid_assignment','idx_program_completion_org_assignment','idx_program_completion_pathway'])assert(completionIndexes.has(name),`program_completion_records index missing: ${name}`);

  map=await schemas(db);
  let applied018=false;
  if(!map.has('assessment_attempt_reviews')){await db.exec(MIGRATION_018);applied018=true;}
  await requireColumns(db,'assessment_attempt_reviews',['attempt_id','uid','pathway_id','item_id','item_type','score','passed','answers_json','review_json','submitted_at']);
  const reviewIndexes=new Set((await rows(db,"SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='assessment_attempt_reviews'")).map(row=>row.name));
  assert(reviewIndexes.has('idx_assessment_attempt_reviews_owner'),'assessment_attempt_reviews owner index missing');

  const afterCounts=await snapshotCounts(db);
  assertUnchanged(beforeCounts,afterCounts);
  if(beforeCounts.program_completion_records===undefined)assert(afterCounts.program_completion_records===0,'New program_completion_records table must be empty');
  if(beforeCounts.assessment_attempt_reviews===undefined)assert(afterCounts.assessment_attempt_reviews===0,'New assessment_attempt_reviews table must be empty');
  const quick=await rows(db,'PRAGMA quick_check');
  const quickValue=String(quick[0]?.quick_check??Object.values(quick[0]||{})[0]??'');
  assert(quickValue.toLowerCase()==='ok',`PRAGMA quick_check failed: ${quickValue}`);
  const foreignKeys=await rows(db,'PRAGMA foreign_key_check');
  assert(foreignKeys.length===0,`PRAGMA foreign_key_check returned ${foreignKeys.length} violation(s)`);
  return {database:'capital-mastery-prod',applied016,applied017,applied018,quickCheck:'ok',foreignKeyViolations:0,beforeCounts,afterCounts,checkedAt:new Date().toISOString()};
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const expected=String(env.CM_RELEASE_TOKEN||'');
    if(request.method!=='POST'||url.pathname!=='/prepare')return response({ok:false,error:'Not found'},404);
    if(!expected||request.headers.get('Authorization')!==`Bearer ${expected}`)return response({ok:false,error:'Not found'},404);
    try{return response({ok:true,summary:await prepare(env.DB)});}catch(error){return response({ok:false,error:String(error?.message||'D1 preparation failed')},500);}
  }
};
