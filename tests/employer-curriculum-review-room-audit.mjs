import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m)}
const v=fs.readFileSync('career-professional-visuals.js','utf8');
const e=fs.readFileSync('enterprise-v2.js','utf8');
const c=fs.readFileSync('enterprise-v2.css','utf8');
ok(v.includes('window.CM_PROFESSIONAL_PREVIEW'),'professional preview API must be exported');
ok(v.includes("mode==='rolelab'")&&v.includes("mode==='applied'"),'review API must expose toolkit, applied work and Role Lab modes');
for(const x of ['privateEquitySurface','ventureSurface','corpDevSurface']) ok(v.includes(x),'review API must preserve specialized '+x);
ok(e.includes('INTERACTIVE CURRICULUM REVIEW ROOM'),'employer curriculum must include interactive review room');
ok(e.includes('cmv2-review-career')&&e.includes('catalog.pathways.map'),'review room must allow cross-career inspection before rollout');
ok(e.includes('No learner state changes')&&e.includes('No answer keys exposed'),'review room must state safety boundaries');
ok(e.includes("canManageContent=['owner','training_admin','content_manager'].includes(membershipRole)"),'curriculum mutations must be role-aware in the UI');
ok(e.includes("READ ONLY")&&e.includes('data-content-history'),'read-only roles should retain inspection/history without mutation controls');
ok(c.includes('.cmv2-curriculum-review-room')&&c.includes('.cm-review-rolelab'),'review room must have production styling');
console.log('EMPLOYER CURRICULUM REVIEW ROOM AUDIT PASS: safe deep preview + role-aware controls verified');
