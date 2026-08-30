import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cert = fs.readFileSync('certificate-name.js', 'utf8');
const sync = fs.readFileSync('firebase-sync.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

assert(cert.includes("fsApi.doc(db, 'users', user.uid)"), 'Credential-name save must use the user root Firestore document');
assert(cert.includes('credentialNameConfirmed: true'), 'Credential-name save must persist an explicit durable confirmation marker');
assert(cert.includes('credentialNameUpdatedAt: fsApi.serverTimestamp()'), 'Credential-name save must timestamp the durable identity record');
assert(cert.includes('Credential identity is authoritative on the protected user-root document.'), 'Remote credential-name lookup must prefer the durable root identity');
assert(cert.includes("fsApi.doc(db, 'users', user.uid, 'progress', 'state')"), 'Legacy progress/state confirmation read fallback must remain available');
assert(cert.indexOf("fsApi.doc(db, 'users', user.uid)") < cert.indexOf("fsApi.doc(db, 'users', user.uid, 'progress', 'state')"), 'Root identity must be checked before legacy progress/state fallback');
assert(!cert.includes("if (!synced) throw new Error('Could not save your credential name to your account. Please try again.');"), 'Credential identity must not fail solely because broad progress sync fails');
assert(cert.includes('progress-state mirror will retry later'), 'Progress-state mirroring must be explicitly best-effort after identity save');

assert(sync.includes('base.credentialNameConfirmed = true'), 'Normal progress sync must preserve an already-confirmed root identity when local confirmation is present');
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
