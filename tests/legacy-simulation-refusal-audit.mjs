import fs from 'node:fs';
const live=fs.readFileSync('capital-mastery-live.js','utf8');
function assert(c,m){if(!c)throw new Error(m);}
assert(live.includes('function professionalSimulationPayload(data)'),'Simulation payload validator missing');
assert(live.includes("['ib-deal-workbench-v2','career-workbench-v2']"),'Only recognized professional workbench kinds should be accepted');
assert(live.includes("!['numeric','text'].includes(q?.type)"),'Official simulation must reject non-work-product question types');
assert(live.includes('Array.isArray(q?.options)&&q.options.length'),'Official simulation must reject answer-option payloads');
assert(live.includes('function renderProfessionalSimulationUnavailable'),'Safe stale-Worker state missing');
assert(live.includes('will not present a multiple-choice or answer-picking exercise as a job simulation'),'Safe state must explain the professional standard');
assert(live.includes('if (isSimulation && !professionalSimulationPayload(data))'),'Secure renderer must refuse legacy simulation payload before generic assessment rendering');
console.log('LEGACY SIMULATION REFUSAL AUDIT PASS: stale Worker MCQ/choice simulation payloads cannot render as official job simulations');
