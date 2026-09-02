(() => {
  'use strict';

  const API_URL = window.CAPITAL_MASTERY_API_URL;
  const CONFIG = window.CAPITAL_MASTERY_FIREBASE_CONFIG;
  const SDK = '12.18.0';

  let auth = null;
  let authApi = null;
  let currentUser = null;
  let workerIdentity = null;
  let message = '';
  let messageType = '';
  let googleAvailable = false;
  const GOOGLE_REDIRECT_FALLBACK_CODES = new Set([
    'auth/internal-error',
    'auth/popup-blocked',
    'auth/operation-not-supported-in-this-environment',
    'auth/web-storage-unsupported'
  ]);
  const EMAIL_RETRY_CODES = new Set(['auth/internal-error', 'auth/network-request-failed']);

  const CM_AUTH = window.CM_AUTH = {
    ready: false,
    user: null,
    isAdmin: false,
    backendVerified: false,
    googleAvailable: false,
    async googleSignIn() { throw new Error('Authentication is still loading.'); },
    async emailSignIn() { throw new Error('Authentication is still loading.'); },
    async emailCreate() { throw new Error('Authentication is still loading.'); },
    async enablePassword() { throw new Error('Authentication is still loading.'); },
    async signOut() { throw new Error('Authentication is still loading.'); },
    async resetPassword() { throw new Error('Authentication is still loading.'); },
    async deleteAccount() { throw new Error('Authentication is still loading.'); },
    async getIdToken() { return currentUser ? currentUser.getIdToken() : null; }
  };

  function setMessage(text, type = '') {
    message = text || '';
    messageType = type;
    enhanceUi(true);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  async function verifyWithWorker(user) {
    if (!user || !API_URL) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const token = await user.getIdToken(true);
      const response = await fetch(`${API_URL}/auth-check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Backend verification failed.');
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function friendlyAuthMessage(error) {
    return ({
      'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
      'auth/credential-already-in-use': 'That email/password sign-in belongs to another account. Sign out and use password reset instead.',
      'auth/invalid-credential': 'Email or password is incorrect. If this account uses Google, choose Continue with Google.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/provider-already-linked': 'Email and password sign-in is already enabled for this account.',
      'auth/requires-recent-login': 'For security, sign out, sign back in with Google, then create your password immediately.',
      'auth/weak-password': 'Use a stronger password.',
      'auth/network-request-failed': 'Firebase could not be reached. Check your connection and try again.',
      'auth/internal-error': 'Firebase could not finish that sign-in method. Refresh once, then try Google again or use secure email sign-in.',
      'auth/too-many-requests': 'Firebase temporarily limited sign-in attempts. Wait a few minutes or reset your password.'
    })[error?.code] || error?.message || 'Authentication request failed.';
  }

  async function repairAuthSession() {
    if (!auth || !authApi) return;
    await authApi.signOut(auth).catch(() => {});
    try {
      await authApi.setPersistence(auth, authApi.browserLocalPersistence);
    } catch (_) {
      await authApi.setPersistence(auth, authApi.browserSessionPersistence);
    }
  }

  async function resolveGoogleAvailability() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(CONFIG.apiKey)}`, { signal:controller.signal });
      const data = await response.json().catch(() => ({}));
      const domains = Array.isArray(data.authorizedDomains) ? data.authorizedDomains.map(value => String(value).toLowerCase()) : [];
      return response.ok && domains.includes(location.hostname.toLowerCase());
    } catch (_) {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function boot() {
    if (!CONFIG) {
      console.error('Capital Mastery Firebase config is missing.');
      setMessage('Firebase configuration is missing.', 'bad');
      return;
    }

    try {
      const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
      authApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);
      const firebaseApp = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(CONFIG);
      auth = authApi.getAuth(firebaseApp);
      googleAvailable = await resolveGoogleAvailability();
      CM_AUTH.googleAvailable = googleAvailable;

      CM_AUTH.googleSignIn = async () => {
        if (!googleAvailable) throw new Error('Google sign-in is not available on this domain. Use secure email sign-in instead.');
        setMessage('Opening Google sign-in…');
        const provider = new authApi.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          const result = await authApi.signInWithPopup(auth, provider);
          return result.user;
        } catch (error) {
          if (!GOOGLE_REDIRECT_FALLBACK_CODES.has(error?.code)) throw error;
          setMessage('The popup was unavailable. Continuing Google sign-in securely in this tab…');
          await repairAuthSession();
          await authApi.signInWithRedirect(auth, provider);
          return null;
        }
      };

      CM_AUTH.emailSignIn = async (email, password) => {
        setMessage('Signing in…');
        try {
          const result = await authApi.signInWithEmailAndPassword(auth, email, password);
          return result.user;
        } catch (error) {
          if (!EMAIL_RETRY_CODES.has(error?.code)) throw error;
          setMessage('Refreshing the secure sign-in connection…');
          await repairAuthSession();
          await new Promise(resolve => setTimeout(resolve, 300));
          const result = await authApi.signInWithEmailAndPassword(auth, email, password);
          return result.user;
        }
      };

      CM_AUTH.emailCreate = async (name, email, password) => {
        setMessage('Creating your account…');
        const result = await authApi.createUserWithEmailAndPassword(auth, email, password);
        if (name && name.trim()) await authApi.updateProfile(result.user, { displayName: name.trim() });
        await result.user.reload();
        return auth.currentUser;
      };

      CM_AUTH.enablePassword = async password => {
        const user = auth.currentUser;
        if (!user?.email) throw new Error('This Google account does not provide an email address.');
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('Use a password between 8 and 128 characters.');
        if (user.providerData?.some(provider => provider.providerId === 'password')) {
          setMessage('Email and password sign-in is already enabled.', 'good');
          return user;
        }
        setMessage('Securely adding password sign-in…');
        const credential = authApi.EmailAuthProvider.credential(user.email, password);
        const result = await authApi.linkWithCredential(user, credential);
        await result.user.reload();
        currentUser = auth.currentUser || result.user;
        CM_AUTH.user = currentUser;
        setMessage('Password sign-in enabled. You can now use Google or your email and password.', 'good');
        return currentUser;
      };

      CM_AUTH.signOut = async () => {
        await authApi.signOut(auth);
        setMessage('Signed out.', 'good');
      };

      CM_AUTH.resetPassword = async (email) => {
        if (!email) throw new Error('Enter your email address first.');
        await authApi.sendPasswordResetEmail(auth, email);
        setMessage('Password-reset email sent.', 'good');
      };

      authApi.getRedirectResult(auth).then(result => {
        if (result?.user) setMessage('Google sign-in completed.', 'good');
      }).catch(error => {
        console.error('Capital Mastery Google redirect sign-in failed:', error);
        setMessage(friendlyAuthMessage(error), 'bad');
      });


      CM_AUTH.deleteAccount = async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('Sign in before deleting your account.');
        setMessage('Deleting your Capital Mastery data…');
        const uid = user.uid;
        const token = await user.getIdToken(true);
        const response = await fetch(`${API_URL}/account/delete-data`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || 'Could not delete your Capital Mastery data.');
        const fs = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`);
        const db = fs.getFirestore();
        await fs.deleteDoc(fs.doc(db, 'users', uid, 'progress', 'state'));
        await fs.deleteDoc(fs.doc(db, 'users', uid));
        localStorage.removeItem(`capitalMasteryUserStateV1:${uid}`);
        localStorage.removeItem(`cmCredentialIdentityGuardV1:${uid}`);
        localStorage.removeItem('capitalMasteryActiveUidV1');
        localStorage.removeItem('capitalMasteryLocalStateV1');
        try {
          await authApi.deleteUser(user);
        } catch (error) {
          if (error?.code === 'auth/requires-recent-login') {
            throw new Error('Your Capital Mastery data was removed. For security, sign out, sign back in, then delete the remaining Firebase account identity.');
          }
          throw error;
        }
        message = 'Account and synced learning data deleted.';
        messageType = 'good';
        location.hash = '#/';
      };

      authApi.onAuthStateChanged(auth, user => {
        currentUser = user;
        workerIdentity = null;
        CM_AUTH.user = user;
        CM_AUTH.isAdmin = false;
        CM_AUTH.backendVerified = false;
        CM_AUTH.ready = true;

        // Firebase has resolved the signed-in state, so learner routes can render immediately.
        // Protected API calls still verify the Firebase ID token server-side before D1 access.
        document.dispatchEvent(new CustomEvent('cm-auth-changed', {
          detail: { user, isAdmin: false, backendVerified: false }
        }));
        enhanceUi(true);

        if (!user) return;
        verifyWithWorker(user).then(identity => {
          if (currentUser?.uid !== user.uid) return;
          workerIdentity = identity;
          CM_AUTH.isAdmin = identity?.isAdmin === true;
          CM_AUTH.backendVerified = true;
          if (!message || message === 'Signing in…' || message === 'Opening Google sign-in…' || message === 'Creating your account…') {
            message = 'Signed in and verified.';
            messageType = 'good';
          }
          document.dispatchEvent(new CustomEvent('cm-auth-changed', {
            detail: { user, isAdmin: CM_AUTH.isAdmin, backendVerified: true }
          }));
          enhanceUi(true);
        }).catch(error => {
          if (currentUser?.uid !== user.uid) return;
          console.error('Capital Mastery backend verification failed:', error);
          message = 'Signed in. Secure role verification will retry when needed.';
          messageType = 'bad';
          document.dispatchEvent(new CustomEvent('cm-auth-changed', {
            detail: { user, isAdmin: false, backendVerified: false }
          }));
          enhanceUi(true);
        });
      });
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Authentication failed to initialize.', 'bad');
    }
  }

  function accountHtml() {
    if (!CM_AUTH.ready) {
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card"><div class="eyebrow">ACCOUNT</div><h1 class="serif">Connecting securely…</h1><p>Loading Firebase Authentication and the Capital Mastery secure backend.</p></div></div></section>`;
    }

    if (currentUser) {
      const name = currentUser.displayName || currentUser.email || 'Capital Mastery learner';
      const providers = new Set((currentUser.providerData || []).map(provider => provider.providerId));
      const hasGoogle = providers.has('google.com');
      const hasPassword = providers.has('password');
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card">
        <div class="eyebrow">YOUR ACCOUNT</div>
        <h1 class="serif">Welcome, ${esc(name.split(' ')[0])}.</h1>
        <p>You are signed in with Firebase Authentication${CM_AUTH.backendVerified ? ' and verified by the Capital Mastery secure API' : ''}.</p>
        ${message ? `<div class="cm-auth-message ${esc(messageType)}">${esc(message)}</div>` : ''}
        <div class="cm-account-grid">
          <div><span>Email</span><strong>${esc(currentUser.email || 'Not provided')}</strong></div>
          <div><span>Backend</span><strong>${CM_AUTH.backendVerified ? 'Verified ✓' : 'Not verified'}</strong></div>
          <div><span>Role</span><strong>${CM_AUTH.isAdmin ? 'Administrator' : 'Learner'}</strong></div>
          <div><span>User ID</span><strong class="cm-uid">${esc(currentUser.uid)}</strong></div>
        </div>
        <div class="cm-auth-actions">
          <a class="btn btn-primary" href="#/passport">My Learning →</a>
          ${CM_AUTH.isAdmin ? '<a class="btn btn-gold" href="#/admin-preview">Admin →</a>' : ''}
          <button class="btn btn-outline" type="button" data-cm-auth-action="signout">Sign out</button>
        </div>
        <div class="cm-signin-methods">
          <div class="cm-signin-methods-head"><div><b>Sign-in methods</b><p>Both methods open this same account—your user ID, progress${CM_AUTH.isAdmin ? ' and administrator access' : ''} stay unchanged.</p></div></div>
          <div class="cm-method-grid">
            <div class="cm-method-status"><span>Google</span><strong>${hasGoogle ? 'Enabled ✓' : 'Not linked'}</strong></div>
            <div class="cm-method-status"><span>Email &amp; password</span><strong>${hasPassword ? 'Enabled ✓' : 'Set up below'}</strong></div>
          </div>
          ${!hasPassword && currentUser.email ? `<form id="cm-enable-password-form" class="cm-auth-form cm-enable-password-form">
            <p><b>Create your Capital Mastery password</b><br><span>After this one-time step, sign in with either Google or ${esc(currentUser.email)} plus this password.</span></p>
            <label>New password<input required type="password" name="password" autocomplete="new-password" minlength="8" maxlength="128" placeholder="At least 8 characters"></label>
            <label>Confirm password<input required type="password" name="confirmation" autocomplete="new-password" minlength="8" maxlength="128" placeholder="Type it again"></label>
            <button class="btn btn-gold" type="submit">Enable password sign-in</button>
          </form>` : ''}
        </div>
        <div class="cm-account-privacy"><div><b>Privacy & account data</b><p>Export your enterprise data, or permanently remove your personal Capital Mastery data and Firebase account. Sole workspace owners must transfer ownership first.</p></div><div><a class="btn btn-outline btn-sm" href="#/my-data">Export My Data</a><button class="btn btn-danger btn-sm" type="button" data-cm-auth-action="delete-account">Delete Account & Data</button></div></div>
      </div></div></section>`;
    }

    const googleEntry = googleAvailable
      ? `<button class="btn btn-outline btn-block cm-google" type="button" data-cm-auth-action="google">Continue with Google</button><div class="cm-auth-divider"><span>or</span></div>`
      : `<div class="cm-auth-provider-note">Secure email sign-in is available on this site.</div>`;

    return `<section class="section"><div class="container" style="max-width:900px">
      <div class="cm-auth-layout">
        <div class="card cm-auth-card">
          <div class="eyebrow">SIGN IN</div>
          <h1 class="serif">Welcome back.</h1>
          <p>Sign in to keep your Capital Mastery account connected.</p>
          ${message ? `<div class="cm-auth-message ${esc(messageType)}">${esc(message)}</div>` : ''}
          ${googleEntry}
          <form id="cm-signin-form" class="cm-auth-form">
            <label>Email<input required type="email" name="email" autocomplete="email" placeholder="you@example.com"></label>
            <label>Password<input required type="password" name="password" autocomplete="current-password" minlength="6" placeholder="Password"></label>
            <button class="btn btn-primary btn-block" type="submit">Sign in</button>
          </form>
          <button class="cm-link-button" type="button" data-cm-auth-action="reset">Forgot password?</button>
          <button class="cm-link-button" type="button" data-cm-auth-action="repair">Refresh sign-in session</button>
          <p class="cm-auth-method-note">Google users can create a password from their account page, then use either sign-in method. Administrator access follows the exact Firebase account and remains available with both methods.</p>
        </div>
        <div class="card cm-auth-card">
          <div class="eyebrow">NEW TO CAPITAL MASTERY?</div>
          <h2 class="serif">Create a free account.</h2>
          <p>No paywall. Your account will be used for learning progress, assessments and credentials.</p>
          <form id="cm-create-form" class="cm-auth-form">
            <label>Name<input required type="text" name="name" autocomplete="name" maxlength="80" placeholder="Your name"></label>
            <label>Email<input required type="email" name="email" autocomplete="email" placeholder="you@example.com"></label>
            <label>Password<input required type="password" name="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"></label>
            <button class="btn btn-gold btn-block" type="submit">Create free account</button>
          </form>
        </div>
      </div>
    </div></section>`;
  }

  function adminBlockedHtml() {
    if (!currentUser) {
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card"><div class="eyebrow">ADMIN</div><h1 class="serif">Sign in required.</h1><p>The Capital Mastery admin area is protected by the secure backend.</p><a class="btn btn-primary" href="#/login">Sign in →</a></div></div></section>`;
    }
    return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card"><div class="eyebrow">ADMIN</div><h1 class="serif">Access denied.</h1><p>Your Firebase account is authenticated, but the secure Capital Mastery API did not authorize this account as an administrator.</p><a class="btn btn-primary" href="#/">Return home</a></div></div></section>`;
  }

  function enhanceUi(force = false) {
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    const signIn = appRoot.querySelector('.nav-actions a[href="#/login"]');
    if (signIn) {
      const label = currentUser ? (currentUser.displayName?.split(' ')[0] || 'Account') : 'Sign in';
      if (signIn.textContent !== label) signIn.textContent = label;
      signIn.title = currentUser ? `Signed in as ${currentUser.email || currentUser.uid}` : 'Sign in to Capital Mastery';
    }

    const hash = location.hash || '#/';
    const main = appRoot.querySelector('main#main');
    if (!main) return;

    if (hash === '#/login' || hash.startsWith('#/login?')) {
      const stamp = `login:${CM_AUTH.ready}:${currentUser?.uid || 'out'}:${CM_AUTH.isAdmin}:${message}`;
      if (force || main.dataset.cmAuthView !== stamp) {
        main.dataset.cmAuthView = stamp;
        main.innerHTML = accountHtml();
      }
      return;
    }

    if (hash.startsWith('#/admin-preview') && (!CM_AUTH.ready || !CM_AUTH.isAdmin)) {
      const stamp = `admin-block:${CM_AUTH.ready}:${currentUser?.uid || 'out'}:${CM_AUTH.isAdmin}`;
      if (force || main.dataset.cmAuthView !== stamp) {
        main.dataset.cmAuthView = stamp;
        main.innerHTML = CM_AUTH.ready ? adminBlockedHtml() : `<section class="section"><div class="container"><div class="card"><h1>Checking administrator access…</h1></div></div></section>`;
      }
    }
  }

  function injectStyles() {
    if (document.getElementById('cm-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-auth-styles';
    style.textContent = `
      .cm-auth-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
      .cm-auth-card h1,.cm-auth-card h2{color:var(--navy);margin:6px 0 12px}.cm-auth-card h1{font-size:2.7rem}.cm-auth-card h2{font-size:2rem}
      .cm-auth-form{display:grid;gap:14px}.cm-auth-form label{display:grid;gap:6px;color:var(--navy);font-size:.9rem;font-weight:750}
      .cm-auth-form input{width:100%;border:1px solid #cbd2da;background:#fff;border-radius:10px;padding:12px 13px;color:var(--ink);outline:none}
      .cm-auth-form input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(185,138,67,.13)}
      .cm-auth-divider{display:flex;align-items:center;gap:12px;color:#8a929b;font-size:.8rem;margin:17px 0}.cm-auth-divider:before,.cm-auth-divider:after{content:"";height:1px;background:#e0e4e8;flex:1}
      .cm-auth-message{padding:11px 13px;border-radius:10px;background:#eef2f6;color:var(--navy);font-size:.88rem;margin:14px 0}.cm-auth-message.good{background:#eaf6ef;color:#245b43}.cm-auth-message.bad{background:#fff0f0;color:#8b3232}
      .cm-google{background:white}.cm-auth-provider-note{padding:10px 12px;margin:12px 0;border:1px solid #d8e1e9;border-radius:10px;background:#f5f8fa;color:#46586a;font-size:.84rem}.cm-link-button{border:0;background:transparent;color:var(--navy-3);padding:10px 12px 0 0;text-decoration:underline;cursor:pointer}.cm-auth-method-note{margin:14px 0 0;color:#667482;font-size:.78rem;line-height:1.45}
      .cm-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.cm-account-grid>div{background:#f5f7f9;border:1px solid #e3e7eb;border-radius:12px;padding:14px}.cm-account-grid span{display:block;color:#77818d;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.cm-account-grid strong{display:block;color:var(--navy);margin-top:5px;word-break:break-word}.cm-uid{font-size:.78rem}.cm-auth-actions{display:flex;flex-wrap:wrap;gap:10px}
      .cm-signin-methods{margin-top:22px;padding:17px;border:1px solid #dce3e9;background:#f8fafb;border-radius:12px}.cm-signin-methods-head b{color:var(--navy)}.cm-signin-methods-head p,.cm-enable-password-form p{margin:5px 0 0;color:#5f6d7a;font-size:.84rem;line-height:1.5}.cm-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.cm-method-status{background:#fff;border:1px solid #e0e5e9;border-radius:10px;padding:12px}.cm-method-status span{display:block;color:#77818d;font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;font-weight:800}.cm-method-status strong{display:block;color:var(--navy);margin-top:4px}.cm-enable-password-form{margin-top:16px;padding-top:16px;border-top:1px solid #dce3e9}.cm-enable-password-form p{margin:0 0 2px}.cm-enable-password-form p b{color:var(--navy)}
      .cm-account-privacy{margin-top:22px;padding:16px;border:1px solid #ead1d1;background:#fff8f8;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:16px}.cm-account-privacy b{color:#7d2727}.cm-account-privacy p{margin:5px 0 0;color:#6d6262;font-size:.82rem;line-height:1.45}.cm-account-privacy>div:last-child{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.btn-danger{background:#8b2f2f;color:#fff;border-color:#8b2f2f}.btn-danger:hover{background:#702626}
      @media(max-width:760px){.cm-auth-layout,.cm-account-grid,.cm-method-grid{grid-template-columns:1fr}.cm-account-privacy{align-items:stretch;flex-direction:column}.cm-account-privacy>div:last-child{justify-content:flex-start}.cm-auth-card h1{font-size:2.2rem}}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-cm-auth-action]');
    if (!button) return;
    const action = button.dataset.cmAuthAction;
    try {
      button.disabled = true;
      if (action === 'google') await CM_AUTH.googleSignIn();
      if (action === 'signout') await CM_AUTH.signOut();
      if (action === 'delete-account') {
        const first = confirm('Permanently delete your Capital Mastery personal data, credentials, synced progress, memberships and Firebase account? This cannot be undone.');
        if (!first) return;
        const typed = prompt('Type DELETE to confirm permanent account deletion.');
        if (typed !== 'DELETE') throw new Error('Account deletion cancelled. Type DELETE exactly to confirm.');
        await CM_AUTH.deleteAccount();
      }
      if (action === 'reset') {
        const email = document.querySelector('#cm-signin-form input[name="email"]')?.value.trim();
        await CM_AUTH.resetPassword(email);
      }
      if (action === 'repair') {
        await repairAuthSession();
        setMessage('Sign-in session refreshed. Try your original sign-in method again.', 'good');
      }
    } catch (error) {
      console.error(error);
      setMessage(friendlyAuthMessage(error), 'bad');
    } finally {
      button.disabled = false;
    }
  });

  document.addEventListener('submit', async event => {
    if (event.target.id !== 'cm-signin-form' && event.target.id !== 'cm-create-form' && event.target.id !== 'cm-enable-password-form') return;
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    try {
      submit.disabled = true;
      if (form.id === 'cm-signin-form') {
        await CM_AUTH.emailSignIn(String(data.get('email') || '').trim(), String(data.get('password') || ''));
      } else if (form.id === 'cm-create-form') {
        await CM_AUTH.emailCreate(String(data.get('name') || '').trim(), String(data.get('email') || '').trim(), String(data.get('password') || ''));
      } else {
        const password = String(data.get('password') || '');
        const confirmation = String(data.get('confirmation') || '');
        if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
        if (password !== confirmation) throw new Error('The passwords do not match.');
        await CM_AUTH.enablePassword(password);
      }
    } catch (error) {
      console.error(error);
      setMessage(friendlyAuthMessage(error), 'bad');
    } finally {
      submit.disabled = false;
    }
  });

  injectStyles();
  const observer = new MutationObserver(() => enhanceUi(false));
  const startObserver = () => {
    const root = document.getElementById('app');
    if (root) observer.observe(root, { childList: true, subtree: true });
    enhanceUi(true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
  window.addEventListener('hashchange', () => setTimeout(() => enhanceUi(true), 0));
  boot();
})();
