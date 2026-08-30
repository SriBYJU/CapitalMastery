import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(tracks.includes('Foundations, Essentials and Applied Skills carry directly into Professional Readiness'), 'Public stacking rule must preserve shared earned stages');
must(tracks.includes('upgrading never means repeating earned stages'), 'Upgrade messaging must explicitly promise no repeated earned stages');
must(tracks.includes("['01','Foundations'"), 'Both program sequences must begin from the same Foundations work');
must(tracks.includes("['03','Applied Skills'"), 'Shared Applied Skills stage must remain reusable across program levels');

const careerRequirement=worker.match(/if \(level === "career"\) \{\s*return \[([\s\S]*?)\];\s*\}/)?.[1]||'';
must(careerRequirement.includes('"simulation"'), 'Career Skills completion must require its practical capstone');
must(!careerRequirement.includes('"final"'), 'Career Skills must not require the advanced Professional Final');

must(worker.includes("for (const level of ['foundations','essentials','applied','role_lab'])"), 'Professional Final must still require all four Standard 2.0 prerequisite credentials');
must(worker.includes("credential_level==='professional_readiness'"), 'Academy state must source Professional Readiness credentials explicitly');
must(worker.includes("state.professional.length>=4"), 'Finance Professional achievement must remain Professional Readiness-gated');
must(worker.includes('required Professional Readiness credentials'), 'Academy eligibility must not accept Career Skills as a Professional Readiness substitute');

must(enterprise.includes("credentialTarget:track==='professional'?'professional_readiness':'career'"), 'Employer assignment targets must keep Career Skills and Professional Readiness distinct');
must(enterprise.includes("if(track==='career_skills')"), 'Employer progress must evaluate Career Skills on its own gates');
must(enterprise.includes("levels.has('career')"), 'Career Skills completion must recognize the Career Skills credential');
must(enterprise.includes("levels.has('professional_readiness')"), 'Professional Readiness completion must remain tied to the flagship credential');

console.log('track-upgrade-no-repeat-audit: PASS');
