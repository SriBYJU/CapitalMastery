# Production deployment runbook

Capital Mastery uses two separately deployed surfaces:

- Cloudflare Pages serves the public browser application from a frontend-only artifact.
- The Cloudflare Worker serves authenticated API routes and uses D1 for authoritative assessment, evidence, credential, and employer records.

Keeping those deploys separate is a security boundary. Never deploy the repository root to Pages: it contains Worker implementation, tests, migrations, and operational documentation that are not browser assets.

## Preflight

Run syntax validation and every automated audit before creating a production artifact:

```bash
node --check capital-mastery-live.js
node --check enterprise-v2.js
node --check v2/worker-v2-phase1-release.js
for test_file in tests/*.mjs; do node "$test_file"; done
```

Do not continue if any check fails.

## Build the Pages artifact

```bash
node tools/build-pages.mjs
```

The command recreates `dist-pages/` from an allowlist derived from `index.html`, the required metadata files, and `assets/`. It adds production security headers and intentionally excludes the Worker, tests, migrations, Firebase diagnostics, and repository documentation.

Confirm the bundle audit passes:

```bash
node tests/pages-production-bundle-audit.mjs
```

## Deploy order

When a release changes both API behavior and the UI, deploy in this order:

1. Deploy the Worker from the reviewed commit.
2. Run public health and authenticated role checks against the Worker.
3. Deploy `dist-pages/` to the `capitalmastery` Pages project.
4. Verify the deployment is healthy before treating it as production.
5. Run the browser matrix below against the canonical Pages URL.

The UI must remain backward-compatible with the previous Worker during rollout. The Worker must accept the previous UI until the Pages deployment is verified.

## Live verification matrix

| Surface | Required proof |
|---|---|
| Public | Home, Careers, Employers, public credential verification, and representative career pages render without application errors. |
| Learner | Assigned program opens; official assessment submits; Role Lab resumes; material updates change the required work; credential state matches D1. |
| Employer | Organization setup, cohort, assignment, invite, learner evidence, manager review, readiness export, alerts, and activity log work with correct scope. |
| Firm Layer | Add, edit, archive, restore, history, version publish, deep links, and parent navigation work; no permanent employer delete is exposed. |
| Security | Unauthenticated API requests fail safely; cross-organization access is denied; backend/test paths are absent from Pages; no answer key appears in browser responses. |
| Responsive/accessibility | Keyboard operation, focus visibility, reduced motion, mobile navigation, and the primary workbench forms remain usable. |

Record the commit, Worker deployment, Pages deployment, test count, and any unresolved blockers in the release audit. A successful deploy is not the same as a completed Phase 2 audit.

