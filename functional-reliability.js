(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL || '';
  const issues = new Map();
  let pendingTimer = null;
  let banner = null;
  let nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

  function safeText(value, fallback='Something went wrong.') {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text || fallback;
  }

  function injectStyles() {
    if (document.getElementById('cm-functional-reliability-style')) return;
    const style = document.createElement('style');
    style.id = 'cm-functional-reliability-style';
    style.textContent = `
      #cm-functional-reliability{position:fixed;right:16px;bottom:16px;z-index:100000;width:min(430px,calc(100vw - 32px));border:1px solid rgba(7,26,51,.18);border-radius:16px;background:#fff;box-shadow:0 18px 55px rgba(7,26,51,.20);padding:14px 15px;color:#071a33;font:500 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #cm-functional-reliability[hidden]{display:none!important}
      #cm-functional-reliability[data-tone="error"]{border-left:5px solid #b42318}
      #cm-functional-reliability[data-tone="warning"]{border-left:5px solid #b54708}
      #cm-functional-reliability .cm-rel-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
      #cm-functional-reliability strong{display:block;font-size:14px;margin-bottom:3px}
      #cm-functional-reliability p{margin:0;color:#35465d}
      #cm-functional-reliability .cm-rel-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
      #cm-functional-reliability button{appearance:none;border:1px solid #173f6d;border-radius:999px;padding:7px 11px;background:#fff;color:#0b315e;font:700 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
      #cm-functional-reliability button[data-primary="true"]{background:#0b315e;color:#fff}
      #cm-functional-reliability small{display:block;margin-top:8px;color:#66758a}
      @media(max-width:520px){#cm-functional-reliability{left:10px;right:10px;bottom:10px;width:auto}}
    `;
    document.head.appendChild(style);
  }

  function ensureBanner() {
    if (banner?.isConnected) return banner;
    injectStyles();
    banner = document.createElement('aside');
    banner.id = 'cm-functional-reliability';
    banner.hidden = true;
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-atomic', 'true');
    document.body.appendChild(banner);
    return banner;
  }

  function highestIssue() {
    const rows = [...issues.values()];
    if (!rows.length) return null;
    return rows.sort((a,b) => (b.severity === 'error') - (a.severity === 'error') || b.at - a.at)[0];
  }

  function render() {
    const el = ensureBanner();
    const issue = highestIssue();
    if (!issue) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.dataset.tone = issue.severity === 'error' ? 'error' : 'warning';
    const title = issue.severity === 'error' ? 'Save / sync needs attention' : 'Save / sync is still finishing';
    el.innerHTML = `<div class="cm-rel-head"><div><strong>${title}</strong><p></p></div></div><div class="cm-rel-actions"></div>${issue.detail ? '<small></small>' : ''}`;
    el.querySelector('p').textContent = issue.message;
    if (issue.detail) el.querySelector('small').textContent = issue.detail;
    const actions = el.querySelector('.cm-rel-actions');
    if (typeof issue.retry === 'function') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.dataset.primary = 'true';
      retry.textContent = 'Retry now';
      retry.addEventListener('click', async () => {
        retry.disabled = true;
        retry.textContent = 'Retrying…';
        try {
          const ok = await issue.retry();
          if (ok !== false) clear(issue.scope);
        } catch (error) {
          report(issue.scope, safeText(error?.message, issue.message), { severity:'error', retry:issue.retry, detail:issue.detail });
        } finally {
          if (retry.isConnected) { retry.disabled = false; retry.textContent = 'Retry now'; }
        }
      });
      actions.appendChild(retry);
    }
  }

  function report(scope, message, options={}) {
    const key = safeText(scope, 'functional');
    issues.set(key, {
      scope:key,
      message:safeText(message),
      severity:options.severity === 'warning' ? 'warning' : 'error',
      retry:typeof options.retry === 'function' ? options.retry : null,
      detail:safeText(options.detail || '', ''),
      at:Date.now()
    });
    render();
  }

  function clear(scope) {
    issues.delete(String(scope || 'functional'));
    render();
  }

  async function retryCloudSync() {
    if (!window.CM_SYNC?.flush) return false;
    const ok = await window.CM_SYNC.flush();
    return ok === true;
  }

  function handleSyncStatus(detail={}) {
    const status = String(detail.status || window.CM_SYNC?.status || '');
    clearTimeout(pendingTimer);
    if (['synced','ready','signed-out','qa-local-only'].includes(status)) {
      clear('cloud-sync');
      return;
    }
    if (status === 'pending' || status === 'syncing' || status === 'loading') {
      pendingTimer = setTimeout(() => {
        if (!['pending','syncing','loading'].includes(String(window.CM_SYNC?.status || ''))) return;
        report('cloud-sync', 'Your latest work is saved on this device and is still syncing to your account.', {
          severity:'warning', retry:retryCloudSync, detail:'Keep this tab open until the sync completes if you plan to switch devices immediately.'
        });
      }, 1500);
      return;
    }
    if (status === 'degraded') {
      report('cloud-sync', safeText(detail.error || window.CM_SYNC?.error, 'Your progress is saved, but part of the account mirror still needs to retry.'), {
        severity:'warning', retry:retryCloudSync
      });
      return;
    }
    if (status === 'error') {
      report('cloud-sync', safeText(detail.error || window.CM_SYNC?.error, 'Your work is saved on this device, but cloud sync failed.'), {
        severity:'error', retry:retryCloudSync, detail:'Do not clear site data. Retry the sync before moving to another device.'
      });
    }
  }

  function storageHealthCheck() {
    try {
      const key = `cmStorageHealth:${Date.now()}`;
      localStorage.setItem(key, 'ok');
      if (localStorage.getItem(key) !== 'ok') throw new Error('Stored value could not be read back.');
      localStorage.removeItem(key);
      clear('browser-storage');
    } catch (error) {
      report('browser-storage', 'This browser is blocking Capital Mastery from saving progress on this device.', {
        severity:'error',
        detail:'Enable site storage or use a browser mode that allows local storage before completing coursework.'
      });
    }
  }

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    return String(input?.url || '');
  }

  function requestMethod(input, init={}) {
    return String(init?.method || input?.method || 'GET').toUpperCase();
  }

  function isWorkerMutation(url, method) {
    if (!API || !url.startsWith(API)) return false;
    if (['GET','HEAD','OPTIONS'].includes(method)) return false;
    if (/\/auth-check(?:$|\?)/.test(url)) return false;
    return true;
  }

  function authHeaderFrom(input, init={}) {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers || {}).forEach((value,key) => headers.set(key,value));
    return headers.get('Authorization') || '';
  }

  async function retryCredentialRefresh(data, authorization) {
    if (!nativeFetch || !data?.pathwayId || !authorization) return false;
    const response = await nativeFetch(`${API}/enterprise/credentials/refresh`, {
      method:'POST',
      headers:{Authorization:authorization,'Content-Type':'application/json'},
      body:JSON.stringify({pathwayId:data.pathwayId, assignmentId:data.assignmentId || null})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `Credential refresh failed (${response.status}).`);
    clear('assessment-enrichment');
    return true;
  }

  function inspectAssessmentSubmit(url, response, input, init) {
    if (!/\/enterprise\/assessments\/[^/]+\/submit(?:$|\?)/.test(url) || !response.ok) return;
    response.clone().json().then(data => {
      const evidencePending = data?.evidenceRefreshPending === true;
      const credentialPending = data?.credentialRefreshPending === true;
      if (!evidencePending && !credentialPending) { clear('assessment-enrichment'); return; }
      const authorization = authHeaderFrom(input, init);
      const message = evidencePending
        ? 'Your assessment attempt is saved, but its readiness evidence has not finished updating yet.'
        : 'Your assessment attempt is saved, but credential issuance has not finished yet.';
      const retry = !evidencePending && credentialPending
        ? () => retryCredentialRefresh(data, authorization)
        : null;
      report('assessment-enrichment', message, {
        severity:'error',
        retry,
        detail:evidencePending
          ? 'Your saved score will not be discarded. Do not resubmit just to make the message disappear.'
          : 'Your saved score is permanent; retrying here only refreshes credential issuance.'
      });
      if (retry) setTimeout(() => retry().catch(() => {}), 1800);
    }).catch(() => {});
  }

  function installFetchGuard() {
    if (!nativeFetch || window.fetch.__cmFunctionalReliabilityWrapped) return;
    const wrapped = async function(input, init={}) {
      const url = requestUrl(input);
      const method = requestMethod(input, init);
      const mutation = isWorkerMutation(url, method);
      try {
        const response = await nativeFetch(input, init);
        if (mutation && window.CM_AUTH?.user) {
          if (!response.ok) {
            report('server-write', `A server change was not saved (${response.status}). The page has not been told it succeeded.`, {
              severity:'error', detail:'Use the form’s error message to correct the issue, then retry the action.'
            });
          } else {
            clear('server-write');
          }
        }
        inspectAssessmentSubmit(url, response, input, init);
        return response;
      } catch (error) {
        if (mutation && window.CM_AUTH?.user) {
          report('server-write', 'A server change could not reach Capital Mastery. Nothing should be treated as saved until the request succeeds.', {
            severity:'error', detail:safeText(error?.message, 'Network request failed.')
          });
        }
        throw error;
      }
    };
    Object.defineProperty(wrapped, '__cmFunctionalReliabilityWrapped', { value:true });
    window.fetch = wrapped;
  }

  window.CM_RELIABILITY = Object.freeze({
    report,
    clear,
    retryCloudSync,
    storageHealthCheck,
    get issues() { return [...issues.values()]; }
  });

  storageHealthCheck();
  installFetchGuard();
  document.addEventListener('cm-sync-changed', event => handleSyncStatus(event.detail || {}));
  window.addEventListener('online', () => { if (window.CM_AUTH?.user) retryCloudSync().catch(() => {}); });
})();
