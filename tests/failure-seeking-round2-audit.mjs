import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
const live=fs.readFileSync('capital-mastery-live-ui.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const trainingCss=fs.readFileSync('training-tracks.css','utf8');
const madeline=fs.readFileSync('madeline.js','utf8');
const certName=fs.readFileSync('certificate-name.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const e2e=fs.readFileSync('capital-mastery-e2e.js','utf8');
const ux=fs.readFileSync('ux-stability.js','utf8');
const continuity=fs.readFileSync('course-continuity.js','utf8');
const runtime=fs.readFileSync('runtime-audit-fixes.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const workbookAudit=fs.readFileSync('tests/interactive-guidance-workbook-audit.mjs','utf8');
const notificationAudit=fs.readFileSync('tests/notification-discovery-audit.mjs','utf8');
const mixedSubmitAudit=fs.readFileSync('tests/official-mixed-submit-audit.mjs','utf8');

// Admin QA must be both server-admin gated and isolated from authoritative UI.
ok(admin.includes("['qaProgress', 'qaScores', 'resetState']"), 'All state-mutating QA controls, including reset, must be wrapped');
ok(admin.includes("if (!isAdmin())") && admin.includes('QA control blocked: administrator verification required'), 'Non-admin callers must not be able to run QA score/progress/reset controls');
ok(admin.includes('const originalToggle = window.CM.toggleQa'), 'QA mode toggle must also be wrapped by the admin guard');
ok(live.includes("localStorage.getItem(QA_KEY) === 'true'"), 'Live credential UI must understand isolated Admin QA mode');
ok(live.includes("['credential','certificate','achievement'].includes(root)"), 'Authoritative credential renderer must yield to verified Admin QA previews');
ok(live.includes("window.CM_AUTH?.isAdmin === true"), 'QA preview yield must require verified admin state');
ok(app.includes("if(c.id==='investment-banking' && !qaMode())"), 'Investment Banking must stay on the local simulation surface for verified Admin QA preview mode');

// A raw localStorage flag must never be enough to activate QA bypasses.
for(const [name,source] of Object.entries({app,e2e,ux,continuity,runtime})) {
  ok(source.includes('window.CM_AUTH?.isAdmin === true') && source.includes("localStorage.getItem(QA_KEY) === 'true'"), `${name} QA mode must require verified administrator state`);
}
ok(!e2e.includes("function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';"), 'E2E layer must not trust localStorage alone for QA bypass');
ok(!ux.includes("function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';"), 'UX layer must not trust localStorage alone for QA bypass');
ok(!continuity.includes("function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';"), 'Course continuity must not trust localStorage alone for QA bypass');

// Career Skills must use authoritative simulation without a legacy redirect hop,
// and Professional Readiness must not deep-link the shorter capstone.
ok(tracks.includes("'official-simulation'"), 'Training-track route parser must know the authoritative Career Skills simulation route');
ok(tracks.includes('Complete the realistic server-graded job simulation and earn Career Skills'), 'Career Skills capstone must be explicitly authoritative/server graded');
ok(tracks.includes('`#/official-simulation/${id}`'), 'Career Skills sequence must link directly to authoritative simulation');
ok(tracks.includes("(route==='simulation'||route==='official-simulation')"), 'Professional Readiness must guard both legacy and authoritative Career Skills simulation deep links');
ok(madeline.includes("#/official-simulation/${c.id}"), 'Madeline must direct Career Skills to the authoritative capstone');

// Signed-out gating must keep route state and rendered state synchronized.
ok(certName.includes("if (location.hash !== '#/') location.replace(publicHome)"), 'Gated signed-out routes must perform a real hash navigation back to public Home');
ok(!certName.includes("history.replaceState(null, '', `${location.pathname}${location.search}#/`)"), 'Silent history replacement must not leave stale gated DOM under the account modal');
ok(certName.includes('setTimeout(() => openLearningGate(hash), 0)'), 'Account reason modal should open after the public Home rerender, not race it');

// The interactive guide may contain wide spreadsheet work, but the page itself
// must stay viewport-contained while the workbook becomes the horizontal scroller.
ok(trainingCss.includes('Failure-seeking mobile containment'),'Learner Guide mobile overflow hardening marker missing from loaded CSS');
ok(trainingCss.includes('.cm-learner-guide-nav,.cm-learner-guide-panels')&&trainingCss.includes('min-width:0;max-width:100%'),'Learner Guide nav/panel grid items must be allowed to shrink on narrow viewports');
ok(trainingCss.includes('grid-template-columns:minmax(0,100%)!important')&&trainingCss.includes('contain:inline-size'),'Learner Guide responsive grid tracks must defeat intrinsic min-content expansion');
ok(trainingCss.includes('overflow-x:auto')&&trainingCss.includes('overscroll-behavior-inline:contain'),'Wide guide workbooks must scroll internally instead of widening the document');

// New releases must not allow old cached versions of recently changed scripts/styles to mix.
for(const asset of [
  'learner-guide.css?v=20260830-stability4',
  'training-tracks.css?v=20260830-stability4',
  'certificate-name.js?v=20260830-stability3',
  'app.js?v=20260830-stability3',
  'training-tracks.js?v=20260830-stability3',
  'capital-mastery-live-ui.js?v=20260830-stability3',
  'capital-mastery-e2e.js?v=20260830-stability3',
  'ux-stability.js?v=20260830-stability3',
  'course-continuity.js?v=20260830-stability3',
  'runtime-audit-fixes.js?v=20260830-stability3',
  'madeline.js?v=20260830-stability3',
  'admin-qa-simulation-fix.js?v=20260830-stability3'
]) ok(index.includes(asset), `Missing current cache-bust for ${asset}`);

ok(!index.includes('training-tracks.css?v=20260830-tracks2'), 'Old training-track stylesheet cache key must not remain');
ok(!index.includes('training-tracks.js?v=20260830-tracks2'), 'Old training-track script cache key must not remain');
ok(!index.includes('admin-qa-simulation-fix.js?v=20260828-adminsim2'), 'Old Admin QA cache key must not remain');
ok(workbookAudit.includes('training-tracks.css?v=20260830-stability4')&&workbookAudit.includes('app.js?v=20260830-stability3'), 'Workbook regression audit must follow current guide/app stability generations');
ok(notificationAudit.includes('app.js?v=20260830-stability3'), 'Notification regression audit must follow the current app cache generation');
ok(mixedSubmitAudit.includes('capital-mastery-e2e.js?v=20260830-stability3'), 'Mixed-submit regression audit must follow the current E2E cache generation');

console.log('FAILURE-SEEKING ROUND 2 STATIC AUDIT PASS');
