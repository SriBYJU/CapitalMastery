# Phase 1 Release Audit

## Release scope

Phase 1 establishes Capital Mastery Enterprise Core plus the complete Investment Banking reference implementation used to validate the reusable V2 architecture.

## Automated regression gates

- legacy static audit — PASS
- legacy logic / 79–80 mastery-boundary audit — PASS
- legacy runtime smoke — **189 routes PASS**
- Enterprise V2 static audit — PASS
- Enterprise V2 runtime smoke — **17 routes PASS**

## Live staging black-box gates

Validated against the deployed Cloudflare Worker and production D1 database:

- health/catalog routes
- Firebase-authenticated API access
- legacy progress recognized for V2 prerequisites
- organization creation and owner membership
- cohort + assignment lifecycle
- secure invitation acceptance
- cross-tenant access denial
- Firm Layer create/version/hide/archive/restore
- required Standard content hide denial
- baseline-before-Essentials sequencing
- Essentials issuance
- Role Lab baseline/credential sequencing
- seven-stage Project Northstar completion
- revision-required flow after failed work
- Role Lab credential issuance
- Professional Final gating and passing
- 100% professional evidence coverage
- Professional Readiness credential issuance
- direct Role Lab evidence in Professional Readiness portfolio
- privacy-safe public V2 verification
- employer readiness report
- learner readiness report
- last-owner protection
- stable evidence counts under retakes
- failed retakes do not reduce previously demonstrated evidence
- My Data export succeeds and excludes answer/grading keys
- diagnostic attempts 1–10 accepted; attempt 11 returns HTTP 429
- V2 assessment attempts 1–10 accepted; attempt 11 returns HTTP 429
- learner denied employer audit log
- outsider denied employer readiness report
- learner denied Firm Layer writes
- employer DELETE endpoint absent

## D1 integrity gates

- `PRAGMA quick_check` → `ok`
- 5 active Investment Banking V2 credential definitions
- 12 active Investment Banking diagnostic questions
- 7 active Project Northstar tasks
- 2 active Investment Banking V2 assessments
- 0 active organizations without an active owner
- 0 orphan cohort-member records
- 0 orphan assignment/cohort records

## Production deployment safety

Production Worker settings include the protected `ADMIN_UID` Cloudflare secret. Deployment must use Cloudflare binding inheritance for `secret_text` bindings and must preserve D1, Firebase project, origin allowlist, observability, and compatibility settings.

After production promotion, the frontend V2 API target must be switched from the isolated staging Worker to the production Worker and the complete black-box smoke set rerun against production before Phase 1 is marked complete.


## Production release verification — August 29, 2026

The audited Worker bundle was promoted to `capital-mastery-api` with the existing Cloudflare `ADMIN_UID` secret preserved via binding inheritance. Production D1, Firebase project, origin allowlist, compatibility settings, and Worker observability were preserved.

A brand-new temporary Firebase learner was then exercised against the **production hostname**, not staging. The complete production journey passed:

- legacy prerequisite recognition and preserved Foundations / Applied credentials
- new employer organization, professional cohort, assignment, and secure learner invitation
- Firm Layer create → hide → archive → restore with version history
- required Capital Mastery Standard hide denial
- enforced baseline → Essentials → Role Lab → Professional Final sequence
- baseline diagnostic at 100 with 0% credential weight
- Essentials assessment and credential issuance
- intentional failed Project Northstar Stage 1 followed by required revision
- all seven Project Northstar stages passed after correction
- Role Lab credential issuance
- Professional Final at 100
- Professional Readiness at 100 with 100% professional evidence coverage
- direct Project Northstar evidence in the Professional Readiness evidence portfolio
- privacy-safe public V2 credential verification
- learner readiness report
- employer cohort readiness report
- Team & Roles listing
- enterprise audit log
- My Data export without answer/grading keys
- last-owner protection
- learner/employer permission separation
- employer permanent-delete endpoint absent

The final production test also exposed and fixed two Team & Roles defects before release sign-off: a stale `organization_members.created_at` reference and an invalid `inactive` member status that did not match the D1 `active | archived` constraint.

## QA cleanup

After production E2E passed, all generated Phase 1 QA data was removed:

- 5 temporary `@example.com` Firebase Authentication accounts deleted
- 2 temporary Phase 1 organizations deleted from D1
- all test-only credentials, progress, evidence, Role Lab submissions, assessment attempts, readiness snapshots, invites, members, Firm Layer content/version history, and audit events removed

Post-cleanup verification:

- `PRAGMA quick_check` → `ok`
- 0 remaining QA organizations
- 0 remaining QA organization memberships
- 0 remaining QA credentials
- 0 remaining QA official-progress records
- 5 active Investment Banking V2 credential definitions remain
- 12 active Investment Banking diagnostic questions remain
- 7 active Project Northstar tasks remain
- 2 active Investment Banking V2 assessments remain
- 0 active organizations without an active owner
- 0 orphan cohort-member records
- 0 orphan assignment/cohort records
