# Capital Mastery Security Threat Model

**Scope:** the public GitHub Pages site, Cloudflare Pages mirror, Cloudflare Worker API, D1, Firebase Authentication, Firestore learner synchronization and the repository/release workflows.

**Project stage:** public, free product; not represented as a registered company or independently certified service.

## Assets that need protection

- Learner identity, credential display name and Firebase identity token.
- Course progress, assessment attempts, score reviews and issued credential records.
- Employer organizations, member roles, invitations, assignments, cohort readiness and firm-specific content.
- Server-side assessment answer keys and scoring rubrics.
- Administrator authority and production D1 integrity.
- Source, deployment configuration and release evidence.

## Trust boundaries

1. **Browser to Firebase:** Firebase establishes user identity. The browser is not trusted to declare a UID, admin status or employer role.
2. **Browser to Worker:** the Worker verifies bearer tokens and makes authorization decisions. CORS/origin checks reduce browser abuse but are never treated as authentication.
3. **Worker to D1:** D1 is authoritative for official attempts, employer records, credentials and program completions. Browser/local state cannot issue official evidence.
4. **Browser to Firestore:** owner-bound rules support learner synchronization. Firestore is not the authoritative credential store.
5. **Repository to production:** allowlisted Pages artifacts and the reviewed Worker entrypoint are the deployment boundary. Tests, migrations, secrets and backend source are not part of the public site bundle.

## Credible threat and control register

| Threat | Current preventive controls | Detection / recovery | Residual limitation |
|---|---|---|---|
| Forged or replayed identity | Firebase token verification; explicit token length ceiling; authenticated UID used server-side | Unauthorized API probes and live auth tests | Compromised user accounts remain an identity-provider risk. |
| Cross-tenant employer access | D1 organization membership and role checks on every protected route; direct-route and UI parity tests | Role-matrix, invitation-lifecycle and tenant-isolation audits | Enterprise SSO is not implemented or customer-tested. |
| Admin privilege escalation | Server-verified administrator identity; exact production Admin UID secret; pre-router admin guard | Admin closure probe, zero-exposure tests and protected integrity endpoint | No independent security assessor has attested to the design. |
| Answer-key or rubric leakage | Official questions, keys and detailed grading logic remain server-side; responses expose only permitted review data | Answer-key isolation and assessment-review security tests | Browser-delivered educational examples are public by design. |
| Skipping required coursework or overwriting a pass | Canonical server progression; prerequisite enforcement; permanent-pass state; failed-only retry; account-bound merge rules | No-skip, resume, assessment review, account-switch and continuity suites | A learner can inspect public explanatory content, but cannot submit locked official work. |
| Malicious JSON or oversized inputs | Exact JSON media-type requirement; body and token ceilings; input validation; attempt limits | Security-abuse and zero-cost hardening audits | The free plan does not provide a contractual capacity guarantee. |
| Cross-origin browser abuse | Explicit production-origin allowlist evaluated before preflight responses | Bad-origin actual and preflight monitor probes | CORS does not stop direct non-browser requests; authentication and RBAC remain primary. |
| Script or content injection | Escaping/sanitization patterns; CSP; pinned CDN scripts with SHA-384 SRI; no public source maps or backend artifacts | CSP/SRI static gate, hostile-input browser suites and CSV formula-injection tests | GitHub Pages supplies the policy through an HTML meta tag; the Cloudflare mirror also sends a CSP response header. |
| Framing, MIME confusion or referrer leakage | Cloudflare `frame-ancestors 'none'`; Worker `X-Frame-Options`, `nosniff`, `no-referrer` and restrictive Permissions Policy | Production header audits | GitHub Pages does not provide repository-defined response headers; the document CSP still protects supported document directives. |
| D1 corruption or destructive operator error | Foreign keys, ordered migrations, read-only integrity endpoint, destructive restore kept manual | `quick_check`, foreign-key checks, table counts and D1 Time Travel | Free-plan Time Travel has a seven-day window; restoration requires production authority. |
| Source/deployment regression | Git history, exact allowlisted Pages build, checksums, Worker dry run and fail-closed release order | Static regression, browser matrices and live read-only audits | Scheduled GitHub jobs are monitoring, not a contractual SLA. |

## Security invariants

- Never trust browser-provided ownership, organization membership, roles, scores or credential eligibility.
- Never expose official answer keys before submission or allow a passed assessment to be overwritten by a retake.
- Never fail open by disabling authentication, tenant authorization, origin validation or progression checks during an incident.
- Never publish tokens, D1 exports containing personal data, internal test fixtures or backend source as Pages artifacts.
- Never automate a destructive D1 restore from a generic health-check failure.

## What this model does not claim

This is a first-party engineering threat model, not an independent penetration test, SOC 2 report, legal review, insurance assessment or customer identity-provider test. Those external assurances become useful only when a real firm requires them and supplies the necessary commercial or identity-provider context.
