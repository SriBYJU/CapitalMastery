# Capital Mastery Ad Kit

This folder contains ad-ready creative built from **real production UI screenshots**, not fabricated dashboard mockups.

## Image ads

- `image/employer-free-1200x628.png` — employer / LinkedIn / landscape creative. Core message: professional finance readiness, free for employers, no seat fee.
- `image/prove-the-work-1080x1350.png` — portrait social creative. Core message: prove work capability, not only course completion.
- `image/learn-practice-prove-1080x1080.png` — square social creative. Core message: workpapers, revisions and evidence; free for both audiences.

## Video ads

- `video/capital-mastery-15s.mp4` — ~17-second silent vertical master assembled from production screenshots.
- `video/capital-mastery-learner-work-19s.mp4` — 18.6-second vertical learner cut: realistic work, source data, live updates, feedback and competency evidence.
- `video/capital-mastery-employer-readiness-19s.mp4` — 18.6-second vertical employer cut: assignments, manager review, revision behavior, readiness reporting and audit history.
- `video/capital-mastery-dynamic-learner-15s.mp4` — true-motion learner master with drawn UI animation and no screenshot scene plates.
- `video/capital-mastery-dynamic-employer-15s.mp4` — true-motion employer master with animated assignment, review, readiness and audit flows.
- `video/capital-mastery-dynamic-learner-15s-vo.mp4` — dynamic learner cut with a mastered, soothing female voiceover.
- `video/capital-mastery-dynamic-employer-15s-vo.mp4` — dynamic employer cut with a mastered, soothing female voiceover.
- `video/dynamic-ad-contact-sheet.png` — scene overview for both dynamic campaigns.
- `video/build_dynamic_ads.py` — deterministic 30 fps motion-graphics renderer; requires only free local Pillow and FFmpeg tooling.
- `video/build_neural_voiceovers.py` — local Kokoro neural speech renderer using the high-quality `af_bella` female voice.
- `video/build_dynamic_voiceovers.ps1` — voice mastering and video-mux pipeline; no paid voice service or account is required.
- `video/frames/01.png` through `08.png` — full-resolution 1080×1920 edit frames for Reels/Shorts/TikTok/vertical placements.
- `video/campaign-frames/` — editable 1080×1920 frames for the learner and employer cuts.
- `video/build_campaign_frames.py` — deterministic Pillow frame compositor using real product captures.
- `video/render_campaigns.ps1` — FFmpeg 5+ renderer with subtle motion, crossfades, H.264/yuv420p output and fast-start metadata.
- `video/storyboard.md` — 15-second and 30-second copy/shot guidance.

The three original MP4s remain silent masters. The dynamic campaign includes both silent and voiced versions. All delivery videos are 1080×1920, 30 fps, H.264 High Profile and broadly compatible with vertical social placements.

## Source screenshots

`source/` contains selected production captures used to make the ad creative. The complete interaction library is in `../screenshots/interactive/`.

## Claims discipline

Approved themes: free for learners, free for employers, 16 finance careers, role-specific work, secure/server-graded assessments, Role Labs, competency/readiness evidence, employer Firm Layer, manager review and audit history. Do not imply employer adoption, sponsorship, accreditation, regulatory approval, guaranteed hiring, or guaranteed productivity outcomes unless separately documented.
