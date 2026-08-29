      // ==================================================
      // CAPITAL MASTERY V2 — DIAGNOSTIC + COMPETENCY + ROLE LAB ENGINE
      // ==================================================

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "diagnostic" && parts.length === 3) {
        const user = await requireUser(request, env);
        const pathway = getPathway(parts[2]);
        const rows = await env.DB.prepare(`SELECT * FROM diagnostic_questions WHERE pathway_id=? AND version='2.0' AND status='active' ORDER BY position`).bind(pathway.id).all();
        if (!(rows.results || []).length) throw new HttpError(404, "Diagnostic not available yet");
        return json({ ok:true, pathway:{id:pathway.id,title:pathway.title}, version:'2.0', credentialWeight:0, questions:(rows.results||[]).map(v2PublicDiagnosticQuestion), note:'The diagnostic measures your starting point and does not count against credential eligibility.' },200,env);
      }

      if (request.method === "POST" && url.pathname === "/enterprise/diagnostic/submit") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const pathway = getPathway(body.pathwayId);
        const assignmentId = body.assignmentId ? cleanId(body.assignmentId) : null;
        await v2EnforceDiagnosticRate(env,user.sub,pathway.id,assignmentId);
        let orgId=null, cohortId=null, curriculumVersion='2.0';
        if (assignmentId) {
          const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);
          if (a.accessRole==='learner' && !['published','completed'].includes(a.status)) throw new HttpError(403,'Assignment is not active');
          orgId=a.org_id; cohortId=a.cohort_id; curriculumVersion=a.curriculum_version || '2.0';
        }
        const qRes=await env.DB.prepare(`SELECT * FROM diagnostic_questions WHERE pathway_id=? AND version='2.0' AND status='active' ORDER BY position`).bind(pathway.id).all();
        const qs=qRes.results||[]; if(!qs.length) throw new HttpError(404,'Diagnostic not available yet');
        const answers=body.answers && typeof body.answers==='object' ? body.answers : {};
        let correct=0;
        const byComp={};
        const details=[];
        for(const q of qs){
          const submitted=String(answers[q.id]??''); const ok=submitted===String(q.correct_answer); if(ok) correct++;
          (byComp[q.competency_id] ||= []).push(ok?100:0);
          details.push({id:q.id,correct:ok,rationale:ok?q.rationale:undefined});
        }
        const score=Math.round((correct/qs.length)*100);
        const attemptId=`dia_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
        const compScores=Object.fromEntries(Object.entries(byComp).map(([k,v])=>[k,Math.round(v.reduce((a,b)=>a+b,0)/v.length)]));
        const statements=[env.DB.prepare(`INSERT INTO diagnostic_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,version,score,competency_scores_json) VALUES (?,?,?,?,?,?,?,?,?)`).bind(attemptId,user.sub,orgId,cohortId,assignmentId,pathway.id,'2.0',score,JSON.stringify(compScores))];
        const evidenceIds=[];
        const scope=assignmentId||'public';
        for(const [competencyId,cScore] of Object.entries(compScores)){
          const eid=`evi_${(await sha256Hex(`diagnostic|${user.sub}|${scope}|${pathway.id}|2.0|${competencyId}`)).slice(0,28)}`; evidenceIds.push([competencyId,eid]);
          statements.push(env.DB.prepare(`
            INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id, score=excluded.score, weight=excluded.weight, evidence_json=excluded.evidence_json
          `).bind(eid,user.sub,orgId,assignmentId,pathway.id,competencyId,'diagnostic',attemptId,cScore,0.25,JSON.stringify({diagnosticVersion:'2.0',baselineOnly:true})));
        }
        await env.DB.batch(statements);
        for(const [competencyId] of evidenceIds) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:pathway.id,competencyId});
        const readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:pathway.id,curriculumVersion});
        return json({ok:true,attemptId,score,correct,total:qs.length,competencyScores:compScores,readiness,note:'Diagnostic score is baseline-only and has 0% credential weight.'},200,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "learner" && parts[2] === "skills" && parts.length === 4) {
        const user=await requireUser(request,env); const pathway=getPathway(parts[3]);
        const assignmentId=url.searchParams.get('assignmentId') ? cleanId(url.searchParams.get('assignmentId')) : null;
        let orgId=null, cohortId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=a.org_id;cohortId=a.cohort_id;}
        const orgScope=orgId||'public', assignmentScope=assignmentId||'public';
        const rows=await env.DB.prepare(`SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id WHERE cs.uid=? AND cs.org_scope=? AND cs.assignment_scope=? AND cs.pathway_id=? ORDER BY pc.weight DESC,c.name`).bind(user.sub,orgScope,assignmentScope,pathway.id).all();
        const latest=await env.DB.prepare(`SELECT * FROM readiness_snapshots WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY created_at DESC LIMIT 1`).bind(user.sub,pathway.id,assignmentScope).first();
        return json({ok:true,pathway:{id:pathway.id,title:pathway.title},assignmentId,competencies:rows.results||[],readiness:latest?{overallScore:Number(latest.overall_score),status:latest.status,baselineScore:latest.baseline_score==null?null:Number(latest.baseline_score),improvement:latest.improvement==null?null:Number(latest.improvement),evidenceCoverage:Math.round(Number(latest.evidence_coverage||0)*100),evidencePhase:latest.evidence_phase||'baseline',createdAt:latest.created_at}:null},200,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "role-labs" && parts.length === 3) {
        await requireUser(request,env); const pathway=getPathway(parts[2]);
        const rows=await env.DB.prepare(`SELECT lab_key,version,pathway_id,title,role_title,client_name,scenario_json,pass_score FROM role_lab_definitions WHERE pathway_id=? AND status='active' ORDER BY version DESC`).bind(pathway.id).all();
        return json({ok:true,labs:(rows.results||[]).map(r=>({labKey:r.lab_key,version:r.version,pathwayId:r.pathway_id,title:r.title,roleTitle:r.role_title,clientName:r.client_name,scenario:v2ParseJson(r.scenario_json,{}),passScore:Number(r.pass_score)}))},200,env);
      }

      if (request.method === "POST" && parts[0] === "enterprise" && parts[1] === "role-labs" && parts[3] === "start" && parts.length === 4) {
        const user=await requireUser(request,env); const labKey=cleanId(parts[2]); const body=await readJson(request);
        const lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(labKey).first(); if(!lab) throw new HttpError(404,'Role Lab not found');
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null; let orgId=null,cohortId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,lab.pathway_id); if(a.accessRole==='learner'&&!['published','completed'].includes(a.status)) throw new HttpError(403,'Assignment is not active'); orgId=a.org_id;cohortId=a.cohort_id;}
        const essentials=await v2ActiveCredential(env,user.sub,lab.pathway_id,'essentials');
        if(!essentials) throw new HttpError(409,'Earn the Essentials Certificate before starting the Role Lab');
        const applied=await v2ActiveCredential(env,user.sub,lab.pathway_id,'applied');
        if(!applied) throw new HttpError(409,'Earn the Applied Skills Certificate before starting the Role Lab');
        if(assignmentId){const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,lab.pathway_id,assignmentId).first(); if(!baseline) throw new HttpError(409,'Complete the assigned baseline diagnostic before starting the Role Lab');}
        const existing=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE uid=? AND lab_key=? AND lab_version=? AND COALESCE(assignment_id,'public')=? AND status IN ('in_progress','revision_required','submitted') ORDER BY started_at DESC LIMIT 1`).bind(user.sub,lab.lab_key,lab.version,assignmentId||'public').first();
        if(existing) return json({ok:true,runId:existing.id,resumed:true},200,env);
        const runId=`run_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
        await env.DB.prepare(`INSERT INTO role_lab_runs (id,uid,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status) VALUES (?,?,?,?,?,?,?,?,?)`).bind(runId,user.sub,orgId,cohortId,assignmentId,lab.pathway_id,lab.lab_key,lab.version,'in_progress').run();
        return json({ok:true,runId,resumed:false},201,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "role-lab-runs" && parts.length === 3) {
        const user=await requireUser(request,env); const runId=cleanId(parts[2]); const run=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE id=? AND uid=? LIMIT 1`).bind(runId,user.sub).first(); if(!run) throw new HttpError(404,'Role Lab run not found');
        const lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND version=?`).bind(run.lab_key,run.lab_version).first(); const state=await v2RunState(env,run);
        const completed=state.latest.map(s=>({taskId:s.task_id,attemptNo:Number(s.attempt_no),score:Number(v2ParseJson(s.score_json,{}).score||0),feedback:v2ParseJson(s.feedback_json,{})}));
        return json({ok:true,run:{id:run.id,status:run.status,pathwayId:run.pathway_id,labKey:run.lab_key,labVersion:run.lab_version,assignmentId:run.assignment_id,startedAt:run.started_at,score:run.score==null?state.overall:Number(run.score)},lab:{title:lab.title,roleTitle:lab.role_title,clientName:lab.client_name,scenario:v2ParseJson(lab.scenario_json,{}),passScore:Number(lab.pass_score)},currentTask:state.current?v2PublicLabTask(state.current):null,completed,overallScore:state.overall,complete:state.complete},200,env);
      }

      if (request.method === "POST" && parts[0] === "enterprise" && parts[1] === "role-lab-runs" && parts[3] === "submit" && parts.length === 4) {
        const user=await requireUser(request,env); const runId=cleanId(parts[2]); const run=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE id=? AND uid=? LIMIT 1`).bind(runId,user.sub).first(); if(!run) throw new HttpError(404,'Role Lab run not found'); if(run.status==='passed'||run.status==='archived') throw new HttpError(409,'Role Lab run is closed');
        const state=await v2RunState(env,run); if(!state.current) throw new HttpError(409,'No Role Lab task is currently open');
        const body=await readJson(request); const taskId=cleanId(body.taskId); if(taskId!==state.current.id) throw new HttpError(409,'Complete the current Role Lab task before moving ahead');
        const prior=await env.DB.prepare(`SELECT MAX(attempt_no) AS n FROM role_lab_submissions WHERE run_id=? AND task_id=?`).bind(runId,taskId).first(); const attemptNo=Number(prior?.n||0)+1; if(attemptNo>Number(state.current.max_attempts)) throw new HttpError(409,'Maximum attempts reached for this task');
        const response=body.response&&typeof body.response==='object'?body.response:{}; const grading=v2ParseJson(state.current.grading_json,{}); const result=v2GradeRules(grading,response); const passedTask=result.score>=Number(state.current.pass_score); const feedback={messages:result.feedback,breakdown:result.breakdown,passed:passedTask,managerNote:passedTask?'Work accepted. Continue to the next desk task.':'Revision required. Fix the issues below and resubmit before continuing.'};
        const subId=`sub_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`; await env.DB.prepare(`INSERT INTO role_lab_submissions (id,run_id,task_id,attempt_no,response_json,score_json,feedback_json) VALUES (?,?,?,?,?,?,?)`).bind(subId,runId,taskId,attemptNo,JSON.stringify(response),JSON.stringify({score:result.score,earned:result.earned,possible:result.possible}),JSON.stringify(feedback)).run();
        if(passedTask){
          const cmap=v2ParseJson(state.current.competency_map_json,{}); const statements=[]; const comps=[];
          for(const [competencyId,mapWeight] of Object.entries(cmap)){const scope=run.assignment_id||'public';const eid=`evi_${(await sha256Hex(`role_lab|${user.sub}|${scope}|${run.lab_key}|${run.lab_version}|${taskId}|${competencyId}`)).slice(0,28)}`;comps.push(competencyId);statements.push(env.DB.prepare(`
            INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              source_id=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.source_id ELSE competency_evidence.source_id END,
              score=MAX(competency_evidence.score, excluded.score),
              weight=excluded.weight,
              evidence_json=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.evidence_json ELSE competency_evidence.evidence_json END
          `).bind(eid,user.sub,run.org_id,run.assignment_id,run.pathway_id,competencyId,'role_lab',subId,result.score,Math.max(0.25,1.5*Number(mapWeight||1)),JSON.stringify({labKey:run.lab_key,taskId,attemptNo,breakdown:result.breakdown})));}
          if(statements.length) await env.DB.batch(statements); for(const competencyId of comps) await v2RecomputeCompetency(env,{uid:user.sub,orgId:run.org_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,competencyId});
        }
        const nextState=await v2RunState(env,run); let runStatus=passedTask?'in_progress':'revision_required'; let finalScore=null;
        if(nextState.complete){runStatus='passed';finalScore=nextState.overall;await env.DB.prepare(`UPDATE role_lab_runs SET status='passed',score=?,submitted_at=CURRENT_TIMESTAMP,completed_at=CURRENT_TIMESTAMP WHERE id=?`).bind(finalScore,runId).run();}
        else await env.DB.prepare(`UPDATE role_lab_runs SET status=?,revision_count=revision_count+?,submitted_at=CURRENT_TIMESTAMP WHERE id=?`).bind(runStatus,passedTask?0:1,runId).run();
        const readiness=passedTask?await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId:run.org_id,cohortId:run.cohort_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,curriculumVersion:'2.0'}):null;
        let issuedCredentials=[];
        if(nextState.complete){const pathway=getPathway(run.pathway_id);const refreshed=await v2RefreshCredentials(env,{user,pathway,orgId:run.org_id,assignmentId:run.assignment_id});issuedCredentials=refreshed.filter(x=>x.issued).map(x=>x.credential);}
        return json({ok:true,submissionId:subId,taskId,attemptNo,score:result.score,passed:passedTask,feedback,runStatus,overallScore:nextState.overall,complete:nextState.complete,readiness,issuedCredentials,nextTask:nextState.current?v2PublicLabTask(nextState.current):null},200,env);
      }
