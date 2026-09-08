import './patch-functional-reliability.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const write = (rel, value) => fs.writeFileSync(path.join(ROOT, rel), value);

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Patch anchor is ambiguous: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function patchDiagnostic(rel) {
  let source = read(rel);
  if (source.includes('diagnosticSaved:true')) return;
  const before = `        await env.DB.batch(statements);\n        for(const [competencyId] of evidenceIds) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:pathway.id,competencyId});\n        const readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:pathway.id,curriculumVersion});\n        return json({ok:true,attemptId,score,correct,total:qs.length,competencyScores:compScores,readiness,note:'Diagnostic score is baseline-only and has 0% credential weight.'},200,env);`;
  const after = `        await env.DB.batch(statements);\n        let readiness=null;\n        let enrichmentPending=false;\n        let enrichmentWarning=null;\n        let lastEnrichmentError=null;\n        for(const delay of [0,250,900,1800]){\n          if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n          try{\n            for(const [competencyId] of evidenceIds) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:pathway.id,competencyId});\n            readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:pathway.id,curriculumVersion});\n            lastEnrichmentError=null;\n            break;\n          }catch(error){ lastEnrichmentError=error; }\n        }\n        if(lastEnrichmentError){\n          enrichmentPending=true;\n          enrichmentWarning='Your baseline diagnostic is saved, but readiness calculations could not finish updating yet.';\n        }\n        return json({ok:true,diagnosticSaved:true,pathwayId:pathway.id,assignmentId,attemptId,score,correct,total:qs.length,competencyScores:compScores,readiness,enrichmentPending,enrichmentWarning,note:'Diagnostic score is baseline-only and has 0% credential weight.'},200,env);`;
  source = replaceOnce(source, before, after, `${rel} diagnostic post-processing`);
  write(rel, source);
}

