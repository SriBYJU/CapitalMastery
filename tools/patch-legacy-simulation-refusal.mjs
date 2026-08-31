import fs from 'node:fs';

const FILE='capital-mastery-live.js';
let src=fs.readFileSync(FILE,'utf8');
function must(c,m){if(!c)throw new Error(m);}
function replaceOnce(before,after,label){must(src.includes(before),`Missing anchor: ${label}`);const next=src.replace(before,after);must(next!==src,`No change: ${label}`);src=next;}

replaceOnce(
`  async function renderAssessment(pathwayId, itemId) {\n`,
`  function professionalSimulationPayload(data){\n    const kind=data?.simulationProfile?.kind;\n    if(!['ib-deal-workbench-v2','career-workbench-v2'].includes(kind)) return false;\n    if(!Array.isArray(data?.questions)||!data.questions.length) return false;\n    return data.questions.every(q=>{\n      if(!['numeric','text'].includes(q?.type)) return false;\n      if(Array.isArray(q?.options)&&q.options.length) return false;\n      return !!q?.workProduct;\n    });\n  }\n\n  function renderProfessionalSimulationUnavailable(pathwayId,el){\n    el.innerHTML=\`<section class="section"><div class="container" style="max-width:860px"><div class="card cm-live-card cm-workbench-required"><div class="eyebrow">PROFESSIONAL JOB SIMULATION</div><h1 class="serif">Professional workbench update required.</h1><p>This pathway will not present a multiple-choice or answer-picking exercise as a job simulation. The official simulation must provide source files, calculated or authored work products, and a reviewer-facing handoff.</p><p class="muted">Your course progress is preserved. Return to the pathway while the secure workbench generation is updated.</p><div class="cm-result-actions"><a class="btn btn-primary" href="#/career/\${encodeURIComponent(pathwayId)}">Back to pathway →</a><a class="btn btn-outline" href="#/learn/\${encodeURIComponent(pathwayId)}/5">Review simulation briefing</a></div></div></div></section>\`;\n  }\n\n  async function renderAssessment(pathwayId, itemId) {\n`,
'professional simulation payload validator');

replaceOnce(
`      const isSimulation = itemId === 'simulation';\n      const isFinal = itemId === 'final';\n      if (isSimulation && data.simulationProfile?.kind === 'ib-deal-workbench-v2') {`,
`      const isSimulation = itemId === 'simulation';\n      const isFinal = itemId === 'final';\n      if (isSimulation && !professionalSimulationPayload(data)) {\n        renderProfessionalSimulationUnavailable(pathwayId,el);\n        return;\n      }\n      if (isSimulation && data.simulationProfile?.kind === 'ib-deal-workbench-v2') {`,
'refuse legacy simulation response');

fs.writeFileSync(FILE,src);
console.log('LEGACY SIMULATION REFUSAL PATCH APPLIED: official simulation refuses MCQ/choice/option payloads and only renders numeric/text professional workbenches');
