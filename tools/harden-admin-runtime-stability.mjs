import fs from 'node:fs';

const load=p=>fs.readFileSync(p,'utf8');
const save=(p,s)=>fs.writeFileSync(p,s);
function once(text,from,to,label){
  const i=text.indexOf(from);
  if(i<0) throw new Error(`Missing patch target: ${label}`);
  if(text.indexOf(from,i+from.length)>=0) throw new Error(`Ambiguous patch target: ${label}`);
  return text.slice(0,i)+to+text.slice(i+from.length);
}

// ---------------------------------------------------------------------------
// 1) Make the two-track decorator idempotent and compatible with Admin QA.
// ---------------------------------------------------------------------------
const tracksPath='training-tracks.js';
let tracks=load(tracksPath);

tracks=once(
  tracks,
  `  function setTrack(careerId, track) {`,
  `  function adminQaPreviewActive() {\n    return window.CM_AUTH?.ready === true &&\n      window.CM_AUTH?.isAdmin === true &&\n      localStorage.getItem('capitalMasteryQaPreviewV1') === 'true';\n  }\n\n  function setTrack(careerId, track) {`,
  'admin QA preview helper'
);

tracks=once(
  tracks,
  `<div class="cm-track-status" data-cm-track-status>`,
  `<div class="cm-track-status" data-cm-track-status data-cm-track-status-id="${'${track}'}">`,
  'track status identity'
);

tracks=once(
  tracks,
  `<section class="cm-track-sequence" data-cm-track-sequence>`,
  `<section class="cm-track-sequence" data-cm-track-sequence data-cm-track-id="${'${trackId}'}">`,
  'track sequence identity'
);

tracks=once(
  tracks,
  `    root.querySelector('[data-cm-track-sequence]')?.remove();\n    pathList.insertAdjacentHTML('afterend',trackSequenceHtml(careerId,trackId));`,
  `    const existing=root.querySelector('[data-cm-track-sequence]');\n    if(existing?.dataset.cmTrackId===trackId) return;\n    if(existing) existing.remove();\n    pathList.insertAdjacentHTML('afterend',trackSequenceHtml(careerId,trackId));`,
  'idempotent sequence rendering'
);

tracks=once(
  tracks,
  `    document.querySelectorAll('.career-card .cred-count').forEach(el => {\n      el.textContent = 'Career Skills: 4 credentials · Professional Readiness: 5 credentials';\n      el.classList.add('cm-track-count');\n    });`,
  `    document.querySelectorAll('.career-card .cred-count').forEach(el => {\n      const copy='Career Skills: 4 credentials · Professional Readiness: 5 credentials';\n      if(el.textContent!==copy) el.textContent=copy;\n      if(!el.classList.contains('cm-track-count')) el.classList.add('cm-track-count');\n    });`,
  'idempotent directory labels'
);

tracks=once(
  tracks,
  `    chooser.querySelectorAll('[data-cm-track-card]').forEach(card => {\n      card.dataset.selected = String(card.dataset.cmTrackCard === track);\n    });\n    chooser.querySelectorAll('[data-cm-select-track]').forEach(button => {\n      const selected = button.dataset.cmSelectTrack === track;\n      button.setAttribute('aria-pressed', String(selected));\n      button.textContent = selected ? 'Selected' : 'Choose this program';\n      button.classList.toggle('btn-gold', selected);\n      button.classList.toggle('btn-outline', !selected);\n      button.onclick = () => setTrack(careerId, button.dataset.cmSelectTrack);\n    });`,
  `    chooser.querySelectorAll('[data-cm-track-card]').forEach(card => {\n      const value=String(card.dataset.cmTrackCard === track);\n      if(card.dataset.selected!==value) card.dataset.selected=value;\n    });\n    chooser.querySelectorAll('[data-cm-select-track]').forEach(button => {\n      const selected = button.dataset.cmSelectTrack === track;\n      const pressed=String(selected);\n      const label=selected ? 'Selected' : 'Choose this program';\n      if(button.getAttribute('aria-pressed')!==pressed) button.setAttribute('aria-pressed',pressed);\n      if(button.textContent!==label) button.textContent=label;\n      button.classList.toggle('btn-gold', selected);\n      button.classList.toggle('btn-outline', !selected);\n      button.onclick = () => setTrack(careerId, button.dataset.cmSelectTrack);\n    });`,
  'idempotent chooser rendering'
);

tracks=once(
  tracks,
  `    const pathList = root.querySelector('.career-summary .path-list');\n    if (pathList) {\n      root.querySelector('[data-cm-track-status]')?.remove();\n      pathList.insertAdjacentHTML('beforebegin', selectedStatusHtml(track));\n      root.querySelector('[data-cm-switch-track]')?.addEventListener('click', e => {\n        setTrack(careerId, e.currentTarget.dataset.cmSwitchTrack);\n      });\n    }`,
  `    const pathList = root.querySelector('.career-summary .path-list');\n    if (pathList) {\n      let status=root.querySelector('[data-cm-track-status]');\n      if(!status || status.dataset.cmTrackStatusId!==track){\n        status?.remove();\n        pathList.insertAdjacentHTML('beforebegin', selectedStatusHtml(track));\n        status=root.querySelector('[data-cm-track-status]');\n      }\n      const switchButton=status?.querySelector('[data-cm-switch-track]');\n      if(switchButton) switchButton.onclick = e => setTrack(careerId, e.currentTarget.dataset.cmSwitchTrack);\n    }`,
  'idempotent selected status rendering'
);

