      // ==================================================
      // CAPITAL MASTERY V2 — ASSESSMENTS + CREDENTIAL EVIDENCE
      // ==================================================

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts.length === 3) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        const assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        await v2AssessmentAccess(env,user,assessment,assignmentId);
        const qres=await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
        return json({ok:true,assessment:{key:assessment.assessment_key,version:assessment.version,pathwayId:assessment.pathway_id,stage:assessment.stage,title:assessment.title,description:assessment.description,scenario:v2ParseJson(assessment.scenario_json,{}),passScore:Number(assessment.pass_score)},questions:(qres.results||[]).map(v2PublicAssessmentQuestion)},200,env);
      }

      if (request.method === 'POST' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts[3] === 'submit' && parts.length === 4) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        const assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const body=await readJson(request);
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;
        await v2EnforceAssessmentRate(env,user.sub,assessment.pathway_id,assessment.assessment_key,assignmentId);
        const access=await v2AssessmentAccess(env,user,assessment,assignmentId);
        const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:{};
        const result=await v2GradeAssessment(env,{user,assessment,answers,assignmentId,orgId:access.orgId,cohortId:access.cohortId,curriculumVersion:access.curriculumVersion});
        const pathway=getPathway(assessment.pathway_id);
        const refreshed=result.passed?await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId}):[];
        return json({ok:true,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,issuedCredentials:refreshed.filter(x=>x.issued).map(x=>x.credential),credentialRefresh:refreshed.map(x=>({level:x.level,issued:x.issued===true,eligible:x.eligible===true,missing:x.missing||x.eligibility?.missing||[]}))},200,env);
      }

      if (request.method === 'POST' && url.pathname === '/enterprise/credentials/refresh') {
        const user=await requireUser(request,env);
        const body=await readJson(request);
        const pathway=getPathway(body.pathwayId);
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;
        let orgId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=a.org_id;}
        const refreshed=await v2RefreshCredentials(env,{user,pathway,orgId,assignmentId});
        return json({ok:true,pathwayId:pathway.id,results:refreshed.map(x=>({level:x.level,issued:x.issued===true,existing:x.existing===true,eligible:x.eligible===true,missing:x.missing||x.eligibility?.missing||[],credential:x.credential?{credentialId:x.credential.credential_id||x.credential.credentialId,title:x.credential.credential_title||x.credential.title,status:x.credential.status,standardVersion:x.credential.standard_version||x.credential.standardVersion||null}:null}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'credentials' && parts[2] === 'definitions' && parts.length === 4) {
        await requireUser(request,env);
        const pathway=getPathway(parts[3]);
        const rows=await env.DB.prepare(`SELECT id,credential_level,standard_version,title,track,learner_level,description,requirements_json,sort_order,status FROM credential_definitions WHERE pathway_id=? AND status='active' ORDER BY sort_order`).bind(pathway.id).all();
        return json({ok:true,pathway:{id:pathway.id,title:pathway.title},definitions:(rows.results||[]).map(r=>({id:r.id,level:r.credential_level,standardVersion:r.standard_version,title:r.title,track:r.track,learnerLevel:r.learner_level,description:r.description,requirements:v2ParseJson(r.requirements_json,{}),sortOrder:Number(r.sort_order)}))},200,env);
      }

      if (request.method === 'GET' && url.pathname === '/enterprise/credentials/me') {
        const user=await requireUser(request,env);
        const rows=await env.DB.prepare(`
          SELECT credential_id,public_token,pathway_id,credential_level,credential_title,holder_name,status,issued_at,revoked_at,revocation_reason,reissued_from_id,reissued_to_id,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json
          FROM credentials WHERE uid=? ORDER BY issued_at DESC
        `).bind(user.sub).all();
        return json({ok:true,credentials:(rows.results||[]).map(r=>({...r,evidence_summary:v2ParseJson(r.evidence_summary_json,{})}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'credentials' && parts.length === 4 && parts[3] === 'evidence') {
        const user=await requireUser(request,env);
        const credentialId=cleanId(parts[2]);
        const credential=await env.DB.prepare(`SELECT * FROM credentials WHERE credential_id=? LIMIT 1`).bind(credentialId).first();
        if(!credential) throw new HttpError(404,'Credential not found');
        let allowed=credential.uid===user.sub;
        if(!allowed && credential.org_id){try{await requireOrgRole(env,user.sub,credential.org_id,ENTERPRISE_EMPLOYER_ROLES);allowed=true;}catch{}}
        if(!allowed && user.sub===env.ADMIN_UID) allowed=true;
        if(!allowed) throw new HttpError(403,'Credential evidence access required');
        const evidence=await env.DB.prepare(`SELECT id,evidence_type,evidence_ref,title,evidence_json,created_at FROM credential_evidence_items WHERE credential_id=? ORDER BY created_at,id`).bind(credentialId).all();
        return json({ok:true,credential:{credentialId:credential.credential_id,title:credential.credential_title,pathwayId:credential.pathway_id,level:credential.credential_level,status:credential.status,standardVersion:credential.standard_version,issuedAt:credential.issued_at,assignmentId:credential.assignment_id||null,orgId:credential.org_id||null},evidence:(evidence.results||[]).map(x=>({id:x.id,type:x.evidence_type,ref:x.evidence_ref,title:x.title,data:v2ParseJson(x.evidence_json,{}),createdAt:x.created_at}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'verify' && parts.length === 3) {
        const publicToken=cleanString(parts[2],200);
        const credential=await env.DB.prepare(`SELECT credential_id,public_token,holder_name,pathway_id,credential_level,credential_title,status,issued_at,revoked_at,standard_version,credential_definition_id,evidence_summary_json FROM credentials WHERE public_token=? LIMIT 1`).bind(publicToken).first();
        if(!credential) return json({ok:false,valid:false,error:'Credential not found'},404,env);
        const definition=credential.credential_definition_id?await env.DB.prepare(`SELECT description,requirements_json,track,learner_level FROM credential_definitions WHERE id=? LIMIT 1`).bind(credential.credential_definition_id).first():null;
        const items=await env.DB.prepare(`SELECT evidence_type,title,evidence_json FROM credential_evidence_items WHERE credential_id=? AND evidence_type IN ('assessment','role_lab','readiness','competency_profile','curriculum') ORDER BY created_at,id`).bind(credential.credential_id).all();
        const publicEvidence=(items.results||[]).map(x=>{
          const data=v2ParseJson(x.evidence_json,{});
          if(x.evidence_type==='competency_profile') return {type:x.evidence_type,title:x.title,competencies:(data.competencies||[]).map(c=>({name:c.name,category:c.category,score:Number(c.score),minimumScore:Number(c.minimum_score||0),critical:Number(c.critical)===1,evidenceCount:Number(c.evidence_count||0)}))};
          if(x.evidence_type==='readiness') return {type:x.evidence_type,title:x.title,overallScore:data.overallScore,status:data.status,evidenceCoverage:data.evidenceCoverage,criticalFloorsMet:data.criticalFloorsMet,improvement:data.improvement};
          if(x.evidence_type==='assessment') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,passed:data.passed,submittedAt:data.submittedAt};
          if(x.evidence_type==='role_lab') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,completedAt:data.completedAt};
          return {type:x.evidence_type,title:x.title,standardVersion:credential.standard_version};
        });
        return json({ok:true,valid:credential.status==='active',credential:{credentialId:credential.credential_id,holderName:credential.holder_name,pathwayId:credential.pathway_id,level:credential.credential_level,title:credential.credential_title,status:credential.status,issuedAt:credential.issued_at,revokedAt:credential.revoked_at||null,standardVersion:credential.standard_version||'1.0-legacy',description:definition?.description||null,track:definition?.track||'legacy',learnerLevel:definition?.learner_level||'legacy'},evidence:publicEvidence},200,env);
      }
