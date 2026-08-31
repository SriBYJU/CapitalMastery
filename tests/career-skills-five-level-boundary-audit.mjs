import fs from 'node:fs';
import vm from 'node:vm';
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const verify=fs.readFileSync('public-certificate-verify.js','utf8');
const dataCode=fs.readFileSync('data.js','utf8');
const dataCtx={window:{}};vm.createContext(dataCtx);vm.runInContext(dataCode,dataCtx);
const data=dataCtx.window.CM_DATA;
const must=(c,m)=>{if(!c)throw new Error(m);};
const {enterpriseCatalog}=await import('../v2/worker-v2-phase1-release.js');
const catalog=enterpriseCatalog();
const ids=catalog.credentialLadder.map(x=>x.id);
const completionIds=catalog.programCompletions.map(x=>x.id);
must(JSON.stringify(ids)===JSON.stringify(['foundations','essentials','applied','role_lab','professional_readiness']),`Expected exactly five Standard 2.0 levels; got ${ids.join(', ')}`);
must(!catalog.credentialLadder.some(x=>x.id==='career'),'Career program completion must not be a Standard 2.0 ladder level');
must(JSON.stringify(completionIds)===JSON.stringify(['career']),`Expected exactly one separate Career Skills program-completion descriptor; got ${completionIds.join(', ')}`);
must(catalog.programCompletions[0]?.verifiedCredentialLevel===false,'Career Skills program completion must explicitly declare that it is not a verified credential level');
must(worker.includes('programCompletions:'),'Worker catalog must expose program completions separately');
must(worker.includes('{ id: "career", title: "Career Skills Program Completion Certificate"'),'Career Skills completion descriptor missing');
must(tracks.includes('verifiedCredentialCount: 3'),'Career Skills must count three verified credentials');
must(tracks.includes('3 verified Standard 2.0 credentials + 1 program-completion certificate'),'Career Skills UI must state three verified credentials plus completion certificate');
must(tracks.includes('5 Standard 2.0 career credentials'),'Professional Readiness must remain five verified credentials');
must(enterprise.includes('programCompletions?.find'),'Employer UI must resolve program completion separately from credential ladder');
must(enterprise.includes('verifiedCredentialCount:professional?5:3'),'Employer evidence export must distinguish the verified credential counts');
must(verify.includes('not a sixth Standard 2.0 credential'),'Public verification must disclose that Career Skills completion is not a sixth credential');
// Backward compatibility is behavioral: self-directed/legacy Career completion can
// still be earned and its existing credentials-table public token can still verify.
// Employer assignment completion is intentionally no longer inferred from that row.
must(worker.includes('if (level === "career")')&&worker.includes('issueEligibleCredentials')&&worker.includes('WHERE public_token = ?'),'Legacy/current public Career completion issuance and verification must remain compatible');
must(data?.careers?.length===16,`Expected 16 careers in public data; got ${data?.careers?.length}`);
must(Number(data?.stats?.credentials)===80,'Legacy credential-count alias must stay aligned to 80 Standard 2.0 career definitions');
must(data?.stats?.marketingCredentials==='80+','Public marketing credential-count alias must stay at 80+');
must(Number(data?.stats?.careerCredentialDefinitions)===80,'Public data must declare exactly 80 Standard 2.0 career credential definitions');
must(Number(data?.stats?.academyAchievements)===8,'Public data must declare exactly 8 Academy achievements');
console.log('CAREER SKILLS FIVE-LEVEL BOUNDARY AUDIT PASS: five verified ladder levels preserved; Career Skills completion isolated; public credential statistics aligned');
