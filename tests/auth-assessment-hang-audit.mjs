import fs from 'node:fs';
const auth=fs.readFileSync('firebase-auth.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
function ok(cond,msg){ if(!cond) throw new Error(msg); }
ok(auth.includes("onAuthStateChanged(auth, user =>"),'auth callback must not block on async verification');
ok(auth.includes('CM_AUTH.ready = true;'),'Firebase readiness must be set immediately');
ok(auth.includes('verifyWithWorker(user).then'),'backend role verification must run in background');
ok(auth.includes('AbortController'),'backend identity check must have timeout');
ok(live.includes('waitForAuthReady'),'assessment route must have auth watchdog');
ok(live.includes('cm-auth-retry'),'assessment timeout must expose retry action');
ok(live.includes("setTimeout(() => route(), 250)"),'assessment route must automatically retry while auth initializes');
console.log('AUTH/ASSESSMENT HANG REGRESSION PASS');

const index=fs.readFileSync('index.html','utf8');
ok(/firebase-auth\.js\?v=[A-Za-z0-9._-]+/.test(index),'firebase auth asset must be cache-busted');
ok(/capital-mastery-live\.js\?v=[A-Za-z0-9._-]+/.test(index),'secure assessment script must be cache-busted');
console.log('AUTH ASSET CACHE-BUST PASS');
