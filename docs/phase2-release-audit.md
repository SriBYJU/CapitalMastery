# Capital Mastery V2 — Phase 2 Release Audit

**Audit date:** August 31, 2026

**Status:** PRODUCTION RELEASED · PUBLIC + DISPOSABLE AUTH GATES GREEN · PRIVILEGED FIREBASE/ADMIN CLOSURE BLOCKED

**Canonical frontend:** `https://sribyju.github.io/CapitalMastery/`

**Secondary mirror:** `https://capitalmastery.pages.dev/`

**Worker:** `https://capital-mastery-api.avadhanula-shriyan.workers.dev`

> **September 1 current-status update:** the canonical GitHub Pages generation, 17-suite live browser matrix, failure-seeking gate, production read-only gate, provider-safety probe and full disposable Firebase account/name/fresh-device/cleanup lifecycle are green. Production D1 migrations 016–018 are applied with clean integrity. Formal closure is now held by missing Firebase rules-deployment authorization and remaining Admin-only live evidence—not by an open public learner-flow failure. See [`release-evidence/phase2-status-2026-09-01.md`](release-evidence/phase2-status-2026-09-01.md) for current SHAs, workflow runs and the exact external boundary. Historical artifact details below are retained for traceability.

## 1. Authoritative corrected product gate

The final source-level product correction separated **verified Standard 2.0 credentials** from the shorter Career Skills program-completion certificate.

### Credential architecture

Every career has exactly five verified Standard 2.0 credential levels:

1. Foundations
2. Essentials
3. Applied Skills
4. Role Lab
5. Professional Readiness

Across 16 careers this remains **80 verified career credential definitions**. Academy credentials remain a separate cross-career layer.

Program semantics are now explicit:

- **Career Skills Program:** 3 verified Standard 2.0 credentials — Foundations, Essentials and Applied Skills — plus one **Career Skills Program Completion Certificate** after the practical capstone.
- **Professional Readiness Program:** all 5 verified Standard 2.0 credentials.
- The Career Skills completion certificate is **not a sixth Standard 2.0 credential**.
- Existing legacy/internal `career` credential records remain compatible and publicly verifiable; current product surfaces classify that record as program completion rather than an additional V2 ladder level.
- Career Skills work carries forward into Professional Readiness without repeating already earned shared stages.

A permanent regression, `tests/career-skills-five-level-boundary-audit.mjs`, now enforces this distinction across the Worker catalog, learner UI, employer exports and public verification.

### Full adversarial release gate

**Release-gate commit:** `ebcb93dd0c8315afa33e33b48ac9f9e22810d81a`  
**Workflow run:** `33293191903`  
**Result:** **PASS**

Evidence:

- Worker and frontend JavaScript syntax: PASS
- D1 integrity endpoint contract: PASS
- release security / abuse controls: PASS
- all **60 dependency-free static regression files**: PASS
- production Pages bundle audit: PASS
- state-resilience Chromium audit: PASS
- failure-seeking Chromium torture audit: PASS
- learner-guide all-panel mobile Chromium audit: PASS
- all-career two-track Chromium sweep: **16 careers × both programs × four release widths PASS**
- employer public walkthrough / calculator Chromium audit: PASS
- employer browser role matrix: **Owner, Training Admin, Content Manager, Manager and Viewer PASS**

The release-width sweep covers 375, 430, 768 and ~1440 px.

The audited build reports **42 root frontend files plus `assets/` and `_headers`**. Deterministic release packaging counts **53 emitted deployable files** in total.

## 2. Deterministic release artifacts

### Cloudflare Pages candidate

**Packaging commit:** `f1c9b37f101f7deca43cb3e057223a8fe22326bf`  
**Workflow run:** `33293311098`  
**Artifact:** `capitalmastery-pages-f1c9b37f101f7deca43cb3e057223a8fe22326bf`  
**Artifact ID:** `9726627582`  
**Artifact ZIP size:** `855,917 bytes`  
**Artifact ZIP digest:** `sha256:290726ad78e53c098068bc4621d9c77ebdd3a76b688282cd9aecffb5e75492b2`  
**Deployable file count:** `53`  
**Per-file manifest SHA-256:** `9458dced8fba89c7668ad2176d3b7aff4dce7abe15228729fc575c5732497fbf`

Packaging checks passed:

- employer source syntax
- CSV export formula-injection / escaping security
- five-level Career Skills / Professional Readiness credential boundary
- production-only Pages build
- backend/test/internal artifact exclusion
- baseline production security headers
- per-file SHA-256 manifest generation

Deploy `dist-pages/` only. Never deploy the repository root.

