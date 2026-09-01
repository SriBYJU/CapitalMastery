# Capital Mastery Phase 2 — Current Production Evidence

**Evidence date:** September 1, 2026  
**Canonical site:** `https://sribyju.github.io/CapitalMastery/`  
**Cloudflare mirror:** `https://capitalmastery.pages.dev/`  
**Production API:** `https://capital-mastery-api.avadhanula-shriyan.workers.dev`

## Exact generations

- `8a38575` — promoted GitHub Pages to the canonical origin.
- `1f86e88` — added experience confidence controls, contextual help/resume behavior, onboarding resilience and the final usability pass.
- `d034541` — repaired direct simulation deep links, workbench draft recovery and first-login credential persistence.
- `a10e00f` — added the learner/employer video campaigns and made the live Firebase audit wait for the exact deployed generation.

The latest repository and Pages deployment generation is `a10e00f8f54b6a1ca9ff46373ede22c9424f742c`. The deployable application source is unchanged from `d0345415498a0bf030a6a502a8a519150153d80f`; the later commit adds non-public ad assets and release-workflow reliability only.

## Verified release results

- Dependency-free source regressions: **84 / 84 PASS**.
- Local release browser matrix: **17 / 17 PASS**.
- GitHub Pages live browser matrix: **17 / 17 PASS**, run `33465800181`.
- Failure-seeking / adversarial gate: **PASS**, run `33465800207`.
- Live production read-only gate: **PASS**, run `33465800257`.
- Audited Pages package: **PASS**, run `33465800163`.
- GitHub Pages deployment for `d034541`: **PASS**, run `33465799462`.
- GitHub Pages deployment for `a10e00f`: **PASS**, run `33466327914`.
- Live Firebase provider-safety and disposable email/password lifecycle: **PASS**, run `33466328477`.
- Direct live-primary disposable account lifecycle: **PASS** — create, one-time full-name save, intentional reload, fresh-browser Firestore recovery, data deletion and Firebase account cleanup.
- Production D1 migrations 016–018: **applied**; `quick_check = ok`; foreign-key violations `0`; before/after counts preserved. See `d1-production-preflight-2026-08-31.json`.
- Production Worker boundary: healthy; approved origin accepted, unapproved origin rejected, unauthenticated protected access rejected.
- Repository: clean after final push.

The browser matrix covers course progression, assessment review/retake separation, pass continuity, direct-link and refresh recovery, modern no-MCQ simulations, all 16 careers across both tracks, employer role UI boundaries, invite lifecycle, Admin route isolation, program-completion verification, mobile learner guidance, state corruption/offline recovery, and contrast at responsive widths.

## Final experience and campaign pass

The final usability pass adds:

- visible local/sync/offline save confidence;
- contextual learner, workbench and employer guidance;
- safe last-activity resume behavior;
- seven-day device draft recovery for numeric, written and structured workbench fields;
- automatic draft removal after submission;
- direct-link simulation shell recovery; and
- stable workbench step navigation while smooth scrolling.

The ad kit now contains three vertical H.264 masters, including dedicated 18.6-second learner and employer cuts assembled from real product UI. The campaign explicitly avoids customer/endorsement claims and labels synthetic case data.

## External production closure blocker

The intended Firestore rules are correct in source and compile in the release workflow, but the current live project still rejects the new protected user-root credential fields with `403 PERMISSION_DENIED`. The owner-only `users/{uid}/progress/state` compatibility path works, and the complete live signup/name/reload/fresh-device lifecycle passes. This is therefore a deployment/configuration blocker, not an active learner-facing failure.

The rules release cannot be completed from the present machine or GitHub configuration because all three authorization paths are absent:

- Firebase CLI reports **no authorized accounts**.
- The GitHub repository has no Firebase deployment secret.
- The GitHub `production` environment has no Firebase deployment secret.

Required one-time authorization: either sign the Firebase CLI into an account that can deploy rules to `capital-mastery26`, or add `FIREBASE_SERVICE_ACCOUNT_CAPITAL_MASTERY26` (preferred) / `FIREBASE_TOKEN` to the GitHub production environment. Then run **Firebase Firestore rules release** and require `tests/live-firestore-rules-probe.cjs` plus the disposable live Firebase lifecycle to pass.

No application-level permission can substitute for this Google/Firebase account authorization, and no secret should be committed to the repository.

## Additional privileged evidence boundary

The underlying production D1 database has already passed the audited integrity preflight. A final authenticated call to the administrator-only `/admin/integrity` route and a disposable production Admin Demo/tenant cleanup exercise require an authorized production Admin identity. These actions cannot be fabricated with a normal disposable learner account; the Worker correctly rejects that escalation.

Phase 2 production behavior and public release gates are green. Formal closure remains withheld until the live Firestore rules release and the remaining privileged verification are performed with real authorized credentials.
