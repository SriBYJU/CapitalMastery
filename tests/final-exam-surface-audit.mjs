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
ok(/app\.js\?v=[A-Za-z0-9._-]+/.test(index),'app release must be cache-busted');
ok(/capital-mastery-live\.js\?v=[A-Za-z0-9._-]+/.test(index),'live result mirror must be cache-busted');
console.log('FINAL EXAM SURFACE + IN-MEMORY SYNC PASS');
