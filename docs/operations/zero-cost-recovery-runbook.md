# Zero-Cost Recovery Runbook

This runbook protects the current Capital Mastery product without requiring a registered company, paid backup vendor or new account.

## Recovery sources

| Surface | Recovery source | Cost | Current boundary |
|---|---|---:|---|
| Frontend and Worker source | Git history in the public GitHub repository | $0 | Rebuild or redeploy a known-good commit. |
| Cloudflare D1 authoritative records | Automatically enabled D1 Time Travel | $0 on the current Workers Free plan | Seven-day point-in-time recovery window. |
| Firestore learner synchronization | Firestore plus the learner's UID-bound local state | Existing free project allowance | Non-authoritative convenience state; D1 remains authoritative for official evidence and credentials. |
| Release evidence | GitHub Actions logs and committed release reports | $0 for this public repository on standard runners | Never store tokens or personal-data exports in Actions artifacts. |

Cloudflare states that D1 Time Travel is always enabled, history and restore have no additional cost, and the Free plan retains seven days. Source: <https://developers.cloudflare.com/d1/reference/time-travel/>.

## Verification performed on September 2, 2026

- `wrangler 4.128.0` reached `capital-mastery-prod`.
- D1 reported 37 tables and a current Time Travel bookmark.
- `PRAGMA quick_check` returned `ok`.
- `PRAGMA foreign_key_check` returned zero violations.
- The integrity query wrote zero rows and did not change the database.

The bookmark value is deliberately not committed. Anyone with production recovery authority should retrieve a fresh bookmark at incident time.

## Safe recovery decision

1. Stop deployments and determine whether the problem is frontend code, Worker code, D1 data, or non-authoritative Firestore sync.
2. Preserve the failing commit SHA, timestamps, screenshots/logs and the current D1 bookmark.
3. For a frontend regression, redeploy the last known-good Git commit and rerun the live read-only audits.
4. For a Worker regression, redeploy the last known-good reviewed Worker version and verify `/health`, bad-origin rejection and unauthenticated rejection.
5. For suspected D1 corruption, run read-only integrity checks first. Do not restore if `quick_check` and foreign keys are healthy unless a confirmed logical-data incident exists.
6. If D1 restoration is genuinely required, retrieve bookmarks for both the current state and intended timestamp, record both, and use Cloudflare's documented Time Travel restore procedure.
7. After any restoration, rerun D1 integrity, tenant-boundary, learner-progress, credential-verification and employer-role checks.

## Destructive-operation guard

D1 restore overwrites production in place. It is intentionally **not automated** in this repository. Never run a restore merely because a health check failed, and never guess a timestamp or bookmark. A specific confirmed incident, a recorded pre-restore bookmark and an identified restore point are required.

## Recovery objectives for the current project stage

- **Code recovery target:** same day, using a known-good Git commit.
- **D1 recovery point:** any recoverable minute within the current seven-day free-plan Time Travel window.
- **Firestore boundary:** learner synchronization may need to rehydrate from the user device; no claim of paid managed backup is made.

These are engineering targets, not a contractual service-level agreement.
