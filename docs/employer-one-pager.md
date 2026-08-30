# Capital Mastery for Employers

## Make new finance talent productive sooner

Capital Mastery is **Finance Workforce Readiness Infrastructure** for interns, analysts, new hires and targeted-development cohorts. It sits beside an employer's normal HR onboarding and focuses on a different question:

> **Can this person perform role-specific finance work at a defensible standard before a manager relies on the work?**

Capital Mastery is free for employers and learners. There is no employer subscription, seat fee or trial gate.

## Two preparation programs

Employers choose the level of preparation that fits the cohort rather than assigning one generic course.

### Career Skills Program

A shorter, practical route through:

- Foundations
- Essentials
- Applied Skills
- immediate guided + independent practice
- role-format work products
- a compact practical simulation / completion experience

Best for learners who need credible role fundamentals and hands-on application without the full advanced readiness sequence.

### Professional Readiness Program

The deeper job-readiness route through:

- Foundations
- Essentials
- Applied Skills
- Role Lab
- revision cycles and changing information
- Professional Readiness Final
- complete professional evidence coverage and competency floors

The first three verified milestones carry forward from Career Skills. Learners who upgrade do not repeat already demonstrated work.

## What learners actually do

Capital Mastery is designed around **Teach → guided practice → independent practice → professional simulation → evidence**.

Depending on the role, learners work with calculations, spreadsheet-style models, source documents, workpapers, schedules, research, data rooms, underwriting cases, memos, tickets, client constraints, scenario changes, manager handoffs and written recommendations. Assessment is intentionally mixed-format rather than MCQ-only.

Examples include:

- Investment Banking — comps, valuation, models and transaction materials
- Private Equity — LBO, leverage, debt paydown, returns and IC recommendation
- Venture Capital — cap table, cohorts, TAM, unit economics and invest/pass memo
- FP&A — budget, forecast, variance and management pack
- Treasury — 13-week cash, funding and hedge decisions
- Quantitative Finance — data validation, backtest and model-risk checks
- Risk Management — exposure, scenario, controls and escalation
- Wealth Management — client profile, allocation, suitability and proposal
- Real Estate Finance — underwriting, NOI, debt, DSCR and returns

## What managers see

Managers do not have to treat “course completed” as “ready.” Employer reporting separates:

- completion stage;
- evidence coverage;
- competency-level performance and critical floors;
- Role Lab work and revision history;
- final-assessment result;
- readiness status;
- prioritized Manager Attention Queue;
- manager coaching/review notes;
- deadline and readiness notifications;
- CSV and evidence JSON exports.

This lets a manager spend time on the specific gaps demonstrated by the work rather than on arbitrary engagement scores.

## Capital Mastery Standard + Firm Layer

The standardized credential requirements remain protected. A firm can add its own terminology, expectations, resources, cases, manager notes and exercises through the **Firm Layer**.

Firm Layer content can be created, edited, versioned, reordered, hidden, archived and restored. Employer-facing permanent delete is intentionally unavailable so training changes remain recoverable and auditable.

## Employer roles and governance

Workspace access is separated across:

- **Owner** — workspace, programs, people, reports, reviews, Firm Layer and audit
- **Training Admin** — cohorts/programs, people, reports, reviews, Firm Layer and audit
- **Content Manager** — curriculum/Firm Layer without learner-performance access
- **Manager** — learner reports and reviews without workspace administration
- **Viewer** — read-only learner reporting

Organization membership and role authorization are enforced by the Cloudflare Worker rather than by navigation visibility alone.

## Trust model

Firebase Authentication handles identity. The Capital Mastery Cloudflare Worker + D1 database are authoritative for tenant roles, official grading, prerequisites, competency evidence, enterprise progress and credentials.

Official answer keys and protected grading rules stay server-side. Public credential verification is designed to expose relevant evidence without exposing private account identifiers or assessment answers.

Capital Mastery is an independent educational/workforce-readiness platform. It does not claim employer endorsement, professional licensure, accreditation or regulated-training status.

## A practical pilot

Start small enough to measure carefully:

1. choose one finance role;
2. choose Career Skills or Professional Readiness;
3. assign one cohort and one deadline;
4. review baseline evidence before training;
5. inspect the work products, revisions, competency evidence and final readiness after the program;
6. ask managers where the evidence changed their coaching priorities;
7. compare the cohort's actual time-to-independence using the firm's own KPIs rather than relying on a universal ROI claim.

The goal of a pilot is not to prove that every learner becomes “ready.” It is to determine whether Capital Mastery gives the firm a more consistent, evidence-backed way to prepare talent and identify where manager intervention is still required.
