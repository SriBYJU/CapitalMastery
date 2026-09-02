# Capital Mastery — Full Project Detailed Report

## 1. Executive assessment

Capital Mastery has progressed from a static finance-course concept into a production-deployed learning, simulation, credential and employer-readiness platform. The current product is suitable for public use, a serious large-firm demonstration and a controlled pilot, provided its evidence and assurance limits are represented honestly.

The canonical product runs on GitHub Pages, with a Cloudflare Pages mirror and a Cloudflare Worker/D1 authoritative backend. Firebase provides user identity and owner-bound continuity synchronization. The product remains free for learners and employers and has not been represented as a registered or independently certified company.

## 2. Product scope

Capital Mastery contains 16 finance pathways:

Investment Banking, Private Equity, Venture Capital, Equity Research, Asset Management, Hedge Funds, Sales & Trading, Quantitative Finance, Private Credit, Corporate Banking, Corporate Development, FP&A, Treasury, Wealth Management, Risk Management and Real Estate Finance.

Each pathway supports two depths:

- **Career Skills:** Foundations, Essentials and Applied Skills plus a practical completion certificate.
- **Professional Readiness:** the shared first three levels plus Role Lab and Professional Readiness.

The five verified Standard 2.0 credential levels remain Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness. Career Skills completion is separate and does not inflate the 80 career credential definitions.

## 3. Learner experience

The application teaches concepts, prompts immediate practice and then uses secure official assessments. Formats include calculations, tables, source interpretation, judgment, written analysis, spreadsheet-style tasks and practical workbenches.

Course navigation is deterministic. Each stage has one state and one valid next action. Learners can see why a stage is locked, use a single Continue action to resume, and cannot open official controls before prerequisites. Refresh, Back navigation, delayed synchronization and repeated authentication events cannot erase a pass. Progress is account-scoped and merges monotonically.

Passed assessments cannot be retaken or overwritten. Learners can review the question, submitted answer, correctness, permitted correct answer/rationale, score and date. Failed attempts remain reviewable and receive an explicit retry route. Official answer keys and critical grading rules remain server-side until the allowed post-submission response.

The final release removes a timing-sensitive passed-assessment transition: Continue and Review are separate on the core first render, and the Continue target is program-aware before enhancement scripts finish. Professional Readiness proceeds to Role Lab; Career Skills proceeds to its practical capstone.

## 4. Applied work and simulations

All careers include role-native work rather than relying on renamed multiple-choice quizzes. The workbench design combines a manager/client brief, source files, calculations or research, a realistic deliverable, a material update, QA/revision and a final handoff. Scoring requires overall quality plus critical work-product and communication floors.

Investment Banking is the deepest reference experience. Project Northstar uses Inbox, Data Room, Transaction Model, Trading Comps, Precedents, DCF, Management Update, Model QA, Client Takeaway and Associate Email. The source files open, each file is explained, drafts persist temporarily, completed drafts clear and every navigation item maps to its correct work surface.

The other 15 careers contain differentiated underwriting, investment, research, planning, markets, risk, client or real-estate tasks with role-specific source packets and change events. Legacy MCQ simulation payloads are refused on official routes.

## 5. Employer product

Employers receive a guided free setup rather than a raw administration console. They can create organizations, cohorts and assignments; choose program depth; invite learners; add Firm Layer content; monitor readiness; review evidence; export reports and inspect material audit history.

Firm Layer content is versioned and tenant-scoped. It can be hidden, archived and restored without altering the portable Capital Mastery Standard. Direct-route checks and Worker enforcement separate owner, administrative, content, manager/reviewer and viewer powers. Exact-email invitations and organization membership checks prevent invitation or tenant swapping.

Readiness surfaces distinguish completion from competence. They show demonstrated evidence, revision signals, current level and remaining development needs. Public claims describe preparation and measurement capability, not guaranteed hiring or time-to-productivity outcomes.

## 6. Identity, data and security architecture

