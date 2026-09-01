const fs=require('node:fs');

const configSource=fs.readFileSync('firebase-config.js','utf8');
const readValue=name=>configSource.match(new RegExp(`${name}:\\s*["']([^"']+)`))?.[1]||'';
const apiKey=readValue('apiKey');
const projectId=readValue('projectId');
const nonce=`${Date.now()}-${Math.floor(Math.random()*1e9)}`;
const password=`CmRules!${Date.now()}Aa9`;
const accounts=[];
const cleanupFailures=[];
let ownerRoot='';
let ownerHeaders=null;
let rootCreated=false;
let progressCreated=false;

function document(fields){
  return {fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[
    key,
    typeof value==='boolean'?{booleanValue:value}:
      typeof value==='number'?{integerValue:String(value)}:
        value instanceof Date?{timestampValue:value.toISOString()}:
          {stringValue:String(value)}
  ]))};
}

async function responseBody(response){
  return (await response.text()).slice(0,700);
}

async function expectStatus(response,allowed,label){
  if(allowed.includes(response.status)) return;
  throw new Error(`${label} returned ${response.status}; expected ${allowed.join('/')} — ${await responseBody(response)}`);
}

async function signup(label){
  const email=`cm.rules.${label}.${nonce}@example.com`;
  const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password,returnSecureToken:true})
  });
  const account=await response.json();
  if(!response.ok) throw new Error(`Disposable Firebase ${label} signup failed (${response.status}): ${JSON.stringify(account).slice(0,500)}`);
  const record={label,uid:account.localId,token:account.idToken};
  accounts.push(record);
  return record;
}

async function retry(label,operation,allowed){
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt+=1){
    try{
      const response=await operation();
      if(allowed.includes(response.status)) return response;
      lastError=new Error(`${label} returned ${response.status}: ${await responseBody(response)}`);
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error(`${label} failed`);
}

async function cleanup(){
  if(ownerRoot&&ownerHeaders&&progressCreated){
    try{
      await retry('Progress cleanup',()=>fetch(`${ownerRoot}/progress/state`,{method:'DELETE',headers:ownerHeaders}),[200,404]);
      await retry('Progress cleanup verification',()=>fetch(`${ownerRoot}/progress/state`,{headers:ownerHeaders}),[404]);
    }catch(error){
      cleanupFailures.push(error.message);
    }
  }
  if(ownerRoot&&ownerHeaders&&rootCreated){
    try{
      await retry('User-root cleanup',()=>fetch(ownerRoot,{method:'DELETE',headers:ownerHeaders}),[200,404]);
      await retry('User-root cleanup verification',()=>fetch(ownerRoot,{headers:ownerHeaders}),[404]);
    }catch(error){
      cleanupFailures.push(error.message);
    }
  }
  for(const account of accounts.reverse()){
    try{
      await retry(`${account.label} identity cleanup`,()=>fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({idToken:account.token})
      }),[200]);
    }catch(error){
      cleanupFailures.push(error.message);
    }
  }
}

(async()=>{
  if(!apiKey||!projectId) throw new Error('Firebase public configuration missing');
  let primaryFailure=null;
  try{
    const owner=await signup('owner');
    const outsider=await signup('outsider');
    ownerRoot=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(owner.uid)}`;
    ownerHeaders={Authorization:`Bearer ${owner.token}`,'Content-Type':'application/json'};
    const outsiderHeaders={Authorization:`Bearer ${outsider.token}`,'Content-Type':'application/json'};
    const anonymousHeaders={'Content-Type':'application/json'};
    const now=new Date();

    const rootWrite=await fetch(ownerRoot,{
      method:'PATCH',
      headers:ownerHeaders,
      body:JSON.stringify(document({
        displayName:'Phase Two Rules',
        email:`cm.rules.owner.${nonce}@example.com`,
        createdAt:now,
        lastSeenAt:now,
        credentialName:'Phase Two Rules',
        credentialNameConfirmed:true,
        credentialNameUpdatedAt:now
      }))
    });
    rootCreated=rootWrite.ok;
    const rootFailure=rootWrite.ok?'':`Live protected user-root rules are stale (${rootWrite.status}): ${await responseBody(rootWrite)}`;

    const stateFields={
      version:{integerValue:'1'},
      profile:{mapValue:{fields:{accountUid:{stringValue:owner.uid},name:{stringValue:'Phase Two Rules'},certificateName:{stringValue:'Phase Two Rules'},certificateNameConfirmed:{booleanValue:true}}}},
      careers:{mapValue:{fields:{}}},
      preferences:{mapValue:{fields:{}}},
      createdAt:{stringValue:now.toISOString()},
      updatedAt:{stringValue:now.toISOString()},
      syncVersion:{integerValue:'1'},
      serverUpdatedAt:{timestampValue:now.toISOString()}
    };
    const progressUrl=`${ownerRoot}/progress/state`;
    const progressWrite=await fetch(progressUrl,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({fields:stateFields})});
    await expectStatus(progressWrite,[200],'Owner progress write');
    progressCreated=true;
    await expectStatus(await fetch(progressUrl,{headers:ownerHeaders}),[200],'Owner progress read');

    await expectStatus(await fetch(ownerRoot,{headers:outsiderHeaders}),[403],'Cross-account user-root read');
    await expectStatus(await fetch(progressUrl,{headers:outsiderHeaders}),[403],'Cross-account progress read');
    await expectStatus(await fetch(progressUrl,{method:'PATCH',headers:outsiderHeaders,body:JSON.stringify({fields:stateFields})}),[403],'Cross-account progress write');
    await expectStatus(await fetch(progressUrl,{headers:anonymousHeaders}),[401,403],'Anonymous progress read');
    await expectStatus(await fetch(progressUrl,{method:'PATCH',headers:anonymousHeaders,body:JSON.stringify({fields:stateFields})}),[401,403],'Anonymous progress write');

    const invalidState={...stateFields,syncVersion:{integerValue:'2'},unexpected:{stringValue:'must be denied'}};
    await expectStatus(await fetch(progressUrl,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({fields:invalidState})}),[403],'Invalid progress schema write');
    await expectStatus(await fetch(ownerRoot,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify(document({displayName:'Phase Two Rules',unexpected:'must be denied'}))}),[403],'Invalid user-root schema write');

    if(rootFailure) throw new Error(`${rootFailure}\nOwner progress compatibility: PASS\nProgress cross-account isolation: PASS\nAnonymous progress denial: PASS\nProgress schema enforcement: PASS\nUser-root negative checks: DENIED, but not independently certifiable until the owner-positive write passes`);
    await expectStatus(await fetch(ownerRoot,{headers:ownerHeaders}),[200],'Owner user-root read');
    console.log('LIVE FIRESTORE RULES PROBE PASS: protected identity, owner progress, cross-account isolation, anonymous denial and schema enforcement verified');
  }catch(error){
    primaryFailure=error;
  }finally{
    await cleanup();
  }

  if(cleanupFailures.length){
    throw new Error(`${primaryFailure?`${primaryFailure.message}\n`:''}Disposable cleanup failed:\n- ${cleanupFailures.join('\n- ')}`);
  }
  console.log('LIVE FIRESTORE RULES PROBE CLEANUP PASS: documents and disposable Firebase identities removed');
  if(primaryFailure) throw primaryFailure;
})().catch(error=>{console.error(error);process.exit(1);});
