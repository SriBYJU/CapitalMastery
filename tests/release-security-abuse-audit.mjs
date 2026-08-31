import fs from 'node:fs';

const {readJson,corsHeaders}=await import('../v2/worker-v2-phase1-release.js');

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const fail=[];
const ok=(value,message)=>{ if(!value) fail.push(message); };

// Request-size and attempt-abuse controls must remain server-side.
ok(worker.includes('const MAX_BODY_BYTES = 60000;'),'Worker request-body ceiling changed or disappeared');
const oversized='x'.repeat(60001);
for(const request of [
  new Request('https://worker.invalid/test',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({oversized})}),
  new Request('https://worker.invalid/test',{method:'POST',headers:{'content-type':'application/json','content-length':'999999'},body:'{}'})
]) {
  let status=0;
  try { await readJson(request); } catch(error) { status=error.status; }
  ok(status===413,'Oversized JSON must fail with HTTP 413, including when Content-Length is absent or exceeds the ceiling');
}
ok(worker.includes('const MAX_ATTEMPTS_10_MIN = 10;'),'Assessment attempt ceiling changed or disappeared');
ok(worker.includes('total >= MAX_ATTEMPTS_10_MIN')&&worker.includes('Too many recent attempts. Please wait before trying again.'),'Assessment attempt limiter must fail closed');
ok(worker.includes('429'),'Attempt abuse control must return HTTP 429');

// Browser origin access is enforced before normal route handling even though
// response CORS is intentionally wildcard during the Pages-host migration.
ok(worker.includes('function allowedOriginList(env)'),'Explicit request-origin allowlist parser missing');
ok(worker.includes('origin && !allowedOriginList(env).includes(origin)')&&worker.includes('new HttpError(403, "Origin not allowed")'),'Unapproved browser origins must be rejected server-side');
ok(corsHeaders({ALLOWED_ORIGINS:'https://capitalmastery.pages.dev'}).Vary==='Origin','Worker responses must preserve Origin cache variance');

// Assessment GETs must never serialize answer keys or grading rationales.
const assessmentPublicStart=worker.indexOf('function v2PublicAssessmentQuestion(row)');
const assessmentPublicEnd=worker.indexOf('async function v2AssessmentAttemptReview',assessmentPublicStart);
const publicAssessment=worker.slice(assessmentPublicStart,assessmentPublicEnd);
ok(assessmentPublicStart>=0&&assessmentPublicEnd>assessmentPublicStart,'Public assessment serializer missing');
ok(!publicAssessment.includes('correct_answer'),'Public assessment serializer leaks correct_answer');
ok(!publicAssessment.includes('rationale'),'Public assessment serializer leaks grading rationale before submission');
ok(worker.includes('questions:(qres.results||[]).map(v2PublicAssessmentQuestion)'),'Assessment GET must pass questions through the public serializer');

const diagnosticPublicStart=worker.indexOf('function v2PublicDiagnosticQuestion(row)');
const diagnosticPublicEnd=worker.indexOf('function v2PublicLabTask',diagnosticPublicStart);
const publicDiagnostic=worker.slice(diagnosticPublicStart,diagnosticPublicEnd);
ok(diagnosticPublicStart>=0&&diagnosticPublicEnd>diagnosticPublicStart,'Public diagnostic serializer missing');
ok(!publicDiagnostic.includes('correct_answer'),'Public diagnostic serializer leaks correct_answer');
ok(!publicDiagnostic.includes('rationale'),'Public diagnostic serializer leaks rationale before submission');

// Grading remains authoritative on the Worker, after answers are submitted.
ok(worker.includes('String(submitted??\'\')===String(q.correct_answer)'),'MC assessment grading must compare submitted answers server-side');
ok(worker.includes('Math.abs(Number(submitted)-Number(q.correct_answer))<=Number(q.tolerance||0)'),'Numeric assessment grading must remain server-side with tolerance');

if(fail.length){
  console.error('RELEASE SECURITY / ABUSE AUDIT FAILED\n - '+fail.join('\n - '));
  process.exit(1);
}
console.log('RELEASE SECURITY / ABUSE AUDIT PASS: body ceiling, attempt limiting, origin enforcement and answer-key isolation verified');
