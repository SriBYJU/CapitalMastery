import fs from 'node:fs';

const js=fs.readFileSync('public-certificate-verify.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

for(const level of ['foundations','essentials','applied','career','role_lab','professional_readiness']){
  must(js.includes(`${level}: {`), `Public certificate level map missing ${level}`);
}
must(js.includes("label: 'Career Skills Program Completion Certificate'"), 'Career Skills program completion certificate must be named explicitly');
must(js.includes("label: 'Professional Readiness Credential'"), 'Professional Readiness credential must be named explicitly');
must(js.includes("label: 'Role Lab Credential'"), 'Role Lab credential must be named explicitly');
must(js.includes('not a sixth Standard 2.0 credential'), 'Career Skills completion certificate must be separated from the five-level Standard 2.0 ladder');
must(js.includes('full required technical, applied, Role Lab and professional-final evidence'), 'Professional Readiness description must reflect the advanced evidence standard');
must(js.includes("const isProfessional = levelKey === 'professional_readiness'"), 'Professional Readiness must be treated as a flagship certificate');
must(js.includes("String(c.recordType || '').toLowerCase() === 'program_completion'"), 'Career Skills completion must use explicit program-completion record typing');
must(js.includes("|| levelKey === 'career'"), 'Legacy Career certificate verification compatibility must remain available');
must(js.includes('const isFlagship = isProfessional'), 'Only Professional Readiness is the flagship verified credential');
must(!js.includes('practical simulation, and Professional Readiness Final under the Capital Mastery Standard.'), 'Legacy generic Career Certificate copy must not remain');

console.log('public-credential-hierarchy-audit: PASS');