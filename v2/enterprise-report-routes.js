      // ==================================================
      // CAPITAL MASTERY V2 — EMPLOYER + LEARNER REPORTING
      // ==================================================

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'members' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES);
        const rows=await env.DB.prepare(`
          SELECT m.uid,m.role,m.status,m.joined_at AS created_at,m.updated_at,
                 MAX(i.email_normalized) AS email,
                 MAX(c.holder_name) AS holder_name
          FROM organization_members m
          LEFT JOIN organization_invites i ON i.org_id=m.org_id AND i.accepted_by_uid=m.uid
          LEFT JOIN credentials c ON c.uid=m.uid
          WHERE m.org_id=?
          GROUP BY m.uid,m.role,m.status,m.joined_at,m.updated_at
          ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'training_admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'content_manager' THEN 3 WHEN 'viewer' THEN 4 ELSE 5 END, COALESCE(MAX(c.holder_name),MAX(i.email_normalized),m.uid)
        `).bind(orgId).all();
        return json({ok:true,members:(rows.results||[]).map(r=>({uid:r.uid,role:r.role,status:r.status,email:r.email||null,name:r.holder_name||null,createdAt:r.created_at,updatedAt:r.updated_at}))},200,env);
      }

      if (request.method === 'PATCH' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'members' && parts.length === 5) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]); const targetUid=cleanString(parts[4],160);
        await requireOrgRole(env,user.sub,orgId,['owner','training_admin']);
        const target=await env.DB.prepare(`SELECT * FROM organization_members WHERE org_id=? AND uid=? LIMIT 1`).bind(orgId,targetUid).first();
        if(!target) throw new HttpError(404,'Organization member not found');
        const body=await readJson(request);
        const role=body.role===undefined?target.role:enterpriseEnum(body.role,['owner','training_admin','content_manager','manager','viewer','learner'],'role');
        const status=body.status===undefined?target.status:enterpriseEnum(body.status,['active','archived'],'member status');
        if(target.role==='owner' && (role!=='owner'||status!=='active')){
          const owners=await env.DB.prepare(`SELECT COUNT(*) AS n FROM organization_members WHERE org_id=? AND role='owner' AND status='active'`).bind(orgId).first();
          if(Number(owners?.n||0)<=1) throw new HttpError(409,'The organization must keep at least one active owner');
        }
        if(user.sub!==targetUid && (role==='owner'||target.role==='owner')) await requireOrgRole(env,user.sub,orgId,['owner']);
        await env.DB.batch([
          env.DB.prepare(`UPDATE organization_members SET role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE org_id=? AND uid=?`).bind(role,status,orgId,targetUid),
          enterpriseAuditStatement(env,orgId,user.sub,'member.updated','organization_member',targetUid,{previousRole:target.role,role,previousStatus:target.status,status})
        ]);
        return json({ok:true,member:{uid:targetUid,role,status}},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'readiness-report' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES);
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        let assignment=null;
        if(assignmentId){assignment=await env.DB.prepare(`SELECT a.*,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.id=? AND a.org_id=? LIMIT 1`).bind(assignmentId,orgId).first();if(!assignment) throw new HttpError(404,'Assignment not found');}
        const assignments=assignment?[assignment]:(await env.DB.prepare(`SELECT a.*,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status!='archived' ORDER BY a.created_at DESC`).bind(orgId).all()).results||[];
        const reportAssignments=[];
        for(const a of assignments){
          const learners=(await env.DB.prepare(`
            SELECT cm.uid,
                   MAX(i.email_normalized) AS email,
                   MAX(cr.holder_name) AS holder_name
            FROM cohort_members cm
            LEFT JOIN organization_invites i ON i.org_id=cm.org_id AND i.cohort_id=cm.cohort_id AND i.accepted_by_uid=cm.uid
            LEFT JOIN credentials cr ON cr.uid=cm.uid
            WHERE cm.org_id=? AND cm.cohort_id=? AND cm.status='active'
            GROUP BY cm.uid ORDER BY COALESCE(MAX(cr.holder_name),MAX(i.email_normalized),cm.uid)
          `).bind(orgId,a.cohort_id).all()).results||[];
          const learnerRows=[];
          for(const l of learners){
            const readiness=await env.DB.prepare(`SELECT * FROM readiness_snapshots WHERE uid=? AND assignment_id=? ORDER BY created_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const diagnostic=await env.DB.prepare(`SELECT score,submitted_at FROM diagnostic_attempts WHERE uid=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(l.uid,a.id).first();
            const lab=await env.DB.prepare(`SELECT id,status,score,revision_count,completed_at FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const final=await env.DB.prepare(`SELECT score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? AND assignment_id=? AND assessment_key='ib-professional-final' ORDER BY score DESC,submitted_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const readinessCredential=await env.DB.prepare(`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' ORDER BY issued_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const due=a.due_at?Date.parse(a.due_at):null;
            const complete=!!(readinessCredential&&readinessCredential.status==='active');
            learnerRows.push({uid:l.uid,name:l.holder_name||null,email:l.email||null,diagnostic:diagnostic?{score:Number(diagnostic.score),submittedAt:diagnostic.submitted_at}:null,readiness:readiness?{overallScore:Number(readiness.overall_score),status:readiness.status,baselineScore:readiness.baseline_score==null?null:Number(readiness.baseline_score),improvement:readiness.improvement==null?null:Number(readiness.improvement),evidenceCoverage:Math.round(Number(readiness.evidence_coverage||0)*100),evidencePhase:readiness.evidence_phase,competencies:v2ParseJson(readiness.competency_scores_json,{})}:null,roleLab:lab?{id:lab.id,status:lab.status,score:lab.score==null?null:Number(lab.score),revisions:Number(lab.revision_count||0),completedAt:lab.completed_at}:null,final:final?{score:Number(final.score),passed:Number(final.passed)===1,submittedAt:final.submitted_at}:null,credential:readinessCredential?{credentialId:readinessCredential.credential_id,status:readinessCredential.status,issuedAt:readinessCredential.issued_at}:null,complete,overdue:!!(due&&due<Date.now()&&!complete)});
          }
          const latestScores={};
          for(const l of learnerRows){for(const [cid,c] of Object.entries(l.readiness?.competencies||{})){if(c?.score==null)continue;(latestScores[cid] ||= {name:c.name,scores:[],minimum:Number(c.minimum||0),critical:c.critical===true}).scores.push(Number(c.score));}}
          const competencySummary=Object.entries(latestScores).map(([competencyId,v])=>({competencyId,name:v.name,averageScore:Math.round(v.scores.reduce((x,y)=>x+y,0)/v.scores.length),learnersMeasured:v.scores.length,minimumScore:v.minimum,critical:v.critical})).sort((x,y)=>x.averageScore-y.averageScore);
          const readinessMeasured=learnerRows.filter(x=>x.readiness);
          reportAssignments.push({assignment:{id:a.id,cohortId:a.cohort_id,cohortName:a.cohort_name,pathwayId:a.pathway_id,credentialTarget:a.credential_target,status:a.status,dueAt:a.due_at,curriculumVersion:a.curriculum_version},summary:{learners:learnerRows.length,measured:readinessMeasured.length,completed:learnerRows.filter(x=>x.complete).length,overdue:learnerRows.filter(x=>x.overdue).length,averageReadiness:readinessMeasured.length?Math.round(readinessMeasured.reduce((s,x)=>s+Number(x.readiness.overallScore||0),0)/readinessMeasured.length):null,averageImprovement:readinessMeasured.filter(x=>x.readiness.improvement!=null).length?Math.round(readinessMeasured.filter(x=>x.readiness.improvement!=null).reduce((s,x)=>s+Number(x.readiness.improvement||0),0)/readinessMeasured.filter(x=>x.readiness.improvement!=null).length):null},competencies:competencySummary,learners:learnerRows});
        }
        return json({ok:true,orgId,generatedAt:new Date().toISOString(),assignments:reportAssignments},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'learner' && parts[2] === 'readiness-report' && parts.length === 4) {
        const user=await requireUser(request,env); const pathway=getPathway(parts[3]);
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        let assignment=null,orgId=null;
        if(assignmentId){assignment=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=assignment.org_id;}
        const skillsScope=assignmentId||'public';
        const readiness=await v2LatestReadiness(env,user.sub,pathway.id,assignmentId);
        const skills=(await env.DB.prepare(`SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id WHERE cs.uid=? AND cs.assignment_scope=? AND cs.pathway_id=? ORDER BY pc.weight DESC,c.name`).bind(user.sub,skillsScope,pathway.id).all()).results||[];
        const credentials=(await env.DB.prepare(`SELECT credential_id,public_token,credential_level,credential_title,status,standard_version,issued_at,assignment_id FROM credentials WHERE uid=? AND pathway_id=? ORDER BY issued_at`).bind(user.sub,pathway.id).all()).results||[];
        const diagnostic=await env.DB.prepare(`SELECT score,submitted_at FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        const lab=await env.DB.prepare(`SELECT id,lab_key,lab_version,status,score,revision_count,completed_at FROM role_lab_runs WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY started_at DESC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        const finalAssessment=await env.DB.prepare(`SELECT assessment_key,assessment_version,score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? AND assessment_key='ib-professional-final' ORDER BY score DESC,submitted_at DESC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        return json({ok:true,generatedAt:new Date().toISOString(),pathway:{id:pathway.id,title:pathway.title,role:pathway.role},assignment:assignment?{id:assignment.id,orgId,cohortId:assignment.cohort_id,dueAt:assignment.due_at,curriculumVersion:assignment.curriculum_version}:null,diagnostic:diagnostic?{score:Number(diagnostic.score),submittedAt:diagnostic.submitted_at}:null,readiness:readiness?{overallScore:Number(readiness.overall_score),status:readiness.status,baselineScore:readiness.baseline_score==null?null:Number(readiness.baseline_score),improvement:readiness.improvement==null?null:Number(readiness.improvement),evidenceCoverage:Math.round(Number(readiness.evidence_coverage||0)*100),evidencePhase:readiness.evidence_phase,createdAt:readiness.created_at}:null,competencies:skills.map(s=>({id:s.competency_id,name:s.name,category:s.category,score:Number(s.score),evidenceCount:Number(s.evidence_count||0),weight:Number(s.weight||0),minimumScore:Number(s.minimum_score||0),critical:Number(s.critical)===1})),roleLab:lab?{id:lab.id,key:lab.lab_key,version:lab.lab_version,status:lab.status,score:lab.score==null?null:Number(lab.score),revisions:Number(lab.revision_count||0),completedAt:lab.completed_at}:null,finalAssessment:finalAssessment?{key:finalAssessment.assessment_key,version:finalAssessment.assessment_version,score:Number(finalAssessment.score),passed:Number(finalAssessment.passed)===1,submittedAt:finalAssessment.submitted_at}:null,credentials:credentials.map(c=>({credentialId:c.credential_id,publicToken:c.public_token,level:c.credential_level,title:c.credential_title,status:c.status,standardVersion:c.standard_version,issuedAt:c.issued_at,assignmentId:c.assignment_id||null}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'audit' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,['owner','training_admin']);
        const rawLimit=Number(url.searchParams.get('limit')||100); const limit=Math.max(1,Math.min(200,Number.isFinite(rawLimit)?Math.floor(rawLimit):100));
        const rows=await env.DB.prepare(`SELECT id,actor_uid,action,target_type,target_id,details_json,created_at FROM enterprise_audit_events WHERE org_id=? ORDER BY created_at DESC LIMIT ?`).bind(orgId,limit).all();
        return json({ok:true,orgId,events:(rows.results||[]).map(x=>({id:x.id,actorUid:x.actor_uid,action:x.action,targetType:x.target_type,targetId:x.target_id,details:v2ParseJson(x.details_json,{}),createdAt:x.created_at}))},200,env);
      }

      if (request.method === 'GET' && url.pathname === '/enterprise/me/export') {
        const user=await requireUser(request,env);
        const [memberships,cohorts,credentials,diagnostics,scores,readiness,labs,assessments]=await Promise.all([
          env.DB.prepare(`SELECT m.org_id,o.name AS org_name,m.role,m.status,m.joined_at AS created_at,m.updated_at FROM organization_members m JOIN organizations o ON o.id=m.org_id WHERE m.uid=? ORDER BY o.name`).bind(user.sub).all(),
          env.DB.prepare(`SELECT cm.org_id,cm.cohort_id,c.name AS cohort_name,c.pathway_id,c.program_level,c.deadline_at,cm.status FROM cohort_members cm JOIN cohorts c ON c.id=cm.cohort_id WHERE cm.uid=? ORDER BY c.created_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT credential_id,pathway_id,credential_level,credential_title,status,standard_version,issued_at,revoked_at,org_id,assignment_id FROM credentials WHERE uid=? ORDER BY issued_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,version,score,submitted_at FROM diagnostic_attempts WHERE uid=? ORDER BY submitted_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT assignment_scope,pathway_id,competency_id,score,evidence_count,updated_at FROM competency_scores WHERE uid=? ORDER BY updated_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,baseline_score,improvement,evidence_coverage,evidence_phase,curriculum_version,created_at FROM readiness_snapshots WHERE uid=? ORDER BY created_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status,score,revision_count,started_at,completed_at FROM role_lab_runs WHERE uid=? ORDER BY started_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? ORDER BY submitted_at DESC`).bind(user.sub).all()
        ]);
        return json({ok:true,generatedAt:new Date().toISOString(),formatVersion:'1.0',account:{uid:user.sub,email:user.email||null,name:user.name||null},enterprise:{memberships:memberships.results||[],cohorts:cohorts.results||[],credentials:credentials.results||[],diagnostics:diagnostics.results||[],competencyScores:scores.results||[],readinessSnapshots:readiness.results||[],roleLabRuns:labs.results||[],assessmentAttempts:assessments.results||[]},note:'Assessment answer content and server-side answer keys are intentionally excluded from this export.'},200,env);
      }
