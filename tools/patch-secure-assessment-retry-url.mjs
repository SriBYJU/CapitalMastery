import fs from 'node:fs';

const FILE='capital-mastery-live.js';
let text=fs.readFileSync(FILE,'utf8');
const before=`  function nextHref(pathwayId, itemId, passed, assignmentId='') {\n    if (!passed) {\n      if (itemId === 'simulation') return \`#/official-simulation/\${pathwayId}\${assignmentId?\`?assignment=\${encodeURIComponent(assignmentId)}\`:''}\`;\n      if (itemId === 'final') return \`#/final/\${pathwayId}\`;\n      const n = Number(itemId.split('-')[1]);\n      return \`#/quiz/\${pathwayId}/\${n}\`;\n    }`;
const after=`  function nextHref(pathwayId, itemId, passed, assignmentId='') {\n    if (!passed) {\n      const nonce=Date.now();\n      if (itemId === 'simulation') {\n        const params=new URLSearchParams();\n        if(assignmentId) params.set('assignment',assignmentId);\n        params.set('retake','1'); params.set('attempt',String(nonce));\n        return \`#/official-simulation/\${pathwayId}?\${params.toString()}\`;\n      }\n      if (itemId === 'final') return \`#/final/\${pathwayId}?retake=1&attempt=\${nonce}\`;\n      const n = Number(itemId.split('-')[1]);\n      return \`#/quiz/\${pathwayId}/\${n}?retake=1&attempt=\${nonce}\`;\n    }`;
if(text.includes(after)){
  console.log('SECURE ASSESSMENT RETRY URL PATCH ALREADY APPLIED');
  process.exit(0);
}
if(!text.includes(before)) throw new Error('Missing secure nextHref failure anchor');
text=text.replace(before,after);
fs.writeFileSync(FILE,text);
console.log('SECURE ASSESSMENT RETRY URL PATCH APPLIED: failed secure assessments carry explicit unique retake routes even if browser default link navigation wins a race');
