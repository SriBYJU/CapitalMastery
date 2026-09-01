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

The exact deployable application/Worker source is `669a1b1bc82f4025101a135e3d09c18bd07e51d9`. Commit `1999bfafcb1a5329291a5eeee9f8c0fc947d4609` changes release sentinels only; later commits update release evidence without changing the deployable application.

## Verified release results

- Dependency-free source regressions: **84 / 84 PASS**.
- Exact local release browser matrix: **18 / 18 PASS**.
- GitHub Pages live browser matrix: **18 / 18 PASS**, run `33522858871`.
- Failure-seeking / adversarial gate: **PASS**, run `33522858887`.
- Live production read-only gate: **PASS**, run `33523908480`.
- Audited Pages package: **PASS**, run `33522858804`.
- GitHub Pages deployment: **PASS**, including evidence-only head `3c836a93ab4d36f618d71f6dab74c43a0e6ba200`, run `33524271038`.
- Live Firebase provider-safety and disposable email/password lifecycle: **PASS**, run `33523908643`.
- Direct live-primary disposable account lifecycle: **PASS** — create, one-time full-name save, intentional reload, fresh-browser Firestore recovery, data deletion and Firebase account cleanup.
- Cloudflare mirror browser matrix: **18 / 18 PASS** against `https://capitalmastery.pages.dev/`, including provider fail-safe behavior.
- Production D1 migrations 016–018: **already present and validated**; `quick_check = ok`; foreign-key violations `0`; before/after counts preserved across 11 audited tables. No migration ran during this release.
- Production Worker version `17ae7406-dcb5-43c9-8b8b-b1c2ff1378fc`: health `200`; unapproved origin `403`; unauthenticated auth check `401`; protected integrity route `401`.
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

An additional disposable live rules probe on September 1 directly exercised both paths. The compatibility progress write passed, while the protected `users/{uid}` identity write returned `403 PERMISSION_DENIED`. The disposable identity and compatibility document were cleaned by the probe. This is explicit evidence that the checked-in protected-root rule has not yet been promoted to the live Firestore project; it is not an application-flow inference.

Formal evidence still requires a rules deployment/probe performed with a Firebase-authorized operator so the protected user-root fields can be certified independently of the compatibility path.

The rules release cannot be completed from the present machine or GitHub configuration because all three authorization paths are absent:

- Firebase CLI reports **no authorized accounts**.
- The GitHub repository has no Firebase deployment secret.
- The GitHub `production` environment has no Firebase deployment secret.

Required one-time authorization: either sign the Firebase CLI into an account that can deploy rules to `capital-mastery26`, or add `FIREBASE_SERVICE_ACCOUNT_CAPITAL_MASTERY26` (preferred) / `FIREBASE_TOKEN` to the GitHub production environment. Then run **Firebase Firestore rules release** and require `tests/live-firestore-rules-probe.cjs` plus the disposable live Firebase lifecycle to pass.

No application-level permission can substitute for this Google/Firebase account authorization, and no secret should be committed to the repository.

## Additional privileged evidence boundary

The underlying production D1 database has already passed the audited integrity preflight. A final authenticated call to the administrator-only `/admin/integrity` route and a disposable production Admin Demo/tenant cleanup exercise require an authorized production Admin identity. These actions cannot be fabricated with a normal disposable learner account; the Worker correctly rejects that escalation.

Phase 2 production behavior, course integrity, both public mirrors and disposable-account release gates are green. Formal closure remains withheld until the live Firestore rules probe and the remaining privileged administrator verification are performed with real authorized credentials.
