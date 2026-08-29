# Firebase Production Configuration

## Current status

Firebase is connected for Capital Mastery production authentication.

Current public Web App configuration is loaded from `firebase-config.js` and the production project ID is `capital-mastery26`.

Authorized production usage includes the Capital Mastery GitHub Pages origin and the Firebase-hosted project domains used during authentication/setup.

## Authentication

Capital Mastery supports the configured Firebase Authentication providers used by the frontend, including the shared onboarding flow that collects the learner's full credential name after account creation.

The browser sends Firebase ID tokens to the Cloudflare Worker. The Worker independently verifies each token before official assessment, credential, learner, or employer operations.

## Firestore role

Firestore may synchronize non-authoritative learner/profile state. It is not the source of truth for official assessment results, competency evidence, readiness, enterprise permissions, or credential issuance.

## Authoritative backend

The production Cloudflare Worker and D1 database are authoritative for:

- official assessment attempts and progress
- organizations, members, invites, cohorts, and assignments
- Firm Layer content and versions
- competency evidence and scores
- readiness snapshots
- Role Lab runs and submissions
- V2 assessment attempts
- credential definitions, issuance, evidence, status, and verification
- enterprise audit events

## Secret handling

Never commit service-account JSON, private keys, admin passwords, refresh tokens, Cloudflare credentials, or server secrets.

The production administrator UID is stored as a Cloudflare secret binding and is intentionally absent from this repository.
