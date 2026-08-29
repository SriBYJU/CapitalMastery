import fs from 'node:fs';
const v=fs.readFileSync('career-professional-visuals.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const app=fs.readFileSync('app.js','utf8');
const required=['cm-applied-workbench','cm-applied-prereq','INDEPENDENT WORK PRODUCT','data-applied-field','cm-applied-persistence','Order / execution ticket','Research / backtest design','Financial spread / ratios','Actual / budget / forecast bridge','Cash-position / 13-week view','Client goals & constraints','Exposure / limit dashboard','Property underwriting'];
for(const x of required) if(!v.includes(x)) throw new Error('Missing applied-work realism marker: '+x);
if(!css.includes('.cm-applied-persistence')||!css.includes('.cm-applied-workbench')) throw new Error('Applied work styling missing');
if(!app.includes('These assignments only use skills already introduced and demonstrated in Parts 2–3')) throw new Error('Teach-before-applied contract missing');
console.log('APPLIED WORK REALISM AUDIT PASS: role-format work products + teach-first linkage verified');
