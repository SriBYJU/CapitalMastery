import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const recovery = fs.readFileSync('docs/operations/zero-cost-recovery-runbook.md', 'utf8');
const incident = fs.readFileSync('docs/operations/incident-response-playbook.md', 'utf8');
const threatModel = fs.readFileSync('docs/operations/security-threat-model.md', 'utf8');
const monitoring = fs.readFileSync('docs/operations/zero-cost-monitoring.md', 'utf8');
const security = fs.readFileSync('SECURITY.md', 'utf8');
const gitignore = fs.readFileSync('.gitignore', 'utf8');
const failures = [];
const ok = (value, message) => { if (!value) failures.push(message); };

ok(config.main === 'v2/worker-v2-phase1-release.js', 'Recovery record must identify the deployable Worker entrypoint');
ok(config.d1_databases?.some(binding => binding.binding === 'DB' && binding.database_name === 'capital-mastery-prod'), 'Recovery record must remain bound to the intended D1 database');
ok(config.observability?.enabled === true, 'Worker observability must stay enabled');
ok(recovery.includes('D1 Time Travel') && recovery.includes('Seven-day point-in-time recovery window'), 'Free D1 recovery source/window is not documented');
ok(recovery.includes('intentionally **not automated**') && recovery.includes('recorded pre-restore bookmark'), 'Destructive restore guard is missing');
ok(recovery.includes('Git history') && recovery.includes('known-good Git commit'), 'Source recovery path is missing');
ok(recovery.toLowerCase().includes('never store tokens or personal-data exports in actions artifacts'), 'Recovery process must prohibit sensitive backup artifacts');
ok(incident.includes('SEV-1') && incident.includes('First 15 minutes') && incident.includes('Containment') && incident.includes('Closeout'), 'Incident playbook is incomplete');
ok(incident.includes('Do not weaken authentication, origin checks, tenant authorization, assessment sequencing or answer-key isolation'), 'Incident response must prohibit fail-open recovery');
ok(threatModel.includes('Trust boundaries') && threatModel.includes('Credible threat and control register') && threatModel.includes('What this model does not claim'), 'Security threat model is incomplete');
ok(threatModel.includes('CORS does not stop direct non-browser requests') && threatModel.includes('Never trust browser-provided ownership'), 'Threat model must preserve the server trust boundary');
ok(monitoring.includes('24 requests') && monitoring.includes('concurrency four') && monitoring.includes('do not process real learner work'), 'Zero-cost monitoring bounds are not documented');
ok(security.includes('D1 remains authoritative') || security.includes('authoritative in D1'), 'Authoritative-data recovery boundary is unclear');
ok(gitignore.includes('.wrangler/'), 'Local Cloudflare state must remain excluded from Git');

if (failures.length) {
  console.error(`RECOVERY READINESS AUDIT FAILED\n - ${failures.join('\n - ')}`);
  process.exit(1);
}
console.log('RECOVERY READINESS AUDIT PASS: free source/D1 recovery, destructive-restore guard, data boundaries and incident procedure verified');
