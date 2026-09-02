# Capital Mastery Phase 2 — Final Production Evidence

- **Evidence date:** September 1, 2026
- **Canonical product:** `https://sribyju.github.io/CapitalMastery/`
- **Secondary mirror:** `https://capitalmastery.pages.dev/`
- **Production API:** `https://capital-mastery-api.avadhanula-shriyan.workers.dev`
- **Frontend runtime release:** `5cac6069c0841f7d63a330320cf4b537044e74b3`
- **Worker source release:** `0a0d9c9bfa07015f1dc346b53b723a81b967881c`
- **Worker deployment version:** `199ee0bd-7fc6-4dc7-a85e-75a324519666`
- **Firebase project:** `capital-mastery26`

## Release decision

Phase 2 is release-ready for an employer pilot and a serious firm demonstration. The reported course, assessment, simulation, progression, account isolation, employer workflow, access-control, visual contrast and deployment defects are closed in production. No known application-level P0 or P1 defect remains open.

“Firm-ready” here means that the product demonstrates professional workflow realism, deterministic navigation, server-enforced evidence, tenant-aware permissions, auditability, responsive behavior and hostile regression coverage. It is not a claim of bank endorsement, an external security certification, a formal WCAG conformance certification or proven global-bank traffic capacity.

## 1. Root causes and repairs

The failure pattern was architectural rather than a collection of unrelated buttons:

- Course progression was being inferred independently by lessons, quiz results, career pages, track decorators and secure assessment views. A canonical course-state, access and destination layer now owns those decisions.
- Local state, Firestore synchronization and D1 evidence could arrive in different orders. Official passes are now monotonic, server evidence wins for official results, malformed/stale state is normalized, and refresh/auth events cannot roll a pass backward.
- The original browser application kept a stale in-memory state closure while the account-isolation layer swapped user-scoped storage. Same-tab account changes now reload the correct UID-bound state before any render or save, preventing cross-account contamination.
- Review, Continue and Retake were conflated. They now have separate routes and behavior: passed attempts are permanent/read-only, failed attempts may be reviewed and retried explicitly, and Continue resolves the next stage for the selected program.
- QA helpers previously shared the learner state shape. QA is now an Admin-verified, separate namespace with no credential or official-progress side effects.
- Modern and legacy simulation paths coexisted. Official learner, Admin Preview and employer-assigned launches now converge on the professional workbench architecture; stale MCQ-style simulation payloads fail closed.
- Employer UI permissions did not consistently mirror server permissions. Visible actions, direct routes and Worker enforcement now share the least-privilege role model.
- Release proof previously stopped short of owner-controlled Firebase/Admin operations. Firebase rules, the live rules probe and the authenticated Admin synthetic lifecycle have now been executed and verified.
- The first Admin D1 integrity implementation enumerated Cloudflare's reserved `_cf_KV` table, which D1 exposes in schema metadata but does not authorize clients to query. The endpoint now uses read-only D1 batches, `PRAGMA table_list`, safe identifier validation and reserved-prefix filtering.
- The final six-width acceptance sweep found two hidden layout defects: min-content growth at 320px and full navigation overflow at 1024px. Responsive grid tracks now shrink safely and the header enters compact navigation before it can overflow.

## 2. Files changed

The authoritative, exhaustive file manifest is the Git comparison from the Phase 1 production close (`abd7cf1`) through the final Phase 2 frontend release (`5cac606`). It contains 269 relevant files across these groups:

- Runtime shell and course state: `app.js`, `course-state.js`, `course-continuity.js`, `course-release-fix.js`, `training-tracks.js`, `state-resilience.js`, `ux-stability.js`, `runtime-audit-fixes.js` and account/auth synchronization modules.
- Course and simulation content: `data.js`, `capital-mastery-live.js`, `capital-mastery-live-ui.js`, `capital-mastery-e2e.js`, `ib-analyst-toolkit.js`, learner guidance and professional visual modules.
- Employer product: `enterprise-v2.js`, `enterprise-v2.css`, Worker enterprise routes, report routes, public evidence and credential verification.
- Security/data: `v2/worker-v2-phase1-release.js`, `firestore.rules`, `firebase.json`, `wrangler.jsonc`, migrations 012–018 and D1 release tooling.
- Accessibility/responsive UI: `styles.css`, `accessibility-fixes.css`, `training-tracks.css`, learner/employer mobile styles and `index.html` cache generations.
- Release automation: 17 current GitHub workflows, audited Pages/Worker packaging, live read-only gates, Firebase rules release and D1 preflight tooling.
- Verification: 108 test files, including 85 dependency-free static audits and browser, live Firebase, live Firestore and authenticated Admin probes.
- Evidence and go-to-market: Phase 2 architecture/security/demo documents, production captures and the complete `ads/` campaign package.

Compare: `https://github.com/SriBYJU/CapitalMastery/compare/abd7cf1...5cac606`

## 3. Course architecture

The product now resolves each career through one track-aware course model:

