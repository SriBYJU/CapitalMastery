import coreWorker from './platform-admin-overlay.js';

class ExperienceHttpError extends Error {
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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(id)) throw new ExperienceHttpError(400, 'Invalid identifier');
  return id;
}

async function verifiedIdentity(request, env) {
  if (!originAllowed(request, env)) throw new ExperienceHttpError(403, 'Origin not allowed');
  const authorization = request.headers.get('Authorization');
  if (!authorization) throw new ExperienceHttpError(401, 'Authentication required');
  const url = new URL(request.url);
  url.pathname = '/auth-check';
  url.search = '';
  const headers = new Headers({ Authorization: authorization, 'Content-Type': 'application/json' });
  const origin = request.headers.get('Origin');
  if (origin) headers.set('Origin', origin);
  const response = await coreWorker.fetch(new Request(url.toString(), { method: 'POST', headers, body: '{}' }), env);
  const data = await response.clone().json().catch(() => ({}));
  if (!response.ok || data?.authenticated !== true || !data?.uid) {
    throw new ExperienceHttpError(response.status === 403 ? 403 : 401, data?.error || 'Authentication required');
  }
  return { uid: String(data.uid), email: String(data.email || '') };
}

async function learnerAssignment(env, uid, assignmentId) {
  return env.DB.prepare(`
    SELECT a.id, a.org_id, a.cohort_id, a.pathway_id, a.track, a.status, a.created_at,
           c.status AS cohort_status, cm.status AS member_status
    FROM program_assignments a
    JOIN cohorts c ON c.id = a.cohort_id AND c.org_id = a.org_id
    JOIN cohort_members cm ON cm.cohort_id = a.cohort_id AND cm.org_id = a.org_id
    WHERE a.id = ? AND cm.uid = ?
    LIMIT 1
  `).bind(assignmentId, uid).first();
}

async function requireLearnerAssignment(request, env, assignmentId) {
  const identity = await verifiedIdentity(request, env);
  const assignment = await learnerAssignment(env, identity.uid, cleanId(assignmentId));
  if (!assignment || assignment.member_status !== 'active' || !['published', 'completed'].includes(assignment.status)) {
    throw new ExperienceHttpError(404, 'Assigned program not found');
  }
  return { identity, assignment };
}

async function requireAssignmentTrack(request, env, assignmentId, expectedTrack) {
  const { assignment } = await requireLearnerAssignment(request, env, assignmentId);
  if (assignment.track !== expectedTrack) {
    const assignedName = assignment.track === 'career_skills' ? 'Career Skills' : 'Professional Readiness';
    throw new ExperienceHttpError(409, `This employer assignment requires ${assignedName}. Complete the assigned program instead of switching tracks.`);
  }
  return assignment;
}

