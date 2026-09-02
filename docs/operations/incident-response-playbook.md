# Zero-Cost Incident Response Playbook

This playbook is for the Capital Mastery product in its current project stage. It is useful whether or not a company is later formed.

## Severity

- **SEV-1 — critical:** suspected credential/answer-key exposure, cross-account or cross-tenant access, destructive data loss, compromised deployment credentials, or widespread inability to use the product.
- **SEV-2 — major:** one important workflow is unavailable, production progress cannot save, credential verification is incorrect, or a serious accessibility blocker affects a core route.
- **SEV-3 — limited:** localized visual, content or non-critical feature defect with a workaround.

## First 15 minutes

1. Record UTC time, affected URL, user-visible symptom and current Git commit.
2. Stop new deployments.
3. Do not paste tokens, personal data, private assessment answers or database exports into an issue or chat.
4. Check the scheduled production-monitor run, GitHub Pages status, Worker `/health`, D1 integrity and recent deployment history.
5. If confidentiality or tenant isolation may be affected, treat it as SEV-1 even if only one report exists.

## Containment

- Revoke or rotate a genuinely exposed credential through its owning platform; never commit the replacement.
- Roll back only the affected deployable surface. Keep the GitHub Pages frontend, Cloudflare mirror, Worker and D1 boundaries separate.
- Do not weaken authentication, origin checks, tenant authorization, assessment sequencing or answer-key isolation to restore availability.
- Preserve evidence before cleanup. Use synthetic test records for reproduction whenever possible.

## Recovery and validation

- Frontend: redeploy a known-good commit, then run generation, privacy-boundary, responsive and browser checks.
- Worker: redeploy a known-good reviewed version, then confirm health, D1 reachability, bad-origin rejection, unauthenticated rejection and protected Admin routes.
- D1: follow `zero-cost-recovery-runbook.md`; restoration is a last resort and is never triggered automatically.
- Authentication/Firestore: verify UID-bound hydration and same-tab account switching before declaring recovery.

## Closeout

Record the cause, affected period, affected records or users, containment, final fix, verification evidence and one permanent regression test. Do not describe an incident as closed until the fix is deployed and the relevant live test is green.

This is an engineering response process, not a contractual SLA, regulatory-notification determination or substitute for legal advice.
