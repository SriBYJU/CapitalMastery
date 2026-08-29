# Capital Mastery

**Learn it. Practice it. Prove it.**

Capital Mastery is a finance workforce-readiness platform that combines role learning, applied work, realistic simulations, competency measurement, and verifiable credential evidence. The original learner product remains intact while Capital Mastery 2.0 adds an employer layer for cohorts, assignments, Firm Layer customization, readiness reporting, and enterprise-grade evidence.

## Product snapshot

- **16 finance career pathways** in the preserved public learner catalog
- Existing **Foundations, Applied Skills, and Career** credentials remain supported and verifiable
- **80% mastery standard** for official assessed work
- Firebase Authentication for learner and employer sign-in
- Cloudflare Worker + D1 as the authoritative assessment, evidence, credential, and enterprise backend
- Employer organizations, cohorts, invitations, assignments, roles, audit history, and readiness reports
- Firm Layer customization with **Hide / Archive / Restore — no permanent employer delete**
- Evidence-backed competency profiles and readiness snapshots
- Investment Banking Phase 1 reference pathway with:
  - baseline diagnostic
  - Essentials Mini Case
  - Applied Skills recognition
  - seven-stage **Project Northstar** Role Lab
  - Professional Readiness Final
  - five-level V2 credential ladder
- Public privacy-safe credential verification
- LinkedIn sharing and downloadable certificate workflows
- Responsive UI, keyboard focus states, and reduced-motion support

## Phase 1 architecture

```text
GitHub Pages frontend
        │
        ├── Firebase Authentication
        │
        └── Cloudflare Worker
                │
                └── D1 authoritative database
                    ├── enterprise tenants / roles
                    ├── cohorts / assignments / invites
                    ├── diagnostics / assessments
                    ├── Role Lab submissions
                    ├── competency evidence / readiness
                    ├── credentials / evidence portfolio
                    └── audit events
```

Firebase/Firestore may synchronize non-authoritative learner state, but official assessment results, readiness evidence, and credential issuance are determined server-side by the Worker and D1.

See [`docs/architecture.md`](docs/architecture.md), [`docs/enterprise-security.md`](docs/enterprise-security.md), [`docs/phase1-release-audit.md`](docs/phase1-release-audit.md), and [`docs/phase2-roadmap.md`](docs/phase2-roadmap.md).

Phase 2 pilot materials: [`docs/employer-one-pager.md`](docs/employer-one-pager.md), [`docs/phase2-pilot-guide.md`](docs/phase2-pilot-guide.md), [`docs/phase2-security-overview.md`](docs/phase2-security-overview.md), [`docs/sample-readiness-report.md`](docs/sample-readiness-report.md), [`docs/workforce-evidence.md`](docs/workforce-evidence.md), and [`docs/pilot-demo-playbook.md`](docs/pilot-demo-playbook.md).

## Run locally

This is a static frontend. Serve the repository root with any local static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Automated QA

```bash
node tests/static-audit.mjs
node tests/logic-audit.mjs
node tests/runtime-smoke.mjs
node tests/enterprise-v2-audit.mjs
node tests/enterprise-v2-runtime-smoke.mjs
node tests/ib-reference-audit.mjs
```

The current suites cover the legacy 79%/80% mastery boundary, **189 existing application routes**, and **17 additional Enterprise V2 routes**, plus V2 sequencing, no-delete Firm Layer rules, role-based authorization, readiness/evidence features, accessibility hooks, and credential verification wiring.

## Founder

**Shriyan Avadhanula — Founder, Capital Mastery**

Capital Mastery is an independent educational platform. References to financial institutions, professional organizations, employers, and public agencies identify research sources or simulated professional contexts only and do not imply affiliation, endorsement, or sponsorship.