tracks=once(
  tracks,
  `    badge.textContent = 'Professional Readiness only';`,
  `    if(badge.textContent !== 'Professional Readiness only') badge.textContent = 'Professional Readiness only';`,
  'idempotent final badge'
);

tracks=once(
  tracks,
  `    badge.textContent = track === PROFESSIONAL ? 'Builds toward Role Lab' : 'Career Skills capstone';`,
  `    const badgeCopy=track === PROFESSIONAL ? 'Builds toward Role Lab' : 'Career Skills capstone';\n    if(badge.textContent!==badgeCopy) badge.textContent=badgeCopy;`,
  'idempotent capstone badge'
);

tracks=once(
  tracks,
  `    if(route==='simulation'&&pathwayId&&getTrack(pathwayId)===PROFESSIONAL){`,
  `    if(route==='simulation'&&pathwayId&&getTrack(pathwayId)===PROFESSIONAL&&!adminQaPreviewActive()){`,
  'admin simulation preview exemption'
);

save(tracksPath,tracks);

// ---------------------------------------------------------------------------
// 2) Make the Admin / QA page current and give Simulation Lab a direct preview.
// ---------------------------------------------------------------------------
const appPath='app.js';
let app=load(appPath);
app=once(
  app,
  `Full feature preview without hard-coding an admin password. Firebase will later protect this area with a server-verified admin claim.`,
  `Server-verified Admin / QA workspace. Preview controls stay isolated from authoritative learner progress, D1 credentials, and employer data unless a tool explicitly says otherwise.`,
  'admin security copy'
);
app=once(
  app,
  `<div class="admin-card"><h3>Credential Lab</h3><p>Preview all three certificate levels without creating a live verified record.</p>`,
  `<div class="admin-card"><h3>Legacy Credential Compatibility Lab</h3><p>Preview the original Foundations, Applied Skills, and Career certificate surfaces without creating a live verified record. Standard 2.0 credentials are tested through the evidence-backed credential and verification flows.</p>`,
  'credential lab clarity'
);
app=once(
  app,
  `<div class="admin-card"><h3>Simulation Lab</h3><p>Open the secure Investment Banking Analyst Workbench.</p><a class="btn btn-primary btn-sm" href="#/official-simulation/investment-banking">Open Project Northstar</a></div>`,
  `<div class="admin-card"><h3>Simulation Lab</h3><p>Open the local Admin QA version of Project Northstar without learner prerequisites. QA Preview Mode is enabled automatically and no authoritative D1 score or credential is created.</p><a class="btn btn-primary btn-sm" data-cm-admin-sim-preview="true" href="#/simulation/investment-banking">Open Admin Simulation Preview</a></div>`,
  'direct admin simulation preview'
);
save(appPath,app);

// ---------------------------------------------------------------------------
// 3) Bring Madeline's guidance into the two-track architecture.
// ---------------------------------------------------------------------------
const madelinePath='madeline.js';
let madeline=load(madelinePath);
madeline=once(madeline,`    'How do the 3 certificates work?',`,`    'How do the two program levels work?',`,'Madeline quick action');
madeline=once(
  madeline,
  `  function currentCareerState(c=currentCareer()) {\n    return c ? readState()?.careers?.[c.id] || {} : {};\n  }`,
  `  function currentCareerState(c=currentCareer()) {\n    return c ? readState()?.careers?.[c.id] || {} : {};\n  }\n\n  function selectedTrack(c=currentCareer()) {\n    if(!c) return 'professional-readiness';\n    return window.CM_TRAINING_TRACKS?.getTrack?.(c.id) || 'professional-readiness';\n  }`,
  'Madeline track helper'
);

