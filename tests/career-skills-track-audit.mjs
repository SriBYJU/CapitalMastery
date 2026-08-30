import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const app=fs.readFileSync('app.js','utf8');

const must=(condition,message)=>{if(!condition)throw new Error(message);};

must(worker.includes('["foundations", "career_skills", "professional"]'), 'Worker assignment enum must support Career Skills');
must(worker.includes('["foundations", "essentials", "career_skills", "professional"]'), 'Worker cohort enum must support Career Skills');
must(worker.includes('"career", "role_lab", "professional_readiness"'), 'Worker credential target enum must support Career Certificate');
must(worker.includes('Career Skills assignments must target the Career Certificate'), 'Worker must enforce Career Skills credential target');
must(worker.includes('{ id: "career", title: "Career Skills Certificate", track: "career_skills"'), 'Enterprise catalog must expose Career Skills Certificate');

const careerRequirement=worker.match(/if \(level === "career"\) \{\s*return \[([\s\S]*?)\];\s*\}/)?.[1]||'';
must(careerRequirement.includes('"simulation"'), 'Career Certificate must require the practical simulation');
must(!careerRequirement.includes('"final"'), 'Career Certificate must not require the Professional Readiness Final');

must(enterprise.includes('career_skills: ['), 'Employer curriculum stages must include Career Skills');
must(enterprise.includes('value="career_skills"'), 'Quick Assign must offer Career Skills');
must(enterprise.includes("credentialTarget:track==='professional'?'professional_readiness':'career'"), 'Quick Assign must target Career Certificate for Career Skills');
must(enterprise.includes("stage.id==='career-capstone'"), 'Assigned program must show Career Skills capstone evidence state');
must(enterprise.includes('#/simulation/${encodeURIComponent(publicPathId(a.pathwayId))}'), 'Assigned Career Skills program must link to the capstone simulation');

const localCareer=app.match(/function eligible\(c,type\)[\s\S]*?return \[1,2,3,4,5\][^;]+;/)?.[0]||'';
must(localCareer.includes('simulationScore'), 'Local Career Certificate must require the job simulation');
must(!localCareer.includes('finalScore'), 'Local Career Certificate must not require Professional Readiness Final');
must(app.includes('Professional Readiness adds the advanced Role Lab'), 'Public credential hierarchy copy must distinguish Professional Readiness');

console.log('career-skills-track-audit: PASS');
