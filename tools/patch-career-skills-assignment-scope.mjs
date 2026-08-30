import fs from 'node:fs';

function replaceOnce(path,before,after,label){
  let src=fs.readFileSync(path,'utf8');
  const at=src.indexOf(before);
  if(at<0) throw new Error(`Missing patch target: ${label}`);
  if(src.indexOf(before,at+before.length)>=0) throw new Error(`Ambiguous patch target: ${label}`);
  src=src.slice(0,at)+after+src.slice(at+before.length);
  fs.writeFileSync(path,src);
}

function replaceRegexOnce(path,re,after,label){
  let src=fs.readFileSync(path,'utf8');
  const matches=[...src.matchAll(re)];
  if(matches.length!==1) throw new Error(`${label}: expected 1 match, got ${matches.length}`);
  const m=matches[0], at=m.index;
  src=src.slice(0,at)+after+src.slice(at+m[0].length);
  fs.writeFileSync(path,src);
}

const worker='v2/worker-v2-phase1-release.js';

replaceOnce(worker,
`  return { ...row, accessRole: employer ? membership.role : 'learner' };\n}\n\nfunction v2GradeRules(grading, response) {`,
`  return { ...row, accessRole: employer ? membership.role : 'learner' };\n}\n\nasync function v2RequireCareerSkillsLearnerAssignment(env, uid, assignmentId, pathwayId) {\n  const assignment=await v2RequireAssignmentAccess(env,uid,assignmentId,pathwayId);\n  if(assignment.accessRole!=='learner') throw new HttpError(403,'Learner assignment membership required');\n  if(assignment.track!=='career_skills' || assignment.credential_target!=='career') throw new HttpError(409,'Assignment is not a Career Skills program');\n  if(assignment.status!=='published') throw new HttpError(409,'Career Skills assignment is not open for completion');\n  if(assignment.cohort_status!=='active') throw new HttpError(409,'Career Skills cohort is not active');\n  if(assignment.member_status!=='active') throw new HttpError(403,'Active cohort membership required');\n  return assignment;\n}\n\nasync function v2CareerSkillsSharedCredentialEvidence(env, uid, pathwayId) {\n  const rows=await env.DB.prepare(\`\n    SELECT credential_id,credential_level,credential_title,standard_version,issued_at\n    FROM credentials\n    WHERE uid=? AND pathway_id=? AND status='active'\n      AND credential_level IN ('foundations','essentials','applied')\n    ORDER BY datetime(issued_at) DESC, credential_id DESC\n  \`).bind(uid,pathwayId).all();\n  const byLevel=new Map();\n  for(const row of rows.results||[]){if(!byLevel.has(row.credential_level))byLevel.set(row.credential_level,row);}\n  const required=['foundations','essentials','applied'];\n  const missing=required.filter(level=>!byLevel.has(level));\n  return {eligible:missing.length===0,missing,credentials:required.filter(level=>byLevel.has(level)).map(level=>{const row=byLevel.get(level);return {credentialId:row.credential_id,level,title:row.credential_title,standardVersion:row.standard_version,issuedAt:row.issued_at};})};\n}\n\nasync function v2IssueCareerSkillsAssignmentCompletion(env,{user,pathway,assignment,capstoneScore}) {\n  if(Number(capstoneScore)<PASS_SCORE) return {issued:false,eligible:false,missing:['Passing Career Skills capstone']};\n  const shared=await v2CareerSkillsSharedCredentialEvidence(env,user.sub,pathway.id);\n  if(!shared.eligible) return {issued:false,eligible:false,missing:shared.missing.map(x=>\`Active \\${x.replace(/_/g,' ')} credential\`)};\n  const previous=await env.DB.prepare(\`SELECT * FROM program_completion_records WHERE uid=? AND assignment_id=? AND program_code='career_skills' LIMIT 1\`).bind(user.sub,assignment.id).first();\n  if(previous){\n    return {issued:false,existing:true,eligible:previous.status==='active',completion:{completionId:previous.completion_id,publicToken:previous.public_token,title:previous.completion_title,status:previous.status,issuedAt:previous.issued_at,assignmentId:previous.assignment_id,orgId:previous.org_id,pathwayId:previous.pathway_id,capstoneScore:Number(previous.capstone_score)}};\n  }\n  const year=new Date().getUTCFullYear();\n  const random=crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();\n  const completionId=\`CM-CS-\\${pathway.code}-\\${year}-\\${random}\`;\n  const publicToken=randomToken(24);\n  const holderName=holderNameFromUser(user);\n  const title=\`\\${pathway.title} Career Skills Program Completion Certificate\`;\n  const evidence={standardVersion:V2_STANDARD_VERSION,recordType:'program_completion',program:'career_skills',assignmentScoped:true,requiredVerifiedCredentials:3,verifiedCredentials:shared.credentials,capstone:{itemId:'simulation',score:Number(capstoneScore),minimum:PASS_SCORE},pathwayId:pathway.id,assignmentId:assignment.id,orgId:assignment.org_id,cohortId:assignment.cohort_id,generatedAt:new Date().toISOString()};\n  try {\n    await env.DB.batch([\n      env.DB.prepare(\`INSERT INTO program_completion_records (completion_id,public_token,uid,holder_name,pathway_id,program_code,completion_title,status,org_id,cohort_id,assignment_id,capstone_score,evidence_summary_json) VALUES (?,?,?,?,?,?,?,'active',?,?,?,?,?)\`).bind(completionId,publicToken,user.sub,holderName,pathway.id,'career_skills',title,assignment.org_id,assignment.cohort_id,assignment.id,Number(capstoneScore),JSON.stringify(evidence)),\n      enterpriseAuditStatement(env,assignment.org_id,user.sub,'program_completion.issued','program_completion',completionId,{assignmentId:assignment.id,cohortId:assignment.cohort_id,pathwayId:pathway.id,program:'career_skills',capstoneScore:Number(capstoneScore)})\n    ]);\n  } catch(error) {\n    const existing=await env.DB.prepare(\`SELECT * FROM program_completion_records WHERE uid=? AND assignment_id=? AND program_code='career_skills' LIMIT 1\`).bind(user.sub,assignment.id).first();\n    if(existing) return {issued:false,existing:true,eligible:existing.status==='active',completion:{completionId:existing.completion_id,publicToken:existing.public_token,title:existing.completion_title,status:existing.status,issuedAt:existing.issued_at,assignmentId:existing.assignment_id,orgId:existing.org_id,pathwayId:existing.pathway_id,capstoneScore:Number(existing.capstone_score)}};\n    throw error;\n  }\n  return {issued:true,eligible:true,completion:{completionId,publicToken,title,status:'active',issuedAt:new Date().toISOString(),assignmentId:assignment.id,orgId:assignment.org_id,pathwayId:pathway.id,capstoneScore:Number(capstoneScore)}};\n}\n\nfunction v2GradeRules(grading, response) {`,
'Career Skills server scope helpers');

