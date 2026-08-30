# Capital Mastery V2 — Phase 2 Release Audit

**Audit date:** August 30, 2026  
**Status:** SOURCE / CI RELEASE CANDIDATE GREEN · CANONICAL PRODUCTION BLOCKED  
**Canonical frontend:** `https://capitalmastery.pages.dev`  
**Worker:** `https://capital-mastery-api.avadhanula-shriyan.workers.dev`

> A green source build is not equivalent to a completed production release. Phase 2 must not be marked complete while the Cloudflare deployment, Firebase authorized-domain check, authenticated production evidence, or cleanup evidence below remains unresolved.

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

The audited build reports **42 root frontend files plus `assets/` and `_headers`**. The deterministic release-packaging job below counts **53 emitted deployable files** in total.

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

## 3. Post-gate repository cleanup proof

The fully audited product commit is `ebcb93dd0c8315afa33e33b48ac9f9e22810d81a`.

After that gate, the repository received only:

- stronger deterministic Pages/Worker packaging workflows; and
- deletion of one-use credential-migration workflows/scripts.

A GitHub compare from `ebcb93dd...` through cleanup commit `b9b05f4f89f90a258ea563ce7c6b63ad83926f53` shows **no deployable frontend file and no Worker source change**. The temporary malformed workflow that generated false-red Actions checks was removed.

Therefore the product bytes packaged above are the same product generation that passed the full adversarial source gate.

## 4. D1 integrity release contract

Source contains an administrator-only, read-only:

`GET /admin/integrity`

It performs:

- `PRAGMA quick_check`
- `PRAGMA foreign_key_check`
- sanitized per-table `COUNT(*)` queries

It returns integrity results and counts only. It does not expose arbitrary table rows, provide a generic SQL console, or mutate D1.

**Source contract:** PASS  
**Production execution:** NOT YET VERIFIED because the deployed Worker is stale.

## 5. Latest canonical production diagnostic

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

## 6. GitHub Pages fallback

GitHub Pages has continued to build successfully from current `main`. This is useful fallback/deployment evidence but does **not** replace the required canonical Cloudflare release and production checks.

## 7. Remaining Phase 2 blockers

### Cloudflare production promotion

1. Promote the exact audited Worker source while preserving production binding inheritance and protected settings.
2. Re-probe `/health`, bad Origin, unauthenticated protected routes and `/admin/integrity`; the integrity route must be present and protected rather than `404`.
3. With the configured Capital Mastery administrator, execute `/admin/integrity`; require `quick_check = ok`, zero foreign-key violations and record table counts.
4. Promote the exact audited `dist-pages/` artifact to the `capitalmastery` Pages project.
5. Verify generation markers and security headers against `capitalmastery.pages.dev`.
6. Rerun all six Chromium suites against the canonical Cloudflare host.

No Cloudflare deployment connector/plugin or usable deployment credential is available in the current tool environment. Production must not be changed by guessing credentials, bindings, account IDs or deployment parameters.

### Firebase authorized-domain verification

In Firebase Authentication → Settings → Authorized domains, verify that:

`capitalmastery.pages.dev`

is authorized. This remains **unverified**, particularly for Google sign-in on the canonical host.

### Final authenticated canonical-production closure

After both Cloudflare surfaces are current:

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

## 8. Closure rule

Do **not** declare Phase 2 complete until:

- both Cloudflare surfaces are current;
- canonical live Chromium checks are green;
- authenticated D1 integrity is clean;
- Firebase authorized-domain configuration is verified;
- signed-in learner/employer/admin/second-tenant and cleanup smokes pass; and
- no release blocker remains open.

Search Console submission remains intentionally deferred until Phase 2 closure.
