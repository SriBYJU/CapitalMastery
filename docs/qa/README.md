# QA Tooling

- `ui_smoke.py` — sweeps 180 application routes across all 16 career pathways in an isolated browser context.
- `full_audit.py` — validates curriculum depth, credential counts, JavaScript syntax, route rendering, quiz sizes, 79/80 boundary behavior, simulation workspaces, sharing modals and mobile overflow.
- `generate_previews.py` — generates the organized product-preview screenshot package from the actual application DOM.
- `audit-results.json` — latest machine-readable audit result.

These scripts use an in-memory storage adapter so Firebase is not required for QA.
