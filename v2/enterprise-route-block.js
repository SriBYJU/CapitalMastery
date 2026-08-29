      // ==================================================
      // CAPITAL MASTERY V2 — ENTERPRISE CORE
      // ==================================================

      if (request.method === "GET" && url.pathname === "/enterprise/me") {
        const user = await requireUser(request, env);
        const memberships = await env.DB.prepare(`
          SELECT o.id, o.slug, o.name, o.status, m.role, m.status AS membership_status
          FROM organization_members m
          JOIN organizations o ON o.id = m.org_id
          WHERE m.uid = ? AND m.status = 'active' AND o.status = 'active'
          ORDER BY o.name
        `).bind(user.sub).all();
        return json({ ok: true, organizations: memberships.results || [] }, 200, env);
      }

      if (request.method === "POST" && url.pathname === "/enterprise/organizations") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const name = cleanString(body.name, 120);
        if (name.length < 2) throw new HttpError(400, "Organization name is required");
        const id = `org_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
        const slug = `${slugifyEnterprise(body.slug || name).slice(0, 42)}-${id.slice(-6)}`;
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO organizations (id, slug, name, created_by_uid) VALUES (?, ?, ?, ?)`).bind(id, slug, name, user.sub),
          env.DB.prepare(`INSERT INTO organization_members (org_id, uid, role) VALUES (?, ?, 'owner')`).bind(id, user.sub),
          enterpriseAuditStatement(env, id, user.sub, "organization.created", "organization", id, { name, slug })
        ]);
        return json({ ok: true, organization: { id, slug, name, role: "owner" } }, 201, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length >= 3) {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        const membership = await requireOrgMember(env, user.sub, orgId);

        if (request.method === "GET" && parts.length === 3) {
          const org = await env.DB.prepare(`SELECT id, slug, name, status, created_at, updated_at FROM organizations WHERE id = ?`).bind(orgId).first();
          return json({ ok: true, organization: org, membership: { role: membership.role } }, 200, env);
        }

        if (request.method === "GET" && parts.length === 4 && parts[3] === "dashboard") {
          await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
          const [cohorts, assignments, learners, readiness] = await Promise.all([
            env.DB.prepare(`SELECT COUNT(*) AS n FROM cohorts WHERE org_id = ? AND status != 'archived'`).bind(orgId).first(),
            env.DB.prepare(`SELECT COUNT(*) AS n FROM program_assignments WHERE org_id = ? AND status != 'archived'`).bind(orgId).first(),
            env.DB.prepare(`SELECT COUNT(DISTINCT uid) AS n FROM cohort_members WHERE org_id = ? AND status = 'active'`).bind(orgId).first(),
            env.DB.prepare(`
              SELECT ROUND(AVG(rs.overall_score),1) AS avg_score, COUNT(*) AS n
              FROM readiness_snapshots rs
              WHERE rs.org_id = ? AND rs.evidence_coverage >= 0.6
                AND rs.rowid = (
                  SELECT r2.rowid FROM readiness_snapshots r2
                  WHERE r2.org_id = rs.org_id AND r2.uid = rs.uid
                  ORDER BY datetime(r2.created_at) DESC, r2.rowid DESC LIMIT 1
                )
            `).bind(orgId).first()
          ]);
          const canViewLearnerData=membership.role!=='content_manager';
          return json({ ok: true, summary: { cohorts: Number(cohorts?.n || 0), assignments: Number(assignments?.n || 0), learners: canViewLearnerData ? Number(learners?.n || 0) : null, averageReadiness: canViewLearnerData && readiness?.avg_score != null ? Number(readiness.avg_score) : null, readinessSnapshots: canViewLearnerData ? Number(readiness?.n || 0) : null, learnerDataRestricted: !canViewLearnerData } }, 200, env);
        }

        if (parts.length === 4 && parts[3] === "cohorts") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const rows = await env.DB.prepare(`SELECT id, name, pathway_id, program_level, status, deadline_at, created_at, updated_at FROM cohorts WHERE org_id = ? ORDER BY created_at DESC`).bind(orgId).all();
            return json({ ok: true, cohorts: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const pathway = getPathway(body.pathwayId);
            const name = cleanString(body.name, 120);
            if (name.length < 2) throw new HttpError(400, "Cohort name is required");
            const level = enterpriseEnum(body.programLevel || "professional", ["foundations", "essentials", "professional"], "program level");
            const deadline = optionalIsoDate(body.deadlineAt);
            const id = `coh_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO cohorts (id, org_id, name, pathway_id, program_level, deadline_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, name, pathway.id, level, deadline, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "cohort.created", "cohort", id, { name, pathwayId: pathway.id, programLevel: level, deadlineAt: deadline })
            ]);
            return json({ ok: true, cohort: { id, name, pathwayId: pathway.id, programLevel: level, deadlineAt: deadline, status: "draft" } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "invites") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const rows = await env.DB.prepare(`SELECT id, cohort_id, email_normalized, role, status, expires_at, accepted_at, created_at FROM organization_invites WHERE org_id = ? ORDER BY created_at DESC LIMIT 200`).bind(orgId).all();
            return json({ ok: true, invites: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const email = normalizeEnterpriseEmail(body.email);
            const role = enterpriseEnum(body.role || "learner", ["training_admin", "content_manager", "manager", "viewer", "learner"], "role");
            let cohortId = null;
            if (body.cohortId) {
              cohortId = cleanId(body.cohortId);
              const cohort = await env.DB.prepare(`SELECT id FROM cohorts WHERE id = ? AND org_id = ? AND status != 'archived'`).bind(cohortId, orgId).first();
              if (!cohort) throw new HttpError(404, "Cohort not found");
            }
            const days = Math.max(1, Math.min(30, Number(body.expiresDays || 7)));
            const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
            const token = randomToken(32);
            const tokenHash = await sha256Hex(token);
            const id = `inv_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO organization_invites (id, org_id, cohort_id, email_normalized, token_hash, role, expires_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, cohortId, email, tokenHash, role, expiresAt, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "invite.created", "invite", id, { cohortId, email, role, expiresAt })
            ]);
            return json({ ok: true, invite: { id, cohortId, email, role, expiresAt, token } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "assignments") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const rows = await env.DB.prepare(`SELECT id, cohort_id, pathway_id, track, credential_target, status, due_at, curriculum_version, created_at, updated_at FROM program_assignments WHERE org_id = ? ORDER BY created_at DESC`).bind(orgId).all();
            return json({ ok: true, assignments: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const cohortId = cleanId(body.cohortId);
            const cohort = await env.DB.prepare(`SELECT id, pathway_id FROM cohorts WHERE id = ? AND org_id = ? AND status != 'archived'`).bind(cohortId, orgId).first();
            if (!cohort) throw new HttpError(404, "Cohort not found");
            const pathway = getPathway(body.pathwayId || cohort.pathway_id);
            if (cohort.pathway_id !== pathway.id) throw new HttpError(409, "Assignment pathway must match cohort pathway");
            const track = enterpriseEnum(body.track || "professional", ["foundations", "professional"], "track");
            const target = enterpriseEnum(body.credentialTarget || (track === "professional" ? "professional_readiness" : "essentials"), ["foundations", "essentials", "applied", "role_lab", "professional_readiness"], "credential target");
            if (track === "foundations" && !["foundations", "essentials"].includes(target)) throw new HttpError(400, "Foundations track cannot target a professional credential");
            const dueAt = optionalIsoDate(body.dueAt);
            const id = `asn_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO program_assignments (id, org_id, cohort_id, pathway_id, track, credential_target, due_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, cohortId, pathway.id, track, target, dueAt, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "assignment.created", "assignment", id, { cohortId, pathwayId: pathway.id, track, credentialTarget: target, dueAt })
            ]);
            return json({ ok: true, assignment: { id, cohortId, pathwayId: pathway.id, track, credentialTarget: target, dueAt, status: "draft", curriculumVersion: "2.0" } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "firm-content") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const assignmentId = url.searchParams.get("assignmentId");
            const rows = assignmentId
              ? await env.DB.prepare(`SELECT * FROM firm_content WHERE org_id = ? AND assignment_id = ? ORDER BY position_key, created_at`).bind(orgId, cleanId(assignmentId)).all()
              : await env.DB.prepare(`SELECT * FROM firm_content WHERE org_id = ? ORDER BY updated_at DESC LIMIT 300`).bind(orgId).all();
            return json({ ok: true, content: (rows.results || []).map(enterpriseFirmContentPublic) }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
            const body = await readJson(request);
            const pathway = getPathway(body.pathwayId);
            const assignmentId = body.assignmentId ? cleanId(body.assignmentId) : null;
            if (assignmentId) {
              const a = await env.DB.prepare(`SELECT id FROM program_assignments WHERE id = ? AND org_id = ?`).bind(assignmentId, orgId).first();
              if (!a) throw new HttpError(404, "Assignment not found");
            }
            const type = enterpriseEnum(body.contentType || "lesson", ["intro", "lesson", "resource", "exercise", "assessment", "role_lab_stage", "manager_note", "case"], "content type");
            const title = cleanString(body.title, 160);
            if (title.length < 2) throw new HttpError(400, "Content title is required");
            const bodyJson = safeEnterpriseJson(body.body || {}, 18000);
            const positionKey = cleanString(body.positionKey || `z-${Date.now()}`, 100);
            const sourceId = body.sourceStandardContentId ? cleanString(body.sourceStandardContentId, 150) : null;
            const id = `cnt_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            const snapshot = JSON.stringify({ title, body: JSON.parse(bodyJson), positionKey, visibility: "visible", contentType: type, sourceStandardContentId: sourceId });
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO firm_content (id, org_id, assignment_id, pathway_id, content_type, title, body_json, position_key, source_standard_content_id, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, assignmentId, pathway.id, type, title, bodyJson, positionKey, sourceId, user.sub),
              env.DB.prepare(`INSERT INTO firm_content_versions (id, content_id, version, snapshot_json, created_by_uid) VALUES (?, ?, 1, ?, ?)`).bind(crypto.randomUUID(), id, snapshot, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "firm_content.created", "firm_content", id, { assignmentId, pathwayId: pathway.id, contentType: type, title })
            ]);
            return json({ ok: true, content: { id, assignmentId, pathwayId: pathway.id, contentType: type, title, positionKey, visibility: "visible", currentVersion: 1 } }, 201, env);
          }
        }

        if (parts.length === 5 && parts[3] === "firm-content" && request.method === "PATCH") {
          await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
          const contentId = cleanId(parts[4]);
          const existing = await env.DB.prepare(`SELECT * FROM firm_content WHERE id = ? AND org_id = ?`).bind(contentId, orgId).first();
          if (!existing) throw new HttpError(404, "Firm content not found");
          const body = await readJson(request);
          const title = body.title === undefined ? existing.title : cleanString(body.title, 160);
          const bodyJson = body.body === undefined ? existing.body_json : safeEnterpriseJson(body.body, 18000);
          const positionKey = body.positionKey === undefined ? existing.position_key : cleanString(body.positionKey, 100);
          const visibility = body.visibility === undefined ? existing.visibility : enterpriseEnum(body.visibility, ["visible", "hidden", "archived"], "visibility");
          const nextVersion = Number(existing.current_version || 1) + 1;
          const snapshot = JSON.stringify({ title, body: JSON.parse(bodyJson), positionKey, visibility, contentType: existing.content_type, sourceStandardContentId: existing.source_standard_content_id });
          await env.DB.batch([
            env.DB.prepare(`UPDATE firm_content SET title = ?, body_json = ?, position_key = ?, visibility = ?, current_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(title, bodyJson, positionKey, visibility, nextVersion, contentId, orgId),
            env.DB.prepare(`INSERT INTO firm_content_versions (id, content_id, version, snapshot_json, created_by_uid) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), contentId, nextVersion, snapshot, user.sub),
            enterpriseAuditStatement(env, orgId, user.sub, "firm_content.updated", "firm_content", contentId, { visibility, version: nextVersion })
          ]);
          return json({ ok: true, content: { id: contentId, title, positionKey, visibility, currentVersion: nextVersion } }, 200, env);
        }
      }

      if (request.method === "POST" && url.pathname === "/enterprise/invites/accept") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const token = cleanString(body.token, 200);
        if (!token) throw new HttpError(400, "Invite token is required");
        const tokenHash = await sha256Hex(token);
        const invite = await env.DB.prepare(`SELECT * FROM organization_invites WHERE token_hash = ? AND status = 'pending' LIMIT 1`).bind(tokenHash).first();
        if (!invite) throw new HttpError(404, "Invite not found or no longer active");
        if (Date.parse(invite.expires_at) <= Date.now()) {
          await env.DB.prepare(`UPDATE organization_invites SET status = 'expired' WHERE id = ?`).bind(invite.id).run();
          throw new HttpError(410, "Invite expired");
        }
        const userEmail = normalizeEnterpriseEmail(user.email || "", true);
        if (userEmail && userEmail !== invite.email_normalized) throw new HttpError(403, "This invite was issued to a different email address");
        const statements = [
          env.DB.prepare(`INSERT INTO organization_members (org_id, uid, role, status) VALUES (?, ?, ?, 'active') ON CONFLICT(org_id, uid) DO UPDATE SET status='active', updated_at=CURRENT_TIMESTAMP`).bind(invite.org_id, user.sub, invite.role),
          env.DB.prepare(`UPDATE organization_invites SET status='accepted', accepted_by_uid=?, accepted_at=CURRENT_TIMESTAMP WHERE id=?`).bind(user.sub, invite.id),
          enterpriseAuditStatement(env, invite.org_id, user.sub, "invite.accepted", "invite", invite.id, { cohortId: invite.cohort_id, role: invite.role })
        ];
        if (invite.cohort_id) {
          statements.push(env.DB.prepare(`INSERT INTO cohort_members (cohort_id, org_id, uid, status) VALUES (?, ?, ?, 'active') ON CONFLICT(cohort_id, uid) DO UPDATE SET status='active'`).bind(invite.cohort_id, invite.org_id, user.sub));
        }
        await env.DB.batch(statements);
        return json({ ok: true, organizationId: invite.org_id, cohortId: invite.cohort_id || null, role: invite.role }, 200, env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "competencies" && parts.length === 3) {
        await requireUser(request, env);
        const pathway = getPathway(parts[2]);
        const rows = await env.DB.prepare(`
          SELECT c.id, c.code, c.name, c.category, c.description, pc.weight, pc.minimum_score, pc.critical
          FROM pathway_competencies pc JOIN competencies c ON c.id = pc.competency_id
          WHERE pc.pathway_id = ? AND c.status = 'active'
          ORDER BY pc.weight DESC, c.name
        `).bind(pathway.id).all();
        return json({ ok: true, pathway: { id: pathway.id, title: pathway.title }, competencies: rows.results || [] }, 200, env);
      }
