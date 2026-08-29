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
ok(index.includes('firebase-auth.js?v=20260829-authfix1'),'firebase auth hotfix must be cache-busted');
ok(index.includes('capital-mastery-live.js?v=20260829-authfix1'),'secure assessment hotfix must be cache-busted');
console.log('AUTH ASSET CACHE-BUST PASS');
