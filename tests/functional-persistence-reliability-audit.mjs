import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const app = read('app.js');
const index = read('index.html');
const sync = read('firebase-sync.js');
const continuity = read('course-continuity.js');
const enterprise = read('enterprise-v2.js');
const reliability = read('functional-reliability.js');
const routes = read('v2/assessment-lab-routes.js');
const assessmentHelpers = read('v2/v2-credential-assessment-helpers.js');
const assessmentRoutes = read('v2/v2-credential-assessment-routes.js');
const worker = read('v2/worker-v2-phase1-release.js');
const rules = read('firestore.rules');

function has(source, needle, message) {
  assert.ok(source.includes(needle), message || `Expected source to include ${needle}`);
}
function lacks(source, needle, message) {
  assert.ok(!source.includes(needle), message || `Expected source not to include ${needle}`);
}

// User-visible reliability layer must actually ship in the canonical bundle.
has(index, 'functional-reliability.js?v=20260908-reliability1', 'Canonical page must load the reliability guard.');
has(reliability, 'window.CM_RELIABILITY', 'Reliability API must be exposed to functional code.');
has(reliability, 'storageHealthCheck()', 'Browser storage availability must be tested.');
has(reliability, 'Save / sync needs attention', 'Save failures must have visible UI copy.');
has(reliability, 'installFetchGuard()', 'Authenticated server mutations must be monitored.');
has(reliability, "report('server-write'", 'Failed server writes must become visible.');
has(reliability, 'inspectAssessmentSubmit', 'Assessment partial-success responses must be inspected.');
has(reliability, 'inspectOtherDurableWrites', 'Diagnostic and Role Lab partial-success responses must be inspected.');

// Local course progress must never render "saved" after a failed browser write.
has(app, "window.CM_RELIABILITY?.report?.('browser-storage'", 'saveState must surface browser storage failures.');
has(app, 'throw new Error(\'Your latest progress could not be saved on this device.', 'saveState must stop success UI after a failed local write.');

// Cross-device progress: pending writes are durable, retried and flushed at lifecycle boundaries.
has(sync, 'PENDING_SYNC_PREFIX', 'Cloud sync must keep a durable pending marker.');
has(sync, "setStatus('pending')", 'Autosave must expose a pending state immediately.');
has(sync, 'scheduleRetry(', 'Failed sync must automatically retry.');
has(sync, "setStatus('degraded'", 'Partial profile-mirror failure must not be labeled fully synced.');
has(sync, "document.addEventListener('visibilitychange'", 'Latest state must flush when the tab backgrounds.');
has(sync, "window.addEventListener('pagehide'", 'Latest state must flush on page exit.');
has(sync, 'if (initializingRootProfile) rootProfileInitializedForUid = uid;', 'Root profile initialization must only be marked complete after a successful write.');
has(sync, 'delete clean.credentials;', 'Local preview credentials must stay separate from authoritative D1 credentials.');

// A failed authoritative progress read may not masquerade as an empty account.
has(continuity, 'progressReadFailure', 'Authoritative progress read failures must be surfaced.');
lacks(continuity, 'catch (_) { return []; }', 'Authoritative progress fetch may not silently collapse failures to an empty result.');
has(continuity, 'will not replace authoritative server progress with an empty result', 'UI must explain that failed reads are not zero progress.');

// Employer assigned-program readiness must not silently become an empty report.
lacks(enterprise, "let report={}; try { report=await api(`/enterprise/learner/readiness-report/", 'Assigned readiness report may not silently fall back to empty data.');
has(enterprise, 'data-cm-diagnostic-pending', 'Diagnostic partial-save state must be visible.');
has(enterprise, 'data-cm-assessment-pending', 'Assessment post-processing state must be visible.');
has(enterprise, 'data-cm-rolelab-pending', 'Role Lab post-processing state must be visible.');

// Diagnostic primary records + evidence use a D1 batch; later derived calculations are retryable and truthful.
has(routes, 'await env.DB.batch(statements);', 'Diagnostic attempt and baseline evidence must be batched.');
has(routes, 'diagnosticSaved:true', 'Successful diagnostic primary persistence must be explicitly acknowledged.');
has(routes, 'enrichmentPending', 'Diagnostic derived-state failure must be represented explicitly.');
has(routes, 'for(const delay of [0,250,900,1800])', 'Diagnostic post-processing must retry transient D1 failures.');

// Role Lab submission is the durable boundary. Post-processing may never turn a saved submission into a generic failure.
has(routes, 'submissionSaved:true', 'Role Lab responses must distinguish durable submission from post-processing.');
has(routes, 'postProcessingPending', 'Role Lab post-processing state must be explicit.');
has(routes, 'postProcessingWarnings', 'Role Lab must explain incomplete post-processing.');
has(routes, "INSERT INTO role_lab_submissions", 'Role Lab must persist the learner submission before enrichment.');

// Official assessment: saved attempt survives later evidence/readiness/credential failures.
has(assessmentHelpers, 'evidenceRefreshPending', 'Assessment grading must expose derived-evidence pending state.');
has(assessmentHelpers, 'evidenceRefreshWarning', 'Assessment grading must explain derived-evidence failures.');
has(assessmentRoutes, 'assessmentSaved:true', 'Assessment API must explicitly acknowledge the durable attempt.');
has(assessmentRoutes, 'credentialRefreshPending', 'Credential refresh failure must not erase/obscure a saved assessment attempt.');
has(assessmentRoutes, 'credentialRefreshWarning', 'Credential pending state must be user-explainable.');

// The deployable Worker must carry all modular reliability contracts too.
for (const needle of ['diagnosticSaved:true','submissionSaved:true','postProcessingPending','assessmentSaved:true','evidenceRefreshPending','credentialRefreshPending']) {
  has(worker, needle, `Production Worker missing reliability contract: ${needle}`);
}

// Official credential issuance remains atomic/idempotent and server-side.
has(assessmentHelpers, 'await env.DB.batch(statements);', 'Credential + event + evidence issuance must remain a D1 batch.');
has(assessmentHelpers, 'v2ActiveCredential', 'Credential issuance must check an existing active credential.');
has(assessmentHelpers, 'v2AnyCredential', 'Credential issuance must block unsafe duplicate/reissue behavior.');
has(assessmentRoutes, "FROM credentials WHERE uid=?", 'Official credentials must be read from D1 by authenticated UID.');

// Firestore remains owner-only convenience state; it never becomes credential authority.
has(rules, 'request.auth.uid == uid', 'Firestore progress must remain account-owner scoped.');
has(rules, 'Official credential eligibility and credential issuance are NOT trusted', 'Rules must document the credential authority boundary.');
has(rules, 'allow read, write: if false;', 'Unmatched Firestore paths must remain denied by default.');

console.log('Functional persistence reliability audit passed.');
