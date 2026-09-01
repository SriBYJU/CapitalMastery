# Capital Mastery Phase 2 — Current Production Evidence

**Evidence date:** September 1, 2026  
**Canonical site:** `https://sribyju.github.io/CapitalMastery/`  
**Cloudflare mirror:** `https://capitalmastery.pages.dev/`  
**Production API:** `https://capital-mastery-api.avadhanula-shriyan.workers.dev`

## Exact generations

- `08d0781` — enforced canonical no-skip progression, locked read-only look-ahead, permanent passed assessments, saved failed-attempt review, exact resume and Role Lab/final prerequisites.
- `2295dcd` — made server-authoritative passes monotonically restore the signed-in local/user-scoped state.
- `51de102` / `fd6ddbd` — removed assessment-review hydration races, prevented count-to-percent corruption and made continuity stable under repeated auth/router/CDN timing.
- `669a1b1` — added idempotent retry plus remote verification for ambiguous Firestore identity writes and retry-safe disposable cleanup.
- `1999bfa` — updated the live release sentinels to the exact current production assets.
- `3c836a9` — recorded the completed course-integrity production evidence and the remaining privileged closure boundary.
- `51298de` — hardened the disposable live Firestore verifier with cross-account isolation, anonymous denial, schema rejection and asserted document/identity cleanup.
- `a180818` — added exact-target Admin Demo cleanup, idempotent synthetic-tenant creation and the authenticated Admin closure probe; this Worker generation is deployed.
- `7a258ae` — made the Admin closure probe deterministic and interruption-safe even when the first create response is ambiguous.

The exact deployed frontend source is `669a1b1bc82f4025101a135e3d09c18bd07e51d9`; the exact deployed Worker source is `a18081853d0f0a1915a697a2f87ef6d8848d8994`. Commit `1999bfafcb1a5329291a5eeee9f8c0fc947d4609` changes frontend release sentinels only. Commit `7a258ae1f9fb15c46a04c1bf1ba38b9b09c0086a` changes the privileged verifier only, not the deployed runtime.

## Verified release results

- Dependency-free source regressions: **85 / 85 PASS**.
- Exact local release browser matrix: **18 / 18 PASS**.
- Failure-seeking / adversarial gate: **PASS** at verifier head `7a258ae1f9fb15c46a04c1bf1ba38b9b09c0086a`, run `33551277551`.
- Live production read-only gate: **PASS** against the promoted Worker at verifier head `7a258ae1f9fb15c46a04c1bf1ba38b9b09c0086a`, run `33551277570`.
- Phase 2 current-source audit: **PASS** for Worker generation `a18081853d0f0a1915a697a2f87ef6d8848d8994`, run `33550631569`.
- Audited Worker package: **PASS** for Worker generation `a18081853d0f0a1915a697a2f87ef6d8848d8994`, run `33550631574`.
- Audited Pages package: **PASS**, run `33522858804`.
- GitHub Pages deployment: **PASS** at verifier head `7a258ae1f9fb15c46a04c1bf1ba38b9b09c0086a`, run `33551276331`.
- GitHub Pages live browser matrix at verifier head `7a258ae1f9fb15c46a04c1bf1ba38b9b09c0086a`: **18 / 18 PASS**, run `33551277604`.
- Live Firebase provider-safety and disposable email/password lifecycle: **PASS**, run `33523908643`.
- Direct live-primary disposable account lifecycle: **PASS** — create, one-time full-name save, intentional reload, fresh-browser Firestore recovery, data deletion and Firebase account cleanup.
- Cloudflare mirror browser matrix: **18 / 18 PASS** against `https://capitalmastery.pages.dev/`, including provider fail-safe behavior.
- Production D1 migrations 016–018: **already present and validated**; `quick_check = ok`; foreign-key violations `0`; before/after counts preserved across 11 audited tables. No migration ran during this release.
- Production Worker version `f77c74da-d85e-49a0-9d95-389c74efbbbb`: health `200`; unapproved origin `403`; unauthenticated auth check `401`; protected integrity route `401`; Admin Demo discovery/reset `401` without authentication. The opaque `ADMIN_UID` binding remained present. Post-deploy D1 `quick_check = ok`, foreign-key violations `0`, rows written `0`.
- Cloudflare Pages deployment: exact allowlisted 56-file artifact; deployment `9b11735f.capitalmastery.pages.dev`; production alias/header verification PASS (`X-Frame-Options: DENY`, Permissions Policy present).
- Repository: clean after final push.

