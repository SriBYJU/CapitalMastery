import fs from 'node:fs';
function ok(v,m){if(!v)throw new Error(m);}
const app=fs.readFileSync('app.js','utf8');
const ib=fs.readFileSync('ib-analyst-toolkit.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
ok(app.includes('TEACH → SHOW → GUIDE → PRACTICE'),'Global toolkit must declare teach-first sequence');
ok(app.includes('1 · TEACH')&&app.includes('2 · VISUAL DEMONSTRATION')&&app.includes('3 · GUIDED BUILD')&&app.includes('4 · INDEPENDENT PRACTICE'),'Every generic toolkit lab must render all four learning stages');
ok(app.includes('Taught first:'),'Applied work must point back to taught toolkit workflow');
ok(app.includes('learn → see a worked example → guided build → independent assignment'),'Applied review loop must preserve teaching before independent work');
ok(ib.includes('function excelWorkbookTutorial'),'IB must have dedicated spreadsheet tutorial');
ok(ib.includes('cm-sheet-formula')&&ib.includes('cm-sheet-colheads')&&ib.includes('cm-sheet-tabs'),'IB Excel tutorial must include formula bar, column headers and workbook tabs');
ok(ib.includes('Operating Model')&&ib.includes('Assumptions')&&ib.includes('Valuation')&&ib.includes('Checks'),'IB workbook must show realistic multi-tab organization');
ok(ib.includes('Hardcoded input')&&ib.includes('Formula')&&ib.includes('Other-sheet link')&&ib.includes('Model check'),'IB workbook must teach model cell types and auditability');
ok(ib.includes('Common modeling convention, not a universal bank rule'),'IB must distinguish common conventions from firm-specific house styles');
ok(ib.includes('1 · VISUAL DEMO')&&ib.includes('2 · GUIDED PRACTICE'),'Every upgraded IB module must receive demonstration before practice');
ok(css.includes('.cm-sheet-grid')&&css.includes('.cm-filing-demo')&&css.includes('.cm-vdr-demo')&&css.includes('.cm-slide-demo'),'Visual professional-work surfaces must be styled');
console.log('TEACH-FIRST CURRICULUM + IB VISUAL TOOLKIT AUDIT PASS');
