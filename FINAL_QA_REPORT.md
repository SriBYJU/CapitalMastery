# Capital Mastery — Production End-to-End QA Report

**Audit date:** August 27–28, 2026  
**Release scope:** Production learner experience with Firebase Authentication, Firestore progress sync, Cloudflare Worker grading, D1 credentials, mobile UX, account onboarding, credential sharing, and in-product learner support.  
**Current release gate:** **PASS WITH PRODUCTION SAFEGUARDS ACTIVE**

## Production stack now connected

- Firebase Email/Password Authentication
- Google sign-in
- Required one-time post-sign-up credential-name setup
- Firestore cross-device learner progress sync
- Cloudflare Worker Firebase ID-token verification
- D1 authoritative assessment progress
- D1 authoritative credential records
- Automatic Foundations / Applied Skills / Career credential issuance
- Public credential verification
- Credential certificate, LinkedIn helper, and sharing UI
- Server-verified administrator access
- Mobile Profile / Account access
- Madeline in-product learner guide

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
A dedicated Profile button is now available in the mobile header. The hamburger menu also includes exactly one **Profile & Account** entry for signed-in learners or **Sign in / Create Account** for signed-out visitors. Duplicate compatibility-era account buttons are suppressed.

### 10. Applied-work saving gave no visible feedback — FIXED
Applied-work textareas now display save feedback while the existing Firestore/local progress save continues underneath.

### 11. Duplicate technical concept rendering — FIXED
Repeated concept cards are de-duplicated in the rendered lesson so learners do not encounter the same technical unit twice because of duplicate source-data references.

### 12. Founder contact information was missing from About — FIXED
The About page now includes direct email contact and the requested LinkedIn profile link.

### 13. Stale pre-production copy — FIXED
Production-facing text that still referred to Firebase as “pending” or implied the admin/backend was not connected is overridden with the current production architecture where applicable.

### 14. Credential-name prompt repeated on a new device — FIXED
Credential-name confirmation is now stored inside the learner’s Firestore progress profile rather than relying only on a browser-local flag. A learner who already completed the required name step can sign in on another device without being asked again. Existing established accounts with a valid full Firebase display name are migrated so they do not get trapped in a repeat-onboarding loop.

### 15. Brand-new account could reach name setup before local learner state existed — FIXED
The name-onboarding flow now creates a valid initial learner-state object when necessary before saving the credential name. The name is then flushed to Firestore and the page is cleanly refreshed so the older in-memory app state cannot keep a placeholder name.

### 16. Gated course route could be lost during sign-in — FIXED
If a signed-out learner clicks a course or learning CTA, Capital Mastery remembers that intended destination. After successful sign-in and any required one-time name setup, the learner returns to the original learning route. Canceling the gate clears the pending route so an old destination cannot unexpectedly reappear later.

### 17. Verified credential page could occasionally render the older basic credential view — FIXED
The production credential UI has a bounded recovery check for the legacy/enhanced renderer race. If the basic view wins the initial render, the enhanced D1 credential view is re-requested so **View Certificate, Credential Details, Add to LinkedIn, and Public Verification** remain available.

### 18. Previously passed assessment could appear to require another attempt — FIXED
When an official D1 progress record already shows a passing score, the assessment route displays an **Already passed** message with the learner’s best score and a Continue option. The learner can still retake voluntarily.

## Sign-up / identity UX

The signed-out learning flow now follows:

**Learning CTA → account explanation → Google or Email sign-in/sign-up → required full first + last name once → learning**

The account gate explains that sign-in is needed to save progress, connect official assessment results to the learner, and issue verified credentials. The full-name step is required for a newly created account before the learner continues into gated coursework. Its confirmation is saved to Firestore, so it is designed to be a one-time setup across devices rather than a prompt on every login.

The Profile / Account page also keeps an **Edit credential name** option for future changes.

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

## Madeline learner guide

Madeline is a built-in Capital Mastery support guide available from a floating help control on desktop and mobile. It is designed for product/navigation support rather than investment advice.

Madeline can answer a broad set of common learner questions, including:

- What should I do next?
- Where is my certificate?
- What is my Credential ID?
- Why do I need Mark Learning Complete?
- Why does my progress look wrong?
- Can I retake a quiz?
- What score do I need to pass?
- How do Foundations / Applied Skills / Career certificates work?
- How do I add a credential to LinkedIn?
- How do I verify or download a certificate?
- How do I edit my credential name?
- Where is my Profile / Account page?
- How do I reset my password?
- How do simulations and the final exam work?
- What finance pathways are available?
- How do I contact the founder?

Where appropriate, Madeline uses the current route and learner progress to give contextual next-step guidance. When a signed-in learner asks for a certificate or Credential ID, it can query the real `/credentials/me` endpoint rather than inventing credential information.

## Security notes

- Browser/localStorage scores are not authoritative for production credentials.
- Firebase ID tokens are verified by the Worker before protected API access.
- Admin authorization is determined server-side.
- Public verification does not expose the learner UID or email.
- Firestore convenience progress is separate from D1 official grading/credential authority.
- QA preview mode remains clearly separate from production credential authority.
- Madeline does not replace authoritative grading or credential issuance.

## Historical automated QA baseline

The pre-production browser audit previously covered **180 routes**, reported **0 browser console/page errors**, verified 10-question part assessments, the 20-question final, 79% fail / 80% pass behavior, 3 credentials per completed pathway, key mobile overflow checks, LinkedIn helpers, and the simulation workspace.

That historical browser sweep remains useful as a UI baseline. The production fixes above additionally address Firebase/Worker/D1 integration and the learner-experience issues discovered during live testing.

## Final status

**PRODUCTION LEARNER FLOW READY FOR FINAL LIVE SMOKE TESTING.**

The secure backend remains the source of truth for official results and credentials. The frontend now includes explicit recovery behavior for stale/back-navigation states, one-time cross-device onboarding, mobile profile access, credential-render recovery, and an in-product support guide rather than relying only on the browser’s in-memory course state.