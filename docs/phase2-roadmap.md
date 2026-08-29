# Capital Mastery V2 — Phase 2 Roadmap

Phase 2 scales the audited Phase 1 architecture from the Investment Banking reference implementation to the full multi-career, pilot-ready enterprise platform. Existing learner content and all previously issued credentials remain preserved and verifiable.

## 1. Distinct employer onboarding experience

Capital Mastery keeps one secure Firebase Authentication backend, but employer onboarding must feel purpose-built rather than like a learner signing up for a course site.

**Employer entry:** `For Employers → Get Started / Open Employer Workspace`

Flow:
1. Sign in or create an account with work email / Google.
2. Capture full name for account identity.
3. Capture company / firm name.
4. Capture employer role (training lead, founder/partner, manager, recruiter/HR, other).
5. Optional approximate cohort size.
6. Create or join the organization workspace.
7. Land directly in the Employer Command Center.

Learner signup remains the existing learner-first flow. An invited employee/intern receives a context-aware invitation screen naming the firm, creates/signs into the same secure account system, accepts the invite and lands directly in Assigned Training.

## 2. Admin Demo & Test Lab

The Capital Mastery admin must have an easy, centralized way to test every employer and learner workflow without recruiting real people or creating real-world accounts. This is an admin-only synthetic environment protected server-side by the existing Capital Mastery admin identity.

### One-click demo workspace
- Generate a synthetic firm with one click.
- Seed one or more cohorts and assignments.
- Seed synthetic learner profiles without requiring real Firebase users.
- Choose preset cohort sizes and readiness distributions.
- Create realistic names, deadlines, progress states and competency profiles.
- Display an unmistakable **DEMO / SYNTHETIC DATA** banner.
- Exclude demo tenants from real customer analytics and official public credentials.

### Demo presets
- New cohort — nobody started.
- Mixed cohort — strong, average and struggling learners.
- Completed cohort — full readiness reports and credentials.
- Weak modeling cohort — targeted development signal.
- Overdue cohort — deadlines and manager-attention state.
- Revision scenario — learner fails a Role Lab stage, receives comments and improves.
- Permission scenario — owner/admin/manager/viewer/learner access matrix.

### Admin test console
From one admin screen, the founder/admin can:
- open the app as a demo employer
- open a synthetic learner view
- create/reset demo organizations
- generate cohorts and assignments
- move synthetic learners between progress states
- trigger diagnostic, Essentials, Role Lab, revision, final and credential states
- preview employer and learner readiness reports
- preview credential evidence and verification states
- test Firm Layer hide/archive/restore and protected-standard warnings
- test invites without sending real invitations
- inspect audit events
- run permission-denial scenarios
- reset the entire demo environment to a clean state

Demo mode must never grant the browser unrestricted production mutation. All demo actions are explicit admin-only server operations scoped to demo records.

## 3. Full 16-career professional expansion

Convert the other 15 careers to the same Phase 1 architecture: career-specific competency maps, diagnostics, Essentials/applied work, realistic Role Labs, grading rubrics, final assessments, readiness thresholds, evidence portfolios and Professional Readiness credentials.

Role Labs must model the actual work products and changing-information workflows of each job rather than generic finance quizzes.

## 4. Credential and Academy expansion

- Complete the five-level stackable credential model across all careers.
- Add Finance Core credentials.
- Add Academy-level credentials.
- Add the optional Capital Mastery Finance Professional achievement.
- Maintain curriculum/version evidence on every credential.

## 5. Enterprise reporting & customization expansion

- deeper cohort analytics and coaching recommendations
- manager review for selected deliverables
- richer evidence portfolios
- advanced Firm Layer customization
- notifications and deadline workflows
- stronger employer exports and pilot reporting

## 6. Production hardening and pilot package

- accessibility hardening toward WCAG 2.2 AA
- expanded Trust Center/security documentation
- reliability, rate-limit and tenant-isolation regression coverage
- demo company workspace
- sample readiness report
- employer one-pager
- pilot guide / FAQ
- security overview
- outreach/demo materials for boutique firms

## Phase 2 release gate

Phase 2 is not complete until the full Phase 2 audit passes, every finding is fixed, and the final deployed black-box audit exercises learner, assigned employee, employer, second-tenant isolation and Capital Mastery admin/demo workflows on the production application.
