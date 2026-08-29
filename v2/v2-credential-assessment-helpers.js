const V2_STANDARD_VERSION = '2.0';
const V2_LEVEL_CODES = {
  essentials: 'ESS',
  role_lab: 'RLB',
  professional_readiness: 'PRD'
};

async function v2ActiveCredential(env, uid, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credentials
    WHERE uid=? AND pathway_id=? AND credential_level=? AND status='active'
    ORDER BY issued_at DESC LIMIT 1
  `).bind(uid, pathwayId, level).first();
}

async function v2AnyCredential(env, uid, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credentials
    WHERE uid=? AND pathway_id=? AND credential_level=?
    ORDER BY issued_at DESC LIMIT 1
  `).bind(uid, pathwayId, level).first();
}

async function v2CredentialDefinition(env, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credential_definitions
    WHERE pathway_id=? AND credential_level=? AND standard_version=? AND status='active'
    LIMIT 1
  `).bind(pathwayId, level, V2_STANDARD_VERSION).first();
}

async function v2BestAssessmentAttempt(env, uid, pathwayId, assessmentKey, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM v2_assessment_attempts
    WHERE uid=? AND pathway_id=? AND assessment_key=?
      AND COALESCE(assignment_id,'public')=?
    ORDER BY passed DESC, score DESC, submitted_at DESC
    LIMIT 1
  `).bind(uid, pathwayId, assessmentKey, scope).first();
}

async function v2BestRoleLabRun(env, uid, pathwayId, labKey, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM role_lab_runs
    WHERE uid=? AND pathway_id=? AND lab_key=?
      AND COALESCE(assignment_id,'public')=? AND status='passed'
    ORDER BY score DESC, completed_at DESC LIMIT 1
  `).bind(uid, pathwayId, labKey, scope).first();
}

async function v2LatestReadiness(env, uid, pathwayId, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM readiness_snapshots
    WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=?
    ORDER BY created_at DESC LIMIT 1
  `).bind(uid, pathwayId, scope).first();
}

function v2CriticalFloorsMet(readiness) {
  if (!readiness) return false;
  const scores = v2ParseJson(readiness.competency_scores_json, {});
  const rows = Object.values(scores || {});
  return rows.length > 0 && !rows.some(x => x && x.critical === true && Number(x.score ?? -1) < Number(x.minimum || 0));
}

