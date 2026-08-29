INSERT OR IGNORE INTO competencies (id, code, name, category, description) VALUES
('cmp_ib_accounting','IB_ACCOUNTING','Accounting','technical_knowledge','Interpret and connect the income statement, balance sheet, and cash flow statement for transaction analysis.'),
('cmp_ib_ev','IB_ENTERPRISE_VALUE','Enterprise Value & Equity Value','technical_knowledge','Build and reconcile enterprise value and equity value correctly across common transaction and market-data situations.'),
('cmp_ib_dcf','IB_DCF','Discounted Cash Flow','technical_knowledge','Construct and interpret a DCF using defensible operating assumptions, discount rates, terminal value, sensitivities, and valuation judgment.'),
('cmp_ib_comps','IB_TRADING_COMPS','Trading Comparables','analytical_accuracy','Select relevant peers, calculate comparable-company multiples accurately, normalize metrics, and interpret the resulting valuation range.'),
('cmp_ib_precedents','IB_PRECEDENTS','Precedent Transactions','analytical_accuracy','Select and analyze precedent transactions, transaction multiples, premiums, and context to inform valuation.'),
('cmp_ib_ma','IB_MA_MECHANICS','M&A Mechanics','execution','Analyze purchase price, consideration, financing, sources and uses, transaction adjustments, and relevant deal mechanics.'),
('cmp_ib_review','IB_MODEL_REVIEW','Model Review & Error Detection','quality_control','Detect model, assumption, linkage, and reconciliation errors before work reaches senior review.'),
('cmp_ib_judgment','IB_DEAL_JUDGMENT','Deal Judgment','professional_judgment','Form a defensible recommendation that connects valuation, strategic logic, downside, diligence findings, and transaction risk.'),
('cmp_ib_comm','IB_COMMUNICATION','Analyst Communication','communication','Communicate analysis concisely in professional emails, summaries, and client-ready outputs.'),
('cmp_ib_detail','IB_ATTENTION_DETAIL','Attention to Detail','quality_control','Maintain consistency, accuracy, labeling, and presentation quality across analysis and deliverables.');

INSERT OR IGNORE INTO pathway_competencies (pathway_id, competency_id, weight, minimum_score, critical) VALUES
('investment-banking','cmp_ib_accounting',0.10,75,1),
('investment-banking','cmp_ib_ev',0.08,75,1),
('investment-banking','cmp_ib_dcf',0.12,75,1),
('investment-banking','cmp_ib_comps',0.10,75,1),
('investment-banking','cmp_ib_precedents',0.08,70,0),
('investment-banking','cmp_ib_ma',0.12,75,1),
('investment-banking','cmp_ib_review',0.12,75,1),
('investment-banking','cmp_ib_judgment',0.12,70,0),
('investment-banking','cmp_ib_comm',0.08,70,0),
('investment-banking','cmp_ib_detail',0.08,70,0);
