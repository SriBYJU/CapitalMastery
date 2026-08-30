import fs from 'node:fs';

const path='enterprise-v2.js';
let text=fs.readFileSync(path,'utf8');
function once(from,to,label){const i=text.indexOf(from);if(i<0)throw new Error(`Missing patch target: ${label}`);if(text.indexOf(from,i+from.length)>=0)throw new Error(`Ambiguous patch target: ${label}`);text=text.slice(0,i)+to+text.slice(i+from.length);}

once(
  "      if(x.readiness && Number(x.readiness.evidenceCoverage||0)>=70 && Number(x.readiness.overallScore||0)<75) return {priority:70,label:'Skill evidence gap',reason:`Current measured skill evidence is ${Number(x.readiness.overallScore)} with ${Number(x.readiness.evidenceCoverage)}% evidence coverage.`,action:'Review the lowest measured Career Skills competencies'};\n      return null;",
  "      if(x.readiness && Number(x.readiness.evidenceCoverage||0)>=70 && Number(x.readiness.overallScore||0)<75) return {priority:70,label:'Skill evidence gap',reason:`Current measured skill evidence is ${Number(x.readiness.overallScore)} with ${Number(x.readiness.evidenceCoverage)}% evidence coverage.`,action:'Review the lowest measured Career Skills competencies'};\n      if(!x.readiness && !x.complete) return {priority:50,label:'Not started',reason:'No measurable Career Skills evidence is recorded yet.',action:'Confirm the learner has opened the assigned program'};\n      return null;",
  'Career Skills no-evidence coaching state'
);

once(
  "    if (x.roleLab?.score!=null && Number(x.roleLab.score)<80) return {priority:70,label:'Role Lab below standard',reason:`Role Lab ${Number(x.roleLab.score)}%; applied performance needs development.`,action:'Review Role Lab feedback and revision'};\n    return null;",
  "    if (x.roleLab?.score!=null && Number(x.roleLab.score)<80) return {priority:70,label:'Role Lab below standard',reason:`Role Lab ${Number(x.roleLab.score)}%; applied performance needs development.`,action:'Review Role Lab feedback and revision'};\n    if (x.diagnostic && !x.roleLab && Number(x.diagnostic.score)<65) return {priority:60,label:'Foundation gap',reason:`Baseline ${Number(x.diagnostic.score)}%; learner may need additional technical reinforcement.`,action:'Use skill profile to focus practice'};\n    if (!x.diagnostic) return {priority:50,label:'Not started',reason:'No baseline diagnostic recorded yet.',action:'Confirm learner has opened the assignment'};\n    return null;",
  'Professional coaching state preservation'
);

fs.writeFileSync(path,text);
console.log('Two-track attention regression fix applied.');
