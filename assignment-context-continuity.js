(() => {
  'use strict';

  const KEY = 'cmActiveEmployerAssignmentV1';
  const FLOW_ROUTES = new Set([
    'career','learn','quiz','diagnostic','v2-assessment','role-lab',
    'official-simulation','simulation','readiness','skills'
  ]);

  function route() {
    const raw = String(location.hash || '#/').replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(query) };
  }

  function activeAssignment() {
    const current = route();
    if (current.parts[0] === 'assigned' && current.parts[1]) {
      const id = decodeURIComponent(current.parts[1]);
      sessionStorage.setItem(KEY, id);
      return id;
    }

    const scoped = current.query.get('assignment');
    if (scoped) {
      sessionStorage.setItem(KEY, scoped);
      return scoped;
    }

    if (FLOW_ROUTES.has(current.parts[0])) return sessionStorage.getItem(KEY) || '';
    if (current.parts[0] !== 'assigned') sessionStorage.removeItem(KEY);
    return '';
  }

  function withAssignment(href, assignmentId) {
    if (!href || !href.startsWith('#/')) return href;
    const raw = href.slice(2);
    const [path, query = ''] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    if (!FLOW_ROUTES.has(parts[0])) return href;
    const params = new URLSearchParams(query);
    params.set('assignment', assignmentId);
    return `#/${path}?${params.toString()}`;
  }

  function apply() {
    const assignmentId = activeAssignment();
    if (!assignmentId) return;
    document.querySelectorAll('a[href^="#/"]').forEach(link => {
      const current = link.getAttribute('href');
      const next = withAssignment(current, assignmentId);
      if (next && next !== current) link.setAttribute('href', next);
    });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#/"]');
    if (!link) return;
    const assignmentId = activeAssignment();
    if (!assignmentId) return;
    const current = link.getAttribute('href');
    const next = withAssignment(current, assignmentId);
    if (next && next !== current) link.setAttribute('href', next);
  }, true);

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  window.addEventListener('hashchange', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  new MutationObserver(schedule).observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true
  });
  schedule();
})();
