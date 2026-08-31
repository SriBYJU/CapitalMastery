import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DB='capital-mastery-prod';
const WRANGLER=['--yes','wrangler@4','d1','execute',DB,'--remote'];
const requiredEnv=['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID'];
const allowWranglerOAuth=process.env.CM_ALLOW_WRANGLER_OAUTH==='1';
const MIGRATION_016='migrations/016_phase2_career_skills_track_constraints.sql';
const MIGRATION_017='migrations/017_phase2_program_completion_records.sql';
const MIGRATION_018='migrations/018_assessment_attempt_reviews.sql';
for(const name of requiredEnv){
  if(!allowWranglerOAuth&&!String(process.env[name]||'').trim()) throw new Error(`Missing ${name}; refusing production D1 mutation`);
}
if(allowWranglerOAuth) console.log('Using the explicitly authorized local Wrangler OAuth session.');

function wrangler(args,label){
  const windowsNpx=path.join(path.dirname(process.execPath),'node_modules','npm','bin','npx-cli.js');
  const executable=process.platform==='win32'?process.execPath:'npx';
  const prefix=process.platform==='win32'?[windowsNpx]:[];
  const r=spawnSync(executable,[...prefix,...WRANGLER,...args],{encoding:'utf8',env:process.env,maxBuffer:16*1024*1024});
  if(r.error) throw new Error(`${label} could not start ${executable}: ${r.error.message}`);
  if(r.status!==0) throw new Error(`${label} failed (exit ${r.status ?? 'unknown'})\n${r.stderr||r.stdout||'Wrangler returned no diagnostic output.'}`);
  return r.stdout;
}
function parseJson(text,label){
  try{return JSON.parse(text);}catch(error){throw new Error(`${label} did not return JSON: ${text.slice(0,1200)}`);}
}
function rowsFrom(payload){
  const list=Array.isArray(payload)?payload:[payload];
  return list.flatMap(x=>Array.isArray(x?.results)?x.results:[]);
}
function sql(command,label){
  return rowsFrom(parseJson(wrangler(['--command',command,'--json'],label),label));
}
function file(path,label){
  if(!fs.existsSync(path)) throw new Error(`${label}: migration file missing: ${path}`);
  wrangler(['--file',path,'--json'],label);
}
function norm(value){return String(value||'').replace(/\s+/g,' ').toLowerCase();}
function assert(condition,message){if(!condition)throw new Error(message);}

function requireD1SafeMigration016(){
  if(!fs.existsSync(MIGRATION_016)) throw new Error(`Migration file missing: ${MIGRATION_016}`);
  const source=norm(fs.readFileSync(MIGRATION_016,'utf8'));
  assert(source.includes('pragma defer_foreign_keys = on'),'Migration 016 must use D1-compatible defer_foreign_keys before parent-table rebuilds');
  assert(source.includes('pragma defer_foreign_keys = off'),'Migration 016 must restore deferred checking before completing');
  assert(!source.includes('pragma foreign_keys = off'),'Migration 016 must not attempt to disable foreign_keys inside D1 implicit transactions');
}
function schemaRows(){
  return sql("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('cohorts','program_assignments','program_completion_records','assessment_attempt_reviews') ORDER BY name;",'Read production table schemas');
}
function byName(rows){return new Map(rows.map(r=>[r.name,r]));}
function tableColumns(name){
  return sql(`PRAGMA table_info(${name});`,`Read ${name} columns`).map(r=>String(r.name));
}
function requireColumns(name,required){
  const got=new Set(tableColumns(name));
  const missing=required.filter(x=>!got.has(x));
  assert(!missing.length,`${name} is an unknown/partial schema; missing columns: ${missing.join(', ')}`);
}
function explicitSchemaObjects(table){
  return sql(`SELECT type,name,sql FROM sqlite_master WHERE tbl_name='${table}' AND type IN ('index','trigger') AND sql IS NOT NULL ORDER BY type,name;`,`Read ${table} indexes/triggers`);
}
function requireKnownRebuildObjects(){
  const expected=new Map([
    ['cohorts',new Set(['idx_cohorts_org_status'])],
    ['program_assignments',new Set(['idx_assignments_org_cohort'])]
  ]);
  for(const [table,allowed] of expected){
    const unexpected=explicitSchemaObjects(table).filter(row=>!allowed.has(String(row.name))).map(row=>`${row.type}:${row.name}`);
    assert(!unexpected.length,`${table} has production indexes/triggers not recreated by migration 016 (${unexpected.join(', ')}); refusing automatic rebuild`);
  }
}
function snapshotCounts(){
  const tables=sql("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",'List production tables').map(r=>r.name);
  const wanted=['organizations','organization_members','cohorts','cohort_members','program_assignments','firm_content','credentials','official_progress','program_completion_records','assessment_attempts','assessment_attempt_reviews'].filter(x=>tables.includes(x));
  const out={};
  for(const name of wanted){
    const row=sql(`SELECT COUNT(*) AS n FROM ${name};`,`Count ${name}`)[0];
    out[name]=Number(row?.n||0);
  }
  return out;
}
function assertUnchanged(before,after,names){
  for(const name of names){
    if(before[name]===undefined||after[name]===undefined) continue;
    assert(before[name]===after[name],`${name} row count changed unexpectedly: ${before[name]} -> ${after[name]}`);
  }
}