replaceOnce(worker,
`        const assessment = buildAssessment(pathway, itemId);\n\n        return json(`,
`        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;\n        if(assignmentId){\n          if(itemId!=='simulation') throw new HttpError(400,'Assignment scope is supported only for the Career Skills capstone');\n          await v2RequireCareerSkillsLearnerAssignment(env,user.sub,assignmentId,pathway.id);\n          const shared=await v2CareerSkillsSharedCredentialEvidence(env,user.sub,pathway.id);\n          if(!shared.eligible) throw new HttpError(409,\`Earn the assigned Career Skills prerequisites first: \\${shared.missing.join(', ')}\`);\n        }\n\n        const assessment = buildAssessment(pathway, itemId);\n\n        return json(`,
'assigned official capstone GET validation');

replaceOnce(worker,
`        const pathway = getPathway(body.pathwayId);\n        const itemId = validateItem(body.itemId);\n\n        await enforcePrerequisites(\n          env,\n          user.sub,\n          pathway.id,\n          itemId\n        );`,
`        const pathway = getPathway(body.pathwayId);\n        const itemId = validateItem(body.itemId);\n        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;\n        let careerSkillsAssignment=null;\n        if(assignmentId){\n          if(itemId!=='simulation') throw new HttpError(400,'Assignment scope is supported only for the Career Skills capstone');\n          careerSkillsAssignment=await v2RequireCareerSkillsLearnerAssignment(env,user.sub,assignmentId,pathway.id);\n          const shared=await v2CareerSkillsSharedCredentialEvidence(env,user.sub,pathway.id);\n          if(!shared.eligible) throw new HttpError(409,\`Earn the assigned Career Skills prerequisites first: \\${shared.missing.join(', ')}\`);\n        } else {\n          await enforcePrerequisites(\n            env,\n            user.sub,\n            pathway.id,\n            itemId\n          );\n        }`,
'assigned official capstone POST validation');

