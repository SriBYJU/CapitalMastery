import fs from 'node:fs';

const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
function assert(c,m){if(!c)throw new Error(m);}

// Course pedagogy: teach -> demonstrate -> guided practice -> independent practice -> real job work.
for(const marker of [
  'PRACTICE NOW · BEFORE THE QUIZ',
  '1 · TEACH',
  '2 · VISUAL DEMONSTRATION',
  '3 · GUIDED BUILD',
  '4 · INDEPENDENT PRACTICE',
  'Applied work before the full simulation',
  'Nothing disappears after the quiz.',
  'The Part 5 knowledge check confirms you understand the workflow.'
]) assert(app.includes(marker),`Course pedagogy missing: ${marker}`);

// Official simulations are workdays, not quizzes.
assert(worker.includes("function simUpdate("),'Role-native live-update task helper missing');
assert(worker.includes("version:'2.1-workday'"),'Career simulations must identify the workday-grade version');
assert(worker.includes('managerUpdate:update?'),'Career simulation profile must expose a role-native manager update');
assert(worker.includes('evidenceGroups:[...(update.impactGroups||[]),...(update.actionGroups||[])]'),'Live update task must grade evidence categories, not answer recognition');
assert(worker.includes('groupHits=Array.isArray(q.evidenceGroups)'),'Authored update work must use evidence-group grading');
assert(!worker.includes("simUpdate(id,label,update,section,instruction) { return {id,type:'mc'"),'Live update must never become MCQ');

const careers=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
const updateStart=worker.indexOf('const CAREER_ROLELAB_UPDATES = {');
const updateEnd=worker.indexOf('\nconst CAREER_REVIEW_STANDARDS',updateStart);
assert(updateStart>=0&&updateEnd>updateStart,'Role-native update catalog missing');
const updates=worker.slice(updateStart,updateEnd);
for(const id of careers){
  assert(updates.includes(`'${id}': {`) || updates.includes(`${id}: {`),`${id}: role-native mid-assignment update missing`);
}
for(const marker of ['timestamp:','fileName:','deliverable:','message:','impactGroups:','actionGroups:']){
  const count=(updates.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
  assert(count>=15,`Expected all 15 non-IB updates to define ${marker}; found ${count}`);
}

// The rendering should feel like a reviewer interruption inside the workday.
for(const marker of [
  'MID-ASSIGNMENT UPDATE · INBOX',
  'Your first draft is no longer enough.',
  'Expected revised deliverable:',
  'role-native mid-assignment update',
  'This simulation tests job execution—not answer recognition.'
]) assert(live.includes(marker),`Career workbench renderer missing: ${marker}`);
assert(live.includes("const update=p.managerUpdate||null;"),'Renderer must consume Worker-provided manager update');
assert(live.includes('${updateHtml}'),'Manager update must be inserted into the learner workbench');

// Each workbench must carry a real source packet, calculated/authored outputs and reviewer handoff.
const catalogStart=worker.indexOf('const CAREER_WORKBENCHES = {');
const catalogEnd=worker.indexOf('\nconst CAREER_ROLELAB_UPDATES',catalogStart);
assert(catalogStart>=0&&catalogEnd>catalogStart,'Career workbench catalog missing');
const catalog=worker.slice(catalogStart,catalogEnd);
for(const id of careers){
  const startA=catalog.indexOf(`  '${id}': {`);
  const start=startA>=0?startA:catalog.indexOf(`  ${id}: {`);
  assert(start>=0,`${id}: workbench missing`);
  const later=careers.map(other=>catalog.indexOf(`  '${other}': {`,start+1)).filter(n=>n>start);
  const treasury=catalog.indexOf('\n  treasury: {',start+1); if(treasury>start)later.push(treasury);
  const end=later.length?Math.min(...later):catalog.length;
  const block=catalog.slice(start,end);
  assert((block.match(/\{id:/g)||[]).length>=2,`${id}: source packet too thin`);
  assert((block.match(/simNum\(/g)||[]).length>=4,`${id}: needs at least four calculated job outputs`);
  assert((block.match(/simText\(/g)||[]).length>=1,`${id}: needs at least one authored judgment/workpaper output`);
  assert(block.includes('writingPrompt:'),`${id}: manager/PM/IC/client handoff missing`);
  assert(block.includes('reviewer:'),`${id}: reviewer missing`);
  assert(block.includes('deadline:'),`${id}: deadline missing`);
  assert(!/\bmc\(/.test(block),`${id}: workbench must not construct MCQs`);
}

// IB carries the fuller M&A valuation day separately.
for(const marker of ['ib-sim-comps-median','ib-sim-precedent-median','ib-sim-dcf-terminal','ib-sim-revised-revenue','ib-sim-qa','ib-sim-slide-headline']){
  assert(worker.includes(marker),`Investment Banking workday missing ${marker}`);
}

console.log('FIRM-READY COURSE WORKBENCH AUDIT PASS: teach-first course chain + 16 role-native no-MCQ simulations + live reviewer updates + real outputs + professional handoffs');
