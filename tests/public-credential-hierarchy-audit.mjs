import fs from 'node:fs';

const js=fs.readFileSync('public-certificate-verify.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

for(const level of ['foundations','essentials','applied','career','role_lab','professional_readiness']){
  must(js.includes(`${level}: {`), `Public certificate level map missing ${level}`);
}
must(js.includes("label: 'Career Skills Certificate'"), 'Career Skills certificate must be named explicitly');
must(js.includes("label: 'Professional Readiness Credential'"), 'Professional Readiness credential must be named explicitly');
must(js.includes("label: 'Role Lab Credential'"), 'Role Lab credential must be named explicitly');
must(js.includes('shorter practical Career Skills program'), 'Career Skills description must reflect the shorter practical program');
must(js.includes('full required technical, applied, Role Lab and professional-final evidence'), 'Professional Readiness description must reflect the advanced evidence standard');
must(js.includes("const isProfessional = levelKey === 'professional_readiness'"), 'Professional Readiness must be treated as a flagship certificate');
must(js.includes('const isFlagship = isCareer || isProfessional'), 'Flagship visual treatment must cover both Career Skills and Professional Readiness');
must(!js.includes('practical simulation, and Professional Readiness Final under the Capital Mastery Standard.'), 'Legacy generic Career Certificate copy must not remain');

console.log('public-credential-hierarchy-audit: PASS');
