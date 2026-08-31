import fs from 'node:fs';

const WORKER='v2/worker-v2-phase1-release.js';
const LIVE='capital-mastery-live.js';
function read(p){return fs.readFileSync(p,'utf8');}
function write(p,t){fs.writeFileSync(p,t);}
function must(c,m){if(!c)throw new Error(m);}
function replaceOnce(t,b,a,l){must(t.includes(b),`Missing anchor: ${l}`);const n=t.replace(b,a);must(n!==t,`No change: ${l}`);return n;}

let worker=read(WORKER);
worker=replaceOnce(worker,
"function simText(id,label,keywords,minHits,minWords,section,instruction) { return {id,type:'text',prompt:label,keywords,minHits,minWords,workProduct:{section,label,instruction}}; }",
"function simText(id,label,keywords,minHits,minWords,section,instruction) { return {id,type:'text',prompt:label,keywords,minHits,minWords,workProduct:{section,label,instruction}}; }\nfunction simUpdate(id,label,update,section,instruction) { return {id,type:'text',prompt:label,evidenceGroups:[...(update.impactGroups||[]),...(update.actionGroups||[])],minGroups:6,minWords:45,workProduct:{section,label,instruction}}; }",
'role-update task helper');

const oldBuilder=`function buildCareerWorkbenchSimulation(pathway) {\n  const b=CAREER_WORKBENCHES[pathway.id]; if(!b) return null;\n  return {\n    version:'2.0-workbench', itemType:'simulation', questions:b.tasks, writingPrompt:b.writingPrompt,\n    simulationProfile:{kind:'career-workbench-v2',pathwayId:pathway.id,project:b.project,role:b.role,reviewer:b.reviewer,client:b.client,deadline:b.deadline,objective:b.objective,files:b.files,workflow:[...new Set(b.tasks.map(x=>x.workProduct.section))],reviewStandard:CAREER_REVIEW_STANDARDS[pathway.id]||[]}\n  };\n}`;
const newBuilder=`function buildCareerWorkbenchSimulation(pathway) {\n  const b=CAREER_WORKBENCHES[pathway.id]; if(!b) return null;\n  const update=CAREER_ROLELAB_UPDATES[pathway.id]||null;\n  const updateTask=update ? simUpdate(\`\${pathway.code.toLowerCase()}-live-update\`,'Mid-assignment change note',update,'manager-update',\`A new fact arrived mid-assignment: \${update.message} Trace it through the affected analysis, decision and controlled next action.\`) : null;\n  const questions=updateTask?[...b.tasks,updateTask]:[...b.tasks];\n  return {\n    version:'2.1-workday', itemType:'simulation', questions, writingPrompt:b.writingPrompt,\n    simulationProfile:{kind:'career-workbench-v2',pathwayId:pathway.id,project:b.project,role:b.role,reviewer:b.reviewer,client:b.client,deadline:b.deadline,objective:b.objective,files:b.files,workflow:[...new Set(questions.map(x=>x.workProduct.section))],reviewStandard:CAREER_REVIEW_STANDARDS[pathway.id]||[],managerUpdate:update?{title:update.title,timestamp:update.timestamp,fileName:update.fileName,deliverable:update.deliverable,message:update.message}:null}\n  };\n}`;
worker=replaceOnce(worker,oldBuilder,newBuilder,'career workbench includes live role-native update');

worker=replaceOnce(worker,
`    } else if (q.type === "text") {\n      const text=cleanString(submitted||"",3000).toLowerCase();\n      const words=text.split(/\\s+/).filter(Boolean);\n      const hits=(q.keywords||[]).filter(k=>text.includes(String(k).toLowerCase())).length;\n      if(words.length>=Number(q.minWords||12) && hits>=Number(q.minHits||1)) correct++;\n    } else if (`,
`    } else if (q.type === "text") {\n      const text=cleanString(submitted||"",3000).toLowerCase();\n      const words=text.split(/\\s+/).filter(Boolean);\n      const hits=(q.keywords||[]).filter(k=>text.includes(String(k).toLowerCase())).length;\n      const groupHits=Array.isArray(q.evidenceGroups)?q.evidenceGroups.filter(group=>(group||[]).some(k=>text.includes(String(k).toLowerCase()))).length:null;\n      const evidenceOk=groupHits===null ? hits>=Number(q.minHits||1) : groupHits>=Number(q.minGroups||4);\n      if(words.length>=Number(q.minWords||12) && evidenceOk) correct++;\n    } else if (`,
'group-aware authored work grading');
write(WORKER,worker);

let live=read(LIVE);
live=replaceOnce(live,
`  function renderCareerSimulationWorkbench(data,pathwayId,itemId,el){\n    const p=data.simulationProfile; const sections=[...new Set(data.questions.map(q=>q.workProduct?.section||'analysis'))];\n    const standards=(p.reviewStandard||[]).map((x,i)=>\`<li><b>\${String(i+1).padStart(2,'0')}</b><span>\${esc(x)}</span></li>\`).join('');`,
`  function renderCareerSimulationWorkbench(data,pathwayId,itemId,el){\n    const p=data.simulationProfile; const sections=[...new Set(data.questions.map(q=>q.workProduct?.section||'analysis'))];\n    const standards=(p.reviewStandard||[]).map((x,i)=>\`<li><b>\${String(i+1).padStart(2,'0')}</b><span>\${esc(x)}</span></li>\`).join('');\n    const update=p.managerUpdate||null;\n    const updateHtml=update?\`<section class="cm-wb-stage cm-wb-live-update" id="cm-wb-live-update"><div class="cm-wb-stage-head"><div><div class="eyebrow">MID-ASSIGNMENT UPDATE · INBOX</div><h2>\${esc(update.title)}</h2><p>\${esc(update.timestamp)} · Your first draft is no longer enough. Re-open the affected work before you send anything to your reviewer.</p></div><span>NEW</span></div><article class="cm-wb-email cm-wb-new"><div class="cm-wb-email-meta"><b>\${esc(p.reviewer)}</b><span>\${esc(update.fileName)}</span></div><h3>New information — revise the work</h3><p>\${esc(update.message)}</p><p><strong>Expected revised deliverable:</strong> \${esc(update.deliverable)}</p></article></section>\`:'';`,
'career workbench live-update renderer');

live=replaceOnce(live,
`${'${(p.files||[]).map(renderWorkbenchFile).join(\'\')}</div></section>\n          <form id="cm-official-form" data-structured-writing="true">'}`,
`${'${(p.files||[]).map(renderWorkbenchFile).join(\'\')}</div></section>\n          ${updateHtml}\n          <form id="cm-official-form" data-structured-writing="true">'}`,
'insert live role update before work product');

live=replaceOnce(live,
`<p>Use the source files, produce the requested work outputs, then send a structured reviewer-facing recommendation. The separate final checks knowledge, calculations and workflow judgment; this screen tests whether you can do the job itself.</p>`,
`<p>Work the assignment the way a junior professional would: inspect the source packet, build the requested outputs, react to a role-native mid-assignment update, QA the result, and send a structured reviewer-facing recommendation. This simulation tests job execution—not answer recognition.</p>`,
'workday realism copy');
write(LIVE,live);

console.log('FIRM-READY COURSE WORKBENCH PATCH APPLIED: 15 non-IB workbenches now include role-native mid-assignment updates with evidence-group grading; renderer presents the update as reviewer inbox work');
