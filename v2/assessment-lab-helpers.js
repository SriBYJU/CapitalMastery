function v2ParseJson(value, fallback = {}) {
  try { return JSON.parse(value || '') ?? fallback; } catch { return fallback; }
}

function v2Clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Number(n) || 0)); }

async function v2RequireAssignmentAccess(env, uid, assignmentId, pathwayId = null) {
  const row = await env.DB.prepare(`
    SELECT a.*, c.status AS cohort_status, cm.status AS member_status, o.status AS org_status
    FROM program_assignments a
    JOIN cohorts c ON c.id = a.cohort_id AND c.org_id = a.org_id
    JOIN organization_members om ON om.org_id = a.org_id AND om.uid = ?
    LEFT JOIN cohort_members cm ON cm.cohort_id = c.id AND cm.org_id = c.org_id AND cm.uid = ?
    JOIN organizations o ON o.id = a.org_id
    WHERE a.id = ? LIMIT 1
  `).bind(uid, uid, assignmentId).first();
  if (!row || row.org_status !== 'active') throw new HttpError(404, 'Assignment not found');
  const employerRoles = new Set(['owner','training_admin','content_manager','manager','viewer']);
  const membership = await env.DB.prepare(`SELECT role,status FROM organization_members WHERE org_id=? AND uid=? LIMIT 1`).bind(row.org_id, uid).first();
  const employer = membership && membership.status === 'active' && employerRoles.has(membership.role);
  const learner = row.member_status === 'active';
  if (!employer && !learner) throw new HttpError(403, 'Assignment access required');
  if (pathwayId && row.pathway_id !== pathwayId) throw new HttpError(409, 'Assignment pathway mismatch');
  return { ...row, accessRole: employer ? membership.role : 'learner' };
}

function v2GradeRules(grading, response) {
  const rules = Array.isArray(grading?.rules) ? grading.rules : [];
  let earned = 0, possible = 0;
  const breakdown = [];
  const feedback = [];
  for (const rule of rules) {
    const pts = Math.max(0, Number(rule.points || 0));
    possible += pts;
    const raw = response?.[rule.field];
    let fraction = 0;
    let detail = '';
    if (rule.type === 'numeric') {
      const actual = Number(raw), expected = Number(rule.expected), tolerance = Math.max(0, Number(rule.tolerance || 0));
      if (Number.isFinite(actual) && Number.isFinite(expected)) {
        const diff = Math.abs(actual - expected);
        if (diff <= tolerance) fraction = 1;
        else if (tolerance > 0 && diff <= tolerance * 2) fraction = 0.75;
        else if (tolerance > 0 && diff <= tolerance * 5) fraction = 0.4;
        detail = Number.isFinite(actual) ? `Submitted ${actual}` : 'No valid number submitted';
      }
    } else if (rule.type === 'choice') {
      fraction = String(raw ?? '') === String(rule.expected ?? '') ? 1 : 0;
      detail = String(raw ?? '');
    } else if (rule.type === 'choice_flexible') {
      const value = String(raw ?? '');
      const preferred = Array.isArray(rule.preferred) ? rule.preferred.map(String) : [];
      fraction = preferred.includes(value) ? 1 : value ? 0.6 : 0;
      detail = value;
    } else if (rule.type === 'multi_select') {
      const selected = new Set(Array.isArray(raw) ? raw.map(String) : []);
      const expected = new Set(Array.isArray(rule.expected) ? rule.expected.map(String) : []);
      const hits = [...expected].filter(x => selected.has(x)).length;
      const extras = [...selected].filter(x => !expected.has(x)).length;
      fraction = expected.size ? v2Clamp((hits - extras * 0.5) / expected.size, 0, 1) : 0;
      detail = `${hits}/${expected.size} material issues identified${extras ? ` · ${extras} false positive${extras === 1 ? '' : 's'}` : ''}`;
    } else if (rule.type === 'text_evidence') {
      const text = String(raw ?? '').trim();
      const lower = text.toLowerCase();
      const minChars = Math.max(1, Number(rule.min_chars || 1));
      const groups = Array.isArray(rule.evidence_groups) ? rule.evidence_groups : [];
      const lengthFraction = Math.min(1, text.length / minChars);
      const hits = groups.filter(group => Array.isArray(group) && group.some(term => lower.includes(String(term).toLowerCase()))).length;
      const evidenceFraction = groups.length ? hits / groups.length : 1;
      fraction = v2Clamp(lengthFraction * 0.2 + evidenceFraction * 0.8, 0, 1);
      detail = `${text.length} characters · ${hits}/${groups.length} evidence areas covered`;
    }
    const ruleEarned = pts * fraction;
    earned += ruleEarned;
    const passed = fraction >= 0.999;
    breakdown.push({ field: rule.field, type: rule.type, points: Math.round(ruleEarned * 10) / 10, possible: pts, passed, detail });
    if (!passed && rule.feedback) feedback.push(rule.feedback);
  }
  const score = possible ? Math.round((earned / possible) * 100) : 0;
  return { score, earned: Math.round(earned * 10) / 10, possible, breakdown, feedback: [...new Set(feedback)] };
}

