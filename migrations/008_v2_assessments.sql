CREATE TABLE IF NOT EXISTS v2_assessment_definitions (
  assessment_key TEXT NOT NULL,
  version TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('essentials','applied','final')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scenario_json TEXT NOT NULL DEFAULT '{}',
  pass_score INTEGER NOT NULL CHECK (pass_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_key, version)
);

CREATE TABLE IF NOT EXISTS v2_assessment_questions (
  id TEXT PRIMARY KEY,
  assessment_key TEXT NOT NULL,
  assessment_version TEXT NOT NULL,
  position INTEGER NOT NULL,
  competency_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 20),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  UNIQUE(assessment_key, assessment_version, position),
  FOREIGN KEY (assessment_key, assessment_version) REFERENCES v2_assessment_definitions(assessment_key, version),
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

CREATE TABLE IF NOT EXISTS v2_assessment_attempts (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  org_id TEXT,
  cohort_id TEXT,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  assessment_key TEXT NOT NULL,
  assessment_version TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  answers_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_v2_assessment_questions ON v2_assessment_questions(assessment_key, assessment_version, status, position);
CREATE INDEX IF NOT EXISTS idx_v2_attempts_user ON v2_assessment_attempts(uid, pathway_id, assessment_key, submitted_at);
CREATE INDEX IF NOT EXISTS idx_v2_attempts_assignment ON v2_assessment_attempts(assignment_id, assessment_key, passed, submitted_at);

INSERT OR REPLACE INTO v2_assessment_definitions
(assessment_key,version,pathway_id,stage,title,description,scenario_json,pass_score,status) VALUES
('ib-essentials-case','2.0','investment-banking','essentials','Investment Banking Essentials Mini Case','A guided beginner case that checks whether a learner can move from basic role knowledge into simple financial analysis and transaction reasoning.','{"company":"HarborTech Systems","context":"HarborTech is a fictional software-enabled services company. You are helping an analyst prepare a first-pass company snapshot.","revenue":240,"ebitda":36,"debt":50,"cash":20,"shares":15,"share_price":12,"buyer_offer":15,"note":"All names and figures are synthetic training data."}',75,'active'),
('ib-professional-final','2.0','investment-banking','final','Investment Banking Professional Readiness Final','Final standardized assessment covering valuation, transaction mechanics, model review, judgment, communication and quality control after the Role Lab.','{"company":"Orion Industrial Technologies","context":"Orion is a fictional industrial technology company being evaluated in an acquisition process. Use the case facts to answer the final analyst-readiness questions.","revenue_2026":800,"ebitda_2026":120,"shares":50,"share_price":20,"debt":180,"cash":60,"peer_multiples":[8,9,10,11],"precedent_multiples":[10,11,12],"dcf_share_value":22.5,"offer_price":24.5,"revised_ebitda":108,"note":"All names and figures are synthetic training data."}',80,'active');

INSERT OR REPLACE INTO v2_assessment_questions
(id,assessment_key,assessment_version,position,competency_id,prompt,options_json,correct_answer,rationale,weight,status) VALUES
('ibe1','ib-essentials-case','2.0',1,'cmp_ib_accounting','HarborTech reports $240m revenue and $36m EBITDA. What is EBITDA margin?','["10%","12%","15%","18%"]','15%','EBITDA margin is EBITDA divided by revenue: 36 / 240 = 15%.',1,'active'),
('ibe2','ib-essentials-case','2.0',2,'cmp_ib_ev','At $12 per share and 15m shares, what is HarborTech equity value?','["$150m","$180m","$210m","$240m"]','$180m','Equity value is share price multiplied by diluted shares.',1,'active'),
('ibe3','ib-essentials-case','2.0',3,'cmp_ib_ev','Using $50m debt and $20m cash, what is enterprise value?','["$150m","$180m","$210m","$230m"]','$210m','Enterprise value is equity value plus debt less cash: 180 + 50 - 20 = 210.',1,'active'),
('ibe4','ib-essentials-case','2.0',4,'cmp_ib_comps','What is HarborTech current EV / EBITDA using the case figures?','["4.0x","5.0x","5.8x","7.5x"]','5.8x','210 / 36 is approximately 5.83x.',1,'active'),
('ibe5','ib-essentials-case','2.0',5,'cmp_ib_ma','A buyer offers $15 per share versus a current $12 share price. What is the offer premium?','["15%","20%","25%","30%"]','25%','The premium is (15 / 12) - 1 = 25%.',1,'active'),
('ibe6','ib-essentials-case','2.0',6,'cmp_ib_judgment','If HarborTech growth is slowing while the buyer is paying a 25% premium, what is the best next step for an analyst?','["Ignore growth because the offer is higher than the stock price","Test the valuation and downside assumptions before recommending the price","Automatically reject the deal","Delete the growth forecast"]','Test the valuation and downside assumptions before recommending the price','Analyst judgment connects the price to operating assumptions and downside rather than relying on a headline premium.',1,'active'),
('ibe7','ib-essentials-case','2.0',7,'cmp_ib_detail','Which check is most useful before sending the company snapshot?','["Reconcile share count, debt, cash and valuation math","Change the company name font","Remove all source notes","Round every figure to the nearest hundred"]','Reconcile share count, debt, cash and valuation math','Core valuation inputs should reconcile before work is sent upward.',1,'active'),
('ibe8','ib-essentials-case','2.0',8,'cmp_ib_comm','Which update is most useful to an Associate?','["Done.","HarborTech is worth something around $200m.","HarborTech has $180m equity value and $210m enterprise value; the $15 offer implies a 25% premium. I would next test whether the premium is supported by the operating outlook.","I finished the page quickly."]','HarborTech has $180m equity value and $210m enterprise value; the $15 offer implies a 25% premium. I would next test whether the premium is supported by the operating outlook.','A useful update states the key outputs and the next analytical question.',1,'active'),

('ibf1','ib-professional-final','2.0',1,'cmp_ib_accounting','Orion has $800m revenue and $120m EBITDA. What is EBITDA margin?','["12%","15%","18%","20%"]','15%','120 / 800 = 15%.',1,'active'),
('ibf2','ib-professional-final','2.0',2,'cmp_ib_ev','At $20 per share and 50m shares, what is Orion equity value?','["$800m","$900m","$1,000m","$1,120m"]','$1,000m','20 × 50 = $1,000m.',1,'active'),
('ibf3','ib-professional-final','2.0',3,'cmp_ib_ev','With $180m debt and $60m cash, what is Orion current enterprise value?','["$880m","$1,000m","$1,120m","$1,240m"]','$1,120m','Enterprise value = 1,000 + 180 - 60 = $1,120m.',1,'active'),
('ibf4','ib-professional-final','2.0',4,'cmp_ib_comps','The peer EV / EBITDA multiples are 8.0x, 9.0x, 10.0x and 11.0x. What is the median?','["9.0x","9.5x","10.0x","10.5x"]','9.5x','For four observations, the median is the average of the two middle values: 9.5x.',1,'active'),
('ibf5','ib-professional-final','2.0',5,'cmp_ib_comps','At the 9.5x peer median and $120m EBITDA, what is implied enterprise value?','["$960m","$1,080m","$1,140m","$1,320m"]','$1,140m','9.5 × 120 = $1,140m.',1,'active'),
('ibf6','ib-professional-final','2.0',6,'cmp_ib_precedents','Precedent multiples are 10.0x, 11.0x and 12.0x. What is the median-implied enterprise value using $120m EBITDA?','["$1,080m","$1,200m","$1,320m","$1,440m"]','$1,320m','The median is 11.0x, which implies 11 × 120 = $1,320m.',1,'active'),
('ibf7','ib-professional-final','2.0',7,'cmp_ib_precedents','Why can precedent transaction values exceed trading-comps values?','["Transactions can include a control premium and transaction-specific synergies","Public companies never have debt","Precedents ignore purchase price","Trading comps always use book value"]','Transactions can include a control premium and transaction-specific synergies','Acquisition prices can reflect control and transaction-specific strategic value.',1,'active'),
('ibf8','ib-professional-final','2.0',8,'cmp_ib_dcf','The DCF implies $22.50 per share while peer comps imply about $20.40 per share. What is the best interpretation?','["The DCF must be wrong","Different methodologies can support different values; reconcile assumptions and present a range","Always choose the higher method","Average them without reviewing assumptions"]','Different methodologies can support different values; reconcile assumptions and present a range','Valuation methods are cross-checks; differences should be understood rather than mechanically discarded.',1,'active'),
('ibf9','ib-professional-final','2.0',9,'cmp_ib_ma','At a $24.50 offer price versus $20.00 current price, what is the offer premium?','["12.5%","20.0%","22.5%","24.5%"]','22.5%','24.5 / 20 - 1 = 22.5%.',1,'active'),
('ibf10','ib-professional-final','2.0',10,'cmp_ib_review','A model calculates enterprise value as equity value + debt + cash. What is the issue?','["Cash should generally be subtracted in the EV bridge","Debt should be removed","Equity value should be zero","There is no issue"]','Cash should generally be subtracted in the EV bridge','Standard EV reconciliation adds debt and subtracts cash/non-operating cash equivalents.',1,'active'),
('ibf11','ib-professional-final','2.0',11,'cmp_ib_detail','The model uses 47m shares on the valuation page but 50m diluted shares in the capitalization schedule. What should happen before the output is sent?','["Use whichever number gives a higher share price","Reconcile the share-count inconsistency and trace the correct diluted figure","Hide the capitalization schedule","Change the font color"]','Reconcile the share-count inconsistency and trace the correct diluted figure','Share-count inconsistencies can materially distort per-share valuation and must be resolved.',1,'active'),
('ibf12','ib-professional-final','2.0',12,'cmp_ib_judgment','Management lowers EBITDA from $120m to $108m after the buyer proposes $24.50 per share. What is the strongest response?','["Keep the recommendation unchanged without analysis","Re-run valuation/downside and reassess whether the offer remains supportable","Increase the offer automatically","Ignore the revision because it happened after the first model"]','Re-run valuation/downside and reassess whether the offer remains supportable','New operating information should flow through valuation and the deal recommendation.',1,'active'),
('ibf13','ib-professional-final','2.0',13,'cmp_ib_comm','Which message is most useful to a VP after the EBITDA revision?','["EBITDA changed.","Management cut EBITDA to $108m; I am rerunning comps and downside to quantify the effect on the $24.50 offer and will flag whether the recommendation changes.","The model looks worse now.","I will send something later."]','Management cut EBITDA to $108m; I am rerunning comps and downside to quantify the effect on the $24.50 offer and will flag whether the recommendation changes.','The update identifies the change, the analysis being performed and the decision-relevant output.',1,'active'),
('ibf14','ib-professional-final','2.0',14,'cmp_ib_ma','In a sources & uses schedule, which item is normally a Source?','["Purchase of target equity","Transaction fees","New acquisition debt","Refinancing target debt"]','New acquisition debt','Sources describe funding; purchase consideration, refinancing and fees are uses.',1,'active'),
('ibf15','ib-professional-final','2.0',15,'cmp_ib_dcf','If WACC rises while cash-flow forecasts and terminal growth stay unchanged, what happens to DCF value?','["Generally decreases","Generally increases","Never changes","Only share count changes"]','Generally decreases','A higher discount rate reduces the present value of future cash flows.',1,'active'),
('ibf16','ib-professional-final','2.0',16,'cmp_ib_judgment','Orion offer price is above the trading-comps indication, above the $22.50 DCF, and near the precedent-transaction indication. What is the best recommendation framing?','["The deal is automatically good because precedents are high","Explain the premium, test revised operating downside, and make the recommendation conditional on whether diligence supports the higher transaction value","Ignore the lower valuation methods","Reject the deal solely because trading comps are lower"]','Explain the premium, test revised operating downside, and make the recommendation conditional on whether diligence supports the higher transaction value','Professional judgment weighs the range, new downside information, and diligence rather than selecting one method mechanically.',1,'active');
