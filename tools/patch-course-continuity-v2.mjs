import fs from 'node:fs';

const SOURCE='tools/course-continuity-v2.source.js';
const CONTINUITY='course-continuity.js';
const LIVE='capital-mastery-live.js';

function must(c,m){if(!c)throw new Error(m);}
function replaceOnce(text,before,after,label){must(text.includes(before),`Missing anchor: ${label}`);const next=text.replace(before,after);must(next!==text,`No change: ${label}`);return next;}

const source=fs.readFileSync(SOURCE,'utf8');
must(source.includes('CM_COURSE_CONTINUITY'),'candidate continuity source missing public continuity bridge');
must(source.includes('assessment already passed'),'candidate continuity source missing saved-pass semantics');
fs.writeFileSync(CONTINUITY,source);

let live=fs.readFileSync(LIVE,'utf8');
if(!live.includes('window.CM_LIVE_ROUTE = route;')){
  live=replaceOnce(live,
    "  window.addEventListener('hashchange', () => setTimeout(route, 0));",
    "  window.CM_LIVE_ROUTE = route;\n  window.addEventListener('hashchange', () => setTimeout(route, 0));",
    'secure router bridge');
}
fs.writeFileSync(LIVE,live);
console.log('COURSE CONTINUITY V2 PATCH APPLIED: passed assessments persist through lesson review, server progress hydrates cross-device state, and retry navigation is owned by the secure router');
