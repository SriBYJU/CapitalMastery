# Capital Mastery V2 — Phase 2 Execution Roadmap

Phase 2 scales the audited Phase 1 architecture from the Investment Banking reference implementation to a multi-career, employer-ready finance workforce-readiness platform. Existing learner content and previously issued credentials remain preserved and verifiable.

This document tracks **implementation status**, not production-release status. The authoritative production evidence and blockers are recorded in [`phase2-release-audit.md`](phase2-release-audit.md).

## 1. Learner preparation architecture — IMPLEMENTED

Every career is presented through two preparation choices rather than one undifferentiated course:

### Career Skills Program
A shorter practical route through:

1. Foundations
2. Essentials
3. Applied Skills

Learners receive teaching, guided practice, independent application and practical work. The shorter route is shorter because it stops before the advanced Role Lab / Professional Readiness sequence—not because it replaces professional work with multiple-choice questions.

The Career Skills Program can produce a printable/shareable program-completion certificate. That completion document is a presentation layer over the verified Foundations, Essentials and Applied Skills milestones and does **not** create a sixth Standard 2.0 credential level.

### Professional Readiness Program
The full route through:

1. Foundations
2. Essentials
3. Applied Skills
4. Role Lab
5. Professional Readiness

The first three verified milestones carry forward from Career Skills. Learners who upgrade do not repeat already demonstrated work.

Professional Readiness adds deeper technical work, source materials, role-native workbenches, changing information, revisions, professional work products, final evidence coverage and competency floors.

## 2. Distinct employer onboarding — IMPLEMENTED

Capital Mastery uses one secure Firebase Authentication system, but employer onboarding is purpose-built rather than presenting a learner course-signup flow.

**Employer entry:** `For Employers → Open Free Employer Workspace`

Implemented flow:

1. Sign in or create a secure account.
2. Confirm full name.
3. Enter company / firm name.
4. Select employer role/context.
5. Optionally select approximate cohort size.
6. Create the organization workspace.
7. Land in the Employer Command Center / interactive launch guide.

Invited learners use the same identity system but receive employer-assignment context and land in Assigned Training after acceptance.

## 3. Admin Demo & Test Lab — IMPLEMENTED

Capital Mastery includes an administrator-only synthetic testing environment designed to exercise employer and learner workflows without using real employees or firms.

Implemented controls include:

- synthetic demo organizations
- cohort / assignment presets
- synthetic learner states
- permission-matrix scenarios
- role-aware employer views
- readiness/report scenarios
- Role Lab / revision states
- reset controls
- explicit synthetic/demo labeling
- server-side administrator enforcement

Demo actions remain scoped to demo records and do not grant unrestricted browser mutation of production data.

Automated release coverage includes Admin Demo Lab contract, demo-state/permission behavior and general administrator runtime stability.

## 4. Full 16-career professional expansion — IMPLEMENTED

The Phase 2 architecture now covers all 16 finance careers rather than only the Investment Banking reference pathway.

Each career is expected to follow the same core instructional sequence:

**Teach → guided practice → independent practice → professional simulation → evidence**

Role-native work surfaces are used where the role requires them. Examples include:

- Investment Banking — valuation, comps, models, transaction materials and analyst recommendation
- Private Equity — LBO / debt / returns / investment-committee underwriting
- Venture Capital — cap tables, cohorts, TAM, unit economics and investment memos
- Corporate Development — strategic M&A evaluation and integration trade-offs
- FP&A — budgets, forecasts, variance analysis and management packs
- Treasury — cash forecasting, funding and hedge decisions
- Sales & Trading — market data, orders, execution and risk
- Quantitative Finance — datasets, validation, backtests and model-risk checks
- Risk Management — exposures, scenarios, controls and escalation
- Wealth Management — client constraints, allocation, suitability and proposal work
- Real Estate Finance — underwriting, NOI, debt, DSCR and returns

The browser release gate now sweeps **16 careers × both tracks × four release widths**.

## 5. Credential architecture — IMPLEMENTED

Standard 2.0 keeps a five-level verified career ladder:

- Foundations
- Essentials
- Applied Skills
- Role Lab
- Professional Readiness

