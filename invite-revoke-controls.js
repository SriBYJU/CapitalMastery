(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_V2_API_URL || window.CAPITAL_MASTERY_API_URL;
  let renderVersion = 0;

  function currentTeamOrgId() {
    const match = /^#\/employer\/([^/?#]+)\/team(?:[?#]|$)/.exec(location.hash || '');
    if (!match) return null;
    try { return decodeURIComponent(match[1]); } catch { return null; }
  }

  async function idToken() {
    return window.CM_AUTH?.getIdToken ? window.CM_AUTH.getIdToken() : null;
  }

  async function api(path, options = {}) {
    if (!API) throw new Error('Employer API is unavailable.');
    const token = await idToken();
    if (!token) throw new Error('Sign in to continue.');
    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function formatExpiry(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  function roleLabel(value) {
    return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  function pendingRow(invite, orgId, pendingBox) {
    const row = document.createElement('div');
    row.className = 'cmv2-pending-invite-row';
    row.dataset.inviteId = String(invite.id || '');

    const identity = document.createElement('div');
    identity.className = 'cmv2-pending-invite-identity';
    const email = document.createElement('span');
    email.textContent = String(invite.email_normalized || 'Pending invitation');
    const expiry = document.createElement('small');
    const expires = formatExpiry(invite.expires_at);
    expiry.textContent = expires ? `Expires ${expires}` : 'Pending secure invitation';
    identity.append(email, expiry);

    const role = document.createElement('b');
    role.textContent = roleLabel(invite.role);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-danger btn-sm';
    button.dataset.revokeInvite = String(invite.id || '');
    button.textContent = 'Revoke';
    button.setAttribute('aria-label', `Revoke invitation for ${String(invite.email_normalized || 'this person')}`);

    button.addEventListener('click', async () => {
      const address = String(invite.email_normalized || 'this invitation');
      if (!window.confirm(`Revoke the pending invitation for ${address}? This only invalidates this invitation. It will not remove any workspace, member, learner progress, cohort, assignment, or existing access.`)) return;

      button.disabled = true;
      button.textContent = 'Revoking…';
      try {
        await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites/${encodeURIComponent(invite.id)}`, { method: 'DELETE' });
        row.remove();
        if (!pendingBox.querySelector('[data-invite-id]')) pendingBox.remove();
        announce('Invitation revoked. Existing workspace data and members were not changed.');
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Revoke';
        announce(error.message || 'Could not revoke invitation.', true);
      }
    });

    row.append(identity, role, button);
    return row;
  }

  function announce(message, error = false) {
    let status = document.getElementById('cmv2-invite-revoke-status');
    if (!status) {
      const teamStatus = document.getElementById('cmv2-team-status');
      status = document.createElement('div');
      status.id = 'cmv2-invite-revoke-status';
      status.className = 'cmv2-form-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      if (teamStatus?.parentElement) teamStatus.parentElement.insertBefore(status, teamStatus);
      else document.querySelector('.cmv2-pending')?.append(status);
    }
    if (status) {
      status.textContent = message;
      status.dataset.state = error ? 'error' : 'success';
    }
  }

  async function enhancePendingInvites() {
    const orgId = currentTeamOrgId();
    if (!orgId) return;
    const pendingBox = document.querySelector('.cmv2-pending');
    if (!pendingBox || pendingBox.dataset.revokeControls === 'ready' || pendingBox.dataset.revokeControls === 'loading') return;

    const version = ++renderVersion;
    pendingBox.dataset.revokeControls = 'loading';
    try {
      const data = await api(`/enterprise/organizations/${encodeURIComponent(orgId)}/invites`);
      if (version !== renderVersion || currentTeamOrgId() !== orgId || !pendingBox.isConnected) return;
      const pending = (data.invites || []).filter(invite => invite.status === 'pending');
      if (!pending.length) {
        pendingBox.remove();
        return;
      }

      pendingBox.replaceChildren();
      const heading = document.createElement('h3');
      heading.textContent = 'Pending invitations';
      pendingBox.append(heading);
      pending.forEach(invite => pendingBox.append(pendingRow(invite, orgId, pendingBox)));
      pendingBox.dataset.revokeControls = 'ready';
    } catch (error) {
      // Keep the existing Team & Roles page fully usable if enhancement fails.
      pendingBox.dataset.revokeControls = 'failed';
      console.warn('Pending invitation revoke controls unavailable', error);
    }
  }

  function scheduleEnhancement() {
    window.setTimeout(enhancePendingInvites, 0);
    window.setTimeout(enhancePendingInvites, 120);
  }

  window.addEventListener('hashchange', scheduleEnhancement);
  document.addEventListener('cm-auth-changed', scheduleEnhancement);
  const observer = new MutationObserver(() => {
    if (currentTeamOrgId() && document.querySelector('.cmv2-pending:not([data-revoke-controls="ready"])')) scheduleEnhancement();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleEnhancement();
})();
