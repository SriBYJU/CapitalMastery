import fs from 'node:fs';

function replaceOnce(path,before,after,label){
  let src=fs.readFileSync(path,'utf8');
  const i=src.indexOf(before);
  if(i<0) throw new Error(`Missing target: ${label}`);
  if(src.indexOf(before,i+before.length)>=0) throw new Error(`Ambiguous target: ${label}`);
  src=src.slice(0,i)+after+src.slice(i+before.length);
  fs.writeFileSync(path,src);
}

const cert='certificate-name.js';
replaceOnce(cert,
`  async function remoteNameConfirmation(user) {
    try {
      const appApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-app.js\`);
      const fsApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-firestore.js\`);
      const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
      const db = fsApi.getFirestore(app);
      const snap = await fsApi.getDoc(fsApi.doc(db, 'users', user.uid, 'progress', 'state'));
      if (!snap.exists()) return { confirmed:false, name:'' };
      const profile = snap.data()?.profile || {};
      const name = String(profile.certificateName || profile.name || '').replace(/\\s+/g, ' ').trim();
      return { confirmed: profile.certificateNameConfirmed === true && !!name, name };
    } catch (error) {
      console.warn('Could not check credential-name onboarding state:', error);
      return null;
    }
  }`,
`  async function remoteNameConfirmation(user) {
    try {
      const appApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-app.js\`);
      const fsApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-firestore.js\`);
      const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
      const db = fsApi.getFirestore(app);

      // Credential identity is authoritative on the protected user-root document.
      // This keeps a stale progress-state write from erasing one-time onboarding.
      const rootSnap = await fsApi.getDoc(fsApi.doc(db, 'users', user.uid));
      if (rootSnap.exists()) {
        const root = rootSnap.data() || {};
        const rootName = String(root.credentialName || '').replace(/\\s+/g, ' ').trim();
        if (root.credentialNameConfirmed === true && rootName) {
          return { confirmed:true, name:rootName };
        }
      }

      // Legacy compatibility: older accounts stored confirmation inside progress/state.
      const snap = await fsApi.getDoc(fsApi.doc(db, 'users', user.uid, 'progress', 'state'));
      if (!snap.exists()) return { confirmed:false, name:'' };
      const profile = snap.data()?.profile || {};
      const name = String(profile.certificateName || profile.name || '').replace(/\\s+/g, ' ').trim();
      return { confirmed: profile.certificateNameConfirmed === true && !!name, name };
    } catch (error) {
      console.warn('Could not check credential-name onboarding state:', error);
      return null;
    }
  }`,
'root-first remote credential identity');

replaceOnce(cert,
`  async function saveFullName(rawName) {`,
`  async function persistCredentialIdentity(user, name) {
    const appApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-app.js\`);
    const fsApi = await import(\`https://www.gstatic.com/firebasejs/\${SDK}/firebase-firestore.js\`);
    const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
    const db = fsApi.getFirestore(app);
    await fsApi.setDoc(fsApi.doc(db, 'users', user.uid), {
      credentialName: name,
      credentialNameConfirmed: true,
      credentialNameUpdatedAt: fsApi.serverTimestamp(),
      displayName: name,
      email: user.email || null,
      lastSeenAt: fsApi.serverTimestamp()
    }, { merge:true });
  }

  async function saveFullName(rawName) {`,
'dedicated credential identity writer');

replaceOnce(cert,
`    if (!updateLocalProfileName(cleaned)) throw new Error('Could not create your learning profile. Please try again.');
    const syncReady = await waitForSync();
    if (!syncReady) throw new Error('Progress sync is still connecting. Please try again.');
    const synced = await window.CM_SYNC.flush();
    if (!synced) throw new Error('Could not save your credential name to your account. Please try again.');

    setLocalOnboarded(user, true);`,
`    if (!updateLocalProfileName(cleaned)) throw new Error('Could not create your learning profile. Please try again.');

    // Name onboarding has its own durable Firestore write. Do not block this
    // identity-critical step on the whole learning-progress synchronization graph.
    await persistCredentialIdentity(user, cleaned);
    setLocalOnboarded(user, true);

    // Progress sync remains useful as a compatibility mirror, but it is best-effort
    // and can no longer revoke or erase the authoritative root confirmation.
    if (window.CM_SYNC?.ready && window.CM_SYNC?.flush) {
      Promise.resolve().then(() => window.CM_SYNC.flush()).catch(error => {
        console.warn('Credential name saved; progress-state mirror will retry later:', error);
      });
    }`,
'name save independent of progress flush');

const sync='firebase-sync.js';
replaceOnce(sync,
`    const base = {
      displayName: state.profile?.certificateName || user.displayName || state.profile?.name || null,
      email: user.email || null,
      lastSeenAt: fs.serverTimestamp()
    };`,
`    const base = {
      displayName: state.profile?.certificateName || user.displayName || state.profile?.name || null,
      email: user.email || null,
      lastSeenAt: fs.serverTimestamp()
    };
    const credentialName = String(state.profile?.certificateName || '').replace(/\\s+/g, ' ').trim();
    if (state.profile?.certificateNameConfirmed === true && looksLikeFullName(credentialName)) {
      base.credentialName = credentialName;
      base.credentialNameConfirmed = true;
      base.credentialNameUpdatedAt = fs.serverTimestamp();
    }`,
'progress sync preserves confirmed root identity');

console.log('CREDENTIAL NAME ROOT PERSISTENCE PATCH PASS');
