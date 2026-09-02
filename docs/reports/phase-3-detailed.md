# Phase 3 — Detailed Report

## Executive result

Phase 3 implemented the project-level assurance controls that are valuable now and available at zero additional cost. It deliberately did not manufacture paperwork that would be meaningless for an unregistered project or imply that an external auditor, security firm, lawyer or customer identity provider had approved the product.

The assurance implementation checkpoint is `b02255fc1b719b31a4cc81a5aeda3ca0fbd92753`, dated September 2, 2026. The final application candidate is `16b0bd2c59ba3939f9935b4e40311227e9925736`. That candidate also separates passed-assessment Continue and Review actions at first paint and makes the Continue destination program-aware before any asynchronous enhancement runs.

## Browser and supply-chain hardening

The canonical HTML now includes a restrictive document Content Security Policy. It limits scripts to the application, Firebase SDK host and jsDelivr; connections to the application, Google APIs and the production Worker; images to expected sources; and frames to the required Google/Firebase authentication endpoints. Object embedding and foreign form destinations are denied.

The Cloudflare Pages build sends the policy as a response header and additionally denies framing with `frame-ancestors 'none'` and upgrades insecure requests. GitHub Pages cannot be configured from this repository to send arbitrary response headers, so its document policy is supplied by the HTML meta element. This distinction is documented rather than hidden.

The three dynamically loaded certificate dependencies—QRCode, jsPDF and pdf-lib—are pinned with verified SHA-384 Subresource Integrity and anonymous CORS. A changed or tampered CDN response will not silently execute under those integrity values.

## API hardening

The Worker now evaluates the origin allowlist before returning any preflight response, so an unapproved browser origin does not receive a permissive OPTIONS result. Bearer token input has an explicit 4,096-character ceiling. JSON endpoints require the `application/json` media type while still accepting a normal charset parameter; JSON-shaped bodies sent as text/plain or without a content type receive HTTP 415.

Worker JSON responses add no-referrer, restrictive Permissions Policy and framing denial alongside the existing no-store and MIME-sniffing controls. Authentication and server-side role checks remain the actual security boundary; CORS is documented as a browser-abuse control, not identity.

## Keyboard and dialog reliability

The SPA main landmark is programmatically focusable for skip navigation. The shared modal now receives a resolved accessible name, focus on open, trapped Tab/Shift+Tab navigation, Escape dismissal and focus return.

A live browser check found that the signed-out learning-account gate and credential-name onboarding used separate modal code and did not receive those protections. Phase 3 added the same focus containment and focus return there. Required first-time name onboarding does not allow Escape to bypass the required identity step; voluntary name editing does.

The permanent browser audit covers ten major public routes for landmark, heading, duplicate-ID, image-alt, control-name, label and tabindex structure. It also exercises the shared mobile menu and signed-out learning gate for naming, focus entry, Escape and focus return.

## Free monitoring and resilience

The daily GitHub Actions monitor checks the canonical frontend, logo, Worker/D1 health, API protective headers, bad-origin normal/preflight denial, unauthenticated denial and unknown-route behavior. It produces a readable job summary and requires no secret.

The weekly bounded resilience workflow sends 24 read-only requests per target at concurrency four. The script refuses accidental live use without an explicit flag and caps configuration at 60 requests per target and concurrency six. It records success plus p50, p95 and p99 time. This is a regression alarm, not a certified load test or capacity promise.

## Recovery and incident readiness

The operations pack now contains:

- a threat model for assets, trust boundaries, credible threats, controls and residual limits;
- a severity-based incident playbook with first-15-minute, containment, recovery and closeout actions;
- a recovery runbook covering known-good Git redeployment and D1 Time Travel; and
- a monitoring guide with response steps and schedule limitations.

D1 Time Travel is always available on the current service and provides a seven-day point-in-time window on the Free plan. Destructive restoration is intentionally not automated. A confirmed incident, current bookmark and chosen restore point are required.

Read-only production inspection on September 2 reported 37 D1 tables, `PRAGMA quick_check = ok`, zero foreign-key violations, zero rows written and no database change.

## Verification results

- 88 / 88 dependency-free static audit files: PASS.
- Production Pages allowlist/security audit: PASS.
- Worker 4.128.0 dry-run package: PASS.
- Workflow YAML parsing: PASS.
- In-app browser public route structure check: PASS on the exercised public surfaces.
- In-app browser signed-out learning-gate naming, focus entry, Escape and focus return: PASS.
- Primary production health/security monitor: PASS, 7 / 7 checks.
- Mirror production health/security monitor: PASS, 7 / 7 checks.
- Bounded live static-shell run: 24 / 24, p50 13 ms, p95 60 ms and p99 131 ms.
- Bounded live Worker/D1 health run: 24 / 24, p50 83 ms, p95 495 ms and p99 495 ms.
- Worker deployment version: `8e290984-631f-4975-b37e-12a5103aa2b6`.
- Cloudflare Pages deployment preview: `https://12ec6f03.capitalmastery.pages.dev` promoted to the main mirror.

## Exact release evidence

All of the following completed successfully against application candidate `16b0bd2c59ba3939f9935b4e40311227e9925736`:

- GitHub Pages build and deployment: [33653905193](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653905193).
- Audited Pages package: [33653906508](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906508).
- Deployable encoding audit: [33653906070](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906070).
- Course assessment-state validation: [33653906066](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906066).
- Firm-ready workbench validation: [33653906078](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906078).
- Full firm-ready course validation: [33653906352](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906352).
- GitHub Pages nineteen-suite live browser matrix: [33653906156](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906156).
- Failure-seeking static and browser audit: [33653906193](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906193).
- Live production frontend/Worker/browser audit: [33653906283](https://github.com/SriBYJU/CapitalMastery/actions/runs/33653906283).
- Real Firebase provider-safety and disposable email/password lifecycle: [33654669325](https://github.com/SriBYJU/CapitalMastery/actions/runs/33654669325).
- Production availability/security monitor: [33654672077](https://github.com/SriBYJU/CapitalMastery/actions/runs/33654672077).
- Bounded read-only resilience check: [33654674878](https://github.com/SriBYJU/CapitalMastery/actions/runs/33654674878).
- Audited Worker package: [33654835075](https://github.com/SriBYJU/CapitalMastery/actions/runs/33654835075).

The primary and mirror each passed the seven-check health/security monitor after deployment. The exact course pass-continuity browser scenario also passed directly against both live origins.

## Claim boundary

Phase 3 materially improves the product’s first-party security, recoverability, monitoring and accessibility posture. It does not create an independent penetration-test report, SOC 2 report, legal opinion, formal accessibility certification, customer SSO test or contractual SLA. Those require the relevant external party only when a real customer or registered organization needs them.