replaceOnce(worker,
`        let issuedCredentials = [];\n\n        if (passed) {\n          issuedCredentials = await issueEligibleCredentials(\n            env,\n            user,\n            pathway\n          );\n        }`,
`        let issuedCredentials = [];\n        let assignmentCompletion = null;\n\n        if (passed) {\n          issuedCredentials = await issueEligibleCredentials(\n            env,\n            user,\n            pathway\n          );\n          if(careerSkillsAssignment){\n            const scoped=await v2IssueCareerSkillsAssignmentCompletion(env,{user,pathway,assignment:careerSkillsAssignment,capstoneScore:result.score});\n            if(!scoped.eligible) throw new HttpError(409,\`Career Skills assignment completion requirements are incomplete: \\${(scoped.missing||[]).join(', ')}\`);\n            assignmentCompletion=scoped.completion||null;\n          }\n        }`,
'assigned completion issuance');

replaceOnce(worker,
`            issuedCredentials,\n            nextEligibleCertificates:`,
`            issuedCredentials,\n            assignmentCompletion,\n            nextEligibleCertificates:`,
'assigned completion response');

replaceOnce(worker,
`            const targetCredential=a.credential_target==='career'\n              ? await env.DB.prepare(\`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND pathway_id=? AND credential_level='career' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(l.uid,a.pathway_id).first()\n              : await env.DB.prepare(\`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' ORDER BY issued_at DESC LIMIT 1\`).bind(l.uid,a.id).first();`,
`            const targetCredential=a.credential_target==='career'\n              ? await env.DB.prepare(\`SELECT completion_id AS credential_id,status,issued_at,capstone_score FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(l.uid,orgId,a.id,a.pathway_id).first()\n              : await env.DB.prepare(\`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' ORDER BY issued_at DESC LIMIT 1\`).bind(l.uid,a.id).first();`,
'employer report assignment-scoped Career Skills completion');

replaceOnce(worker,
`  const completionCredential=async(uid,a)=>{\n    if(a.credential_target==='career'){\n      return env.DB.prepare(\`SELECT credential_id FROM credentials WHERE uid=? AND pathway_id=? AND credential_level='career' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.pathway_id).first();\n    }\n    return env.DB.prepare(\`SELECT credential_id FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.id).first();\n  };`,
`  const completionCredential=async(uid,a)=>{\n    if(a.credential_target==='career'){\n      return env.DB.prepare(\`SELECT completion_id AS credential_id FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.org_id,a.id,a.pathway_id).first();\n    }\n    return env.DB.prepare(\`SELECT credential_id FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' AND status='active' ORDER BY issued_at DESC LIMIT 1\`).bind(uid,a.id).first();\n  };`,
'notification assignment-scoped completion lookup');

replaceOnce(worker,
`const assignments=(await env.DB.prepare(\`SELECT a.id,a.cohort_id,a.pathway_id,a.track,a.credential_target,a.due_at,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status='published'\`).bind(m.org_id).all()).results||[];`,
`const assignments=(await env.DB.prepare(\`SELECT a.id,a.org_id,a.cohort_id,a.pathway_id,a.track,a.credential_target,a.due_at,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status='published'\`).bind(m.org_id).all()).results||[];`,
'notification employer assignment org scope');