Firebase establishes identity, but the browser is not trusted to declare its UID, administrator status, organization role, score or credential eligibility. The Worker verifies identity and authorization. D1 is authoritative for official attempts, progression, credentials, employer records and readiness evidence. Firestore/local state supports continuity without superseding D1.

Implemented controls include:

- server-side tenant membership and least privilege;
- exact administrator identity secret;
- answer-key and rubric isolation;
- attempt limits, body ceilings, token ceilings and exact JSON media type;
- origin validation before normal and preflight responses;
- CSP, response headers and SHA-384 integrity for dynamic CDN libraries;
- CSV spreadsheet-formula neutralization;
- privacy-safe public credential verification;
- no permanent employer delete in ordinary product flows;
- exact allowlisted frontend publishing; and
- D1 integrity, Git recovery and Time Travel documentation.

## 7. Accessibility, responsive behavior and usability

The release matrix covers six widths from 320px mobile to 1440px desktop. It checks overflow, navigation, course controls, guides, employer surfaces and workbook-like regions. Contrast testing covers ten major routes at every release width, including previously reported white-on-white patterns.

The product includes keyboard focus states, reduced-motion handling, labeled controls, skip navigation and programmatically focusable main content. Shared, signed-out account and credential-name dialogs implement resolved naming, focus entry, Tab containment, appropriate Escape behavior and focus return. This is first-party tested accessibility, not a formal WCAG certification.

## 8. Release and operational quality

The current source passes 88 dependency-free static audit files. Broader release evidence includes 16 careers × two programs × six widths, hostile deep links, corrupted state, delayed/out-of-order responses, account switching, permanent assessment review, no-skip/resume behavior, legacy simulation refusal, employer invitation/role tests and live production probes. The final application candidate is `16b0bd2c59ba3939f9935b4e40311227e9925736`.

The production build publishes only allowlisted frontend files. Worker code, migrations, tests, internal documentation and configuration are excluded. GitHub Actions package exact candidates, run static/browser/live gates and deploy GitHub Pages from main. Cloudflare deployment remains explicit and independently verifiable.

Daily zero-cost monitoring checks public availability and security boundaries. Weekly bounded read-only traffic checks provide a small resilience regression signal. The recovery runbook covers known-good Git redeployment and seven-day D1 Time Travel, while intentionally keeping destructive restore manual.

## 9. Phase record

- **Phase 1 (`abd7cf1`):** Enterprise Core, production backend and complete Investment Banking reference pathway.
- **Phase 2 (`2ce85e7`):** all-career/two-program course and workbench expansion, progression repair, employer closure, responsive/contrast coverage, owner-controlled Firebase/Admin/D1 closure and campaign assets.
- **Phase 3 (`b02255f`):** zero-cost CSP/SRI/API hardening, keyboard dialog completion, monitoring, resilience, threat model, recovery and incident readiness. Final application candidate `16b0bd2` adds the course first-paint continuity repair.

## 10. Current readiness decision

Capital Mastery is ready to publish and ready to demonstrate to large firms. It is also suitable for a controlled employer pilot with careful collection of feedback, reliability observations and learning evidence.

It should not yet be presented as independently penetration-tested, SOC 2 audited, formally accessibility-certified, legally approved for a particular customer, enterprise-SSO validated or proven at global-bank production volume. Those are external or customer-specific assurances, not missing product buttons. They become worthwhile when a real firm requests them and supplies the appropriate context.

## 11. Recommended next real-world step

Run a small, consent-based pilot using synthetic or low-risk content. Measure where learners hesitate, which tasks require manager explanation, whether invitations and resume work across real devices, and whether readiness reports answer employer questions. Record defects separately from desired features and keep marketing claims tied to observed evidence.

Supporting material: [report index](README.md), [Phase 2 production evidence](../release-evidence/phase2-status-2026-09-01.md), [security policy](../../SECURITY.md), [deployment runbook](../deployment-runbook.md) and [zero-cost operations pack](../operations/README.md).

Exact Phase 3 workflow runs, deployment identifiers and measured resilience results are recorded in the [Phase 3 detailed report](phase-3-detailed.md).