function patchRoleLab(rel) {
  let source = read(rel);
  if (source.includes('submissionSaved:true')) return;
  const startText = `        const subId=\`sub_\${crypto.randomUUID().replace(/-/g,'').slice(0,20)}\`; await env.DB.prepare(\`INSERT INTO role_lab_submissions (id,run_id,task_id,attempt_no,response_json,score_json,feedback_json) VALUES (?,?,?,?,?,?,?)\`).bind(subId,runId,taskId,attemptNo,JSON.stringify(response),JSON.stringify({score:result.score,earned:result.earned,possible:result.possible}),JSON.stringify(feedback)).run();`;
  const endText = `        return json({ok:true,submissionId:subId,taskId,attemptNo,score:result.score,passed:passedTask,feedback,runStatus,overallScore:nextState.overall,complete:nextState.complete,readiness,issuedCredentials,nextTask:nextState.current?v2PublicLabTask(nextState.current):null},200,env);`;
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end < 0) throw new Error(`Could not locate Role Lab persistence block in ${rel}`);
  const afterEnd = end + endText.length;
  const replacement = `        const subId=\`sub_\${crypto.randomUUID().replace(/-/g,'').slice(0,20)}\`;\n        await env.DB.prepare(\`INSERT INTO role_lab_submissions (id,run_id,task_id,attempt_no,response_json,score_json,feedback_json) VALUES (?,?,?,?,?,?,?)\`).bind(subId,runId,taskId,attemptNo,JSON.stringify(response),JSON.stringify({score:result.score,earned:result.earned,possible:result.possible}),JSON.stringify(feedback)).run();\n        let postProcessingPending=false;\n        const postProcessingWarnings=[];\n        let evidenceReady=!passedTask;\n        if(passedTask){\n          const cmap=v2ParseJson(state.current.competency_map_json,{});\n          const statements=[];\n          const comps=[];\n          for(const [competencyId,mapWeight] of Object.entries(cmap)){\n            const scope=run.assignment_id||'public';\n            const eid=\`evi_\${(await sha256Hex(\`role_lab|\${user.sub}|\${scope}|\${run.lab_key}|\${run.lab_version}|\${taskId}|\${competencyId}\`)).slice(0,28)}\`;\n            comps.push(competencyId);\n            statements.push(env.DB.prepare(\`\n              INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)\n              ON CONFLICT(id) DO UPDATE SET\n                source_id=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.source_id ELSE competency_evidence.source_id END,\n                score=MAX(competency_evidence.score, excluded.score),\n                weight=excluded.weight,\n                evidence_json=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.evidence_json ELSE competency_evidence.evidence_json END\n            \`).bind(eid,user.sub,run.org_id,run.assignment_id,run.pathway_id,competencyId,'role_lab',subId,result.score,Math.max(0.25,1.5*Number(mapWeight||1)),JSON.stringify({labKey:run.lab_key,taskId,attemptNo,breakdown:result.breakdown})));\n          }\n          let lastEvidenceError=null;\n          for(const delay of [0,250,900,1800]){\n            if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n            try{\n              if(statements.length) await env.DB.batch(statements);\n              for(const competencyId of comps) await v2RecomputeCompetency(env,{uid:user.sub,orgId:run.org_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,competencyId});\n              lastEvidenceError=null;\n              break;\n            }catch(error){ lastEvidenceError=error; }\n          }\n          evidenceReady=!lastEvidenceError;\n          if(lastEvidenceError){\n            postProcessingPending=true;\n            postProcessingWarnings.push('Your Role Lab submission is saved, but competency evidence is still updating.');\n          }\n        }\n\n        let nextState=null;\n        let lastStateError=null;\n        for(const delay of [0,250,900,1800]){\n          if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n          try{ nextState=await v2RunState(env,run); lastStateError=null; break; }\n          catch(error){ lastStateError=error; }\n        }\n        if(lastStateError || !nextState){\n          postProcessingPending=true;\n          postProcessingWarnings.push('Your Role Lab submission is saved, but the next-task state could not finish updating yet.');\n          return json({ok:true,submissionSaved:true,submissionId:subId,taskId,attemptNo,score:result.score,passed:passedTask,feedback,runStatus:'processing',overallScore:null,complete:false,readiness:null,issuedCredentials:[],nextTask:null,postProcessingPending,postProcessingWarnings},200,env);\n        }\n\n        let runStatus=passedTask?'in_progress':'revision_required';\n        let finalScore=null;\n        if(nextState.complete){runStatus='passed';finalScore=nextState.overall;}\n        let runStateSaved=false;\n        let lastRunUpdateError=null;\n        for(const delay of [0,250,900,1800]){\n          if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n          try{\n            if(nextState.complete){\n              await env.DB.prepare(\`UPDATE role_lab_runs SET status='passed',score=?,submitted_at=CURRENT_TIMESTAMP,completed_at=CURRENT_TIMESTAMP WHERE id=?\`).bind(finalScore,runId).run();\n            }else{\n              await env.DB.prepare(\`UPDATE role_lab_runs SET status=?,revision_count=revision_count+?,submitted_at=CURRENT_TIMESTAMP WHERE id=?\`).bind(runStatus,passedTask?0:1,runId).run();\n            }\n            runStateSaved=true;\n            lastRunUpdateError=null;\n            break;\n          }catch(error){ lastRunUpdateError=error; }\n        }\n        if(lastRunUpdateError){\n          postProcessingPending=true;\n          postProcessingWarnings.push('Your Role Lab submission is saved, but the run summary is still updating.');\n        }\n\n        let readiness=null;\n        if(passedTask && evidenceReady){\n          let lastReadinessError=null;\n          for(const delay of [0,250,900,1800]){\n            if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n            try{\n              readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId:run.org_id,cohortId:run.cohort_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,curriculumVersion:'2.0'});\n              lastReadinessError=null;\n              break;\n            }catch(error){ lastReadinessError=error; }\n          }\n          if(lastReadinessError){\n            postProcessingPending=true;\n            postProcessingWarnings.push('Your Role Lab submission is saved, but readiness calculations are still updating.');\n          }\n        }\n\n        let issuedCredentials=[];\n        if(nextState.complete && evidenceReady && runStateSaved){\n          const pathway=getPathway(run.pathway_id);\n          let refreshed=[];\n          let lastCredentialError=null;\n          for(const delay of [0,250,900,1800]){\n            if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n            try{ refreshed=await v2RefreshCredentials(env,{user,pathway,orgId:run.org_id,assignmentId:run.assignment_id}); lastCredentialError=null; break; }\n            catch(error){ lastCredentialError=error; }\n          }\n          if(lastCredentialError){\n            postProcessingPending=true;\n            postProcessingWarnings.push('Your Role Lab completion is saved, but credential issuance is still updating.');\n          }else{\n            issuedCredentials=refreshed.filter(x=>x.issued).map(x=>x.credential);\n          }\n        }else if(nextState.complete && (!evidenceReady || !runStateSaved)){\n          postProcessingPending=true;\n          postProcessingWarnings.push('Credential issuance is waiting for the saved Role Lab evidence to finish processing.');\n        }\n\n        return json({ok:true,submissionSaved:true,submissionId:subId,taskId,attemptNo,score:result.score,passed:passedTask,feedback,runStatus,overallScore:nextState.overall,complete:nextState.complete,readiness,issuedCredentials,nextTask:nextState.current?v2PublicLabTask(nextState.current):null,postProcessingPending,postProcessingWarnings},200,env);`;
  source = source.slice(0, start) + replacement + source.slice(afterEnd);
  write(rel, source);
}

function patchLocalSaveFailure() {
  const rel='app.js';
  let source=read(rel);
  const before=`  function saveState(){ ensureActiveState(); const key=activeStateKey(); stateSourceKey=key; localStorage.setItem(key, JSON.stringify(state)); }`;
  if(source.includes(before)){
    const after=`  function saveState(){ ensureActiveState(); const key=activeStateKey(); stateSourceKey=key; try{ localStorage.setItem(key, JSON.stringify(state)); return true; }catch(error){ window.CM_RELIABILITY?.report?.('browser-storage','Capital Mastery could not save your latest progress in this browser.',{severity:'error',detail:String(error?.message||error)}); throw new Error('Your latest progress could not be saved on this device. Free browser storage or enable site storage, then retry.'); } }`;
    source=replaceOnce(source,before,after,'app local save failure');
  }
  write(rel,source);
}

