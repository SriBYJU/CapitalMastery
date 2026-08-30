(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  let activeToken = '';
  let loading = false;

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function routeToken() {
    const parts = String(location.hash || '#/')
      .replace(/^#\/?/, '')
      .split('?')[0]
      .split('/')
      .filter(Boolean);
    return parts[0] === 'verify' && parts[1] ? decodeURIComponent(parts[1]) : '';
  }

  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? String(value || '')
      : new Intl.DateTimeFormat('en-US', { month:'long', day:'numeric', year:'numeric' }).format(d);
  }

  function levelInfo(level) {
    const key = String(level || '').toLowerCase();
    const levels = {
      foundations: {
        className: 'simple',
        label: 'Foundations Credential',
        description: 'for demonstrating the required career foundations, role context and technical core under the Capital Mastery Standard.'
      },
      essentials: {
        className: 'simple',
        label: 'Essentials Credential',
        description: 'for applying the taught foundations in the required secure mini case and meeting the Capital Mastery mastery standard.'
      },
      applied: {
        className: 'applied',
        label: 'Applied Skills Credential',
        description: 'for completing the required professional toolkit, guided practice and independent applied work under the Capital Mastery Standard.'
      },
      career: {
        className: 'career-skills',
        label: 'Career Skills Program Completion Certificate',
        description: 'for completing the shorter practical Career Skills program after the three verified Standard 2.0 milestones and the required role-specific capstone simulation. This completion certificate is not a sixth Standard 2.0 credential.'
      },
      role_lab: {
        className: 'applied',
        label: 'Role Lab Credential',
        description: 'for completing the advanced role-specific professional simulation, required work products and review/revision cycle under the Capital Mastery Standard 2.0.'
      },
      professional_readiness: {
        className: 'professional-readiness',
        label: 'Professional Readiness Credential',
        description: 'for demonstrating the full required technical, applied, Role Lab and professional-final evidence for the career under the Capital Mastery Standard 2.0.'
      }
    };
    return levels[key] || {
      className: '',
      label: 'Capital Mastery Credential',
      description: 'for completing the evidence requirements associated with this verified Capital Mastery credential.'
    };
  }

  function currentVerifyUrl() {
    return `${location.origin}${location.pathname}#/verify/${encodeURIComponent(routeToken())}`;
  }

  function certificateHtml(c, valid) {
    const info = levelInfo(c.level);
    const levelKey = String(c.level || '').toLowerCase();
    const isProgramCompletion = c.recordType === 'program_completion' || levelKey === 'career';
    const isProfessional = levelKey === 'professional_readiness';
    const isFlagship = isProfessional;
    const statusText = isProgramCompletion ? (valid ? 'Verified Active Program Completion' : `Program completion ${String(c.status || 'not active')}`) : (valid ? 'Verified Active Credential' : `Credential ${String(c.status || 'not active')}`);
    const verify = currentVerifyUrl();

    return `
      <section class="cm-public-certificate-section" aria-label="Capital Mastery certificate">
        <div class="cm-public-cert-heading">
          <div>
            <div class="eyebrow">CERTIFICATE</div>
            <h2>${isProgramCompletion ? 'The program-completion certificate' : 'The earned certificate'}</h2>
            <p>${isProgramCompletion ? 'This certificate is generated from the authoritative D1 program-completion record shown above.' : 'This certificate is generated from the same authoritative credential record shown above.'}</p>
          </div>
          ${valid ? '<button class="btn btn-outline cm-public-cert-print" type="button" data-cm-live-print>Download PDF</button>' : ''}
        </div>

        <div class="cm-public-cert-frame ${valid ? '' : 'not-active'}">
          <div id="certificate" class="certificate ${info.className}">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            ${(isFlagship || isProgramCompletion) ? '<img class="cert-seal" src="assets/seal.svg" alt="Capital Mastery seal">' : ''}
            <div class="cert-inner">
              <div class="cert-brand"><img src="assets/logo-mark.svg" alt="">CAPITAL MASTERY</div>
              <div class="cert-type">${esc(info.label)}</div>
              <div class="cert-awarded">This certificate is ${(isFlagship || isProgramCompletion) ? 'proudly ' : ''}awarded to</div>
              <div class="cert-name">${esc(c.holderName)}</div>
              <div class="cert-for">for successfully completing the requirements of</div>
              <div class="cert-title">${esc(String(c.title||'').replace(/ Career Skills Certificate$/i,'').replace(/ Professional Readiness Credential$/i,'').replace(/ Role Lab Credential$/i,'').replace(/ (Foundations|Essentials|Applied Skills) (Credential|Certificate)$/i,'').replace(/ Certificate$/i,''))}</div>
              <div class="cert-description">${esc(info.description)}</div>
              <div class="cert-bottom">
                <div class="cert-meta"><span>ISSUED</span><strong>${esc(formatDate(c.issuedAt))}</strong></div>
                <div class="signature-block">
                  <img src="assets/founder-signature.png" alt="Shriyan Avadhanula signature">
                  <div class="signature-line"></div>
                  <strong>Shriyan Avadhanula</strong>
                  <span>Founder, Capital Mastery</span>
                </div>
                <div class="cert-meta">
                  <div id="cm-live-cert-mark" class="cert-qr"></div>
                  <span>${isProgramCompletion ? 'COMPLETION ID' : 'CREDENTIAL ID'}</span>
                  <strong>${esc(c.credentialId)}</strong>
                </div>
              </div>
              <div class="cm-cert-verify-url">Verify: ${esc(verify)}</div>
            </div>
            ${!valid ? `<div class="cm-public-cert-watermark">${esc(statusText)}</div>` : ''}
          </div>
        </div>

        <div class="cm-public-cert-proof ${valid ? 'active' : 'inactive'}">
          <strong>${valid ? (isProgramCompletion ? '✓ Verified program completion' : '✓ Verified certificate') : (isProgramCompletion ? 'Program completion is not currently active' : 'Credential is not currently active')}</strong>
          <span>${esc(statusText)} · Verified through the Capital Mastery secure API and D1 ${isProgramCompletion ? 'program-completion' : 'credential'} record.</span>
        </div>
      </section>`;
  }

  async function enhanceVerifyPage() {
    const token = routeToken();
    if (!token || !API || loading) return;

    const verification = document.querySelector('.cm-verification');
    if (!verification) return;
    if (verification.parentElement?.querySelector('.cm-public-certificate-section')) return;

    loading = true;
    activeToken = token;
    try {
      const response = await fetch(`${API}/verify/${encodeURIComponent(token)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.credential || activeToken !== token || routeToken() !== token) return;

      verification.insertAdjacentHTML('afterend', certificateHtml(data.credential, data.valid === true));
      document.title = `${data.credential.title} | Verified by Capital Mastery`;
    } catch (error) {
      console.warn('Could not render public certificate preview:', error);
    } finally {
      loading = false;
    }
  }

  const style = document.createElement('style');
  style.id = 'cm-public-certificate-styles';
  style.textContent = `
    .cm-public-certificate-section{margin-top:28px}.cm-public-cert-heading{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px}.cm-public-cert-heading h2{font-family:Georgia,"Times New Roman",serif;color:var(--navy);font-size:2rem;margin:0 0 5px}.cm-public-cert-heading p{margin:0;color:var(--muted)}
    .cm-public-cert-frame{background:#e9edf1;border:1px solid #d6dde4;border-radius:20px;padding:22px;overflow:hidden}.cm-public-cert-frame .certificate{width:100%;max-width:100%;margin:0;box-shadow:0 16px 45px rgba(7,26,51,.16)}.cm-public-cert-frame.not-active .certificate{filter:grayscale(.35);opacity:.84}
    .cm-public-cert-watermark{position:absolute;inset:0;display:grid;place-items:center;z-index:8;font-size:clamp(1.4rem,5vw,4rem);font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:rgba(130,35,35,.28);transform:rotate(-18deg);pointer-events:none}
    .cm-public-cert-proof{display:grid;gap:2px;margin-top:12px;padding:12px 14px;border-radius:11px;font-size:.84rem}.cm-public-cert-proof.active{background:#eaf6ef;border:1px solid #c7dfd1;color:#245b43}.cm-public-cert-proof.inactive{background:#fff0f0;border:1px solid #efcaca;color:#8b3232}.cm-public-cert-proof span{font-size:.78rem}
    @media(max-width:700px){.cm-public-cert-heading{display:grid;align-items:start}.cm-public-cert-print{width:100%}.cm-public-cert-frame{padding:8px;border-radius:14px}.cm-public-certificate-section{margin-top:20px}.cm-public-cert-heading h2{font-size:1.65rem}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  window.addEventListener('hashchange', () => {
    activeToken = routeToken();
    setTimeout(enhanceVerifyPage, 80);
  });
  document.addEventListener('cm-auth-changed', () => setTimeout(enhanceVerifyPage, 80));

  const observer = new MutationObserver(() => {
    if (routeToken() && document.querySelector('.cm-verification')) enhanceVerifyPage();
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });

  setTimeout(enhanceVerifyPage, 120);
})();
