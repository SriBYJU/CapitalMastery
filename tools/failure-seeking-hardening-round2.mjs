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
`    for (const name of ['qaProgress', 'qaScores', 'resetState']) {
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

// 2) QA mode itself is an admin-only state. A localStorage flag by itself must
// never disable prerequisite guards, authoritative progress reconciliation, or
// legacy-to-official route normalization for a normal learner.
const qaFunction=`  function qaMode() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.isAdmin === true &&\n      localStorage.getItem(QA_KEY) === 'true';\n  }`;

const appPath='app.js';
let app=load(appPath);
app=once(app,
`  function qaMode(){ return localStorage.getItem(QA_KEY) === 'true'; }`,
`  function qaMode(){ return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true'; }`,
'core app admin-only QA mode');

// The legacy IB route normally hands off to the authoritative server-graded
// workbench. A verified Admin QA preview is the one intentional exception: it
// must stay on the local synthetic Project Northstar surface so Admin Demo Lab
// testing cannot create or depend on D1 progress.
app=once(app,
`  function simulationPage(c){\n    if(c.id==='investment-banking'){ location.hash=\`#/official-simulation/\${c.id}\`; return; }`,
`  function simulationPage(c){\n    if(c.id==='investment-banking' && !qaMode()){ location.hash=\`#/official-simulation/\${c.id}\`; return; }`,
'IB Admin QA simulation handoff exception');
save(appPath,app);

const e2ePath='capital-mastery-e2e.js';
let e2e=load(e2ePath);
e2e=once(e2e,
`  function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';\n  }`,
qaFunction,
'E2E admin-only QA mode');
save(e2ePath,e2e);

const uxPath='ux-stability.js';
let ux=load(uxPath);
ux=once(ux,
`  function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';\n  }`,
qaFunction,
'UX admin-only QA mode');
save(uxPath,ux);

const continuityPath='course-continuity.js';
let continuity=load(continuityPath);
continuity=once(continuity,
`  function qaMode() {\n    return localStorage.getItem(QA_KEY) === 'true';\n  }`,
qaFunction,
'course continuity admin-only QA mode');
save(continuityPath,continuity);

const runtimePath='runtime-audit-fixes.js';
let runtime=load(runtimePath);
runtime=once(runtime,
`  function qaMode() { return localStorage.getItem(QA_KEY) === 'true'; }`,
`  function qaMode() { return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true'; }`,
'runtime reconciliation admin-only QA mode');
save(runtimePath,runtime);

// 3) Admin Credential Lab: authoritative live renderer must yield to isolated local QA previews.
const liveUiPath='capital-mastery-live-ui.js';
let live=load(liveUiPath);
live=once(live,
`  const STATE_KEY = 'capitalMasteryLocalStateV1';\n  const PASS = 80;`,
`  const STATE_KEY = 'capitalMasteryLocalStateV1';\n  const QA_KEY = 'capitalMasteryQaPreviewV1';\n  const PASS = 80;`,
'live UI QA key');
live=once(live,
`  function main() {\n    return document.querySelector('#app main#main');\n  }`,
`  function main() {\n    return document.querySelector('#app main#main');\n  }\n\n  function adminQaPreviewActive() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.isAdmin === true &&\n      localStorage.getItem(QA_KEY) === 'true';\n  }`,
'live UI admin QA helper');
live=once(live,
`    if (root === 'credentials') return renderCredentials();\n    if (root === 'credential' && a && b) return renderCredentialDetail(a, b);`,
`    // Admin QA certificate/credential previews are intentionally local and must\n    // not be replaced by the authoritative renderer. Normal learner routes stay\n    // authoritative. This only applies to a backend-verified admin with QA mode on.\n    if (adminQaPreviewActive() && ['credential','certificate','achievement'].includes(root)) return;\n\n    if (root === 'credentials') return renderCredentials();\n    if (root === 'credential' && a && b) return renderCredentialDetail(a, b);`,
'live UI yield to admin QA preview');
save(liveUiPath,live);

// 4) Two-track routing: Career Skills goes directly to the authoritative compact
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

// 5) Madeline must send Career Skills learners directly to the authoritative
// simulation instead of creating a visible legacy redirect hop.
const madelinePath='madeline.js';
let madeline=load(madelinePath);
madeline=once(madeline,
`action('Open Career Skills capstone',\`#/simulation/\${c.id}\`)`,
`action('Open Career Skills capstone',\`#/official-simulation/\${c.id}\`)`,
'Madeline authoritative Career Skills capstone');
save(madelinePath,madeline);

// 6) Signed-out gating must not leave the URL on Home while stale gated content
// remains rendered underneath the modal. A real hash navigation keeps the URL,
// rendered page, Back behavior, and pending-route state synchronized.
const certificateNamePath='certificate-name.js';
let certName=load(certificateNamePath);
certName=once(certName,
`    if (!currentUser()) {\n      routeGuardBusy = true;\n      savePendingRoute(hash);\n      history.replaceState(null, '', \`${'${location.pathname}${location.search}#/'}\`);\n      routeGuardBusy = false;\n      openLearningGate(hash);\n      return;\n    }`,
`    if (!currentUser()) {\n      routeGuardBusy = true;\n      savePendingRoute(hash);\n      const publicHome = \`${'${location.pathname}${location.search}#/'}\`;\n      if (location.hash !== '#/') location.replace(publicHome);\n      routeGuardBusy = false;\n      // Keep the modal outside #app so the home rerender cannot destroy it, but\n      // defer one task so the hashchange renderer and the gate never race.\n      setTimeout(() => openLearningGate(hash), 0);\n      return;\n    }`,
'signed-out gated route synchronization');
save(certificateNamePath,certName);

// 7) Cache-bust every JS asset changed by the stability/audit rounds so clients
// cannot run a mixed old/new script generation after deployment.
const indexPath='index.html';
let index=load(indexPath);
const replacements=[
  ['certificate-name.js','certificate-name.js?v=20260830-stability3'],
  ['app.js?v=20260830-guided2','app.js?v=20260830-stability3'],
  ['training-tracks.js?v=20260830-tracks2','training-tracks.js?v=20260830-stability3'],
  ['capital-mastery-live-ui.js?v=20260830-guided2','capital-mastery-live-ui.js?v=20260830-stability3'],
  ['capital-mastery-e2e.js?v=20260829-mixedsubmit1','capital-mastery-e2e.js?v=20260830-stability3'],
  ['ux-stability.js?v=20260828-perf1','ux-stability.js?v=20260830-stability3'],
  ['course-continuity.js','course-continuity.js?v=20260830-stability3'],
  ['runtime-audit-fixes.js?v=20260828-audit1','runtime-audit-fixes.js?v=20260830-stability3'],
  ['madeline.js?v=20260830-guided2','madeline.js?v=20260830-stability3'],
  ['admin-qa-simulation-fix.js?v=20260828-adminsim2','admin-qa-simulation-fix.js?v=20260830-stability3']
];
for(const [from,to] of replacements) index=once(index,from,to,`cache bust ${from}`);
save(indexPath,index);

console.log('Failure-seeking hardening round 2 applied.');
