import fs from 'node:fs';
const auth=fs.readFileSync('firebase-auth.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
function ok(cond,msg){ if(!cond) throw new Error(msg); }
ok(auth.includes("onAuthStateChanged(auth, user =>"),'auth callback must not block on async verification');
ok(auth.includes('CM_AUTH.ready = true;'),'Firebase readiness must be set immediately');
ok(auth.includes('verifyWithWorker(user).then'),'backend role verification must run in background');
ok(auth.includes('AbortController'),'backend identity check must have timeout');
ok(auth.includes("'auth/internal-error'")&&auth.includes('signInWithRedirect(auth, provider)'),'Google popup internal errors must fall back to same-tab redirect authentication');
ok(auth.includes('getRedirectResult(auth)'),'Google redirect results must be completed after returning to Capital Mastery');
ok(auth.includes("if (error?.code !== 'auth/internal-error') throw error")&&auth.includes('setTimeout(resolve, 300)'),'Email/password internal errors must receive one bounded retry');
ok(auth.includes('function friendlyAuthMessage(error)'),'Firebase failures must render actionable recovery guidance');
ok(auth.includes('async function repairAuthSession()')&&auth.includes('browserLocalPersistence')&&auth.includes('browserSessionPersistence'),'Internal auth recovery must refresh persistence with a session fallback');
ok(auth.includes('data-cm-auth-action="repair"')&&auth.includes("Sign-in session refreshed."),'Signed-out users must have an explicit non-destructive sign-in session repair action');
ok(auth.includes('EmailAuthProvider.credential(user.email, password)')&&auth.includes('linkWithCredential(user, credential)'),'Google-authenticated users must be able to link a password to the same Firebase UID');
ok(auth.includes('id="cm-enable-password-form"')&&auth.includes('Enable password sign-in'),'Signed-in Google users must receive a clear password setup flow');
ok(auth.includes("providers.has('google.com')")&&auth.includes("providers.has('password')"),'Account UI must report linked Google and password providers independently');
ok(live.includes('waitForAuthReady'),'assessment route must have auth watchdog');
ok(live.includes('cm-auth-retry'),'assessment timeout must expose retry action');
ok(live.includes("setTimeout(() => route(), 250)"),'assessment route must automatically retry while auth initializes');
console.log('AUTH/ASSESSMENT HANG REGRESSION PASS');

const index=fs.readFileSync('index.html','utf8');
ok(/firebase-auth\.js\?v=[A-Za-z0-9._-]+/.test(index),'firebase auth asset must be cache-busted');
ok(/capital-mastery-live\.js\?v=[A-Za-z0-9._-]+/.test(index),'secure assessment script must be cache-busted');
console.log('AUTH ASSET CACHE-BUST PASS');
