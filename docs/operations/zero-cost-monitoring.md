# Zero-Cost Production Monitoring

Capital Mastery uses two bounded GitHub Actions workflows that require no new vendor, paid plan or production secret.

## Daily health and security monitor

Workflow: `.github/workflows/zero-cost-production-monitor.yml`

The monitor checks:

- canonical GitHub Pages HTML and core logo availability;
- presence of the document Content Security Policy;
- Worker and D1 health;
- no-store and MIME-sniffing protections on the API;
- bad-origin rejection for both normal and preflight requests;
- unauthenticated API rejection; and
- deterministic unknown-route handling.

It runs daily at 12:17 UTC and can also be dispatched manually. A failure makes the workflow red and writes a readable results table into the GitHub Actions job summary.

## Weekly bounded resilience check

Workflow: `.github/workflows/zero-cost-resilience-audit.yml`

The check sends only read-only traffic: 24 requests to the static shell and 24 requests to Worker/D1 health, capped at concurrency four. The script itself refuses live execution without an explicit live-load flag and caps all configuration at 60 requests per target and concurrency six.

This is a safe regression signal, not a capacity benchmark or load-test certification. It runs Sunday at 13:27 UTC and reports response failures plus p50, p95 and p99 timing.

## Failure response

1. Open the failed job and identify whether the frontend, asset, Worker/D1, origin or authentication boundary failed.
2. Confirm the failure once from a separate network before treating a timeout as an outage.
3. Stop deployment if authentication, tenant isolation, credential integrity or D1 integrity is involved.
4. Follow the [incident response playbook](incident-response-playbook.md).
5. Use the [recovery runbook](zero-cost-recovery-runbook.md) only after identifying the failed layer.

## Important operating limits

- Scheduled GitHub Actions can be delayed during high load and are not real-time monitoring.
- GitHub may disable scheduled workflows in a public repository after 60 days without repository activity. Re-enable them in the Actions tab if that occurs.
- These checks do not process real learner work, create test tenants or mutate D1.
- No uptime, response-time or recovery guarantee is claimed.

References: [GitHub Actions workflow syntax and schedule behavior](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#onschedule), [GitHub Actions usage for public repositories](https://docs.github.com/en/actions/concepts/billing-and-usage).
