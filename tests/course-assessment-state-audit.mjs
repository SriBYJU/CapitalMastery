import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
function assert(c,m){if(!c)throw new Error(m);}

for(const marker of ['function assessmentBestScore','function assessmentContinuePath','function assessmentRetryPath','function assessmentReviewPath','function renderPassedAssessmentReview','function renderLockedCoursePreview']) assert(app.includes(marker),`app.js missing ${marker}`);
assert(app.includes("const next = passed ? assessmentContinuePath(c,n,final) : assessmentReviewPath(c,n,final);"),'Failed local quiz must open saved review before exposing a retry');
assert(app.includes('Review saved attempt'),'Failed local result must label the review-first action clearly');
assert(app.includes('passed attempt is final and preserved'),'Passed local assessment must be permanent and review-only');
assert(!app.includes('Retake assessment (optional)'),'Passed local assessment must never offer an optional retake');
assert(app.includes("!getCareerState(c.id).learningComplete.includes(n)"),'Direct local assessment routes must enforce learning completion');
assert(app.includes("Number(getCareerState(c.id).simulationScore||0)<PASS"),'Direct local final routes must enforce the Job Simulation pass');
assert(app.includes('Review passed knowledge check'),'Part 5 learning page must show the saved knowledge-check pass');
assert(app.includes('Review passed assessment'),'Learning page must show a saved assessment pass');
assert(!app.includes("passed?`official-simulation/${c.id}`:`quiz/${c.id}/5`"),'Old same-hash retry branch must be gone');

for(const marker of ['function mirroredBestScore','function retryHref','function attemptReviewHref','function renderSavedAssessmentReview']) assert(live.includes(marker),`secure renderer missing ${marker}`);
assert(live.includes("const forceRetry=hashQuery().get('retake')==='1';"),'Secure renderer must distinguish explicit failed-attempt retry mode');
assert(live.includes("if(itemId!=='simulation' && savedBest>=PASS)"),'Secure renderer must show review state even when a forged retake query is supplied');
assert(live.includes("if(itemId!=='simulation'&&!forceRetry)"),'Secure renderer must load saved attempts before presenting a fresh form');
assert(live.includes("if (!passed) return retryHref(pathwayId,itemId,assignmentId);"),'Secure failed result must use a unique retry route');
assert(live.includes("itemId==='simulation'?retryHref(pathwayId,itemId,assignmentId):attemptReviewHref(pathwayId,itemId)"),'Secure knowledge failures must open review first while simulations retain revision routing');
assert(live.includes("params.set('retake','1'); params.set('attempt',String(nonce));"),'Simulation retry must preserve assignment and force a new route event');
assert(live.includes('This passed attempt is final'),'Secure passed assessment must be permanent and review-only');
assert(!live.includes('Retake assessment (optional)'),'Secure passed assessment must never offer an optional retake');
assert(live.includes('renderLockedAssessment'),'Secure direct routes must render a non-interactive locked preview');
assert(live.includes("itemId==='final'&&!localSimulationPassed(pathwayId)"),'Secure client defense must keep the final locked until the Job Simulation pass');

console.log('COURSE ASSESSMENT STATE AUDIT PASS: passed quizzes stay permanently read-only, failed retries are explicit, and direct-route prerequisites are enforced in local + secure renderers');
