import fs from 'node:fs';

const must=(v,m)=>{if(!v)throw new Error(m);};
const workerConfig=fs.readFileSync('wrangler.jsonc','utf8');
const productionOverlay=fs.readFileSync('v2/production-experience-overlay.js','utf8');
const adminOverlay=fs.readFileSync('v2/platform-admin-overlay.js','utf8');
const releaseEvidence=fs.readFileSync('docs/release-evidence/cloudflare-workers-builds-2026-09-08.md','utf8');
const liveAudit=fs.readFileSync('.github/workflows/live-production-readonly-audit.yml','utf8');
const tool=fs.readFileSync('tools/prepare-production-d1.mjs','utf8');
const migration016=fs.readFileSync('migrations/016_phase2_career_skills_track_constraints.sql','utf8');

must(!fs.existsSync('.github/workflows/cloudflare-production-release.yml'),'Obsolete GitHub-secret Worker deployment workflow must stay removed');
must(releaseEvidence.includes('Cloudflare Workers Builds'),'Release evidence must identify Cloudflare Workers Builds as the Worker deployment path');
must(releaseEvidence.includes('Production branch: `main`'),'Cloudflare Workers Builds production branch must be main');
must(releaseEvidence.includes('Deploy command: `npx wrangler deploy`'),'Cloudflare Workers Builds must deploy with Wrangler');
must(releaseEvidence.includes('D1 schema migrations are intentionally not run automatically'),'Worker Builds must not implicitly mutate production D1 on every push');
must(releaseEvidence.includes('tools/prepare-production-d1.mjs'),'Release evidence must preserve the explicit fail-closed D1 migration path');
must(releaseEvidence.includes('Cloudflare Pages is not the canonical frontend deployment target'),'GitHub Pages must remain the canonical frontend');

must(workerConfig.includes('"name": "capital-mastery-api"'),'Wrangler must target the existing production Worker');
must(workerConfig.includes('"main": "v2/production-experience-overlay.js"'),'Wrangler must deploy the production experience entrypoint');
must(productionOverlay.includes("import coreWorker from './platform-admin-overlay.js'"),'Production experience overlay must delegate through the founder-admin overlay');
must(adminOverlay.includes("import coreWorker from './worker-v2-phase1-release.js'"),'Founder-admin overlay must delegate to the reviewed core Worker');
must(workerConfig.includes('"keep_vars": true'),'Worker deployment must preserve existing production variables/secrets');
must(workerConfig.includes('"ALLOWED_ORIGIN": "https://sribyju.github.io"'),'Worker must pin the canonical GitHub Pages origin');
must(workerConfig.includes('"binding": "DB"'),'Worker must retain the production D1 binding');
must(workerConfig.includes('"database_name": "capital-mastery-prod"'),'Worker must retain the production D1 database');

must(liveAudit.includes('Inspect Worker D1, CORS, origin and auth boundaries'),'Live release audit must verify Worker security boundaries');
must(liveAudit.includes('/enterprise/admin/organizations'),'Live release audit must verify the founder Employer Usage route exists and is protected');
must(liveAudit.includes('tests/platform-admin-employer-usage-browser-audit.cjs'),'Live browser matrix must include platform-admin Employer Usage');
must(liveAudit.includes('tests/admin-route-zero-exposure-browser-audit.cjs'),'Live browser matrix must include Admin zero-exposure race protection');
must(liveAudit.includes('tests/employer-role-matrix-browser-audit.cjs'),'Live browser matrix must include employer RBAC regression');
must(liveAudit.includes('tests/employer-invite-lifecycle-browser-audit.cjs'),'Live browser matrix must include employer invitation lifecycle regression');

must(tool.includes("const DB='capital-mastery-prod'"),'D1 preparation must pin the production database explicitly');
must(tool.includes("MIGRATION_016='migrations/016_phase2_career_skills_track_constraints.sql'"),'D1 tool may conditionally apply exact migration 016');
must(tool.includes("MIGRATION_017='migrations/017_phase2_program_completion_records.sql'"),'D1 tool may conditionally apply exact migration 017');
must(tool.includes("MIGRATION_018='migrations/018_assessment_attempt_reviews.sql'"),'D1 tool may conditionally apply exact migration 018');
must(!tool.includes('d1 migrations apply'),'Production preparation must not blindly apply the migration directory/ledger');
must(!tool.includes('migrations/015_'),'Production preparation must not replay older migrations');
must(tool.includes("assert(cohortCareer===assignmentCareer,'Partial Career Skills constraint migration detected; refusing automatic repair')"),'Partial 016 state must fail closed');
must(tool.includes('requireKnownRebuildObjects();'),'Migration 016 must fail closed if production has unexpected indexes/triggers that the rebuild would drop');
must(tool.includes("program_completion_records already exists; validating instead of reapplying migration 017"),'Existing 017 schema must be validated rather than blindly reapplied');
must(tool.includes("'program_completion_records'"),'Existing Program Completion rows must be included in before/after preservation checks');
must(tool.includes("New program_completion_records table must be empty immediately after migration 017"),'A newly created Program Completion table must start empty');
must(tool.includes("New assessment_attempt_reviews table must be empty immediately after migration 018"),'A newly created assessment review table must start empty');
must(tool.includes('assertUnchanged(beforeCounts,afterCounts'),'Critical production row counts must be compared before/after migration');
must(tool.includes("PRAGMA quick_check;"),'Production D1 gate must require quick_check');
must(tool.includes("PRAGMA foreign_key_check;"),'Production D1 gate must require foreign_key_check');
must(tool.includes("requiredEnv=['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID']"),'D1 mutation must require Cloudflare credentials when token auth is used');
must(tool.includes("process.env.CM_ALLOW_WRANGLER_OAUTH==='1'"),'Manual D1 promotion may use only an explicit Wrangler OAuth authorization flag');
must(tool.includes('refusing production D1 mutation'),'Missing deployment credentials must fail closed');
must(tool.includes("fs.writeFileSync('d1-production-preflight.json'"),'D1 preparation must emit release evidence');

must(/PRAGMA\s+defer_foreign_keys\s*=\s*ON/i.test(migration016),'Migration 016 must use D1-compatible defer_foreign_keys before rebuilding referenced parent tables');
must(/PRAGMA\s+defer_foreign_keys\s*=\s*OFF/i.test(migration016),'Migration 016 must restore deferred checking');
must(!/PRAGMA\s+foreign_keys\s*=\s*OFF/i.test(migration016),'Migration 016 must never rely on foreign_keys=OFF inside D1 implicit transactions');
must(tool.includes("Migration 016 must not attempt to disable foreign_keys inside D1 implicit transactions"),'Production preflight must reject regression to the unsafe D1 pragma');

console.log('PRODUCTION RELEASE ARCHITECTURE AUDIT PASS: Cloudflare Workers Builds deploys the production/admin/core Worker chain; D1 changes remain explicit and fail-closed; GitHub Pages stays canonical');
