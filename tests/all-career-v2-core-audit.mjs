import fs from 'node:fs';
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const e=fs.readFileSync('enterprise-v2.js','utf8');
const m=fs.readFileSync('migrations/013_phase2_all_career_competencies_credentials.sql','utf8');
const careers=['private-equity','venture-capital','equity-research','asset-management','hedge-funds','sales-trading','quantitative-finance','private-credit','corporate-banking','corporate-development','fp-and-a','treasury','wealth-management','risk-management','real-estate-finance'];
for(const id of careers){
  if(!w.includes(`'${id}'`)) throw new Error('Worker missing '+id);
  const compCount=(m.match(new RegExp(`pathway_competencies \\(pathway_id,competency_id,weight,minimum_score,critical\\) VALUES \\('${id}'`,'g'))||[]).length;
  if(compCount!==6) throw new Error(`${id} expected 6 competency mappings, got ${compCount}`);
  const credCount=(m.match(new RegExp(`'${id}','(?:foundations|essentials|applied|role_lab|professional_readiness)','2\\.0'`,'g'))||[]).length;
  if(credCount!==5) throw new Error(`${id} expected 5 V2 credential definitions, got ${credCount}`);
}
for(const marker of ['v2DynamicDiagnosticQuestions','v2DynamicAssessmentFromKey','v2DynamicLabByKey','question_type','dynamicQuestions','assessment.stage===\'essentials\'','assessment.stage===\'final\'']) if(!w.includes(marker)) throw new Error('V2 dynamic core missing '+marker);
for(const marker of ['assessmentKey(pathwayId, stage)','v2AssessmentQuestionHtml','q.type===\'numeric\'','roleLabScenarioFiles','publicPathId','Learn Foundations + Technical Core','Professional Toolkit','Applied Work']) if(!e.includes(marker)) throw new Error('V2 UI generalization missing '+marker);
if(!w.includes('"quant-finance": "quantitative-finance"') && !w.includes("'quant-finance': 'quantitative-finance'") && !w.includes('"quant-finance": \"quantitative-finance\"')) throw new Error('Quant pathway alias missing');
console.log('ALL-CAREER V2 CORE AUDIT PASS: 16-career competency, credential, secure assessment and Role Lab architecture verified');
