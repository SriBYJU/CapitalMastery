# Capital Mastery

**Learn it. Practice it. Prove it.**

Capital Mastery is a free finance workforce-readiness platform built around a simple question: **can a learner perform role-specific finance work at a defensible standard, not merely finish content?**

The platform combines structured teaching, immediate practice, professional work products, realistic role simulations, competency evidence, verifiable credentials, and an employer layer for pre-Day-1 readiness programs.

## Product snapshot

- **16 finance career pathways** spanning deals, investing, markets, corporate finance, clients/risk, and real assets
- Two preparation tracks on each career pathway:
  - **Career Skills Program** — a shorter practical route through Foundations, Essentials and Applied Skills
  - **Professional Readiness Program** — the full route through Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness
- Career Skills work carries forward into Professional Readiness; learners do not repeat the first three verified milestones
- A five-level **Capital Mastery Standard 2.0** evidence ladder for each career
- Practice immediately after newly taught concepts rather than assessment-only progression
- Mixed assessment formats: calculations, tables, source review, judgment, written work, spreadsheet-style work and professional simulations—not MCQ-only pathways
- Role-native workbenches for modeling, underwriting, research, planning, markets, risk, client and real-estate workflows
- Firebase Authentication for learner and employer identity
- Cloudflare Worker + D1 as the authoritative assessment, evidence, credential and enterprise backend
- Employer organizations, cohorts, invitations, assignments, server-enforced roles, audit history and readiness reports
- Firm Layer customization with versioning and **Hide / Archive / Restore — no permanent employer delete**
- Manager review, attention signals, competency evidence and readiness snapshots
- Privacy-conscious public credential verification
- LinkedIn sharing and downloadable certificate workflows
- Responsive layouts, keyboard focus states, reduced-motion support and release browser testing
- Free for learners and employers; no subscription, seat fee or trial gate

## Training architecture

```text
                         CAPITAL MASTERY
                                │
               ┌────────────────┴────────────────┐
               │                                 │
       Career Skills Program          Professional Readiness Program
               │                                 │
        Foundations ✓                         Foundations ✓
        Essentials ✓                          Essentials ✓
        Applied Skills ✓                      Applied Skills ✓
               │                                 │
       practical completion                     Role Lab ✓
                                                 │
                                          revision / evidence
                                                 │
                                      Professional Readiness ✓
```

The Career Skills Program can produce a printable/shareable program-completion certificate, but that document does **not** create a sixth Standard 2.0 credential level. The verified career milestones remain Foundations, Essentials, Applied Skills, Role Lab and Professional Readiness.

## System architecture

```text
GitHub Pages canonical frontend
        │
        ├── Cloudflare Pages mirror
        │
        ├── Firebase Authentication
        │
        └── Cloudflare Worker
                │
                └── D1 authoritative database
                    ├── enterprise tenants / server roles
                    ├── cohorts / assignments / invitations
                    ├── diagnostics / secure assessments
                    ├── Role Lab submissions / revisions
                    ├── competency evidence / readiness
                    ├── credentials / evidence portfolio
                    ├── Firm Layer versions
                    ├── notifications / manager reviews
                    └── audit events
```

Firebase/Firestore may synchronize non-authoritative learner state, but official assessment results, readiness evidence, enterprise access and credential issuance are determined server-side by the Worker and D1.

## Employer model

Capital Mastery is designed as a **finance-readiness layer**, not a replacement for HR onboarding. Employers can:

1. choose a finance career and preparation track;
2. create cohorts and assign programs;
3. inspect the protected Capital Mastery Standard before launch;
4. add firm-specific terminology, resources and cases through the Firm Layer;
5. monitor completion, readiness, competency evidence and coaching signals separately;
6. review learner work where their role permits;
7. export readiness evidence and inspect material audit history.

Workspace permissions are separated across Owner, Training Admin, Content Manager, Manager and Viewer roles, with authoritative organization checks enforced by the Worker.

## Documentation

Start here for technical or firm review:

