# Production deployment runbook

Capital Mastery uses three separately deployed surfaces:

- GitHub Pages serves the canonical public browser application directly from protected `main`.
- Cloudflare Pages serves a secondary frontend-only mirror with Cloudflare response headers.
- The Cloudflare Worker serves authenticated API routes and uses D1 for authoritative assessment, evidence, credential, and employer records.

Keeping those deploys separate is a security boundary. Never deploy the repository root to Pages: it contains Worker implementation, tests, migrations, and operational documentation that are not browser assets.

## Required deployment access

GitHub Actions production promotion requires these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The token must have only the permissions required to deploy the existing `capital-mastery-api` Worker and `capitalmastery` Pages project. Do not commit Cloudflare credentials, Firebase administrator tokens, or the protected Worker `ADMIN_UID` value to the repository.

The Worker deployment inherits its production configuration from `wrangler.jsonc`, including:

- Worker name `capital-mastery-api`
- D1 binding `DB` → `capital-mastery-prod`
- Firebase project `capital-mastery26`
- production/GitHub Pages origin allowlist
- `keep_vars: true`
- observability configuration
- required protected secret `ADMIN_UID`

A normal Worker deploy must preserve the existing `ADMIN_UID` secret. Never replace production secrets with placeholders during release.

## Authoritative automated gates

The permanent release workflows are:

- `Failure-seeking audit round 2` — Worker/frontend syntax, security and product regressions, production bundle audit, then the real Chromium browser matrix.
- `Phase 2 current-source audit` — Worker/frontend syntax, D1 integrity-route contract, every static `.mjs` audit, and production bundle verification.
- `Package audited Pages release` — rebuilds `dist-pages/`, reruns the production-bundle audit, and uploads the exact audited Pages directory as a release artifact.
- `Package audited Worker release` — packages the reviewed Worker source after Worker/security/credential-boundary checks.
- `Cloudflare deploy readiness` — non-deploying preflight that proves the Pages artifact builds and checks whether Cloudflare Actions credentials are present without printing them.
- `GitHub Pages live read-only audit` — waits for branch-based publication, checks that backend/QA artifacts remain private, and runs all 17 Chromium suites against the primary site.
- `Cloudflare production release` — guarded manual Worker and secondary-mirror promotion. It requires the workflow input `RELEASE`, reruns source/bundle gates, verifies public/security boundaries, and audits the mirror.
- `Live production readonly audit` — non-mutating primary-production diagnostic.

Do not continue if the source/adversarial gates are red. Browser-only Playwright audits are intentionally run after Playwright/Chromium installation; do not treat them as ordinary dependency-free static tests.

## Current production topology

- Primary: `https://sribyju.github.io/CapitalMastery/`
- Secondary mirror: `https://capitalmastery.pages.dev/`
- API: `https://capital-mastery-api.avadhanula-shriyan.workers.dev/`

Every accepted push to `main` is published through the repository's configured branch-based GitHub Pages deployment. The live read-only workflow waits for the new generation and audits it. Cloudflare credentials are needed only for the Worker and secondary mirror, not to publish the primary frontend.

See `docs/phase2-release-audit.md` for the exact current artifact IDs, digests, release-gate SHA and live blockers.

## Local source preflight

```bash
node --check capital-mastery-live.js
node --check enterprise-v2.js
node --check v2/worker-v2-phase1-release.js
node tests/d1-integrity-endpoint-audit.mjs
node tests/release-security-abuse-audit.mjs
node tests/career-skills-five-level-boundary-audit.mjs
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

The build recreates `dist-pages/` from the explicit frontend allowlist. It adds production security headers and intentionally excludes Worker code, tests, migrations, Firebase diagnostics, repository documentation, `auth-test.html`, Wrangler configuration, and other backend/internal artifacts.

For a release candidate, retain the artifact produced by `Package audited Pages release`. Its artifact name contains the exact commit SHA so the secondary Cloudflare deployment can be traced back to audited source. Do not add files to `dist-pages/` after its bundle audit.

## Primary frontend promotion

1. Merge or push the audited commit to `main`.
2. Wait for GitHub Pages to publish the commit.
3. Require `GitHub Pages live read-only audit` to pass the generation/privacy boundary and all 17 browser suites.
4. Confirm the canonical metadata, sitemap and Firebase authorized-domain check point to `https://sribyju.github.io/CapitalMastery/`.

## Worker and secondary-mirror promotion

Once both Cloudflare Actions secrets exist:

1. Confirm `docs/phase2-release-audit.md` has no new source blocker.
2. In GitHub Actions, run **Cloudflare production release**.
3. Enter exactly `RELEASE` in the confirmation field.
4. If a protected GitHub `production` environment requires approval, approve only after confirming the intended commit SHA.
5. Do not separately upload the repository root or run another Worker deployment during the workflow.

The workflow performs this order:

