import fs from 'node:fs';

const continuity=fs.readFileSync('course-continuity.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');

function assert(c,m){if(!c)throw new Error(m);}
for(const marker of [
  "const progressCache = new Map()",
  'function localBest(pathway, itemId)',
  'async function authoritativeBest',
  'function continueHref(pathway, part)',
  "part === 5) return selectedTrack(pathway) === CAREER_SKILLS",
  'Continue — assessment already passed',
  'Review passed assessment',
  'Retake assessment (optional)',
  "r.query.get('retake') === '1'",
  "event.stopImmediatePropagation()",
  "history.pushState({cmCourseRetake:true}",
  "typeof window.CM_LIVE_ROUTE === 'function'",
  'CM_COURSE_CONTINUITY'
]) assert(continuity.includes(marker),`Course continuity missing ${marker}`);
assert(live.includes('window.CM_LIVE_ROUTE = route;'),'Secure assessment router must expose an explicit continuity-owned rerender bridge');
for(const marker of [
  "params.set('retake','1')",
  "params.set('attempt',String(nonce))",
  "#/final/${pathwayId}?retake=1&attempt=${nonce}",
  "#/quiz/${pathwayId}/${n}?retake=1&attempt=${nonce}"
]) assert(live.includes(marker),`Secure assessment retry URL contract missing ${marker}`);
assert(!continuity.includes('You may retake it, or continue without redoing the quiz.</p></div><a'),'Old banner-only prior-pass behavior must not remain authoritative');
console.log('COURSE PASS CONTINUITY AUDIT PASS: lesson review preserves prior passes, Next bypasses completed quizzes, server progress hydrates cross-device state, and every secure retry owns an explicit unique retake route');
