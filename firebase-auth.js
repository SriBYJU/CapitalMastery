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

  const CM_AUTH = window.CM_AUTH = {
    ready: false,
    user: null,
    isAdmin: false,
    backendVerified: false,
    async googleSignIn() { throw new Error('Authentication is still loading.'); },
    async emailSignIn() { throw new Error('Authentication is still loading.'); },
    async emailCreate() { throw new Error('Authentication is still loading.'); },
    async signOut() { throw new Error('Authentication is still loading.'); },
    async resetPassword() { throw new Error('Authentication is still loading.'); },
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

      CM_AUTH.googleSignIn = async () => {
        setMessage('Opening Google sign-inâ¦');
        const provider = new authApi.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await authApi.signInWithPopup(auth, provider);
        return result.user;
      };

      CM_AUTH.emailSignIn = async (email, password) => {
        setMessage('Signing inâ¦');
        const result = await authApi.signInWithEmailAndPassword(auth, email, password);
        return result.user;
      };

      CM_AUTH.emailCreate = async (name, email, password) => {
        setMessage('Creating your accountâ¦');
        const result = await authApi.createUserWithEmailAndPassword(auth, email, password);
        if (name && name.trim()) await authApi.updateProfile(result.user, { displayName: name.trim() });
        await result.user.reload();
        return auth.currentUser;
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
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card"><div class="eyebrow">ACCOUNT</div><h1 class="serif">Connecting securelyâ¦</h1><p>Loading Firebase Authentication and the Capital Mastery secure backend.</p></div></div></section>`;
    }

    if (currentUser) {
      const name = currentUser.displayName || currentUser.email || 'Capital Mastery learner';
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card">
        <div class="eyebrow">YOUR ACCOUNT</div>
        <h1 class="serif">Welcome, ${esc(name.split(' ')[0])}.</h1>
        <p>You are signed in with Firebase Authentication${CM_AUTH.backendVerified ? ' and verified by the Capital Mastery secure API' : ''}.</p>
        ${message ? `<div class="cm-auth-message ${esc(messageType)}">${esc(message)}</div>` : ''}
        <div class="cm-account-grid">
          <div><span>Email</span><strong>${esc(currentUser.email || 'Not provided')}</strong></div>
          <div><span>Backend</span><strong>${CM_AUTH.backendVerified ? 'Verified â' : 'Not verified'}</strong></div>
          <div><span>Role</span><strong>${CM_AUTH.isAdmin ? 'Administrator' : 'Learner'}</strong></div>
          <div><span>User ID</span><strong class="cm-uid">${esc(currentUser.uid)}</strong></div>
        </div>
        <div class="cm-auth-actions">
          <a class="btn btn-primary" href="#/passport">My Learning â</a>
          ${CM_AUTH.isAdmin ? '<a class="btn btn-gold" href="#/admin-preview">Admin â</a>' : ''}
          <button class="btn btn-outline" type="button" data-cm-auth-action="signout">Sign out</button>
        </div>
      </div></div></section>`;
    }

    return `<section class="section"><div class="container" style="max-width:900px">
      <div class="cm-auth-layout">
        <div class="card cm-auth-card">
          <div class="eyebrow">SIGN IN</div>
          <h1 class="serif">Welcome back.</h1>
          <p>Sign in to keep your Capital Mastery account connected.</p>
          ${message ? `<div class="cm-auth-message ${esc(messageType)}">${esc(message)}</div>` : ''}
          <button class="btn btn-outline btn-block cm-google" type="button" data-cm-auth-action="google">Continue with Google</button>
          <div class="cm-auth-divider"><span>or</span></div>
          <form id="cm-signin-form" class="cm-auth-form">
            <label>Email<input required type="email" name="email" autocomplete="email" placeholder="you@example.com"></label>
            <label>Password<input required type="password" name="password" autocomplete="current-password" minlength="6" placeholder="Password"></label>
            <button class="btn btn-primary btn-block" type="submit">Sign in</button>
          </form>
          <button class="cm-link-button" type="button" data-cm-auth-action="reset">Forgot password?</button>
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
      return `<section class="section"><div class="container" style="max-width:760px"><div class="card cm-auth-card"><div class="eyebrow">ADMIN</div><h1 class="serif">Sign in required.</h1><p>The Capital Mastery admin area is protected by the secure backend.</p><a class="btn btn-primary" href="#/login">Sign in â</a></div></div></section>`;
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
        main.innerHTML = CM_AUTH.ready ? adminBlockedHtml() : `<section class="section"><div class="container"><div class="card"><h1>Checking administrator accessâ¦</h1></div></div></section>`;
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
      .cm-google{background:white}.cm-link-button{border:0;background:transparent;color:var(--navy-3);padding:10px 0 0;text-decoration:underline;cursor:pointer}
      .cm-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.cm-account-grid>div{background:#f5f7f9;border:1px solid #e3e7eb;border-radius:12px;padding:14px}.cm-account-grid span{display:block;color:#77818d;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.cm-account-grid strong{display:block;color:var(--navy);margin-top:5px;word-break:break-word}.cm-uid{font-size:.78rem}.cm-auth-actions{display:flex;flex-wrap:wrap;gap:10px}
      @media(max-width:760px){.cm-auth-layout,.cm-account-grid{grid-template-columns:1fr}.cm-auth-card h1{font-size:2.2rem}}
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
      if (action === 'reset') {
        const email = document.querySelector('#cm-signin-form input[name="email"]')?.value.trim();
        await CM_AUTH.resetPassword(email);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Authentication request failed.', 'bad');
    } finally {
      button.disabled = false;
    }
  });

  document.addEventListener('submit', async event => {
    if (event.target.id !== 'cm-signin-form' && event.target.id !== 'cm-create-form') return;
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    try {
      submit.disabled = true;
      if (form.id === 'cm-signin-form') {
        await CM_AUTH.emailSignIn(String(data.get('email') || '').trim(), String(data.get('password') || ''));
      } else {
        await CM_AUTH.emailCreate(String(data.get('name') || '').trim(), String(data.get('email') || '').trim(), String(data.get('password') || ''));
      }
    } catch (error) {
      console.error(error);
      const friendly = ({
        'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Use a stronger password.'
      })[error.code] || error.message || 'Authentication request failed.';
      setMessage(friendly, 'bad');
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
