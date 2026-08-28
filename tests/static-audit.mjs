import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const dataCode=fs.readFileSync(new URL('../data.js',import.meta.url),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(dataCode,ctx);
const d=ctx.window.CM_DATA;
const errors=[];const ok=(cond,msg)=>{if(!cond)errors.push(msg)};
ok(d.careers.length===16,`Expected 16 careers, got ${d.careers.length}`);
ok(Number(d.stats.credentials)>=48,'Expected at least 48 credential slots');
ok(d.stats.marketingCredentials==='45+','Homepage marketing count should be 45+');
for(const c of d.careers){
  ok(c.vocab.length>=10,`${c.id}: fewer than 10 vocabulary terms`);
  ok(c.concepts.length>=5,`${c.id}: fewer than 5 technical concepts`);
  ok(c.toolkit.length>=6,`${c.id}: fewer than 6 toolkit skills`);
  ok(c.applied.length>=5,`${c.id}: fewer than 5 applied assignments`);
  ok(c.sim_steps.length>=6,`${c.id}: fewer than 6 simulation steps`);
  ok(c.deliverables.length>=6,`${c.id}: fewer than 6 deliverables`);
  ok(c.sources.length>=4,`${c.id}: insufficient source mapping`);
}
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
ok(index.includes('45+ Free Finance Credentials | Made by Shriyan Avadhanula'),'SEO title missing founder/free-credential language');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
ok(app.includes('const PASS = 80'),'80% mastery threshold missing');
ok(app.includes("const need=final?20:10"),'10-question / 20-question assessment logic missing');
ok(app.includes('simulationScore'),'Simulation grading missing');
ok(app.includes('linkedinFields'),'LinkedIn credential flow missing');
ok(app.includes('downloadSocial'),'Social credential graphic flow missing');
ok(app.includes('adminPage'),'Admin QA Lab missing');
ok(!/adminPassword\s*[:=]/i.test(app),'Admin password must never be hard-coded');
ok(!/adminEmail\s*[:=]/i.test(app),'Admin account email should not be hard-coded before Firebase');
if(errors.length){console.error('STATIC AUDIT FAILED');for(const e of errors)console.error(' -',e);process.exit(1)}
console.log(`STATIC AUDIT PASS: ${d.careers.length} careers, ${d.stats.credentials} credential slots, research/source mapping present.`);
