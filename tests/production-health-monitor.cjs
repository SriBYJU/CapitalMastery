const fs = require('node:fs');

const PRIMARY = String(process.env.CM_PRIMARY_URL || 'https://sribyju.github.io/CapitalMastery').replace(/\/+$/, '');
const WORKER = String(process.env.CM_WORKER_URL || 'https://capital-mastery-api.avadhanula-shriyan.workers.dev').replace(/\/+$/, '');
const ORIGIN = new URL(PRIMARY).origin;
const startedAt = new Date().toISOString();
const checks = [];

function check(name, passed, detail, durationMs) {
  checks.push({ name, passed:Boolean(passed), detail:String(detail || ''), durationMs:Math.round(durationMs || 0) });
}

async function request(name, url, options, validate) {
  const started = performance.now();
  try {
    const response = await fetch(url, { ...options, signal:AbortSignal.timeout(15000), redirect:'follow' });
    const body = await response.text();
    const verdict = await validate(response, body);
    check(name, verdict.ok, verdict.detail, performance.now() - started);
  } catch (error) {
    check(name, false, error instanceof Error ? error.message : String(error), performance.now() - started);
  }
}

(async () => {
  const nonce = encodeURIComponent(Date.now());
  await request('Canonical frontend', `${PRIMARY}/?monitor=${nonce}`, {}, async (response, body) => ({
    ok:response.status === 200 && /text\/html/i.test(response.headers.get('content-type') || '') && body.includes('capital-mastery-live.js') && body.includes('Content-Security-Policy'),
    detail:`HTTP ${response.status}; release shell=${body.includes('capital-mastery-live.js')}; CSP=${body.includes('Content-Security-Policy')}`
  }));
  await request('Core brand asset', `${PRIMARY}/assets/logo-mark.svg?monitor=${nonce}`, {}, async (response) => ({
    ok:response.status === 200 && /image\/svg\+xml/i.test(response.headers.get('content-type') || ''),
    detail:`HTTP ${response.status}; ${response.headers.get('content-type') || 'no content type'}`
  }));
  await request('Worker and D1 health', `${WORKER}/health?monitor=${nonce}`, { headers:{ Origin:ORIGIN } }, async (response, body) => {
    let data = null;
    try { data = JSON.parse(body); } catch (_) {}
    const headersOk = response.headers.get('cache-control') === 'no-store' && response.headers.get('x-content-type-options') === 'nosniff';
    return { ok:response.status === 200 && data?.ok === true && data?.database === true && headersOk, detail:`HTTP ${response.status}; database=${data?.database === true}; headers=${headersOk}` };
  });
  await request('Bad-origin rejection', `${WORKER}/health`, { headers:{ Origin:'https://not-approved.example.invalid' } }, async (response) => ({
    ok:response.status === 403,
    detail:`HTTP ${response.status}; expected 403`
  }));
  await request('Bad-origin preflight rejection', `${WORKER}/auth-check`, { method:'OPTIONS', headers:{ Origin:'https://not-approved.example.invalid', 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'authorization,content-type' } }, async (response) => ({
    ok:response.status === 403,
    detail:`HTTP ${response.status}; expected 403`
  }));
  await request('Unauthenticated API rejection', `${WORKER}/auth-check`, { method:'POST', headers:{ Origin:ORIGIN, 'Content-Type':'application/json' }, body:'{}' }, async (response) => ({
    ok:response.status === 401,
    detail:`HTTP ${response.status}; expected 401`
  }));
  await request('Unknown endpoint handling', `${WORKER}/definitely-not-a-route`, { headers:{ Origin:ORIGIN } }, async (response) => ({
    ok:response.status === 404,
    detail:`HTTP ${response.status}; expected 404`
  }));

  const passed = checks.every(item => item.passed);
  const result = { generatedAt:new Date().toISOString(), startedAt, primary:PRIMARY, worker:WORKER, passed, checks };
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      '# Capital Mastery production monitor',
      '',
      `Overall: **${passed ? 'PASS' : 'FAIL'}**`,
      '',
      '| Check | Result | Time | Detail |',
      '|---|---:|---:|---|',
      ...checks.map(item => `| ${item.name} | ${item.passed ? 'PASS' : 'FAIL'} | ${item.durationMs} ms | ${item.detail.replace(/\|/g, '\\|')} |`),
      ''
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
  }
  if (!passed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
