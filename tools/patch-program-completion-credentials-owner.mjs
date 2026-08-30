import fs from 'node:fs';

const path='capital-mastery-live-ui.js';
let src=fs.readFileSync(path,'utf8');
const before="    if (root === 'credentials') return renderCredentials();";
const after=`    if (root === 'credentials') {\n      // capital-mastery-live.js is the single authoritative owner of the credentials\n      // index, including separate Standard credentials and Program Completions.\n      // This richer UI layer continues to own detail/certificate/achievement routes.\n      return;\n    }`;
if(!src.includes(before)) throw new Error('Expected duplicate credentials route owner not found');
if(src.split(before).length!==2) throw new Error('Duplicate credentials route owner target is ambiguous');
src=src.replace(before,after);
fs.writeFileSync(path,src);
console.log('Removed duplicate credentials-index renderer ownership from capital-mastery-live-ui.js');