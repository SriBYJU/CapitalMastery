import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(app.includes('<h3>Final Examination</h3>'),'pathway must visibly surface final examination');
ok(app.includes('Pass the Job Simulation first'),'final exam must show a locked prerequisite state');
ok(app.includes('Take Final Examination'),'passed simulation must expose final exam CTA');
ok(app.includes('function refreshLocalState(){ state=loadState(); }'),'app must expose an in-memory state refresh');
ok(app.includes('refreshLocalState,resetState'),'refreshLocalState must be exported through CM');
ok(live.includes('window.CM?.refreshLocalState?.();'),'official result mirror must refresh in-memory app state');
ok(index.includes('app.js?v=20260829-phase2proof1'),'app Phase 2 release must be cache-busted');
ok(index.includes('capital-mastery-live.js?v=20260829-finalgate1'),'live result mirror final-gate fix must be cache-busted');
console.log('FINAL EXAM SURFACE + IN-MEMORY SYNC PASS');
