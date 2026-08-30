import fs from 'node:fs';

const APP = 'app.js';
const LIVE = 'capital-mastery-live.js';
const WORKER = 'v2/worker-v2-phase1-release.js';

function read(path){ return fs.readFileSync(path,'utf8'); }
function write(path,text){ fs.writeFileSync(path,text); }
function must(condition,message){ if(!condition) throw new Error(message); }
function replaceOnce(text,before,after,label){
  must(text.includes(before), `Patch anchor missing: ${label}`);
  const next=text.replace(before,after);
  must(next!==text, `Patch did not change source: ${label}`);
  return next;
}

let app=read(APP);
app=replaceOnce(
  app,
  "if(c.id==='investment-banking' && !adminPreview && !qaMode()){ location.hash=`#/official-simulation/${c.id}`; return; }",
  "if(!adminPreview && !qaMode()){ location.hash=`#/official-simulation/${c.id}`; return; }",
  'all learner simulations use secure workbench'
);
app=replaceOnce(
  app,
  "n===5 ? (passed?`simulation/${c.id}`:`quiz/${c.id}/5`)",
  "n===5 ? (passed?`official-simulation/${c.id}`:`quiz/${c.id}/5`)",
  'part-5 pass opens official workbench directly'
);
app=replaceOnce(
  app,
  "if(!qaMode() && Number(cs.simulationScore||0)<PASS){toast('Pass the practical simulation first.','warn');return nav(`simulation/${c.id}`);}",
  "if(!qaMode() && Number(cs.simulationScore||0)<PASS){toast('Pass the practical simulation first.','warn');return nav(`official-simulation/${c.id}`);}",
  'final prerequisite points to official workbench'
);
write(APP,app);

let live=read(LIVE);
const oldWorkbenchField = `  function workbenchField(q) {\n    const wp = q.workProduct || {};\n    if (q.type === 'numeric') {\n      return \`<div class=\"cm-wb-input\"><span class=\"cm-wb-cell\">\${esc(wp.cell || '')}</span><label>\${esc(wp.label || q.prompt)}\${q.unit?\` <small>\${esc(q.unit)}</small>\`:''}<input type=\"number\" step=\"any\" name=\"\${esc(q.id)}\" required inputmode=\"decimal\" placeholder=\"Enter output\"></label></div>\`;\n    }\n    return \`<div class=\"cm-wb-input\"><label>\${esc(wp.label || q.prompt)}<select name=\"\${esc(q.id)}\" required><option value=\"\">Select finding…</option>\${(q.options||[]).map(x=>\`<option value=\"\${esc(x)}\">\${esc(x)}</option>\`).join('')}</select></label></div>\`;\n  }`;
const newWorkbenchField = `  function workbenchField(q) {\n    const wp = q.workProduct || {};\n    if (q.type === 'numeric') {\n      return \`<div class=\"cm-wb-input\"><span class=\"cm-wb-cell\">\${esc(wp.cell || '')}</span><label>\${esc(wp.label || q.prompt)}\${q.unit?\` <small>\${esc(q.unit)}</small>\`:''}<input type=\"number\" step=\"any\" name=\"\${esc(q.id)}\" required inputmode=\"decimal\" placeholder=\"Enter calculated output\"></label></div>\`;\n    }\n    if (q.type === 'text') {\n      return \`<label class=\"cm-wb-text-output\"><span>\${esc(wp.label || q.prompt)}</span><textarea name=\"\${esc(q.id)}\" required maxlength=\"3000\" placeholder=\"Write the workpaper note, QA finding, or reviewer-ready takeaway you would actually submit…\"></textarea></label>\`;\n    }\n    return \`<div class=\"cm-wb-input cm-wb-unsupported\"><strong>Unsupported work-product type.</strong><p>This practical simulation only accepts calculated outputs and written work products.</p></div>\`;\n  }`;
live=replaceOnce(live,oldWorkbenchField,newWorkbenchField,'IB workbench removes select-answer task UI');

live=replaceOnce(
  live,
  `<div class=\"eyebrow\">PROFESSIONAL WORKBENCH · SYNTHETIC CASE</div><h1>\${esc(p.project)}</h1><p>\${esc(p.role)}</p>`,
  `<div class=\"eyebrow\">PRACTICAL JOB SIMULATION · NO MULTIPLE CHOICE</div><h1>\${esc(p.project)}</h1><p>\${esc(p.role)} · Complete the work, not a quiz.</p>`,
  'career workbench practical framing'
);

live=replaceOnce(
  live,
  `<div class=\"eyebrow\">LIVE-STYLE ANALYST WORKBENCH · SYNTHETIC CASE</div><h1>\${esc(p.project)}</h1><p>\${esc(p.role)} · \${esc(p.desk)}</p>`,
  `<div class=\"eyebrow\">PRACTICAL ANALYST JOB SIMULATION · NO MULTIPLE CHOICE</div><h1>\${esc(p.project)}</h1><p>\${esc(p.role)} · \${esc(p.desk)} · Build the actual work product.</p>`,
  'IB workbench practical framing'
);

