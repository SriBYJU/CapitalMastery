import assert from 'node:assert/strict';
import {
  assessmentPassDecision,
  buildInvestmentBankingSimulation,
  gradeAssessment,
  gradeWritingDetailed
} from '../v2/worker-v2-phase1-release.js';

const assessment=buildInvestmentBankingSimulation({id:'investment-banking'});
const answers=Object.fromEntries(assessment.questions.map(question=>[question.id,question.answer]));
const strongWriting=`
Decision / recommendation:
I recommend Northstar continue diligence, subject to confirming customer renewals, because the offer remains supportable across the refreshed valuation work.

Case evidence:
The $19.75 offer implies $850m of enterprise value and a 10.625x LTM multiple. Trading comps support about $840m of equity value at 10.25x, precedents imply $860m, and the DCF provides a higher intrinsic cross-check at about $1,153m. Management revised Year-1 revenue down 5% to $456m and EBITDA to $83.5m, lowering the refreshed comps-based equity value to roughly $794m and reducing headroom versus the offer.

Material risk / what could change:
The two priority risks are top-customer concentration and near-term contract renewals, plus uncertainty in recurring-versus-services revenue mix and synergy implementation cost. Those items could reduce sustainable EBITDA or the value of expected synergies.

Controlled next action:
I will request the top-10 customer schedule and revenue bridge today, ask management to validate synergy costs, then rerun the model and send the sensitivity to Maya before VP review.
`;

const evaluation=gradeWritingDetailed(strongWriting,assessment);
assert.ok(evaluation.score>=27,'Decision-ready structured handoff should earn a strong transparent rubric score');
assert.equal(evaluation.rubric.length,6,'IB writing must expose all six rubric categories');

const strongResult=gradeAssessment(assessment,answers,strongWriting);
const strongDecision=assessmentPassDecision(assessment,strongResult,80);
assert.equal(strongDecision.passed,true,'Correct work products plus a decision-ready handoff should pass');
assert.equal(strongDecision.objectiveFloorMet,true);
assert.equal(strongDecision.writingFloorMet,true);

const missingRisks=`
Decision / recommendation:
I recommend Northstar proceed because the offer remains supportable across the refreshed valuation work, subject to a final general review.

Case evidence:
The $19.75 offer implies $850m of enterprise value and a 10.625x LTM multiple. Trading comps support about $840m of equity value at 10.25x, precedents imply $860m, and the DCF provides a higher intrinsic cross-check at about $1,153m. Management revised Year-1 revenue down 5% to $456m and EBITDA to $83.5m, lowering the refreshed valuation to roughly $794m.

Material risk / what could change:
The case has general uncertainty, but no specific issue is identified here.

Controlled next action:
I will request a general review, then rerun the model and send it to the Associate before VP review.
`;
const missingRiskResult=gradeAssessment(assessment,answers,missingRisks);
const missingRiskDecision=assessmentPassDecision(assessment,missingRiskResult,80);
assert.equal(missingRiskDecision.passed,false,'A high numerical score must not hide a handoff without two case-specific risks');
assert.equal(missingRiskDecision.rubricFloorsMet,false);

const weakResult=gradeAssessment(assessment,answers,'');
const weakDecision=assessmentPassDecision(assessment,weakResult,80);
assert.equal(weakDecision.passed,false,'Correct model outputs with an empty handoff must fail');
assert.equal(weakDecision.writingFloorMet,false);

console.log('IB WORKBENCH QUALITY GATE AUDIT PASS: automatic server grading enforces overall, work-product, writing, and critical-rubric floors');