Across 16 careers, this preserves a consistent career-credential architecture rather than creating miscellaneous certificate names for every lesson.

Academy credentials remain a separate credential family. Public verification and employer reporting distinguish completion from evidence-backed readiness.

## 6. Enterprise reporting, roles and Firm Layer — IMPLEMENTED

Implemented employer capabilities include:

- cohorts and role-specific assignments
- Career Skills vs Professional Readiness assignment distinction
- employer interactive launch guide
- readiness and evidence reporting
- manager-attention signals
- manager review
- notifications
- evidence exports
- audit history
- Firm Layer create/edit/version/reorder/hide/archive/restore lifecycle
- protected Capital Mastery Standard content
- no employer-facing permanent delete

Server-authoritative role separation:

- **Owner** — workspace, programs, people, reports, reviews, Firm Layer, audit
- **Training Admin** — program/cohort administration, people, reports, reviews, Firm Layer, audit
- **Content Manager** — Firm Layer / curriculum administration without learner-performance access
- **Manager** — learner reporting and reviews without workspace administration
- **Viewer** — read-only learner reporting

The release browser gate now verifies all five roles, including direct-route boundaries rather than checking navigation labels alone.

## 7. Security, integrity and release hardening — IMPLEMENTED IN SOURCE

Source-level release controls now include:

- explicit request-origin enforcement
- authenticated authoritative routes
- server-side tenant/role checks
- assessment-answer/rationale isolation
- server-side official grading
- request body ceiling
- attempt throttling / abuse limits
- non-destructive employer content lifecycle
- CSV spreadsheet-formula injection neutralization
- notification deduplication/scope/lifecycle checks
- account-deletion contract and owner protections
- Trust Center claims tied to implementation evidence
- production frontend allowlist and security-header bundle audit
- keyboard/reduced-motion/accessibility release checks
- 375 / 430 / 768 / ~1440 px browser coverage
- state/offline/history resilience browser testing
- admin-only read-only D1 integrity endpoint using `quick_check`, `foreign_key_check` and table counts

The current audited source release passes the complete static regression collection plus **17 Chromium release suites**. See [`phase2-release-audit.md`](phase2-release-audit.md) for exact evidence.

## 8. Employer / pilot package — IMPLEMENTED, FINAL PRODUCTION PROOF PENDING

Repository materials include:

- employer one-pager
- pilot guide
- security overview
- sample readiness report
- workforce evidence material
- pilot demo playbook
- Trust Center and credential-policy surfaces
- deployment runbook
- Phase 2 release audit

The public product positions Capital Mastery as a finance-readiness layer that complements—not replaces—orientation, HR onboarding, licensing or regulated firm training.

## 9. Remaining Phase 2 closure work — LIVE / EXTERNAL

The remaining work is no longer broad feature construction. It is production promotion and final black-box evidence:

1. Promote the audited Worker while preserving existing Cloudflare secrets/bindings/settings.
2. Confirm `/admin/integrity` exists in production and run it with an authenticated Capital Mastery administrator.
3. Require D1 `quick_check = ok`, zero foreign-key violations and record table counts.
4. Publish the audited `main` commit to the primary GitHub Pages site and retain the exact `dist-pages/` artifact for the Cloudflare mirror.
5. Confirm the primary frontend generation, private-artifact boundary and canonical metadata; confirm mirror security headers separately.
6. Re-run the complete 17-suite live Chromium matrix against `https://sribyju.github.io/CapitalMastery/`.
7. Verify `sribyju.github.io` is an authorized Firebase Authentication domain and keep `capitalmastery.pages.dev` authorized for the mirror.
8. Run final signed-out, signed-in learner, signed-in employer, role/tenant, Firm Layer, manager-review, notification/export and Admin Demo Lab production smokes.
9. Delete disposable QA data/accounts and recheck integrity.
10. Only after every blocker is closed, perform final release sign-off and then submit the GitHub Pages primary URL to Search Console.

## Phase 2 release gate

Phase 2 is **not complete** merely because source/CI is green. Completion requires the audited Worker and GitHub Pages primary to be current and the final authenticated black-box audit to pass without unresolved blockers.
