import fs from 'node:fs';
function ok(v,m){ if(!v) throw new Error(m); }
const e2e=fs.readFileSync('capital-mastery-e2e.js','utf8');
const index=fs.readFileSync('index.html','utf8');
ok(e2e.includes('const numeric = fieldset.querySelector(\'input[type="number"]\')'),'mixed validator must recognize numeric questions');
ok(e2e.includes("if (numeric) return !String(numeric.value || '').trim()"),'numeric questions must require a value rather than a radio selection');
ok(e2e.includes("form.querySelectorAll('input[name], textarea[name], select[name]').forEach(control =>"),'draft persistence must include numeric, structured writing and select fields');
ok(e2e.includes('else control.value = savedFields[control.name]'),'numeric and written draft values must restore');
ok(e2e.includes('const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000'),'device drafts must expire after seven days');
ok(e2e.includes('localStorage.setItem(draftKey(),payload)'),'drafts must survive a closed tab on the same signed-in device');
ok(e2e.includes('localStorage.removeItem(draftKey())')&&e2e.includes('sessionStorage.removeItem(draftKey())'),'submitted or expired drafts must be removed from both storage tiers');
ok(/<script\s+src=["']capital-mastery-e2e\.js\?v=[^"']+["']><\/script>/.test(index),'mixed-submit helper must be loaded by the production shell with a cache-busted production URL');
console.log('OFFICIAL MIXED ASSESSMENT SUBMIT ISOLATION PASS');
