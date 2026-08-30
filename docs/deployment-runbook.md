# Production deployment runbook

Capital Mastery uses two separately deployed surfaces:

- Cloudflare Pages serves the public browser application from a frontend-only artifact.
- The Cloudflare Worker serves authenticated API routes and uses D1 for authoritative assessment, evidence, credential, and employer records.

Keeping those deploys separate is a security boundary. Never deploy the repository root to Pages: it contains Worker implementation, tests, migrations, and operational documentation that are not browser assets.

## Preflight

The authoritative release gates are the GitHub Actions workflows:

- `Failure-seeking audit round 2` — Worker/frontend syntax, security and product regressions, production bundle audit, then the real Chromium browser matrix.
- `Phase 2 current-source audit` — Worker/frontend syntax, D1 integrity-route contract, every static `.mjs` audit, and production bundle verification.
- `Package audited Pages release` — rebuilds `dist-pages/`, reruns the production-bundle audit, and uploads the exact audited Pages directory as a release artifact.

Do not continue if either source audit is red. Browser-only Playwright audits are intentionally run by the failure-seeking browser stage after Playwright is installed; do not execute them as ordinary dependency-free static tests.

For a local static preflight:

```bash
node --check capital-mastery-live.js
node --check enterprise-v2.js
node --check v2/worker-v2-phase1-release.js
node tests/d1-integrity-endpoint-audit.mjs
for test_file in tests/*.mjs; do
  if [ "$test_file" = "tests/failure-seeking-browser-audit.mjs" ]; then continue; fi
  node "$test_file"
done
```

## Build the Pages artifact

```bash
node tools/build-pages.mjs
node tests/pages-production-bundle-audit.mjs
```

The build recreates `dist-pages/` from the explicit frontend allowlist. It adds production security headers and intentionally excludes the Worker, tests, migrations, Firebase diagnostics, and repository documentation.

For a release candidate, prefer the artifact produced by `Package audited Pages release`. Its artifact name contains the exact commit SHA so the bytes uploaded to Cloudflare can be traced back to the audited source. Do not add files to `dist-pages/` after its bundle audit.

## Deploy order

When a release changes both API behavior and the UI, deploy in this order:

1. Deploy the Worker from the reviewed commit.
2. Run `/health` from the approved production origin and confirm D1 reachability.
3. Verify an unapproved origin is rejected and unauthenticated protected routes remain blocked.
4. With an authenticated Capital Mastery administrator, call the read-only `GET /admin/integrity` endpoint. Require `PRAGMA quick_check` to report `ok`, `foreignKeyViolations` to be empty, and record the returned per-table counts. This route exposes counts only and must never be treated as a generic SQL console.
5. Deploy the exact audited `dist-pages/` release artifact to the `capitalmastery` Pages project.
6. Verify the canonical Pages response contains the expected generation and production security headers.
7. Run the browser matrix below against the canonical Pages URL.

The UI must remain backward-compatible with the previous Worker during rollout. The Worker must accept the previous UI until the Pages deployment is verified.

## Live verification matrix

| Surface | Required proof |
|---|---|
| Public | Home, Careers, Employers, public credential verification, and representative career pages render without application errors. |
| Learner | Assigned program opens; official assessment submits; Role Lab resumes; material updates change the required work; credential state matches D1. |
| Employer | Organization setup, cohort, assignment, invite, learner evidence, manager review, readiness export, alerts, and activity log work with correct scope. |
| Firm Layer | Add, edit, reorder, hide, archive, restore, history, version publish, deep links, and parent navigation work; no permanent employer delete is exposed. |
| Security | Unauthenticated API requests fail safely; an unapproved Origin is rejected; cross-organization access is denied; backend/test paths are absent from Pages; no answer key appears in browser responses; CSV exports neutralize spreadsheet-formula prefixes. |
| Database | `/health` reaches D1; admin integrity returns a clean `quick_check`, zero foreign-key violations, and recorded table counts. |
| Responsive/accessibility | 375, 430, 768 and ~1440 px browser passes; keyboard operation, focus visibility, reduced motion, mobile navigation, and primary workbench forms remain usable. |

## Release evidence

Record all of the following before calling the release complete:

- source commit SHA;
- successful failure-seeking and current-source audit runs;
- Worker deployment identifier/time;
- D1 integrity result and table counts;
- Pages artifact name/digest and Cloudflare deployment identifier/time;
- live response-header/generation result;
- signed-out public smoke;
- signed-in learner smoke;
- signed-in employer/role smoke;
- disposable QA account cleanup result;
- Firebase Authentication authorized-domain verification;
- every unresolved blocker.

A successful deploy is not the same as a completed Phase 2 audit. Do not mark Phase 2 complete while any release-evidence item above is unknown or failing.
