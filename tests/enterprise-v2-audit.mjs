import fs from 'node:fs';
const root=new URL('../',import.meta.url);const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const errors=[];const ok=(x,m)=>{if(!x)errors.push(m)};
const index=read('index.html'),app=read('app.js'),ent=read('enterprise-v2.js'),css=read('enterprise-v2.css'),live=read('capital-mastery-live.js'),liveUi=read('capital-mastery-live-ui.js');
const routeFiles=['v2/enterprise-route-block.js','v2/enterprise-route-block-2.js','v2/assessment-lab-routes.js','v2/v2-credential-assessment-routes.js','v2/enterprise-report-routes.js'];
const helperFiles=['v2/enterprise-helpers.js','v2/enterprise-required-standard.js','v2/assessment-lab-helpers.js','v2/v2-credential-assessment-helpers.js'];
const server=[...routeFiles,...helperFiles].map(read).join('\n');
ok(index.includes('enterprise-v2.css'),'V2 stylesheet not loaded');ok(index.includes('enterprise-v2.js'),'V2 frontend not loaded');
for(const r of ['employers','quick-assign','curriculum','reports','team','audit','assigned','diagnostic','skills','readiness','v2-assessment','role-lab','my-data'])ok(ent.includes(r),`Frontend missing ${r} route/feature`);
for(const phrase of ['Baseline Diagnostic','Essentials Mini Case','Open Role Lab','Professional Final','Readiness Report'])ok(ent.includes(phrase),`Assigned learner sequence missing ${phrase}`);
for(const phrase of ['Team & Roles','Audit Log','My Data'])ok(ent.includes(phrase),`Enterprise hardening UI missing ${phrase}`);
ok(app.includes("root==='trust'"),'Trust Center route missing');ok(app.includes('How Capital Mastery protects learning and evidence.'),'Trust Center content missing');
ok(!app.includes('Firebase connection pending.'),'Stale Firebase-pending copy remains');
ok(css.includes('.cmv2-report-table'),'Employer report styling missing');ok(css.includes('@media'),'V2 responsive styling missing');
ok(read('styles.css').includes(':focus-visible'),'Keyboard focus visibility missing');ok(read('styles.css').includes('prefers-reduced-motion'),'Reduced-motion support missing');
for(const route of routeFiles){const code=read(route);ok(!/request\.method\s*===\s*["']DELETE["']/.test(code),`${route}: employer/V2 DELETE handler found`)}
for(const x of ['requireOrgMember','requireOrgRole','enterpriseAuditStatement'])ok(server.includes(x),`Server helper missing ${x}`);
for(const x of ['Required Capital Mastery Standard content cannot be hidden','The organization must keep at least one active owner','Complete the assigned baseline diagnostic before the Essentials mini case','Earn the Essentials Certificate before starting the Role Lab','Complete the baseline diagnostic before the Professional Readiness Final'])ok(server.includes(x),`Integrity rule missing: ${x}`);
for(const x of ['v2EnforceDiagnosticRate','v2EnforceAssessmentRate','Too many recent assessment attempts'])ok(server.includes(x),`Attempt hardening missing ${x}`);
for(const x of ['credential_evidence_items','competency_profile','professional_readiness','evidenceCoverage','criticalFloorsMet'])ok(server.includes(x),`Credential evidence feature missing ${x}`);
ok(!ent.includes('correct_answer'),'Correct answers exposed in enterprise frontend');ok(!ent.includes('grading_json'),'Role Lab grading rules exposed in enterprise frontend');
ok(live.includes('/enterprise/verify/'),'Evidence-aware public verification missing');ok(liveUi.includes('professional_readiness'),'V2 certificate rendering missing');

const release=read('v2/worker-v2-phase1-release.js');
ok(release.includes('m.joined_at AS created_at'),'My Data export membership timestamp regression returned');
ok(release.includes('m.role,m.status,m.joined_at AS created_at,m.updated_at'),'Team member timestamp regression returned');
ok(release.includes("enterpriseEnum(body.status,['active','archived'],'member status')"),'Member status enum does not match D1 schema');
ok(!release.includes("['active','inactive'],'member status'"),'Invalid inactive member status remains in Worker');
ok(ent.includes('value=\"archived\"'),'Team UI does not expose schema-valid archived status');
ok(release.includes('GET, POST, PATCH, OPTIONS'),'Frozen Worker does not advertise hardened CORS methods');
ok(!release.includes('GET, POST, PATCH, DELETE, OPTIONS'),'Frozen Worker still advertises DELETE');
ok(release.includes('Cache-Control')&&release.includes('no-store'),'Frozen Worker API no-store header missing');
ok(release.includes('X-Content-Type-Options')&&release.includes('nosniff'),'Frozen Worker nosniff header missing');
for(const doc of ['docs/enterprise-security.md','docs/phase1-release-audit.md'])ok(fs.existsSync(new URL('../'+doc,import.meta.url)),`Release document missing ${doc}`);

const migrations=fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql'));
for(const m of ['007_v2_credentials.sql','008_v2_assessments.sql','009_v2_sequence_integrity.sql','010_phase1_sequence_order.sql','011_professional_readiness_direct_rolelab_evidence.sql'])ok(migrations.includes(m),`Migration missing ${m}`);
if(errors.length){console.error('ENTERPRISE V2 AUDIT FAILED');errors.forEach(e=>console.error(' -',e));process.exit(1)}
console.log(`ENTERPRISE V2 STATIC AUDIT PASS: ${routeFiles.length} route modules, ${helperFiles.length} helper modules, ${migrations.length} migrations checked.`);
