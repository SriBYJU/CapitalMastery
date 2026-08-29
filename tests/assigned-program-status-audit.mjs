import fs from 'node:fs';
function ok(v,m){if(!v) throw new Error(m)}
const ui=fs.readFileSync('enterprise-v2.js','utf8');
const css=fs.readFileSync('enterprise-v2.css','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(ui.includes('function assignedStageState(stage, report={})'),'authoritative assigned-stage mapper missing');
ok(ui.includes('/enterprise/learner/readiness-report/'),'assigned program must read authoritative readiness evidence');
ok(ui.includes("Complete · ${Number(diagnostic.score)}% baseline"),'diagnostic completion score must surface in assigned timeline');
ok(ui.includes("Complete · Essentials earned"),'Essentials credential state must surface');
ok(ui.includes("Complete · Applied Skills earned"),'Applied Skills credential state must surface');
ok(ui.includes("Ready · Open workbench"),'Role Lab ready state must surface after prerequisites');
ok(ui.includes('Stage status below is read from your authoritative assessment, credential and Role Lab evidence'),'assigned page must explain authoritative status source');
ok(!ui.includes("${s.id==='role-lab'?'Role Lab':'Required'}"),'hard-coded Required stage labels must be removed');
ok(css.includes('.cmv2-stage-state.complete')&&css.includes('.cmv2-assignment-progress-bar'),'assigned evidence timeline styling missing');
ok(index.includes('enterprise-v2.js?v=20260829-assignedstatus1')&&index.includes('enterprise-v2.css?v=20260829-assignedstatus1'),'assigned-status assets must be cache-busted');
console.log('ASSIGNED PROGRAM AUTHORITATIVE STATUS AUDIT PASS');