replaceOnce(worker,
`        const finalAssessment=await env.DB.prepare(\`SELECT va.assessment_key,va.assessment_version,va.score,va.passed,va.submitted_at FROM v2_assessment_attempts va LEFT JOIN v2_assessment_definitions vd ON vd.assessment_key=va.assessment_key AND vd.version=va.assessment_version WHERE va.uid=? AND va.pathway_id=? AND COALESCE(va.assignment_id,'public')=? AND (vd.stage='final' OR va.assessment_key LIKE '%professional-final') ORDER BY va.score DESC,va.submitted_at DESC LIMIT 1\`).bind(user.sub,pathway.id,skillsScope).first();\n        return json({ok:true,generatedAt:new Date().toISOString(),pathway:{id:pathway.id,title:pathway.title,role:pathway.role},assignment:`,
`        const finalAssessment=await env.DB.prepare(\`SELECT va.assessment_key,va.assessment_version,va.score,va.passed,va.submitted_at FROM v2_assessment_attempts va LEFT JOIN v2_assessment_definitions vd ON vd.assessment_key=va.assessment_key AND vd.version=va.assessment_version WHERE va.uid=? AND va.pathway_id=? AND COALESCE(va.assignment_id,'public')=? AND (vd.stage='final' OR va.assessment_key LIKE '%professional-final') ORDER BY va.score DESC,va.submitted_at DESC LIMIT 1\`).bind(user.sub,pathway.id,skillsScope).first();\n        const programCompletion=assignmentId&&assignment?.track==='career_skills'?await env.DB.prepare(\`SELECT completion_id,public_token,completion_title,status,issued_at,capstone_score,assignment_id FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' ORDER BY issued_at DESC LIMIT 1\`).bind(user.sub,orgId,assignmentId,pathway.id).first():null;\n        return json({ok:true,generatedAt:new Date().toISOString(),pathway:{id:pathway.id,title:pathway.title,role:pathway.role},assignment:`,
'learner report scoped completion lookup');

replaceOnce(worker,
`finalAssessment:finalAssessment?{key:finalAssessment.assessment_key,version:finalAssessment.assessment_version,score:Number(finalAssessment.score),passed:Number(finalAssessment.passed)===1,submittedAt:finalAssessment.submitted_at}:null,credentials:credentials.map`,
`finalAssessment:finalAssessment?{key:finalAssessment.assessment_key,version:finalAssessment.assessment_version,score:Number(finalAssessment.score),passed:Number(finalAssessment.passed)===1,submittedAt:finalAssessment.submitted_at}:null,programCompletion:programCompletion?{completionId:programCompletion.completion_id,publicToken:programCompletion.public_token,title:programCompletion.completion_title,status:programCompletion.status,issuedAt:programCompletion.issued_at,capstoneScore:Number(programCompletion.capstone_score),assignmentId:programCompletion.assignment_id}:null,credentials:credentials.map`,
'learner report scoped completion response');

replaceOnce(worker,
`          env.DB.prepare(\`DELETE FROM role_lab_runs WHERE uid=?\`).bind(user.sub),\n          env.DB.prepare(\`DELETE FROM credentials WHERE uid=?\`).bind(user.sub),`,
`          env.DB.prepare(\`DELETE FROM role_lab_runs WHERE uid=?\`).bind(user.sub),\n          env.DB.prepare(\`DELETE FROM program_completion_records WHERE uid=?\`).bind(user.sub),\n          env.DB.prepare(\`DELETE FROM credentials WHERE uid=?\`).bind(user.sub),`,
'account deletion completion ledger cleanup');

