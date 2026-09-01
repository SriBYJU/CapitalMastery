# Capital Mastery Phase 2 — Employer Pilot Guide

## Pilot objective

Test whether Capital Mastery can make pre-Day-1 finance preparation more standardized, measurable and manager-actionable without replacing a firm's HR onboarding, internal supervision or regulated training.

The strongest pilot question is not “Did people finish the course?” It is:

> **Did the platform produce useful evidence about what each learner could do, where they needed revision, and where managers should spend coaching time?**

## Recommended first pilot

Use one role-specific cohort of roughly 5–25 interns, analysts or new hires. Investment Banking remains the reference implementation, while Phase 2 applies the same two-track / Standard 2.0 evidence architecture across all 16 careers.

A first pilot should be small enough that managers can inspect the underlying work products—not only summary scores.

## Choose the preparation level

### Career Skills Program

Use when the goal is practical role fundamentals and applied work in a shorter program.

Verified milestones:

- Foundations
- Essentials
- Applied Skills

The program still includes guided and independent practice, role-format work and a practical completion experience. It is not a quiz-only shortcut.

### Professional Readiness Program

Use when the goal is deeper pre-Day-1 job readiness.

Verified milestones:

- Foundations
- Essentials
- Applied Skills
- Role Lab
- Professional Readiness

This route adds deeper technical work, changing-information simulations, revisions, professional final evidence and competency floors.

Learners who previously completed Career Skills carry the first three milestones forward and do not repeat them.

## Launch sequence

1. Create the employer workspace and complete the Interactive Launch Guide.
2. Confirm the workspace roles before inviting real users.
3. Create a cohort with Quick Assign.
4. Choose **Career Skills** or **Professional Readiness** based on the cohort objective.
5. Review the entire assigned learner curriculum before publishing.
6. Add only Firm Layer material that improves Day-1 relevance; keep firm-specific material distinct from the protected Capital Mastery Standard.
7. Invite learners with the secure context-aware invitation flow.
8. Capture the baseline diagnostic before weighted professional evidence begins.
9. Monitor evidence coverage and progress separately from course completion.
10. Use the Manager Attention Queue for overdue work, repeated revisions and evidence-backed skill gaps.
11. Inspect representative learner work rather than relying only on aggregate scores.
12. Add manager review notes when coaching is needed.
13. Export the final readiness report / evidence package.
14. Compare baseline, final readiness, revisions, manager interventions and post-start performance using the firm's own KPIs.

## Suggested pilot success metrics

### Learning / evidence

- completion rate by deadline;
- median baseline diagnostic score;
- median final readiness score where applicable;
- median evidence coverage;
- critical competency floor attainment;
- Role Lab first-pass rate;
- Role Lab revision count;
- lowest recurring competency by cohort;
- percentage of learners requiring manager intervention.

### Manager usefulness

- manager coaching flags per learner;
- whether the attention queue correctly surfaced the learners managers would have prioritized;
- whether the evidence identified a weakness the manager would otherwise have discovered later;
- time managers spend reviewing/coaching before versus after the learner reaches the desk;
- manager confidence in the learner's role expectations and work-product quality.

### Post-start validation

If the employer can measure these consistently, compare:

- time to first independently acceptable work product;
- number/type of early corrections;
- repeated modeling/research/communication errors;
- time-to-productivity using the employer's own definition;
- learner confidence in role expectations.

Do not invent a universal productivity or ROI conversion. The firm should define and validate these measures using its own operating context.

## Review the work, not just the number

For a meaningful pilot, sample real training evidence from the assigned role. Depending on the career this may include:

- spreadsheet/model work;
- underwriting cases;
- source/research review;
- investment or credit memos;
- forecasts / variance analysis;
- cash or funding schedules;
- trade/execution decisions;
- risk scenarios and escalations;
- client suitability/allocation work;
- real-estate underwriting;
- manager handoff recommendations.

A readiness score is useful only when the firm can trace it back to defensible evidence.

## What not to claim

Do not treat Capital Mastery readiness as:

- a hiring guarantee;
- a job-performance guarantee;
- professional licensing;
- regulated/compliance training;
- an investment recommendation;
- a substitute for employer supervision;
- a promised productivity or financial uplift.

Public workforce/onboarding research shown in the app provides context for why firms care about ramp-up and role clarity. It is not a promised Capital Mastery outcome.

## QA before inviting real learners

Before a real pilot:

1. use the Admin Demo/Test Lab to create synthetic cohort scenarios;
2. inspect Owner / Training Admin / Content Manager / Manager / Viewer behavior;
3. verify the planned Firm Layer material and protected-standard boundaries;
4. preview reports, attention signals and evidence exports;
5. confirm the current production release passes the live release audit;
6. confirm the primary GitHub Pages host is the current generation and the Cloudflare mirror is healthy;
7. verify the primary hostname is authorized in Firebase Authentication.

The current production-release status is tracked in [`phase2-release-audit.md`](phase2-release-audit.md). Do not invite a real pilot cohort while that audit still lists an open production blocker.