async function recordAssignmentOpen(request, env, assignmentId) {
  const { identity, assignment } = await requireLearnerAssignment(request, env, assignmentId);
  const latest = await env.DB.prepare(`
    SELECT created_at FROM enterprise_audit_events
    WHERE org_id = ? AND actor_uid = ? AND action = 'learner.assignment_opened'
      AND target_type = 'assignment' AND target_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(assignment.org_id, identity.uid, assignment.id).first();

  const recent = latest?.created_at && (Date.now() - Date.parse(latest.created_at)) < 15 * 60 * 1000;
  if (!recent) {
    await env.DB.prepare(`
      INSERT INTO enterprise_audit_events
        (id, org_id, actor_uid, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'learner.assignment_opened', 'assignment', ?, ?)
    `).bind(
      crypto.randomUUID(),
      assignment.org_id,
      identity.uid,
      assignment.id,
      JSON.stringify({ pathwayId: assignment.pathway_id, track: assignment.track, source: 'assigned_program' })
    ).run();
  }

  return json({ ok: true, started: true, assignmentId: assignment.id, track: assignment.track }, 200, request, env);
}

function evidenceAlreadyStarted(learner) {
  return Boolean(
    learner?.complete || learner?.credential || learner?.readiness || learner?.diagnostic ||
    learner?.roleLab || learner?.final || learner?.managerReview
  );
}

function mergeActivity(map, uid, timestamp, source) {
  if (!uid || !timestamp) return;
  const current = map.get(String(uid)) || { startedAt: null, lastActivityAt: null, sources: new Set() };
  const time = Date.parse(timestamp);
  if (!Number.isNaN(time)) {
    if (!current.startedAt || time < Date.parse(current.startedAt)) current.startedAt = timestamp;
    if (!current.lastActivityAt || time > Date.parse(current.lastActivityAt)) current.lastActivityAt = timestamp;
  }
  current.sources.add(source);
  map.set(String(uid), current);
}

async function assignmentActivity(env, assignment) {
  const map = new Map();
  const [opens, assessments, diagnostics, labs] = await Promise.all([
    env.DB.prepare(`
      SELECT actor_uid AS uid, created_at
      FROM enterprise_audit_events
      WHERE org_id = ? AND action = 'learner.assignment_opened'
        AND target_type = 'assignment' AND target_id = ?
    `).bind(assignment.org_id, assignment.id).all(),
    env.DB.prepare(`
      SELECT uid, submitted_at
      FROM v2_assessment_attempts
      WHERE assignment_id = ?
         OR (assignment_id IS NULL AND pathway_id = ? AND submitted_at >= ?)
    `).bind(assignment.id, assignment.pathway_id, assignment.created_at).all(),
    env.DB.prepare(`
      SELECT uid, submitted_at
      FROM diagnostic_attempts
      WHERE assignment_id = ?
         OR (assignment_id IS NULL AND pathway_id = ? AND submitted_at >= ?)
    `).bind(assignment.id, assignment.pathway_id, assignment.created_at).all(),
    env.DB.prepare(`
      SELECT uid, started_at
      FROM role_lab_runs
      WHERE assignment_id = ?
         OR (assignment_id IS NULL AND pathway_id = ? AND started_at >= ?)
    `).bind(assignment.id, assignment.pathway_id, assignment.created_at).all()
  ]);
  (opens.results || []).forEach(row => mergeActivity(map, row.uid, row.created_at, 'assignment_open'));
  (assessments.results || []).forEach(row => mergeActivity(map, row.uid, row.submitted_at, 'assessment_attempt'));
  (diagnostics.results || []).forEach(row => mergeActivity(map, row.uid, row.submitted_at, 'diagnostic_attempt'));
  (labs.results || []).forEach(row => mergeActivity(map, row.uid, row.started_at, 'role_lab'));
  return map;
}

async function augmentReadinessReport(request, env) {
  const response = await coreWorker.fetch(request, env);
  if (!response.ok) return response;
  const data = await response.clone().json().catch(() => null);
  if (!data || !Array.isArray(data.assignments)) return response;

  for (const report of data.assignments) {
    const assignmentId = report?.assignment?.id;
    if (!assignmentId) continue;
    const assignment = await env.DB.prepare(`SELECT id, org_id, pathway_id, created_at FROM program_assignments WHERE id = ? LIMIT 1`).bind(assignmentId).first();
    if (!assignment) continue;
    const activity = await assignmentActivity(env, assignment);
    report.learners = (report.learners || []).map(learner => {
      const record = activity.get(String(learner.uid || ''));
      const started = evidenceAlreadyStarted(learner) || Boolean(record);
      return {
        ...learner,
        started,
        startedAt: record?.startedAt || null,
        lastActivityAt: record?.lastActivityAt || null,
        activitySources: record ? [...record.sources] : []
      };
    });
    report.summary = {
      ...(report.summary || {}),
      started: report.learners.filter(learner => learner.started).length
    };
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { status: response.status, headers });
}

async function assignmentIdFromBody(request) {
  if (!['POST', 'PATCH', 'PUT'].includes(request.method)) return null;
  const body = await request.clone().json().catch(() => null);
  return body?.assignmentId ? cleanId(body.assignmentId) : null;
}

async function enforceAssignmentTrack(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const queryAssignmentId = url.searchParams.get('assignmentId');

  if (parts[0] === 'enterprise' && parts[1] === 'assessments' && parts[2]) {
    const assignmentId = queryAssignmentId || await assignmentIdFromBody(request);
    if (assignmentId && /professional-final$/i.test(parts[2])) {
      await requireAssignmentTrack(request, env, assignmentId, 'professional');
    }
  }

  if (request.method === 'POST' && url.pathname === '/enterprise/diagnostic/submit') {
    const assignmentId = await assignmentIdFromBody(request);
    if (assignmentId) await requireAssignmentTrack(request, env, assignmentId, 'professional');
  }

  if (parts[0] === 'enterprise' && parts[1] === 'role-labs') {
    const assignmentId = queryAssignmentId || await assignmentIdFromBody(request);
    if (assignmentId) await requireAssignmentTrack(request, env, assignmentId, 'professional');
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const activityMatch = /^\/enterprise\/learner\/assignments\/([^/]+)\/activity$/.exec(url.pathname);

    try {
      if (request.method === 'OPTIONS' && (url.pathname.startsWith('/enterprise/admin/') || activityMatch)) {
        if (!originAllowed(request, env)) return json({ ok: false, error: 'Origin not allowed' }, 403, request, env);
        const headers = corsHeaders(request, env);
        delete headers['Content-Type'];
        return new Response(null, { status: 204, headers });
      }

      if (activityMatch && request.method === 'POST') {
        return await recordAssignmentOpen(request, env, decodeURIComponent(activityMatch[1]));
      }

      if (request.method === 'GET' && /^\/enterprise\/organizations\/[^/]+\/readiness-report$/.test(url.pathname)) {
        return await augmentReadinessReport(request, env);
      }

      await enforceAssignmentTrack(request, env);
      return await coreWorker.fetch(request, env);
    } catch (error) {
      if (error instanceof ExperienceHttpError) {
        return json({ ok: false, error: error.message }, error.status, request, env);
      }
      console.error('Production experience overlay error', error);
      return json({ ok: false, error: 'Production service unavailable' }, 500, request, env);
    }
  }
};

export default worker;
