# Capital Mastery

**Learn it. Practice it. Prove it.**

Capital Mastery is a student-first finance career training platform built around concise learning, role-specific technical skills, applied work, graded job simulations and three levels of certificates per pathway.

## Product snapshot

- **16 finance career pathways**
- **48 total certificates** (marketed as **45+ free credentials**)
- **5 mandatory stages per career**
- **80% minimum mastery standard**
- **10-question part assessments**
- **Role-specific practical job simulations**
- **20-question final examinations**
- **Foundations, Applied Skills and Career Certificates**
- **LinkedIn add/share workflow**
- **Credential verification architecture**
- **Admin / QA lab**
- **Public-data/source methodology**
- Responsive desktop/mobile interface

## Firebase status

Everything in the product is implemented for local QA except the production account/backend layer that requires the owner to create and configure the Firebase project. Until Firebase is connected, progress and preview credentials are stored locally in the browser and are explicitly marked as QA previews.

After Firebase is configured, the integration plan is documented in [`docs/firebase-setup.md`](docs/firebase-setup.md). Production credential issuance must be server-authoritative; users must never be allowed to create credentials by editing browser state.

## Run locally

This is a static web app. Serve the repository root with any local static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## QA

The repository includes automated audit scripts and an organized product-preview screenshot package.

- [`FEATURE_CHECKLIST.md`](FEATURE_CHECKLIST.md)
- [`FINAL_QA_REPORT.md`](FINAL_QA_REPORT.md)
- [`docs/qa/audit-results.json`](docs/qa/audit-results.json)
- [`docs/product-preview/`](docs/product-preview/)

The current audit covers 180 application routes, 16 pathways, quiz/final counts, the 79%/80% threshold boundary, credential issuance logic, sharing flows, simulation workspace generation and mobile overflow.

## Founder

**Shriyan Avadhanula — Founder, Capital Mastery**

Capital Mastery is an independent educational platform. References to financial institutions, professional organizations and public agencies identify public research sources only and do not imply affiliation, endorsement or sponsorship.
