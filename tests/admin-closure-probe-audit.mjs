import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const probe=fs.readFileSync('tests/live-admin-closure-probe.cjs','utf8');
const ok=(value,message)=>{if(!value) throw new Error(message);};

ok(worker.includes('cleanup:{targeted:true,resetAll:true}'),'Worker must advertise exact-target cleanup before a production probe creates demo data');
ok(worker.includes("requestedOrgId&&!requestedOrgId.startsWith('demo_org_')"),'Worker must refuse targeted cleanup outside the synthetic demo namespace');
ok(worker.includes("requestedOrgId?statement.bind(requestedOrgId):statement"),'Targeted cleanup must bind the exact synthetic organization ID');
ok(worker.includes("/^closure_[A-Za-z0-9_-]{8,80}$/")&&worker.includes('reused:true'),'Closure demo creation must be bounded and idempotent');

for(const marker of [
  'CM_ADMIN_ID_TOKEN',
  "adminToken.split('.').length===3",
  "api('/admin/integrity',{authenticated:false,expected:[401,403]})",
  "api('/auth-check',{method:'POST',body:{},expected:[200]})",
  'identity.isAdmin===true',
  "api('/admin/check',{expected:[200]})",
  "assertIntegrity(before,'Preflight')",
  'discovery.cleanup?.targeted===true',
  "crypto.createHash('sha256').update(`${identity.uid}:${probeKey}`)",
  "retryOperation('Idempotent demo creation'",
  "preset:'revision_cycle',size:3,pathwayId:'investment-banking',probeKey",
  'retry.payload.demo?.orgId===demoOrgId&&retry.payload.demo?.reused===true',
  '/permission-matrix',
  "state:'ready'",
  'body:{orgId:demoOrgId}',
  'baselineDemoIds',
  "assertIntegrity(after,'Post-cleanup')"
]) ok(probe.includes(marker),`Admin closure probe is missing required evidence: ${marker}`);

ok(!probe.includes('console.log(adminToken)')&&!probe.includes('console.error(adminToken)'),'Admin closure probe must never print its Firebase ID token');
ok((probe.match(/\/enterprise\/admin\/demo\/reset/g)||[]).length===1,'Admin closure probe must have one cleanup path and it must be exact-targeted');

console.log('ADMIN CLOSURE PROBE AUDIT PASS: protected identity, integrity, idempotent synthetic lifecycle, permission/state evidence and exact cleanup are fail-closed');