async function v2RecomputeCompetency(env, { uid, orgId, assignmentId, pathwayId, competencyId }) {
  const orgScope = orgId || 'public';
  const assignmentScope = assignmentId || 'public';
  const rows = await env.DB.prepare(`
    SELECT score, weight, source_type FROM competency_evidence
    WHERE uid=? AND pathway_id=? AND competency_id=?
      AND COALESCE(org_id,'public')=? AND COALESCE(assignment_id,'public')=?
  `).bind(uid, pathwayId, competencyId, orgScope, assignmentScope).all();
  const list = rows.results || [];
  const professional = list.filter(r => r.source_type !== 'diagnostic');
  const scoringEvidence = professional.length ? professional : list;
  const totalWeight = scoringEvidence.reduce((s, r) => s + Math.max(0, Number(r.weight || 0)), 0);
  const score = totalWeight ? Math.round(scoringEvidence.reduce((s, r) => s + Number(r.score || 0) * Math.max(0, Number(r.weight || 0)), 0) / totalWeight) : 0;
  await env.DB.prepare(`
    INSERT INTO competency_scores (uid, org_scope, assignment_scope, pathway_id, competency_id, score, evidence_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid, org_scope, assignment_scope, pathway_id, competency_id)
    DO UPDATE SET score=excluded.score, evidence_count=excluded.evidence_count, updated_at=CURRENT_TIMESTAMP
  `).bind(uid, orgScope, assignmentScope, pathwayId, competencyId, score, list.length).run();
  return score;
}

