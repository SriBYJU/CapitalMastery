import fs from 'node:fs';

const APP='app.js';
const LIVE='capital-mastery-live.js';

function read(path){return fs.readFileSync(path,'utf8');}
function write(path,text){fs.writeFileSync(path,text);}
function must(value,message){if(!value)throw new Error(message);}
function replaceOnce(text,before,after,label){must(text.includes(before),`Missing patch anchor: ${label}`);const next=text.replace(before,after);must(next!==text,`Patch made no change: ${label}`);return next;}

let app=read(APP);

app=replaceOnce(app,
`  function learnPage(c,n){\n`,
`  function assessmentBestScore(c,n,final=false){\n    const cs=getCareerState(c.id);\n    if(final) return Number(cs.finalScore||0);\n    if(n===5) return Number(cs.simulationKnowledge||0);\n    return Number(cs.quizScores?.[n]||0);\n  }\n  function assessmentContinuePath(c,n,final=false){\n    if(final) return \`achievement/\${c.id}/career\`;\n    if(n===5) return \`official-simulation/\${c.id}\`;\n    if(n===2) return \`achievement/\${c.id}/foundations\`;\n    if(n===4) return \`achievement/\${c.id}/applied\`;\n    return \`learn/\${c.id}/\${Math.min(5,n+1)}\`;\n  }\n  function assessmentRetryPath(c,n,final=false){\n    const base=final?\`final/\${c.id}\`:\`quiz/\${c.id}/\${n}\`;\n    return \`\${base}?retake=1&attempt=\${Date.now()}\`;\n  }\n  function renderPassedAssessmentReview(c,n,final,best){\n    const label=final?'Professional Readiness Final':n===5?'Job Simulation Knowledge Check':\`Part \${n} Assessment\`;\n    render(\`<section class="section"><div class="container" style="max-width:860px"><div class="card cm-assessment-review passed"><div class="eyebrow">SAVED PASS · REVIEW MODE</div><div class="score-big">\${best}%</div><h1 class="serif">\${esc(label)} already passed.</h1><p>Your best recorded score is preserved. Reviewing the course does <strong>not</strong> erase this pass and you do not need to retake the assessment to continue.</p><div class="cm-result-actions"><a class="btn btn-gold" href="#/\${assessmentContinuePath(c,n,final)}">Continue →</a><a class="btn btn-outline" href="#/\${assessmentRetryPath(c,n,final)}">Retake assessment (optional)</a><a class="btn btn-soft" href="#/\${final?\`career/\${c.id}\`:\`learn/\${c.id}/\${n}\`}">Review learning</a></div></div></div></section>\`,'learning');\n  }\n\n  function learnPage(c,n){\n`,
'course assessment helpers');

app=replaceOnce(app,
`    const body=partContent(c,n);\n    render(\`<div class="learning-shell">`,
`    const body=partContent(c,n);\n    const assessmentScore=assessmentBestScore(c,n,false);\n    const assessmentPassed=assessmentScore>=PASS;\n    const assessmentLabel=assessmentPassed ? (n===5?\`Review passed knowledge check · \${assessmentScore}%\`:\`Review passed assessment · \${assessmentScore}%\`) : (n===5?'Take simulation knowledge check':'Take 10-question assessment');\n    render(\`<div class="learning-shell">`,
'learning page score awareness');

app=replaceOnce(app,
`<div class="lesson-actions"><button class="btn btn-outline" onclick="CM.markPart('\${c.id}',\${n})">Mark learning complete</button><a class="btn btn-primary" href="#/quiz/\${c.id}/\${n}">\${n===5?'Take simulation knowledge check':'Take 10-question assessment'} →</a></div>`,
`<div class="lesson-actions"><button class="btn btn-outline" onclick="CM.markPart('\${c.id}',\${n})">\${getCareerState(c.id).learningComplete.includes(n)?'Learning complete ✓':'Mark learning complete'}</button><a class="btn \${assessmentPassed?'btn-soft':'btn-primary'}" href="#/quiz/\${c.id}/\${n}">\${assessmentLabel} →</a></div>`,
'learning page passed-review action');

app=replaceOnce(app,
`    if(n===5 && !isPartComplete(c,5) && !qaMode()){\n      // allow knowledge check after opening part 5; marking complete is not required for knowledge check\n    }\n    const q=buildQuiz(c,n,final);`,
`    if(n===5 && !isPartComplete(c,5) && !qaMode()){\n      // allow knowledge check after opening part 5; marking complete is not required for knowledge check\n    }\n    const best=assessmentBestScore(c,n,final);\n    const retake=routeParts().query.get('retake')==='1';\n    if(best>=PASS && !retake && !qaMode()) return renderPassedAssessmentReview(c,n,final,best);\n    const q=buildQuiz(c,n,final);`,
'quiz review mode');

