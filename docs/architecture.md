# Architecture

## Current pre-Firebase build

- Static single-page application
- Hash routing for GitHub Pages compatibility
- `data.js` contains career curriculum/source definitions
- `app.js` renders all pages, assessments, simulation workspaces, credentials and admin QA
- `styles.css` contains the complete responsive design system
- Local browser state is used only so the product can be fully tested before Firebase is configured

## Production target

```text
Browser
  ├─ Firebase Authentication
  ├─ Firestore learner profile/progress
  ├─ Career content (versioned)
  └─ HTTPS callable functions
        ├─ gradeAuthoritativeAssessment
        ├─ verifyCredentialEligibility
        ├─ issueCredential
        ├─ reissueCredential
        └─ revokeCredential

Public verification route
  └─ Read-only public credential projection
```

## Data entities

- users
- careerProgress
- assessmentAttempts
- simulations
- credentialDefinitions
- credentials
- publicCredentials
- sourceMappings
- auditEvents

## Why production credentials are server-issued
Client-side code is inspectable and modifiable. An education platform can use client-side grading for practice, but a public credential that claims verified assessment performance must be issued from authoritative server state.
