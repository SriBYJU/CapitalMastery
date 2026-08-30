import fs from 'node:fs';

const load=p=>fs.readFileSync(p,'utf8');
const save=(p,s)=>fs.writeFileSync(p,s);
function once(text,from,to,label){
  const i=text.indexOf(from);
  if(i<0) throw new Error(`Missing patch target: ${label}`);
  if(text.indexOf(from,i+from.length)>=0) throw new Error(`Ambiguous patch target: ${label}`);
  return text.slice(0,i)+to+text.slice(i+from.length);
}

// 1) Admin QA controls: do not let non-admin callers activate or mutate QA preview state.
const adminPath='admin-qa-simulation-fix.js';
let admin=load(adminPath);
admin=once(admin,
`    for (const name of ['qaProgress', 'qaScores']) {
      const original = window.CM[name];
      if (typeof original !== 'function') continue;
      window.CM[name] = function(...args) {
        if (isAdmin()) enableQa();
        return original.apply(this, args);
      };
    }`,
`    for (const name of ['qaProgress', 'qaScores']) {
      const original = window.CM[name];
      if (typeof original !== 'function') continue;
      window.CM[name] = function(...args) {
        if (!isAdmin()) {
          console.warn('Capital Mastery QA control blocked: administrator verification required.');
          return false;
        }
        enableQa();
        return original.apply(this, args);
      };
    }

    const originalToggle = window.CM.toggleQa;
    if (typeof originalToggle === 'function') {
      window.CM.toggleQa = function(...args) {
        if (!isAdmin()) {
          console.warn('Capital Mastery QA mode blocked: administrator verification required.');
          return false;
        }
        return originalToggle.apply(this, args);
      };
    }`,
'admin QA console guard');
save(adminPath,admin);

// 2) Admin Credential Lab: authoritative live renderer must yield to isolated local QA previews.
const liveUiPath='capital-mastery-live-ui.js';
let live=load(liveUiPath);
live=once(live,
`  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const PASS = 80;`,
`  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const PASS = 80;`,
'live UI QA key');
live=once(live,
`  function main() {
    return document.querySelector('#app main#main');
  }`,
`  function main() {
    return document.querySelector('#app main#main');
  }

  function adminQaPreviewActive() {
    return window.CM_AUTH?.ready === true &&
      window.CM_AUTH?.isAdmin === true &&
      localStorage.getItem(QA_KEY) === 'true';
  }`,
'live UI admin QA helper');
live=once(live,
`    if (root === 'credentials') return renderCredentials();
    if (root === 'credential' && a && b) return renderCredentialDetail(a, b);`,
`    // Admin QA certificate/credential previews are intentionally local and must
    // not be replaced by the authoritative renderer. Normal learner routes stay
    // authoritative. This only applies to a backend-verified admin with QA mode on.
    if (adminQaPreviewActive() && ['credential','certificate','achievement'].includes(root)) return;

    if (root === 'credentials') return renderCredentials();
    if (root === 'credential' && a && b) return renderCredentialDetail(a, b);`,
'live UI yield to admin QA preview');
save(liveUiPath,live);

// 3) Two-track routing: Career Skills goes directly to the authoritative compact
// simulation; Professional Readiness cannot deep-link that Career Skills gate.
const tracksPath='training-tracks.js';
let tracks=load(tracksPath);
tracks=once(tracks,
`    const pathwayRoutes = new Set(['career','learn','quiz','simulation','final','role-lab']);`,
`    const pathwayRoutes = new Set(['career','learn','quiz','simulation','official-simulation','final','role-lab']);`,
'track route context official simulation');
tracks=once(tracks,
`      ['04','Career Skills Capstone','Complete the realistic job simulation and earn Career Skills',\`#/simulation/\${id}\`]`,
`      ['04','Career Skills Capstone','Complete the realistic server-graded job simulation and earn Career Skills',\`#/official-simulation/\${id}\`]`,
'Career Skills authoritative capstone link');
tracks=once(tracks,
`    if(route==='simulation'&&pathwayId&&getTrack(pathwayId)===PROFESSIONAL&&!adminQaPreviewActive()){`,
`    if((route==='simulation'||route==='official-simulation')&&pathwayId&&getTrack(pathwayId)===PROFESSIONAL&&!adminQaPreviewActive()){`,
'Professional deep-link Career Skills capstone guard');
save(tracksPath,tracks);

// 4) Madeline must send Career Skills learners directly to the authoritative
// simulation instead of creating a visible legacy redirect hop.
const madelinePath='madeline.js';
let madeline=load(madelinePath);
madeline=once(madeline,
`action('Open Career Skills capstone',\`#/simulation/\${c.id}\`)`,
`action('Open Career Skills capstone',\`#/official-simulation/\${c.id}\`)`,
'Madeline authoritative Career Skills capstone');
save(madelinePath,madeline);

// 5) Cache-bust every JS asset changed by the stability/audit rounds so clients
// cannot run a mixed old/new script generation after deployment.
const indexPath='index.html';
let index=load(indexPath);
const replacements=[
  ['app.js?v=20260830-guided2','app.js?v=20260830-stability3'],
  ['training-tracks.js?v=20260830-tracks2','training-tracks.js?v=20260830-stability3'],
  ['capital-mastery-live-ui.js?v=20260830-guided2','capital-mastery-live-ui.js?v=20260830-stability3'],
  ['madeline.js?v=20260830-guided2','madeline.js?v=20260830-stability3'],
  ['admin-qa-simulation-fix.js?v=20260828-adminsim2','admin-qa-simulation-fix.js?v=20260830-stability3']
];
for(const [from,to] of replacements) index=once(index,from,to,`cache bust ${from}`);
save(indexPath,index);

console.log('Failure-seeking hardening round 2 applied.');
