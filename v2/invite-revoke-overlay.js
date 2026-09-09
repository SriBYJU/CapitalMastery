import coreWorker from './production-experience-overlay.js';

class InviteRevokeHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function allowedOrigins(env) {
  return String(env?.ALLOWED_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = String(request?.headers?.get('Origin') || '');
  const allowed = allowedOrigins(env);
  const responseOrigin = origin && allowed.includes(origin) ? origin : (allowed[0] || 'null');
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin'
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(request, env) });
}

function originAllowed(request, env) {
  const origin = String(request?.headers?.get('Origin') || '');
  return !origin || allowedOrigins(env).includes(origin);
}

function cleanId(value) {
  const id = String(value || '').trim();
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(id)) throw new InviteRevokeHttpError(400, 'Invalid identifier');
  return id;
}

function delegatedHeaders(request) {
  const headers = new Headers();
  const authorization = request.headers.get('Authorization');
  const origin = request.headers.get('Origin');
  if (authorization) headers.set('Authorization', authorization);
  if (origin) headers.set('Origin', origin);
  headers.set('Content-Type', 'application/json');
  return headers;
}

async function requireInviteManager(request, env, orgId) {
  if (!originAllowed(request, env)) throw new InviteRevokeHttpError(403, 'Origin not allowed');
  if (!request.headers.get('Authorization')) throw new InviteRevokeHttpError(401, 'Authentication required');

  // Reuse the existing protected invite-list route as the authorization source of truth.
  // That route is already limited server-side to owner + training_admin.
  const authorizationUrl = new URL(request.url);
  authorizationUrl.pathname = `/enterprise/organizations/${encodeURIComponent(orgId)}/invites`;
  authorizationUrl.search = '';
  const authorizationResponse = await coreWorker.fetch(
    new Request(authorizationUrl.toString(), { method: 'GET', headers: delegatedHeaders(request) }),
    env
  );
  const authorizationData = await authorizationResponse.clone().json().catch(() => ({}));
  if (!authorizationResponse.ok) {
    throw new InviteRevokeHttpError(authorizationResponse.status, authorizationData?.error || 'Not authorized to manage invitations');
  }

  // Resolve the authenticated uid only for the audit event; permissions still come from the route above.
  const identityUrl = new URL(request.url);
  identityUrl.pathname = '/auth-check';
  identityUrl.search = '';
  const identityResponse = await coreWorker.fetch(
    new Request(identityUrl.toString(), { method: 'POST', headers: delegatedHeaders(request), body: '{}' }),
    env
  );
  const identity = await identityResponse.clone().json().catch(() => ({}));
  if (!identityResponse.ok || identity?.authenticated !== true || !identity?.uid) {
    throw new InviteRevokeHttpError(identityResponse.status === 403 ? 403 : 401, identity?.error || 'Authentication required');
  }
  return String(identity.uid);
}

async function revokePendingInvite(request, env, orgIdRaw, inviteIdRaw) {
  const orgId = cleanId(decodeURIComponent(orgIdRaw));
  const inviteId = cleanId(decodeURIComponent(inviteIdRaw));
  const actorUid = await requireInviteManager(request, env, orgId);

  const invite = await env.DB.prepare(`
    SELECT id, org_id, cohort_id, email_normalized, role, status, expires_at
    FROM organization_invites
    WHERE id = ? AND org_id = ?
    LIMIT 1
  `).bind(inviteId, orgId).first();

  if (!invite) throw new InviteRevokeHttpError(404, 'Invitation not found');
  if (invite.status === 'archived') {
    return json({ ok: true, revoked: true, alreadyRevoked: true, inviteId }, 200, request, env);
  }
  if (invite.status !== 'pending') {
    throw new InviteRevokeHttpError(409, 'Only pending invitations can be revoked');
  }

  // Do not delete anything. Archiving invalidates the token because preview/accept only permit pending invites.
  const update = await env.DB.prepare(`
    UPDATE organization_invites
    SET status = 'archived'
    WHERE id = ? AND org_id = ? AND status = 'pending'
  `).bind(inviteId, orgId).run();

  const changes = Number(update?.meta?.changes ?? update?.changes ?? 0);
  if (changes !== 1) {
    const latest = await env.DB.prepare(`SELECT status FROM organization_invites WHERE id = ? AND org_id = ? LIMIT 1`).bind(inviteId, orgId).first();
    if (latest?.status === 'archived') {
      return json({ ok: true, revoked: true, alreadyRevoked: true, inviteId }, 200, request, env);
    }
    throw new InviteRevokeHttpError(409, 'Invitation is no longer pending');
  }

  await env.DB.prepare(`
    INSERT INTO enterprise_audit_events
      (id, org_id, actor_uid, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, 'invite.revoked', 'invite', ?, ?)
  `).bind(
    crypto.randomUUID(),
    orgId,
    actorUid,
    inviteId,
    JSON.stringify({
      email: invite.email_normalized,
      role: invite.role,
      cohortId: invite.cohort_id || null,
      previousStatus: 'pending',
      newStatus: 'archived',
      reason: 'revoked_by_owner_or_training_admin'
    })
  ).run();

  return json({ ok: true, revoked: true, inviteId }, 200, request, env);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const revokeMatch = /^\/enterprise\/organizations\/([^/]+)\/invites\/([^/]+)$/.exec(url.pathname);

    try {
      if (revokeMatch && request.method === 'OPTIONS') {
        if (!originAllowed(request, env)) return json({ ok: false, error: 'Origin not allowed' }, 403, request, env);
        const headers = corsHeaders(request, env);
        delete headers['Content-Type'];
        return new Response(null, { status: 204, headers });
      }

      if (revokeMatch && request.method === 'DELETE') {
        return await revokePendingInvite(request, env, revokeMatch[1], revokeMatch[2]);
      }

      return await coreWorker.fetch(request, env);
    } catch (error) {
      if (error instanceof InviteRevokeHttpError) {
        return json({ ok: false, error: error.message }, error.status, request, env);
      }
      console.error('Invite revoke overlay error', error);
      return json({ ok: false, error: 'Production service unavailable' }, 500, request, env);
    }
  }
};

export default worker;
