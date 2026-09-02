# Phase 2 — Detailed Report

## Executive result

Phase 2 completed the transition from an Investment Banking reference product into a 16-career, two-program learning and employer platform. The final Phase 2 checkpoint was `2ce85e7025372f62d073bf8b6e92382bc8d48e1f` on September 1, 2026. It closed the reported course, simulation, progression, visual, employer and owner-controlled deployment defects in production.

## Course and progress architecture

Course state had previously been inferred independently by lesson pages, quizzes, secure assessment results, program decorators and local state. Phase 2 introduced a canonical, program-aware resolver.

The release now:

1. binds local state to the active Firebase UID;
2. normalizes malformed or stale state;
3. merges Firestore continuity data monotonically;
4. hydrates D1-authoritative attempts, simulations, completions and credentials;
5. resolves every stage as locked, available, in progress, failed, passed or review; and
6. derives Continue, Review and failed-only Retry routes from the same result.

Learners may see clearly marked look-ahead context, but locked official controls remain unavailable and explain the missing prerequisite. A passed assessment is permanent and read-only. Its original questions, learner answers, correctness, allowed answer/rationale material, score and date remain reviewable. Review creates no new attempt. Failed attempts retain review data and expose one explicit retry action.

Repeated auth events, refresh, Back navigation and same-tab account switching cannot roll back a pass or leak one account’s in-memory course state into another account. D1 remains authoritative for official evidence.

## Program and credential semantics

Every career retains exactly five verified Capital Mastery Standard 2.0 levels: Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness. Across 16 careers, that is 80 career credential definitions.

Career Skills is the shorter path through the first three verified levels plus a separate practical program-completion certificate. That certificate is not a sixth Standard 2.0 credential. Professional Readiness adds the deeper Role Lab and final evidence gates. Shared completed levels carry forward, so upgrading does not repeat earned work.

## Realistic simulations and workbenches

All 16 careers use secure workday/workbench flows. Each includes a role and manager/client context, source packet, relevant calculations or research, a professional work product, a material new-information event, revision/QA expectations, explicit acceptance criteria and a manager/reviewer handoff. The 15 non-Investment-Banking careers contain differentiated role-native work rather than renamed banking tasks.

Investment Banking became the flagship ten-step Project Northstar experience:

1. Inbox
2. Data Room
3. Transaction Model
4. Trading Comps
5. Precedents
6. DCF
7. Management Update
8. Model QA
9. Client Takeaway
10. Associate Email

Each navigation item opens the correct work panel. The interface explains the file and deliverable, shows progress, provides source files that open, saves incomplete device drafts for seven days, clears submitted drafts and grades server-side. Overall score, work-product quality, written quality and critical-rubric floors all matter; a high average cannot hide a critical failure. Legacy MCQ-style simulation payloads are rejected rather than shown as official work.

## Employer and administrator product

Phase 2 completed guided employer setup, cohorts, exact-email invitations, assignment creation, command-center views, readiness reports, manager review, notifications, evidence export and versioned Firm Layer content. The Worker enforces tenant membership and least privilege across Owner, Admin, Content Admin, Manager, Reviewer and Viewer behaviors, while the UI hides unavailable actions and rejects direct-route escalation.

QA Preview is isolated from learner state and requires backend-verified Admin identity. It can inspect course and simulation surfaces without issuing official progress or credentials. The final synthetic Admin lifecycle created a three-learner revision cohort, exercised review/status/permission behavior and removed the synthetic workspace afterward.

## Responsive and visual quality

The release matrix covered 320×568, 375×812, 430×932, 768×1024, 1024×768 and 1440×900/1000. It checked global overflow, course controls, career pages, guide panels, employer surfaces, high-mutation routes and workbook containers. Two final defects—320px min-content growth and 1024px full-navigation overflow—were found and fixed before closure.

The visual contrast suite checked ten major routes at all six widths, including the previously reported white-on-white patterns. Keyboard-native controls, focus states, labels, reduced motion and status semantics were included, without claiming third-party WCAG certification.

## Test and production evidence

The release candidate passed 85 of 85 dependency-free static audit files plus the production Pages bundle audit. Browser evidence covered failure-seeking torture, adversarial routing/state races, visual contrast, course continuity, assessment state/review, legacy simulation refusal, Admin zero-exposure, program-completion verification, employer invitation/role flows, Investment Banking guidance, the learner guide and account-state isolation.

The all-career sweep passed 16 careers × two programs × six widths.

Production closure confirmed:

- GitHub Pages as canonical primary and Cloudflare Pages as the mirror;
- Worker deployment with D1, Firebase, origins, observability and Admin secret preserved;
- D1 `quick_check = ok`, zero foreign-key violations and 37 inspected tables;
- no remaining synthetic demo workspace;
- live Firestore owner writes, cross-account denial, anonymous denial, schema enforcement and cleanup;
- disposable Firebase signup, name persistence, reload, fresh-device hydration and deletion;
- both frontend domains authorized in Firebase; and
- authenticated Admin identity and protected D1 integrity execution.

The exact Phase 2 release workflows and deployment identifiers are recorded in [final production evidence](../release-evidence/phase2-status-2026-09-01.md).

## Advertising and claim safety

The campaign package contains three H.264 vertical videos, three static ad formats, editable 1080×1920 frames, product captures, storyboards and reproducible render scripts. Ads use real product UI and implemented claims. They avoid bank endorsement, guaranteed career outcomes, accreditation and security-certification language. Third-party bank logos were intentionally not used without brand permission.

## Honest release boundary

Phase 2 was ready for publication, demonstration and a controlled employer pilot. “Firm-ready” described product workflow realism, evidence, permissions, auditability and verified production behavior. It did not replace an external penetration test, SOC 2 auditor, lawyer, customer identity-provider test or measured large-cohort capacity study.
