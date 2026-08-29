import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(live.includes("const partMatch = /^part-(\\d+)$/.exec(itemId)"),'official part IDs must be parsed as digits');
ok(live.includes('if (part <= 4) {'),'parts 1-4 must mirror quiz progression immediately');
ok(live.includes("} else if (part === 5) {"),'part 5 knowledge must be handled separately');
ok(!live.includes('if (passed && !cs.completedParts.includes(part)) cs.completedParts.push(part);\n      }\n      if (itemId === \'simulation\')'),'part 5 knowledge must not mark simulation completion');
ok(/capital-mastery-live\.js\?v=[A-Za-z0-9._-]+/.test(index),'progress mirror fix must be cache-busted');
console.log('OFFICIAL PROGRESSION MIRROR PASS');
