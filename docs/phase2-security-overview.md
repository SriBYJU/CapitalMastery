# Capital Mastery Phase 2 — Security & Data Boundary Overview

Capital Mastery uses defense-in-depth boundaries across identity, the browser application, the Cloudflare Worker and D1. This overview describes implemented product controls and release checks. It does **not** claim third-party security certification, regulatory approval or a formal compliance attestation.

## Identity

- Firebase Authentication provides account identity.
- The Worker verifies Firebase ID tokens for authenticated API operations.
- Full-name onboarding is used for credential identity.
- Authoritative enterprise access never comes from browser-only state.
- Unauthenticated protected operations fail at the Worker boundary.

## Request and origin boundary

- The Worker maintains an explicit approved-origin policy for non-preflight application requests.
- A client from an unapproved origin is rejected before protected route handling.
- CORS preflight behavior is tested independently from request-origin authorization.
- Request bodies are subject to a bounded size ceiling.
- Protected assessment attempts are rate/attempt limited and return a controlled `429` boundary when the configured window is exceeded.

These controls reduce abuse surface; they are not a substitute for upstream Cloudflare platform protections, monitoring or employer network controls.

## Tenant isolation and roles

Organization membership and role are looked up server-side in D1. Employer roles are:

- `owner`
- `training_admin`
- `content_manager`
- `manager`
- `viewer`

Learner access is scoped to accepted membership/cohort assignment.

A client-provided organization, cohort, assignment or learner ID is never sufficient by itself to obtain access. Server-side membership and capability checks remain authoritative even when a route is manually entered.

Role separation intentionally keeps content administration distinct from learner-performance access. For example, a Content Manager can administer Firm Layer content without receiving learner readiness, evidence-export or manager-review access.

## Assessment integrity

- official answer keys and grading rules remain server-side;
- public diagnostic and assessment responses exclude correct answers and protected rationales;
- Role Lab public task payloads exclude protected grading JSON;
- multiple-choice and numeric official grading is performed server-side;
- attempt limits are enforced by the Worker;
- prerequisite sequencing is enforced server-side;
- browser-edited state cannot issue an authoritative credential.

## Credentials and public verification

Standard 2.0 credentials carry versioned evidence. Public verification intentionally excludes Firebase UIDs, account email addresses, answer content and hidden grading rules.

Synthetic `DEMO-*` credentials are explicitly excluded from authoritative public-verification behavior so Admin Demo/Test Lab data cannot be confused with a real learner credential.

## Employer content and auditability

Firm Layer content is versioned. Authorized employers can create, edit, reorder, hide, archive and restore their content.

No employer-facing permanent DELETE route exists for Firm Layer content. The product favors recoverable state transitions and audit history over destructive content administration.

Material employer actions are designed to create audit history so workspace changes can be reviewed later.

## Manager evidence and notifications

Learner-performance visibility is capability-scoped. Manager review and readiness evidence are not exposed to content-only roles.

Notification behavior is release-tested for:

- tenant/user ownership;
- deduplication;
- severity ordering;
- bounded result count;
- read/archive transitions;
- resolved-condition cleanup;
- re-opening when a condition returns;
- account-deletion cleanup.

## Admin Demo/Test Lab

Demo creation, reset, learner-state controls and permission-matrix functions are restricted to the configured Capital Mastery administrator identity.

Demo learners use synthetic `.invalid` email addresses and synthetic UIDs; they are not real Firebase users. Demo mode is explicitly synthetic and does not grant the browser unrestricted production mutation.

## Data export

Signed-in users can export supported Capital Mastery enterprise/evidence data. Secure answer keys and hidden grading rules are intentionally excluded.

Employer CSV exports neutralize spreadsheet-formula prefixes in learner-controlled cells before quoting/serialization so a value beginning with characters such as `=`, `+`, `-` or `@` remains data when opened in spreadsheet software rather than becoming an executable formula.

## Self-service deletion

Signed-in users can permanently delete supported personal Capital Mastery evidence, credentials, learner progress, notifications, memberships, Firestore sync documents and Firebase Auth identity through the account-deletion workflow.

The Worker blocks deletion for the platform administrator and for a sole active employer-workspace owner. Shared employer records are retained only with creator identifiers pseudonymized as required so another authorized owner is not left with a stranded tenant.

Account-deletion behavior is covered by a release regression spanning D1, Firestore/Firebase orchestration, confirmations and owner/admin guards.

## D1 integrity verification

The audited Worker source includes an administrator-only, read-only `GET /admin/integrity` route.

It runs:

- `PRAGMA quick_check`;
- `PRAGMA foreign_key_check`;
- sanitized per-table `COUNT(*)` queries.

The route exposes integrity results and row counts only. It does not expose arbitrary row contents, provide a generic SQL console or perform writes.

The integrity route is a release-verification tool, not a public diagnostics endpoint.

## Frontend release boundary

Cloudflare Pages is built from an explicit frontend allowlist. The production artifact intentionally excludes Worker source, tests, migrations and internal operational documentation.

The Pages bundle audit checks the allowlist and baseline production security headers before release. The live-production audit separately verifies the canonical host after deployment because a correct repository artifact does not prove that Cloudflare is serving the newest generation.

## Accessibility and reliability

Capital Mastery is designed toward WCAG 2.2 usability, including keyboard focus, semantic controls, reduced-motion support, responsive layouts and status messaging.

Release testing includes 375, 430, 768 and ~1440 px browser widths plus state/history/offline-recovery scenarios. This is an engineering target and recurring test practice, not a claim of WCAG certification.

## Security-claim boundary

Capital Mastery is an independent educational/workforce-readiness platform. Unless separately and explicitly documented, it does not claim:

- SOC 2 certification;
- ISO 27001 certification;
- PCI DSS certification;
- HIPAA compliance;
- professional/regulatory training approval;
- third-party WCAG certification.

The public Trust Center is release-tested so security and privacy language remains tied to implemented controls rather than drifting into unsupported claims.
