# Capital Mastery Training Track Standard

## Purpose

Capital Mastery offers two preparation programs inside each of the 16 finance careers. They share a teach-first foundation but serve different depth and readiness goals.

This document is the product contract for learner UX, employer assignment behavior, verified credentials, program-completion certificates, reports, verification, notifications, and upgrade semantics.

## Program 1 — Career Skills

**Positioning:** shorter · practical · credentialed

Career Skills is for learners who want meaningful role preparation without completing the full advanced Professional Readiness pathway.

Required program sequence:

1. Foundations
2. Essentials
3. Applied Skills
4. Career Skills practical capstone

### Verified Standard 2.0 credentials earned in Career Skills

1. `[Career] Foundations`
2. `[Career] Essentials`
3. `[Career] Applied Skills`

Career Skills therefore contains **3 verified Standard 2.0 career credentials**.

### Program completion

After the learner completes the required role-specific practical capstone to the applicable mastery standard, the program can issue a **Career Skills Program Completion Certificate**.

This completion certificate:

- recognizes completion of the shorter Career Skills program;
- is backed by the authoritative capstone/completion record;
- is shareable and publicly verifiable where supported;
- is **not** a fourth verified Standard 2.0 credential for Career Skills;
- is **not** a sixth level in the Standard 2.0 career ladder; and
- never substitutes for the advanced Role Lab or Professional Readiness credential.

Career Skills must never be reduced to an MCQ-only completion route. The practical capstone remains a required work-performance gate.

Career Skills does **not** require:

- baseline diagnostic;
- advanced Role Lab;
- Professional Readiness Final; or
- Professional Readiness credential.

Those advanced-only items must be displayed as **Not required**, not as missing or failed, in learner reports, employer reports, alerts, and exports.

## Program 2 — Professional Readiness

**Positioning:** advanced · full job-readiness · flagship

Professional Readiness is the complete role-preparation pathway intended to model deeper pre-Day-1 / analyst-readiness preparation and evidence.

Required sequence:

1. Foundations
2. Baseline diagnostic
3. Essentials
4. Applied Skills
5. Role Lab
6. Professional Readiness Final
7. Readiness / evidence verification

### Verified Standard 2.0 credentials

1. `[Career] Foundations`
2. `[Career] Essentials`
3. `[Career] Applied Skills`
4. `[Career] Role Lab`
5. `[Career] Professional Readiness`

Professional Readiness therefore contains **5 verified Standard 2.0 career credentials**.

The Professional Readiness credential is the flagship career credential. It requires the advanced evidence standard and must never be issued from Career Skills completion alone.

## Upgrade / stacking rule

Career Skills is an on-ramp to Professional Readiness, not a disconnected course.

When a learner upgrades:

- earned Foundations carries forward;
- earned Essentials carries forward;
- earned Applied Skills carries forward;
- already completed shared learning must not be repeated merely because the program level changed; and
- the learner continues into the advanced-only requirements: baseline where required for the assigned Professional path, Role Lab, Professional Final, and readiness evidence.

The Career Skills Program Completion Certificate remains a valid earned completion record, but it does **not** substitute for Role Lab or Professional Readiness.

## Credential architecture

Capital Mastery Standard 2.0 has exactly five verified career credential definitions per career:

- `foundations`
- `essentials`
- `applied`
- `role_lab`
- `professional_readiness`

Across 16 careers, this remains **80 Standard 2.0 verified career credential definitions**.

The cross-career Academy layer contains **8 additional verified credential definitions**, bringing the current Standard 2.0 + Academy definition count to **88**.

The historical/internal `career` record is retained for backward compatibility and authoritative Career Skills program-completion tracking. It is presented in current product semantics as the **Career Skills Program Completion Certificate**, outside the five-level Standard 2.0 credential ladder.

The completion certificate is not counted among the 80 career credential definitions or the 88 Standard 2.0 + Academy verified definitions.

Academy achievements may require Professional Readiness credentials. A Career Skills completion certificate or legacy Career Certificate must never satisfy a Professional Readiness prerequisite for an Academy award.

## Employer assignment contract

Employer Quick Assign provides two clear program choices:

- **Career Skills** → assignment track `career_skills` → authoritative completion-record target `career`
- **Professional Readiness** → assignment track `professional` → verified completion target `professional_readiness`

The internal `career` target is a compatibility/completion-record key; employer UI must not present it as a sixth verified Standard 2.0 credential.

A Career Skills employer assignment is complete when its required shared credential gates and practical capstone/program-completion record are satisfied. It must not remain overdue because the learner did not complete advanced-only Role Lab or Professional Final gates.

A Professional Readiness assignment is complete only when the Professional Readiness credential is active under the required assignment evidence scope.

## Reporting and manager intelligence

Reports must be program-aware.

For Career Skills:

- use Career Skills progress language;
- distinguish **3 verified credentials** from the separate program-completion certificate;
- show Role Lab and Professional Final as `Not required`;
- do not create Role Lab revision alerts;
- do not create Professional Readiness-gap alerts;
- coaching may use deadline, skill evidence, completion, capstone, or manager-review signals; and
- CSV/JSON exports must state the program level, verified credential count, and authoritative completion record accurately.

For Professional Readiness:

- show baseline, Role Lab, revision cycles, final, readiness, and evidence coverage;
- preserve manager-attention signals for foundation gaps, revisions, readiness gaps, and deadline risk; and
- identify the full five-credential verified ladder.

Resolved generated alerts should be archived so outdated deadline/revision/readiness warnings do not remain active.

## Public verification

Public verification must identify the earned record precisely:

- Foundations Credential
- Essentials Credential
- Applied Skills Credential
- Career Skills Program Completion Certificate
- Role Lab Credential
- Professional Readiness Credential

Public verification for a Career Skills completion record must explicitly avoid implying that it is a sixth Standard 2.0 credential or equivalent to Professional Readiness.

Verification may expose privacy-safe credential/completion evidence only. It must not expose private manager notes, private tenant data, secure answer keys, scoring keys, tolerances, keyword rubrics, or grader logic.

## Product-quality rule

The shorter route is shorter because it covers less depth—not because the work is lower quality.

Both program levels must follow:

**teach → guided practice → independent application → realistic work evidence → verified milestone / program completion**

Professional Readiness extends that sequence with deeper professional simulation, review/revision, final judgment/calculation gating, and readiness evidence.

## Audit requirements

Any future change to training tracks must preserve automated regression coverage for:

- exactly 3 verified Career Skills credentials plus one separate completion certificate;
- exactly 5 Professional Readiness verified credentials;
- exactly 5 Standard 2.0 career ladder levels per career;
- the separate `career` program-completion descriptor;
- legacy Career Certificate compatibility;
- no-repeat stacking;
- advanced-gate isolation;
- employer assignment targets;
- program-aware reporting and exports;
- program-aware notifications;
- public credential/completion hierarchy;
- Academy non-bypass; and
- responsive and keyboard-safe program selection.

`tests/career-skills-five-level-boundary-audit.mjs` is the permanent release guard for the five-level credential boundary and separate Career Skills program-completion semantics.