### Cloudflare Worker candidate

**Packaging commit:** `1b0e861e2d93aea8b0da4d0c0616868155bea096`  
**Workflow run:** `33293294318`  
**Artifact:** `capitalmastery-worker-1b0e861e2d93aea8b0da4d0c0616868155bea096`  
**Artifact ID:** `9726622409`  
**Artifact ZIP size:** `75,506 bytes`  
**Artifact ZIP digest:** `sha256:75f09e16da5f176a0710609044bd273dda5b933c1a265b260ebd87369d35b448`  
**Exact Worker source SHA-256:** `136dd73a08f0cfb2e5ea745a1490c7717a87fa56979cf9090e118757bef50243`

Worker packaging checks passed:

- JavaScript syntax
- D1 integrity endpoint contract
- release security / abuse controls
- 16-career V2 secure architecture
- Enterprise V2 contract
- least-privilege separation
- account-deletion contract
- five-level credential-boundary invariant

Production Worker promotion must preserve existing Cloudflare binding inheritance, including the protected `ADMIN_UID` secret, D1 binding, Firebase project, origin allowlist, compatibility settings and observability.

### Fresh deployment-preflight artifact

A fresh preflight was executed after repository cleanup:

**Preflight commit:** `c8844ad6140aa42b60e0d219eac206aee6c20563`  
**Workflow run:** `33294066702`  
**Artifact:** `capitalmastery-pages-c8844ad6140aa42b60e0d219eac206aee6c20563`  
**Artifact ID:** `9726843899`  
**Artifact ZIP size:** `852,090 bytes`  
**Artifact ZIP digest:** `sha256:e8b6e6b2bfd78a264517d89d87830a4e6dd021bed083da12a8d51b93095081f1`  
**Deployable file count:** `53`

The production Pages bundle audit passed before upload. The preflight then failed only because both deployment secrets were absent:

- `CLOUDFLARE_API_TOKEN_PRESENT=false`
- `CLOUDFLARE_ACCOUNT_ID_PRESENT=false`
- `CLOUDFLARE_DEPLOY_READY=false`

No secret value was printed or exposed.

## 3. Post-gate repository cleanup proof

The fully audited product commit is `ebcb93dd0c8315afa33e33b48ac9f9e22810d81a`.

After that gate, repository work was intentionally limited to non-deployable engineering hygiene and release documentation:

- stronger deterministic Pages/Worker packaging workflows;
- deletion of one-use migration, patch and hardening workflows;
- deletion of corresponding one-use mutation/diagnostic scripts;
- correction of credential-system and training-track documentation;
- archival of superseded Phase 1 root QA/checklist/live-release files under `docs/archive/` with an archive index;
- refresh of the Phase 2 release record;
- a non-deploying Cloudflare credential-presence preflight;
- a guarded manual-only `Cloudflare production release` workflow; and
- a turnkey production deployment/rollback runbook.

A GitHub compare from `ebcb93dd...` through cleanup commit `9bf92327113f43871d09edb7ce39b2e034709524` shows **no deployable frontend file and no Worker source change**. Current `main` therefore retains the same deployable product generation that passed the full adversarial source gate.

The workflow folder now contains seven permanent release/QA workflows:

- `cloudflare-deploy-readiness.yml`
- `cloudflare-production-release.yml`
- `failure-seeking-round2.yml`
- `live-production-readonly-audit.yml`
- `package-pages-release.yml`
- `package-worker-release.yml`
- `phase2-current-source-audit.yml`

The production-release workflow is `workflow_dispatch` only. It requires an explicit `RELEASE` confirmation and does not auto-deploy from ordinary commits.

## 4. D1 integrity release contract

Source contains an administrator-only, read-only:

`GET /admin/integrity`

It performs:

- `PRAGMA quick_check`
- `PRAGMA foreign_key_check`
- sanitized per-table `COUNT(*)` queries

It returns integrity results and counts only. It does not expose arbitrary table rows, provide a generic SQL console, or mutate D1.

**Source contract:** PASS  
**Production D1 execution:** PASS on August 31, 2026 through the audited release bridge. `quick_check = ok`, foreign-key violations = `0`, and before/after record counts were preserved. The deployed administrator route also exists and rejects unauthenticated access. An authenticated black-box call through that route remains part of final closure. Evidence: [`release-evidence/d1-production-preflight-2026-08-31.json`](release-evidence/d1-production-preflight-2026-08-31.json).

## 5. Historical production diagnostic — superseded August 31, 2026

