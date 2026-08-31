import fs from 'node:fs';

const APP='app.js';
const LIVE='capital-mastery-live.js';
function read(p){return fs.readFileSync(p,'utf8');}
function write(p,t){fs.writeFileSync(p,t);}
function must(c,m){if(!c)throw new Error(m);}
function replaceOnce(t,b,a,l){must(t.includes(b),`Missing anchor: ${l}`);const n=t.replace(b,a);must(n!==t,`No change: ${l}`);return n;}

let app=read(APP);
app=replaceOnce(app,
`<a class="btn btn-outline" href="#/\${assessmentRetryPath(c,n,final)}">Retake assessment (optional)</a>`,
`<a class="btn btn-outline" data-cm-assessment-nav="true" href="#/\${assessmentRetryPath(c,n,final)}">Retake assessment (optional)</a>`,
'local saved-pass optional retake');
app=replaceOnce(app,
`<a class="btn \${passed?'btn-gold':'btn-primary'}" href="#/\${next}">\${passed?(final||n===2||n===4?'View Achievement':'Continue'):'Try Again'} →</a>`,
`<a class="btn \${passed?'btn-gold':'btn-primary'}" \${passed?'':'data-cm-assessment-nav="true"'} href="#/\${next}">\${passed?(final||n===2||n===4?'View Achievement':'Continue'):'Try Again'} →</a>`,
'local failed-result retry link');
app=replaceOnce(app,
`  window.CM={mobileMenu,markPart,toggleQa,qaScores,qaProgress,refreshLocalState,resetState,copy,closeModal,linkedinFields,postModal,postStyle,downloadSocial,downloadCertificateImage,compareGo};\n  window.addEventListener('hashchange',renderRoute);`,
`  window.CM={mobileMenu,markPart,toggleQa,qaScores,qaProgress,refreshLocalState,resetState,copy,closeModal,linkedinFields,postModal,postStyle,downloadSocial,downloadCertificateImage,compareGo};\n  document.addEventListener('click',event=>{\n    const link=event.target.closest?.('[data-cm-assessment-nav="true"]');\n    if(!link) return;\n    const href=link.getAttribute('href')||'';\n    if(!href.startsWith('#/')) return;\n    event.preventDefault();\n    history.pushState({cmAssessmentNav:true},'',href);\n    renderRoute();\n  });\n  window.addEventListener('hashchange',renderRoute);`,
'local deterministic assessment navigation');
write(APP,app);

let live=read(LIVE);
live=replaceOnce(live,
`<a class="btn btn-outline" href="\${retryHref(pathwayId,itemId)}">Retake assessment (optional)</a>`,
`<a class="btn btn-outline" data-cm-secure-assessment-nav="true" href="\${retryHref(pathwayId,itemId)}">Retake assessment (optional)</a>`,
'secure saved-pass optional retake');
live=replaceOnce(live,
`<a class="btn \${result.passed ? 'btn-gold' : 'btn-primary'}" href="\${nextHref(pathwayId, itemId, result.passed, assignmentId)}">\${result.passed ? (itemId === 'final' ? 'View Verified Credentials' : 'Continue') : 'Try Again'} →</a>`,
`<a class="btn \${result.passed ? 'btn-gold' : 'btn-primary'}" \${result.passed?'':'data-cm-secure-assessment-nav="true"'} href="\${nextHref(pathwayId, itemId, result.passed, assignmentId)}">\${result.passed ? (itemId === 'final' ? 'View Verified Credentials' : 'Continue') : 'Try Again'} →</a>`,
'secure failed-result retry link');
live=replaceOnce(live,
`  window.addEventListener('hashchange', () => setTimeout(route, 0));`,
`  document.addEventListener('click',event=>{\n    const link=event.target.closest?.('[data-cm-secure-assessment-nav="true"]');\n    if(!link) return;\n    const href=link.getAttribute('href')||'';\n    if(!href.startsWith('#/')) return;\n    event.preventDefault();\n    history.pushState({cmSecureAssessmentNav:true},'',href);\n    route();\n  });\n  window.addEventListener('hashchange', () => setTimeout(route, 0));`,
'secure deterministic assessment navigation');
write(LIVE,live);
console.log('COURSE RETRY NAVIGATION PATCH APPLIED: failed and optional-retake actions use direct router-owned history navigation, eliminating duplicate hashchange races');
