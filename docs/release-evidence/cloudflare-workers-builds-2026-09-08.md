# Cloudflare Workers Builds release path

As of 2026-09-08, the existing `capital-mastery-api` Worker is connected directly to `SriBYJU/CapitalMastery` through Cloudflare Workers Builds.

- Production branch: `main`
- Deploy command: `npx wrangler deploy`
- Canonical frontend: GitHub Pages (`https://sribyju.github.io/CapitalMastery`)
- Worker entrypoint and D1 binding remain defined by `wrangler.jsonc`
- Cloudflare Pages is not the canonical frontend deployment target
- D1 schema migrations are intentionally not run automatically by Workers Builds. A release that requires a schema change must first use the explicit, fail-closed `tools/prepare-production-d1.mjs` operator flow, validate row preservation plus SQLite integrity checks, and only then allow the compatible Worker code to be promoted.

This separation prevents an ordinary code or frontend push from implicitly mutating production D1 while preserving a guarded migration path for releases that actually require schema work.
