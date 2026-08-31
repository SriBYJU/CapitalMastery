import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('course-state.js','utf8');
const storage=new Map();
const context={window:{},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))}};
vm.createContext(context);
vm.runInContext(code,context);
const state=context.window.CM_COURSE_STATE;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

assert(Object.isFrozen(state.COURSE_SEQUENCE),'Course sequence must be immutable');
assert(state.COURSE_SEQUENCE['career-skills'].length===11,'Career Skills must expose one canonical 11-stage sequence');
assert(state.COURSE_SEQUENCE['professional-readiness'].length===13,'Professional Readiness must expose one canonical 13-stage sequence');
for(const [track,sequence] of Object.entries(state.COURSE_SEQUENCE)) for(const entry of sequence){
  assert(entry.track===track&&entry.completionSource&&Object.hasOwn(entry,'passThreshold')&&Object.hasOwn(entry,'nextStageId')&&Object.hasOwn(entry,'credentialEffect'),'Every canonical stage must formalize track, completion source, pass threshold, next stage, and credential effect');
}
assert(state.getNextCourseDestination({pathway:'investment-banking',currentStage:'part-5',track:'career-skills'})==='#/official-simulation/investment-banking','Career Skills Part 5 must continue to the professional capstone');
assert(state.getNextCourseDestination({pathway:'investment-banking',currentStage:'part-5',track:'professional-readiness'})==='#/role-lab/investment-banking','Professional Readiness Part 5 must continue to Role Lab');
assert(state.routeFor('quant-finance','professional-final')==='#/v2-assessment/quantitative-finance-professional-final','Final route must normalize the quantitative-finance API key');

const contaminated={version:1,careers:{'investment-banking':{learningComplete:[1,2,3,4,5],quizScores:{1:95,2:95,3:95,4:95},simulationKnowledge:95,simulationScore:95,finalScore:95}},credentials:[]};
const signedIn=state.resolveLearnerCourseState('investment-banking',{track:'career-skills',authenticated:true,authoritativeRows:[],state:contaminated});
assert(signedIn.source==='server','Signed-in course state must declare server provenance');
assert(signedIn.stages.find(x=>x.id==='part-1-assessment').score===null,'Signed-in missing server records must not trust local assessment scores');
assert(signedIn.stages.find(x=>x.id==='simulation').score===null,'Signed-in missing server records must not trust a local simulation score');

const official=state.resolveLearnerCourseState('investment-banking',{track:'career-skills',authenticated:true,authoritativeRows:[{item_id:'part-1',best_score:92,completed:1}],state:contaminated});
const part1=official.stages.find(x=>x.id==='part-1-assessment');
assert(part1.passed&&part1.source==='server'&&part1.score===92,'Authoritative server assessment must drive signed-in pass state');
assert(part1.completed&&part1.bestScore===92&&part1.attempts===1&&part1.reviewAvailable,'Attempt, completion, best score, and review availability must remain separate canonical fields');
assert(part1.nextRoute==='#/learn/investment-banking/2'&&part1.reviewRoute.includes('review=1')&&part1.retakeRoute.includes('retake=1'),'Resolved stages must own next, review, and retake routes');
const locked=official.stages.find(x=>x.id==='part-3');
assert(locked.status==='locked'&&locked.lockReason&&locked.missingRequirements.length===1,'Locked stages must provide a deterministic reason and missing requirements');

storage.set('capitalMasteryQaStateV2',JSON.stringify(contaminated));
const qa=state.resolveLearnerCourseState('investment-banking',{track:'career-skills',qaPreview:true});
assert(qa.source==='qa-preview'&&qa.stages.find(x=>x.id==='simulation').score===95,'QA preview must use only the isolated QA namespace');
assert(qa.stages.find(x=>x.id==='part-1-assessment').reviewRoute.includes('review=1'),'Passed-assessment review and retake routes must remain explicit');

console.log('COURSE STATE MACHINE AUDIT PASS: canonical sequences, track-aware routing, server provenance, explicit review/retake, and isolated QA state verified');
