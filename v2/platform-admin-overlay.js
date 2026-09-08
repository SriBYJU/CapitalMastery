// Cloudflare Workers Builds deployment marker: 2026-09-08. No behavior change.
import coreWorker from './worker-v2-phase1-release.js';

const PLATFORM_ADMIN_EMAIL = 'awsomecoolsri2@gmail.com';
const DISABLED_ADMIN_UID = '__capital_mastery_platform_admin_disabled__';
const EMPLOYER_STAFF_ROLES = ['owner', 'training_admin', 'content_manager', 'manager', 'viewer'];

class PlatformHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function decodeBase64UrlText(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(padded);
}

function bearerToken(request) {
  const value = String(request?.headers?.get('Authorization') || '');
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : '';
}

function tokenPayload(request) {
  const token = bearerToken(request);
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(decodeBase64UrlText(parts[1]));
  } catch {
    return null;
  }
}

function isPlatformAdminEmail(value) {
  return normalizeEmail(value) === PLATFORM_ADMIN_EMAIL;
}

function coreEnvForRequest(request, env) {
  // The core Worker still contains legacy UID-based administrator fallbacks.
  // Disable those fallbacks for every token that does not even claim the one
  // allowed platform-admin email. The core Worker still cryptographically
  // verifies the token before any protected action is allowed.
  const payload = tokenPayload(request);
  if (isPlatformAdminEmail(payload?.email)) return env;
  return { ...env, ADMIN_UID: DISABLED_ADMIN_UID };
}

function allowedOrigins(env) {
  return String(env?.ALLOWED_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = String(request?.headers?.get('Origin') || '');
  const allowed = allowedOrigins(env);
  const responseOrigin = origin && allowed.includes(origin) ? origin : (allowed[0] || 'null');
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin'
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request, env)
  });
}

function originAllowed(request, env) {
  const origin = String(request?.headers?.get('Origin') || '');
  return !origin || allowedOrigins(env).includes(origin);
}

async function callCoreAuthCheck(request, env) {
  const sourceUrl = new URL(request.url);
  sourceUrl.pathname = '/auth-check';
  sourceUrl.search = '';
  const headers = new Headers();
  const authorization = request.headers.get('Authorization');
  const origin = request.headers.get('Origin');
  if (authorization) headers.set('Authorization', authorization);
  if (origin) headers.set('Origin', origin);
  headers.set('Content-Type', 'application/json');
  const authRequest = new Request(sourceUrl.toString(), {
    method: 'POST',
    headers,
    body: '{}'
  });
  return coreWorker.fetch(authRequest, coreEnvForRequest(request, env));
}

async function verifiedIdentity(request, env) {
  if (!originAllowed(request, env)) throw new PlatformHttpError(403, 'Origin not allowed');
  const token = bearerToken(request);
  if (!token) throw new PlatformHttpError(401, 'Authentication required');

  const coreResponse = await callCoreAuthCheck(request, env);
  const auth = await coreResponse.clone().json().catch(() => ({}));
  if (!coreResponse.ok || auth?.authenticated !== true || !auth?.uid) {
    throw new PlatformHttpError(coreResponse.status === 403 ? 403 : 401, auth?.error || 'Authentication required');
  }

  const payload = tokenPayload(request);
  if (!payload || String(payload.sub || '') !== String(auth.uid)) {
    throw new PlatformHttpError(401, 'Invalid authenticated identity');
  }

  return {
    uid: String(auth.uid),
    email: normalizeEmail(payload.email),
    emailVerified: payload.email_verified === true,
    tokenPayload: payload
  };
}

async function requirePlatformAdmin(request, env, verifier = verifiedIdentity) {
  const identity = await verifier(request, env);
  if (!isPlatformAdminEmail(identity?.email)) {
    throw new PlatformHttpError(403, 'Platform administrator access required');
  }
  return identity;
}

function platformAdminNamespace(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/') ||
    pathname === '/enterprise/admin' || pathname.startsWith('/enterprise/admin/');
}

function sanitizeOrganizationRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => !String(row?.id || '').startsWith('demo_org_'))
    .map((row) => ({
      id: String(row.id || ''),
      name: String(row.name || 'Unnamed organization'),
      status: String(row.status || 'active'),
      createdAt: row.created_at || null,
      staffCount: Number(row.staff_count || 0),
      learnerCount: Number(row.learner_count || 0),
      cohortCount: Number(row.cohort_count || 0),
      assignmentCount: Number(row.assignment_count || 0),
      publishedAssignmentCount: Number(row.published_assignment_count || 0),
      lastActivity: row.last_activity || row.updated_at || row.created_at || null
    }));
}

