# Archived — Phase 1 Feature Checklist

> **Historical snapshot only.** This checklist predates Capital Mastery Standard 2.0, the two-program Career Skills / Professional Readiness architecture, the 80 verified career credential definitions, the current enterprise layer, and the completed Firebase/Worker/D1 integration. It is preserved for development history and must not be treated as the current release checklist.
>
> Current release status: see `docs/phase2-release-audit.md`.
> Current training/credential contract: see `docs/training-track-standard.md` and `docs/credential-system.md`.

---

# Capital Mastery — Feature Checklist

## Brand & marketing
- [x] Capital Mastery navy/gold identity
- [x] CM logo mark, horizontal wordmark and credential seal
- [x] Founder photo integrated
- [x] Founder signature integrated into all certificate levels
- [x] Google/browser title includes **45+ Free Finance Credentials** and **Made by Shriyan Avadhanula**
- [x] Homepage prominently states free credentials
- [x] Homepage public-data cards
- [x] Big-name public-source credibility section with independence disclosure
- [x] Founder preview on homepage
- [x] Full About the Founder page
- [x] Research methodology page

## Career system
- [x] 16 launch career pathways
- [x] Exact target job listed under each career field
- [x] Investment Banking positioned as a field with M&A Advisory flagship track
- [x] Career directory
- [x] Career map
- [x] Career compare
- [x] Career ladder
- [x] Day-in-the-life explanation
- [x] Real deliverables and tools
- [x] 5 mandatory sequential parts per career
- [x] Percentage progress tracking
- [x] 3 certificates per career (48 total)

## Learning
- [x] Part 1 — Career Foundations
- [x] Part 2 — Technical Academy
- [x] Part 3 — Professional Toolkit
- [x] Part 4 — Applied Work
- [x] Part 5 — Job Simulation
- [x] 58-term global vocabulary library
- [x] 48 technical concept modules
- [x] At least 10 role-specific vocabulary terms per career
- [x] At least 5 technical concepts per career
- [x] At least 6 toolkit labs per career
- [x] At least 5 applied assignments per career
- [x] Source Drawer / professional relevance
- [x] REAL DATA vs SIMULATED CASE labeling architecture
- [x] Desk Standard: Know / Calculate / Build / Research / Judge / Communicate / Deliver
- [x] Applied-work draft persistence (local QA; Firestore later)

## Assessments
- [x] 10-question Part 1 assessment
- [x] 10-question Part 2 assessment
- [x] 10-question Part 3 assessment
- [x] 10-question Part 4 assessment
- [x] 10-question simulation knowledge check
- [x] 20-question final examination
- [x] 80% passing requirement
- [x] 79% fails / 80% passes boundary tested
- [x] Randomized answer ordering
- [x] Question variants generated from role content
- [x] Plausible distractor strategy
- [x] Explanations after submission
- [x] No averaging around a failed requirement

## Job simulations
- [x] Exact role / team / assignment shown
- [x] Inbox
- [x] Assignment brief
- [x] Case data
- [x] Workspace
- [x] Manager review
- [x] Results / scorecard
- [x] Role-specific numerical/technical questions
- [x] Role-specific written recommendation
- [x] 100-point practical score
- [x] 80/100 passing requirement
- [x] All 16 careers have a simulation scenario

## Credentials
- [x] Foundations Certificate
- [x] Applied Skills Certificate
- [x] Grand Career Certificate
- [x] Founder signature
- [x] Issue date
- [x] Credential ID
- [x] Verification mark/QR preview
- [x] Credential criteria/version fields in architecture
- [x] Completion/achievement celebration screen
- [x] My Credentials dashboard
- [x] Credential detail page
- [x] Public verification page architecture
- [x] Download/Print PDF workflow
- [x] PNG certificate export workflow
- [x] Social achievement image export
- [x] Add-to-LinkedIn field helper
- [x] LinkedIn post generator: Professional / Detailed / Short
- [x] Copy credential URL/ID
- [x] Skills shown on credential detail
- [x] QA previews explicitly not represented as live verified credentials

## Learner profile
- [x] My Learning / Career Passport
- [x] Completion percentage
- [x] Separate Career Readiness score
- [x] Career-by-career progress
- [x] Credential dashboard
- [x] Local QA state persistence

## Admin / QA
- [x] Admin / QA dashboard UI
- [x] Enable/disable QA mode
- [x] Jump to certificate previews
- [x] Set progress to 0/20/40/60/80/100
- [x] 79/80/100 boundary score presets
- [x] Simulation lab shortcut
- [x] Local QA reset
- [x] Current-state debug snapshot
- [x] No admin password hard-coded in repository
- [ ] Firebase server-verified admin custom claim — **requires Firebase project**

## Account/backend
- [x] Complete account/login UI placeholder
- [x] Firebase architecture/documentation
- [x] Firestore rules template
- [x] Secure credential issuance design
- [ ] Google sign-in — **requires Firebase project**
- [ ] Email/password sign-in — **requires Firebase project**
- [ ] Firestore cloud progress sync — **requires Firebase project**
- [ ] Server-side live credential issuance — **requires Firebase project / Cloud Functions**
- [ ] Live cross-device public credential verification — **requires Firebase backend**

## Technical / quality
- [x] Responsive desktop/mobile layout
- [x] Semantic labels for quizzes and applied assignments
- [x] Skip-to-content link
- [x] Mobile menu
- [x] Privacy / Terms / Educational Disclaimer / Credential Policy pages
- [x] `.nojekyll`
- [x] Sitemap
- [x] robots.txt
- [x] PWA manifest
- [x] 192/512 app icons
- [x] Open Graph image
- [x] GitHub Pages deployment workflow
- [x] Automated route sweep
- [x] Automated content-depth audit
- [x] Automated assessment boundary audit
- [x] Automated credential audit
- [x] Automated mobile overflow audit
- [x] 30 organized product-preview screenshots
