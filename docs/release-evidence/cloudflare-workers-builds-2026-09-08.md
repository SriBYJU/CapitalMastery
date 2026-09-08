# Cloudflare Workers Builds release path

As of 2026-09-08, the existing `capital-mastery-api` Worker is connected directly to `SriBYJU/CapitalMastery` through Cloudflare Workers Builds.

- Production branch: `main`
- Deploy command: `npx wrangler deploy`
- Canonical frontend: GitHub Pages (`https://sribyju.github.io/CapitalMastery`)
- Worker entrypoint and D1 binding remain defined by `wrangler.jsonc`
- Cloudflare Pages is not the canonical frontend deployment target

This file is deployment metadata only; it does not alter application behavior.
