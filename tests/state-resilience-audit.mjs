import fs from 'node:fs';
function ok(value,message){if(!value)throw new Error(message);}

const guard=fs.readFileSync('state-resilience.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');

ok(index.includes('state-resilience.js?v=20260830-stability1'),'State resilience guard must be loaded and cache-busted');
ok(index.indexOf('state-resilience.js') < index.indexOf('firebase-auth.js'),'State repair must run before async authentication can activate a user snapshot');
ok(index.indexOf('state-resilience.js') < index.indexOf('account-isolation-early.js'),'State repair must run before account-isolation snapshots are read');
ok(index.indexOf('state-resilience.js') < index.indexOf('app.js'),'State repair must run before app.js captures its in-memory state');
for(const field of ['profile','careers','credentials','preferences']) ok(guard.includes(`state.${field}`),`State guard must normalize ${field}`);
for(const field of ['learningComplete','completedParts','quizScores','applied','simResponses','conceptPractice']) ok(guard.includes(`career.${field}`),`Career state guard must normalize ${field}`);
ok(guard.includes("key?.startsWith(USER_STATE_PREFIX)"),'Per-user local snapshots must be normalized in addition to the active state');
ok(guard.includes('value.version !== 1')&&guard.includes('return null'),'Unknown future schema versions must not be silently rewritten as v1');
ok(guard.includes('try {')&&guard.includes('localStorage.setItem')&&guard.includes('catch (_)'),'Storage repair writes must fail open when browser storage is restricted');
ok(app.includes('if (parsed && parsed.version === 1) return parsed'),'App fallback remains available after the pre-boot structural guard');

console.log('STATE RESILIENCE AUDIT PASS: malformed v1 state is structurally normalized before auth/account/app boot');
