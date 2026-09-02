const PRIMARY = String(process.env.CM_PRIMARY_URL || 'https://sribyju.github.io/CapitalMastery').replace(/\/+$/, '');
const WORKER = String(process.env.CM_WORKER_URL || 'https://capital-mastery-api.avadhanula-shriyan.workers.dev').replace(/\/+$/, '');
const REQUESTS = Math.max(4, Math.min(60, Number(process.env.CM_LOAD_REQUESTS || 24)));
const CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.CM_LOAD_CONCURRENCY || 4)));
const ORIGIN = new URL(PRIMARY).origin;

if (!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(PRIMARY) && process.env.CM_ALLOW_LIVE_LOAD !== '1') {
  throw new Error('Live bounded-load execution requires CM_ALLOW_LIVE_LOAD=1');
}

function percentile(values, point) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * point) - 1))] || 0;
}

async function exercise(label, url, options, expected, p95LimitMs) {
  const samples = [];
  let cursor = 0;
  const errors = [];
  async function runner() {
    while (cursor < REQUESTS) {
      const requestNumber = cursor++;
      const started = performance.now();
      try {
        const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}boundedLoad=${Date.now()}-${requestNumber}`, {
          ...options,
          signal:AbortSignal.timeout(15000),
          redirect:'follow'
        });
        await response.arrayBuffer();
        samples.push(performance.now() - started);
        if (response.status !== expected) errors.push(`#${requestNumber + 1}: HTTP ${response.status}`);
      } catch (error) {
        samples.push(performance.now() - started);
        errors.push(`#${requestNumber + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  await Promise.all(Array.from({ length:CONCURRENCY }, runner));
  const result = {
    label,
    requests:REQUESTS,
    concurrency:CONCURRENCY,
    passed:errors.length === 0 && percentile(samples, .95) <= p95LimitMs,
    successful:REQUESTS - errors.length,
    failed:errors.length,
    p50Ms:Math.round(percentile(samples, .50)),
    p95Ms:Math.round(percentile(samples, .95)),
    p99Ms:Math.round(percentile(samples, .99)),
    maximumMs:Math.round(Math.max(...samples)),
    p95LimitMs,
    errors:errors.slice(0, 10)
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

(async () => {
  const results = [];
  results.push(await exercise('Canonical static shell', `${PRIMARY}/`, {}, 200, 4000));
  results.push(await exercise('Worker + D1 health', `${WORKER}/health`, { headers:{ Origin:ORIGIN } }, 200, 3000));
  const passed = results.every(result => result.passed);
  console.log(`ZERO-COST BOUNDED LOAD/RESILIENCE AUDIT ${passed ? 'PASS' : 'FAIL'}: ${REQUESTS} read-only requests per target at concurrency ${CONCURRENCY}`);
  if (!passed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
