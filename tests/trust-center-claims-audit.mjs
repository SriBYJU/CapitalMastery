import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)};

const start=app.indexOf('function trustPage()');
const end=app.indexOf('function policyPage(',start);
const trust=app.slice(start,end);
ok(start>=0&&end>start,'Trust Center renderer missing');

// Trust language must stay specific and evidence-backed, not drift into an
// unsupported compliance/certification claim.
ok(trust.includes('Firebase Authentication')&&trust.includes('verified Firebase ID token'),'Identity claim must describe Firebase token verification');
ok(trust.includes('Worker + D1')&&trust.includes('Official grading, prerequisites, enterprise tenancy, competency evidence and credential issuance'),'Authoritative backend claim missing or weakened');
ok(trust.includes('Server-verified roles')&&trust.includes('client-supplied organization ID never grants access by itself'),'Tenant isolation claim must be explicit');
ok(trust.includes('Keys stay server-side'),'Assessment-integrity claim missing');
ok(trust.includes('Versioned and verifiable'),'Credential-evidence claim missing');
ok(trust.includes('Recoverable by design')&&trust.includes('permanent delete is intentionally unavailable'),'Firm Layer recoverability claim missing');
ok(trust.includes('Designed toward WCAG 2.2 usability.')&&trust.includes('rather than a one-time claim of certification'),'Accessibility wording must remain an engineering target, not an unsupported certification claim');
for(const unsupported of ['SOC 2 certified','SOC2 certified','ISO 27001 certified','HIPAA compliant','PCI DSS certified','WCAG 2.2 certified']){
  ok(!trust.toLowerCase().includes(unsupported.toLowerCase()),`Unsupported Trust Center claim present: ${unsupported}`);
}

// Implementation evidence behind the public claims.
ok(worker.includes('verifyFirebaseToken')||worker.includes('verifyFirebaseIdToken'),'Worker must verify Firebase identity before authoritative actions');
ok(worker.includes('async function requireOrgRole')&&worker.includes('await requireOrgMember(env, uid, orgId)')&&worker.includes('Insufficient organization permission'),'Worker must enforce organization membership and allowed roles');
ok(worker.includes('function v2PublicAssessmentQuestion(row)'),'Worker must have a public assessment serializer');
const assessmentStart=worker.indexOf('function v2PublicAssessmentQuestion(row)');
const assessmentEnd=worker.indexOf('async function v2AssessmentAttemptReview',assessmentStart);
const publicAssessment=worker.slice(assessmentStart,assessmentEnd);
ok(!publicAssessment.includes('correct_answer')&&!publicAssessment.includes('rationale'),'Trust claim fails: public assessment serialization exposes protected grading data');
ok(worker.includes('credential_evidence')||worker.includes('v2_credential'),'Worker must persist versioned credential/evidence records in D1');
ok(worker.includes("['owner','training_admin','content_manager']")||worker.includes('["owner", "training_admin", "content_manager"]'),'Firm Layer mutation must be limited to authorized employer roles');
ok(enterprise.includes("status:'archived'")||enterprise.includes("status:'hidden'")||worker.includes("'archived'"),'Firm Layer lifecycle must support non-destructive states');

// Public verification/privacy language must be backed by explicit redaction or a
// purpose-built public payload rather than raw account records.
ok(worker.includes('publicCredential')||worker.includes('verification')||worker.includes('/verify/'),'Worker must expose a purpose-built verification path');
ok(!trust.includes('guarantee')||trust.includes('does not'),'Trust Center must not introduce performance guarantees');
ok(trust.includes('export enterprise data through My Data'),'User-data export disclosure must remain visible in the Trust Center');
ok(trust.includes('public verification excludes private account identifiers and answers'),'Verification privacy disclosure must remain visible');

if(fail.length){console.error('TRUST CENTER CLAIMS AUDIT FAILED\n - '+fail.join('\n - '));process.exit(1)}
console.log('TRUST CENTER CLAIMS AUDIT PASS: public security, privacy, integrity and accessibility claims remain implementation-backed and non-certificatory');
