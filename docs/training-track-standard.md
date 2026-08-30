# Capital Mastery Training Track Standard

## Purpose

Capital Mastery offers two program levels inside each of the 16 finance careers. The two levels share the same teach-first foundation but serve different preparation goals. The shorter program is intentionally practical and credentialed; the advanced program is the full job-readiness standard.

This document is the product contract for learner UX, employer assignment behavior, credentials, reports, verification, and upgrade semantics.

## Program 1 — Career Skills

**Positioning:** shorter · practical · credentialed

Career Skills is for learners who want meaningful role preparation without completing the full pre-onboarding / analyst-readiness pathway.

Required evidence path:

1. Foundations
2. Essentials
3. Applied Skills
4. Career Skills Capstone

Verified credentials:

1. `[Career] Foundations`
2. `[Career] Essentials`
3. `[Career] Applied Skills`
4. `[Career] Career Skills Certificate`

The Career Skills Certificate requires the practical role-specific capstone. Career Skills must never be reduced to an MCQ-only completion route.

Career Skills does **not** require:

- baseline diagnostic
- advanced Role Lab
- Professional Readiness Final
- Professional Readiness credential

Those items must be displayed as **not required**, not as missing or failed, in learner reports, employer reports, alerts, and exports.

## Program 2 — Professional Readiness

**Positioning:** advanced · full job-readiness · flagship

Professional Readiness is the complete role-preparation pathway intended to approximate pre-Day-1 analyst preparation and evidence.

Required sequence:

1. Foundations
2. Baseline diagnostic
3. Essentials
4. Applied Skills
5. Role Lab
6. Professional Readiness Final
7. Readiness / evidence verification

Standard 2.0 career credentials:

1. `[Career] Foundations`
2. `[Career] Essentials`
3. `[Career] Applied Skills`
4. `[Career] Role Lab`
5. `[Career] Professional Readiness`

The Professional Readiness credential is the flagship career credential. It requires the advanced work evidence and must never be issued from Career Skills completion alone.

## Upgrade / stacking rule

Career Skills is an on-ramp to Professional Readiness, not a disconnected course.

When a learner upgrades:

- earned Foundations carries forward;
- earned Essentials carries forward;
- earned Applied Skills carries forward;
- completed learning must not be repeated merely because the program level changed;
- the learner continues into the advanced-only gates: baseline where required for the assigned Professional path, Role Lab, Professional Final, and readiness evidence.

The Career Skills Certificate remains a valid earned credential, but it does **not** substitute for the Role Lab or Professional Readiness credential.

## Credential architecture

Capital Mastery Standard 2.0 retains five career credential definitions per career:

- foundations
- essentials
- applied
- role_lab
- professional_readiness

Across 16 careers, this remains **80 Standard 2.0 career credential definitions**.

Career Skills uses the existing portable `career` credential as its fourth learner-facing credential. It is intentionally separate from the five Standard 2.0 definitions so the advanced Standard is not weakened or renumbered.

Academy achievements may use Professional Readiness credentials where required. A Career Skills Certificate must never satisfy a Professional Readiness prerequisite for an Academy award.

## Employer assignment contract

Employer Quick Assign must provide two clear choices:

- **Career Skills** → assignment track `career_skills` → completion target `career`
- **Professional Readiness** → assignment track `professional` → completion target `professional_readiness`

A Career Skills employer assignment is complete when the verified Career Skills credential is earned. It must not remain overdue because the learner did not complete advanced-only Role Lab or final gates.

A Professional Readiness assignment is complete only when the Professional Readiness credential is active under the required assignment evidence scope.

## Reporting and manager intelligence

Reports must be program-aware.

For Career Skills:

- use Career Skills progress language;
- show Role Lab and Professional Final as `Not required`;
- do not create Role Lab revision alerts;
- do not create Professional Readiness-gap alerts;
- coaching may use deadline, skill evidence, completion, or manager-review signals;
- CSV/JSON exports must state the program level and correct completion credential.

For Professional Readiness:

- show baseline, Role Lab, revision cycles, final, readiness, and evidence coverage;
- preserve manager attention signals for foundation gaps, revisions, readiness gaps, and deadline risk.

Resolved generated alerts should be archived so outdated deadline/revision/readiness warnings do not remain active.

## Public verification

Public credential verification must identify each credential precisely:

- Foundations Credential
- Essentials Credential
- Applied Skills Credential
- Career Skills Certificate
- Role Lab Credential
- Professional Readiness Credential

Public verification must not imply that Career Skills equals Professional Readiness.

Verification may expose safe credential evidence only. It must not expose private manager notes, private tenant data, secure answer keys, scoring keys, tolerances, keyword rubrics, or grader logic.

## Product-quality rule

The shorter route is shorter because it covers less depth—not because the work is lower quality.

Both program levels must follow:

**teach → guided practice → independent application → realistic work evidence → credential**

Professional Readiness extends that sequence with deeper professional simulation, review/revision, final judgment/calculation gating, and readiness evidence.

## Audit requirements

Any future change to training tracks must preserve automated regression coverage for:

- 4 Career Skills credentials;
- 5 Professional Readiness credentials;
- no-repeat stacking;
- advanced-gate isolation;
- employer assignment targets;
- track-aware reporting and exports;
- track-aware notifications;
- public credential hierarchy;
- Academy non-bypass;
- responsive and keyboard-safe track selection.