live=replaceOnce(
  live,
  `<nav><a href=\"#cm-wb-inbox\">01 · Inbox</a><a href=\"#cm-wb-data\">02 · Data Room</a><a href=\"#cm-wb-model\">03 · Model</a><a href=\"#cm-wb-valuation\">04 · Valuation</a><a href=\"#cm-wb-update\">05 · Update</a><a href=\"#cm-wb-qa\">06 · QA</a><a href=\"#cm-wb-email\">07 · Associate Email</a></nav>`,
  `<nav><a href=\"#cm-wb-inbox\">01 · Inbox</a><a href=\"#cm-wb-data\">02 · Data Room</a><a href=\"#cm-wb-model\">03 · Transaction Model</a><a href=\"#cm-wb-valuation\">04 · Trading Comps</a><a href=\"#cm-wb-precedents\">05 · Precedents</a><a href=\"#cm-wb-dcf\">06 · DCF</a><a href=\"#cm-wb-update\">07 · Management Update</a><a href=\"#cm-wb-qa\">08 · Model QA</a><a href=\"#cm-wb-client-materials\">09 · Client Takeaway</a><a href=\"#cm-wb-email\">10 · Associate Email</a></nav>`,
  'IB workday navigation'
);

live=replaceOnce(
  live,
  `${'${workbenchSection(data,\'model\',\'Transaction Model\',\'Build the capitalization bridge and headline transaction multiple from the source files.\')}${workbenchSection(data,\'valuation\',\'Trading Comps & Implied Value\',\'Calculate the defensible peer-set output rather than choosing the highest multiple.\')}${workbenchSection(data,\'update\',\'Management Update\',\'New information arrived at 2:17 PM. Update the forecast and every dependent output before continuing.\')}${workbenchSection(data,\'qa\',\'Model QA\',\'Review the planted model-check notes and identify the material issue that changes valuation.\')}'}`,
  `${'${workbenchSection(data,\'model\',\'Transaction Model\',\'Build the capitalization bridge and headline transaction multiple from the source files.\')}${workbenchSection(data,\'valuation\',\'Trading Comps & Implied Value\',\'Calculate the defensible peer-set output from the selected comparable companies.\')}${workbenchSection(data,\'precedents\',\'Precedent Transactions\',\'Spread the transaction multiples and calculate the implied value from the relevant precedent set.\')}${workbenchSection(data,\'dcf\',\'DCF Valuation\',\'Use the forecast free cash flow, WACC and terminal-growth assumptions to build the intrinsic-value cross-check.\')}${workbenchSection(data,\'update\',\'Management Update\',\'New information arrived at 2:17 PM. Update the forecast and every dependent output before continuing.\')}${workbenchSection(data,\'qa\',\'Model QA\',\'Find, document and correct the material model issue before senior review.\')}${workbenchSection(data,\'client-materials\',\'Client / Senior-Review Takeaway\',\'Turn the model outputs into the concise decision-relevant takeaway that belongs in senior-review materials.\')}'}`,
  'IB workbench includes precedents, DCF and client takeaway'
);
write(LIVE,live);

let worker=read(WORKER);
const fnStart=worker.indexOf('function buildInvestmentBankingSimulation(pathway) {');
must(fnStart>=0,'IB simulation builder not found');
const fnEnd=worker.indexOf('\nfunction ', fnStart+20);
must(fnEnd>fnStart,'IB simulation builder end not found');
let ib=worker.slice(fnStart,fnEnd);

const qaStart=ib.indexOf('    {\n      id: "ib-sim-qa"');
must(qaStart>=0,'IB QA task not found');
const qaEnd=ib.indexOf('    },', qaStart);
must(qaEnd>qaStart,'IB QA task end not found');
const qaReplacement=`    {\n      id: "ib-sim-qa",\n      type: "text",\n      prompt: "Document the material model QA error and the correction required before senior review",\n      keywords: ["cash", "add", "equity", "bridge", "enterprise"],\n      minHits: 3,\n      minWords: 14,\n      workProduct: { section:"qa", label:"Material QA finding", instruction:"Inspect the model-check notes, identify the valuation-changing error in your own words, and state how the EV-to-equity bridge must be corrected." }\n    }`;
ib=ib.slice(0,qaStart)+qaReplacement+ib.slice(qaEnd+6);

