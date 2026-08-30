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
must(js.includes('credentialCount: 4'), 'Career Skills must present four credential milestones');
must(js.includes('credentialCount: 5'), 'Professional Readiness must present five credential milestones');
must(js.includes('upgrading never means repeating earned stages'), 'Track stacking/no-repeat rule missing');
must(js.includes('Career Skills: 4 credentials · Professional Readiness: 5'), 'Career directory count correction missing');
must(js.includes('Professional Readiness only'), 'Advanced final gate must be visibly scoped');
must(js.includes('Career Skills capstone'), 'Career Skills simulation capstone label missing');
must(js.includes('Role Lab'), 'Professional Readiness Role Lab requirement missing');
must(css.includes('@media(max-width:820px)'), 'Responsive two-track layout missing');
must(css.includes('@media(max-width:480px)'), 'Small-mobile two-track layout missing');
must(!js.includes('Career Skills is easier'), 'Do not position the shorter program as low quality');

console.log('training-track-architecture-audit: PASS');
