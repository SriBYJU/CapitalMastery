      // ==================================================
      // CAPITAL MASTERY V2 — ASSIGNMENT LIFECYCLE + LEARNER VIEW
      // ==================================================

      if (request.method === "GET" && url.pathname === "/enterprise/catalog") {
        return json({
          ok: true,
          version: "2.0",
          credentialLadder: [
            { id: "foundations", title: "Foundations Certificate", track: "foundations", level: "beginner" },
            { id: "essentials", title: "Essentials Certificate", track: "foundations", level: "beginner" },
            { id: "applied", title: "Applied Skills Certificate", track: "professional", level: "advanced" },
            { id: "role_lab", title: "Role Lab Certificate", track: "professional", level: "advanced" },
            { id: "professional_readiness", title: "Professional Readiness Certificate", track: "professional", level: "advanced" }
          ],
          pathways: ALL_PATHWAYS.map(p => ({ id: p.id, code: p.code, title: p.title, role: p.role, group: p.group, purpose: p.purpose, focus: p.focus, simulation: p.simulation }))
        }, 200, env);
      }

      if (request.method === "GET" && url.pathname === "/enterprise/learner/assignments") {
        const user = await requireUser(request, env);
        const rows = await env.DB.prepare(`
          SELECT
            a.id AS assignment_id,
            a.pathway_id,
            a.track,
            a.credential_target,
            a.status AS assignment_status,
            a.due_at,
            a.curriculum_version,
            c.id AS cohort_id,
            c.name AS cohort_name,
            c.status AS cohort_status,
            o.id AS org_id,
            o.name AS org_name
          FROM cohort_members cm
          JOIN cohorts c ON c.id = cm.cohort_id AND c.org_id = cm.org_id
          JOIN organizations o ON o.id = cm.org_id
          JOIN program_assignments a ON a.cohort_id = c.id AND a.org_id = c.org_id
          WHERE cm.uid = ?
            AND cm.status = 'active'
            AND c.status IN ('active','completed')
            AND o.status = 'active'
            AND a.status IN ('published','completed')
          ORDER BY COALESCE(a.due_at, '9999-12-31T23:59:59Z'), a.created_at DESC
        `).bind(user.sub).all();
        return json({ ok: true, assignments: rows.results || [] }, 200, env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "learner" && parts[2] === "assignments" && parts.length === 4) {
        const user = await requireUser(request, env);
        const assignmentId = cleanId(parts[3]);
        const assignment = await env.DB.prepare(`
          SELECT a.*, c.name AS cohort_name, c.status AS cohort_status, o.name AS org_name
          FROM program_assignments a
          JOIN cohorts c ON c.id = a.cohort_id AND c.org_id = a.org_id
          JOIN organizations o ON o.id = a.org_id
          JOIN cohort_members cm ON cm.cohort_id = c.id AND cm.org_id = c.org_id
          WHERE a.id = ? AND cm.uid = ? AND cm.status = 'active'
          LIMIT 1
        `).bind(assignmentId, user.sub).first();
        if (!assignment || !["published", "completed"].includes(assignment.status)) throw new HttpError(404, "Assigned program not found");
        const firmRows = await env.DB.prepare(`
          SELECT * FROM firm_content
          WHERE org_id = ? AND assignment_id = ? AND visibility = 'visible'
          ORDER BY position_key, created_at
        `).bind(assignment.org_id, assignment.id).all();
        const prefs = await env.DB.prepare(`
          SELECT standard_content_id, visibility FROM standard_content_preferences
          WHERE org_id = ? AND assignment_id = ?
        `).bind(assignment.org_id, assignment.id).all();
        return json({
          ok: true,
          assignment: {
            id: assignment.id,
            organizationId: assignment.org_id,
            organizationName: assignment.org_name,
            cohortId: assignment.cohort_id,
            cohortName: assignment.cohort_name,
            pathwayId: assignment.pathway_id,
            track: assignment.track,
            credentialTarget: assignment.credential_target,
            status: assignment.status,
            dueAt: assignment.due_at,
            curriculumVersion: assignment.curriculum_version
          },
          firmContent: (firmRows.results || []).map(enterpriseFirmContentPublic),
          standardPreferences: prefs.results || []
        }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 5 && parts[3] === "assignments" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
        const assignmentId = cleanId(parts[4]);
        const existing = await env.DB.prepare(`SELECT * FROM program_assignments WHERE id = ? AND org_id = ? LIMIT 1`).bind(assignmentId, orgId).first();
        if (!existing) throw new HttpError(404, "Assignment not found");
        const body = await readJson(request);
        const status = body.status === undefined ? existing.status : enterpriseEnum(body.status, ["draft", "published", "completed", "archived"], "assignment status");
        const dueAt = body.dueAt === undefined ? existing.due_at : optionalIsoDate(body.dueAt);
        await env.DB.batch([
          env.DB.prepare(`UPDATE program_assignments SET status = ?, due_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(status, dueAt, assignmentId, orgId),
          enterpriseAuditStatement(env, orgId, user.sub, "assignment.updated", "assignment", assignmentId, { status, dueAt })
        ]);
        return json({ ok: true, assignment: { id: assignmentId, status, dueAt } }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 5 && parts[3] === "cohorts" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
        const cohortId = cleanId(parts[4]);
        const existing = await env.DB.prepare(`SELECT * FROM cohorts WHERE id = ? AND org_id = ? LIMIT 1`).bind(cohortId, orgId).first();
        if (!existing) throw new HttpError(404, "Cohort not found");
        const body = await readJson(request);
        const status = body.status === undefined ? existing.status : enterpriseEnum(body.status, ["draft", "active", "completed", "archived"], "cohort status");
        const deadlineAt = body.deadlineAt === undefined ? existing.deadline_at : optionalIsoDate(body.deadlineAt);
        await env.DB.batch([
          env.DB.prepare(`UPDATE cohorts SET status = ?, deadline_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(status, deadlineAt, cohortId, orgId),
          enterpriseAuditStatement(env, orgId, user.sub, "cohort.updated", "cohort", cohortId, { status, deadlineAt })
        ]);
        return json({ ok: true, cohort: { id: cohortId, status, deadlineAt } }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 6 && parts[3] === "assignments" && parts[5] === "standard-visibility" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
        const assignmentId = cleanId(parts[4]);
        const assignment = await env.DB.prepare(`SELECT id FROM program_assignments WHERE id = ? AND org_id = ? LIMIT 1`).bind(assignmentId, orgId).first();
        if (!assignment) throw new HttpError(404, "Assignment not found");
        const body = await readJson(request);
        const standardContentId = cleanString(body.standardContentId, 150);
        if (!standardContentId) throw new HttpError(400, "Standard content ID is required");
        const visibility = enterpriseEnum(body.visibility || "visible", ["visible", "hidden"], "visibility");
        if (visibility === "hidden" && ENTERPRISE_REQUIRED_STANDARD_CONTENT.has(standardContentId)) {
          throw new HttpError(409, "Required Capital Mastery Standard content cannot be hidden");
        }
        await env.DB.batch([
          env.DB.prepare(`
            INSERT INTO standard_content_preferences (org_id, assignment_id, standard_content_id, visibility, updated_by_uid)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(assignment_id, standard_content_id)
            DO UPDATE SET visibility=excluded.visibility, updated_by_uid=excluded.updated_by_uid, updated_at=CURRENT_TIMESTAMP
          `).bind(orgId, assignmentId, standardContentId, visibility, user.sub),
          enterpriseAuditStatement(env, orgId, user.sub, "standard_content.visibility_changed", "standard_content", standardContentId, { assignmentId, visibility })
        ]);
        return json({ ok: true, standardContentId, visibility }, 200, env);
      }
