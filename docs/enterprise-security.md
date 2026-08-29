# Enterprise Security — Phase 1

## Security boundary

The browser is treated as untrusted. Official results and organization permissions are decided by the Cloudflare Worker against D1, not by browser state.

## Authentication

The Worker verifies Firebase ID tokens using Google's published signing keys and checks:

- RS256 algorithm
- signing key ID
- cryptographic signature
- expiration
- issue time
- authentication time sanity
- Firebase project audience
- Firebase issuer
- non-empty bounded subject / UID

## Authorization and tenant isolation

All organization endpoints resolve the signed-in UID and verify organization membership before access. Mutating endpoints additionally require the appropriate role. An organization ID supplied by the client is never trusted by itself.

Release tests include authenticated cross-tenant denial for workspace data, readiness reports, Firm Layer mutation, and audit-log access.

## Employer content integrity

Employer content is versioned. Supported lifecycle actions are:

- Hide
- Archive
- Restore

There is no permanent employer delete endpoint. Required Capital Mastery Standard content cannot be hidden. The last active organization owner cannot be removed or demoted.

## Assessment integrity

Official answer keys and Role Lab grading rules remain in D1 / server code and are not returned to the learner frontend. The My Data export intentionally excludes answer keys and hidden grading content.

V2 diagnostics and standardized assessments enforce 10 submissions per 10-minute window per learner/scope. Role Lab tasks also enforce configured maximum attempts.

## Evidence integrity

Competency evidence uses stable identifiers for a learner/scope/source/competency. Retakes can improve the evidence record but cannot create unlimited duplicate weight.

Professional Readiness requires direct underlying Role Lab evidence, the Professional Readiness Final, required prerequisite credentials, full evidence coverage, readiness threshold, and critical competency floors.

## Auditability

Enterprise mutations write audit events. Authorized employer roles can review the audit log in the product. Learners can export their own privacy-safe enterprise record from **My Data**.

## Secret handling

Production administrator identity is stored as a Cloudflare `secret_text` binding (`ADMIN_UID`). Phase 1 production deployment preserves the existing secret through Cloudflare binding inheritance; its value is never read into the repository or deployment script.
