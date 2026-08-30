import fs from 'node:fs';
const release=fs.readFileSync('.github/workflows/cloudflare-production-release.yml','utf8');
const tool=fs.readFileSync('tools/prepare-production-d1.mjs','utf8');
const migration016=fs.readFileSync('migrations/016_phase2_career_skills_track_constraints.sql','utf8');
const must=(v,m)=>{if(!v)throw new Error(m);};

const d1Step=release.indexOf('- name: Prepare and verify production D1 schema before Worker');
const workerStep=release.indexOf('- name: Deploy Worker only after D1 compatibility gate');
const pagesStep=release.indexOf('- name: Deploy exact Pages bundle');
must(d1Step>=0,'Production release must include an explicit D1 compatibility step');
must(workerStep>d1Step,'D1 compatibility/migration must finish before Worker deployment');
must(pagesStep>workerStep,'Pages must deploy only after the compatible Worker is live');
must(release.includes('node tools/prepare-production-d1.mjs'),'Production release must execute the schema-aware D1 preparation tool');
must(release.includes('tests/admin-simulation-route-stability-browser-audit.cjs'),'Canonical release matrix must include the delayed-auth Admin simulation race');
must(release.includes('tests/program-completion-public-browser-audit.cjs'),'Canonical release matrix must include Program Completion verification');
const adminRaceCount=(release.match(/tests\/admin-simulation-route-stability-browser-audit\.cjs/g)||[]).length;
const completionBrowserCount=(release.match(/tests\/program-completion-public-browser-audit\.cjs/g)||[]).length;
must(adminRaceCount>=3,'Admin race regression must be syntax-checked and run before + after production deployment');
must(completionBrowserCount>=3,'Program Completion browser regression must be syntax-checked and run before + after production deployment');

must(tool.includes("const DB='capital-mastery-prod'"),'D1 preparation must pin the production database explicitly');
must(tool.includes("MIGRATION_016='migrations/016_phase2_career_skills_track_constraints.sql'"),'D1 tool may conditionally apply exact migration 016');
must(tool.includes("MIGRATION_017='migrations/017_phase2_program_completion_records.sql'"),'D1 tool may conditionally apply exact migration 017');
must(!tool.includes('d1 migrations apply'),'Production preparation must not blindly apply the migration directory/ledger');
must(!tool.includes('migrations/015_'),'Production preparation must not replay older migrations');
must(tool.includes("assert(cohortCareer===assignmentCareer,'Partial Career Skills constraint migration detected; refusing automatic repair')"),'Partial 016 state must fail closed');
must(tool.includes('requireKnownRebuildObjects();'),'Migration 016 must fail closed if production has unexpected indexes/triggers that the rebuild would drop');
must(tool.includes("program_completion_records already exists; validating instead of reapplying migration 017"),'Existing 017 schema must be validated rather than blindly reapplied');
must(tool.includes("'program_completion_records'"),'Existing Program Completion rows must be included in before/after preservation checks');
must(tool.includes("New program_completion_records table must be empty immediately after migration 017"),'A newly created Program Completion table must start empty');
must(tool.includes('assertUnchanged(beforeCounts,afterCounts'),'Critical production row counts must be compared before/after migration');
must(tool.includes("PRAGMA quick_check;"),'Production D1 gate must require quick_check');
must(tool.includes("PRAGMA foreign_key_check;"),'Production D1 gate must require foreign_key_check');
must(tool.includes("requiredEnv=['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID']"),'D1 mutation must require Cloudflare credentials');
must(tool.includes('refusing production D1 mutation'),'Missing deployment credentials must fail closed');
must(tool.includes("fs.writeFileSync('d1-production-preflight.json'"),'D1 preparation must emit release evidence');

must(/PRAGMA\s+defer_foreign_keys\s*=\s*ON/i.test(migration016),'Migration 016 must use D1-compatible defer_foreign_keys before rebuilding referenced parent tables');
must(/PRAGMA\s+defer_foreign_keys\s*=\s*OFF/i.test(migration016),'Migration 016 must restore deferred checking');
must(!/PRAGMA\s+foreign_keys\s*=\s*OFF/i.test(migration016),'Migration 016 must never rely on foreign_keys=OFF inside D1 implicit transactions');
must(tool.includes("Migration 016 must not attempt to disable foreign_keys inside D1 implicit transactions"),'Production preflight must reject regression to the unsafe D1 pragma');

console.log('PRODUCTION D1 RELEASE ORDER AUDIT PASS: source/browser -> D1-safe schema-aware 016/017 -> integrity -> Worker -> Pages ordering is fail-closed');