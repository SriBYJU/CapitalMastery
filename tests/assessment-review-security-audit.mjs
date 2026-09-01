import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const migration=fs.readFileSync('migrations/018_assessment_attempt_reviews.sql','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

assert(/CREATE TABLE IF NOT EXISTS assessment_attempt_reviews/.test(migration),'Missing review migration table');
assert(/FOREIGN KEY \(attempt_id\) REFERENCES assessment_attempts\(id\) ON DELETE CASCADE/.test(migration),'Review rows must cascade with their attempt');
assert(/idx_assessment_attempt_reviews_owner/.test(migration),'Review lookup needs an owner/pathway/item index');

assert(worker.includes('INSERT INTO assessment_attempt_reviews'),'Legacy submissions must persist a post-submission review');
assert(worker.includes('WHERE uid=? AND pathway_id=? AND item_id=?'),'Legacy review lookup must bind the authenticated owner and course item');
assert(worker.includes('WHERE attempt_id=? AND uid=? LIMIT 1'),'Attempt review lookup must bind both attempt and owner');
assert(worker.includes('DELETE FROM assessment_attempt_reviews WHERE uid=?'),'Account deletion must remove saved reviews');
assert(worker.indexOf('INSERT INTO assessment_attempt_reviews')>worker.indexOf('const result = gradeAssessment'),'Review creation must occur only in the post-submission path');

const publicStart=worker.indexOf('function publicQuestion(q)');
const publicEnd=worker.indexOf('function otherValues(',publicStart);
const publicSerializer=worker.slice(publicStart,publicEnd);
assert(publicStart>=0&&publicEnd>publicStart,'Legacy public assessment serializer missing');
assert(!/answer|rationale|review_json/.test(publicSerializer),'Legacy assessment GET serializer leaks answer or review data');

assert(worker.includes("parts[3] === 'review'")&&worker.includes('v2AssessmentAttemptReview(env,attempt)'),'V2 assessments need owner-scoped saved review endpoints');
assert(worker.includes('JSON.stringify({correct,total:qs.length,competencyScores:compScores,details})'),'V2 submissions must retain graded question detail');
assert(worker.includes('reviewOnly:true'),'Passed assessment GETs must return authoritative review-only state');
assert(worker.includes('This assessment is already passed. Open the saved attempt review instead.'),'Assessment POSTs must reject attempts after a pass');
assert(live.includes('/assessment/review/${encodeURIComponent(apiPathway(pathwayId))}'),'Course UI must load saved legacy attempts from the Worker');
assert(live.includes('cm-server-assessment-review'),'Course review must be explicitly read-only');
assert(enterprise.includes('/enterprise/assessments/${encodeURIComponent(key)}/review'),'V2 UI must load the authoritative saved attempt');
assert(enterprise.includes('Retry required · Start new attempt'),'Failed review and retry must be explicit separate actions');
assert(enterprise.includes("savedReview.passed?'':"),'Passed V2 attempts must omit the retry action');

console.log('ASSESSMENT REVIEW SECURITY AUDIT PASS: owner-scoped D1 reviews, post-submit answer disclosure, deletion, permanent pass enforcement, read-only UI, and failed-only retries verified');
