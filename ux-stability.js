(() => {
  'use strict';

  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const LAST_ACTIVITY_KEY = 'cmLastLearningActivityV1';
  const STATEFUL_ROOTS = new Set(['career','learn','quiz','official-simulation','simulation','final','passport','credentials','credential','certificate','achievement','login']);
  const RESUMABLE_ROOTS = new Set(['career','learn','quiz','official-simulation','final','assigned','role-lab','assessment-lab','skills']);
  let credentialRepairTimer = null;
  let credentialRepairCount = 0;
  let enhanceScheduled = false;
  let confidenceTimer = null;

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  }

  function routeParts(hash=location.hash) {
    return String(hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function qaMode() {
    return window.CM_AUTH?.ready === true &&
      window.CM_AUTH?.isAdmin === true &&
      localStorage.getItem(QA_KEY) === 'true';
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
      const result = previous.call(this, key, value);
      if (this === localStorage && key === STATE_KEY) {
        queueMicrotask(() => document.dispatchEvent(new CustomEvent('cm-local-progress-saved')));
      }
      return result;
    };
  }

  function readLastActivity() {
    try {
      const value = JSON.parse(localStorage.getItem(LAST_ACTIVITY_KEY) || 'null');
      if (!value || typeof value.hash !== 'string' || !value.hash.startsWith('#/')) return null;
      if (!RESUMABLE_ROOTS.has(routeParts(value.hash)[0])) return null;
      return value;
    } catch (_) { return null; }
  }

  function recordLastActivity() {
    if (!window.CM_AUTH?.user) return;
    const [root] = routeParts();
    if (!RESUMABLE_ROOTS.has(root)) return;
    const heading = String(document.querySelector('main#main h1')?.textContent || '').replace(/\s+/g,' ').trim();
    localStorage.setItem(LAST_ACTIVITY_KEY, JSON.stringify({
      hash:location.hash || '#/',
      label:(heading || 'your last activity').slice(0,80),
      updatedAt:new Date().toISOString()
    }));
  }

  function dock() {
    let node = document.getElementById('cm-experience-dock');
    if (node) return node;
    node = document.createElement('aside');
    node.id = 'cm-experience-dock';
    node.className = 'cm-experience-dock';
    node.setAttribute('aria-label','Learning assistance');
    node.innerHTML = `
      <div class="cm-save-confidence" role="status" aria-live="polite" hidden><span></span><b></b></div>
      <a class="cm-resume-activity" href="#/" hidden><span>RESUME</span><b>Last activity</b></a>
      <button type="button" class="cm-context-help" aria-label="Open help for this page"><span aria-hidden="true">?</span><b>Help</b></button>`;
    node.querySelector('.cm-context-help')?.addEventListener('click', () => {
      const guide = document.querySelector('.cm-wb-guide');
      if (guide) {
        guide.open = true;
        guide.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
        guide.querySelector('summary')?.focus();
        return;
      }
      const [root,orgId] = routeParts();
      location.hash = root === 'employer' && orgId
        ? `#/employer/${encodeURIComponent(orgId)}/guide`
        : '#/learner-guide';
    });
    document.body.appendChild(node);
    return node;
  }

  function updateResumeActivity() {
    const link = dock().querySelector('.cm-resume-activity');
    const currentRoot = routeParts()[0];
    const item = readLastActivity();
    const show = !!window.CM_AUTH?.user && !!item && !RESUMABLE_ROOTS.has(currentRoot) && currentRoot !== 'certificate';
    link.hidden = !show;
    if (!show) return;
    link.href = item.hash;
    link.querySelector('b').textContent = item.label === 'your last activity' ? 'Last activity' : item.label;
    link.setAttribute('aria-label',`Resume ${item.label}`);
  }

  function showSaveConfidence(label, tone = 'saved', persist = false) {
    const node = dock().querySelector('.cm-save-confidence');
    clearTimeout(confidenceTimer);
    node.hidden = false;
    node.dataset.tone = tone;
    node.querySelector('span').textContent = tone === 'attention' ? '!' : tone === 'working' ? '↻' : '✓';
    node.querySelector('b').textContent = label;
    if (!persist) confidenceTimer = setTimeout(() => { node.hidden = true; }, 3600);
  }

  function updateSyncConfidence(status = window.CM_SYNC?.status || '') {
    if (!window.CM_AUTH?.user) return;
    if (!navigator.onLine) return showSaveConfidence('Offline · drafts stay on this device','attention',true);
    if (status === 'syncing' || status === 'loading' || status === 'starting') return showSaveConfidence('Syncing your progress…','working',true);
    if (status === 'error') return showSaveConfidence('Saved here · account sync will retry','attention',true);
    if (status === 'synced') return showSaveConfidence('Progress saved to your account');
    if (status === 'ready') return showSaveConfidence('Account sync ready');
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
    const signature = `${user?.uid || 'signed-out'}|${label}|${user ? '1' : '0'}`;

    // Critical performance guard: assigning innerHTML on every MutationObserver
    // callback creates another mutation and can lock the page in a render loop.
    if (button.dataset.cmProfileSignature === signature) return;

    button.dataset.cmProfileSignature = signature;
    button.setAttribute('aria-label', user ? `Open profile for ${label}` : 'Sign in or create an account');
    button.title = user ? `Profile · ${label}` : 'Sign in / Create account';
    button.innerHTML = `<span class="cm-profile-avatar">${esc(profileInitial())}</span><span class="cm-profile-text">${esc(user ? label : 'Sign in')}</span>`;
    button.classList.toggle('signed-in', !!user);
  }

  function enhanceMobileMenu() {
    const modal = document.querySelector('#cm-modal .modal');
    if (!modal) return;
    const heading = modal.querySelector('h2');
    if (!heading || heading.textContent.trim().toLowerCase() !== 'menu') return;
    const grid = modal.querySelector('.grid');
    if (!grid) return;

    const label = window.CM_AUTH?.user ? '👤 Profile & Account' : '👤 Sign in / Create account';
    const legacy = grid.querySelector('[data-cm-e2e-account-link]');
    const owned = [...grid.querySelectorAll('[data-cm-profile-menu]')].find(node => !node.hasAttribute('data-cm-e2e-account-link'));

    // capital-mastery-e2e.js may create a compatibility account entry. Adopt it
    // instead of deleting it; deleting it caused the other observer to recreate it
    // forever on mobile. If both briefly exist, keep the compatibility node and
    // remove only our duplicate so the DOM settles after one pass.
    if (legacy) {
      if (owned) owned.remove();
      legacy.setAttribute('data-cm-profile-menu', 'true');
      if (legacy.className !== 'btn btn-primary') legacy.className = 'btn btn-primary';
      if (legacy.textContent !== label) legacy.textContent = label;
      return;
    }

    if (owned) {
      if (owned.textContent !== label) owned.textContent = label;
      return;
    }

    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = '#/login';
    a.setAttribute('data-cm-profile-menu','true');
    a.textContent = label;
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

    // A restored bfcache document already has every local asset needed to render.
    // Hard-reloading here used to make Back/Forward dependent on the network and
    // could replace the working app with a browser error page if connectivity
    // changed at the same moment. Re-run the route listeners instead: app.js and
    // the authoritative/runtime layers reconcile the current hash without losing
    // the loaded shell, while sync is attempted opportunistically when available.
    if (STATEFUL_ROOTS.has(root) && window.CM_AUTH?.user) {
      window.CM_SYNC?.flush?.().catch(() => {});
      setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 0);
    }
    scheduleEnhance(20);
  }

  function repairCredentialRendererRace() {
    const [root] = routeParts();
    if (root !== 'credentials') {
      credentialRepairCount = 0;
      clearTimeout(credentialRepairTimer);
      credentialRepairTimer = null;
      return;
    }

    const main = document.querySelector('main#main');
    if (!main || main.querySelector('.cm-live-credential') || main.querySelector('.credentials-hero')) {
      credentialRepairCount = 0;
      clearTimeout(credentialRepairTimer);
      credentialRepairTimer = null;
      return;
    }

    const basicRendererVisible = !!main.querySelector('.cm-credential-card') ||
      [...main.querySelectorAll('.page-hero .eyebrow')].some(x => x.textContent.includes('VERIFIED CREDENTIALS'));
    if (!basicRendererVisible || credentialRepairCount >= 3 || credentialRepairTimer) return;

    credentialRepairTimer = setTimeout(() => {
      credentialRepairTimer = null;
      const currentMain = document.querySelector('main#main');
      if (routeParts()[0] !== 'credentials' || currentMain?.querySelector('.cm-live-credential') || currentMain?.querySelector('.credentials-hero')) return;
      credentialRepairCount++;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, 160);
  }

  function enhance() {
    if (redirectLegacySimulation()) return;
    ensureProfileButton();
    enhanceMobileMenu();
    enhanceAccountHub();
    repairCredentialRendererRace();
    dock();
    recordLastActivity();
    updateResumeActivity();
  }

  function scheduleEnhance(delay = 0) {
    if (delay > 0) {
      setTimeout(scheduleEnhance, delay);
      return;
    }
    if (enhanceScheduled) return;
    enhanceScheduled = true;
    requestAnimationFrame(() => {
      enhanceScheduled = false;
      enhance();
    });
  }

  installStateTimestampGuard();

  window.addEventListener('pageshow', refreshFromBfcache);
  window.addEventListener('hashchange', () => scheduleEnhance(25));
  document.addEventListener('cm-auth-changed', () => scheduleEnhance(40));
  document.addEventListener('cm-certificate-name-changed', () => scheduleEnhance(40));
  document.addEventListener('cm-local-progress-saved', () => {
    if (window.CM_AUTH?.user) showSaveConfidence('Saved on this device','saved');
  });
  document.addEventListener('cm-sync-changed', event => updateSyncConfidence(event.detail?.status));
  window.addEventListener('offline', () => {
    if (window.CM_AUTH?.user) showSaveConfidence('Offline · drafts stay on this device','attention',true);
  });
  window.addEventListener('online', () => {
    if (window.CM_AUTH?.user) showSaveConfidence('Back online · syncing…','working',true);
    window.CM_SYNC?.flush?.().catch(() => {});
    scheduleEnhance(30);
  });

  // Observe app renders, but collapse a burst of mutations into one animation-frame
  // pass. Combined with idempotent DOM writes above, this avoids runaway CPU use.
  const observer = new MutationObserver(() => scheduleEnhance());
  observer.observe(document.getElementById('app') || document.documentElement, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.id = 'cm-ux-stability-styles';
  style.textContent = `
    .cm-profile-button{display:none;align-items:center;gap:8px;text-decoration:none;border:1px solid #c8d0d9;background:#fff;color:var(--navy);border-radius:11px;min-height:40px;padding:5px 10px;font-size:.86rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 14px rgba(7,26,51,.05)}
    .cm-profile-button:hover{border-color:var(--gold);transform:translateY(-1px)}
    .cm-profile-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--navy);color:#fff;font-size:.78rem;font-weight:900;line-height:1}
    .cm-profile-button.signed-in .cm-profile-avatar{background:linear-gradient(135deg,var(--navy-2),var(--navy-3));border:1px solid rgba(185,138,67,.55)}
    .cm-profile-hub{margin-top:20px;padding:15px;border:1px solid #e0e5ea;border-radius:13px;background:#f8fafb}
    .cm-profile-hub-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.cm-profile-hub-head span:first-child{display:block;font-size:.68rem;letter-spacing:.12em;color:var(--gold);font-weight:900}.cm-profile-hub-head strong{display:block;color:var(--navy);margin-top:2px}.cm-profile-live{font-size:.75rem;color:#2e7456!important;letter-spacing:0!important}
    .cm-profile-hub-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cm-profile-hub-links a{background:#fff;border:1px solid #dbe1e6;border-radius:9px;padding:8px 10px;text-decoration:none;color:var(--navy);font-size:.8rem;font-weight:800}
    .cm-experience-dock{position:fixed;right:16px;bottom:16px;z-index:850;display:flex;align-items:stretch;gap:8px;max-width:min(560px,calc(100vw - 32px));pointer-events:none}.cm-experience-dock>*{pointer-events:auto;box-shadow:0 9px 28px rgba(7,26,51,.16)}
    .cm-save-confidence,.cm-resume-activity,.cm-context-help{border:1px solid #cbd5df;border-radius:12px;background:#fff;color:#172d43;min-height:46px}.cm-save-confidence{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:.78rem}.cm-save-confidence[hidden]{display:none}.cm-save-confidence span{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#e4f2e9;color:#265c43;font-weight:900}.cm-save-confidence[data-tone="working"] span{background:#edf2f7;color:#315675}.cm-save-confidence[data-tone="attention"]{border-color:#dcc58c;background:#fffaf0}.cm-save-confidence[data-tone="attention"] span{background:#f5e8c6;color:#725721}
    .cm-resume-activity{display:grid;grid-template-columns:auto minmax(0,180px);column-gap:8px;align-items:center;padding:7px 12px;text-decoration:none}.cm-resume-activity[hidden]{display:none}.cm-resume-activity span{grid-row:1/3;color:#866625;font-size:.58rem;letter-spacing:.1em;font-weight:900}.cm-resume-activity b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.76rem;color:#172d43}.cm-resume-activity:hover{border-color:var(--gold);transform:translateY(-1px)}
    .cm-context-help{display:flex;align-items:center;gap:7px;padding:7px 11px;font:inherit;cursor:pointer}.cm-context-help span{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#071a33;color:#fff;font-weight:900}.cm-context-help b{font-size:.77rem}.cm-context-help:hover,.cm-context-help:focus-visible{border-color:var(--gold);outline:2px solid rgba(185,138,67,.35);outline-offset:2px}
    @media(max-width:980px){.nav-actions .cm-e2e-profile-nav{display:none!important}.cm-profile-button{display:inline-flex;margin-left:auto}.mobile-menu{margin-left:0!important}.cm-profile-text{display:none}.cm-profile-button{padding:5px;border-radius:50%;width:42px;height:42px;justify-content:center}.cm-profile-avatar{width:30px;height:30px}}
    @media(max-width:680px){.cm-profile-button{display:inline-flex!important;flex:0 0 40px;width:40px;height:40px;min-height:40px}.cm-profile-avatar{width:29px;height:29px}.cm-profile-hub-links{display:grid}.cm-profile-hub-links a{text-align:center}.cm-experience-dock{right:10px;bottom:10px;max-width:calc(100vw - 20px)}.cm-save-confidence{max-width:210px}.cm-resume-activity{display:none!important}.cm-context-help b{display:none}.cm-context-help{padding:7px}}
    @media print{.cm-profile-button,.cm-experience-dock{display:none!important}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  scheduleEnhance();
})();
