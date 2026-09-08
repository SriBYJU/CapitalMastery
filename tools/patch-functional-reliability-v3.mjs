import './patch-functional-reliability-v2.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = 'v2/v2-credential-assessment-routes.js';
const file = path.join(ROOT, rel);
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Patch anchor is ambiguous: ${label}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

if (!source.includes('credentialRefreshPending')) {
  const refreshLine = `        const refreshed=result.passed?await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId}):[];`;
  replaceOnce(refreshLine, `        let refreshed=[];\n        let credentialRefreshPending=result.evidenceRefreshPending===true;\n        let credentialRefreshWarning=result.evidenceRefreshWarning||null;\n        if(result.passed && !result.evidenceRefreshPending){\n          let lastRefreshError=null;\n          for(const delay of [0,250,900]){\n            if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n            try{\n              refreshed=await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId});\n              lastRefreshError=null;\n              break;\n            }catch(error){ lastRefreshError=error; }\n          }\n          if(lastRefreshError){\n            credentialRefreshPending=true;\n            credentialRefreshWarning='Your assessment attempt is saved, but credential issuance could not finish yet.';\n          }\n        }`, 'modular credential refresh retry');
}

if (!source.includes('assessmentSaved:true')) {
  const prefix = `        return json({ok:true,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,issuedCredentials:`;
  replaceOnce(prefix, `        return json({ok:true,assessmentSaved:true,pathwayId:pathway.id,assignmentId,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,credentialRefreshPending,credentialRefreshWarning,issuedCredentials:`, 'modular assessment durable response');
}

fs.writeFileSync(file, source);
console.log('Modular assessment route reliability alignment applied.');