The browser matrix covers explicit locked/current/completed/retry states, direct-route no-skip enforcement, exact reload-safe resume, question-by-question permanent pass/failure review, forged-retake resistance, cross-device authoritative pass recovery, modern no-MCQ simulations, all 16 careers across both programs, employer role/invite boundaries, Admin isolation, program-completion verification, mobile guidance, corruption/offline recovery, and contrast across responsive widths.

## Final experience and campaign pass

The final usability pass adds:

- one exact “Continue where you left off” action backed by the canonical state machine;
- read-only look-ahead with controls withheld until prerequisites pass;
- permanent passed assessments with count, percentage, submitted answer, correct answer and rationale review;
- saved failed attempts with review first and an explicit retry action;
- visible local/sync/offline save confidence;
- contextual learner, workbench and employer guidance;
- safe last-activity resume behavior;
- seven-day device draft recovery for numeric, written and structured workbench fields;
- automatic draft removal after submission;
- direct-link simulation shell recovery; and
- stable workbench step navigation while smooth scrolling.

The ad kit now contains three vertical H.264 masters, including dedicated 18.6-second learner and employer cuts assembled from real product UI. The campaign explicitly avoids customer/endorsement claims and labels synthetic case data.

## Remaining external production closure boundary

The intended Firestore rules are correct in source and compile in the release workflow. The owner-only `users/{uid}/progress/state` compatibility path works, and the complete live signup/name/reload/fresh-device lifecycle passes. The save path now also retries idempotently and verifies an already-committed document after ambiguous Firestore 5xx responses, closing the learner-facing failure observed during this release.

An additional disposable live rules probe on September 1 directly exercised both paths. The compatibility progress write passed, while the protected `users/{uid}` identity write returned `403 PERMISSION_DENIED`. The hardened verifier additionally proved progress cross-account isolation, anonymous denial, progress schema enforcement and successful removal of the disposable documents and both Firebase identities. User-root negative checks were denied as expected but remain independently uncertifiable until the owner-positive user-root write passes. This is explicit evidence that the checked-in protected-root rule has not yet been promoted to the live Firestore project; it is not an application-flow inference.

The exact checked-in rules compiled successfully in the GitHub Java 21 Firestore emulator, run `33529328549`. The fail-closed workflow then stopped at `Require Firebase deployment credential`, before any production mutation. A fresh authorization audit confirmed: Firebase CLI has no authorized accounts; the GitHub repository has no secrets; the GitHub `production` environment has no secrets; and the Cloudflare Worker retains an opaque `ADMIN_UID` secret binding whose value is correctly not readable through the deployment surface.

Formal evidence still requires a rules deployment/probe performed with a Firebase-authorized operator so the protected user-root fields can be certified independently of the compatibility path.

The rules release cannot be completed from the present machine or GitHub configuration because all three authorization paths are absent:

- Firebase CLI reports **no authorized accounts**.
- The GitHub repository has no Firebase deployment secret.
- The GitHub `production` environment has no Firebase deployment secret.

Required one-time authorization: either sign the Firebase CLI into an account that can deploy rules to `capital-mastery26`, or add `FIREBASE_SERVICE_ACCOUNT_CAPITAL_MASTERY26` (preferred) / `FIREBASE_TOKEN` to the GitHub production environment. Then run **Firebase Firestore rules release** and require `tests/live-firestore-rules-probe.cjs` plus the disposable live Firebase lifecycle to pass.

No application-level permission can substitute for this Google/Firebase account authorization, and no secret should be committed to the repository.

## Additional privileged evidence boundary

The underlying production D1 database has already passed the audited integrity preflight. The deployed Worker now advertises exact-target synthetic cleanup, rejects every non-`demo_org_` cleanup target, and supports idempotent closure-probe creation. `tests/live-admin-closure-probe.cjs` verifies the protected identity, pre/during/post D1 integrity, a deterministic three-learner tenant, retry reuse, learner-state transition, permission evidence, exact cleanup and preservation of every pre-existing demo tenant. It refuses to create data unless the targeted-cleanup capability is present and computes the deterministic cleanup target before its first create request.

Executing that probe still requires a fresh Firebase ID token whose UID matches the opaque production `ADMIN_UID`. That identity is not available on the present machine and cannot be fabricated with a normal learner account; the deployed Worker correctly rejects that escalation.

Phase 2 production behavior, course integrity, both public mirrors and disposable-account release gates are green. Formal closure remains withheld until the live Firestore rules probe and the remaining privileged administrator verification are performed with real authorized credentials.
