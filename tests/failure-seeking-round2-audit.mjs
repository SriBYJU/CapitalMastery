import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
const live=fs.readFileSync('capital-mastery-live-ui.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const madeline=fs.readFileSync('madeline.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const workbookAudit=fs.readFileSync('tests/interactive-guidance-workbook-audit.mjs','utf8');

// Admin QA must be both server-admin gated and isolated from authoritative UI.
ok(admin.includes("if (!isAdmin())") && admin.includes('QA control blocked: administrator verification required'), 'Non-admin callers must not be able to run QA score/progress controls');
ok(admin.includes('const originalToggle = window.CM.toggleQa'), 'QA mode toggle must also be wrapped by the admin guard');
ok(live.includes("localStorage.getItem(QA_KEY) === 'true'"), 'Live credential UI must understand isolated Admin QA mode');
ok(live.includes("['credential','certificate','achievement'].includes(root)"), 'Authoritative credential renderer must yield to verified Admin QA previews');
ok(live.includes("window.CM_AUTH?.isAdmin === true"), 'QA preview yield must require verified admin state');

// Career Skills must use authoritative simulation without a legacy redirect hop,
// and Professional Readiness must not deep-link the shorter capstone.
ok(tracks.includes("'official-simulation'"), 'Training-track route parser must know the authoritative Career Skills simulation route');
ok(tracks.includes('Complete the realistic server-graded job simulation and earn Career Skills'), 'Career Skills capstone must be explicitly authoritative/server graded');
ok(tracks.includes('`#/official-simulation/${id}`'), 'Career Skills sequence must link directly to authoritative simulation');
ok(tracks.includes("(route==='simulation'||route==='official-simulation')"), 'Professional Readiness must guard both legacy and authoritative Career Skills simulation deep links');
ok(madeline.includes("#/official-simulation/${c.id}"), 'Madeline must direct Career Skills to the authoritative capstone');

// New releases must not allow old cached versions of recently changed scripts to mix.
for(const asset of [
  'app.js?v=20260830-stability3',
  'training-tracks.js?v=20260830-stability3',
  'capital-mastery-live-ui.js?v=20260830-stability3',
  'madeline.js?v=20260830-stability3',
  'admin-qa-simulation-fix.js?v=20260830-stability3'
]) ok(index.includes(asset), `Missing current cache-bust for ${asset}`);

ok(!index.includes('training-tracks.js?v=20260830-tracks2'), 'Old training-track cache key must not remain');
ok(!index.includes('admin-qa-simulation-fix.js?v=20260828-adminsim2'), 'Old Admin QA cache key must not remain');
ok(workbookAudit.includes('app.js?v=20260830-stability3'), 'Older regression audits must follow the current app cache generation instead of failing on an intentional cache-bust');

console.log('FAILURE-SEEKING ROUND 2 STATIC AUDIT PASS');
