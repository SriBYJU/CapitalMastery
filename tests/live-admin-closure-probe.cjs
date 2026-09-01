const crypto=require('node:crypto');

const workerUrl=String(process.env.CM_WORKER_URL||'https://capital-mastery-api.avadhanula-shriyan.workers.dev').replace(/\/+$/,'');
const origin=String(process.env.CM_PRIMARY_ORIGIN||'https://sribyju.github.io').replace(/\/+$/,'');
const adminToken=String(process.env.CM_ADMIN_ID_TOKEN||'').trim();
const probeKey=`closure_${Date.now()}_${Math.floor(Math.random()*1e9)}`;
let demoOrgId='';
let baselineDemoIds=[];
let primaryFailure=null;
let cleanupFailure=null;

function assert(value,message){
  if(!value) throw new Error(message);
}

async function parseBody(response){
  const text=(await response.text()).slice(0,2000);
  if(!text) return {};
  try{return JSON.parse(text);}catch{return {raw:text};}
}

async function api(path,{method='GET',body,authenticated=true,expected=[200]}={}){
  const headers={Origin:origin,Accept:'application/json'};
  if(authenticated) headers.Authorization=`Bearer ${adminToken}`;
  if(body!==undefined) headers['Content-Type']='application/json';
  const response=await fetch(`${workerUrl}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const payload=await parseBody(response);
  if(!expected.includes(response.status)){
    throw new Error(`${method} ${path} returned ${response.status}; expected ${expected.join('/')} — ${JSON.stringify(payload).slice(0,700)}`);
  }
  return {status:response.status,payload};
}

async function retryOperation(label,operation){
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt+=1){
    try{return await operation();}catch(error){
      lastError=error;
      if(attempt<3) await new Promise(resolve=>setTimeout(resolve,attempt*300));
    }
  }
  throw new Error(`${label} failed after three attempts: ${lastError?.message||'unknown error'}`);
}

function assertIntegrity(payload,label){
  assert(payload&&payload.ok===true,`${label}: integrity response did not report ok=true`);
  const quick=Array.isArray(payload.quickCheck)?payload.quickCheck:[];
  const quickOk=quick.some(row=>Object.values(row||{}).some(value=>String(value).toLowerCase()==='ok'));
  assert(quickOk,`${label}: D1 quick_check did not return ok`);
  assert(Array.isArray(payload.foreignKeyViolations),`${label}: foreign-key result is missing`);
  assert(payload.foreignKeyViolations.length===0,`${label}: D1 reported ${payload.foreignKeyViolations.length} foreign-key violation(s)`);
  assert(payload.tableCounts&&typeof payload.tableCounts==='object'&&!Array.isArray(payload.tableCounts),`${label}: table counts are missing`);
  const counts=Object.entries(payload.tableCounts);
  assert(counts.length>=10,`${label}: expected production table counts, received ${counts.length}`);
  for(const [name,count] of counts){
    assert(/^[A-Za-z0-9_]+$/.test(name),`${label}: unsafe table identifier in response`);
    assert(Number.isInteger(count)&&count>=0,`${label}: invalid count for ${name}`);
  }
}

async function cleanupCreatedDemo(){
  if(!demoOrgId) return;
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt+=1){
    try{
      const {payload}=await api('/enterprise/admin/demo/reset',{
        method:'POST',
        body:{orgId:demoOrgId},
        expected:[200]
      });
      assert(payload.ok===true&&payload.synthetic===true,'Targeted demo cleanup did not retain the synthetic-data boundary');
      assert(payload.targeted===true,'Worker ignored the exact demo cleanup target');
      assert(payload.deletedOrganizations===1||payload.deletedOrganizations===0,'Targeted cleanup returned an invalid deletion count');
      return;
    }catch(error){
      lastError=error;
      await new Promise(resolve=>setTimeout(resolve,attempt*300));
    }
  }
  throw lastError||new Error('Targeted demo cleanup failed');
}

(async()=>{
  assert(adminToken,'CM_ADMIN_ID_TOKEN is required; use a fresh Firebase ID token for the configured production Admin account');
  assert(adminToken.split('.').length===3,'CM_ADMIN_ID_TOKEN must be a Firebase JWT, not an API key, password or refresh token');
  assert(/^https:\/\//.test(workerUrl),'CM_WORKER_URL must use HTTPS');
  assert(/^https:\/\//.test(origin),'CM_PRIMARY_ORIGIN must use HTTPS');

  const unauth=await api('/admin/integrity',{authenticated:false,expected:[401,403]});
  assert(unauth.status===401||unauth.status===403,'Unauthenticated integrity boundary did not fail closed');

  const {payload:identity}=await api('/auth-check',{method:'POST',body:{},expected:[200]});
  assert(identity.ok===true&&identity.authenticated===true,'Firebase token was not accepted by the Worker');
  assert(identity.isAdmin===true,'Authenticated identity is not the protected production Admin');
  const {payload:admin}=await api('/admin/check',{expected:[200]});
  assert(admin.ok===true&&admin.admin===true,'Administrator route did not confirm the protected Admin identity');

  const {payload:before}=await api('/admin/integrity',{expected:[200]});
  assertIntegrity(before,'Preflight');
  const {payload:discovery}=await api('/enterprise/admin/demo',{expected:[200]});
  assert(discovery.ok===true&&discovery.synthetic===true,'Admin Demo discovery did not identify synthetic data');
  assert(discovery.cleanup?.targeted===true,'Production Worker does not advertise exact-target demo cleanup; refusing to create disposable data');
  baselineDemoIds=(discovery.demos||[]).map(item=>String(item.id||'')).filter(Boolean);
  demoOrgId=`demo_org_${crypto.createHash('sha256').update(`${identity.uid}:${probeKey}`).digest('hex').slice(0,10)}`;

  try{
    const {payload:created}=await retryOperation('Idempotent demo creation',()=>api('/enterprise/admin/demo/create',{
      method:'POST',
      body:{preset:'revision_cycle',size:3,pathwayId:'investment-banking',probeKey},
      expected:[201]
    }));
    assert(created.demo?.orgId===demoOrgId,'Demo creation did not return the deterministic closure tenant ID');
    assert(/^demo_org_[A-Za-z0-9_-]+$/.test(demoOrgId),'Demo creation returned a non-synthetic organization identifier');
    assert(created.demo?.synthetic===true,'Demo creation response did not retain the synthetic-data marker');
    assert(Number(created.demo?.size)===3,'Demo creation did not honor the bounded three-learner probe size');

    const retry=await api('/enterprise/admin/demo/create',{
      method:'POST',
      body:{preset:'revision_cycle',size:3,pathwayId:'investment-banking',probeKey},
      expected:[201]
    });
    assert(retry.payload.demo?.orgId===demoOrgId&&retry.payload.demo?.reused===true,'Idempotent demo retry created or returned a different tenant');

    const listed=await api('/enterprise/admin/demo',{expected:[200]});
    const row=(listed.payload.demos||[]).find(item=>item.id===demoOrgId);
    assert(row,`Created demo ${demoOrgId} was not discoverable`);
    assert(Number(row.learners)===3,'Created demo learner count is not three');
    assert(Number(row.assignments)>=1,'Created demo is missing its published assignment');

    const learners=await api(`/enterprise/admin/demo/${encodeURIComponent(demoOrgId)}/learners`,{expected:[200]});
    assert(learners.payload.synthetic===true&&learners.payload.orgId===demoOrgId,'Demo learner response lost its exact synthetic tenant scope');
    assert(Array.isArray(learners.payload.learners)&&learners.payload.learners.length===3,'Demo learner roster is incomplete');
    const learnerUid=String(learners.payload.learners[0]?.uid||'');
    assert(learnerUid.startsWith('demo_uid_'),'Demo roster exposed a non-synthetic learner identity');

    const changed=await api('/enterprise/admin/demo/learner-state',{
      method:'POST',
      body:{orgId:demoOrgId,uid:learnerUid,state:'ready'},
      expected:[200]
    });
    assert(changed.payload.ok===true&&changed.payload.synthetic===true&&changed.payload.state==='ready','Synthetic learner state transition failed');

    const permissions=await api('/enterprise/admin/demo/permission-matrix',{expected:[200]});
    assert(Array.isArray(permissions.payload.roles?.owner)&&permissions.payload.roles.owner.includes('workspace.manage'),'Owner permission evidence is incomplete');
    assert(Array.isArray(permissions.payload.roles?.learner)&&permissions.payload.roles.learner.includes('own_work.submit'),'Learner permission evidence is incomplete');

    const {payload:during}=await api('/admin/integrity',{expected:[200]});
    assertIntegrity(during,'Disposable-tenant exercise');
  }catch(error){
    primaryFailure=error;
  }finally{
    try{await cleanupCreatedDemo();}catch(error){cleanupFailure=error;}
  }

  if(cleanupFailure) throw new Error(`${primaryFailure?`${primaryFailure.message}\n`:''}Targeted cleanup failed: ${cleanupFailure.message}`);

  const {payload:afterList}=await api('/enterprise/admin/demo',{expected:[200]});
  const afterIds=(afterList.demos||[]).map(item=>String(item.id||'')).filter(Boolean);
  assert(!afterIds.includes(demoOrgId),'Disposable demo still exists after targeted cleanup');
  for(const baselineId of baselineDemoIds) assert(afterIds.includes(baselineId),`Targeted cleanup removed pre-existing demo ${baselineId}`);
  const {payload:after}=await api('/admin/integrity',{expected:[200]});
  assertIntegrity(after,'Post-cleanup');
  if(primaryFailure) throw primaryFailure;

  console.log(`LIVE ADMIN CLOSURE PROBE PASS: protected identity, D1 integrity, idempotent three-learner demo, permission/state evidence and exact cleanup verified across ${Object.keys(after.tableCounts).length} tables`);
})().catch(error=>{console.error(error);process.exit(1);});
