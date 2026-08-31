const fs=require('node:fs');

const configSource=fs.readFileSync('firebase-config.js','utf8');
const readValue=name=>configSource.match(new RegExp(`${name}:\\s*["']([^"']+)`))?.[1]||'';
const apiKey=readValue('apiKey');
const projectId=readValue('projectId');
const email=`cm.rules.${Date.now()}-${Math.floor(Math.random()*1e9)}@example.com`;
const password=`CmRules!${Date.now()}Aa9`;
let token='';

function document(fields){return {fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?{integerValue:String(value)}:value instanceof Date?{timestampValue:value.toISOString()}:{stringValue:String(value)}]))};}
async function body(response){return (await response.text()).slice(0,700);}

(async()=>{
  if(!apiKey||!projectId) throw new Error('Firebase public configuration missing');
  const signup=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const account=await signup.json();
  if(!signup.ok) throw new Error(`Disposable Firebase signup failed (${signup.status}): ${JSON.stringify(account).slice(0,500)}`);
  token=account.idToken;
  const uid=account.localId;
  const root=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  try{
    const now=new Date();
    const rootWrite=await fetch(root,{method:'PATCH',headers,body:JSON.stringify(document({displayName:'Phase Two Rules',email,createdAt:now,lastSeenAt:now,credentialName:'Phase Two Rules',credentialNameConfirmed:true,credentialNameUpdatedAt:now}))});
    const rootFailure=rootWrite.ok?'':`Live protected user-root rules are stale (${rootWrite.status}): ${await body(rootWrite)}`;
    const stateFields={
      version:{integerValue:'1'},profile:{mapValue:{fields:{accountUid:{stringValue:uid},name:{stringValue:'Phase Two Rules'},certificateName:{stringValue:'Phase Two Rules'},certificateNameConfirmed:{booleanValue:true}}}},careers:{mapValue:{fields:{}}},preferences:{mapValue:{fields:{}}},createdAt:{stringValue:now.toISOString()},updatedAt:{stringValue:now.toISOString()},syncVersion:{integerValue:'1'},serverUpdatedAt:{timestampValue:now.toISOString()}
    };
    const progressWrite=await fetch(`${root}/progress/state`,{method:'PATCH',headers,body:JSON.stringify({fields:stateFields})});
    if(!progressWrite.ok) throw new Error(`Live owner-only progress rules failed (${progressWrite.status}): ${await body(progressWrite)}`);
    if(rootFailure) throw new Error(`${rootFailure}\nOwner-only progress compatibility write: PASS`);
    console.log('LIVE FIRESTORE RULES PROBE PASS: protected user-root identity and owner-only progress writes verified');
  }finally{
    if(token){
      await fetch(`${root}/progress/state`,{method:'DELETE',headers}).catch(()=>{});
      await fetch(root,{method:'DELETE',headers}).catch(()=>{});
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})}).catch(()=>{});
    }
  }
})().catch(error=>{console.error(error);process.exit(1);});
