# Zero-Cost Recovery Runbook

This runbook protects the current Capital Mastery product without requiring a registered company, paid backup vendor or new account.

## Recovery sources

| Surface | Recovery source | Cost | Current boundary |
|---|---|---:|---|
| Frontend and Worker source | Git history in the public GitHub repository | $0 | Rebuild or redeploy a known-good commit. |
| Cloudflare D1 authoritative records | Automatically enabled D1 Time Travel | $0 on the current Workers Free plan | Seven-day point-in-time recovery window. |
| Firestore learner synchronization | Firestore plus the learner's UID-bound local state | Existing free project allowance | Non-authoritative convenience state; D1 remains authoritative for official evidence and credentials. |
| Release evidence | GitHub Actions logs and committed release reports | $0 for this public repository on standard runners | Never store tokens or personal-data exports in Actions artifacts. |

The deployable Worker entrypoint is `v2/invite-revoke-overlay.js`. It adds only the Owner/Training Admin pending-invitation revoke endpoint and delegates every other request to `v2/production-experience-overlay.js`. The production overlay provides the production browser/preflight, employer-assignment activity and assigned-track safety layer, then delegates to `v2/platform-admin-overlay.js`. The admin overlay preserves the exact founder/admin identity boundary and delegates the rest of the product to the reviewed core Worker in `v2/worker-v2-phase1-release.js`. Recovery or rollback must keep all four files compatible; do not bypass these overlays by pointing Wrangler directly at the core Worker unless the equivalent protections have first been restored in another reviewed entrypoint.

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
4. For a Worker regression, redeploy the last known-good reviewed Worker version through `v2/invite-revoke-overlay.js` and verify `/health`, bad-origin rejection, unauthenticated rejection, platform-admin rejection for non-admin identities, authenticated admin CORS preflight, pending-invite revoke authorization, and employer-assignment activity/report boundaries.
5. For suspected D1 corruption, run read-only integrity checks first. Do not restore if `quick_check` and foreign keys are healthy unless a confirmed logical-data incident exists.
6. If D1 restoration is genuinely required, retrieve bookmarks for both the current state and intended timestamp, record both, and use Cloudflare's documented Time Travel restore procedure.
7. After any restoration, rerun D1 integrity, tenant-boundary, learner-progress, credential-verification, employer-role, invite-revoke, assignment-track, and platform-admin checks.

## Destructive-operation guard

D1 restore overwrites production in place. It is intentionally **not automated** in this repository. Never run a restore merely because a health check failed, and never guess a timestamp or bookmark. A specific confirmed incident, a recorded pre-restore bookmark and an identified restore point are required.

## Recovery objectives for the current project stage

- **Code recovery target:** same day, using a known-good Git commit.
- **D1 recovery point:** any recoverable minute within the current seven-day free-plan Time Travel window.
- **Firestore boundary:** learner synchronization may need to rehydrate from the user device; no claim of paid managed backup is made.

These are engineering targets, not a contractual service-level agreement.