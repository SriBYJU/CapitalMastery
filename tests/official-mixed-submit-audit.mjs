import fs from 'node:fs';
function ok(v,m){ if(!v) throw new Error(m); }
const e2e=fs.readFileSync('capital-mastery-e2e.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(e2e.includes('const numeric = fieldset.querySelector(\'input[type="number"]\')'),'mixed validator must recognize numeric questions');
ok(e2e.includes("if (numeric) return !String(numeric.value || '').trim()"),'numeric questions must require a value rather than a radio selection');
ok(e2e.includes("form.querySelectorAll('input[name]').forEach(input =>"),'draft persistence must include numeric inputs');
ok(e2e.includes("else input.value = saved.answers[input.name]"),'numeric draft values must restore');
ok(index.includes('capital-mastery-e2e.js?v=20260830-stability3'),'mixed-submit helper fix must be cache-busted to the current stability generation');
console.log('OFFICIAL MIXED ASSESSMENT SUBMIT ISOLATION PASS');
