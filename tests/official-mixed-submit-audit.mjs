import fs from 'node:fs';
function ok(v,m){ if(!v) throw new Error(m); }
const e2e=fs.readFileSync('capital-mastery-e2e.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(e2e.includes('const numeric = fieldset.querySelector(\'input[type="number"]\')'),'mixed validator must recognize numeric questions');
ok(e2e.includes("if (numeric) return !String(numeric.value || '').trim()"),'numeric questions must require a value rather than a radio selection');
ok(e2e.includes("form.querySelectorAll('input[name]').forEach(input =>"),'draft persistence must include numeric inputs');
ok(e2e.includes("else input.value = saved.answers[input.name]"),'numeric draft values must restore');
ok(/<script\s+src=["']capital-mastery-e2e\.js\?v=[^"']+["']><\/script>/.test(index),'mixed-submit helper must be loaded by the production shell with a cache-busted production URL');
console.log('OFFICIAL MIXED ASSESSMENT SUBMIT ISOLATION PASS');
