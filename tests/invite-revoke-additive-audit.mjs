import fs from 'node:fs';

const backend = fs.readFileSync('v2/invite-revoke-overlay.js', 'utf8');
const core = fs.readFileSync('v2/worker-v2-phase1-release.js', 'utf8');
const ui = fs.readFileSync('invite-revoke-controls.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');

const ok = (value, message) => { if (!value) throw new Error(message); };

ok(wrangler.includes('"main": "v2/invite-revoke-overlay.js"'), 'Production Worker must route through the additive invite revoke overlay');
ok(backend.includes("import coreWorker from './production-experience-overlay.js'"), 'Invite revoke overlay must delegate every existing route to the current production Worker');
ok(backend.includes("request.method === 'DELETE'"), 'Pending invite revocation needs an explicit DELETE route');
ok(backend.includes("authorizationUrl.pathname = `/enterprise/organizations/${encodeURIComponent(orgId)}/invites`"), 'Revoke authorization must reuse the existing protected invite management route');
ok(core.includes('await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);'), 'Existing invite management authorization must remain Owner + Training Admin');
ok(backend.includes("SET status = 'archived'"), 'Revocation must archive the invite instead of deleting workspace data');
ok(backend.includes("status = 'pending'"), 'Revocation update must be conditional on pending status');
ok(backend.includes("invite.status !== 'pending'"), 'Accepted/expired invitations must be rejected by the revoke endpoint');
ok(!backend.includes('DELETE FROM organization_invites'), 'Revoke feature must not delete invitation rows');
ok(!backend.includes('organization_members'), 'Revoke overlay must not change organization memberships');
ok(!backend.includes('cohort_members'), 'Revoke overlay must not change cohort memberships');
ok(!backend.includes('program_assignments'), 'Revoke overlay must not change assignments');
ok(!backend.includes('DELETE FROM organizations'), 'Revoke overlay must never delete workspaces');
ok(backend.includes("'invite.revoked'"), 'Successful revocations must create an audit event');
ok(core.includes("WHERE token_hash = ? AND status = 'pending'"), 'Invite acceptance must continue requiring pending status so archived/revoked tokens cannot be accepted');
ok(core.includes("if (!invite || invite.status !== 'pending')"), 'Invite preview must continue hiding revoked invitations');

ok(ui.includes(".filter(invite => invite.status === 'pending')"), 'UI must only add revoke controls to pending invitations');
ok(ui.includes("method: 'DELETE'"), 'UI must call the protected revoke endpoint');
ok(ui.includes('It will not remove any workspace, member, learner progress, cohort, assignment, or existing access.'), 'UI confirmation must state the non-destructive boundary');
ok(index.includes('invite-revoke-controls.js?v=20260909-inviterevoke1'), 'Production Pages bundle must load revoke controls');
ok(index.includes('invite-revoke-controls.css?v=20260909-inviterevoke1'), 'Production Pages bundle must load revoke control styles');

console.log('INVITE REVOKE ADDITIVE AUDIT PASS: Owner/Training Admin only; pending invite archive only; no workspace, member, cohort, assignment or progress mutation');
