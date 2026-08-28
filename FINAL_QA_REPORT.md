# Capital Mastery — Production End-to-End QA Report

**Audit date:** August 27–28, 2026  
**Release scope:** Production learner experience with Firebase Authentication, Firestore progress sync, Cloudflare Worker grading, D1 credentials, mobile UX, and public verification.  
**Current release gate:** **PASS WITH PRODUCTION SAFEGUARDS ACTIVE**

## Production stack now connected

- Firebase Email/Password Authentication
- Google sign-in
- Required post-sign-up credential-name setup
- Firestore cross-device learner progress sync
- Cloudflare Worker Firebase ID-token verification
- D1 authoritative assessment progress
- D1 authoritative credential records
- Automatic Foundations / Applied Skills / Career credential issuance
- Public credential verification
- Credential certificate, LinkedIn helper, and sharing UI
- Server-verified administrator access

## Confirmed production flows

The production integration has been exercised through the live learner flow, including:

- Firebase sign-in → secure Worker verification
- Firestore learner document + `/progress/state` creation
- Official Worker-graded assessment submission
- Passing score persisted to D1
- Automatic D1 credential issuance
- Public verification of an active Foundations credential
- Real credential display in the credential UI

## Assessment coverage

Capital Mastery keeps a substantial assessment load rather than a participation-only flow:

- **16 career pathways**
- **5 learning stages per pathway**
- **10 questions per official part assessment**
- **7 objective questions + written recommendation for the official job simulation**
- **20 questions on the final examination**
- **80% minimum mastery standard**
- **3 credentials per pathway = 48 total credentials**

## User-experience bugs found and fixed

### 1. Browser Back / stale progress after a passed quiz — FIXED
Official results are reconciled from D1 when the learner returns to a pathway. Result-page navigation performs a clean refresh so the old in-memory `app.js` state cannot overwrite or visually hide an already-recorded pass.

### 2. “Mark Complete” requirement was not obvious enough — FIXED
Each lesson now shows a clear completion callout. The assessment button visibly remains locked until **Mark Learning Complete** is used. Once marked, the button changes to a completed state and the learner is told that 80%+ is still required on the assessment.

### 3. Quiz-result refresh confusion — FIXED
After an official submission the result page explicitly confirms that the result is saved and tells the learner to reload once if a pathway card does not immediately show the new completion state. Automatic D1 reconciliation is also performed when returning to the course.

### 4. Assessment answers could be lost during navigation — FIXED
Official assessment answers are temporarily preserved in session storage while the learner works. Returning to the same assessment in the same tab restores unfinished answers.

### 5. Incomplete assessments could be submitted accidentally — FIXED
The production UI now blocks submission when required questions are unanswered and highlights the missing question(s). Simulation writing is required when present.

### 6. Legacy client-side practical simulation could conflict with the secure backend — FIXED
Production learners are redirected from the old browser-scored simulation route to the **official server-graded simulation**. The legacy route remains available only for local/admin QA preview mode.

### 7. Part 5 could visually look complete before the practical simulation was passed — FIXED
Part 5 completion is reconciled against the authoritative simulation record. Passing the Part 5 knowledge check alone no longer represents the whole practical simulation as complete.

### 8. Firestore state timestamps could make local/cloud recency unreliable — FIXED
Local learner-state saves now receive a real `updatedAt`, hydration no longer manufactures a new timestamp on every read, and the root Firebase user `createdAt` is no longer intentionally rewritten on every sync.

### 9. Mobile account/profile access was hidden — FIXED
The account control is now forced visible in the mobile header. The hamburger menu also includes **Profile / Account** for signed-in learners and **Sign in / Create Account** for signed-out visitors.

### 10. Applied-work saving gave no visible feedback — FIXED
Applied-work textareas now display save feedback while the existing Firestore/local progress save continues underneath.

### 11. Duplicate technical concept rendering — FIXED
Repeated concept cards are de-duplicated in the rendered lesson so learners do not encounter the same technical unit twice because of duplicate source-data references.

### 12. Founder contact information was missing from About — FIXED
The About page now includes a direct contact option and the requested LinkedIn profile link.

### 13. Stale pre-production copy — FIXED
Production-facing text that still referred to Firebase as “pending” or implied the admin/backend was not connected is overridden with the current production architecture where applicable.

## Sign-up / identity UX

The signed-out learning flow now follows:

**Learning CTA → account explanation → Google or Email sign-in/sign-up → required full first + last name → learning**

The account gate explains that sign-in is needed to save progress, connect official assessment results to the learner, and issue verified credentials. The full-name step is required before the learner continues into gated coursework so future credentials have an intentional display name.

## Credential UX

Active authoritative D1 credentials now support:

- View Certificate
- Credential Details
- Public Verification
- Add to LinkedIn helper
- LinkedIn post generator
- Credential ID copy
- Verification URL copy
- Print / Save PDF
- PNG export fallback

Existing credentials keep the holder name recorded at issuance; changing the account display name is not presented as retroactively changing an already-issued credential record.

## Security notes

- Browser/localStorage scores are not authoritative for production credentials.
- Firebase ID tokens are verified by the Worker before protected API access.
- Admin authorization is determined server-side.
- Public verification does not expose the learner UID or email.
- Firestore convenience progress is separate from D1 official grading/credential authority.
- QA preview mode remains clearly separate from production credential authority.

## Historical automated QA baseline

The pre-production browser audit previously covered **180 routes**, reported **0 browser console/page errors**, verified 10-question part assessments, the 20-question final, 79% fail / 80% pass behavior, 3 credentials per completed pathway, key mobile overflow checks, LinkedIn helpers, and the simulation workspace.

That historical browser sweep remains useful as a UI baseline, while the production additions above specifically address the Firebase/Worker/D1 integration and the learner-experience bugs discovered during live testing.

## Final status

**PRODUCTION LEARNER FLOW READY FOR CONTINUED LIVE SMOKE TESTING.**

The secure backend is now the source of truth for official results and credentials, and the frontend has explicit recovery behavior for stale/back-navigation states rather than relying only on the browser’s in-memory course state.
