# Capital Mastery Phase 2 — Security & Data Boundary Overview

## Identity

- Firebase Authentication provides account identity.
- The Worker verifies Firebase ID tokens for authenticated API operations.
- Full-name onboarding is used for credential identity; authoritative enterprise access never comes from browser-only state.

## Tenant isolation and roles

Organization membership and role are looked up server-side in D1. Employer roles are owner, training_admin, content_manager, manager and viewer; learner access is scoped to accepted membership/cohort assignment.

A client-provided organization, cohort or assignment ID is never sufficient by itself to obtain access.

## Assessment integrity

- official answer keys and grading rules remain server-side;
- public diagnostic and assessment responses exclude correct answers;
- Role Lab public task payloads exclude grading JSON;
- attempt limits are enforced by the Worker;
- prerequisite sequencing is enforced server-side.

## Credentials

Standard 2.0 credentials carry versioned evidence. Public verification intentionally excludes Firebase UIDs, account email addresses and answer content. Synthetic `DEMO-*` credentials are explicitly excluded from both public verification routes.

## Employer content

Firm Layer content is versioned. Employers can edit, reorder, hide, archive and restore their content. No employer-facing permanent DELETE route exists for Firm Layer content.

## Admin Demo/Test Lab

Demo creation, reset, learner-state controls and permission matrix are restricted to the configured Capital Mastery admin identity. Demo learners use synthetic `.invalid` email addresses and synthetic UIDs; they are not real Firebase users.

## Data export

Signed-in users can export their Capital Mastery enterprise data. Secure answer keys and hidden grading rules are intentionally excluded.