- [`docs/reports/README.md`](docs/reports/README.md) — simple and detailed reports for every phase plus the full project
- [`docs/release-evidence/phase2-status-2026-09-01.md`](docs/release-evidence/phase2-status-2026-09-01.md) — final Phase 2 production evidence and audited artifact IDs
- [`docs/training-track-standard.md`](docs/training-track-standard.md) — Career Skills / Professional Readiness product contract and no-repeat stacking rules
- [`docs/credential-system.md`](docs/credential-system.md) — five-level Standard 2.0 credential architecture and program-completion distinction
- [`SECURITY.md`](SECURITY.md) — implemented security boundaries, release checks and claim limits
- [`docs/deployment-runbook.md`](docs/deployment-runbook.md) — guarded Cloudflare promotion, live validation and rollback procedure
- [`docs/operations/README.md`](docs/operations/README.md) — zero-cost threat model, monitoring, recovery and incident response

Architecture and security detail:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/enterprise-security.md`](docs/enterprise-security.md)
- [`docs/phase2-security-overview.md`](docs/phase2-security-overview.md)

Release history:

- [`docs/phase1-release-audit.md`](docs/phase1-release-audit.md)
- [`docs/archive/README.md`](docs/archive/README.md) — clearly labeled superseded Phase 1 QA/checklist/live-release snapshots

Employer / pilot materials:

- [`docs/employer-one-pager.md`](docs/employer-one-pager.md)
- [`docs/phase2-pilot-guide.md`](docs/phase2-pilot-guide.md)
- [`docs/sample-readiness-report.md`](docs/sample-readiness-report.md)
- [`docs/workforce-evidence.md`](docs/workforce-evidence.md)
- [`docs/pilot-demo-playbook.md`](docs/pilot-demo-playbook.md)

## Run locally

This is a static frontend. Serve the repository root with a local static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Release QA

Phase 2 uses separate source, browser and live-production gates rather than treating one smoke test as release proof.

Key automated gates include:

- Worker and frontend syntax validation
- all **88 dependency-free regression audits**
- D1 integrity-route contract
- production Pages allowlist / security-header bundle audit
- state-resilience Chromium testing
- failure-seeking browser torture testing
- learner-guide mobile testing
- **16 careers × both tracks × 6 release widths**
- employer public walkthrough / calculator testing
- keyboard/dialog accessibility and ten-route contrast testing
- **Owner / Training Admin / Content Manager / Manager / Viewer** browser role-matrix testing

The exact Phase 2 evidence and artifact identifiers are recorded in [`docs/release-evidence/phase2-status-2026-09-01.md`](docs/release-evidence/phase2-status-2026-09-01.md). Current assurance work is summarized in [`docs/reports/phase-3-detailed.md`](docs/reports/phase-3-detailed.md). Do not infer production completion from a green source build alone.

## Production build

Build and audit the frontend-only Cloudflare Pages artifact before deployment:

```bash
node tools/build-pages.mjs
node tests/pages-production-bundle-audit.mjs
```

Deploy `dist-pages/`, never the repository root. The production bundle excludes Worker code, tests, migrations, diagnostics and internal documentation.

The Worker and Pages surfaces are deployed separately. When both change, promote the reviewed Worker while preserving existing Cloudflare bindings/secrets, validate D1/auth/origin boundaries, then deploy the exact audited Pages artifact and rerun the live browser matrix. The repository includes a guarded manual-only **Cloudflare production release** workflow for this sequence; it refuses to run without the required Cloudflare Actions credentials and explicit `RELEASE` confirmation. See [`docs/deployment-runbook.md`](docs/deployment-runbook.md).

## Independence and claims

Capital Mastery is an independent educational and workforce-readiness platform. References to financial institutions, professional organizations, employers and public agencies identify research sources or simulated professional contexts only and do not imply affiliation, endorsement or sponsorship.

Capital Mastery does not claim professional licensure, accreditation, regulatory-training status, SOC 2, ISO 27001 certification, or another third-party security/compliance certification unless explicitly documented.

## Founder

**Shriyan Avadhanula — Founder, Capital Mastery**


## Animation dependency

Run `npm ci` at the repository root to install the pinned Framer Motion dependency.
The current frontend uses plain JavaScript. For future bundled browser code, use
`import { animate, inView, scroll } from "framer-motion/dom"` rather than the React entry point.
Bare npm imports need a browser bundling step; installing this dependency alone does not
load it into the static site or add animations. Preserve reduced-motion support and clean
up animations and observers when removing views.
