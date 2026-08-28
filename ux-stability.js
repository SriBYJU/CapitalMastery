(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const STATEFUL_ROOTS = new Set(['career','learn','quiz','official-simulation','simulation','final','passport','credentials','credential','certificate','achievement','login']);

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function routeParts(hash=location.hash) {
    return String(hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function qaMode() {
    return localStorage.getItem(QA_KEY) === 'true';
  }

  function installStateTimestampGuard() {
    if (Storage.prototype.__cmUpdatedAtGuard) return;
    const previous = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, '__cmUpdatedAtGuard', { value: true, configurable: false });
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && key === STATE_KEY) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.version === 1) {
            parsed.updatedAt = new Date().toISOString();
            value = JSON.stringify(parsed);
          }
        } catch (_) {}
      }
      return previous.call(this, key, value);
    };
  }

  function profileLabel() {
    const user = window.CM_AUTH?.user;
    if (!user) return 'Sign in';
    const full = window.CM_CERT_NAME?.get?.() || user.displayName || user.email || 'Account';
    return String(full).trim().split(/\s+/)[0] || 'Account';
  }

  function profileInitial() {
    const label = profileLabel();
    return label && label !== 'Sign in' ? label.charAt(0).toUpperCase() : '👤';
  }

  function ensureProfileButton() {
    const nav = document.querySelector('.site-header .nav');
    if (!nav) return;
    let button = nav.querySelector('.cm-profile-button');
    if (!button) {
      button = document.createElement('a');
      button.className = 'cm-profile-button';
      button.href = '#/login';
      const mobileMenu = nav.querySelector('.mobile-menu');
      if (mobileMenu) nav.insertBefore(button, mobileMenu);
      else nav.appendChild(button);
    }
    const user = window.CM_AUTH?.user;
    const label = profileLabel();
    button.setAttribute('aria-label', user ? `Open profile for ${label}` : 'Sign in or create an account');
    button.title = user ? `Profile · ${label}` : 'Sign in / Create account';
    button.innerHTML = `<span class="cm-profile-avatar">${esc(profileInitial())}</span><span class="cm-profile-text">${esc(user ? label : 'Sign in')}</span>`;
    button.classList.toggle('signed-in', !!user);
  }

  function enhanceMobileMenu() {
    const modal = document.querySelector('#cm-modal .modal');
    if (!modal || modal.querySelector('[data-cm-profile-menu]')) return;
    const heading = modal.querySelector('h2');
    if (!heading || heading.textContent.trim().toLowerCase() !== 'menu') return;
    const grid = modal.querySelector('.grid');
    if (!grid) return;
    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = '#/login';
    a.setAttribute('data-cm-profile-menu','true');
    a.innerHTML = window.CM_AUTH?.user ? `👤 Profile & Account` : `👤 Sign in / Create account`;
    a.addEventListener('click', () => window.CM?.closeModal?.());
    grid.appendChild(a);
  }

  function enhanceAccountHub() {
    const [root] = routeParts();
    if (root !== 'login' || !window.CM_AUTH?.user) return;
    const card = document.querySelector('.cm-auth-card');
    if (!card || card.querySelector('.cm-profile-hub')) return;
    const hub = document.createElement('div');
    hub.className = 'cm-profile-hub';
    hub.innerHTML = `
      <div class="cm-profile-hub-head"><div><span>PROFILE HUB</span><strong>Your Capital Mastery account</strong></div><span class="cm-profile-live">● Live</span></div>
      <div class="cm-profile-hub-links">
        <a href="#/passport">My Learning</a>
        <a href="#/credentials">My Credentials</a>
        <a href="#/careers">Explore Careers</a>
      </div>`;
    card.appendChild(hub);
  }

  function redirectLegacySimulation() {
    const [root, pathway] = routeParts();
    if (root !== 'simulation' || !pathway || qaMode() || !window.CM_AUTH?.ready || !window.CM_AUTH?.user) return false;
    const target = `#/official-simulation/${encodeURIComponent(pathway)}`;
    if (location.hash !== target) {
      location.replace(target);
      return true;
    }
    return false;
  }

  function refreshFromBfcache(event) {
    if (!event.persisted) return;
    const [root] = routeParts();
    if (STATEFUL_ROOTS.has(root) && window.CM_AUTH?.user) location.reload();
  }

  function enhance() {
    if (redirectLegacySimulation()) return;
    ensureProfileButton();
    enhanceMobileMenu();
    enhanceAccountHub();
  }

  installStateTimestampGuard();

  window.addEventListener('pageshow', refreshFromBfcache);
  window.addEventListener('hashchange', () => setTimeout(enhance, 25));
  document.addEventListener('cm-auth-changed', () => setTimeout(enhance, 40));
  document.addEventListener('cm-certificate-name-changed', () => setTimeout(enhance, 40));
  window.addEventListener('online', () => {
    window.CM_SYNC?.flush?.().catch(() => {});
    setTimeout(enhance, 30);
  });

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.id = 'cm-ux-stability-styles';
  style.textContent = `
    .cm-profile-button{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border:1px solid #c8d0d9;background:#fff;color:var(--navy);border-radius:11px;min-height:40px;padding:5px 10px;font-size:.86rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 14px rgba(7,26,51,.05)}
    .cm-profile-button:hover{border-color:var(--gold);transform:translateY(-1px)}
    .cm-profile-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-size:.78rem;font-weight:900;line-height:1}
    .cm-profile-button.signed-in .cm-profile-avatar{background:linear-gradient(135deg,var(--navy-2),var(--navy-3));border:1px solid rgba(185,138,67,.55)}
    .cm-profile-hub{margin-top:20px;padding:15px;border:1px solid #e0e5ea;border-radius:13px;background:#f8fafb}
    .cm-profile-hub-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.cm-profile-hub-head span:first-child{display:block;font-size:.68rem;letter-spacing:.12em;color:var(--gold);font-weight:900}.cm-profile-hub-head strong{display:block;color:var(--navy);margin-top:2px}.cm-profile-live{font-size:.75rem;color:#2e7456!important;letter-spacing:0!important}
    .cm-profile-hub-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cm-profile-hub-links a{background:#fff;border:1px solid #dbe1e6;border-radius:9px;padding:8px 10px;text-decoration:none;color:var(--navy);font-size:.8rem;font-weight:800}
    @media(max-width:980px){.cm-profile-button{margin-left:auto}.mobile-menu{margin-left:0!important}.cm-profile-text{display:none}.cm-profile-button{padding:5px;border-radius:50%;width:42px;height:42px;justify-content:center}.cm-profile-avatar{width:30px;height:30px}}
    @media(max-width:680px){.cm-profile-button{display:inline-flex!important;flex:0 0 40px;width:40px;height:40px;min-height:40px}.cm-profile-avatar{width:29px;height:29px}.cm-profile-hub-links{display:grid}.cm-profile-hub-links a{text-align:center}}
    @media print{.cm-profile-button{display:none!important}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  enhance();
})();