app=replaceOnce(app,
`    const passed=score>=PASS;\n    const next = final ? (passed?\`achievement/\${c.id}/career\`:\`final/\${c.id}\`) : n===5 ? (passed?\`official-simulation/\${c.id}\`:\`quiz/\${c.id}/5\`) : n===2 ? (passed?\`achievement/\${c.id}/foundations\`:\`quiz/\${c.id}/\${n}\`) : n===4 ? (passed?\`achievement/\${c.id}/applied\`:\`quiz/\${c.id}/\${n}\`) : (passed?\`career/\${c.id}\`:\`quiz/\${c.id}/\${n}\`);`,
`    const passed=score>=PASS;\n    const retry=assessmentRetryPath(c,n,final);\n    const next = passed ? assessmentContinuePath(c,n,final) : retry;`,
'failed quiz gets unique retry route');

write(APP,app);

let live=read(LIVE);
live=replaceOnce(live,
`  function nextHref(pathwayId, itemId, passed, assignmentId='') {\n`,
`  function mirroredBestScore(pathwayId,itemId){\n    try {\n      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null');\n      const cs=state?.careers?.[pathwayId];\n      if(!cs) return 0;\n      const part=/^part-(\\d+)$/.exec(itemId);\n      if(part){\n        const n=Number(part[1]);\n        return n===5?Number(cs.simulationKnowledge||0):Number(cs.quizScores?.[n]||0);\n      }\n      if(itemId==='final') return Number(cs.finalScore||0);\n      return 0;\n    } catch (_) { return 0; }\n  }\n\n  function retryHref(pathwayId,itemId,assignmentId=''){\n    const nonce=Date.now();\n    if(itemId==='simulation'){\n      const params=new URLSearchParams();\n      if(assignmentId) params.set('assignment',assignmentId);\n      params.set('retake','1'); params.set('attempt',String(nonce));\n      return \`#/official-simulation/\${pathwayId}?\${params.toString()}\`;\n    }\n    if(itemId==='final') return \`#/final/\${pathwayId}?retake=1&attempt=\${nonce}\`;\n    const n=Number(itemId.split('-')[1]);\n    return \`#/quiz/\${pathwayId}/\${n}?retake=1&attempt=\${nonce}\`;\n  }\n\n  function renderSavedAssessmentReview(pathwayId,itemId,best){\n    const el=main(); if(!el) return;\n    const part=/^part-(\\d+)$/.exec(itemId);\n    const n=part?Number(part[1]):null;\n    const label=itemId==='final'?'Professional Readiness Final':n===5?'Job Simulation Knowledge Check':\`Part \${n} Assessment\`;\n    el.innerHTML=\`<section class="section"><div class="container" style="max-width:860px"><div class="card cm-result passed cm-assessment-review"><div class="eyebrow">SAVED PASS · REVIEW MODE</div><div class="cm-result-score">\${Number(best)}%</div><h1 class="serif">\${esc(label)} already passed.</h1><p>Your best recorded score is preserved. Reviewing this course does not erase the pass, and retaking is optional.</p><div class="cm-result-actions"><a class="btn btn-gold" href="\${nextHref(pathwayId,itemId,true)}">Continue →</a><a class="btn btn-outline" href="\${retryHref(pathwayId,itemId)}">Retake assessment (optional)</a><a class="btn btn-soft" href="#/career/\${encodeURIComponent(pathwayId)}">Pathway</a></div></div></div></section>\`;\n  }\n\n  function nextHref(pathwayId, itemId, passed, assignmentId='') {\n`,
'secure assessment review helpers');

live=replaceOnce(live,
`    if (!signedIn()) {\n      renderAuthRequired();\n      return;\n    }\n\n    const renderEpoch = secureRouteEpoch;`,
`    if (!signedIn()) {\n      renderAuthRequired();\n      return;\n    }\n\n    const forceRetake=hashQuery().get('retake')==='1';\n    const savedBest=mirroredBestScore(pathwayId,itemId);\n    if(itemId!=='simulation' && savedBest>=PASS && !forceRetake){\n      renderSavedAssessmentReview(pathwayId,itemId,savedBest);\n      return;\n    }\n\n    const renderEpoch = secureRouteEpoch;`,
'secure renderer respects saved pass');

live=replaceOnce(live,
`    if (!passed) {\n      if (itemId === 'simulation') return \`#/official-simulation/\${pathwayId}\${assignmentId?\`?assignment=\${encodeURIComponent(assignmentId)}\`:''}\`;\n      if (itemId === 'final') return \`#/final/\${pathwayId}\`;\n      const n = Number(itemId.split('-')[1]);\n      return \`#/quiz/\${pathwayId}/\${n}\`;\n    }`,
`    if (!passed) return retryHref(pathwayId,itemId,assignmentId);`,
'secure failed result uses unique retry route');

write(LIVE,live);
console.log('COURSE ASSESSMENT STATE PATCH APPLIED: saved passes review safely; failed attempts always create a new retry route in local and secure renderers');