The diagnostic in this section records the stale Cloudflare state observed on August 30. It is retained for audit history and is **not** the current production status. GitHub Pages is now the canonical frontend; Cloudflare Pages is a current secondary mirror; the Worker and production D1 migrations are current.

**Live workflow run:** `33292064136`  
**Result:** **BLOCKED**

### Pages generation — STALE

The canonical Cloudflare Pages HTML is missing current-generation release markers, including the current training-track, learner-guide and stability assets.

`LIVE_GENERATION_MATCH=0`

### Pages security headers — STALE DEPLOYMENT

Present on the older deployment:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

Missing from that stale live deployment:

- `X-Frame-Options: DENY`
- `Permissions-Policy`

The audited Pages bundle includes the expected production header configuration. Recheck only after the exact current artifact is promoted.

### Worker boundary — HEALTHY BUT GENERATION STALE

Current canonical Worker behavior:

- approved-origin CORS preflight: `204`
- `/health`: `200`
- deliberately unapproved Origin: `403`
- unauthenticated `POST /auth-check`: `401`
- unauthenticated `GET /admin/integrity`: `404`

The first four checks show the deployed Worker remains reachable with its existing origin/auth boundary. The `404` proves production predates the audited D1-integrity release.

### Live browser matrix — BLOCKED BY STALE PAGES

Against `capitalmastery.pages.dev`, the current learner track chooser, learner-guide tabs, current signed-out route behavior and employer public walkthrough are absent because the canonical frontend is old. The same six browser suites pass against the current audited source.

Do not interpret old-production browser failures as current-source failures; deploy the exact current artifacts first, then rerun the live matrix.

## 6. GitHub Pages primary

GitHub Pages is the canonical production frontend. The repository's configured branch deployment publishes accepted `main` commits, and `GitHub Pages live read-only audit` waits for the new generation, checks that internal artifacts remain private, and executes the 17-suite Chromium matrix. Cloudflare Pages remains a separately audited secondary mirror.

## 7. Production promotion path

A permanent guarded workflow now exists at:

`.github/workflows/cloudflare-production-release.yml`

For Worker or secondary-mirror changes, run **Cloudflare production release** manually and enter exactly `RELEASE`. The workflow:

1. refuses to run without both Cloudflare credentials;
2. reruns the source/static release gate;
3. rebuilds and audits the exact Pages allowlist;
4. deploys the Worker first using checked-in `wrangler.jsonc`;
5. verifies `/health`, bad-Origin rejection, unauthenticated auth blocking and protected `/admin/integrity` existence;
6. deploys exactly `dist-pages/` to project `capitalmastery`;
7. verifies mirror generation markers and Cloudflare security headers; and
8. runs the 17-suite Chromium release matrix against `capitalmastery.pages.dev`.

It deliberately does **not** claim Phase 2 closure because authenticated D1/Firebase/tenant/cleanup evidence remains separate.

## 8. Remaining Phase 2 blockers

### Production promotion — COMPLETE

- Worker deployed and boundary-checked.
- Cloudflare secondary mirror deployed from the audited frontend artifact.
- D1 migrations 016–018 applied with clean integrity and preserved counts.
- GitHub Pages selected as the canonical primary and configured for direct `main` publication.

### Firebase authorized-domain verification

In Firebase Authentication → Settings → Authorized domains, verify that:

`sribyju.github.io`

is authorized. Keep `capitalmastery.pages.dev` authorized while the secondary mirror remains available. Provider-safety and disposable email/password lifecycle audits cover the live primary; direct console verification remains required for Google sign-in configuration.

### Final authenticated canonical-production closure

With the production surfaces current, finish:

- signed-out public smoke
- signed-in learner smoke
- official assessment submission and authoritative progress state
- Career Skills completion-certificate behavior
- five-level Professional Readiness credential behavior
- Role Lab resume / revision behavior
- credential issuance / public verification consistency
- signed-in employer workspace smoke
- five-role boundary spot checks
- Firm Layer create/edit/version/reorder/hide/archive/restore spot check
- manager review / readiness report / CSV / evidence JSON / notifications spot check
- second-company tenant-isolation spot check
- Admin Demo/Test Lab production spot check
- authenticated D1 integrity execution
- disposable QA account/data cleanup and post-cleanup integrity verification

## 9. Closure rule

Do **not** declare Phase 2 complete until:

- the Worker, GitHub Pages primary and Cloudflare mirror are current;
- canonical live Chromium checks are green;
- authenticated D1 integrity is clean;
- Firebase authorized-domain configuration is verified;
- signed-in learner/employer/admin/second-tenant and cleanup smokes pass; and
- no release blocker remains open.

Search Console submission remains intentionally deferred until Phase 2 closure.
