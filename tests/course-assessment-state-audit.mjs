import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
function assert(c,m){if(!c)throw new Error(m);}

for(const marker of ['function assessmentBestScore','function assessmentContinuePath','function assessmentRetryPath','function renderPassedAssessmentReview']) assert(app.includes(marker),`app.js missing ${marker}`);
assert(app.includes("routeParts().query.get('retake')==='1'"),'Local quiz review must support explicit retake mode');
assert(app.includes("const retry=assessmentRetryPath(c,n,final);"),'Failed local quiz must compute a unique retry route');
assert(app.includes("const next = passed ? assessmentContinuePath(c,n,final) : retry;"),'Local result routing must separate continue from retry');
assert(app.includes('Retake assessment (optional)'),'Passed local assessment must make retake optional');
assert(app.includes('Review passed knowledge check'),'Part 5 learning page must show the saved knowledge-check pass');
assert(app.includes('Review passed assessment'),'Learning page must show a saved assessment pass');
assert(!app.includes("passed?`official-simulation/${c.id}`:`quiz/${c.id}/5`"),'Old same-hash retry branch must be gone');

for(const marker of ['function mirroredBestScore','function retryHref','function renderSavedAssessmentReview']) assert(live.includes(marker),`secure renderer missing ${marker}`);
assert(live.includes("const forceRetake=hashQuery().get('retake')==='1';"),'Secure renderer must support explicit retake mode');
assert(live.includes("if(itemId!=='simulation' && savedBest>=PASS && !forceRetake)"),'Secure renderer must show review state instead of silently rebuilding a passed quiz');
assert(live.includes("if (!passed) return retryHref(pathwayId,itemId,assignmentId);"),'Secure failed result must use a unique retry route');
assert(live.includes("params.set('retake','1'); params.set('attempt',String(nonce));"),'Simulation retry must preserve assignment and force a new route event');
assert(live.includes('Retake assessment (optional)'),'Secure passed assessment must make retake optional');

console.log('COURSE ASSESSMENT STATE AUDIT PASS: passed quizzes stay passed/reviewable and failed retries use unique route hashes in local + secure renderers');
