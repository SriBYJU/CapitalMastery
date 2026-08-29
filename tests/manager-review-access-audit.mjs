import fs from 'node:fs';
const ui=fs.readFileSync('enterprise-v2.js','utf8');
const css=fs.readFileSync('enterprise-v2.css','utf8');
const index=fs.readFileSync('index.html','utf8');
function ok(v,m){if(!v)throw new Error(m);}
ok(ui.includes('data-open-learner'),'every learner must expose a manager evidence review action');
ok(!ui.includes('data-open-signal'),'manager review must not depend on an attention signal');
ok(ui.includes('MANAGER EVIDENCE REVIEW'),'learner drilldown must be framed as an evidence review');
ok(ui.includes("x.managerReview?'Review recorded':'Review learner'"),'non-flagged learners must still be reviewable');
ok(ui.includes("await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/reviews`"),'review action must use the audited server route');
ok(css.includes('.cmv2-signal-btn.neutral'),'non-flagged manager review action must have intentional styling');
ok(index.includes('enterprise-v2.js?v=20260829-bigfirm1')&&index.includes('enterprise-v2.css?v=20260829-bigfirm1'),'manager review release assets must be cache-busted');
console.log('MANAGER REVIEW ACCESS AUDIT PASS: every learner can be reviewed independent of attention flags');
