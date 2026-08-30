(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const V2_API = window.CAPITAL_MASTERY_V2_API_URL || API;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const PASS = 80;
  let rerenderGuard = '';
  let enhanceBusy = false;

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function hashParts() {
    return (location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  }

  function main() {
    return document.querySelector('#app main#main');
  }

  function adminQaPreviewActive() {
    return window.CM_AUTH?.ready === true &&
      window.CM_AUTH?.isAdmin === true &&
      localStorage.getItem(QA_KEY) === 'true';
  }

  function careerById(id) {
    return window.CM_DATA?.careers?.find(c => c.id === id) || null;
  }

  function levelLabel(level) {
    return ({ foundations:'Foundations', essentials:'Essentials', applied:'Applied Skills', role_lab:'Role Lab', professional_readiness:'Professional Readiness', career:'Career' })[level] || String(level||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value || '') : new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    }).format(d);
  }

  function formatMonthYear(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value || '') : new Intl.DateTimeFormat('en-US', {
      month: 'long', year: 'numeric'
    }).format(d);
  }

  async function idToken() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function apiFetch(path, options = {}, auth = true) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = await idToken();
      if (!token) throw new Error('Sign in to continue.');
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function v2ApiFetch(path, options = {}, auth = true) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = await idToken();
      if (!token) throw new Error('Sign in to continue.');
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${V2_API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  function isV2Level(level) {
    return ['essentials','role_lab','professional_readiness'].includes(level);
  }

  function verifyUrl(credential) {
    return `${location.origin}${location.pathname}#/verify/${encodeURIComponent(credential.public_token)}`;
  }

  function renderLoading(label) {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:900px"><div class="card"><div class="eyebrow">SECURE CAPITAL MASTERY</div><h1 class="serif" style="color:var(--navy)">${esc(label)}</h1><p>Loading the authoritative credential record from the Capital Mastery API.</p></div></div></section>`;
  }

  function renderError(title, message) {
    const el = main();
    if (!el) return;
    el.innerHTML = `<section class="section"><div class="container" style="max-width:820px"><div class="card"><h1 class="serif" style="color:var(--navy)">${esc(title)}</h1><p>${esc(message)}</p><a class="btn btn-primary" href="#/credentials">Back to Credentials →</a></div></div></section>`;
  }

  async function fetchCredentials() {
    const data = await apiFetch('/credentials/me');
    return Array.isArray(data.credentials) ? data.credentials : [];
  }

  async function findCredential(pathwayId, level) {
    const credentials = await fetchCredentials();
    return credentials.find(c => c.pathway_id === pathwayId && c.credential_level === level && c.status === 'active') ||
      credentials.find(c => c.pathway_id === pathwayId && c.credential_level === level) || null;
  }

  function readLocalState() {
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return state && state.version === 1 ? state : null;
    } catch (_) {
      return null;
    }
  }

  async function syncOfficialProgress(pathwayId) {
    if (!window.CM_AUTH?.ready || !window.CM_AUTH?.user || !careerById(pathwayId)) return false;
    try {
      const data = await apiFetch(`/progress/${encodeURIComponent(pathwayId)}`);
      const progress = Array.isArray(data.progress) ? data.progress : [];
      const state = readLocalState();
      if (!state) return false;

      state.careers ||= {};
      state.careers[pathwayId] ||= {
        learningComplete: [], completedParts: [], quizScores: {}, simulationKnowledge: null,
        simulationScore: null, finalScore: null, applied: {}, simResponses: {}, readiness: null
      };
      const cs = state.careers[pathwayId];
      cs.learningComplete ||= [];
      cs.completedParts ||= [];
      cs.quizScores ||= {};

      let changed = false;
      const add = (arr, n) => {
        if (!arr.includes(n)) { arr.push(n); changed = true; }
      };
      const maxSet = (obj, key, score) => {
        const current = Number(obj[key] || 0);
        const next = Math.max(current, Number(score || 0));
        if (next !== current) { obj[key] = next; changed = true; }
      };

      for (const row of progress) {
        const score = Number(row.best_score || 0);
        const passed = Number(row.completed) === 1 && score >= PASS;
        const match = /^part-(\d)$/.exec(row.item_id);
        if (match) {
          const n = Number(match[1]);
          if (n <= 4) maxSet(cs.quizScores, n, score);
          if (n === 5) {
            const current = Number(cs.simulationKnowledge || 0);
            if (score > current) { cs.simulationKnowledge = score; changed = true; }
          }
          if (passed) {
            add(cs.learningComplete, n);
            add(cs.completedParts, n);
          }
        }
        if (row.item_id === 'simulation') {
          const current = Number(cs.simulationScore || 0);
          if (score > current) { cs.simulationScore = score; changed = true; }
          if (passed) { add(cs.learningComplete, 5); add(cs.completedParts, 5); }
        }
        if (row.item_id === 'final') {
          const current = Number(cs.finalScore || 0);
          if (score > current) { cs.finalScore = score; changed = true; }
        }
      }

      if (changed) {
        cs.learningComplete.sort((a, b) => a - b);
        cs.completedParts.sort((a, b) => a - b);
        state.updatedAt = new Date().toISOString();
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        window.CM_SYNC?.flush?.().catch(() => {});
      }
      return changed;
    } catch (error) {
      console.warn('Capital Mastery official progress recovery failed:', error);
      return false;
    }
  }

  async function renderCredentials() {
    if (!window.CM_AUTH?.ready) return renderLoading('Checking your account…');
    if (!window.CM_AUTH?.user) {
      const el = main();
      if (el) el.innerHTML = `<section class="section"><div class="container" style="max-width:760px"><div class="card"><h1 class="serif" style="color:var(--navy)">Sign in required.</h1><p>Verified credentials are tied to your Capital Mastery account.</p><a class="btn btn-primary" href="#/login">Sign in →</a></div></div></section>`;
      return;
    }
    renderLoading('Loading your verified credentials…');
    try {
      const credentials = await fetchCredentials();
      const el = main();
      if (!el) return;
      el.innerHTML = `<section class="credentials-hero"><div class="container"><div class="eyebrow">YOUR VERIFIED ACHIEVEMENTS</div><h1>Credentials that show what you proved.</h1><p>These records come directly from the authoritative Capital Mastery D1 credential database.</p></div></section><section class="section-tight"><div class="container">${credentials.length ? `<div class="grid grid-3">${credentials.map(c => `<article class="card cm-live-credential"><span class="cm-status ${esc(c.status)}">${esc(c.status)}</span><div class="eyebrow">${esc(levelLabel(c.credential_level))}</div><h3>${esc(c.credential_title)}</h3><p><strong>Issued to</strong><br>${esc(c.holder_name)}</p><p><strong>Credential ID</strong><br><span class="small">${esc(c.credential_id)}</span></p><p><strong>Issued</strong><br>${formatDate(c.issued_at)}</p>${c.status === 'active' ? `<div class="cm-live-actions"><a class="btn btn-gold btn-block" href="#/certificate/${encodeURIComponent(c.pathway_id)}/${encodeURIComponent(c.credential_level)}">View Certificate</a><a class="btn btn-outline btn-block" href="#/credential/${encodeURIComponent(c.pathway_id)}/${encodeURIComponent(c.credential_level)}">Credential Details</a><button class="btn btn-outline btn-block" data-cm-live-linkedin="${esc(c.credential_id)}">Add to LinkedIn</button><a class="btn btn-soft btn-block" href="#/verify/${encodeURIComponent(c.public_token)}">Public Verification</a></div>` : `<div class="cm-live-warning">This credential is ${esc(c.status)} and is not currently active.</div>`}</article>`).join('')}</div>` : `<div class="card"><h2>No verified credentials yet.</h2><p>Complete official assessments at 80% or higher to earn credentials automatically.</p><a class="btn btn-primary" href="#/careers">Explore pathways →</a></div>`}</div></section>`;
      bindCredentialButtons(credentials);
    } catch (error) {
      renderError('Could not load credentials.', error.message);
    }
  }

  async function renderCredentialDetail(pathwayId, level) {
    renderLoading('Loading credential details…');
    try {
      const credential = await findCredential(pathwayId, level);
      if (!credential) throw new Error('No issued credential was found for this pathway and level.');
      const c = careerById(pathwayId);
      let evidenceData = null;
      if (isV2Level(level)) {
        try { evidenceData = await v2ApiFetch(`/enterprise/credentials/${encodeURIComponent(credential.credential_id)}/evidence`); }
        catch (error) { console.warn('V2 credential evidence unavailable:', error); }
      }
      const profile = evidenceData?.evidence?.find(x => x.type === 'competency_profile')?.data?.competencies || [];
      const skills = profile.length ? profile.map(x => `${x.name} · ${Number(x.score)}%`) : (c ? [...new Set([...(c.vocab || []).slice(0, 5), ...(c.deliverables || []).slice(0, 4)])] : []);
      const evidenceRows = (evidenceData?.evidence || []).filter(x => ['assessment','role_lab','readiness'].includes(x.type));
      const evidenceHtml = evidenceRows.length ? `<div class="cm-v2-evidence-detail"><h3>Verified evidence</h3>${evidenceRows.map(x => { const d=x.data||{}; const score=d.score ?? d.overallScore; return `<div><span>${esc(x.title)}</span><b>${score==null?'Recorded':`${Number(score)}%`}</b></div>`; }).join('')}</div>` : '';
      const el = main();
      if (!el) return;
      el.innerHTML = `<section class="section"><div class="container credential-detail"><article class="credential-summary"><span class="verify-status">✓ VERIFIED ACTIVE</span><div class="eyebrow" style="margin-top:20px">${esc(levelLabel(level).toUpperCase())} CERTIFICATE</div><h1>${esc(credential.credential_title)}</h1><p>Issued to <strong>${esc(credential.holder_name)}</strong> on ${formatDate(credential.issued_at)}.</p><div class="grid grid-2" style="margin:20px 0"><div class="data-card"><div class="label">Credential ID</div><p style="word-break:break-word"><strong>${esc(credential.credential_id)}</strong></p></div><div class="data-card"><div class="label">Status</div><p><strong>${esc(credential.status)}</strong></p></div></div>${skills.length ? `<h3>${profile.length?'Measured competencies':'Skills represented by this pathway'}</h3><div class="skills-wrap">${skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div>` : ''}${evidenceHtml}<div class="feedback-box" style="margin-top:20px"><strong>Authoritative record:</strong> this credential is issued and verified by the Capital Mastery secure API and D1 database.</div></article><aside class="share-panel"><h3>Use your credential</h3><a class="btn btn-gold btn-block" href="#/certificate/${encodeURIComponent(pathwayId)}/${encodeURIComponent(level)}">View Certificate</a><button class="btn btn-outline btn-block" style="margin-top:8px" data-cm-live-linkedin="${esc(credential.credential_id)}">Add to LinkedIn</button><button class="btn btn-outline btn-block" style="margin-top:8px" data-cm-live-post="${esc(credential.credential_id)}">Create LinkedIn Post</button><a class="btn btn-outline btn-block" style="margin-top:8px" href="#/verify/${encodeURIComponent(credential.public_token)}">Open Public Verification</a><label>Credential ID</label><div class="copy-row">${esc(credential.credential_id)}</div><button class="btn btn-soft btn-sm" data-cm-live-copy="${esc(credential.credential_id)}">Copy ID</button><label style="display:block;margin-top:14px">Credential URL</label><div class="copy-row">${esc(verifyUrl(credential))}</div><button class="btn btn-soft btn-sm" data-cm-live-copy="${esc(verifyUrl(credential))}">Copy Link</button></aside></div></section>`;
      bindCredentialButtons([credential]);
    } catch (error) {
      renderError('Credential unavailable.', error.message);
    }
  }

  async function renderCertificate(pathwayId, level) {
    renderLoading('Preparing your verified certificate…');
    try {
      const credential = await findCredential(pathwayId, level);
      if (!credential || credential.status !== 'active') throw new Error('An active issued credential is required to view this certificate.');
      const c = careerById(pathwayId);
      const isCareer = level === 'career';
      const isFlagship = isCareer || level === 'professional_readiness';
      const cls = ['foundations','essentials'].includes(level) ? 'simple' : ['applied','role_lab'].includes(level) ? 'applied' : '';
      const descriptions = {
        foundations:'for successfully completing the career foundations and required technical assessments under the Capital Mastery Standard.',
        essentials:'for applying the career foundations in a guided mini case and meeting the required Essentials assessment standard.',
        applied:'for successfully completing the applied learning, professional toolkit, and required assessments under the Capital Mastery Standard.',
        role_lab:'for successfully performing the required live-style Role Lab workflow, including analysis, quality control, revision and professional judgment.',
        professional_readiness:'for demonstrating evidence-backed readiness across the baseline diagnostic, required credentials, Role Lab, competency floors and Professional Readiness Final under Capital Mastery Standard 2.0.',
        career:'for demonstrating mastery across required learning, technical assessments, applied work, a graded job simulation, and the Professional Readiness Final under the Capital Mastery Standard.'
      };
      const description = descriptions[level] || 'for successfully completing the verified Capital Mastery credential requirements.';
      const displayTitle = credential.credential_title.replace(/ Certificate$/, '').replace(/ Career Certificate$/, '');
      const el = main();
      if (!el) return;
      el.innerHTML = `<section class="cert-page"><div class="cm-live-verified-banner">✓ VERIFIED ACTIVE CREDENTIAL · Authoritative D1 record</div><div id="certificate" class="certificate ${cls}"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>${isFlagship ? '<img class="cert-seal" src="assets/seal.svg" alt="Capital Mastery seal">' : ''}<div class="cert-inner"><div class="cert-brand"><img src="assets/logo-mark.svg" alt="">CAPITAL MASTERY</div><div class="cert-type">${esc(levelLabel(level))} Certificate</div><div class="cert-awarded">This certificate is ${isFlagship ? 'proudly ' : ''}awarded to</div><div class="cert-name">${esc(credential.holder_name)}</div><div class="cert-for">for successfully completing the requirements of</div><div class="cert-title">${esc(displayTitle)}</div><div class="cert-description">${esc(description)}</div><div class="cert-bottom"><div class="cert-meta"><span>ISSUED</span><strong>${formatDate(credential.issued_at)}</strong></div><div class="signature-block"><img src="assets/founder-signature.png" alt="Founder signature"><div class="signature-line"></div><strong>Shriyan Avadhanula</strong><span>Founder, Capital Mastery</span></div><div class="cert-meta"><div id="cm-live-cert-mark" class="cert-qr"></div><span>CREDENTIAL ID</span><strong>${esc(credential.credential_id)}</strong></div></div><div class="cm-cert-verify-url">Verify: ${esc(verifyUrl(credential))}</div></div></div><div class="cert-toolbar"><button class="btn btn-primary" data-cm-live-print>Download / Print PDF</button><button class="btn btn-outline" data-cm-live-png>Download PNG</button><a class="btn btn-outline" href="#/credential/${encodeURIComponent(pathwayId)}/${encodeURIComponent(level)}">Credential Details</a><button class="btn btn-gold" data-cm-live-linkedin="${esc(credential.credential_id)}">Add to LinkedIn</button></div></section>`;
      renderVerificationMark(document.getElementById('cm-live-cert-mark'), credential.public_token);
      bindCredentialButtons([credential]);
      document.querySelector('[data-cm-live-print]')?.addEventListener('click', () => window.print());
      document.querySelector('[data-cm-live-png]')?.addEventListener('click', () => {
        if (window.CM?.downloadCertificateImage) window.CM.downloadCertificateImage();
        else window.print();
      });
    } catch (error) {
      renderError('Certificate unavailable.', error.message);
    }
  }

  async function renderAchievement(pathwayId, level) {
    renderLoading('Opening your achievement…');
    try {
      const credential = await findCredential(pathwayId, level);
      if (!credential || credential.status !== 'active') throw new Error('No active verified credential was found.');
      const c = careerById(pathwayId);
      const el = main();
      if (!el) return;
      const topSkills = c ? [...new Set([...(c.deliverables || []).slice(0, 3), ...(c.vocab || []).slice(0, 3)])] : [];
      el.innerHTML = `<section class="achievement-hero"><div class="confetti-field" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><div class="container achievement-wrap"><div class="achievement-seal"><img src="assets/seal.svg" alt=""></div><div class="eyebrow">${esc(levelLabel(level).toUpperCase())} CERTIFICATE EARNED</div><h1>Milestone unlocked.</h1><h2>${esc(credential.credential_title)}</h2><p>Your official result was recorded by the secure Capital Mastery backend and this credential was automatically issued from D1.</p>${topSkills.length ? `<div class="achievement-skills"><span>Skills represented</span>${topSkills.map(x => `<b>${esc(x)}</b>`).join('')}</div>` : ''}<div class="hero-actions" style="justify-content:center"><a class="btn btn-gold" href="#/certificate/${encodeURIComponent(pathwayId)}/${encodeURIComponent(level)}">View Certificate →</a><a class="btn btn-outline achievement-outline" href="#/credential/${encodeURIComponent(pathwayId)}/${encodeURIComponent(level)}">Share & Add to LinkedIn</a></div><p class="achievement-date">Issued ${formatDate(credential.issued_at)} · ${esc(credential.credential_id)}</p></div></section>`;
    } catch (error) {
      renderError('Achievement unavailable.', error.message);
    }
  }

  function credentialById(credentials, id) {
    return credentials.find(c => c.credential_id === id) || null;
  }

  function bindCredentialButtons(credentials) {
    document.querySelectorAll('[data-cm-live-linkedin]').forEach(button => {
      button.addEventListener('click', () => {
        const credential = credentialById(credentials, button.dataset.cmLiveLinkedin);
        if (credential) openLinkedInModal(credential);
      });
    });
    document.querySelectorAll('[data-cm-live-post]').forEach(button => {
      button.addEventListener('click', () => {
        const credential = credentialById(credentials, button.dataset.cmLivePost);
        if (credential) openPostModal(credential);
      });
    });
    document.querySelectorAll('[data-cm-live-copy]').forEach(button => {
      button.addEventListener('click', () => copy(button.dataset.cmLiveCopy || ''));
    });
  }

  function openModal(html) {
    document.getElementById('cm-live-modal')?.remove();
    const d = document.createElement('div');
    d.id = 'cm-live-modal';
    d.className = 'modal-backdrop';
    d.innerHTML = `<div class="modal cm-live-modal">${html}</div>`;
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
    document.body.appendChild(d);
    d.querySelector('[data-cm-live-close]')?.addEventListener('click', () => d.remove());
    d.querySelectorAll('[data-copy-value]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copyValue || '')));
  }

  function openLinkedInModal(credential) {
    const url = verifyUrl(credential);
    const fields = [
      ['Credential name', credential.credential_title],
      ['Issuing organization', 'Capital Mastery'],
      ['Issue date', formatMonthYear(credential.issued_at)],
      ['Credential ID', credential.credential_id],
      ['Credential URL', url]
    ];
    openModal(`<h2>Add to LinkedIn</h2><p>Use the verified D1 credential details below.</p>${fields.map(([label, value]) => `<label>${esc(label)}</label><div class="copy-row" style="background:#f5f7f9;color:#24303d">${esc(value)}</div><button class="btn btn-soft btn-sm" data-copy-value="${esc(value)}">Copy</button>`).join('')}<div class="modal-actions"><button class="btn btn-outline" data-cm-live-close>Close</button><a class="btn btn-primary" href="https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME" target="_blank" rel="noopener">Open LinkedIn →</a></div>`);
  }

  function postText(credential) {
    return `I earned the Capital Mastery ${credential.credential_title}. I completed the required learning and assessments under an 80% mastery standard.\n\nVerified credential: ${verifyUrl(credential)}\n\n#Finance #CapitalMastery`;
  }

  function openPostModal(credential) {
    openModal(`<h2>Create LinkedIn Post</h2><p>This post links to the live public verification record.</p><textarea id="cm-live-post-text" style="width:100%;min-height:210px">${esc(postText(credential))}</textarea><div class="modal-actions"><button class="btn btn-outline" data-cm-live-close>Close</button><button class="btn btn-primary" id="cm-live-copy-post">Copy & Open LinkedIn →</button></div>`);
    document.getElementById('cm-live-copy-post')?.addEventListener('click', async () => {
      await copy(document.getElementById('cm-live-post-text')?.value || '');
      window.open('https://www.linkedin.com/feed/', '_blank', 'noopener');
    });
  }

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  function renderVerificationMark(el, seed) {
    if (!el) return;
    const size = 21;
    let hash = 2166136261;
    for (const ch of String(seed)) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const bits = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const finder = (x < 7 && y < 7) || (x >= 14 && y < 7) || (x < 7 && y >= 14);
        const on = finder
          ? (x % 6 === 0 || y % 6 === 0 || ((x % 6 >= 2 && x % 6 <= 4) && (y % 6 >= 2 && y % 6 <= 4)))
          : (((hash >>> ((x + y) % 24)) & 1) ^ ((x * y + y) % 3 === 0));
        bits.push(on ? 1 : 0);
      }
    }
    el.style.display = 'grid';
    el.style.gridTemplateColumns = `repeat(${size},1fr)`;
    el.innerHTML = bits.map(b => `<i style="display:block;background:${b ? '#071a33' : '#fff'}"></i>`).join('');
    el.title = 'Capital Mastery verification mark';
  }

  async function enhanceIssuedResult() {
    const issued = document.querySelector('.cm-issued');
    if (!issued || issued.dataset.cmLiveEnhanced === '1' || enhanceBusy || !window.CM_AUTH?.user) return;
    enhanceBusy = true;
    try {
      const credentials = await fetchCredentials();
      const anchors = [...issued.querySelectorAll('a[href^="#/verify/"]')];
      const matched = anchors.map(a => {
        const token = decodeURIComponent(a.getAttribute('href').split('/').pop() || '');
        return credentials.find(c => c.public_token === token);
      }).filter(Boolean);
      if (matched.length) {
        issued.dataset.cmLiveEnhanced = '1';
        const toolbar = document.createElement('div');
        toolbar.className = 'cm-issued-tools';
        toolbar.innerHTML = matched.map(c => `<div class="cm-issued-tool-row"><a class="btn btn-gold btn-sm" href="#/certificate/${encodeURIComponent(c.pathway_id)}/${encodeURIComponent(c.credential_level)}">View Certificate</a><button class="btn btn-outline btn-sm" data-cm-live-linkedin="${esc(c.credential_id)}">Add to LinkedIn</button><a class="btn btn-soft btn-sm" href="#/credential/${encodeURIComponent(c.pathway_id)}/${encodeURIComponent(c.credential_level)}">Credential Details</a></div>`).join('');
        issued.appendChild(toolbar);
        bindCredentialButtons(matched);
      }
    } catch (error) {
      console.warn('Could not enhance newly issued credential result:', error);
    } finally {
      enhanceBusy = false;
    }
  }

  async function route() {
    const [root, a, b] = hashParts();

    if (a && careerById(a) && window.CM_AUTH?.ready && window.CM_AUTH?.user && ['career', 'learn', 'quiz', 'official-simulation', 'simulation', 'final', 'achievement', 'credential', 'certificate'].includes(root)) {
      const changed = await syncOfficialProgress(a);
      const key = `${location.hash}|${window.CM_AUTH.user.uid}`;
      if (changed && rerenderGuard !== key && !['credential', 'certificate', 'achievement'].includes(root)) {
        rerenderGuard = key;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
      }
    }

    // Admin QA certificate/credential previews are intentionally local and must
    // not be replaced by the authoritative renderer. Normal learner routes stay
    // authoritative. This only applies to a backend-verified admin with QA mode on.
    if (adminQaPreviewActive() && ['credential','certificate','achievement'].includes(root)) return;

    if (root === 'credentials') return renderCredentials();
    if (root === 'credential' && a && b) return renderCredentialDetail(a, b);
    if (root === 'certificate' && a && b) return renderCertificate(a, b);
    if (root === 'achievement' && a && b) return renderAchievement(a, b);

    setTimeout(enhanceIssuedResult, 40);
  }

  function injectStyles() {
    if (document.getElementById('cm-live-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-live-ui-styles';
    style.textContent = `
      .cm-live-credential{display:flex;flex-direction:column;gap:4px}.cm-live-credential h3{color:var(--navy);font-size:1.2rem}.cm-live-actions{display:grid;gap:8px;margin-top:auto;padding-top:12px}.cm-live-warning{padding:10px 12px;border-radius:10px;background:#fff0f0;color:#8b3232}.cm-live-verified-banner{max-width:1120px;margin:0 auto 14px;padding:10px 14px;border-radius:10px;background:#eaf6ef;color:#245b43;font-weight:800;text-align:center}.cm-cert-verify-url{font-size:.68rem;color:#5d6670;text-align:center;margin-top:12px;word-break:break-all}.cm-issued-tools{display:grid;gap:8px;margin-top:10px}.cm-issued-tool-row{display:flex;gap:8px;flex-wrap:wrap}.cm-v2-evidence-detail{display:grid;margin-top:20px}.cm-v2-evidence-detail>div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #e3e7e9}.cm-v2-evidence-detail>div span{color:#53616e}.cm-live-modal label{display:block;font-weight:800;color:var(--navy);margin-top:12px}.cm-live-modal textarea{border:1px solid #cbd2da;border-radius:10px;padding:12px}.cert-toolbar{flex-wrap:wrap}
      @media(max-width:700px){.cm-issued-tool-row{display:grid}.cm-issued-tool-row .btn{width:100%}.cert-toolbar .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('hashchange', () => setTimeout(route, 20));
  document.addEventListener('cm-auth-changed', () => setTimeout(route, 20));
  const observer = new MutationObserver(() => setTimeout(enhanceIssuedResult, 20));
  observer.observe(document.documentElement, { subtree: true, childList: true });
  injectStyles();
  setTimeout(route, 50);
})();
