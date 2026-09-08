(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  const ADMIN_ROUTE = '#/admin-preview';
  const LEGACY_ADMIN_ROUTE = '#/admin-preview/employer-usage';
  const ADMIN_VIEW_PARAM = 'adminView';
  const ADMIN_VIEW = 'employer-usage';
  let renderSerial = 0;
  let observerQueued = false;
  let usageLoading = false;

  function esc(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function rootRoute() {
    return String(location.hash || '#/').replace(/^#\/?/, '').split(/[/?]/, 1)[0] || '';
  }

  function adminUsageRoute(hash = location.hash) {
    const normalized = String(hash || '#/').split('?', 1)[0].replace(/\/$/, '');
    return normalized === ADMIN_ROUTE && new URLSearchParams(location.search).get(ADMIN_VIEW_PARAM) === ADMIN_VIEW;
  }

  function legacyAdminUsageRoute(hash = location.hash) {
    const raw = String(hash || '#/');
    if (raw.split('?', 1)[0].replace(/\/$/, '') === LEGACY_ADMIN_ROUTE) return true;
    const [route, query=''] = raw.split('?');
    return route.replace(/\/$/, '') === ADMIN_ROUTE && new URLSearchParams(query).get('view') === ADMIN_VIEW;
  }

  function setAdminUsageView(active, { replace = false } = {}) {
    const url = new URL(location.href);
    if (active) url.searchParams.set(ADMIN_VIEW_PARAM, ADMIN_VIEW);
    else url.searchParams.delete(ADMIN_VIEW_PARAM);
    url.hash = ADMIN_ROUTE;
    const next = `${url.pathname}${url.search}${url.hash}`;
    history[replace ? 'replaceState' : 'pushState']({ cmAdminView: active ? ADMIN_VIEW : null }, '', next);
    syncRoute();
  }
  function main() {
    return document.querySelector('#app main#main');
  }

  function verifiedAdmin() {
    const auth = window.CM_AUTH;
    return auth?.ready === true && auth?.backendVerified === true && auth?.isAdmin === true;
  }

  function fmtDate(value, withTime = false) {
    if (!value) return '—';
    let normalized = String(value);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) normalized = normalized.replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-US', withTime
      ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
    ).format(date);
  }

  function officialPlatformSection(context = 'home') {
    const section = document.createElement('section');
    section.className = `cm-official-platform-proof cm-official-platform-proof-${context}`;
    section.dataset.cmOfficialPlatformProof = context;
    section.setAttribute('aria-label', 'Firms using Capital Mastery for onboarding and training');
    section.innerHTML = `
      <div class="container cm-official-platform-multi">
        <div class="cm-official-platform-copy">
          <div class="eyebrow">OFFICIAL ONBOARDING ADOPTION</div>
          <h2>Capital Mastery is the official onboarding training platform for the following firms:</h2>
          <p>Capital Mastery gives finance teams a structured pre-Day-1 layer for role training, realistic work, evidence-backed readiness, and cohort administration. This section is designed to grow as additional firms adopt the platform.</p>
        </div>
        <div class="cm-official-firms-grid" aria-label="Official onboarding firms">
          <article class="cm-official-firm-card" data-cm-firm-card="sterling-point-advisors">
            <div class="cm-official-firm-logo"><img src="assets/sterling-point-logo.svg" alt="Sterling Point Advisors" loading="lazy" /></div>
            <div class="cm-official-firm-meta">
              <span class="cm-official-firm-location">Richmond, Virginia · Mergers &amp; Acquisitions</span>
              <h3>Sterling Point Advisors</h3>
              <p>A specialized M&amp;A advisory firm serving closely held businesses. Its principals bring decades of transaction experience across industries, including work representing billions of dollars in aggregate deal value.</p>
            </div>
          </article>
        </div>
        <p class="cm-official-platform-note">Firm names and logos are displayed with permission in connection with onboarding/training use. Inclusion does not imply sponsorship, investment-services endorsement, exclusivity, or that these are the only firms Capital Mastery can support.</p>
      </div>`;
    return section;
  }
  function decoratePublicProof() {
    const root = rootRoute();
    if (root !== '' && root !== 'employers') return;
    const pageMain = main();
    if (!pageMain) return;
    if (pageMain.querySelector('[data-cm-official-platform-proof]')) return;

    const context = root === 'employers' ? 'employers' : 'home';
    const section = officialPlatformSection(context);
    const firstSection = pageMain.querySelector(':scope > section');
    if (firstSection?.nextSibling) pageMain.insertBefore(section, firstSection.nextSibling);
    else pageMain.appendChild(section);
  }

  function decorateAdminCard() {
    const normalized = String(location.hash || '#/').split('?', 1)[0].replace(/\/$/, '');
    if (normalized !== ADMIN_ROUTE) return;
    if (adminUsageRoute()) return;
    if (!verifiedAdmin()) return;
    const grid = document.querySelector('.admin-grid');
    if (!grid || grid.querySelector('[data-cm-employer-usage-card]')) return;

    const card = document.createElement('div');
    card.className = 'admin-card';
    card.dataset.cmEmployerUsageCard = 'true';
    card.innerHTML = `
      <div class="eyebrow">PLATFORM ADMIN</div>
      <h3>Employer Usage</h3>
      <p>View aggregate real-employer workspace usage across Capital Mastery. Demo/Test Lab organizations and learner identity details are excluded.</p>
      <button class="btn btn-primary btn-sm" type="button" data-cm-open-employer-usage>Open Employer Usage →</button>`;
    card.querySelector('[data-cm-open-employer-usage]')?.addEventListener('click', () => setAdminUsageView(true));
    grid.prepend(card);
  }
  function renderShell(inner) {
    const pageMain = main();
    if (!pageMain) return false;
    pageMain.innerHTML = `<section class="cm-founder-admin-page"><div class="container">${inner}</div></section>`;
    pageMain.querySelectorAll('[data-cm-founder-admin-back]').forEach((control) => {
      control.addEventListener('click', () => setAdminUsageView(false));
    });
    return true;
  }
  function renderLoading() {
    renderShell(`
      <button class="cm-founder-admin-back" type="button" data-cm-founder-admin-back>← Admin / QA</button>
      <div class="cm-founder-admin-head">
        <div><div class="eyebrow">PLATFORM ADMIN · AGGREGATE ONLY</div><h1>Employer Usage</h1><p>Loading real employer workspaces. Synthetic Demo/Test Lab data is excluded.</p></div>
      </div>
      <div class="card cm-founder-admin-loading" role="status" aria-live="polite"><span class="cm-founder-spinner" aria-hidden="true"></span><span>Loading secure aggregate usage…</span></div>`);
  }

  function renderDenied(message = 'This page is available only to the platform administrator.') {
    renderShell(`
      <a class="cm-founder-admin-back" href="#/">← Capital Mastery</a>
      <div class="card cm-founder-admin-denied">
        <div class="eyebrow">ACCESS DENIED</div>
        <h1>Employer Usage is protected.</h1>
        <p>${esc(message)}</p>
        <a class="btn btn-primary" href="#/login?admin=gate">Sign in with the platform-admin account →</a>
      </div>`);
  }

  function metric(label, value, note) {
    return `<article class="card cm-founder-metric"><span>${esc(label)}</span><strong>${Number(value || 0).toLocaleString()}</strong><small>${esc(note)}</small></article>`;
  }

  function statusBadge(status) {
    const label = String(status || 'active').replace(/_/g, ' ');
    return `<span class="cm-founder-status cm-founder-status-${esc(String(status || 'active'))}">${esc(label)}</span>`;
  }

  function renderUsage(data) {
    const totals = data?.totals || {};
    const organizations = Array.isArray(data?.organizations) ? data.organizations : [];
    const rows = organizations.map((org) => `
      <tr>
        <th scope="row"><span class="cm-founder-org-name">${esc(org.name)}</span><small>${esc(org.id)}</small></th>
        <td>${statusBadge(org.status)}</td>
        <td>${esc(fmtDate(org.createdAt))}</td>
        <td data-num>${Number(org.staffCount || 0).toLocaleString()}</td>
        <td data-num>${Number(org.learnerCount || 0).toLocaleString()}</td>
        <td data-num>${Number(org.cohortCount || 0).toLocaleString()}</td>
        <td data-num>${Number(org.assignmentCount || 0).toLocaleString()}</td>
        <td data-num>${Number(org.publishedAssignmentCount || 0).toLocaleString()}</td>
        <td>${esc(fmtDate(org.lastActivity, true))}</td>
      </tr>`).join('');

    renderShell(`
      <button class="cm-founder-admin-back" type="button" data-cm-founder-admin-back>← Admin / QA</button>
      <div class="cm-founder-admin-head">
        <div>
          <div class="eyebrow">PLATFORM ADMIN · AGGREGATE ONLY</div>
          <h1>Employer Usage</h1>
          <p>Real employer workspaces across Capital Mastery. Demo/Test Lab organizations are excluded, and this view does not expose learner names, emails, answers, or submissions.</p>
        </div>
        <button class="btn btn-outline" type="button" data-cm-refresh-employer-usage>Refresh</button>
      </div>
      <div class="cm-founder-metric-grid" aria-label="Employer usage summary">
        ${metric('Real Employers', totals.realEmployers, 'Non-demo workspaces')}
        ${metric('Total Learners', totals.learners, 'Unique active/completed cohort learners')}
        ${metric('Total Cohorts', totals.cohorts, 'Non-archived cohorts')}
        ${metric('Total Assignments', totals.assignments, `${Number(totals.publishedAssignments || 0).toLocaleString()} currently published`)}
      </div>
      <section class="card cm-founder-table-card" aria-labelledby="cm-founder-org-table-title">
        <div class="cm-founder-table-head">
          <div><div class="eyebrow">ORGANIZATIONS</div><h2 id="cm-founder-org-table-title">Real employer workspaces</h2></div>
          <span>${organizations.length.toLocaleString()} organization${organizations.length === 1 ? '' : 's'}</span>
        </div>
        ${organizations.length ? `
          <div class="cm-founder-table-wrap" tabindex="0" aria-label="Scrollable employer usage table">
            <table class="cm-founder-table">
              <caption class="sr-only">Aggregate employer workspace usage. No learner identity data is shown.</caption>
              <thead><tr><th scope="col">Organization</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Staff</th><th scope="col">Learners</th><th scope="col">Cohorts</th><th scope="col">Assignments</th><th scope="col">Published</th><th scope="col">Last Activity</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>` : `
          <div class="cm-founder-empty"><h3>No real employer workspaces yet.</h3><p>Only non-demo organizations appear here. The Demo/Test Lab remains separate.</p></div>`}
      </section>
      <div class="cm-founder-admin-footnote"><strong>Permission boundary:</strong> this aggregate platform view does not add the platform administrator to any organization. Normal employer workspace routes still require organization membership and role checks.</div>`);

    document.querySelector('[data-cm-refresh-employer-usage]')?.addEventListener('click', () => loadUsage(true));
  }

  function renderError(message) {
    renderShell(`
      <button class="cm-founder-admin-back" type="button" data-cm-founder-admin-back>← Admin / QA</button>
      <div class="card cm-founder-admin-denied">
        <div class="eyebrow">EMPLOYER USAGE</div><h1>Could not load aggregate usage.</h1>
        <p>${esc(message || 'Try again.')}</p>
        <button class="btn btn-primary" type="button" data-cm-retry-employer-usage>Retry</button>
      </div>`);
    document.querySelector('[data-cm-retry-employer-usage]')?.addEventListener('click', () => loadUsage(true));
  }

  async function loadUsage(force = false) {
    if (!adminUsageRoute()) return;
    if (usageLoading && !force) return;

    const serial = ++renderSerial;
    const auth = window.CM_AUTH;

    if (auth?.ready !== true) {
      renderLoading();
      setTimeout(() => { if (serial === renderSerial) loadUsage(force); }, 120);
      return;
    }

    if (!verifiedAdmin()) {
      renderDenied();
      return;
    }

    usageLoading = true;
    if (force || !document.querySelector('.cm-founder-metric-grid')) renderLoading();

    try {
      const token = await auth.getIdToken?.();
      if (!token) throw Object.assign(new Error('Sign in to continue.'), { status: 401 });
      const response = await fetch(`${API}/enterprise/admin/organizations`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (serial !== renderSerial || !adminUsageRoute()) return;
      if (!response.ok || data?.ok === false) {
        const error = new Error(data?.error || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
      }
      renderUsage(data);
    } catch (error) {
      if (serial !== renderSerial) return;
      if (error?.status === 401 || error?.status === 403) renderDenied(error.message);
      else renderError(error?.message || 'Employer usage is temporarily unavailable.');
    } finally {
      usageLoading = false;
    }
  }

  function syncRoute() {
    const normalized = String(location.hash || '#/').split('?', 1)[0].replace(/\/$/, '');
    if (legacyAdminUsageRoute() && verifiedAdmin()) {
      setAdminUsageView(true, { replace: true });
      return;
    }
    if (adminUsageRoute()) {
      const page = document.querySelector('.cm-founder-admin-page');
      const settled = page?.querySelector('.cm-founder-metric-grid, .cm-founder-admin-loading, .cm-founder-admin-denied');
      if (!page || !settled) loadUsage();
      return;
    }
    if (normalized !== ADMIN_ROUTE && new URLSearchParams(location.search).has(ADMIN_VIEW_PARAM)) {
      const url = new URL(location.href);
      url.searchParams.delete(ADMIN_VIEW_PARAM);
      history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
    renderSerial += 1;
    usageLoading = false;
    decoratePublicProof();
    decorateAdminCard();
  }
  function queueSync() {
    if (observerQueued) return;
    observerQueued = true;
    queueMicrotask(() => {
      observerQueued = false;
      syncRoute();
    });
  }

  window.addEventListener('hashchange', () => setTimeout(syncRoute, 0));
  window.addEventListener('popstate', () => setTimeout(syncRoute, 0));
  window.addEventListener('cm-auth-ready', queueSync);
  window.addEventListener('cm-auth-changed', queueSync);
  document.addEventListener('DOMContentLoaded', queueSync, { once: true });

  const app = document.getElementById('app');
  if (app) new MutationObserver(queueSync).observe(app, { childList: true, subtree: true });

  setTimeout(syncRoute, 0);
})();
