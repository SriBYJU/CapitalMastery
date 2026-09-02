# Phase 1 — Detailed Report

## Executive result

Phase 1 delivered Capital Mastery Enterprise Core and the complete Investment Banking reference implementation. The release checkpoint was `abd7cf1f47a27b87d03e7d94a1e30208d195363f` on August 29, 2026. Its purpose was to prove the product architecture against real production services before expanding the pattern across every career.

## Product and system work

The frontend was connected to Firebase Authentication and a Cloudflare Worker backed by production D1. The Worker became authoritative for official assessment attempts, progression evidence, credentials, employer tenants, roles and audit records. Browser and Firestore state remained useful for continuity but could not independently issue official evidence.

Enterprise Core added:

- organization creation and last-owner protection;
- cohort and assignment lifecycles;
- exact-email learner invitations and acceptance;
- owner, administrative, content, manager/reviewer and viewer permission boundaries;
- firm-specific content with version history, hide, archive and restore behavior;
- employer and learner readiness reports;
- audit history for material employer actions;
- protected data export with grading secrets excluded; and
- rate limits and cross-tenant denial on sensitive routes.

## Investment Banking reference pathway

The Investment Banking path became the reference implementation for teach, practice, assess, simulate, revise and prove.

The curriculum covered financial statements, accounting quality, trading comparables, precedent transactions, DCF, M&A mechanics, accretion/dilution and client-ready communication. Part 3 added an interactive analyst toolkit for Excel workflow, filings and research, three-statement logic, comps, DCF, deal mechanics, model QA and pitchbook QA.

Project Northstar implemented a seven-stage synthetic transaction assignment. Learners had to use source material, complete role-format work, respond to new information, pass stage-level checks and revise failed work before progressing. The server—not the browser—determined stage results and credential eligibility.

## Defects discovered and closed

The production black-box audit found and repaired several structural defects:

1. Firebase readiness and backend verification could leave secure assessment routes in a loading state. Readiness, timeout and retry behavior were separated and hardened.
2. Legacy completeness validation assumed every question was radio-based and blocked numeric/table questions. Mixed-format validation and draft handling were repaired.
3. A progression parsing defect could leave a later part visually locked after D1 already recorded the prior pass. Progress was mirrored into the in-memory state immediately.
4. The Final Examination was not surfaced clearly after the practical simulation. A distinct locked/available/scored row was added.
5. Two Team & Roles production defects were fixed: a stale timestamp reference and a status value that violated the D1 constraint.
6. A white-on-white employer call-to-action state was corrected and placed under contrast regression coverage.

## Verification evidence

The final production journey used fresh disposable learner and employer data. The learner passed Parts 1–5, completed Project Northstar, passed the Final Examination, received the Investment Banking career credential and opened privacy-safe public verification. The employer created a workspace, assigned the pathway and opened readiness, role and audit surfaces.

Automated gates included:

- 16-career legacy structure preservation;
- the exact 79% fail / 80% pass boundary;
- 189 legacy runtime routes;
- 17 Enterprise V2 routes;
- Investment Banking workflow and source-path consistency;
- authentication/loading regression;
- mixed numeric/radio submission;
- progression mirroring; and
- Final Examination surface/state behavior.

Production D1 returned `quick_check = ok`, no orphaned assignment/cohort or cohort-member records, and no active organization without an owner. The configured D1 binding, Firebase project, origin allowlist, secret administrator binding and Worker observability were preserved.

## Cleanup and limits

Temporary D1 organizations, memberships, attempts, progress, credentials and audit events were deleted in foreign-key-safe order and rechecked. A historical disposable Firebase identity could not be removed through the automation available during one earlier check; it held no authoritative D1 evidence or employer access. Later release work added stronger Firebase cleanup and closure probes.

Phase 1 was product-complete for its declared scope. It was not an external security attestation, accessibility certification or proof of every-career content depth. Phase 2 addressed the full-product expansion and wider browser/production closure.

Primary evidence: [Phase 1 release audit](../phase1-release-audit.md).