1. Normalize local state and bind it to the active Firebase UID.
2. Reconcile Firestore continuity data without allowing older state to erase newer completion.
3. Hydrate D1-authoritative official attempts, simulations, program completion and credentials.
4. Resolve each stage as `locked`, `available`, `in_progress`, `failed`, `passed` or `review`.
5. Derive the exact next, review and failed-only retry destinations from the selected Career Skills or Professional Readiness sequence.
6. Render tiles and enforce routes from the same access result.

Locked stages remain available as clearly labeled read-only look-ahead. They expose no assessment controls and identify the missing prerequisite. The single Continue action resumes the exact next actionable stage. Passed work remains reviewable and cannot be accidentally repeated.

## 4. Simulation architecture

All 16 careers now use the secure workday/workbench path instead of the old browser-scored practical quiz:

- realistic role, manager/client and assignment brief;
- source packet or data-room material;
- calculation, research, workbook, memo or decision work appropriate to the role;
- material mid-assignment change;
- dependent revision and QA;
- evidence requirements and explicit acceptance criteria;
- professional manager/reviewer handoff; and
- Worker-side scoring with critical rubric floors.

Investment Banking is the flagship Project Northstar experience: Inbox, Data Room, Transaction Model, Trading Comps, Precedents, DCF, Management Update, Model QA, Client Takeaway and Associate Email. Every workbench step routes to the correct panel, explains its purpose, reports progress, exposes source files that open, preserves device drafts for seven days and automatically clears submitted drafts.

Admin Preview uses the same quality surface without mutating official progress. Employer assignments use the same engine with tenant and assignment context. Degraded legacy MCQ payloads are refused rather than silently presented as job simulations.

## 5. QA and account isolation

- QA progress is stored separately and requires a backend-verified Admin identity.
- Local QA score/progress helpers fail closed for ordinary learners even if a flag is forged.
- Admin simulation/credential previews cannot issue official credentials or mutate learner results.
- Same-tab A→B account changes synchronously swap the app's in-memory state before the next render or save.
- User A's saved snapshot remains unchanged when user B continues work in the same tab.
- Credential-name confirmation is merge-only and survives reload/fresh-device hydration.

## 6. Assessment review and final integrity

- No attempt means `Not attempted`; there is no inherited or synthetic 90% score.
- Passed assessments are permanently read-only.
- Review shows the original prompt, submitted answer, correctness, correct answer, rationale, score and date where available.
- Review creates no new attempt and cannot change credentials.
- Failed attempts preserve answer review and expose one explicit retry action.
- Only post-submission, owner-scoped Worker responses include answer/rationale data.
- The Professional Readiness Final uses one prerequisite resolver, one route owner and D1-authoritative attempt evidence.

## 7. Track routing

Career Skills and Professional Readiness are distinct programs with centrally defined sequences and credential semantics.

- Career Skills proceeds from Part 5 into the secure career capstone and portable Career Skills completion evidence.
- Professional Readiness proceeds into the deeper Role Lab/change-control/reviewer pathway and separate final gate.
- Review, Continue and Retake are never interchangeable.
- Repeated auth events, refresh, Back navigation and lesson review preserve a completed assessment and move forward correctly.
- Employer assignment status is scoped to the exact program and assignment; portable learner evidence cannot falsely satisfy firm-specific completion.

## 8. Test results

Final local release candidate results:

- **85 / 85 static audit files PASS**.
- **Pages production bundle PASS**: allowlisted frontend only, pre-router Admin guard, baseline security headers and no backend/test publication.
- **Failure-seeking browser torture PASS**.
- **Adversarial chaos browser PASS**: malformed deep links, delayed/out-of-order responses, rapid route and program switching, corrupted storage, forged QA flags, reload and render-loop settlement.
- **Visual contrast PASS**: 10 major routes at all six required responsive widths.
- **Course continuity PASS**: permanent pass, Back/refresh, cross-device hydration, no forced retake and exact resume.
- **Assessment state PASS**: saved pass/failure review, previous answers, failed-only retry and locked direct-route controls withheld.
- **Legacy simulation refusal PASS**.
- **Admin zero-exposure and simulation race PASS**.
- **Program completion verification PASS**.
- **Employer invitation lifecycle, public walkthrough and role matrix PASS**.
- **IB workbench navigation/guidance PASS**.
- **Learner guide mobile PASS**.
- **State resilience and same-tab account switch PASS**.

## 9. All-career result

The browser sweep passed **16 careers × both programs × six release widths**:

Investment Banking, Private Equity, Venture Capital, Equity Research, Asset Management, Hedge Funds, Sales & Trading, Quantitative Finance, Private Credit, Corporate Banking, Corporate Development, FP&A, Treasury, Wealth Management, Risk Management and Real Estate Finance.

The content audits additionally require each career to have differentiated source material, professional work products, a role-specific changing-information event and a manager handoff. The 15 non-IB careers cannot fall back to IB-flavored generic tasks.

## 10. Responsive, mobile and accessibility result

The permanent browser matrix now covers the exact requested widths:

