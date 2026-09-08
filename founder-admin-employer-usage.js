(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  const ADMIN_ROUTE = '#/admin-preview/employer-usage';
  let renderSerial = 0;
  let observerQueued = false;

  function esc(value = '') {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function rootRoute() {
    return String(location.hash || '#/').replace(/^#\/?/, '').split(/[/?]/, 1)[0] || '';
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
    section.setAttribute('aria-label', 'Sterling Point Advisors onboarding platform');
    section.innerHTML = `
      <div class="container cm-official-platform-inner">
        <div class="cm-official-platform-copy">
          <div class="eyebrow">OFFICIAL ONBOARDING USE</div>
          <h2>Capital Mastery is the official onboarding training platform for Sterling Point Advisors.</h2>
          <p>Capital Mastery supports pre-Day-1 finance preparation with structured role training, realistic work, evidence-backed readiness, and employer cohort tools.</p>
          <p class="cm-official-platform-note">Sterling Point Advisors has given permission for its name and logo to be displayed in connection with this onboarding use. This is not a sponsorship or investment-services endorsement.</p>
        </div>
        <div class="cm-official-platform-logo-wrap">
          <span>OFFICIAL ONBOARDING TRAINING PLATFORM FOR</span>
          <img src="assets/sterling-point-logo.svg" alt="Sterling Point Advisors" loading="lazy" />
        </div>
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
    if (normalized !== '#/admin-preview') return;
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
      <a class="btn btn-primary btn-sm" href="${ADMIN_ROUTE}">Open Employer Usage →</a>`;
    grid.prepend(card);
  }

  function renderShell(inner) {
    const pageMain = main();
    if (!pageMain) return false;
    pageMain.innerHTML = `<section class="cm-founder-admin-page"><div class="container">${inner}</div></section>`;
    return true;
  }

  function renderLoading() {
    renderShell(`
      <a class="cm-founder-admin-back" href="#/admin-preview">← Admin / QA</a>
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
      <a class="cm-founder-admin-back" href="#/admin-preview">← Admin / QA</a>
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
      <a class="cm-founder-admin-back" href="#/admin-preview">← Admin / QA</a>
      <div class="card cm-founder-admin-denied">
        <div class="eyebrow">EMPLOYER USAGE</div><h1>Could not load aggregate usage.</h1>
        <p>${esc(message || 'Try again.')}</p>
        <button class="btn btn-primary" type="button" data-cm-retry-employer-usage>Retry</button>
      </div>`);
    document.querySelector('[data-cm-retry-employer-usage]')?.addEventListener('click', () => loadUsage(true));
  }

  async function loadUsage(force = false) {
    if (String(location.hash || '').split('?', 1)[0] !== ADMIN_ROUTE) return;
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
      if (serial !== renderSerial || String(location.hash || '').split('?', 1)[0] !== ADMIN_ROUTE) return;
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
    }
  }

  function syncRoute() {
    const normalized = String(location.hash || '').split('?', 1)[0];
    if (normalized === ADMIN_ROUTE) {
      loadUsage();
      return;
    }
    renderSerial += 1;
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
  window.addEventListener('cm-auth-ready', queueSync);
  window.addEventListener('cm-auth-changed', queueSync);
  document.addEventListener('DOMContentLoaded', queueSync, { once: true });

  const app = document.getElementById('app');
  if (app) new MutationObserver(queueSync).observe(app, { childList: true, subtree: true });

  setTimeout(syncRoute, 0);
})();