requireD1SafeMigration016();
console.log('D1 production schema inspection: START');
const beforeCounts=snapshotCounts();
let schemas=byName(schemaRows());
const cohort=schemas.get('cohorts');
const assignment=schemas.get('program_assignments');
assert(cohort&&assignment,'Expected cohorts and program_assignments tables are missing; refusing migration');
requireColumns('cohorts',['id','org_id','name','pathway_id','program_level','status','deadline_at','created_by_uid','created_at','updated_at']);
requireColumns('program_assignments',['id','org_id','cohort_id','pathway_id','track','credential_target','status','due_at','curriculum_version','created_by_uid','created_at','updated_at']);

const cohortSql=norm(cohort.sql), assignmentSql=norm(assignment.sql);
const cohortCareer=cohortSql.includes("'career_skills'");
const assignmentCareer=assignmentSql.includes("'career_skills'")&&assignmentSql.includes("'career'");
assert(cohortCareer===assignmentCareer,'Partial Career Skills constraint migration detected; refusing automatic repair');

let applied016=false;
if(!cohortCareer){
  requireKnownRebuildObjects();
  console.log('Migration 016 required: production CHECK constraints do not yet allow Career Skills.');
  file(MIGRATION_016,'Apply migration 016');
  applied016=true;
  schemas=byName(schemaRows());
  const c=norm(schemas.get('cohorts')?.sql), a=norm(schemas.get('program_assignments')?.sql);
  assert(c.includes("'career_skills'")&&a.includes("'career_skills'")&&a.includes("'career'"),'Migration 016 did not produce the expected Career Skills constraints');
}else{
  console.log('Migration 016 already represented in production schema; skipping.');
}

schemas=byName(schemaRows());
let applied017=false;
const completion=schemas.get('program_completion_records');
if(!completion){
  console.log('Migration 017 required: program_completion_records is absent.');
  file(MIGRATION_017,'Apply migration 017');
  applied017=true;
}else{
  console.log('program_completion_records already exists; validating instead of reapplying migration 017.');
}
requireColumns('program_completion_records',['completion_id','public_token','uid','holder_name','pathway_id','program_code','completion_title','status','org_id','cohort_id','assignment_id','capstone_score','evidence_summary_json','issued_at','revoked_at','revocation_reason']);
const completionSql=norm(byName(schemaRows()).get('program_completion_records')?.sql);
assert(completionSql.includes('public_token text not null unique'),'program_completion_records public_token uniqueness contract missing');
assert(completionSql.includes("program_code in ('career_skills')"),'program_completion_records program_code CHECK contract missing');
assert(completionSql.includes("status in ('active','revoked')"),'program_completion_records status CHECK contract missing');
const completionIndexes=new Set(sql("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='program_completion_records';",'Read program completion indexes').map(r=>r.name));
for(const idx of ['idx_program_completion_uid_assignment','idx_program_completion_org_assignment','idx_program_completion_pathway']){
  assert(completionIndexes.has(idx),`program_completion_records index missing: ${idx}`);
}

schemas=byName(schemaRows());
let applied018=false;
if(!schemas.get('assessment_attempt_reviews')){
  console.log('Migration 018 required: assessment_attempt_reviews is absent.');
  file(MIGRATION_018,'Apply migration 018');
  applied018=true;
}else{
  console.log('assessment_attempt_reviews already exists; validating instead of reapplying migration 018.');
}
requireColumns('assessment_attempt_reviews',['attempt_id','uid','pathway_id','item_id','item_type','score','passed','answers_json','review_json','submitted_at']);
const reviewIndexes=new Set(sql("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='assessment_attempt_reviews';",'Read assessment review indexes').map(r=>r.name));
assert(reviewIndexes.has('idx_assessment_attempt_reviews_owner'),'assessment_attempt_reviews owner index missing');

const afterCounts=snapshotCounts();
assertUnchanged(beforeCounts,afterCounts,['organizations','organization_members','cohorts','cohort_members','program_assignments','firm_content','credentials','official_progress','program_completion_records','assessment_attempts','assessment_attempt_reviews']);
if(beforeCounts.program_completion_records===undefined){
  assert(afterCounts.program_completion_records===0,'New program_completion_records table must be empty immediately after migration 017');
}
if(beforeCounts.assessment_attempt_reviews===undefined){
  assert(afterCounts.assessment_attempt_reviews===0,'New assessment_attempt_reviews table must be empty immediately after migration 018');
}
const quick=sql('PRAGMA quick_check;','Run D1 quick_check');
const quickValue=String(quick[0]?.quick_check??Object.values(quick[0]||{})[0]??'');
assert(quickValue.toLowerCase()==='ok',`PRAGMA quick_check failed: ${quickValue}`);
const fk=sql('PRAGMA foreign_key_check;','Run D1 foreign_key_check');
assert(fk.length===0,`PRAGMA foreign_key_check returned ${fk.length} violation(s)`);

const summary={database:DB,applied016,applied017,applied018,quickCheck:'ok',foreignKeyViolations:0,beforeCounts,afterCounts,checkedAt:new Date().toISOString()};
fs.writeFileSync('d1-production-preflight.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
console.log('D1 PRODUCTION PREPARE GATE: PASS');