- 320 × 568
- 375 × 812
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1440 × 900/1000

The sweep checks global overflow, course program controls, career pages, learner guide panels, employer public surfaces and high-mutation routes. Workbook-like surfaces retain their structure inside controlled horizontal scrolling regions. Keyboard-native program controls, focusable forms, labels, status semantics, reduced motion and text contrast are regression-gated. This is an implementation-backed accessibility posture, not a third-party WCAG certification claim.

## 11. Employer, Firm Layer and RBAC result

- Owner, Admin, Content Admin, Manager, Reviewer and Viewer behaviors are server-enforced and reflected by the UI.
- Direct-route privilege escalation and cross-tenant identifiers fail closed.
- Manager review can inspect appropriate learner evidence, request revision and record final status.
- Readiness reports answer what the learner did, what evidence exists, where revision occurred, the current level and remaining development needs.
- Employer invitations bind the exact email and use a guided learner sign-in/acceptance flow.
- Standard curriculum remains portable and separate from tenant-scoped Firm Layer content.
- Firm Layer supports active, hidden, archived, restored and version-history behavior; ordinary UI does not center irreversible deletion.
- CSV exports neutralize spreadsheet formula injection.
- Notifications cover assignment, review, revision, completion and credential actions without relying on a hidden course-only screen.
- The Admin synthetic lifecycle created a three-learner revision cohort, changed one learner to Ready/Complete, verified the report and permission matrix, and removed every synthetic workspace afterward.

## 12. Production result

- GitHub Pages is the canonical primary and deploys automatically from `main`.
- Frontend release `5cac6069c0841f7d63a330320cf4b537044e74b3` contains the final six-width fixes and cache generation `20260902-mobile3201`.
- Worker source `0a0d9c9bfa07015f1dc346b53b723a81b967881c` is deployed as version `199ee0bd-7fc6-4dc7-a85e-75a324519666`.
- Live Admin identity was verified against the configured opaque `ADMIN_UID`.
- The authenticated Admin integrity panel reports `D1 integrity verified`, `quick_check` passing, zero foreign-key violations and 37 inspected production tables.
- Independent direct D1 execution returned `quick_check = ok`, an empty foreign-key violation result, `rows_written = 0` and `changed_db = false`.
- Production reports zero remaining synthetic demo workspaces.
- Firestore rules were deployed to `capital-mastery26`; the live probe passed owner writes, cross-account denial, anonymous denial, schema enforcement and cleanup.
- A disposable Firebase signup/name/reload/fresh-device/delete lifecycle passed and removed its test identity/data.
- Both `sribyju.github.io` and `capitalmastery.pages.dev` are authorized Firebase domains; GitHub Pages remains canonical.

Exact-release GitHub workflows for `5cac606`:

- Pages build and deployment: `33579920405`
- Package audited Pages release: `33579921609`
- Failure-seeking audit round 2: `33579921598`
- Live production read-only audit: `33579921614`
- GitHub Pages live read-only audit: `33579921517`
- Deployable encoding audit: `33579921547`

All six workflows completed successfully. Live production run `33579921614` passed on attempt 2: attempt 1 started while one GitHub Pages edge still served the older stylesheet and reported the now-fixed 320px overflow, while the later tests in that same run already saw the new asset. The exact live stylesheet generation was then verified directly, the production torture audit passed, and the complete workflow rerun passed after propagation.

Worker package and runtime release workflows for `0a0d9c9` completed successfully, including audited Worker packaging, failure-seeking round 2 and both live read-only audits.

## 13. External blockers and honest boundaries

There are **no remaining owner-controlled deployment blockers** for this release. Firebase CLI authorization, live Firestore rules, both Firebase authorized domains, the verified production Admin identity, Worker deployment and D1 integrity have all been closed.

Remaining work is operational rather than a hidden release defect:

- Formal penetration testing, accessibility certification and large-cohort load testing require independent programs if the company chooses to claim them.
- Firm names appear only as source-linked public benchmarks with an explicit no-affiliation/no-endorsement disclosure. Third-party logos were not added; that avoids implying a relationship and avoids unnecessary trademark risk without written brand permission.
- Real customer adoption, time-to-productivity impact and hiring outcomes must not be claimed until measured.

## Campaign and final polish

The repository contains a complete production-based campaign kit:

- `capital-mastery-15s.mp4`
- `capital-mastery-learner-work-19s.mp4`
- `capital-mastery-employer-readiness-19s.mp4`
- three static ad formats;
- editable 1080 × 1920 campaign frames;
- production source captures, storyboard and deterministic render scripts.

All videos are H.264 vertical masters built from real product UI. Campaign copy is limited to implemented product claims and avoids adoption, endorsement, accreditation, regulatory approval or guaranteed-outcome language.

## Final status

The original P0 course defects, P1 architecture defects, course/simulation realism requirements, learner/employer guidance, RBAC/security gates, all-career/browser/mobile coverage and owner-controlled production closure steps are complete. The canonical product is ready to publish and demonstrate with the evidence and claim boundaries above.
