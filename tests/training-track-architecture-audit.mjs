import fs from 'node:fs';

const index = fs.readFileSync('index.html','utf8');
const js = fs.readFileSync('training-tracks.js','utf8');
const css = fs.readFileSync('training-tracks.css','utf8');

const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

must(index.includes('training-tracks.css'), 'index.html must load training-tracks.css');
must(index.includes('training-tracks.js'), 'index.html must load training-tracks.js');
must(js.includes("const CAREER_SKILLS = 'career-skills'"), 'Career Skills track missing');
must(js.includes("const PROFESSIONAL = 'professional-readiness'"), 'Professional Readiness track missing');
must(js.includes('awardCount: 4'), 'Career Skills must present four learner-facing awards');
must(js.includes('verifiedCredentialCount: 3'), 'Career Skills must distinguish three Standard credentials from its completion certificate');
must(js.includes('awardCount: 5'), 'Professional Readiness must present five career credentials');
must(js.includes('verifiedCredentialCount: 5'), 'Professional Readiness must preserve five verified career credentials');
must(js.includes('3 Standard 2.0 credentials + 1 evidence-backed program completion certificate'), 'Career Skills roll-up semantics missing');
must(js.includes('5 Standard 2.0 career credentials'), 'Professional Readiness Standard 2.0 semantics missing');
must(js.includes('upgrading never means repeating earned stages'), 'Track stacking/no-repeat rule missing');
must(js.includes('Career Skills: 4 awards · Professional Readiness: 5 credentials'), 'Career directory count correction missing');
must(js.includes('Professional Readiness only'), 'Advanced final gate must be visibly scoped');
must(js.includes('Career Skills capstone'), 'Career Skills simulation capstone label missing');
must(js.includes('Role Lab credential'), 'Professional Readiness Role Lab credential missing');
must(js.includes("return storedTrack(careerId) || PROFESSIONAL"), 'Existing full-path learners must retain Professional Readiness behavior until they choose Career Skills');
must(js.includes("route !== 'final'"), 'Career Skills deep-link guard for Professional Readiness Final missing');
must(js.includes("setAttribute('aria-disabled','true')"), 'Locked advanced final must be keyboard/accessibility safe');
must(js.includes("removeAttribute('href')"), 'Locked advanced final must not remain an actionable anchor');
must(js.includes('data-cm-track-learning-status'), 'Learning surfaces must show current program level');
must(js.includes('data-cm-track-credential-model'), 'Credentials page must explain the two-track award model');
must(css.includes('@media(max-width:820px)'), 'Responsive two-track layout missing');
must(css.includes('@media(max-width:480px)'), 'Small-mobile two-track layout missing');
must(css.includes('.cm-track-notice'), 'Program-level route guard status styling missing');
must(css.includes('.cm-track-learning-status'), 'Learning-route track status styling missing');
must(!js.includes('Career Skills is easier'), 'Do not position the shorter program as low quality');

console.log('training-track-architecture-audit: PASS');
