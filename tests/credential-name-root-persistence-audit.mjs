import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cert = fs.readFileSync('certificate-name.js', 'utf8');
const sync = fs.readFileSync('firebase-sync.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

assert(cert.includes("fsApi.doc(db, 'users', user.uid)"), 'Credential-name save must use the user root Firestore document');
assert(/credentialNameConfirmed\s*:\s*true/.test(cert), 'Credential-name save must persist an explicit durable confirmation marker');
assert(cert.includes('credentialNameUpdatedAt:timestamp(now)'), 'Credential-name save must timestamp the durable identity record');
assert(cert.includes("Authorization:`Bearer ${token}`")&&cert.includes("method:'PATCH'"), 'Credential-name writes must use the signed-in owner token');
assert(cert.includes('verifiedAfterAmbiguousWrite')&&cert.includes('retryable(response.status)'), 'Credential-name writes must verify or retry ambiguous Firestore 5xx responses');
assert(cert.includes('profile.certificateName?.stringValue===name')&&cert.includes('profile.certificateNameConfirmed?.booleanValue===true'), 'Ambiguous progress writes must verify the exact persisted identity before succeeding');
assert(cert.includes('Credential identity is authoritative on the protected user-root document.'), 'Remote credential-name lookup must prefer the durable root identity');
assert(cert.includes("fsApi.doc(db, 'users', user.uid, 'progress', 'state')"), 'Legacy progress/state confirmation read fallback must remain available');
assert(cert.includes("return 'progress-compatibility'"), 'Owner-only rolling-rules compatibility write must remain available until live rules converge');
assert(cert.indexOf("fsApi.doc(db, 'users', user.uid)") < cert.indexOf("fsApi.doc(db, 'users', user.uid, 'progress', 'state')"), 'Root identity must be checked before legacy progress/state fallback');
assert(!cert.includes("if (!synced) throw new Error('Could not save your credential name to your account. Please try again.');"), 'Credential identity must not fail solely because broad progress sync fails');
assert(cert.includes("const IDENTITY_GUARD_PREFIX = 'cmCredentialIdentityGuardV1:'"), 'Credential save must install a short-lived first-login identity guard');
assert(cert.includes('expiresAt:Date.now() + 120000'), 'First-login identity guard must expire instead of overriding future cross-device edits');
assert(cert.includes("!['loading','syncing','starting'].includes(window.CM_SYNC.status)"), 'Credential identity must wait only for an already-active hydration/write, never enqueue a blocking broad flush');
assert(cert.indexOf('await waitForSync()') < cert.indexOf('await persistCredentialIdentity(user, cleaned)'), 'Any older hydration/write must receive a bounded settlement window before the final identity write');
assert(cert.indexOf('await persistCredentialIdentity(user, cleaned)') < cert.indexOf('await settleProgressAfterIdentity()'), 'Credential identity must be written before the bounded progress-settlement fence');
assert((cert.match(/await persistCredentialIdentity\(user, cleaned\)/g)||[]).length === 2, 'Credential identity must be reasserted after the progress-settlement fence');
assert(cert.includes('Promise.race([')&&cert.includes('settleProgressAfterIdentity'),'Progress settlement must be bounded so onboarding cannot hang indefinitely');
assert((cert.match(/updateLocalProfileName\(cleaned\)/g)||[]).length >= 2, 'Credential confirmation must reassert local identity after the final remote write');
assert(cert.includes('data-cm-name-switch-account')&&cert.includes('Sign out and use another account'), 'Required-name onboarding must expose a clear wrong-account escape');
assert(cert.includes('await window.CM_AUTH.signOut()'), 'Wrong-account escape must use the real Firebase sign-out flow');
assert(cert.includes('clearPendingRoute();')&&cert.includes("location.hash = '#/login'"), 'Wrong-account escape must discard gated resume intent and return to login');

assert(sync.includes('base.credentialNameConfirmed = true'), 'Normal progress sync must preserve an already-confirmed root identity when local confirmation is present');
assert(sync.includes('let syncTail = Promise.resolve(true)'), 'Cloud progress writes must use a single serialized queue');
assert(sync.includes('return scheduleCloudSync(readLocalState())'), 'Explicit progress flushes must join the serialized queue');
assert(sync.includes('if (sameActiveUser) return;'), 'Repeated same-user role-verification events must not start duplicate hydration');
assert(sync.includes("const IDENTITY_GUARD_PREFIX = 'cmCredentialIdentityGuardV1:'"), 'Progress synchronization must recognize the short-lived first-login identity guard');
assert(sync.includes('Number(guard?.expiresAt || 0) > Date.now()'), 'Progress synchronization must ignore expired identity guards');
assert(sync.includes('identityIncompleteAtStart'), 'New-account hydration must preserve the identity state observed before credential-name setup begins');
assert(sync.includes("document.getElementById('cm-full-name-onboarding')"), 'Cloud hydration must not reload through active credential-name onboarding');
assert(sync.includes('!identitySetupBusy'), 'Hydration reloads must defer while first-time credential identity setup owns the page');
assert(sync.indexOf("fs.doc(db, 'users', user.uid, 'progress', 'state')") < sync.indexOf('await writeRootProfile(clean)'), 'Owner-only progress sync must not be blocked by a rolling user-root rules deployment');
assert(sync.includes('Protected account-profile mirror will retry after rules convergence'), 'Root-profile rules rollout failure must be isolated from course progress sync');
assert(sync.includes("await fs.setDoc(ref, base, { merge: true });"), 'User-root sync must remain merge-only so stale progress state cannot delete credential identity fields');
assert(!sync.includes("credentialNameConfirmed: false"), 'Progress sync must never write a false root credential confirmation');

for (const field of ['credentialName', 'credentialNameConfirmed', 'credentialNameUpdatedAt']) {
  assert(rules.includes(`'${field}'`), `Firestore rules must explicitly allow ${field} on the owned user root document`);
}
assert(rules.includes('request.resource.data.credentialNameConfirmed == true'), 'Firestore rules must not allow clients to persist a false durable confirmation marker');
assert(rules.includes('request.resource.data.displayName == request.resource.data.credentialName'), 'Firestore rules must bind durable credential identity to the visible display name');
assert(rules.includes('request.resource.data.credentialName.size() <= 80'), 'Firestore rules must bound credential-name size');
assert(rules.includes('allow read: if owns(uid);'), 'Credential identity must remain private to the signed-in owner');

console.log('CREDENTIAL NAME ROOT PERSISTENCE AUDIT PASS: durable root confirmation + legacy read fallback + merge-only progress sync + strict owner rules');