function patchEnterprisePendingUi() {
  const rel='enterprise-v2.js';
  let source=read(rel);
  if(!source.includes('data-cm-diagnostic-pending')){
    source=source.replace(
      `<div class=\"eyebrow\">DIAGNOSTIC COMPLETE</div><h1>Your starting point is recorded.</h1><p>You answered`,
      `<div class=\"eyebrow\">DIAGNOSTIC COMPLETE</div><h1>\${result.enrichmentPending?'Baseline saved. Readiness is still updating.':'Your starting point is recorded.'}</h1>\${result.enrichmentPending?\`<div class=\"cmv2-warning-soft\" data-cm-diagnostic-pending><strong>Your score is saved.</strong><br>\${esc(result.enrichmentWarning||'Readiness calculations are still updating. Do not resubmit the diagnostic.')}</div>\`:''}<p>You answered`
    );
  }
  if(!source.includes('data-cm-assessment-pending')){
    source=source.replace(
      `<div class=\"eyebrow\">SERVER-GRADED RESULT</div><h1>\${result.passed?'Evidence recorded and attempt closed.':'Review and try again.'}</h1>`,
      `<div class=\"eyebrow\">SERVER-GRADED RESULT</div><h1>\${result.evidenceRefreshPending||result.credentialRefreshPending?'Assessment saved. Post-processing is still updating.':result.passed?'Evidence recorded and attempt closed.':'Review and try again.'}</h1>\${result.evidenceRefreshPending||result.credentialRefreshPending?\`<div class=\"cmv2-warning-soft\" data-cm-assessment-pending><strong>Your assessment score is permanently saved.</strong><br>\${esc(result.evidenceRefreshWarning||result.credentialRefreshWarning||'Readiness or credential processing is still updating. Do not resubmit the assessment.')}</div>\`:''}`
    );
  }
  if(!source.includes('data-cm-rolelab-pending')){
    source=source.replace(
      `<p>\${esc(result.feedback?.managerNote||'')}</p>\${(result.feedback?.messages||[]).length?`,
      `<p>\${esc(result.feedback?.managerNote||'')}</p>\${result.postProcessingPending?\`<div class=\"cmv2-warning-soft\" data-cm-rolelab-pending><strong>Your submission is saved.</strong><br>\${esc((result.postProcessingWarnings||[]).join(' ')||'Readiness or credential processing is still updating. Do not submit the same work again.')}</div>\`:''}\${(result.feedback?.messages||[]).length?`
    );
  }
  write(rel,source);
}

function patchReliabilityInspector() {
  const rel='functional-reliability.js';
  let source=read(rel);
  if(source.includes('inspectOtherDurableWrites')) return;
  const anchor=`  function installFetchGuard() {`;
  const extra=`  function inspectOtherDurableWrites(url, response) {\n    if (!response.ok) return;\n    response.clone().json().then(data => {\n      if (/\\/enterprise\\/diagnostic\\/submit(?:$|\\?)/.test(url)) {\n        if (data?.enrichmentPending === true) {\n          report('diagnostic-enrichment', safeText(data.enrichmentWarning, 'Your baseline is saved, but readiness calculations are still updating.'), { severity:'error', detail:'Do not resubmit the diagnostic. Your saved baseline remains authoritative.' });\n        } else clear('diagnostic-enrichment');\n      }\n      if (/\\/enterprise\\/role-lab-runs\\/[^/]+\\/submit(?:$|\\?)/.test(url)) {\n        if (data?.postProcessingPending === true) {\n          report('rolelab-enrichment', safeText((data.postProcessingWarnings || []).join(' '), 'Your Role Lab submission is saved, but post-processing is still updating.'), { severity:'error', detail:'Do not submit the same work again. Reopen the saved run to continue once processing recovers.' });\n        } else clear('rolelab-enrichment');\n      }\n    }).catch(() => {});\n  }\n\n`;
  source=replaceOnce(source,anchor,extra+anchor,'reliability durable-write inspector');
  source=replaceOnce(source,`        inspectAssessmentSubmit(url, response, input, init);\n        return response;`,`        inspectAssessmentSubmit(url, response, input, init);\n        inspectOtherDurableWrites(url, response);\n        return response;`,'reliability fetch inspection');
  write(rel,source);
}

patchDiagnostic('v2/assessment-lab-routes.js');
patchDiagnostic('v2/worker-v2-phase1-release.js');
patchRoleLab('v2/assessment-lab-routes.js');
patchRoleLab('v2/worker-v2-phase1-release.js');
patchLocalSaveFailure();
patchEnterprisePendingUi();
patchReliabilityInspector();

console.log('Extended diagnostic, Role Lab and local-save reliability patches applied.');
