# QA Tooling

Capital Mastery's QA tooling is designed to validate behavior without modifying production learner or employer data.

## What the QA tools cover

- `ui_smoke.py` — sweeps application routes in an isolated browser context.
- `full_audit.py` — validates curriculum depth, credential counts, JavaScript syntax, route rendering, quiz sizes, the 79/80 credential boundary, simulation workspaces, sharing modals, and mobile overflow.
- `generate_previews.py` — generates the organized product-preview screenshot package from the application DOM.
- `audit-results.json` — latest machine-readable audit result.
- `tools/run-browser-audits-local.mjs` — runs the browser regression suite against a loopback-only local build.

## Data-safety boundary

The audit harnesses must not be pointed at production. `full_audit.py` uses an in-memory storage adapter and a synthetic `window.CM_AUTH` object only to reproduce the authenticated Admin/QA boundary; it does not sign in to Firebase or read/write D1, employer workspaces, cohorts, organization settings, or learner progress.

The local browser runner serves `dist-pages` only on `http://127.0.0.1:4173` and refuses a non-loopback `CM_AUDIT_URL`. Employer, learner, role, invite, persistence, and assessment browser audits use synthetic users/state and mocked or intercepted backend responses where mutation behavior is exercised. Do not add production credentials, secrets, real organization IDs, or a production URL to these test commands.

## Run the isolated full audit

From a clean clone with Node.js and Python 3 installed:

```bash
python3 -m pip install "playwright==1.55.0"
python3 -m playwright install chromium
npm run qa:full
```

`full_audit.py` lets Playwright resolve its own installed Chromium binary. It does not depend on `/usr/bin/chromium`.

## Run the browser regression suite locally

```bash
npm install
npm run qa:browser
```

`qa:browser` installs the pinned Playwright test dependency without saving it to `package.json` or `package-lock.json`, installs Chromium, builds `dist-pages`, starts a loopback-only local server, and runs the browser audits through `tools/run-browser-audits-local.mjs`.

The runner includes employer-facing role/invite/admin-usage checks plus learner assessment, progression, persistence, admin simulation, accessibility, and general route regression coverage. It stops on the first failure and shuts down the local server when finished.

## CI

The failure-seeking workflow runs the same classes of static and browser checks on pull requests before changes are merged. QA changes should be validated there before landing on `main`.
