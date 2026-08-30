import fs from 'node:fs';

function replaceOnce(path, before, after, label) {
  let src = fs.readFileSync(path, 'utf8');
  const at = src.indexOf(before);
  if (at < 0) throw new Error(`Missing patch target: ${label}`);
  if (src.indexOf(before, at + before.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  src = src.slice(0, at) + after + src.slice(at + before.length);
  fs.writeFileSync(path, src);
}

function replaceBetween(path, start, end, replacement, label) {
  let src = fs.readFileSync(path, 'utf8');
  const a = src.indexOf(start);
  if (a < 0) throw new Error(`Missing start target: ${label}`);
  if (src.indexOf(start, a + start.length) >= 0) throw new Error(`Ambiguous start target: ${label}`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`Missing end target: ${label}`);
  src = src.slice(0, a) + replacement + '\n\n' + src.slice(b);
  fs.writeFileSync(path, src);
}

// The Admin QA route must never share the learner simulation namespace. The
// protected /admin-preview prefix is already guarded before app.js loads and only
// resumes after backend role verification completes.
replaceOnce(
  'app.js',
  `  function qaMode(){ return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true'; }`,
  `  function qaMode(){ return window.CM_AUTH?.ready === true && window.CM_AUTH?.backendVerified === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true'; }`,
  'base QA mode backend verification'
);

replaceOnce(
  'app.js',
  `  function simulationPage(c){\n    if(c.id==='investment-banking' && !qaMode()){ location.hash=\`#/official-simulation/\${c.id}\`; return; }\n    const cs=getCareerState(c.id); if(!qaMode() && Number(cs.simulationKnowledge||0)<PASS){ toast('Pass the Part 5 knowledge check first.','warn'); return nav(\`learn/\${c.id}/5\`); }`,
  `  function simulationPage(c, forceAdminPreview=false){\n    const adminPreview = forceAdminPreview && qaMode();\n    if(c.id==='investment-banking' && !adminPreview && !qaMode()){ location.hash=\`#/official-simulation/\${c.id}\`; return; }\n    const cs=getCareerState(c.id); if(!adminPreview && !qaMode() && Number(cs.simulationKnowledge||0)<PASS){ toast('Pass the Part 5 knowledge check first.','warn'); return nav(\`learn/\${c.id}/5\`); }`,
  'local simulation explicit Admin-preview bypass'
);

replaceOnce(
  'app.js',
  `      if(root==='quiz'){const c=careerById(a);return c?quizPage(c,Number(b||1),false):home();}\n      if(root==='official-simulation'){\n        const c=careerById(a);\n        const adminQaPreview=window.CM_AUTH?.ready===true&&window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode();\n        if(adminQaPreview) return c?simulationPage(c):home();\n        // The secure assessment router owns this route for normal learners. Do not\n        // render Home first; that created a visible Home -> loading -> simulation flicker.\n        return;\n      }\n      if(root==='simulation'){const c=careerById(a);return c?simulationPage(c):home();}`,
  `      if(root==='quiz'){const c=careerById(a);return c?quizPage(c,Number(b||1),false):home();}\n      if(root==='admin-preview'&&a==='simulation'){\n        const c=careerById(b);\n        // admin-route-guard.js owns authorization for this namespace. Do not render\n        // a learner fallback while secure role verification is pending.\n        if(!qaMode()) return;\n        return c?simulationPage(c,true):adminPage();\n      }\n      if(root==='official-simulation'){\n        const c=careerById(a);\n        const adminQaPreview=window.CM_AUTH?.ready===true&&window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode();\n        if(adminQaPreview){\n          if(!c) return home();\n          location.replace(\`#/admin-preview/simulation/\${encodeURIComponent(c.id)}\`);\n          return;\n        }\n        // The secure assessment router owns this route for normal learners. Do not\n        // render Home first; that created a visible Home -> loading -> simulation flicker.\n        return;\n      }\n      if(root==='simulation'){const c=careerById(a);return c?simulationPage(c):home();}`,
  'protected Admin simulation route ownership'
);

replaceOnce(
  'admin-qa-simulation-fix.js',
  `    location.replace(\`#/simulation/\${encodeURIComponent(pathway)}\`);`,
  `    location.replace(\`#/admin-preview/simulation/\${encodeURIComponent(pathway)}\`);`,
  'Admin official-route normalization'
);
replaceOnce(
  'admin-qa-simulation-fix.js',
  `          link.href = '#/simulation/investment-banking';`,
  `          link.href = '#/admin-preview/simulation/investment-banking';`,
  'Admin Simulation Lab protected link'
);
replaceOnce(
  'admin-qa-simulation-fix.js',
  `      location.hash = adminPreview.getAttribute('href') || '#/simulation/investment-banking';`,
  `      location.hash = adminPreview.getAttribute('href') || '#/admin-preview/simulation/investment-banking';`,
  'Admin Simulation Lab click fallback'
);
replaceOnce(
  'admin-qa-simulation-fix.js',
  `    location.hash = \`#/simulation/\${encodeURIComponent(pathway)}\`;`,
  `    location.hash = \`#/admin-preview/simulation/\${encodeURIComponent(pathway)}\`;`,
  'Admin official-link capture protected target'
);

// Secure API work is cancellable and route-fenced. A response from a route the
// user has already left must never repaint the current screen.
replaceOnce(
  'capital-mastery-live.js',
  `  let authWaitSince = 0;\n  let authRetryTimer = null;`,
  `  let authWaitSince = 0;\n  let authRetryTimer = null;\n  let secureRouteEpoch = 0;\n  let secureRouteController = null;\n\n  function beginSecureRoute() {\n    secureRouteEpoch += 1;\n    if (secureRouteController) secureRouteController.abort();\n    secureRouteController = new AbortController();\n    return { epoch:secureRouteEpoch, hash:location.hash, signal:secureRouteController.signal };\n  }\n\n  function secureRouteCurrent(epoch, hash) {\n    return epoch === secureRouteEpoch && hash === location.hash && !secureRouteController?.signal.aborted;\n  }`,
  'secure route cancellation state'
);

replaceBetween(
  'capital-mastery-live.js',
  `  async function renderAssessment(pathwayId, itemId) {`,
  `  function showInlineError(form, message) {`,
  `  async function renderAssessment(pathwayId, itemId) {\n    if (!authReady()) {\n      waitForAuthReady('Checking your account…');\n      return;\n    }\n    clearAuthWait();\n    if (!signedIn()) {\n      renderAuthRequired();\n      return;\n    }\n\n    const renderEpoch = secureRouteEpoch;\n    const renderHash = location.hash;\n    const signal = secureRouteController?.signal;\n    renderLoading();\n    try {\n      const assignmentId=hashQuery().get('assignment')||'';\n      const query=assignmentId?\`?assignmentId=\${encodeURIComponent(assignmentId)}\`:'';\n      const data = await apiFetch(\`/assessment/\${encodeURIComponent(apiPathway(pathwayId))}/\${encodeURIComponent(itemId)}\${query}\`, { signal });\n      if (!secureRouteCurrent(renderEpoch, renderHash)) return;\n      const el = main();\n      if (!el) return;\n      const isSimulation = itemId === 'simulation';\n      const isFinal = itemId === 'final';\n      if (isSimulation && data.simulationProfile?.kind === 'ib-deal-workbench-v2') {\n        renderIbSimulationWorkbench(data, pathwayId, itemId, el);\n        return;\n      }\n      if (isSimulation && data.simulationProfile?.kind === 'career-workbench-v2') {\n        renderCareerSimulationWorkbench(data, pathwayId, itemId, el);\n        return;\n      }\n      const label = isSimulation ? 'OFFICIAL JOB SIMULATION' : isFinal ? 'FINAL EXAMINATION' : \`OFFICIAL \${itemId.toUpperCase()} ASSESSMENT\`;\n      el.innerHTML = \`<section class="cm-official-shell"><div class="container cm-official-wrap"><div class="cm-official-head"><div><div class="eyebrow">\${label}</div><h1>\${esc(data.pathway.title)}</h1><p>\${data.questionCount} questions\${isSimulation ? ' + written recommendation' : ''} · \${data.masteryScore}% required · Server graded</p></div><a class="btn btn-outline" href="#/career/\${encodeURIComponent(pathwayId)}">Exit</a></div><div class="cm-security-note"><strong>Verified assessment:</strong> answers are graded by the Cloudflare Worker and official scores are stored in D1. Browser-edited scores cannot issue a credential.</div><form id="cm-official-form">\${data.questions.map(questionHtml).join('')}\${data.writingPrompt ? \`<div class="cm-writing"><h3>Written recommendation</h3><p>\${esc(data.writingPrompt)}</p><textarea name="writing" maxlength="5000" required placeholder="Write a concise, evidence-based recommendation…"></textarea></div>\` : ''}<button class="btn btn-primary btn-block" type="submit">Submit Official \${isFinal ? 'Final Exam' : isSimulation ? 'Simulation' : 'Assessment'}</button></form></div></section>\`;\n\n      bindOfficialAssessmentSubmit(data, pathwayId, itemId);\n    } catch (error) {\n      if (error?.name === 'AbortError' || !secureRouteCurrent(renderEpoch, renderHash)) return;\n      const el = main();\n      if (!el) return;\n      el.innerHTML = \`<section class="section"><div class="container" style="max-width:820px"><div class="card cm-live-card"><div class="eyebrow">OFFICIAL ASSESSMENT</div><h1 class="serif">Not available yet.</h1><p>\${esc(error.message)}</p><a class="btn btn-primary" href="#/career/\${encodeURIComponent(pathwayId)}">Back to pathway →</a></div></div></section>\`;\n    }\n  }`,
  'secure assessment stale-response fence'
);

replaceOnce(
  'capital-mastery-live.js',
  `  async function route() {\n    const p = hashParts();\n    const [root, a, b] = p;\n    const adminQaPreview = window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';\n    // Admin QA deliberately falls back to the local preview renderer for knowledge, final, and simulation routes.\n    // It does not call the authoritative submit endpoint, write D1 scores, or issue credentials.\n    if (adminQaPreview && (root === 'quiz' || root === 'final' || root === 'official-simulation')) return;`,
  `  async function route() {\n    beginSecureRoute();\n    const p = hashParts();\n    const [root, a, b] = p;\n    const adminQaPreview = window.CM_AUTH?.ready === true && window.CM_AUTH?.backendVerified === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';\n    // The secure renderer never owns the protected Admin namespace. Entering it\n    // aborts any in-flight learner request before that request can paint stale DOM.\n    if (root === 'admin-preview') { clearAuthWait(); return; }\n    if (adminQaPreview && root === 'official-simulation' && a) {\n      clearAuthWait();\n      location.replace(\`#/admin-preview/simulation/\${encodeURIComponent(a)}\`);\n      return;\n    }\n    // Admin QA deliberately falls back to local preview renderers. It does not call\n    // authoritative submit endpoints, write D1 scores, or issue credentials.\n    if (adminQaPreview && (root === 'quiz' || root === 'final')) return;`,
  'secure router Admin ownership and abort boundary'
);

// Encoding defects are critical UI defects too. Normalize the known mojibake that
// appears in the secure-assessment surfaces rather than shipping broken glyphs.
{
  const path='capital-mastery-live.js';
  let src=fs.readFileSync(path,'utf8');
  for (const [bad,good] of [['â¦','…'],['â','→'],['Â·','·'],['â','✓']]) src=src.split(bad).join(good);
  fs.writeFileSync(path,src);
}

for (const path of ['app.js','capital-mastery-live.js','admin-qa-simulation-fix.js','training-tracks.js','tests/admin-simulation-route-ownership-audit.mjs','tests/admin-simulation-route-stability-browser-audit.cjs']) {
  if (!fs.existsSync(path)) throw new Error(`Expected critical-route file missing: ${path}`);
}

const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
if (!app.includes("root==='admin-preview'&&a==='simulation'")) throw new Error('Protected Admin simulation namespace was not installed');
if (!app.includes('simulationPage(c,true)')) throw new Error('Admin route does not force local simulation preview');
if (!admin.includes('#/admin-preview/simulation/investment-banking')) throw new Error('Admin Simulation Lab still lacks protected route');
if (!live.includes('secureRouteEpoch') || !live.includes('AbortController') || !live.includes('secureRouteCurrent')) throw new Error('Secure assessment stale-response fence missing');
if (live.includes('Loading secure assessmentâ¦')) throw new Error('Secure assessment mojibake remains');

console.log('Patched critical Admin simulation auth/route race, isolated the Admin namespace, cancelled stale secure requests, and normalized secure UI encoding.');