replaceOnce(worker,
`        const [memberships,cohorts,credentials,diagnostics,scores,readiness,labs,assessments]=await Promise.all([`,
`        const [memberships,cohorts,credentials,programCompletions,diagnostics,scores,readiness,labs,assessments]=await Promise.all([`,
'personal export completion destructuring');
replaceOnce(worker,
`          env.DB.prepare(\`SELECT credential_id,pathway_id,credential_level,credential_title,status,standard_version,issued_at,revoked_at,org_id,assignment_id FROM credentials WHERE uid=? ORDER BY issued_at DESC\`).bind(user.sub).all(),\n          env.DB.prepare(\`SELECT id,org_id,cohort_id,assignment_id,pathway_id,version,score,submitted_at FROM diagnostic_attempts`,
`          env.DB.prepare(\`SELECT credential_id,pathway_id,credential_level,credential_title,status,standard_version,issued_at,revoked_at,org_id,assignment_id FROM credentials WHERE uid=? ORDER BY issued_at DESC\`).bind(user.sub).all(),\n          env.DB.prepare(\`SELECT completion_id,pathway_id,program_code,completion_title,status,org_id,cohort_id,assignment_id,capstone_score,issued_at,revoked_at FROM program_completion_records WHERE uid=? ORDER BY issued_at DESC\`).bind(user.sub).all(),\n          env.DB.prepare(\`SELECT id,org_id,cohort_id,assignment_id,pathway_id,version,score,submitted_at FROM diagnostic_attempts`,
'personal export completion query');
replaceOnce(worker,
`enterprise:{memberships:memberships.results||[],cohorts:cohorts.results||[],credentials:credentials.results||[],diagnostics:diagnostics.results||[]`,
`enterprise:{memberships:memberships.results||[],cohorts:cohorts.results||[],credentials:credentials.results||[],programCompletions:programCompletions.results||[],diagnostics:diagnostics.results||[]`,
'personal export completion payload');

replaceOnce('enterprise-v2.js',
`    const career=activeLevel('career');`,
`    const career=report.assignment?.track==='career_skills' ? (report.programCompletion?.status==='active'?report.programCompletion:null) : activeLevel('career');`,
'assigned capstone scoped state');
replaceOnce('enterprise-v2.js',
`    if(stage.id==='career-capstone') return career?{label:'Complete · Career Certificate earned',tone:'complete'}:{label:applied?'Ready · Open capstone':'Locked · Applied Skills first',tone:applied?'ready':'locked'};`,
`    if(stage.id==='career-capstone') return career?{label:'Complete · Career Skills assignment verified',tone:'complete'}:{label:applied?'Ready · Open capstone':'Locked · Applied Skills first',tone:applied?'ready':'locked'};`,
'assigned capstone scoped label');
replaceOnce('enterprise-v2.js',
`      const gates=[levels.has('foundations'),levels.has('essentials'),levels.has('applied'),levels.has('career')];\n      const complete=gates.filter(Boolean).length,total=gates.length;\n      return {complete,total,pct:Math.round((complete/total)*100),ready:levels.has('career')};`,
`      const scopedCompletion=report.programCompletion?.status==='active';\n      const gates=[levels.has('foundations'),levels.has('essentials'),levels.has('applied'),scopedCompletion];\n      const complete=gates.filter(Boolean).length,total=gates.length;\n      return {complete,total,pct:Math.round((complete/total)*100),ready:scopedCompletion};`,
'assigned progress scoped completion');
replaceOnce('enterprise-v2.js',
`<a class=\"btn btn-gold\" href=\"#/simulation/\${encodeURIComponent(publicPathId(a.pathwayId))}\">5 · Career Skills Capstone</a>`,
`<a class=\"btn btn-gold\" href=\"#/official-simulation/\${encodeURIComponent(publicPathId(a.pathwayId))}?assignment=\${encodeURIComponent(a.id)}\">5 · Career Skills Capstone</a>`,
'assigned Career Skills authoritative capstone link');

replaceOnce('capital-mastery-live.js',
`  function hashParts() {\n    return (location.hash || '#/').replace(/^#\\/?/,'').split('?')[0].split('/').filter(Boolean);\n  }`,
`  function hashParts() {\n    return (location.hash || '#/').replace(/^#\\/?/,'').split('?')[0].split('/').filter(Boolean);\n  }\n\n  function hashQuery() {\n    const query=(location.hash||'').split('?')[1]||'';\n    return new URLSearchParams(query);\n  }`,
'official assessment assignment query parser');

