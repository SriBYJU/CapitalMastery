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
const brand=fs.readFileSync('brand-asset-resilience.js','utf8');
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
ok(app.includes("root==='admin-preview'&&a==='simulation'"), 'Verified Admin QA simulation must use a protected Admin route namespace');
ok(app.includes('simulationPage(c,true)'), 'Protected Admin QA simulation must force the local simulation renderer instead of the learner secure-assessment route');
ok(app.includes('window.CM_AUTH?.backendVerified === true'), 'Admin QA simulation bypass must require backend-verified administrator state');
ok(admin.includes('#/admin-preview/simulation/investment-banking'), 'Admin Simulation Lab must target the protected Admin simulation route');

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
ok(tracks.includes('Complete the realistic server-graded job simulation and earn the program-completion certificate'), 'Career Skills capstone must remain explicitly authoritative/server graded while using program-completion semantics');
ok(tracks.includes('`#/official-simulation/${id}`'), 'Career Skills sequence must link directly to authoritative simulation');
ok(tracks.includes("(route==='simulation'||route==='official-simulation')"), 'Professional Readiness must guard both legacy and authoritative Career Skills simulation deep links');
ok(madeline.includes("#/official-simulation/${c.id}"), 'Madeline must direct Career Skills to the authoritative capstone');

// Signed-out gating must keep route state and rendered state synchronized.
ok(certName.includes("if (location.hash !== '#/') location.replace(publicHome)"), 'Gated signed-out routes must perform a real hash navigation back to public Home');
ok(!certName.includes("history.replaceState(null, '', `${location.pathname}${location.search}#/`)"), 'Silent history replacement must not leave stale gated DOM under the account modal');
ok(certName.includes('setTimeout(() => openLearningGate(hash), 0)'), 'Account reason modal should open after the public Home rerender, not race it');

// bfcache recovery must never throw away the loaded app just to refresh state.
ok(ux.includes('function refreshFromBfcache(event)'),'UX stability layer must handle bfcache restoration explicitly');
ok(ux.includes("window.dispatchEvent(new HashChangeEvent('hashchange'))"),'Stateful bfcache restoration must rerun route/reconciliation listeners');
ok(ux.includes('window.CM_SYNC?.flush?.().catch(() => {})'),'Stateful bfcache restoration should opportunistically flush sync');
const bfcacheBody=ux.slice(ux.indexOf('function refreshFromBfcache(event)'),ux.indexOf('function repairCredentialRendererRace()'));
ok(!bfcacheBody.includes('location.reload();'),'bfcache restoration must not hard reload and become network-dependent');

// Authoritative progress reconciliation must merge evidence without turning a
// hash-route update into a document reload or erasing fields that were not
// represented in the server response.
ok(runtime.includes("if (!Array.isArray(rows) || !rows.length) return false;"),'Empty authoritative progress results must be a no-op');
ok(runtime.includes('Merge only fields represented by authoritative rows'),'Runtime must preserve local fields absent from partial server responses');
ok(runtime.includes('window.CM?.refreshLocalState?.()'),'Authoritative progress changes must refresh app.js in-memory state');
ok(runtime.includes('skipNextHashReconcile = true')&&runtime.includes("window.dispatchEvent(new HashChangeEvent('hashchange'))"),'Progress repaint must stay inside the SPA without a reconciliation loop');
const reconcileBody=runtime.slice(runtime.indexOf('async function reconcileCurrent'),runtime.indexOf('function repairAsyncRouteRace'));
ok(!reconcileBody.includes('location.reload();'),'Progress reconciliation must never hard reload the document');

// If a brand SVG revalidation fails during a valid offline SPA render, the user
// should get an inline fallback mark rather than a broken-image icon.
ok(index.includes('brand-asset-resilience.js?v=20260830-stability1'),'Offline brand fallback must be loaded by the production shell');
ok(brand.includes("document.addEventListener('error'")&&brand.includes('true);'),'Brand fallback must listen during capture so image failures cannot bypass it');
ok(brand.includes('data:image/svg+xml')&&brand.includes("image.dataset.cmAssetFallback = 'true'"),'Brand fallback must replace the failed asset with a self-contained inline mark and mark the replacement');
ok(/assets\\\/logo-mark\\\.svg|assets\/logo-mark\\\.svg/.test(brand),'Brand fallback must be limited to the Capital Mastery logo asset');

// The interactive guide may contain wide spreadsheet work, but the page itself
// must stay viewport-contained while the workbook becomes the horizontal scroller.
ok(trainingCss.includes('Failure-seeking mobile containment'),'Learner Guide mobile overflow hardening marker missing from loaded CSS');
ok(trainingCss.includes('.cm-learner-guide-nav,.cm-learner-guide-panels')&&trainingCss.includes('min-width:0;max-width:100%'),'Learner Guide nav/panel grid items must be allowed to shrink on narrow viewports');
ok(trainingCss.includes('grid-template-columns:minmax(0,100%)!important')&&trainingCss.includes('contain:inline-size'),'Learner Guide responsive grid tracks must defeat intrinsic min-content expansion');
ok(trainingCss.includes('overflow-x:auto')&&trainingCss.includes('overscroll-behavior-inline:contain'),'Wide guide workbooks must scroll internally instead of widening the document');