1. Verify Cloudflare credential presence.
2. Re-run Worker/frontend syntax, security, credential-boundary and static regression gates.
3. Rebuild and audit `dist-pages/`.
4. Deploy the Worker with `wrangler.jsonc`.
5. Require Worker `/health = 200` from the primary Origin.
6. Require a deliberately unapproved Origin to return `403`.
7. Require unauthenticated `/auth-check` to return `401`.
8. Require `/admin/integrity` to exist and remain protected (`401`/`403`, never `404` unauthenticated).
9. Deploy exactly `dist-pages/` to Pages project `capitalmastery`.
10. Require current generation markers plus `X-Frame-Options: DENY` and `Permissions-Policy` on the Cloudflare mirror.
11. Run the 17-suite Chromium release matrix against `https://capitalmastery.pages.dev` as a secondary-host regression.

The UI is designed to remain backward-compatible with the previous Worker during rollout. The Worker must accept the previous UI until the Pages deployment is verified.

## Manual deployment order

If GitHub Actions cannot be used but an authorized Cloudflare environment is available, preserve the same order and gates:

1. Deploy the reviewed Worker source using the checked-in `wrangler.jsonc`.
2. Run `/health` from the approved production origin and confirm D1 reachability.
3. Verify an unapproved origin is rejected and unauthenticated protected routes remain blocked.
4. Verify unauthenticated `GET /admin/integrity` is protected and no longer returns `404`.
5. With an authenticated Capital Mastery administrator, call read-only `GET /admin/integrity`. Require `quick_check = ok`, no foreign-key violations, and record table counts.
6. Build/audit `dist-pages/` or use the exact audited Pages artifact.
7. Deploy only `dist-pages/` to the `capitalmastery` Pages project.
8. Verify mirror generation markers and production security headers.
9. Run the secondary-mirror browser matrix.

Never guess Cloudflare account IDs, tokens, project names, Worker bindings, secrets, or Firebase configuration.

## Live verification matrix

| Surface | Required proof |
|---|---|
| Public | Home, Careers, Employers, public credential verification, and representative career pages render without application errors. |
| Learner | Assigned program opens; official assessment submits; Career Skills completion behaves as program completion; Professional Readiness preserves five verified levels; Role Lab resumes; material updates change required work; credential state matches D1. |
| Employer | Organization setup, cohort, track assignment, invite, learner evidence, manager review, readiness export, alerts, and activity log work with correct scope. |
| Firm Layer | Add, edit, reorder, hide, archive, restore, history, version publish, deep links, and parent navigation work; no permanent employer delete is exposed. |
| Security | Unauthenticated API requests fail safely; an unapproved Origin is rejected; cross-organization access is denied; backend/test paths are absent from Pages; no answer key appears in browser responses; CSV exports neutralize spreadsheet-formula prefixes. |
| Database | `/health` reaches D1; authenticated admin integrity returns `quick_check = ok`, zero foreign-key violations, and recorded table counts. |
| Responsive/accessibility | 375, 430, 768 and ~1440 px browser passes; keyboard operation, focus visibility, reduced motion, mobile navigation, and primary workbench forms remain usable. |

## Firebase closure check

Before Phase 2 closure, Firebase Authentication → Settings → Authorized domains must include:

`sribyju.github.io`

This must be observed directly. Do not infer it solely because email/password auth works; Google OAuth on the primary host is the important configuration check. Keep `capitalmastery.pages.dev` authorized while the mirror remains available.

## Authenticated post-deploy closure

The automated workflows deliberately do **not** claim the authenticated release is complete. After automated primary and API checks pass, perform:

- signed-in learner assessment/progress smoke;
- Career Skills practical-capstone/program-certificate smoke;
- Professional Readiness five-level/Role Lab/final smoke;
- credential issuance and public verification consistency;
- signed-in employer workspace and five-role boundary spot checks;
- Firm Layer create/edit/version/reorder/hide/archive/restore spot check;
- manager review, report, CSV, evidence JSON and notification spot check;
- second-company tenant-isolation spot check;
- Admin Demo/Test Lab spot check;
- authenticated `/admin/integrity` execution;
- disposable QA account/data cleanup;
- post-cleanup integrity verification.

## Rollback rules

If the Worker deploy fails its boundary checks, stop before Pages promotion. Restore the previous known-good Worker deployment through Cloudflare or redeploy the previous reviewed Worker source before continuing.

If the Worker is healthy but Pages verification fails, keep/revert Pages to the previous known-good deployment. Do not make unreviewed frontend edits directly in Cloudflare to “fix” production.

If primary browser tests fail after publication, treat production as blocked. Preserve logs/evidence, fix source in GitHub, rerun source/adversarial gates, and publish a corrected commit. A mirror failure does not redirect the canonical URL but must still be repaired before relying on the mirror.

Never resolve a release failure by disabling origin checks, weakening authentication/RBAC, exposing answer keys, bypassing D1 authority, or removing production security headers.

## Release evidence

Record all of the following before calling the release complete:

- source commit SHA;
- successful failure-seeking and current-source audit runs;
- Worker deployment identifier/time;
- D1 integrity result and table counts;
- Pages artifact name/digest and Cloudflare deployment identifier/time;
- live response-header/generation result;
- 17 primary Chromium results;
- signed-out public smoke;
- signed-in learner smoke;
- signed-in employer/admin/second-tenant smoke;
- disposable QA account/data cleanup result;
- Firebase Authentication authorized-domain verification;
- every unresolved blocker.

A successful deploy is not the same as a completed Phase 2 audit. Do not mark Phase 2 complete while any release-evidence item above is unknown or failing.