madeline=once(
  madeline,
  `    if (!learned.includes(5)) return \`Next is Part 5, the Job Simulation section. Read the briefing and click <b>Mark Learning Complete</b>.${'${action(\'Open Part 5\',`#/learn/${c.id}/5`)}'}\`;\n    if (Number(cs.simulationKnowledge || 0) < PASS) return \`Next, pass the Part 5 knowledge check with <b>${'${PASS}'}%+</b>.${'${action(\'Take Part 5 knowledge check\',`#/quiz/${c.id}/5`)}'}\`;\n    if (Number(cs.simulationScore || 0) < PASS) return \`You’re ready for the <b>official server-graded job simulation</b>.${'${action(\'Open official simulation\',`#/official-simulation/${c.id}`)}'}\`;\n    if (Number(cs.finalScore || 0) < PASS) return \`You passed the simulation. Your next step is the <b>Professional Readiness Final</b>.${'${action(\'Take readiness final\',`#/final/${c.id}`)}'}\`;\n    return \`You’ve met the recorded pathway requirements. Check your verified credentials.${'${action(\'Open Credentials\',\'#/credentials\')}'}\`;`,
  `    const track=selectedTrack(c);\n    if(track==='professional-readiness') {\n      return \`You’re on <b>Professional Readiness</b>. After the shared learning stages, continue through the verified advanced sequence on the career page: baseline diagnostic, Essentials, Applied Skills, Role Lab, Professional Final, then readiness evidence. I’ll send you to the authoritative pathway instead of a legacy simulation/final route.${'${action(`Continue ${c.title}`,`#/career/${c.id}`)}'}\`;\n    }\n    if (!learned.includes(5)) return \`Next is the <b>Career Skills capstone</b> section. Read the briefing and click <b>Mark Learning Complete</b>.${'${action(\'Open capstone learning\',`#/learn/${c.id}/5`)}'}\`;\n    if (Number(cs.simulationKnowledge || 0) < PASS) return \`Next, pass the Career Skills capstone knowledge check with <b>${'${PASS}'}%+</b>.${'${action(\'Take capstone knowledge check\',`#/quiz/${c.id}/5`)}'}\`;\n    if (Number(cs.simulationScore || 0) < PASS) return \`You’re ready for the <b>Career Skills practical simulation</b>.${'${action(\'Open Career Skills capstone\',`#/simulation/${c.id}`)}'}\`;\n    return \`You’ve completed the recorded Career Skills capstone requirements. Check your verified credentials, or upgrade to Professional Readiness without repeating earned stages.${'${action(\'Open Credentials\',\'#/credentials\')}'}${'${action(\'View Professional Readiness option\',`#/career/${c.id}`)}'}\`;`,
  'Madeline next-step two-track routing'
);

madeline=once(
  madeline,
  `It has 16 career pathways and 3 credential levels per pathway, with an ${'${PASS}'}% mastery standard.`,
  `It has 16 career pathways with two program levels: Career Skills (4 verified credentials) and Professional Readiness (5 career credentials), with an ${'${PASS}'}% mastery standard on required assessed work.`,
  'Madeline platform credential count'
);
madeline=once(
  madeline,
  `The mastery standard is <b>${'${PASS}'}%</b> on every required assessment, including the job simulation and Professional Readiness Final.`,
  `The mastery standard is <b>${'${PASS}'}%</b> on required assessed work. Career Skills ends with its practical capstone; Professional Readiness adds the advanced Role Lab and Professional Final.`,
  'Madeline mastery explanation'
);
madeline=once(
  madeline,
  `if (/(three certificates|3 certificates|credential levels|foundations certificate|applied skills|career certificate|how.*certificates work)/.test(q)) {\n      return \`<b>Each pathway has 3 credential levels:</b><br>• <b>Foundations:</b> pass Parts 1–2.<br>• <b>Applied Skills:</b> pass Parts 1–4.<br>• <b>Career Certificate:</b> pass Parts 1–5, the official simulation, and the Professional Readiness Final.<br><br>Required assessments use the ${'${PASS}'}% standard.${'${action(\'View Credentials\',\'#/credentials\')}'}\`;\n    }`,
  `if (/(two program|program levels|career skills|professional readiness|three certificates|3 certificates|credential levels|foundations certificate|applied skills|career certificate|how.*certificates work)/.test(q)) {\n      return \`<b>Every career has two program levels:</b><br>• <b>Career Skills:</b> 4 verified credentials — Foundations, Essentials, Applied Skills, and the Career Skills Certificate after the practical capstone.<br>• <b>Professional Readiness:</b> 5 career credentials — Foundations, Essentials, Applied Skills, Role Lab, and the flagship Professional Readiness credential.<br><br>Career Skills work carries forward if you upgrade; you do not repeat earned stages.${'${action(\'View Credentials\',\'#/credentials\')}'}\`;\n    }`,
  'Madeline credential hierarchy'
);
madeline=once(
  madeline,
  `The official job simulation unlocks after the Part 5 knowledge check. It is server graded and stored in official progress; the Career Certificate requires ${'${PASS}'}%+ on it.`,
  `Career Skills ends with a practical role-specific capstone simulation. Professional Readiness goes further with the advanced Role Lab, review/revision evidence, and Professional Final. Open the selected career to see the correct simulation for your program level.`,
  'Madeline simulation explanation'
);
madeline=once(
  madeline,
  `The <b>Professional Readiness Final</b> comes after the official job simulation and checks knowledge, calculations and workflow judgment. It is a separate ${'${PASS}'}% gate; it does not replace the practical work product.`,
  `The <b>Professional Readiness Final</b> belongs only to the advanced Professional Readiness program. It comes after the Role Lab and checks knowledge, calculations, and workflow judgment; Career Skills does not require this final.`,
  'Madeline final explanation'
);
save(madelinePath,madeline);

console.log('Admin QA + runtime stability hardening applied.');
