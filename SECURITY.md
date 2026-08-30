# Security Notes

## Production security boundary

Capital Mastery treats the browser as untrusted for official results. Firebase Authentication establishes identity, while the Cloudflare Worker verifies the Firebase ID token and enforces authorization against D1 before returning or changing authoritative data.

Official assessment scores, enterprise membership, competency evidence, readiness snapshots, verified credential issuance/status, Firm Layer state, manager-review records, audit events, and public verification are authoritative in D1.

Career Skills program-completion certificates are presentation/completion records and are intentionally distinguished from the five verified Standard 2.0 career credential levels: Foundations, Essentials, Applied Skills, Role Lab, and Professional Readiness.

## Secrets

Do not commit:

- Firebase service-account credentials
- Cloudflare API tokens
- private keys
- admin passwords
- Firebase refresh tokens
- bearer tokens
- any server-only secret

The production administrator UID is stored in Cloudflare as the `ADMIN_UID` secret binding. Its value is not present in this repository. Worker deployments are configured to preserve production variables/bindings; release procedures must never replace protected secrets with placeholders.

The Firebase Web App configuration in `firebase-config.js` is client configuration, not a service-account credential.

## Authentication checks

The Worker verifies Firebase ID tokens using Google's signing keys and validates the RS256 signature, signing key ID, expiration, issue time, authentication-time sanity, project audience, issuer, and subject.

Protected API routes reject unauthenticated requests. Production release checks also verify that an unapproved Origin is rejected rather than accepted by CORS policy.

## Tenant authorization

Enterprise access is resolved server-side from `organization_members`. Client-provided organization IDs do not grant access. Mutating routes enforce role checks for Owner, Training Admin, Content Manager, Manager, Viewer, and Learner capabilities.

The last active owner cannot be removed or archived. Cross-organization access is expected to fail even when a browser attempts to supply another tenant identifier.

## Assessment and credential integrity

- official answer keys are never returned to the learner frontend
- hidden Role Lab grading rules remain server-side
- V2 diagnostic and standardized assessment submission rates are limited
- Role Lab tasks enforce configured maximum attempts
- stable evidence IDs prevent repeated attempts from multiplying evidence weight
- failed retakes do not erase stronger previously demonstrated evidence
- Professional Readiness requires the direct Role Lab record, Professional Final, prerequisite credentials, readiness threshold, full evidence coverage, and critical competency floors
- Career Skills completion cannot satisfy a Professional Readiness or Academy prerequisite that requires the verified advanced credential

## Abuse and mutation controls

Release regression coverage checks controlled submission/abuse behavior on protected assessment surfaces. Employer content and role mutations are authorized server-side rather than trusted from UI visibility alone.

The browser must never be treated as the source of truth for grading, organization membership, role authority, credential issuance, or readiness status.

## Employer content lifecycle

Firm Layer content is versioned. Employer-facing lifecycle actions are **Hide**, **Archive**, and **Restore**. There is intentionally no permanent employer DELETE endpoint. Required Capital Mastery Standard content cannot be hidden.

Version history and material employer actions are designed to remain auditable rather than silently overwriting prior published state.

## Privacy and exports

The My Data export includes the learner's enterprise membership/training/evidence metadata but intentionally excludes answer keys and hidden grading rules. Public credential verification exposes only privacy-safe credential/evidence fields.

CSV exports neutralize spreadsheet-formula prefixes before download so attacker-controlled learner/employer text is not emitted as an executable spreadsheet formula. JSON/evidence exports remain scoped to the requesting tenant/learner authorization boundary.

## Production frontend boundary

Cloudflare Pages is built from an explicit frontend allowlist. The production bundle intentionally excludes:

- Worker source
- `v2/` implementation files
- tests and browser-audit code
- migrations
- operational/internal documentation
- build tools
- `auth-test.html`
- Firebase example/rules files
- Wrangler configuration

Never deploy the repository root to Pages.

The audited Pages bundle defines baseline response controls including:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security`

## Database integrity diagnostics

The Worker contains an administrator-only, read-only `GET /admin/integrity` release diagnostic. It performs:

- `PRAGMA quick_check`
- `PRAGMA foreign_key_check`
- sanitized per-table `COUNT(*)` queries

It does not expose arbitrary table rows, accept arbitrary SQL, or mutate D1. Production release closure requires authenticated execution with `quick_check = ok` and zero foreign-key violations.

## Release security verification

Current release QA includes automated checks for:

- Worker/frontend syntax and protected-route contracts
- answer-key/grader leakage
- tenant/RBAC boundaries
- assessment abuse controls
- CSV formula-injection safety
- Pages backend/internal-file exclusion
- security headers
- responsive/keyboard behavior
- five employer roles
- 16 careers across both training programs
- canonical bad-Origin and unauthenticated API behavior after production promotion

The exact release evidence and unresolved production blockers are tracked in `docs/phase2-release-audit.md`.

## Local QA mode

Legacy browser QA helpers remain available for deterministic regression testing. Any local QA preview credential is explicitly non-authoritative and separate from live D1-issued credentials.

QA/test data must be cleaned after release testing, followed by post-cleanup integrity verification. QA helpers must never weaken production authentication, tenant isolation, grading authority, or credential issuance.

## Security posture claims

Capital Mastery documents implemented controls and test evidence. It does not claim SOC 2, ISO 27001 certification, regulatory approval, penetration-test attestation, professional licensure, or another third-party security/compliance certification unless such evidence is separately obtained and explicitly documented.