function summarizeOrganizationRows(organizations) {
  return (Array.isArray(organizations) ? organizations : []).reduce((totals, org) => {
    totals.realEmployers += 1;
    totals.staff += Number(org.staffCount || 0);
    totals.learners += Number(org.learnerCount || 0);
    totals.cohorts += Number(org.cohortCount || 0);
    totals.assignments += Number(org.assignmentCount || 0);
    totals.publishedAssignments += Number(org.publishedAssignmentCount || 0);
    return totals;
  }, {
    realEmployers: 0,
    staff: 0,
    learners: 0,
    cohorts: 0,
    assignments: 0,
    publishedAssignments: 0
  });
}

async function employerUsage(request, env) {
  await requirePlatformAdmin(request, env);

  const result = await env.DB.prepare(`
    SELECT
      o.id,
      o.name,
      o.status,
      o.created_at,
      o.updated_at,
      (
        SELECT COUNT(*)
        FROM organization_members m
        WHERE m.org_id = o.id
          AND m.status = 'active'
          AND m.role IN ('owner','training_admin','content_manager','manager','viewer')
      ) AS staff_count,
      (
        SELECT COUNT(DISTINCT cm.uid)
        FROM cohort_members cm
        WHERE cm.org_id = o.id
          AND cm.status IN ('active','completed')
      ) AS learner_count,
      (
        SELECT COUNT(*)
        FROM cohorts c
        WHERE c.org_id = o.id
          AND c.status <> 'archived'
      ) AS cohort_count,
      (
        SELECT COUNT(*)
        FROM program_assignments a
        WHERE a.org_id = o.id
          AND a.status <> 'archived'
      ) AS assignment_count,
      (
        SELECT COUNT(*)
        FROM program_assignments a
        WHERE a.org_id = o.id
          AND a.status = 'published'
      ) AS published_assignment_count,
      MAX(
        o.updated_at,
        COALESCE((SELECT MAX(m.updated_at) FROM organization_members m WHERE m.org_id = o.id), o.updated_at),
        COALESCE((SELECT MAX(c.updated_at) FROM cohorts c WHERE c.org_id = o.id), o.updated_at),
        COALESCE((SELECT MAX(a.updated_at) FROM program_assignments a WHERE a.org_id = o.id), o.updated_at),
        COALESCE((SELECT MAX(e.created_at) FROM enterprise_audit_events e WHERE e.org_id = o.id), o.updated_at)
      ) AS last_activity
    FROM organizations o
    WHERE o.id NOT LIKE 'demo_org_%'
    ORDER BY last_activity DESC, o.name COLLATE NOCASE ASC
  `).all();

  const organizations = sanitizeOrganizationRows(result?.results || []);
  const totals = summarizeOrganizationRows(organizations);

  return json({
    ok: true,
    scope: 'platform-aggregate',
    demoOrganizationsExcluded: true,
    totals,
    organizations
  }, 200, request, env);
}

async function authCheckWithExactAdmin(request, env) {
  const coreResponse = await coreWorker.fetch(request, coreEnvForRequest(request, env));
  if (!coreResponse.ok) return coreResponse;
  const data = await coreResponse.clone().json().catch(() => null);
  const payload = tokenPayload(request);
  if (!data || data.authenticated !== true || !payload || String(payload.sub || '') !== String(data.uid || '')) {
    return coreResponse;
  }
  const headers = new Headers(coreResponse.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify({
    ...data,
    isAdmin: isPlatformAdminEmail(payload.email)
  }), {
    status: coreResponse.status,
    headers
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (request.method === 'POST' && url.pathname === '/auth-check') {
        return authCheckWithExactAdmin(request, env);
      }

      if (request.method === 'GET' && url.pathname === '/enterprise/admin/organizations') {
        return employerUsage(request, env);
      }

      if (platformAdminNamespace(url.pathname)) {
        await requirePlatformAdmin(request, env);
        return coreWorker.fetch(request, env);
      }

      // Normal learner and employer routes keep their existing role and tenant
      // checks. Non-admin tokens get a core env where legacy UID-admin fallbacks
      // are disabled, so an employer role can never become platform admin.
      return coreWorker.fetch(request, coreEnvForRequest(request, env));
    } catch (error) {
      if (error instanceof PlatformHttpError) {
        return json({ ok: false, error: error.message }, error.status, request, env);
      }
      console.error('Platform admin overlay error', error);
      return json({ ok: false, error: 'Platform admin service unavailable' }, 500, request, env);
    }
  }
};

export {
  PLATFORM_ADMIN_EMAIL,
  DISABLED_ADMIN_UID,
  EMPLOYER_STAFF_ROLES,
  normalizeEmail,
  tokenPayload,
  isPlatformAdminEmail,
  coreEnvForRequest,
  requirePlatformAdmin,
  platformAdminNamespace,
  sanitizeOrganizationRows,
  summarizeOrganizationRows
};

export default worker;