const questionsOpen=ib.indexOf('  const questions = [');
const questionsClose=ib.indexOf('\n  ];',questionsOpen);
must(questionsOpen>=0&&questionsClose>questionsOpen,'IB question array not found');
const extraTasks=`\n    {\n      id: "ib-sim-precedent-median",\n      type: "numeric",\n      prompt: "Median selected precedent EV / LTM EBITDA",\n      answer: 11.5,\n      tolerance: 0.03,\n      unit: "x",\n      workProduct: { section:"precedents", label:"Selected precedent median", cell:"E18", instruction:"Spread the four relevant precedent transactions and calculate the median EV / LTM EBITDA multiple." }\n    },\n    {\n      id: "ib-sim-precedent-equity",\n      type: "numeric",\n      prompt: "Equity value implied by the precedent median",\n      answer: 860,\n      tolerance: 0.75,\n      unit: "$m",\n      workProduct: { section:"precedents", label:"Precedent-implied Equity Value", cell:"E22", instruction:"Apply the 11.5x precedent median to Orion LTM EBITDA, then bridge enterprise value to equity value." }\n    },\n    {\n      id: "ib-sim-dcf-terminal",\n      type: "numeric",\n      prompt: "Gordon Growth terminal value",\n      answer: 1442,\n      tolerance: 1.5,\n      unit: "$m",\n      workProduct: { section:"dcf", label:"Terminal Value", cell:"J31", instruction:"Use Year-5 unlevered FCF × (1+g) ÷ (WACC−g)." }\n    },\n    {\n      id: "ib-sim-dcf-ev",\n      type: "numeric",\n      prompt: "DCF enterprise value",\n      answer: 1213.25,\n      tolerance: 1.5,\n      unit: "$m",\n      workProduct: { section:"dcf", label:"DCF Enterprise Value", cell:"J34", instruction:"Discount Years 1–5 unlevered FCF and terminal value at 9.0% WACC and sum the present values." }\n    },\n    {\n      id: "ib-sim-dcf-equity",\n      type: "numeric",\n      prompt: "DCF implied equity value",\n      answer: 1153.25,\n      tolerance: 1.75,\n      unit: "$m",\n      workProduct: { section:"dcf", label:"DCF Equity Value", cell:"J36", instruction:"Bridge DCF enterprise value to equity value using Orion debt and cash." }\n    },\n    {\n      id: "ib-sim-slide-headline",\n      type: "text",\n      prompt: "Write the senior-review valuation takeaway",\n      keywords: ["offer", "comps", "precedent", "dcf", "guidance", "valuation"],\n      minHits: 3,\n      minWords: 18,\n      workProduct: { section:"client-materials", label:"Valuation page headline", instruction:"Write one concise senior-review takeaway that reconciles the offer with trading comps, precedents and DCF, and flags the management-guidance change if it affects the recommendation." }\n    },`;
ib=ib.slice(0,questionsClose)+extraTasks+ib.slice(questionsClose);

const processIdx=ib.indexOf('{ id:"process", name:"05_Diligence_Request_List.pdf"');
must(processIdx>=0,'IB process file not found');
const filesClose=ib.indexOf('\n      ],',processIdx);
must(filesClose>processIdx,'IB files array close not found');
const extraFiles=`,\n        { id:"precedents", name:"06_Precedent_Transactions.xlsx", type:"Excel", label:"Precedent transactions", rows:[["Transaction","Enterprise Value","LTM EBITDA","EV / LTM EBITDA"],["Atlas / Nova","$972m","$90m","10.8x"],["Cedar / Prism","$1,140m","$100m","11.4x"],["Elm / Vector","$1,044m","$90m","11.6x"],["Granite / Pulse","$1,220m","$100m","12.2x"]] },\n        { id:"dcf", name:"07_Orion_DCF.xlsx", type:"Excel", label:"DCF assumptions", rows:[["Metric","Year 1","Year 2","Year 3","Year 4","Year 5"],["Unlevered FCF","$60m","$66m","$72m","$78m","$84m"],["WACC","9.0%","","","",""],["Terminal growth","3.0%","","","",""]] }`;
ib=ib.slice(0,filesClose)+extraFiles+ib.slice(filesClose);

ib=ib.replace(
  'objective: "Update the buy-side valuation materials and send the Associate a defensible recommendation before the VP review.",',
  'objective: "Complete the same-day buy-side valuation refresh: transaction model, trading comps, precedent transactions, DCF, management update, model QA and senior-review recommendation before the VP review.",'
);
ib=ib.replace(
  'body:"Please update the transaction snapshot, trading comps output and recommendation using the attached capitalization, forecast and peer files. Check the model carefully before you send anything up. I need your revised output before 5:30 PM."',
  'body:"Please refresh the transaction model, trading comps, precedents and DCF using the attached files, then update the senior-review takeaway. Check the model carefully before you send anything up. I need your revised output before 5:30 PM."'
);
ib=ib.replace(
  'writingPrompt: "Draft the email you would send to your Associate. State whether Northstar should continue diligence on Orion, cite the most decision-relevant valuation evidence, explain the impact of the new management guidance, identify at least two material risks or diligence items, and state the next step you recommend.",',
  'writingPrompt: "Draft the email you would send to your Associate. State whether Northstar should continue diligence on Orion; reconcile the offer against trading comps, precedent transactions and DCF; explain the impact of the new management guidance; identify at least two material risks or diligence items; and state the next step you recommend.",'
);

must(!/type:\s*["']choice["']/.test(ib),'IB official simulation still contains a choice task');
worker=worker.slice(0,fnStart)+ib+worker.slice(fnEnd);
write(WORKER,worker);

console.log('REAL JOB SIMULATION PATCH APPLIED: all learner simulations route to secure workbenches; IB adds precedents + DCF + free-response QA; official workbench answer-picking removed');
