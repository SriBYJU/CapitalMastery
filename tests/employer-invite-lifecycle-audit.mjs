import fs from 'node:fs';

const ui=fs.readFileSync('enterprise-v2.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const ok=(value,message)=>{if(!value)throw new Error(message);};

ok(ui.includes("const PENDING_LEARNER_ROUTE = 'cmPendingLearningRouteV1'"),'Signed-out employee routes must preserve their intended destination');
ok(ui.includes("sessionStorage.setItem(PENDING_LEARNER_ROUTE, location.hash)"),'Employee sign-in must return to the requested training route');
ok(ui.includes("learner?'#/login':'#/employer-start'"),'Learners must not be routed through employer onboarding');
ok(ui.includes("localStorage.removeItem(EMPLOYER_INTENT)"),'A learner route must clear stale employer-onboarding intent');
ok(ui.includes("location.hash=`#/join/${encodeURIComponent(token)}`"),'Post-auth invite errors must return to a visible invitation state');
ok(ui.includes("[404,410].includes(Number(e.status))")&&ui.includes("localStorage.removeItem(PENDING_INVITE)"),'Expired or consumed invitations must not poison later sign-ins');

ok(worker.includes('if (!userEmail || userEmail !== invite.email_normalized)'), 'Invite acceptance must fail closed when the authenticated identity has no matching email');
ok(worker.includes("existingRole === 'owner' || (invite.role === 'learner' && ENTERPRISE_EMPLOYER_ROLES.includes(existingRole))"),'A cohort invite must not downgrade an existing employer role');
ok(worker.includes('DO UPDATE SET role=excluded.role,status=\'active\''),'A valid staff invitation must update an existing learner membership');
ok(worker.includes('invitedRole: invite.role, effectiveRole, previousRole'),'Invite audit evidence must disclose the requested and effective roles');
ok(worker.includes('role: effectiveRole'),'Invite acceptance response must return the authoritative effective role');

console.log('EMPLOYER / EMPLOYEE INVITE LIFECYCLE AUDIT PASS: correct sign-in lane, visible failures, exact-email binding and safe role transitions');
