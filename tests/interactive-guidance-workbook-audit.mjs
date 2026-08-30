import fs from 'node:fs';
function ok(value,message){if(!value)throw new Error(message);}
const index=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const guide=fs.readFileSync('learner-guide.js','utf8');
const guideCss=fs.readFileSync('learner-guide.css','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const visuals=fs.readFileSync('career-professional-visuals.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');

ok(index.includes('learner-guide.css?v=20260830-stability4')&&index.includes('learner-guide.js?v=20260830-guided1'),'Interactive learner guide assets must be loaded with the current mobile-stability stylesheet generation');
ok(index.includes('app.js?v=20260830-stability3')&&index.includes('enterprise-v2.js?v=20260830-guided2')&&index.includes('career-professional-visuals.js?v=20260830-workbook1'),'Product-polish assets must be cache-busted to the current stability generation');
ok(app.includes('HOW YOU ARE ASSESSED')&&app.includes('no Career Certificate is earned through multiple choice alone'),'Career pages must explain the practical proof journey');
ok(!app.includes('20-question comprehensive credential gate')&&!live.includes('MCQ knowledge testing remains'),'Public product copy must not frame readiness as an MCQ-only course');
ok(app.includes("root==='learner-guide'")&&app.includes("link('learner-guide','How Learning Works')"),'Learner guide must be routable and discoverable');
for(const step of ['role','sequence','work','change','proof']) ok(guide.includes(`data-learner-guide-panel="${step}"`),`Learner guide is missing ${step}`);
ok(guide.includes('data-guide-revenue')&&guide.includes('data-guide-margin')&&guide.includes('data-guide-apply-update'),'Learner guide must include live modeling and a material case update');
ok(guide.includes('Secure questions and calculations')&&guide.includes('Models, analyses, memos and decisions'),'Guide must distinguish knowledge evidence from work-product evidence');
ok(guideCss.includes('@media(max-width:640px)')&&guideCss.includes('.cm-guide-workbook'),'Learner guide must have responsive workbook styling');
ok(guideCss.includes('Failure-seeking mobile containment')&&guideCss.includes('.cm-learner-guide-nav,.cm-learner-guide-panels')&&guideCss.includes('grid-template-columns:minmax(0,1fr)')&&guideCss.includes('overscroll-behavior-inline:contain'),'Learner guide must prevent grid min-content expansion while containing only intentionally wide workbook content');
ok(enterprise.includes('INTERACTIVE EMPLOYER WALKTHROUGH')&&enterprise.includes('data-employer-tour-tab')&&enterprise.includes('bindEmployerPublicTour'),'Public employer experience must include an interactive walkthrough');
ok(enterprise.includes('INTERACTIVE EMPLOYER GUIDE')&&enterprise.includes('Mark this step understood'),'Authenticated employer launch guide must remain available');
ok(app.includes('PRACTICE NOW · BEFORE THE QUIZ')&&app.includes('data-concept-practice')&&app.includes('Self-review standard'),'Every technical concept must include immediate saved practice before assessment');
for(const marker of ['Analyst Training Workbook','CALCULATION: AUTOMATIC','data-role-sheet-tab','cm-role-sheet-status','BLUE INPUTS · GREEN FORMULAS']) ok(visuals.includes(marker),`Professional workbook is missing ${marker}`);
for(const formulaTarget of ['peEntryEv','vcTam','cdRiskAdj','usableCash','netReturn','leverageBase','effectiveRent','propertyValue']) ok(visuals.includes(`set('${formulaTarget}'`),`Automatic workbook formula missing for ${formulaTarget}`);
ok(visuals.includes('set(`variance${suffix}`')&&visuals.includes('set(`riskUtil${suffix}`'),'Repeated FP&A and risk rows must calculate automatically');
ok(visuals.includes("target.readOnly=true")&&guideCss.includes('input[readonly][data-calculated]'),'Calculated cells must be read-only and visually distinct');
console.log('INTERACTIVE GUIDANCE + WORKBOOK AUDIT PASS: learner/employer tours, immediate concept practice, spreadsheet conventions and structurally contained mobile grids');
