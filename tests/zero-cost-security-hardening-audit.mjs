import fs from 'node:fs';

const { readJson } = await import('../v2/worker-v2-phase1-release.js');
const worker = fs.readFileSync('v2/worker-v2-phase1-release.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const build = fs.readFileSync('tools/build-pages.mjs', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const mobileCertificate = fs.readFileSync('certificate-mobile-fix.js', 'utf8');
const pdfCertificate = fs.readFileSync('certificate-pdf-download.js', 'utf8');
const iosCertificate = fs.readFileSync('certificate-pdf-ios-fix.js', 'utf8');
const credentialName = fs.readFileSync('certificate-name.js', 'utf8');

const failures = [];
const ok = (value, message) => { if (!value) failures.push(message); };

for (const request of [
  new Request('https://worker.invalid/test', { method:'POST', body:'{}' }),
  new Request('https://worker.invalid/test', { method:'POST', headers:{ 'content-type':'text/plain' }, body:'{}' })
]) {
  let status = 0;
  try { await readJson(request); } catch (error) { status = error.status; }
  ok(status === 415, 'Worker must reject JSON-shaped bodies without application/json using HTTP 415');
}

const accepted = await readJson(new Request('https://worker.invalid/test', {
  method:'POST',
  headers:{ 'content-type':'application/json; charset=utf-8' },
  body:'{"ok":true}'
}));
ok(accepted.ok === true, 'Worker must continue accepting application/json with a charset parameter');

ok(worker.indexOf('const origin = request.headers.get("Origin")') < worker.indexOf('if (request.method === "OPTIONS")'), 'Origin allowlist must run before preflight responses');
ok(worker.includes('token.length > 4096'), 'Bearer-token input must have an explicit size ceiling');
for (const header of ['"Referrer-Policy"', '"Permissions-Policy"', '"X-Frame-Options"']) {
  ok(worker.includes(header), `Worker JSON responses are missing ${header}`);
}

const csp = index.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1] || '';
for (const directive of ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'", 'https://www.gstatic.com', 'https://cdn.jsdelivr.net', 'https://*.googleapis.com']) {
  ok(csp.includes(directive), `Primary-host CSP is missing ${directive}`);
}
ok(build.includes('Content-Security-Policy:') && build.includes("frame-ancestors 'none'"), 'Cloudflare mirror must receive a response-header CSP with anti-framing protection');

const sriExpectations = [
  [mobileCertificate, 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU', 'mobile QR'],
  [pdfCertificate, 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', 'jsPDF'],
  [pdfCertificate, 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU', 'PDF QR'],
  [iosCertificate, 'sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI', 'pdf-lib']
];
for (const [source, integrity, label] of sriExpectations) {
  ok(source.includes(integrity), `${label} CDN dependency is not pinned with its verified SHA-384 integrity value`);
  ok(source.includes("crossOrigin = 'anonymous'"), `${label} CDN dependency must use anonymous CORS for SRI enforcement`);
}

ok(app.includes('<main id="main" tabindex="-1">'), 'SPA main landmark must be programmatically focusable for skip navigation');
ok(app.includes('role="dialog" aria-modal="true" tabindex="-1"'), 'Shared dialog must expose modal semantics');
ok(app.includes("if(e.key==='Escape')") && app.includes("if(e.key!=='Tab'||!panel)return"), 'Shared dialog must support Escape and trapped Tab navigation');
ok(app.includes('modalReturnFocus?.isConnected'), 'Shared dialog must restore focus to its opener');
ok(credentialName.includes('function activateDialog(') && credentialName.includes("event.key === 'Escape'") && credentialName.includes("event.key !== 'Tab'"), 'Account and credential-name dialogs must implement bounded keyboard navigation');
ok(credentialName.includes('gateReturnFocus?.isConnected') && credentialName.includes('nameReturnFocus?.isConnected'), 'Account and credential-name dialogs must restore focus to their openers');

if (failures.length) {
  console.error(`ZERO-COST SECURITY HARDENING AUDIT FAILED\n - ${failures.join('\n - ')}`);
  process.exit(1);
}
console.log('ZERO-COST SECURITY HARDENING AUDIT PASS: strict JSON, bounded auth input, preflight origin rejection, response protections, CSP, CDN SRI and accessible modal behavior verified');