async function v2CredentialEligibility(env, { uid, pathwayId, level, assignmentId = null }) {
  const definition = await v2CredentialDefinition(env, pathwayId, level);
  if (!definition) return { eligible:false, reason:'Credential definition unavailable', definition:null, evidence:{} };
  const req = v2ParseJson(definition.requirements_json, {});
  const evidence = {};
  const missing = [];

  for (const prereq of (req.requires_credentials || [])) {
    const c = await v2ActiveCredential(env, uid, pathwayId, prereq);
    evidence[`credential:${prereq}`] = c ? { credentialId:c.credential_id, title:c.credential_title, issuedAt:c.issued_at } : null;
    if (!c) missing.push(`Active ${prereq.replace(/_/g,' ')} credential`);
  }

  if (req.requires_diagnostic) {
    const scope=assignmentId||'public';
    const d=await env.DB.prepare(`SELECT id,score,version,submitted_at FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(uid,pathwayId,scope).first();
    evidence.diagnostic=d?{id:d.id,score:Number(d.score),version:d.version,submittedAt:d.submitted_at}:null;
    if(!d) missing.push('Baseline diagnostic');
  }

  if (req.requires_assessment) {
    const a = await v2BestAssessmentAttempt(env, uid, pathwayId, req.requires_assessment.key, assignmentId);
    evidence.assessment = a ? { id:a.id, key:a.assessment_key, version:a.assessment_version, score:Number(a.score), passed:Number(a.passed)===1, submittedAt:a.submitted_at } : null;
    if (!a || Number(a.passed)!==1 || Number(a.score) < Number(req.requires_assessment.minimum || 0)) {
      missing.push(`${req.requires_assessment.key} at ${Number(req.requires_assessment.minimum || 0)}%+`);
    }
  }

  if (req.requires_role_lab) {
    const r = await v2BestRoleLabRun(env, uid, pathwayId, req.requires_role_lab.key, assignmentId);
    evidence.roleLab = r ? { id:r.id, key:r.lab_key, version:r.lab_version, score:Number(r.score||0), completedAt:r.completed_at } : null;
    if (!r || Number(r.score||0) < Number(req.requires_role_lab.minimum || 0)) {
      missing.push(`${req.requires_role_lab.key} at ${Number(req.requires_role_lab.minimum || 0)}%+`);
    }
  }

  if (req.requires_readiness) {
    const r = await v2LatestReadiness(env, uid, pathwayId, assignmentId);
    const coverage = Number(r?.evidence_coverage || 0);
    const floors = v2CriticalFloorsMet(r);
    evidence.readiness = r ? {
      id:r.id,
      overallScore:Number(r.overall_score),
      status:r.status,
      evidenceCoverage:Math.round(coverage*100),
      evidencePhase:r.evidence_phase,
      criticalFloorsMet:floors,
      baselineScore:r.baseline_score==null?null:Number(r.baseline_score),
      improvement:r.improvement==null?null:Number(r.improvement),
      createdAt:r.created_at
    } : null;
    if (!r || Number(r.overall_score) < Number(req.requires_readiness.minimum || 0)) missing.push(`Readiness score ${Number(req.requires_readiness.minimum || 0)}%+`);
    if (!r || coverage + 1e-9 < Number(req.requires_readiness.evidence_coverage || 0)) missing.push(`${Math.round(Number(req.requires_readiness.evidence_coverage || 0)*100)}% professional evidence coverage`);
    if (req.requires_readiness.critical_floors && !floors) missing.push('All critical competency floors');
  }

  return { eligible:missing.length===0, missing, definition, requirements:req, evidence };
}

function v2CredentialEvidenceSummary(eligibility) {
  const e = eligibility.evidence || {};
  return {
    standardVersion: V2_STANDARD_VERSION,
    requirementsMet: eligibility.eligible,
    evidence: e,
    generatedAt: new Date().toISOString()
  };
}

async function v2IssueCredential(env, { user, pathway, level, orgId = null, assignmentId = null }) {
  if (!V2_LEVEL_CODES[level]) throw new HttpError(400,'Unsupported V2 credential level');
  const active = await v2ActiveCredential(env,user.sub,pathway.id,level);
  if (active) return { issued:false, credential:active, existing:true };
  const previous = await v2AnyCredential(env,user.sub,pathway.id,level);
  if (previous) return { issued:false, credential:previous, existing:true, blockedByPriorStatus:previous.status };

  const eligibility = await v2CredentialEligibility(env,{uid:user.sub,pathwayId:pathway.id,level,assignmentId});
  if (!eligibility.eligible) return { issued:false, eligible:false, missing:eligibility.missing, eligibility };

  const definition = eligibility.definition;
  const year = new Date().getUTCFullYear();
  const random = crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();
  const credentialId = `CM-${pathway.code}-${V2_LEVEL_CODES[level]}-${year}-${random}`;
  const publicToken = randomToken(24);
  const holderName = holderNameFromUser(user);
  const evidenceSummary = v2CredentialEvidenceSummary(eligibility);
  const eventId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`
      INSERT INTO credentials
      (credential_id,public_token,uid,holder_name,pathway_id,credential_level,credential_title,status,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json)
      VALUES (?,?,?,?,?,?,?,'active',?,?,?,?,?)
    `).bind(credentialId,publicToken,user.sub,holderName,pathway.id,level,definition.title,V2_STANDARD_VERSION,definition.id,orgId,assignmentId,JSON.stringify(evidenceSummary)),
    env.DB.prepare(`INSERT INTO credential_events (id,credential_id,event_type,actor_uid,details) VALUES (?,?, 'issued', ?, ?)`)
      .bind(eventId,credentialId,user.sub,JSON.stringify({criteriaVersion:V2_STANDARD_VERSION,automatic:true,definitionId:definition.id,assignmentId:assignmentId||null,orgId:orgId||null}))
  ];

  statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(),credentialId,'curriculum',definition.id,`Capital Mastery Standard ${V2_STANDARD_VERSION}`,JSON.stringify({definitionId:definition.id,requirements:v2ParseJson(definition.requirements_json,{})})));

  for (const [key,value] of Object.entries(eligibility.evidence || {})) {
    if (!value) continue;
    let type='credential', ref=value.credentialId || null, title=key.replace(/^credential:/,'').replace(/_/g,' ');
    if (key==='diagnostic') { type='assessment'; ref=value.id; title='Baseline diagnostic'; }
    if (key==='assessment') { type='assessment'; ref=value.id; title=`Assessment · ${value.key}`; }
    if (key==='roleLab') { type='role_lab'; ref=value.id; title=`Role Lab · ${value.key}`; }
    if (key==='readiness') { type='readiness'; ref=value.id; title='Readiness snapshot'; }
    statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),credentialId,type,ref,title,JSON.stringify(value)));
  }

  if (eligibility.evidence?.readiness) {
    const scope = assignmentId || 'public';
    const skills = await env.DB.prepare(`
      SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical
      FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id
      JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id
      WHERE cs.uid=? AND cs.assignment_scope=? AND cs.pathway_id=?
      ORDER BY pc.weight DESC,c.name
    `).bind(user.sub,scope,pathway.id).all();
    statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),credentialId,'competency_profile',eligibility.evidence.readiness.id,'Competency profile',JSON.stringify({competencies:skills.results||[]})));
  }

  await env.DB.batch(statements);
  return { issued:true, eligible:true, credential:{credentialId,publicToken,title:definition.title,level,status:'active',standardVersion:V2_STANDARD_VERSION}, eligibility };
}

async function v2RefreshCredentials(env, { user, pathway, orgId = null, assignmentId = null }) {
  const out=[];
  for (const level of ['essentials','role_lab','professional_readiness']) {
    out.push({level,...await v2IssueCredential(env,{user,pathway,level,orgId,assignmentId})});
  }
  return out;
}

async function v2AssessmentAccess(env, user, assessment, assignmentId) {
  let orgId=null, cohortId=null, curriculumVersion=V2_STANDARD_VERSION, assignment=null;
  if (assignmentId) {
    assignment=await v2RequireAssignmentAccess(env,user.sub,assignmentId,assessment.pathway_id);
    if (assignment.accessRole==='learner' && !['published','completed'].includes(assignment.status)) throw new HttpError(403,'Assignment is not active');
    orgId=assignment.org_id; cohortId=assignment.cohort_id; curriculumVersion=assignment.curriculum_version||V2_STANDARD_VERSION;
  }
  if (assessment.assessment_key==='ib-essentials-case') {
    const foundations=await v2ActiveCredential(env,user.sub,assessment.pathway_id,'foundations');
    if (!foundations) throw new HttpError(409,'Earn the Foundations Certificate before the Essentials mini case');
    if (assignment && assignment.track==='professional') {
      const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,assessment.pathway_id,assignmentId).first();
      if(!baseline) throw new HttpError(409,'Complete the assigned baseline diagnostic before the Essentials mini case');
    }
  }
  if (assessment.assessment_key==='ib-professional-final') {
    const scope=assignmentId||'public';
    const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,assessment.pathway_id,scope).first();
    if(!baseline) throw new HttpError(409,'Complete the baseline diagnostic before the Professional Readiness Final');
    for (const level of ['foundations','essentials','applied','role_lab']) {
      if (!await v2ActiveCredential(env,user.sub,assessment.pathway_id,level)) throw new HttpError(409,`Earn the ${level.replace(/_/g,' ')} credential before the Professional Readiness Final`);
    }
  }
  return {orgId,cohortId,curriculumVersion};
}

function v2PublicAssessmentQuestion(row) {
  return {id:row.id,position:Number(row.position),competencyId:row.competency_id,prompt:row.prompt,options:v2ParseJson(row.options_json,[]),weight:Number(row.weight||1)};
}

async function v2GradeAssessment(env, { user, assessment, answers, assignmentId = null, orgId = null, cohortId = null, curriculumVersion = V2_STANDARD_VERSION }) {
  const qres=await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
  const qs=qres.results||[];
  if (!qs.length) throw new HttpError(404,'Assessment questions unavailable');
  let earned=0,totalWeight=0,correct=0;
  const byComp={};
  const details=[];
  for(const q of qs){
    const weight=Math.max(1,Number(q.weight||1)); totalWeight+=weight;
    const submitted=String(answers?.[q.id]??''); const ok=submitted===String(q.correct_answer);
    if(ok){earned+=weight;correct++;}
    (byComp[q.competency_id] ||= []).push({score:ok?100:0,weight});
    details.push({id:q.id,correct:ok,rationale:q.rationale});
  }
  const score=totalWeight?Math.round((earned/totalWeight)*100):0;
  const passed=score>=Number(assessment.pass_score);
  const attemptId=`v2a_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
  const compScores={};
  for(const [cid,vals] of Object.entries(byComp)){
    const w=vals.reduce((s,x)=>s+x.weight,0); compScores[cid]=Math.round(vals.reduce((s,x)=>s+x.score*x.weight,0)/w);
  }
  await env.DB.prepare(`INSERT INTO v2_assessment_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,answers_json,result_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(attemptId,user.sub,orgId,cohortId,assignmentId,assessment.pathway_id,assessment.assessment_key,assessment.version,score,passed?1:0,JSON.stringify(answers||{}),JSON.stringify({correct,total:qs.length,competencyScores:compScores})).run();

  let readiness=null;
  if(passed){
    const sourceType=assessment.stage==='final'?'final':'assessment';
    const scope=assignmentId||'public';
    const statements=[];
    for(const [competencyId,cScore] of Object.entries(compScores)){
      const stableId=`evi_${(await sha256Hex(`${sourceType}|${user.sub}|${scope}|${assessment.assessment_key}|${assessment.version}|${competencyId}`)).slice(0,28)}`;
      statements.push(env.DB.prepare(`
        INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          source_id=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.source_id ELSE competency_evidence.source_id END,
          score=MAX(competency_evidence.score, excluded.score),
          weight=excluded.weight,
          evidence_json=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.evidence_json ELSE competency_evidence.evidence_json END
      `).bind(stableId,user.sub,orgId,assignmentId,assessment.pathway_id,competencyId,sourceType,attemptId,cScore,assessment.stage==='final'?1.25:0.75,JSON.stringify({assessmentKey:assessment.assessment_key,version:assessment.version,stage:assessment.stage})));
    }
    if(statements.length) await env.DB.batch(statements);
    for(const competencyId of Object.keys(compScores)) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:assessment.pathway_id,competencyId});
    readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:assessment.pathway_id,curriculumVersion});
  }
  return {attemptId,score,passed,correct,total:qs.length,competencyScores:compScores,details,readiness};
}

async function v2EnforceDiagnosticRate(env, uid, pathwayId, assignmentId = null) {
  const scope=assignmentId||'public';
  const row=await env.DB.prepare(`SELECT COUNT(*) AS n FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? AND submitted_at>=datetime('now','-10 minutes')`).bind(uid,pathwayId,scope).first();
  if(Number(row?.n||0)>=10) throw new HttpError(429,'Too many recent diagnostic attempts. Please wait before trying again.');
}

async function v2EnforceAssessmentRate(env, uid, pathwayId, assessmentKey, assignmentId = null) {
  const scope=assignmentId||'public';
  const row=await env.DB.prepare(`SELECT COUNT(*) AS n FROM v2_assessment_attempts WHERE uid=? AND pathway_id=? AND assessment_key=? AND COALESCE(assignment_id,'public')=? AND submitted_at>=datetime('now','-10 minutes')`).bind(uid,pathwayId,assessmentKey,scope).first();
  if(Number(row?.n||0)>=10) throw new HttpError(429,'Too many recent assessment attempts. Please wait before trying again.');
}
