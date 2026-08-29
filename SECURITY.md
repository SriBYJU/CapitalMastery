# Security Notes

## Production security boundary

Capital Mastery treats the browser as untrusted for official results. Firebase Authentication establishes identity, while the Cloudflare Worker verifies the Firebase ID token and enforces authorization against D1 before returning or changing authoritative data.

Official assessment scores, enterprise membership, competency evidence, readiness snapshots, credential issuance, credential status, and public verification are authoritative in D1.

## Secrets

Do not commit:

- Firebase service-account credentials
- Cloudflare API tokens
- private keys
- admin passwords
- Firebase refresh tokens
- bearer tokens
- any server-only secret

The production administrator UID is stored in Cloudflare as the `ADMIN_UID` `secret_text` binding. Its value is not present in this repository. Worker deployments preserve that binding through Cloudflare binding inheritance.

The Firebase Web App configuration in `firebase-config.js` is client configuration, not a service-account credential.

## Authentication checks

The Worker verifies Firebase ID tokens using Google's signing keys and validates the RS256 signature, signing key ID, expiration, issue time, authentication time sanity, project audience, issuer, and subject.

## Tenant authorization

Enterprise access is resolved server-side from `organization_members`. Client-provided organization IDs do not grant access. Mutating routes enforce role checks for Owner, Training Admin, Content Manager, Manager, Viewer, and Learner capabilities.

The last active owner cannot be removed or archived.

## Assessment and credential integrity

- official answer keys are never returned to the learner frontend
- hidden Role Lab grading rules remain server-side
- V2 diagnostic and standardized assessment submission rates are limited
- Role Lab tasks enforce configured maximum attempts
- stable evidence IDs prevent repeated attempts from multiplying evidence weight
- failed retakes do not erase stronger previously demonstrated evidence
- Professional Readiness requires the direct Role Lab record, Professional Final, prerequisite credentials, readiness threshold, full evidence coverage, and critical competency floors

## Employer content lifecycle

Firm Layer content is versioned. Employer-facing lifecycle actions are **Hide**, **Archive**, and **Restore**. There is intentionally no permanent employer DELETE endpoint. Required Capital Mastery Standard content cannot be hidden.

## Privacy and exports

The My Data export includes the learner's enterprise membership/training/evidence metadata but intentionally excludes answer keys and hidden grading rules. Public credential verification exposes only privacy-safe evidence.

## Local QA mode

Legacy browser QA helpers remain available for deterministic regression testing. Any local QA preview credential is explicitly non-authoritative and is separate from live D1-issued credentials.
