(() => {
  'use strict';

  const SDK = '12.18.0';
  const CONFIRM_PREFIX = 'cmCertificateNameConfirmedV1:';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  let modalOpen = false;

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function currentUser() {
    return window.CM_AUTH?.user || null;
  }

  function currentName(user = currentUser()) {
    if (!user) return '';
    return String(user.displayName || user.email?.split('@')[0] || '').trim();
  }

  function confirmKey(user) {
    return `${CONFIRM_PREFIX}${user.uid}`;
  }

  function isConfirmed(user) {
    return localStorage.getItem(confirmKey(user)) === 'true';
  }

  function setConfirmed(user, value = true) {
    if (value) localStorage.setItem(confirmKey(user), 'true');
    else localStorage.removeItem(confirmKey(user));
  }

  function updateLocalProfileName(name) {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!state || state.version !== 1) return;
      state.profile ||= {};
      state.profile.name = name;
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      window.CM_SYNC?.flush?.().catch(() => {});
    } catch (_) {}
  }

  async function saveDisplayName(name) {
    const cleaned = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (cleaned.length < 2) throw new Error('Enter the name you want printed on your certificates.');

    const appApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
    const authApi = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);
    const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(window.CAPITAL_MASTERY_FIREBASE_CONFIG);
    const auth = authApi.getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in first.');

    await authApi.updateProfile(user, { displayName: cleaned });
    await user.reload();
    await user.getIdToken(true);
    setConfirmed(user, true);
    updateLocalProfileName(cleaned);

    if (window.CM_AUTH) window.CM_AUTH.user = auth.currentUser;
    document.dispatchEvent(new CustomEvent('cm-certificate-name-changed', {
      detail: { user: auth.currentUser, displayName: cleaned }
    }));

    return cleaned;
  }

  function closeModal() {
    document.getElementById('cm-certificate-name-modal')?.remove();
    modalOpen = false;
  }

  function openNameModal({ forceEdit = false } = {}) {
    const user = currentUser();
    if (!user || modalOpen) return;
    modalOpen = true;

    const name = currentName(user);
    const backdrop = document.createElement('div');
    backdrop.id = 'cm-certificate-name-modal';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal cm-cert-name-modal" role="dialog" aria-modal="true" aria-labelledby="cm-cert-name-title">
        <div class="eyebrow">CERTIFICATE NAME</div>
        <h2 id="cm-cert-name-title">Is this the name you'd like on your certificates?</h2>
        <p>Your Capital Mastery credentials will use this display name.</p>
        <div class="cm-cert-name-preview">${esc(name || 'No name set')}</div>
        <div class="cm-cert-name-edit" ${forceEdit ? '' : 'hidden'}>
          <label for="cm-cert-name-input">Name on certificate</label>
          <input id="cm-cert-name-input" type="text" maxlength="80" autocomplete="name" value="${esc(name)}" placeholder="Your name">
        </div>
        <div class="cm-cert-name-message" hidden></div>
        <div class="modal-actions cm-cert-name-actions">
          ${forceEdit ? '' : '<button class="btn btn-gold" type="button" data-cert-name-confirm>Yes, use this name</button>'}
          <button class="btn btn-outline" type="button" data-cert-name-edit>${forceEdit ? 'Cancel' : 'Edit name'}</button>
          <button class="btn btn-primary" type="button" data-cert-name-save ${forceEdit ? '' : 'hidden'}>Save name</button>
        </div>
        <p class="small muted" style="margin-top:14px">This is the display name shown on Capital Mastery credentials. It is not independent identity verification.</p>
      </div>`;

    document.body.appendChild(backdrop);
    const editBox = backdrop.querySelector('.cm-cert-name-edit');
    const preview = backdrop.querySelector('.cm-cert-name-preview');
    const input = backdrop.querySelector('#cm-cert-name-input');
    const editButton = backdrop.querySelector('[data-cert-name-edit]');
    const saveButton = backdrop.querySelector('[data-cert-name-save]');
    const confirmButton = backdrop.querySelector('[data-cert-name-confirm]');
    const message = backdrop.querySelector('.cm-cert-name-message');

    const showError = text => {
      message.hidden = false;
      message.textContent = text;
      message.className = 'cm-cert-name-message bad';
    };

    confirmButton?.addEventListener('click', async () => {
      try {
        confirmButton.disabled = true;
        if (!name) {
          editBox.hidden = false;
          preview.hidden = true;
          saveButton.hidden = false;
          editButton.textContent = 'Cancel';
          input.focus();
          return;
        }
        await saveDisplayName(name);
        closeModal();
        enhanceAccountCard();
      } catch (error) {
        showError(error.message || 'Could not save certificate name.');
      } finally {
        confirmButton.disabled = false;
      }
    });

    editButton?.addEventListener('click', () => {
      if (forceEdit || !editBox.hidden) {
        closeModal();
        return;
      }
      editBox.hidden = false;
      preview.hidden = true;
      saveButton.hidden = false;
      editButton.textContent = 'Cancel';
      input.focus();
      input.select();
    });

    saveButton?.addEventListener('click', async () => {
      try {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        const saved = await saveDisplayName(input.value);
        preview.textContent = saved;
        closeModal();
        enhanceAccountCard();
      } catch (error) {
        showError(error.message || 'Could not save certificate name.');
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save name';
      }
    });

    backdrop.addEventListener('click', event => {
      if (event.target === backdrop && isConfirmed(user)) closeModal();
    });
  }

  function enhanceAccountCard() {
    const user = currentUser();
    if (!user) return;
    const grid = document.querySelector('.cm-account-grid');
    if (!grid || grid.querySelector('[data-cm-certificate-name-row]')) return;

    const row = document.createElement('div');
    row.setAttribute('data-cm-certificate-name-row', 'true');
    row.innerHTML = `<span>Certificate Name</span><strong>${esc(currentName(user) || 'Not set')}</strong><button type="button" class="cm-cert-name-link" data-cm-edit-certificate-name>Edit certificate name</button>`;
    grid.appendChild(row);
    row.querySelector('[data-cm-edit-certificate-name]')?.addEventListener('click', () => openNameModal({ forceEdit: true }));
  }

  function maybePrompt(user) {
    if (!user || isConfirmed(user)) {
      enhanceAccountCard();
      return;
    }
    setTimeout(() => openNameModal(), 250);
  }

  function injectStyles() {
    if (document.getElementById('cm-certificate-name-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-certificate-name-styles';
    style.textContent = `
      .cm-cert-name-modal{max-width:600px}.cm-cert-name-modal h2{color:var(--navy);font-family:Georgia,"Times New Roman",serif;font-size:2rem;margin:8px 0 10px}.cm-cert-name-preview{margin:18px 0;padding:18px;border:1px solid #d7dde3;background:#f7f8fa;border-radius:12px;color:var(--navy);font:700 1.45rem Georgia,"Times New Roman",serif}.cm-cert-name-edit{display:grid;gap:7px;margin:18px 0}.cm-cert-name-edit[hidden]{display:none}.cm-cert-name-edit label{font-weight:800;color:var(--navy)}.cm-cert-name-edit input{width:100%;border:1px solid #cbd2da;border-radius:10px;padding:12px 13px;font-size:1rem}.cm-cert-name-message{padding:10px 12px;border-radius:10px;margin:10px 0}.cm-cert-name-message.bad{background:#fff0f0;color:#8b3232}.cm-cert-name-link{display:inline-block;margin-top:8px;border:0;background:transparent;padding:0;color:var(--navy-3);text-decoration:underline;cursor:pointer;font-size:.78rem;font-weight:750}.cm-cert-name-actions{display:flex;gap:9px;flex-wrap:wrap}.cm-cert-name-actions [hidden]{display:none}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('cm-auth-changed', event => {
    const user = event.detail?.user || null;
    if (user) maybePrompt(user);
  });

  document.addEventListener('cm-certificate-name-changed', () => setTimeout(enhanceAccountCard, 50));

  const observer = new MutationObserver(() => enhanceAccountCard());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  injectStyles();
  if (window.CM_AUTH?.ready && window.CM_AUTH.user) maybePrompt(window.CM_AUTH.user);

  window.CM_CERT_NAME = {
    open: () => openNameModal({ forceEdit: true }),
    get: () => currentName(),
    confirmed: () => !!currentUser() && isConfirmed(currentUser())
  };
})();
