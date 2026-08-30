import fs from 'node:fs';

const load=p=>fs.readFileSync(p,'utf8');
const save=(p,s)=>fs.writeFileSync(p,s);
function once(text,from,to,label){const i=text.indexOf(from);if(i<0)throw new Error(`Missing patch target: ${label}`);if(text.indexOf(from,i+from.length)>=0)throw new Error(`Ambiguous patch target: ${label}`);return text.slice(0,i)+to+text.slice(i+from.length);}

const jsPath='training-tracks.js';
let js=load(jsPath);
const insert=`  function publicTrackOverviewHtml(audience='learner') {
    const employer=audience==='employer';
    return \`<section class="section cm-track-public-overview" data-cm-track-public-overview><div class="container">
      <div class="section-head"><div><div class="eyebrow">TWO PROGRAM LEVELS · EVERY CAREER</div><h2>Choose the depth that matches the goal.</h2></div><p>Both routes teach before they test and require real application. Professional Readiness goes further into full role simulation, review and readiness evidence.</p></div>
      <div class="cm-track-public-grid">
        <article class="card"><div class="cm-track-public-top"><span>CAREER SKILLS</span><b>4 verified credentials</b></div><h3>Shorter. Practical. Still real work.</h3><p>Foundations → Essentials → Applied Skills → Career Skills Capstone. Built for meaningful role preparation without requiring the full advanced onboarding-style sequence.</p><ul><li>Role-native learning and guided practice</li><li>Applied work, not MCQ-only completion</li><li>Realistic practical capstone</li><li>Upgrade later without repeating earned stages</li></ul><a class="btn btn-outline" href="#/careers">\${employer?'Preview Career Skills':'Explore Career Skills'} →</a></article>
        <article class="card cm-track-public-flagship"><div class="cm-track-public-top"><span>PROFESSIONAL READINESS</span><b>5 verified credentials</b></div><h3>Full job-readiness preparation.</h3><p>Foundations → Essentials → Applied Skills → Role Lab → Professional Readiness, with the baseline, advanced simulation, revision cycle and Professional Final supporting the flagship evidence standard.</p><ul><li>Full role-specific professional workflow</li><li>Manager-style review and revisions</li><li>Professional Final + evidence coverage</li><li>Flagship Professional Readiness credential</li></ul><a class="btn btn-primary" href="#/careers">\${employer?'Preview Professional Readiness':'Explore Professional Readiness'} →</a></article>
      </div>
      <div class="cm-track-public-note"><strong>Shared foundation:</strong> Foundations, Essentials and Applied Skills carry forward when a learner moves from Career Skills into Professional Readiness. The shorter credential never substitutes for the advanced Role Lab or Professional Readiness credential.</div>
      \${employer?'<p class="cm-track-employer-use"><strong>Employer use:</strong> assign Career Skills for shorter practical preparation or Professional Readiness for internship, new-hire and pre-Day-1 role readiness. Reporting and completion rules stay separate automatically.</p>':''}
    </div></section>\`;
  }

  function decorateHomeTrackOverview() {
    const { route }=routeContext();
    if(route!=='') return;
    const root=document.querySelector('#app main#main')||document.querySelector('#app');
    if(!root||root.querySelector('[data-cm-track-public-overview]')) return;
    const hero=root.querySelector('section');
    if(hero) hero.insertAdjacentHTML('afterend',publicTrackOverviewHtml('learner'));
  }

  function decorateEmployerTrackOverview() {
    const { route }=routeContext();
    if(route!=='employers') return;
    const root=document.querySelector('#app main#main')||document.querySelector('#app');
    if(!root||root.querySelector('[data-cm-track-public-overview]')) return;
    const hero=root.querySelector('section');
    if(hero) hero.insertAdjacentHTML('afterend',publicTrackOverviewHtml('employer'));
  }

`;
js=once(js,'  function decorateLearnerGuide() {',insert+'  function decorateLearnerGuide() {','public two-track decorators');
js=once(js,'    decorateCareerDirectory();\n    const { route, pathwayId } = routeContext();','    decorateCareerDirectory();\n    decorateHomeTrackOverview();\n    decorateEmployerTrackOverview();\n    const { route, pathwayId } = routeContext();','public track overview apply hooks');
save(jsPath,js);

const cssPath='training-tracks.css';
let css=load(cssPath);
css+=`\n.cm-track-public-overview{background:#f7f9fb}.cm-track-public-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cm-track-public-grid article{display:flex;flex-direction:column}.cm-track-public-grid article h3{margin:10px 0 6px}.cm-track-public-grid article ul{padding-left:20px;margin:12px 0 18px}.cm-track-public-grid article li{margin:6px 0}.cm-track-public-grid article .btn{margin-top:auto;align-self:flex-start}.cm-track-public-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.cm-track-public-top span{font-size:.76rem;letter-spacing:.11em;font-weight:850;color:#647286}.cm-track-public-top b{font-size:.78rem;border-radius:999px;padding:6px 9px;background:#eef3f8;color:#26384d}.cm-track-public-flagship{border:1px solid #d7bc7d;box-shadow:0 12px 30px rgba(7,26,51,.07)}.cm-track-public-flagship .cm-track-public-top b{background:#f3e6c7;color:#604816}.cm-track-public-note,.cm-track-employer-use{margin-top:14px;padding:13px 15px;border-radius:12px;background:#fff;border:1px solid #dde4eb;color:#526174}.cm-track-public-note strong,.cm-track-employer-use strong{color:#071a33}@media(max-width:760px){.cm-track-public-grid{grid-template-columns:1fr}.cm-track-public-top{align-items:flex-start;flex-direction:column}}\n`;
save(cssPath,css);
console.log('Public two-track positioning added.');
