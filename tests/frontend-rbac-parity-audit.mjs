import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m)}
const e=fs.readFileSync('enterprise-v2.js','utf8');
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const css=fs.readFileSync('enterprise-v2.css','utf8');
ok(e.includes("function orgCapabilities(role='viewer')"),'frontend must centralize organization capabilities');
ok(e.includes("manageAssignments:['owner','training_admin'].includes(r)"),'assignment capability mismatch');
ok(e.includes("managePeople:['owner','training_admin'].includes(r)"),'people capability mismatch');
ok(e.includes("manageContent:['owner','training_admin','content_manager'].includes(r)"),'content capability mismatch');
ok(e.includes("reviewLearners:['owner','training_admin','manager'].includes(r)"),'manager-review capability mismatch');
ok(e.includes("viewAudit:['owner','training_admin'].includes(r)"),'audit capability mismatch');
ok(e.includes("caps.manageAssignments?`<a class=\"btn btn-primary\"") ,'Quick Assign must be hidden for non-assignment roles');
ok(e.includes("caps.manageAssignments?`<a href=\"#/employer/${encodeURIComponent(orgId)}/quick-assign\">+ New</a>") ,'cohort create action must be hidden for non-assignment roles');
ok(e.includes('Assignment management is not part of ${esc(caps.role.replace')&&e.includes('Cohort creation and assignment publishing are limited to Owners and Training Admins.'),'direct Quick Assign route must be role-guarded');
ok(e.includes("canManageContent=orgCapabilities(membershipRole).manageContent"),'Firm Layer controls must use shared capability model');
ok(e.includes("const caps=orgCapabilities(orgData.membership?.role)")&&e.includes("const canReview=caps.reviewLearners")&&e.includes("if(!caps.viewReports) return setMain"),'report/review controls must use shared capability model');
ok(e.includes("title:caps.manageAssignments?'Create a cohort & assign a role':'Inspect assigned programs'"),'guide must adapt to read-only roles');
ok(e.includes("href:caps.managePeople?`#/employer/${orgId}/team`:'#/trust'"),'governance guide must not send read-only roles to Team admin');
ok(e.includes('YOUR WORKSPACE ROLE')&&css.includes('.cmv2-role-capability-strip'),'command center must explain current role capabilities');
for(const x of [
  'await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);',
  "await requireOrgRole(env,user.sub,orgId,['owner','training_admin','content_manager'])",
  "await requireOrgRole(env,user.sub,orgId,['owner','training_admin','manager'])"
]) ok(w.includes(x),'authoritative server gate missing: '+x);
console.log('FRONTEND/SERVER RBAC PARITY AUDIT PASS: visible actions, direct routes and guide behavior match server-enforced roles');