replaceOnce('capital-mastery-live.js',
`  function bindOfficialAssessmentSubmit(data, pathwayId, itemId) {\n    document.getElementById('cm-official-form')?.addEventListener('submit', async event => {`,
`  function bindOfficialAssessmentSubmit(data, pathwayId, itemId) {\n    document.getElementById('cm-official-form')?.addEventListener('submit', async event => {\n      const assignmentId=hashQuery().get('assignment')||'';`,
'official assessment assignment submit context');
replaceOnce('capital-mastery-live.js',
`body:JSON.stringify({ pathwayId:apiPathway(pathwayId), itemId, answers, writing })`,
`body:JSON.stringify({ pathwayId:apiPathway(pathwayId), itemId, answers, writing, assignmentId:assignmentId||null })`,
'official assessment assignment submit body');
replaceOnce('capital-mastery-live.js',
`        renderResult(pathwayId, itemId, result);`,
`        renderResult(pathwayId, itemId, result, assignmentId);`,
'official assessment scoped result render');
replaceOnce('capital-mastery-live.js',
`      const data = await apiFetch(\`/assessment/\${encodeURIComponent(apiPathway(pathwayId))}/\${encodeURIComponent(itemId)}\`);`,
`      const assignmentId=hashQuery().get('assignment')||'';\n      const query=assignmentId?\`?assignmentId=\${encodeURIComponent(assignmentId)}\`:'';\n      const data = await apiFetch(\`/assessment/\${encodeURIComponent(apiPathway(pathwayId))}/\${encodeURIComponent(itemId)}\${query}\`);`,
'official assessment assignment GET context');
replaceOnce('capital-mastery-live.js',
`  function nextHref(pathwayId, itemId, passed) {`,
`  function nextHref(pathwayId, itemId, passed, assignmentId='') {`,
'official result next route signature');
replaceOnce('capital-mastery-live.js',
`      if (itemId === 'simulation') return \`#/official-simulation/\${pathwayId}\`;`,
`      if (itemId === 'simulation') return \`#/official-simulation/\${pathwayId}\${assignmentId?\`?assignment=\${encodeURIComponent(assignmentId)}\`:''}\`;`,
'assigned capstone retry context');
replaceOnce('capital-mastery-live.js',
`    if (itemId === 'simulation') return \`#/final/\${pathwayId}\`;`,
`    if (itemId === 'simulation') return assignmentId?\`#/assigned/\${encodeURIComponent(assignmentId)}\`:\`#/final/\${pathwayId}\`;`,
'assigned capstone completion return');
replaceOnce('capital-mastery-live.js',
`  function renderResult(pathwayId, itemId, result) {`,
`  function renderResult(pathwayId, itemId, result, assignmentId='') {`,
'official result scoped signature');
replaceOnce('capital-mastery-live.js',
`href=\"\${nextHref(pathwayId, itemId, result.passed)}\"`,
`href=\"\${nextHref(pathwayId, itemId, result.passed, assignmentId)}\"`,
'official result scoped next link');

replaceOnce('tests/account-deletion-audit.mjs',
`'role_lab_runs','credentials','assessment_attempts'`,
`'role_lab_runs','program_completion_records','credentials','assessment_attempts'`,
'account deletion regression completion ledger');

