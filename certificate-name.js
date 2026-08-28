(() => {
  'use strict';

  const SDK = '12.18.0';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const ONBOARD_PREFIX = 'cmCredentialNameOnboardedV2:';
  const PENDING_ROUTE_KEY = 'cmPendingLearningRouteV1';

  const GATED_ROOTS = new Set([
    'careers',
    'career',
    'learn',
    'quiz',
    'official-simulation',
    'simulation',
    'final',
    'passport',
    'credentials',
    'credential',
    'certificate',
    'achievement',
    'compare',
    'admin-preview'
  ]);

  let gateOpen = false;
  let nameModalOpen = false;
  let routeGuardBusy = false;

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function currentUser() {
    return window.CM_AUTH?.user || null;
  }

  function authReady() {
    return !!window.CM_AUTH?.ready;
  }

  function routeRoot(hash = location.hash) {
    return String(hash || '#/')
      .replace(/^#\/?/, '')
      .split('?')[0]
      .split('/')
      .filter(Boolean)[0] || '';
  }

  function isGatedHash(hash) {
    return GATED_ROOTS.has(routeRoot(hash));
  }

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) {
      return null;
    }
  }

  function onboardingKey(user) {
    return `${ONBOARD_PREFIX}${user.uid}`;
  }

  function stateHasConfirmedName() {
    const profile = readState()?.profile || {};
    return profile.certificateNameConfirmed === true && !!String(profile.certificateName || profile.name || '').trim();
  }

  function isNameOnboarded(user = currentUser()) {
    if (!user) return false;
    return localStorage.getItem(onboardingKey(user)) === 'true' || stateHasConfirmedName();
  }

  function setNameOnboarded(user, value = true) {
    if (!user) return;
    if (value) localStorage.setItem(onboardingKey(user), 'true');
    else localStorage.removeItem(onboardingKey(user));
  }

  function currentDisplayName(user = currentUser()) {
    const stateName = readState()?.profile?.certificateName;
    return String(stateName || user?.displayName || '').replace(/\s+/g, ' ').trim();
  }

  function savePendingRoute(hash) {
    if (!hash || !isGatedHash(hash)) return;
    sessionStorage.setItem(PENDING_ROUTE_KEY, hash);
  }

  function pendingRoute() {
    return sessionStorage.getItem(PENDING_ROUTE_KEY) || '';
  }

  function clearPendingRoute() {
    sessionStorage.removeItem(PENDING_ROUTE_KEY);
  }

  function closeGate() {
    document.getElementById('cm-learning-gate')?.remove();
    gateOpen = false;
  }

  function openLearningGate(targetHash = '#/careers') {
    if (currentUser()) {
      if (!isNameOnboarded()) openNameOnboarding({ targetHash });
      return;
    }

    if (targetHash && isGatedHash(targetHash)) savePendingRoute(targetHash);
    if (gateOpen) return;
    gateOpen = true;

    const d = document.createElement('div');
    d.id = 'cm-learning-gate';
    d.className = 'modal-backdrop';
    d.innerHTML = `
      <div class="modal cm-learning-gate-modal" role="dialog" aria-modal="true" aria-labelledby="cm-learning-gate-title">
        <div class="cm-gate-icon">CM</div>
        <div class="eyebrow">FREE CAPITAL MASTERY ACCOUNT</div>
        <h2 id="cm-learning-gate-title">Sign in to save your progress and earn credentials.</h2>
        <p class="cm-gate-lead">Your account is how Capital Mastery knows which coursework and official assessment results belong to you. That lets us save your progress, sync it across devices, and issue verified credentials to the right learner.</p>
        <div class="cm-gate-benefits">
          <div><span>✓</span><p><strong>Save your progress</strong><br>Pick up where you left off instead of starting over.</p></div>
          <div><span>✓</span><p><strong>Take official assessments</strong><br>Secure scores are connected to your account.</p></div>
          <div><span>✓</span><p><strong>Earn verified credentials</strong><br>Credentials can only be issued when we know who completed the pathway.</p></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" type="button" data-cm-gate-continue>Create free account / Sign in →</button>
          <button class="btn btn-outline" type="button" data-cm-gate-close>Not now</button>
        </div>
        <p class="small muted" style="margin-top:14px">Capital Mastery is free. No payment information is required.</p>
      </div>`;

    document.body.appendChild(d);
    d.querySelector('[data-cm-gate-continue]')?.addEventListener('click', () => {
      closeGate();
      location.hash = '#/login';
    });
    d.querySelector('[data-cm-gate-close]')?.addEventListener('click', closeGate);
    d.addEventListener('click', event => {
      if (event.target === d) closeGate();
    });
  }

  function fullNameError(name) {
    const cleaned = String(name || '').replace(/\s+/g, ' ').trim();
    if (cleaned.length < 3) return 'Enter the full name you want printed on your credentials.';
    const pieces = cleaned.split(' ').filter(Boolean);
    if (pieces.length < 2) return 'Please enter at least your first and last name.';
    if (pieces.some(piece => !/[\p{L}]/u.test(piece))) return 'Please enter a valid first and last name.';
    return '';
  }

  function updateLocalProfileName(name) {
    try {
      const state = readState();
      if (!state) return;
      state.profile ||= {};
      state.profile.name = name;
      state.profile.certificateName = name;
      state.profile.certificateNameConfirmed = true;
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      window.CM_SYNC?.flush?.().catch(() => {});
    } catch (_) {}
  }

  async function saveFullName(rawName) {
    const cleaned = String(rawName || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const validationError = fullNameError(cleaned);
    if (validationError) throw new Error(validationError);

    const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
    const authApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);
    const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
    const auth = authApi.getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in first.');

    await authApi.updateProfile(user, { displayName: cleaned });
    await user.reload();
    await user.getIdToken(true);

    setNameOnboarded(user, true);
    updateLocalProfileName(cleaned);

    if (window.CM_AUTH) window.CM_AUTH.user = auth.currentUser;
    document.dispatchEvent(new CustomEvent('cm-certificate-name-changed', {
      detail: { user: auth.currentUser, displayName: cleaned }
    }));

    return cleaned;
  }

  function closeNameModal() {
    document.getElementById('cm-full-name-onboarding')?.remove();
    nameModalOpen = false;
  }

  function resumeAfterName() {
    const next = pendingRoute();
    clearPendingRoute();
    if (next && next !== '#/login') {
      location.hash = next;
      return;
    }
    if (routeRoot() === 'login') location.hash = '#/careers';
  }

  function openNameOnboarding({ forceEdit = false, targetHash = '' } = {}) {
    const user = currentUser();
    if (!user || nameModalOpen) return;
    if (targetHash && isGatedHash(targetHash)) savePendingRoute(targetHash);
    nameModalOpen = true;

    const suggested = currentDisplayName(user);
    const d = document.createElement('div');
    d.id = 'cm-full-name-onboarding';
    d.className = 'modal-backdrop';
    d.innerHTML = `
      <div class="modal cm-full-name-modal" role="dialog" aria-modal="true" aria-labelledby="cm-full-name-title">
        <div class="eyebrow">ONE LAST STEP</div>
        <h2 id="cm-full-name-title">What name should appear on your credentials?</h2>
        <p>Please enter your full first and last name. We use this as the display name on your Capital Mastery account and any credentials you earn.</p>
        <form id="cm-full-name-form">
          <label for="cm-full-name-input">Full first and last name</label>
          <input id="cm-full-name-input" name="fullName" type="text" maxlength="80" autocomplete="name" value="${esc(suggested)}" placeholder="First Last" required>
          <div class="cm-full-name-message" hidden></div>
          <button class="btn btn-primary btn-block" type="submit">${forceEdit ? 'Save name' : 'Save name & continue →'}</button>
        </form>
        ${forceEdit ? '<button class="cm-name-cancel" type="button" data-cm-name-cancel>Cancel</button>' : ''}
        <p class="small muted" style="margin-top:14px">Use the name you want printed publicly on your credentials. You can edit it later from your account. This is a display name, not independent identity verification.</p>
      </div>`;

    document.body.appendChild(d);
    const form = d.querySelector('#cm-full-name-form');
    const input = d.querySelector('#cm-full-name-input');
    const message = d.querySelector('.cm-full-name-message');
    const submit = form?.querySelector('button[type="submit"]');

    const showError = text => {
      message.hidden = false;
      message.textContent = text;
      message.className = 'cm-full-name-message bad';
    };

    form?.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        submit.disabled = true;
        submit.textContent = 'Saving…';
        await saveFullName(input.value);
        closeNameModal();
        enhanceAccountCard();
        if (!forceEdit) resumeAfterName();
      } catch (error) {
        showError(error.message || 'Could not save your credential name.');
      } finally {
        submit.disabled = false;
        submit.textContent = forceEdit ? 'Save name' : 'Save name & continue →';
      }
    });

    d.querySelector('[data-cm-name-cancel]')?.addEventListener('click', closeNameModal);
    setTimeout(() => {
      input?.focus();
      if (!suggested) input?.select();
    }, 50);
  }

  function enhanceCreateAccountForm() {
    const form = document.getElementById('cm-create-form');
    if (!form || form.dataset.cmNameFlowUpdated === 'true') return;
    form.dataset.cmNameFlowUpdated = 'true';

    const nameInput = form.querySelector('input[name="name"]');
    nameInput?.closest('label')?.remove();

    const note = document.createElement('div');
    note.className = 'cm-signup-name-note';
    note.innerHTML = '<strong>Next:</strong> after you create your account, we’ll ask for your full first and last name so we know exactly what to print on your credentials.';
    form.prepend(note);
  }

  function enhanceAccountCard() {
    enhanceCreateAccountForm();
    const user = currentUser();
    if (!user) return;
    const grid = document.querySelector('.cm-account-grid');
    if (!grid || grid.querySelector('[data-cm-certificate-name-row]')) return;

    const row = document.createElement('div');
    row.setAttribute('data-cm-certificate-name-row', 'true');
    row.innerHTML = `<span>Credential Name</span><strong>${esc(currentDisplayName(user) || 'Not set')}</strong><button type="button" class="cm-cert-name-link" data-cm-edit-certificate-name>Edit credential name</button>`;
    grid.appendChild(row);
    row.querySelector('[data-cm-edit-certificate-name]')?.addEventListener('click', () => openNameOnboarding({ forceEdit: true }));
  }

  function maybePromptForName(user) {
    if (!user) return;
    if (isNameOnboarded(user)) {
      enhanceAccountCard();
      return;
    }
    setTimeout(() => openNameOnboarding(), 180);
  }

  function enforceCurrentRoute() {
    if (!authReady() || routeGuardBusy) return;
    const hash = location.hash || '#/';
    if (!isGatedHash(hash)) return;

    if (!currentUser()) {
      routeGuardBusy = true;
      savePendingRoute(hash);
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
      routeGuardBusy = false;
      openLearningGate(hash);
      return;
    }

    if (!isNameOnboarded()) openNameOnboarding({ targetHash: hash });
  }

  function injectStyles() {
    if (document.getElementById('cm-account-gate-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-account-gate-styles';
    style.textContent = `
      .cm-learning-gate-modal,.cm-full-name-modal{max-width:620px}.cm-learning-gate-modal h2,.cm-full-name-modal h2{color:var(--navy);font-family:Georgia,"Times New Roman",serif;font-size:2rem;line-height:1.12;margin:8px 0 12px}.cm-gate-lead{font-size:1rem;line-height:1.6}.cm-gate-icon{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:grid;place-items:center;font-weight:900;letter-spacing:.04em;margin-bottom:14px}.cm-gate-benefits{display:grid;gap:10px;margin:20px 0}.cm-gate-benefits>div{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;padding:12px 13px;border:1px solid #e1e6eb;border-radius:12px;background:#f8fafb}.cm-gate-benefits>div>span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#e9f5ed;color:#245b43;font-weight:900}.cm-gate-benefits p{margin:0}.cm-full-name-modal form{display:grid;gap:10px;margin-top:18px}.cm-full-name-modal label{font-weight:800;color:var(--navy)}.cm-full-name-modal input{width:100%;border:1px solid #cbd2da;border-radius:11px;padding:13px 14px;font-size:1rem;outline:none}.cm-full-name-modal input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(185,138,67,.13)}.cm-full-name-message{padding:10px 12px;border-radius:10px}.cm-full-name-message.bad{background:#fff0f0;color:#8b3232}.cm-name-cancel{border:0;background:transparent;color:var(--navy-3);text-decoration:underline;cursor:pointer;margin-top:10px}.cm-cert-name-link{display:inline-block;margin-top:8px;border:0;background:transparent;padding:0;color:var(--navy-3);text-decoration:underline;cursor:pointer;font-size:.78rem;font-weight:750}.cm-signup-name-note{padding:11px 12px;border-radius:10px;background:#f4f7fa;border:1px solid #e1e6eb;color:#4e5b68;font-size:.86rem;line-height:1.45;margin-bottom:2px}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#/"]');
    if (!anchor) return;
    const targetHash = anchor.getAttribute('href') || '';
    if (!isGatedHash(targetHash)) return;

    if (!authReady()) return;

    if (!currentUser()) {
      event.preventDefault();
      event.stopPropagation();
      openLearningGate(targetHash);
      return;
    }

    if (!isNameOnboarded()) {
      event.preventDefault();
      event.stopPropagation();
      openNameOnboarding({ targetHash });
    }
  }, true);

  window.addEventListener('hashchange', () => setTimeout(enforceCurrentRoute, 0));

  document.addEventListener('cm-auth-changed', event => {
    const user = event.detail?.user || null;
    closeGate();
    if (user) maybePromptForName(user);
    setTimeout(enforceCurrentRoute, 50);
  });

  document.addEventListener('cm-certificate-name-changed', () => setTimeout(enhanceAccountCard, 50));

  const observer = new MutationObserver(() => {
    enhanceCreateAccountForm();
    enhanceAccountCard();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  injectStyles();
  enhanceCreateAccountForm();
  enhanceAccountCard();

  if (authReady()) {
    if (currentUser()) maybePromptForName(currentUser());
    setTimeout(enforceCurrentRoute, 50);
  }

  window.CM_CERT_NAME = {
    open: () => openNameOnboarding({ forceEdit: true }),
    get: () => currentDisplayName(),
    confirmed: () => !!currentUser() && isNameOnboarded(currentUser())
  };
})();
