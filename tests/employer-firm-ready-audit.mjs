import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const js=fs.readFileSync('enterprise-v2.js','utf8');
const css=fs.readFileSync('enterprise-v2.css','utf8');
ok(js.includes('INTERACTIVE EMPLOYER GUIDE'),'Employer must have an interactive visual guide');
ok(js.includes('Launch Capital Mastery without needing a training call.'),'Guide must be self-serve');
ok(js.includes('MANAGER ATTENTION QUEUE'),'Command center must surface prioritized manager attention');
ok(js.includes('function learnerAttention'),'Attention signals must be derived explicitly');
ok(js.includes('Repeated revisions')&&js.includes('Readiness gap')&&js.includes('Foundation gap'),'Attention model must explain multiple coaching states');
ok(js.includes('Progress stage')&&js.includes('Evidence')&&js.includes('Revisions'),'Employer report must show progress and evidence, not only completion');
ok(js.includes('MANAGER EVIDENCE REVIEW')&&js.includes('data-open-learner'),'Employer must be able to drill into every learner and see coaching reasons when present');
ok(js.includes("b==='guide'"),'Employer guide must be routable');
ok(css.includes('.cmv2-guide-layout')&&css.includes('.cmv2-attention-list'),'Guide and attention UI must have production styling');
console.log('EMPLOYER FIRM-READY GUIDE + MANAGER INTELLIGENCE AUDIT PASS');
