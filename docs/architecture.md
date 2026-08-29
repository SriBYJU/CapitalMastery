# Capital Mastery Architecture

## Production architecture

```text
Browser / GitHub Pages
  ├─ Firebase Authentication
  ├─ Public learner UI
  ├─ Employer / cohort UI
  └─ HTTPS requests with Firebase ID token
        │
        ▼
Cloudflare Worker — authoritative API boundary
  ├─ verifies Firebase RS256 signature, issuer, audience, expiry, issue time, subject
  ├─ enforces tenant membership and organization roles server-side
  ├─ grades official assessments without exposing answer keys
  ├─ enforces credential prerequisites and sequencing
  ├─ grades Role Lab work and revision cycles
  ├─ computes competency evidence and readiness snapshots
  ├─ issues / verifies evidence-backed credentials
  ├─ applies attempt-rate protection
  └─ writes audit events
        │
        ▼
Cloudflare D1 — authoritative records
```

Firebase/Firestore is suitable for authentication and non-authoritative learner synchronization. D1 remains authoritative for official assessment results, competency evidence, readiness, enterprise access state, credential issuance, credential evidence, and public verification.

## Tenant model

Every enterprise record is scoped by an organization ID where applicable. The client does not determine authorization by supplying an `org_id`; the Worker resolves membership and role from D1 before returning or changing organization data.

Organization roles:

- `owner`
- `training_admin`
- `content_manager`
- `manager`
- `viewer`
- `learner`

The last active owner cannot be removed or demoted.

## Capital Mastery Standard + Firm Layer

Capital Mastery Standard content is global and protected. Employer Firm Layer content is organization/assignment scoped and versioned. Employers can hide, archive, restore, reorder, and revise their own layer. There is intentionally **no permanent employer DELETE route**.

Required standardized content cannot be hidden while still satisfying the Capital Mastery Professional Readiness standard.

## Assessment and evidence architecture

The Phase 1 Investment Banking reference pathway uses this sequence:

1. prerequisite legacy / recognized learning evidence
2. baseline diagnostic — 0% credential weight
3. Essentials Mini Case
4. Applied Skills recognition / evidence
5. Project Northstar Role Lab
6. Professional Readiness Final
7. readiness snapshot + evidence-backed credential issuance

Diagnostic evidence is a baseline. Once stronger applied, Role Lab, or final evidence exists for a competency, professional evidence becomes authoritative for the current readiness estimate.

Retakes update stable evidence records rather than multiplying their weight, preventing evidence inflation.

## Credential evidence

V2 credentials can carry:

- credential definition and Standard version
- prerequisite credentials
- standardized assessment evidence
- Role Lab performance evidence
- competency profile
- readiness snapshot
- curriculum version
- issuer/status/public token

Public verification exposes privacy-safe evidence only. Answer keys, hidden grading rules, and raw protected responses are not part of the public record.

## API security defaults

- exact production origin allowlist
- `GET, POST, PATCH, OPTIONS` CORS methods
- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- Firebase token signature and claim verification
- server-side tenant/role checks
- 10-attempt / 10-minute diagnostic and V2 assessment limits
- answer/grading keys remain server-side
- production `ADMIN_UID` is a Cloudflare secret binding
