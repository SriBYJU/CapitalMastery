const ENTERPRISE_EMPLOYER_ROLES = ["owner", "training_admin", "content_manager", "manager", "viewer"];

async function requireOrgMember(env, uid, orgId) {
  const row = await env.DB.prepare(`
    SELECT m.role, m.status, o.status AS org_status
    FROM organization_members m JOIN organizations o ON o.id = m.org_id
    WHERE m.org_id = ? AND m.uid = ? LIMIT 1
  `).bind(orgId, uid).first();
  if (!row || row.status !== "active" || row.org_status !== "active") throw new HttpError(403, "Organization access required");
  return row;
}

async function requireOrgRole(env, uid, orgId, allowedRoles) {
  const membership = await requireOrgMember(env, uid, orgId);
  if (!allowedRoles.includes(membership.role)) throw new HttpError(403, "Insufficient organization permission");
  return membership;
}

function enterpriseAuditStatement(env, orgId, actorUid, action, targetType, targetId, details) {
  return env.DB.prepare(`INSERT INTO enterprise_audit_events (id, org_id, actor_uid, action, target_type, target_id, details_json) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), orgId, actorUid, action, targetType, targetId || null, JSON.stringify(details || {}));
}

function enterpriseEnum(value, allowed, label) {
  const v = cleanString(value, 80);
  if (!allowed.includes(v)) throw new HttpError(400, `Invalid ${label}`);
  return v;
}

function slugifyEnterprise(value) {
  const out = cleanString(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "organization";
}

function normalizeEnterpriseEmail(value, optional = false) {
  const email = cleanString(value, 254).toLowerCase();
  if (optional && !email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Valid email required");
  return email;
}

function optionalIsoDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw new HttpError(400, "Invalid date");
  return d.toISOString();
}

function safeEnterpriseJson(value, maxLength) {
  let text;
  try { text = JSON.stringify(value ?? {}); } catch { throw new HttpError(400, "Invalid content data"); }
  if (text.length > maxLength) throw new HttpError(413, "Content payload too large");
  return text;
}

function enterpriseFirmContentPublic(row) {
  let body = {};
  try { body = JSON.parse(row.body_json || "{}"); } catch {}
  return {
    id: row.id,
    assignmentId: row.assignment_id || null,
    pathwayId: row.pathway_id,
    contentType: row.content_type,
    title: row.title,
    body,
    positionKey: row.position_key,
    visibility: row.visibility,
    sourceStandardContentId: row.source_standard_content_id || null,
    currentVersion: Number(row.current_version || 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map(x => x.toString(16).padStart(2, "0")).join("");
}