const scopeAudit=`import fs from 'node:fs';\nimport os from 'node:os';\nimport path from 'node:path';\nimport {spawnSync} from 'node:child_process';\nconst worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');\nconst enterprise=fs.readFileSync('enterprise-v2.js','utf8');\nconst live=fs.readFileSync('capital-mastery-live.js','utf8');\nconst must=(v,m)=>{if(!v)throw new Error(m);};\n\nmust(worker.includes(\"assignment.accessRole!=='learner'\"),'Completion issuance must require learner assignment access');\nmust(worker.includes(\"assignment.track!=='career_skills' || assignment.credential_target!=='career'\"),'Completion issuance must enforce Career Skills track/target');\nmust(worker.includes(\"assignment.status!=='published'\"),'Completion issuance must require a published assignment');\nmust(worker.includes(\"assignment.cohort_status!=='active'\"),'Completion issuance must require an active cohort');\nmust(worker.includes(\"credential_level IN ('foundations','essentials','applied')\"),'Completion issuance must require the three shared verified credentials');\nmust(worker.includes(\"FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=?\"),'Employer completion lookup must bind uid + tenant + assignment + pathway');\nmust(!worker.includes(\"SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND pathway_id=? AND credential_level='career' AND status='active'\"),'Employer report must not accept an unrelated public Career certificate');\nmust(enterprise.includes('#/official-simulation/'),'Assigned Career Skills must link directly to the authoritative capstone');\nmust(enterprise.includes('?assignment=${encodeURIComponent(a.id)}'),'Assigned capstone route must preserve assignment identity');\nmust(enterprise.includes(\"const scopedCompletion=report.programCompletion?.status==='active'\"),'Assigned UI completion must use scoped program completion');\nmust(live.includes('assignmentId:assignmentId||null'),'Official capstone submit must send assignment context');\nmust(live.includes('assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`'),'Assigned Career Skills must return to its assignment after capstone instead of Professional Final');\n\nconst migration=fs.readFileSync('migrations/017_phase2_program_completion_records.sql','utf8');\nconst temp=fs.mkdtempSync(path.join(os.tmpdir(),'cm-assignment-scope-'));\nconst migrationPath=path.join(temp,'migration.sql');fs.writeFileSync(migrationPath,migration);\nconst py=String.raw\`\nimport sqlite3,sys\nconn=sqlite3.connect(':memory:'); conn.execute('PRAGMA foreign_keys=ON')\nconn.executescript('''\nCREATE TABLE organizations(id TEXT PRIMARY KEY);\nCREATE TABLE cohorts(id TEXT PRIMARY KEY,org_id TEXT NOT NULL,FOREIGN KEY(org_id) REFERENCES organizations(id));\nCREATE TABLE program_assignments(id TEXT PRIMARY KEY,org_id TEXT NOT NULL,cohort_id TEXT NOT NULL,pathway_id TEXT NOT NULL,FOREIGN KEY(org_id) REFERENCES organizations(id),FOREIGN KEY(cohort_id) REFERENCES cohorts(id));\n''')\nconn.executescript(open(sys.argv[1],encoding='utf8').read())\nfor org in ('org_a','org_b'): conn.execute('INSERT INTO organizations(id) VALUES(?)',(org,))\nconn.execute(\"INSERT INTO cohorts(id,org_id) VALUES('coh_a','org_a')\"); conn.execute(\"INSERT INTO cohorts(id,org_id) VALUES('coh_b','org_b')\")\nconn.execute(\"INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id) VALUES('asn_a','org_a','coh_a','private-equity')\")\nconn.execute(\"INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id) VALUES('asn_b','org_b','coh_b','private-equity')\")\nconn.execute(\"INSERT INTO program_completion_records(completion_id,public_token,uid,holder_name,pathway_id,program_code,completion_title,status,org_id,cohort_id,assignment_id,capstone_score) VALUES('cmp_b','tok_b','learner','Learner','private-equity','career_skills','PE Career Skills','active','org_b','coh_b','asn_b',91)\")\nq=\"SELECT completion_id FROM program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active'\"\nassert conn.execute(q,('learner','org_a','asn_a','private-equity')).fetchone() is None\nassert conn.execute(q,('learner','org_b','asn_b','private-equity')).fetchone()==('cmp_b',)\nassert conn.execute('PRAGMA foreign_key_check').fetchall()==[]\nprint('SQLITE ASSIGNMENT SCOPE ATTACK FIXTURE PASS')\n\`;\nconst r=spawnSync('python3',['-c',py,migrationPath],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stdout+'\\n'+r.stderr);process.stdout.write(r.stdout);\nconsole.log('CAREER SKILLS ASSIGNMENT SCOPE AUDIT PASS: public/other-assignment evidence cannot satisfy a scoped employer assignment');\n`;
fs.writeFileSync('tests/career-skills-assignment-scope-audit.mjs',scopeAudit);

console.log('Patched end-to-end Career Skills assignment scoping and added attack regression.');
