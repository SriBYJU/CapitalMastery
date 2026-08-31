import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG='tools/wrangler.d1-release-bridge.jsonc';
const NAME='capital-mastery-d1-release-bridge';
const windowsNpx=path.join(path.dirname(process.execPath),'node_modules','npm','bin','npx-cli.js');
const executable=process.platform==='win32'?process.execPath:'npx';
const npxPrefix=process.platform==='win32'?[windowsNpx]:[];
if(process.env.CM_ALLOW_WRANGLER_OAUTH!=='1')throw new Error('Set CM_ALLOW_WRANGLER_OAUTH=1 to authorize the ephemeral production D1 bridge');

function wrangler(args,label,input){
  const result=spawnSync(executable,[...npxPrefix,'--yes','wrangler@4',...args],{encoding:'utf8',env:process.env,input,maxBuffer:16*1024*1024});
  if(result.error)throw new Error(`${label} could not start: ${result.error.message}`);
  if(result.status!==0)throw new Error(`${label} failed (exit ${result.status??'unknown'})\n${result.stderr||result.stdout||'Wrangler returned no diagnostic output.'}`);
  return `${result.stdout||''}\n${result.stderr||''}`;
}

const token=randomBytes(32).toString('base64url');
let cleanupError=null;
let summary=null;
try{
  const deployed=wrangler(['deploy','--config',CONFIG],'Deploy ephemeral D1 release bridge');
  const discovered=deployed.match(/https:\/\/[^\s]+\.workers\.dev/i)?.[0]?.replace(/[\])},.;]+$/,'');
  const url=`${discovered||'https://capital-mastery-d1-release-bridge.avadhanula-shriyan.workers.dev'}/prepare`;
  wrangler(['secret','put','CM_RELEASE_TOKEN','--config',CONFIG],'Install one-time bridge secret',`${token}\n`);
  let lastError='No response';
  for(let attempt=1;attempt<=4;attempt++){
    try{
      const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||payload.ok!==true)throw new Error(payload.error||`Bridge returned HTTP ${response.status}`);
      summary=payload.summary;
      break;
    }catch(error){lastError=String(error?.message||error);if(attempt<4)await new Promise(resolve=>setTimeout(resolve,1000));}
  }
  if(!summary)throw new Error(`Ephemeral D1 release bridge failed: ${lastError}`);
  fs.writeFileSync('d1-production-preflight.json',JSON.stringify(summary,null,2));
}finally{
  try{wrangler(['delete','--name',NAME,'--force'],'Delete ephemeral D1 release bridge');}catch(error){cleanupError=error;}
}
if(cleanupError)throw new Error(`D1 preparation completed but the ephemeral bridge cleanup failed: ${cleanupError.message}`);
console.log(JSON.stringify(summary,null,2));
console.log('D1 EPHEMERAL WORKER PREPARE GATE: PASS (bridge deleted)');
