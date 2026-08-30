(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const CHAT_KEY = 'cmMadelineChatV2';
  const PASS = 80;
  const CONTACT_EMAIL = 'avadhanula.shriyan@gmail.com';
  const LINKEDIN_URL = 'https://www.linkedin.com/in/shriyan-avadhanula-744190428/';

  const QUICK = [
    'What should I do next?',
    'Where is my certificate?',
    'What is my credential ID?',
    'Why do I need Mark Complete?',
    'How do I add a credential to LinkedIn?',
    'My progress looks wrong',
    'How do the two program levels work?',
    'Can I retake a quiz?'
  ];

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function norm(v='') {
    return String(v).toLowerCase().replace(/[^a-z0-9%&+\s'-]/g,' ').replace(/\s+/g,' ').trim();
  }

  function routeParts() {
    return String(location.hash || '#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
  }

  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return s && s.version === 1 ? s : null;
    } catch (_) { return null; }
  }

  function currentCareer() {
    const [, id] = routeParts();
    return window.CM_DATA?.careers?.find(c => c.id === id) || null;
  }

  function currentCareerState(c=currentCareer()) {
    return c ? readState()?.careers?.[c.id] || {} : {};
  }

  function selectedTrack(c=currentCareer()) {
    if(!c) return 'professional-readiness';
    return window.CM_TRAINING_TRACKS?.getTrack?.(c.id) || 'professional-readiness';
  }

  function firstName() {
    const raw = window.CM_CERT_NAME?.get?.() || window.CM_AUTH?.user?.displayName || '';
    return String(raw).trim().split(/\s+/)[0] || '';
  }

  function action(label, hash) {
    return `<a class="cm-madeline-action" href="${esc(hash)}">${esc(label)} →</a>`;
  }

  function external(label, url) {
    return `<a class="cm-madeline-action" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  }

  async function token() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function getCredentials() {
    if (!window.CM_AUTH?.user || !API) return [];
    try {
      const t = await token();
      if (!t) return [];
      const response = await fetch(`${API}/credentials/me`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await response.json().catch(() => ({}));
      return response.ok && Array.isArray(data.credentials) ? data.credentials : [];
    } catch (_) { return []; }
  }

  function findCareer(q) {
    const text = norm(q);
    const careers = window.CM_DATA?.careers || [];
    const extras = {
      'investment-banking':['ib','investment banker'],
      'private-equity':['pe'],
      'venture-capital':['vc'],
      'equity-research':['er'],
      'sales-trading':['sales and trading','s&t'],
      'quantitative-finance':['quant','quant finance'],
      'fp-and-a':['fpa','fp&a','financial planning and analysis'],
      'fpa':['fpa','fp&a','financial planning and analysis'],
      'real-estate-finance':['real estate','ref']
    };
    return careers.find(c => {
      const candidates = [c.title, c.role, ...(extras[c.id] || [])].map(norm).filter(x => x.length > 2);
      return candidates.some(x => text.includes(x));
    }) || null;
  }

  function nextStep() {
    const c = currentCareer();
    if (!c) {
      return `Open <b>My Learning</b> to continue an existing pathway, or choose a career to start.${action('My Learning','#/passport')}${action('Explore careers','#/careers')}`;
    }
    const cs = currentCareerState(c);
    const learned = Array.isArray(cs.learningComplete) ? cs.learningComplete : [];
    const done = Array.isArray(cs.completedParts) ? cs.completedParts : [];
    const quizzes = cs.quizScores || {};
    for (let p=1; p<=4; p++) {
      if (!learned.includes(p)) return `In <b>${esc(c.title)}</b>, your next step is Part ${p}. Finish the lesson, then click <b>Mark Learning Complete</b>.${action(`Open Part ${p}`,`#/learn/${c.id}/${p}`)}`;
      if (!done.includes(p) || Number(quizzes[p] || 0) < PASS) return `You finished the Part ${p} lesson. Now pass the official Part ${p} assessment with <b>${PASS}%+</b>.${action(`Take Part ${p} assessment`,`#/quiz/${c.id}/${p}`)}`;
    }
    const track=selectedTrack(c);
    if(track==='professional-readiness') {
      return `You’re on <b>Professional Readiness</b>. After the shared learning stages, continue through the verified advanced sequence on the career page: baseline diagnostic, Essentials, Applied Skills, Role Lab, Professional Final, then readiness evidence. I’ll send you to the authoritative pathway instead of a legacy simulation/final route.${action(`Continue ${c.title}`,`#/career/${c.id}`)}`;
    }
    if (!learned.includes(5)) return `Next is the <b>Career Skills capstone</b> section. Read the briefing and click <b>Mark Learning Complete</b>.${action('Open capstone learning',`#/learn/${c.id}/5`)}`;
    if (Number(cs.simulationKnowledge || 0) < PASS) return `Next, pass the Career Skills capstone knowledge check with <b>${PASS}%+</b>.${action('Take capstone knowledge check',`#/quiz/${c.id}/5`)}`;
    if (Number(cs.simulationScore || 0) < PASS) return `You’re ready for the <b>Career Skills practical simulation</b>.${action('Open Career Skills capstone',`#/official-simulation/${c.id}`)}`;
    return `You’ve completed the recorded Career Skills capstone requirements. Check your verified credentials, or upgrade to Professional Readiness without repeating earned stages.${action('Open Credentials','#/credentials')}${action('View Professional Readiness option',`#/career/${c.id}`)}`;
  }

  function progress() {
    const c = currentCareer();
    if (!c) return `Your dashboard is under <b>My Learning</b>.${action('Open My Learning','#/passport')}`;
    const cs = currentCareerState(c);
    const completed = Array.isArray(cs.completedParts) ? cs.completedParts.length : 0;
    const scores = [1,2,3,4].map(p => Number(cs.quizScores?.[p] || 0));
    const scoreText = scores.map((s,i)=>s ? `Part ${i+1}: ${s}%` : '').filter(Boolean).join(' · ') || 'No Part 1–4 scores yet';
    return `<b>${esc(c.title)} progress</b><br>${Math.min(100, completed*20)}% pathway-stage completion<br>${esc(scoreText)}${cs.simulationKnowledge ? `<br>Part 5 knowledge: ${Number(cs.simulationKnowledge)}%` : ''}${cs.simulationScore ? `<br>Simulation: ${Number(cs.simulationScore)}%` : ''}${cs.finalScore ? `<br>Final: ${Number(cs.finalScore)}%` : ''}<br><br>${nextStep()}`;
  }

  async function credentialHelp(idOnly=false) {
    if (!window.CM_AUTH?.user) return `Sign in first so I can check credentials attached to your account.${action('Sign in','#/login')}`;
    const all = await getCredentials();
    const active = all.filter(c => c.status === 'active');
    if (!active.length) return `I don’t see an active verified credential on this account yet. Credentials issue automatically after you meet the required official milestones.${action('My Learning','#/passport')}`;
    const newest = active[0];
    if (idOnly) return `Your most recent active credential is <b>${esc(newest.credential_title)}</b>.<br><b>Credential ID:</b> ${esc(newest.credential_id)}${action('Open credential details',`#/credential/${newest.pathway_id}/${newest.credential_level}`)}${action('View all credentials','#/credentials')}`;
    return `You have <b>${active.length}</b> active verified credential${active.length===1?'':'s'}. Your newest is <b>${esc(newest.credential_title)}</b>.${action('View certificate',`#/certificate/${newest.pathway_id}/${newest.credential_level}`)}${action('View all credentials','#/credentials')}`;
  }

  function careerInfo(c) {
    return `<b>${esc(c.title)}</b> prepares learners for <b>${esc(c.role)}</b>. ${esc(c.purpose || '')}<br><br>The pathway moves through foundations, technical learning, professional tools, applied work, and simulation.${action(`Open ${c.title}`,`#/career/${c.id}`)}`;
  }

  async function answer(raw) {
    const q = norm(raw);
    const namedCareer = findCareer(raw);
    if (!q) return `Ask me about courses, progress, quizzes, simulations, credentials, LinkedIn, or what to do next.`;

    if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/.test(q)) {
      return `Hi${firstName() ? `, ${esc(firstName())}` : ''}! I’m <b>Madeline</b>, your Capital Mastery guide. I can help you navigate the platform, understand your progress, find certificates, and figure out what comes next.`;
    }

    if (/(who are you|what are you|what can you do|help me)/.test(q)) {
      return `I’m <b>Madeline</b>, the built-in Capital Mastery guide. Ask me where something is, what a requirement means, what you should do next, how credentials work, or questions about any of the finance pathways.`;
    }

    if (namedCareer && /(what is|tell me|career|pathway|course|role|learn|do in)/.test(q)) return careerInfo(namedCareer);

    if (/(what is capital mastery|about capital mastery|what does capital mastery do)/.test(q)) {
      return `Capital Mastery is a free finance-career learning platform built around <b>Learn it. Practice it. Prove it.</b> It has 16 career pathways with two program levels: Career Skills (3 verified Standard 2.0 credentials + 1 program-completion certificate) and Professional Readiness (5 verified career credentials), with an ${PASS}% mastery standard on required assessed work.${action('Explore careers','#/careers')}`;
    }

    if (/(how do i start|where do i start|start learning|begin|new here|first step)/.test(q)) {
      return `Choose a career, sign in or create a free account, confirm the full name you want on credentials, then begin Part 1. After each lesson, click <b>Mark Learning Complete</b> and pass the official assessment with ${PASS}%+.${action('Explore careers','#/careers')}`;
    }

    if (/(what should i do next|what next|next step|where do i go next|continue)/.test(q)) return nextStep();
    if (/(my progress|progress status|how far|where am i|completion)/.test(q)) return progress();

    if (/(why.*sign in|why.*account|need.*account|create account|google sign|email sign)/.test(q)) {
      return `Your account connects official scores and coursework to the correct learner, syncs progress across devices, and lets Capital Mastery issue verified credentials. You can sign in with Google or email/password.${action('Open account','#/login')}`;
    }

    if (/(mark complete|mark learning|complete button|unlock.*quiz|why.*complete)/.test(q)) {
      return `After reading a lesson, click <b>Mark Learning Complete</b> before taking its assessment. That records the lesson as finished and unlocks the quiz. Passing is separate—you still need <b>${PASS}%+</b> on the official assessment.`;
    }

    if (/(pass score|mastery|how many.*correct|what score|80 percent|80%)/.test(q)) {
      return `The mastery standard is <b>${PASS}%</b> on required assessed work. Career Skills ends with its practical capstone; Professional Readiness adds the advanced Role Lab and Professional Final.`;
    }

    if (/(retake|try again|failed|fail quiz|didn't pass|did not pass)/.test(q)) {
      return `Yes. You can retake an assessment. Your official progress keeps the best recorded score, so a later lower attempt does not erase a better result.`;
    }

    if (/(back button|back arrow|lost progress|progress.*wrong|didn't save|did not save|not showing complete|reload|refresh)/.test(q)) {
      return `Submitted official scores are stored on your account. Quiz answers are also protected in the current tab while you work. If a pathway card ever looks stale after a submission, reload the page once; Capital Mastery also refreshes official progress when you continue.${action('My Learning','#/passport')}`;
    }

    if (/(where.*certificate|find.*certificate|my certificate|view certificate|download certificate)/.test(q)) return credentialHelp(false);
    if (/(credential id|certificate id|where.* id|find.* id)/.test(q)) return credentialHelp(true);

    if (/(two program|program levels|career skills|professional readiness|three certificates|3 certificates|credential levels|foundations certificate|applied skills|career certificate|how.*certificates work)/.test(q)) {
      return `<b>Every career has two program levels:</b><br>• <b>Career Skills:</b> 3 verified Standard 2.0 credentials — Foundations, Essentials, and Applied Skills — plus a separate Career Skills Program Completion Certificate after the practical capstone.<br>• <b>Professional Readiness:</b> 5 verified career credentials — Foundations, Essentials, Applied Skills, Role Lab, and the flagship Professional Readiness credential.<br><br>Career Skills work carries forward if you upgrade; you do not repeat earned stages.${action('View Credentials','#/credentials')}`;
    }

    if (/(linkedin|add.*credential|share.*credential|post.*certificate)/.test(q)) {
      return `Go to <b>Credentials</b>, open the credential, and choose <b>Add to LinkedIn</b>. Capital Mastery gives you the credential name, ID, issue date, and verification URL. You can also create a LinkedIn post from Credential Details.${action('Open Credentials','#/credentials')}`;
    }

    if (/(verify|verification|public credential|credential url|proof)/.test(q)) {
      return `Every active official credential has a public verification page backed by the secure Capital Mastery API and D1 record. Open the credential and choose <b>Public Verification</b>.${action('Open Credentials','#/credentials')}`;
    }

    if (/(pdf|png|download.*cert|print.*cert)/.test(q)) {
      return `Open your credential’s <b>View Certificate</b> page. From there you can use <b>Download / Print PDF</b> or <b>Download PNG</b>.${action('Open Credentials','#/credentials')}`;
    }

    if (/(change.*name|edit.*name|certificate name|credential name|wrong name)/.test(q)) {
      return `Open <b>Profile & Account</b> and use <b>Edit credential name</b>. Enter the full first and last name you want printed on future credentials. Already-issued credentials do not silently rewrite themselves.${action('Open Profile & Account','#/login')}`;
    }

    if (/(profile|account page|my account|where.*account|sign out|logout)/.test(q)) {
      return `Use the <b>profile button</b> in the header. On phones it appears as a round profile icon next to the menu. Your profile has My Learning, Credentials, your credential name, and sign-out controls.${action('Open Profile & Account','#/login')}`;
    }

    if (/(forgot password|reset password|password reset)/.test(q)) {
      return `Open the sign-in page, enter your email, then choose <b>Forgot password?</b>. Firebase will send the reset email.${action('Open sign in','#/login')}`;
    }

    if (/(simulation|job simulation|practical simulation)/.test(q)) {
      return `Career Skills ends with a practical role-specific capstone simulation. Professional Readiness goes further with the advanced Role Lab, review/revision evidence, and Professional Final. Open the selected career to see the correct simulation for your program level.${action('My Learning','#/passport')}`;
    }

    if (/(final exam|final examination|20 question)/.test(q)) {
      return `The <b>Professional Readiness Final</b> belongs only to the advanced Professional Readiness program. It comes after the Role Lab and checks knowledge, calculations, and workflow judgment; Career Skills does not require this final.`;
    }

    if (/(how many careers|career pathways|how many pathways|45|48 credentials|credentials total)/.test(q)) {
      return `Capital Mastery has <b>16 finance career pathways</b> and <b>3 credentials per pathway</b>, for 48 possible pathway credentials—marketed as 45+.`;
    }

    if (/(free|cost|price|paywall|payment)/.test(q)) {
      return `Capital Mastery is designed as a <b>free</b> learning platform. The account flow does not require payment information.`;
    }

    if (/(source|methodology|where.*information|credible|research)/.test(q)) {
      return `Capital Mastery maps public professional and occupational evidence into learning tasks, assessments, and simulations. You can review the methodology and source library here.${action('Research Methodology','#/methodology')}`;
    }

    if (/(compare careers|which career|difference between|versus| vs )/.test(q)) {
      return `Use Career Compare to look at target roles, purpose, deliverables, technical focus, career ladders, and final simulations side by side.${action('Compare careers','#/compare')}`;
    }

    if (/(phone|mobile|iphone|android|computer|desktop|device)/.test(q)) {
      return `Capital Mastery is a responsive web app. On mobile, use the round profile icon for your account and the menu button for navigation. Signed-in learning progress syncs through your account.`;
    }

    if (/(contact|email|founder|shriyan|feedback|report a bug)/.test(q)) {
      return `You can contact the founder from the About page, by email, or on LinkedIn.${external('Email Shriyan',`mailto:${CONTACT_EMAIL}`)}${external('Shriyan on LinkedIn',LINKEDIN_URL)}${action('About Capital Mastery','#/about')}`;
    }

    if (/(privacy|data|what do you store|personal data)/.test(q)) {
      return `Capital Mastery uses your account to connect learning progress, official assessment results, and credentials. Public credential verification is designed to show credential information without exposing your Firebase UID or email.${action('Privacy','#/privacy')}`;
    }

    return `I can help with <b>courses, quizzes, progress, simulations, certificates, credential IDs, LinkedIn, profile settings, and career pathways</b>. Try asking “What should I do next?” or choose one of the suggestions below.`;
  }

  function loadChat() {
    try {
      const x = JSON.parse(sessionStorage.getItem(CHAT_KEY) || '[]');
      return Array.isArray(x) ? x.slice(-20) : [];
    } catch (_) { return []; }
  }

  function saveChat(messages) {
    try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-20))); } catch (_) {}
  }

  let messages = loadChat();
  let open = false;
  let busy = false;

  function ensureRoot() {
    let root = document.getElementById('cm-madeline-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'cm-madeline-root';
    root.innerHTML = `
      <button class="cm-madeline-launch" type="button" aria-label="Open Madeline, Capital Mastery guide" aria-expanded="false">
        <span class="cm-madeline-orb">M</span><span class="cm-madeline-launch-label"><b>Madeline</b><small>Need help?</small></span>
      </button>
      <section class="cm-madeline-panel" hidden aria-label="Madeline chat assistant">
        <header class="cm-madeline-head"><div><span class="cm-madeline-avatar">M</span><div><strong>Madeline</strong><small>Capital Mastery Guide</small></div></div><button type="button" data-cm-madeline-close aria-label="Close Madeline">×</button></header>
        <div class="cm-madeline-body"><div class="cm-madeline-messages" role="log" aria-live="polite"></div><div class="cm-madeline-quick"></div></div>
        <form class="cm-madeline-form"><input type="text" name="question" maxlength="300" autocomplete="off" placeholder="Ask Madeline a question…" aria-label="Ask Madeline"><button type="submit">Send</button></form>
      </section>`;
    document.body.appendChild(root);
    root.querySelector('.cm-madeline-launch')?.addEventListener('click', () => setOpen(!open));
    root.querySelector('[data-cm-madeline-close]')?.addEventListener('click', () => setOpen(false));
    root.querySelector('.cm-madeline-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const input = e.currentTarget.elements.question;
      const text = String(input.value || '').trim();
      if (!text || busy) return;
      input.value = '';
      await send(text);
    });
    renderChat();
    return root;
  }

  function setOpen(value) {
    open = !!value;
    const root = ensureRoot();
    const panel = root.querySelector('.cm-madeline-panel');
    const launch = root.querySelector('.cm-madeline-launch');
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    root.classList.toggle('open', open);
    if (open) {
      if (!messages.length) {
        messages.push({ role:'bot', html:`Hi${firstName() ? `, ${esc(firstName())}` : ''}! I’m <b>Madeline</b>. Ask me anything about Capital Mastery—courses, progress, quizzes, credentials, or where to find something.` });
        saveChat(messages);
        renderChat();
      }
      setTimeout(() => root.querySelector('.cm-madeline-form input')?.focus(), 60);
    }
  }

  async function send(text) {
    messages.push({ role:'user', text:text.slice(0,300) });
    busy = true;
    renderChat(true);
    const html = await answer(text);
    messages.push({ role:'bot', html });
    busy = false;
    saveChat(messages);
    renderChat();
  }

  function renderChat(showTyping=false) {
    const root = ensureRoot();
    const list = root.querySelector('.cm-madeline-messages');
    const quick = root.querySelector('.cm-madeline-quick');
    list.innerHTML = messages.map(m => m.role === 'user'
      ? `<div class="cm-madeline-msg user">${esc(m.text)}</div>`
      : `<div class="cm-madeline-msg bot">${m.html}</div>`).join('') + (showTyping ? '<div class="cm-madeline-msg bot typing"><span></span><span></span><span></span></div>' : '');
    quick.innerHTML = QUICK.slice(0, messages.length ? 6 : 8).map(q => `<button type="button">${esc(q)}</button>`).join('');
    quick.querySelectorAll('button').forEach((b,i) => b.addEventListener('click', () => send(QUICK[i])));
    requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  }

  const style = document.createElement('style');
  style.id = 'cm-madeline-styles';
  style.textContent = `
    #cm-madeline-root{position:fixed;right:18px;bottom:18px;z-index:110;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .cm-madeline-launch{display:flex;align-items:center;gap:9px;border:1px solid rgba(216,181,107,.55);background:var(--navy);color:#fff;border-radius:999px;padding:7px 13px 7px 7px;box-shadow:0 16px 42px rgba(7,26,51,.26);cursor:pointer}.cm-madeline-launch:hover{transform:translateY(-1px)}
    .cm-madeline-orb,.cm-madeline-avatar{display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,var(--gold-2),var(--gold));color:var(--navy);font-weight:950}.cm-madeline-orb{width:38px;height:38px}.cm-madeline-avatar{width:38px;height:38px;flex:0 0 38px}
    .cm-madeline-launch-label{display:grid;text-align:left;line-height:1.05}.cm-madeline-launch-label b{font-size:.86rem}.cm-madeline-launch-label small{font-size:.68rem;color:#cad5e3;margin-top:3px}
    .cm-madeline-panel{position:absolute;right:0;bottom:58px;width:min(390px,calc(100vw - 24px));height:min(620px,calc(100vh - 105px));background:#fff;border:1px solid #d8dee5;border-radius:20px;overflow:hidden;box-shadow:0 28px 90px rgba(7,26,51,.3);display:grid;grid-template-rows:auto 1fr auto}
    .cm-madeline-head{display:flex;justify-content:space-between;align-items:center;padding:14px 15px;background:var(--navy);color:#fff}.cm-madeline-head>div{display:flex;gap:10px;align-items:center}.cm-madeline-head strong{display:block}.cm-madeline-head small{display:block;color:#c9d5e3;font-size:.72rem;margin-top:2px}.cm-madeline-head button{border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:9px;width:34px;height:34px;font-size:1.35rem}
    .cm-madeline-body{overflow:hidden;display:grid;grid-template-rows:1fr auto;background:#f5f7f9}.cm-madeline-messages{overflow:auto;padding:15px;display:flex;flex-direction:column;gap:10px}.cm-madeline-msg{max-width:88%;padding:10px 12px;border-radius:13px;line-height:1.45;font-size:.86rem}.cm-madeline-msg.user{align-self:flex-end;background:var(--navy);color:#fff;border-bottom-right-radius:4px}.cm-madeline-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e0e5ea;color:#394755;border-bottom-left-radius:4px}.cm-madeline-msg.bot b{color:var(--navy)}
    .cm-madeline-action{display:block;margin-top:7px;border:1px solid #d9e0e6;border-radius:9px;padding:7px 9px;background:#f8fafb;color:var(--navy);font-weight:800;text-decoration:none;font-size:.78rem}.cm-madeline-action:hover{border-color:var(--gold)}
    .cm-madeline-quick{display:flex;gap:6px;overflow:auto;padding:9px 12px 12px;border-top:1px solid #e1e5e9;background:#fff}.cm-madeline-quick button{border:1px solid #d8dfe5;background:#fff;color:var(--navy);border-radius:999px;padding:7px 9px;white-space:nowrap;font-size:.72rem;font-weight:750}
    .cm-madeline-form{display:grid;grid-template-columns:1fr auto;gap:7px;padding:11px;border-top:1px solid #dde3e8;background:#fff}.cm-madeline-form input{min-width:0;border:1px solid #ccd4dc;border-radius:11px;padding:11px 12px;outline:none}.cm-madeline-form input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(185,138,67,.12)}.cm-madeline-form button{border:0;border-radius:10px;background:var(--navy);color:#fff;padding:0 14px;font-weight:850}
    .cm-madeline-msg.typing{display:flex;gap:4px;width:47px}.cm-madeline-msg.typing span{width:6px;height:6px;border-radius:50%;background:#8f9aa6;animation:cmMadelineDot 1s infinite alternate}.cm-madeline-msg.typing span:nth-child(2){animation-delay:.15s}.cm-madeline-msg.typing span:nth-child(3){animation-delay:.3s}@keyframes cmMadelineDot{to{opacity:.25;transform:translateY(-2px)}}
    @media(max-width:680px){#cm-madeline-root{right:10px;bottom:10px}.cm-madeline-launch{padding:5px}.cm-madeline-launch-label{display:none}.cm-madeline-orb{width:42px;height:42px}.cm-madeline-panel{position:fixed;left:8px;right:8px;bottom:62px;width:auto;height:min(610px,calc(100dvh - 80px));border-radius:18px}.cm-madeline-msg{max-width:92%}}
    @media print{#cm-madeline-root{display:none!important}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  ensureRoot();
})();
