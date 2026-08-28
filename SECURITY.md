# Security Notes

## Secrets
No Firebase service-account credentials, admin passwords, private API keys or authentication tokens belong in this repository.

The designated admin account must be created inside Firebase Authentication later. Admin capability must be granted through a server-controlled custom claim and validated by Security Rules / Cloud Functions, not by checking an email address in client-side JavaScript.

## Preview build
The pre-Firebase version uses local browser state so every UX flow can be tested. Any credential produced before server-side issuance is explicitly a **QA preview** and must not be treated as a live verified credential.

## Production credential issuance
Production flow:

1. Learner completes requirements.
2. Client requests eligibility verification.
3. Server/Cloud Function reads authoritative assessment state.
4. Function independently checks every required 80% threshold.
5. Function creates immutable credential record and issue timestamp.
6. Public verification page reads only the safe public credential projection.

The browser must never be allowed to set `certificateEarned=true`, authoritative scores or admin status.

## Firebase rules
A starter rules design is provided in `firestore.rules.example`. It intentionally defaults to deny for credential writes.
