import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const tracks=fs.readFileSync('training-tracks.js','utf8');
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const madeline=fs.readFileSync('madeline.js','utf8');

ok(tracks.includes('function adminQaPreviewActive()'),'Two-track guard must recognize active Admin QA preview mode');
ok(tracks.includes("getTrack(pathwayId)===PROFESSIONAL&&!adminQaPreviewActive()"),'Admin QA simulation preview must bypass the Professional Readiness legacy-simulation redirect');
ok(tracks.includes('data-cm-track-id="${trackId}"'),'Track sequence must carry a stable render identity');
ok(tracks.includes("existing?.dataset.cmTrackId===trackId"),'Track sequence renderer must be idempotent');
ok(tracks.includes('data-cm-track-status-id="${track}"'),'Selected-track status must carry a stable render identity');
ok(tracks.includes("status.dataset.cmTrackStatusId!==track"),'Selected-track status must not be destroyed and recreated on every observer pass');
ok(tracks.includes("if(el.textContent!==copy) el.textContent=copy"),'Career directory credential copy must avoid unconditional text rewrites');
ok(tracks.includes("if(button.textContent!==label) button.textContent=label"),'Track buttons must avoid unconditional child-list mutations');
ok(!tracks.includes("root.querySelector('[data-cm-track-sequence]')?.remove();\n    pathList.insertAdjacentHTML"),'Track sequence must not unconditionally remove/reinsert itself under MutationObserver');

ok(admin.includes("data-cm-admin-sim-preview"),'Admin QA simulation helper must support an explicit preview target');
ok(admin.includes("enableQa();"),'Admin simulation preview must enable isolated QA mode automatically');
ok(app.includes('Server-verified Admin / QA workspace.'),'Admin page must describe current server-verified security rather than future Firebase setup');
ok(app.includes('data-cm-admin-sim-preview="true" href="#/simulation/investment-banking"'),'Admin Simulation Lab must link directly to the isolated local preview');
ok(app.includes('Legacy Credential Compatibility Lab'),'Admin credential preview must not imply the legacy three-level model is the current full credential architecture');

ok(madeline.includes('How do the two program levels work?'),'Madeline quick help must use current two-track terminology');
ok(madeline.includes('Career Skills (4 verified credentials)')&&madeline.includes('Professional Readiness (5 career credentials)'),'Madeline must explain current credential counts');
ok(madeline.includes("track==='professional-readiness'"),'Madeline next-step guidance must be program-aware');
ok(madeline.includes('Career Skills does not require this final'),'Madeline must not tell Career Skills learners the Professional Final is required');
ok(!madeline.includes('It has 16 career pathways and 3 credential levels per pathway'),'Madeline must not expose stale three-credential product copy');

console.log('ADMIN QA / RUNTIME STABILITY AUDIT PASS');