async function v2CreateReadinessSnapshot(env, { uid, orgId = null, cohortId = null, assignmentId = null, pathwayId, curriculumVersion = '2.0' }) {
  const orgScope = orgId || 'public';
  const assignmentScope = assignmentId || 'public';
  const mapped = await env.DB.prepare(`
    SELECT pc.competency_id, pc.weight, pc.minimum_score, pc.critical, c.name,
           cs.score, cs.evidence_count
    FROM pathway_competencies pc
    JOIN competencies c ON c.id = pc.competency_id
    LEFT JOIN competency_scores cs
      ON cs.uid=? AND cs.org_scope=? AND cs.assignment_scope=?
      AND cs.pathway_id=pc.pathway_id AND cs.competency_id=pc.competency_id
    WHERE pc.pathway_id=? AND c.status='active'
  `).bind(uid, orgScope, assignmentScope, pathwayId).all();
  const list = mapped.results || [];
  const available = list.filter(x => x.score !== null && x.score !== undefined);
  const denom = available.reduce((s, x) => s + Number(x.weight || 0), 0);
  const overall = denom ? Math.round(available.reduce((s, x) => s + Number(x.score || 0) * Number(x.weight || 0), 0) / denom) : 0;
  const criticalBelow = available.some(x => Number(x.critical) === 1 && Number(x.score) < Number(x.minimum_score || 0));
  const evidenceRows = await env.DB.prepare(`
    SELECT competency_id,
           SUM(CASE WHEN source_type != 'diagnostic' THEN 1 ELSE 0 END) AS professional_count,
           MAX(CASE WHEN source_type = 'role_lab' THEN 1 ELSE 0 END) AS has_role_lab,
           MAX(CASE WHEN source_type = 'final' THEN 1 ELSE 0 END) AS has_final
    FROM competency_evidence
    WHERE uid=? AND pathway_id=? AND COALESCE(org_id,'public')=? AND COALESCE(assignment_id,'public')=?
    GROUP BY competency_id
  `).bind(uid, pathwayId, orgScope, assignmentScope).all();
  const evidence = evidenceRows.results || [];
  const professionalCompetencies = evidence.filter(x => Number(x.professional_count || 0) > 0).length;
  const evidenceCoverage = list.length ? professionalCompetencies / list.length : 0;
  const hasRoleLab = evidence.some(x => Number(x.has_role_lab || 0) === 1);
  const hasFinal = evidence.some(x => Number(x.has_final || 0) === 1);
  const evidencePhase = hasFinal ? 'final_evidence' : hasRoleLab ? 'role_lab_evidence' : evidenceCoverage > 0 ? 'applied_evidence' : 'baseline';
  let status = overall >= 85 ? 'ready' : overall >= 75 ? 'ready_with_development' : overall >= 60 ? 'near_ready' : 'developing';
  if (evidenceCoverage === 0) status = 'developing';
  else if (evidenceCoverage < 0.6 && ['ready','ready_with_development'].includes(status)) status = 'near_ready';
  else if (!hasFinal && status === 'ready') status = 'ready_with_development';
  if (criticalBelow && ['ready','ready_with_development'].includes(status)) status = 'near_ready';
  const baseline = await env.DB.prepare(`SELECT score FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(uid, pathwayId, assignmentScope).first();
  const baselineScore = baseline ? Number(baseline.score) : null;
  const improvement = baselineScore === null ? null : overall - baselineScore;
  const scoreJson = JSON.stringify(Object.fromEntries(list.map(x => [x.competency_id, { name:x.name, score:x.score == null ? null : Number(x.score), minimum:Number(x.minimum_score||0), critical:Number(x.critical)===1, evidenceCount:Number(x.evidence_count||0) }])));
  const id = `rdy_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
  await env.DB.prepare(`INSERT INTO readiness_snapshots (id,uid,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,competency_scores_json,baseline_score,improvement,curriculum_version,evidence_coverage,evidence_phase) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, uid, orgId, cohortId, assignmentId, pathwayId, overall, status, scoreJson, baselineScore, improvement, curriculumVersion, evidenceCoverage, evidencePhase).run();
  return { id, overallScore: overall, status, baselineScore, improvement, evidenceCoverage: Math.round(evidenceCoverage * 100), evidencePhase, competencies: v2ParseJson(scoreJson,{}) };
}

function v2PublicDiagnosticQuestion(row) {
  return { id: row.id, competencyId: row.competency_id, position: Number(row.position), prompt: row.prompt, options: v2ParseJson(row.options_json,[]) };
}

function v2PublicLabTask(row) {
  return { id: row.id, stageNo: Number(row.stage_no), title: row.title, taskType: row.task_type, brief: v2ParseJson(row.brief_json,{}), passScore: Number(row.pass_score), maxAttempts: Number(row.max_attempts) };
}

async function v2LatestTaskSubmissions(env, runId) {
  const rows = await env.DB.prepare(`
    SELECT s.* FROM role_lab_submissions s
    JOIN (SELECT task_id, MAX(attempt_no) AS max_attempt FROM role_lab_submissions WHERE run_id=? GROUP BY task_id) x
      ON x.task_id=s.task_id AND x.max_attempt=s.attempt_no
    WHERE s.run_id=?
  `).bind(runId, runId).all();
  return rows.results || [];
}

async function v2RunState(env, run) {
  const tasksRes = await env.DB.prepare(`SELECT * FROM role_lab_tasks WHERE lab_key=? AND lab_version=? AND status='active' ORDER BY stage_no`).bind(run.lab_key, run.lab_version).all();
  const tasks = tasksRes.results || [];
  const latest = await v2LatestTaskSubmissions(env, run.id);
  const byTask = new Map(latest.map(s => [s.task_id, s]));
  let current = null;
  for (const task of tasks) {
    const s = byTask.get(task.id);
    const score = s ? Number(v2ParseJson(s.score_json,{}).score ?? -1) : -1;
    if (!s || score < Number(task.pass_score)) { current = task; break; }
  }
  const scores = tasks.map(t => byTask.get(t.id) ? Number(v2ParseJson(byTask.get(t.id).score_json,{}).score || 0) : null).filter(x => x !== null);
  const overall = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  if (!current && tasks.length && overall < 80) {
    const revisable = tasks.filter(t => {
      const s=byTask.get(t.id); return s && Number(s.attempt_no) < Number(t.max_attempts);
    }).sort((a,b)=>Number(v2ParseJson(byTask.get(a.id).score_json,{}).score||0)-Number(v2ParseJson(byTask.get(b.id).score_json,{}).score||0));
    current = revisable[0] || null;
  }
  return { tasks, latest, byTask, current, overall, complete: !current && tasks.length > 0 && overall >= 80 };
}
