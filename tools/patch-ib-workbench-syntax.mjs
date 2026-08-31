import fs from 'node:fs';
const FILE='v2/worker-v2-phase1-release.js';
let src=fs.readFileSync(FILE,'utf8');
function fix(id){
  const needle=`\n    }\n    {\n      id: "${id}"`;
  const replacement=`\n    },\n    {\n      id: "${id}"`;
  if(src.includes(needle)) src=src.replace(needle,replacement);
  else if(!src.includes(replacement)) throw new Error(`Expected IB question separator missing before ${id}`);
}
fix('ib-sim-revised-equity');
fix('ib-sim-precedent-median');
fs.writeFileSync(FILE,src);
console.log('IB WORKBENCH SYNTAX REPAIR APPLIED: question object separators restored');
