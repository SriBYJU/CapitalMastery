import fs from 'node:fs';

const js=fs.readFileSync('training-tracks.js','utf8');
const css=fs.readFileSync('training-tracks.css','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(js.includes('TWO PROGRAM LEVELS · EVERY CAREER'), 'Homepage/employer public track overview missing');
must(js.includes('CAREER SKILLS'), 'Career Skills public positioning missing');
must(js.includes('4 verified credentials'), 'Career Skills public credential count missing');
must(js.includes('PROFESSIONAL READINESS'), 'Professional Readiness public positioning missing');
must(js.includes('5 verified credentials'), 'Professional Readiness public credential count missing');
must(js.includes('Upgrade later without repeating earned stages'), 'No-repeat upgrade promise missing from public comparison');
must(js.includes('shorter credential never substitutes for the advanced Role Lab'), 'Public comparison must preserve advanced credential boundary');
must(js.includes("route!==''"), 'Homepage track overview route guard missing');
must(js.includes("route!=='employers'"), 'Employer public track overview route guard missing');
must(js.includes('assign Career Skills for shorter practical preparation or Professional Readiness'), 'Employer assignment use-case explanation missing');
must(css.includes('.cm-track-public-grid'), 'Public two-track comparison styling missing');
must(css.includes('@media(max-width:760px)'), 'Public two-track mobile layout missing');

console.log('public-two-track-positioning-audit: PASS');
