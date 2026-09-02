(() => {
  'use strict';
  const DATA = window.CM_DATA;
  const app = document.getElementById('app');
  const PASS = 80;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const QA_STATE_KEY = 'capitalMasteryQaStateV2';
  const DEFAULT_NAME = 'Jordan Smith';

  const PARTS = [
    { n: 1, name: 'Career Foundations', short: 'Foundations', pct: 20 },
    { n: 2, name: 'Technical Academy', short: 'Technical', pct: 40 },
    { n: 3, name: 'Professional Toolkit', short: 'Toolkit', pct: 60 },
    { n: 4, name: 'Applied Work', short: 'Applied', pct: 80 },
    { n: 5, name: 'Job Simulation', short: 'Simulation', pct: 100 }
  ];

  const GROUPS = ['All', 'Deals', 'Investing', 'Markets', 'Corporate Finance', 'Clients & Risk', 'Assets'];

  const SIMS = {
    'investment-banking': {
      name: 'Project Northstar', company: 'Northstar Technologies', target: 'Orion Systems',
      rows: [['Revenue', '$620m', '$445m'], ['EBITDA', '$124m', '$80m'], ['Cash', '$90m', '$35m'], ['Debt', '$210m', '$95m'], ['Offer Equity Value', '—', '$790m']],
      questions: [
        mc('Which value should be paired with EBITDA in an EV/EBITDA multiple?', ['Enterprise value','Equity value','Net income','Book value'], 0, 12),
        num('Orion has $790m equity value, $95m debt and $35m cash. What is implied enterprise value ($m)?', 850, 14, 1),
        num('Using $850m enterprise value and $80m EBITDA, what is EV/EBITDA (x)?', 10.625, 14, .15),
        mc('Management cuts revenue guidance after your first valuation. Best next step?', ['Update forecast assumptions and rerun valuation sensitivities','Keep original valuation because the model was finished','Remove all comparable companies','Use only the highest precedent multiple'], 0, 12),
        mc('Which peer is usually most defensible?', ['A company with similar business model, customers, growth and margins','Any company with the same broad sector label','The company with the highest trading multiple','The company with the closest share price'], 0, 12)
      ],
      writing: { prompt: 'Write a concise recommendation to the Associate: should Northstar continue diligence, and what two issues deserve the most attention?', keywords: ['valuation','guidance','synergy','risk','diligence','peer','cash','debt'], points: 36 }
    },
    'private-equity': {
      name: 'Project Redwood', company: 'Redwood Capital', target: 'Apex Services',
      rows: [['Revenue', '$300m'], ['EBITDA', '$45m'], ['Entry EV', '$450m'], ['Debt at Close', '$270m'], ['Exit EBITDA (Yr 5)', '$63m'], ['Exit Multiple', '10.0x']],
      questions: [
        num('What is the entry EV/EBITDA multiple (x)?', 10, 12, .05),
        num('What is sponsor equity at entry ($m), assuming no other adjustments?', 180, 14, 1),
        num('At exit, EV is 10.0x $63m EBITDA. What is exit EV ($m)?', 630, 14, 1),
        mc('Which diligence issue most directly threatens debt paydown?', ['Weak free-cash-flow conversion','A polished management presentation','A larger addressable market','A lower share count'], 0, 12),
        mc('Which is the strongest IC behavior?', ['State both thesis and conditions that would make it wrong','Only present upside to maintain conviction','Ignore customer concentration if growth is high','Treat leverage as the only return driver'], 0, 12)
      ],
      writing: { prompt: 'Write an investment-committee recommendation. Include one value-creation driver and two risks you would diligence before approving the deal.', keywords: ['cash flow','debt','customer','margin','exit','growth','diligence','risk'], points: 36 }
    },
    'venture-capital': {
      name: 'Project Spark', company: 'Vertex Ventures', target: 'NovaAI',
      rows: [['ARR', '$6.0m'], ['YoY Growth', '120%'], ['Monthly Burn', '$500k'], ['Cash', '$7.5m'], ['CAC', '$6,000'], ['LTV', '$24,000']],
      questions: [
        num('At a $500k monthly burn and $7.5m cash balance, estimated runway is how many months?', 15, 14, .25),
        num('What is LTV/CAC (x)?', 4, 12, .05),
        mc('Which market-sizing approach is generally most decision-useful?', ['Bottom-up customers × realistic spend','Choose the largest industry report number','Use the founder’s TAM without checking assumptions','Assume every business is a potential customer'], 0, 12),
        mc('Which question best tests product-market fit?', ['How do cohort retention and expansion change over time?','What font is on the pitch deck?','How many slides are in the deck?','Did the founder attend a famous school?'], 0, 12),
        mc('A fast-growing startup with worsening payback should trigger what response?', ['Investigate whether growth economics are becoming less efficient','Assume growth automatically solves unit economics','Ignore burn because revenue is rising','Increase TAM to offset the issue'], 0, 12)
      ],
      writing: { prompt: 'Write a short invest/pass memo. Cite the strongest evidence, the biggest unanswered question, and what would change your decision.', keywords: ['retention','unit economics','runway','market','team','valuation','growth','risk'], points: 38 }
    },
    'equity-research': {
      name: 'Project Signal', company: 'Arcadia Research', target: 'Nimbus Software',
      rows: [['Prior Revenue', '$800m'], ['Current Revenue', '$920m'], ['Prior EPS', '$2.50'], ['Current EPS', '$2.80'], ['Current Price', '$56'], ['Target P/E', '22x']],
      questions: [
        num('What is year-over-year revenue growth (%)?', 15, 14, .3),
        num('Using $2.80 EPS and a 22x P/E, what is implied price target ($)?', 61.6, 14, .2),
        mc('Which result matters most after earnings?', ['What changed versus expectations and the thesis','Whether headline EPS was positive','Whether management used optimistic adjectives','Whether the stock moved in the first minute'], 0, 12),
        mc('A strong research thesis should include:', ['Variant view, catalysts, valuation and risks','Only a target price','Only company history','Only consensus estimates'], 0, 12),
        mc('If guidance falls, the analyst should:', ['Update drivers and reassess valuation and thesis','Keep the old model until next quarter','Delete the downside case','Raise the target to offset sentiment'], 0, 12)
      ],
      writing: { prompt: 'Draft the core of an earnings note: what changed, what it means for the thesis, and your recommendation.', keywords: ['guidance','revenue','margin','valuation','catalyst','risk','estimate','thesis'], points: 36 }
    },
    'asset-management': {
      name: 'Project Compass', company: 'Harbor Asset Management', target: 'Balanced Growth Portfolio',
      rows: [['Equities', '65%'], ['Bonds', '25%'], ['Cash', '10%'], ['Client Risk', 'Moderate'], ['Liquidity Need', '5% within 12 months'], ['Benchmark', '60/30/10']],
      questions: [
        mc('What is the most important portfolio-design starting point?', ['Objectives, constraints and risk capacity','The asset with the highest recent return','The manager’s favorite sector','The cheapest security'], 0, 14),
        num('Portfolio equity weight exceeds the benchmark by how many percentage points?', 5, 12, .05),
        mc('Two attractive holdings in the same industry can still create:', ['Concentration risk','Guaranteed alpha','Lower correlation','No portfolio impact'], 0, 12),
        mc('Performance attribution is used to:', ['Explain what drove return versus objectives or benchmark','Predict every future market move','Eliminate all risk','Settle trades'], 0, 12),
        mc('A liquidity need should generally:', ['Influence allocation and implementation','Be ignored if expected return is high','Increase concentration automatically','Eliminate all bonds'], 0, 12)
      ],
      writing: { prompt: 'Recommend one portfolio adjustment and explain the objective, trade-off, and risk you would monitor.', keywords: ['allocation','risk','liquidity','benchmark','diversification','return','client','constraint'], points: 38 }
    },
    'hedge-funds': {
      name: 'Project Meridian', company: 'Meridian Partners', target: 'Long/Short Pair',
      rows: [['Long Price', '$40'], ['Long Target', '$50'], ['Short Price', '$60'], ['Short Target', '$48'], ['Long Catalyst', 'Margin recovery'], ['Short Risk', 'Short squeeze']],
      questions: [
        num('What is the long upside (%) from $40 to $50?', 25, 12, .3),
        num('What is the expected short return (%) if price falls from $60 to $48?', 20, 12, .3),
        mc('A good short thesis must consider:', ['Borrow, squeeze, timing and downside to the thesis','Only whether the company is bad','Only accounting ratios','Only market capitalization'], 0, 12),
        mc('What makes a catalyst useful?', ['It can change market expectations within a relevant horizon','It is any positive or negative headline','It guarantees the thesis works','It makes valuation unnecessary'], 0, 12),
        mc('Portfolio sizing should reflect:', ['Conviction, asymmetry, liquidity and portfolio risk','Only expected return','Only recent volatility','Only analyst seniority'], 0, 12)
      ],
      writing: { prompt: 'State the long/short thesis, catalysts, key risk, and what evidence would invalidate the trade.', keywords: ['catalyst','valuation','risk','expectation','upside','downside','liquidity','thesis'], points: 40 }
    },
    'sales-trading': {
      name: 'Project Pulse', company: 'Capital Markets Desk', target: 'Client Execution',
      rows: [['Bid', '$99.90'], ['Ask', '$100.10'], ['Client Order', 'Buy 20,000 shares'], ['Displayed Ask Size', '5,000 shares'], ['Volatility', 'Elevated'], ['News Event', 'Central-bank decision']],
      questions: [
        num('What is the bid-ask spread ($)?', .2, 12, .01),
        mc('A market order prioritizes:', ['Execution certainty over price control','Price control over execution','Guaranteed profit','Zero market impact'], 0, 12),
        mc('Buying more than displayed ask size can increase:', ['Market impact and execution uncertainty','Accounting goodwill','Credit recovery','Dividend yield'], 0, 12),
        mc('A client idea should clearly communicate:', ['Thesis and material risks','Only upside','Only product name','Only yesterday’s return'], 0, 12),
        mc('Ahead of a major news event, a trader should pay special attention to:', ['Position size, liquidity and gap risk','Only historical average volume','Only the client name','Only the opening price'], 0, 12)
      ],
      writing: { prompt: 'Describe how you would execute the client order while balancing speed, price, liquidity and event risk.', keywords: ['liquidity','spread','size','limit','market impact','volatility','client','risk'], points: 40 }
    },
    'quantitative-finance': {
      name: 'Project Vector', company: 'Vector Research', target: 'Signal Validation',
      rows: [['Training Sharpe', '2.1'], ['Validation Sharpe', '0.9'], ['Turnover', '350%/yr'], ['Estimated Costs', '40 bps/trade'], ['Missing Values', '2.4%'], ['Look-ahead Check', 'Pending']],
      questions: [
        mc('A large drop from training to validation performance may indicate:', ['Overfitting','Guaranteed alpha','Lower transaction costs','No model risk'], 0, 14),
        mc('Before modeling, missing values should be:', ['Investigated and handled consistently','Automatically replaced with zero','Deleted without checking pattern','Ignored'], 0, 12),
        mc('A backtest that uses information unavailable at the trade date has:', ['Look-ahead bias','Diversification','Duration risk','Credit enhancement'], 0, 12),
        mc('High turnover makes which assumption especially important?', ['Transaction costs and market impact','Logo design','Dividend declaration date only','Book value only'], 0, 12),
        mc('Best evidence of robustness is:', ['Out-of-sample performance under realistic assumptions','Highest in-sample result','More parameters','A visually smooth equity curve only'], 0, 12)
      ],
      writing: { prompt: 'Write a research recommendation: is this signal ready for further testing, and what validation checks are required before deployment?', keywords: ['out-of-sample','cost','bias','turnover','robust','validation','data','risk'], points: 38 }
    },
    'private-credit': {
      name: 'Project Anchor', company: 'Anchor Credit', target: 'Atlas Manufacturing',
      rows: [['EBITDA', '$50m'], ['Total Debt', '$225m'], ['Cash Interest', '$22.5m'], ['CapEx', '$12m'], ['Maturity', '5 years'], ['Proposed Covenant', '6.0x leverage']],
      questions: [
        num('What is total debt / EBITDA leverage (x)?', 4.5, 14, .05),
        num('What is EBITDA / cash-interest coverage (x)?', 2.222, 14, .05),
        mc('Most important downside question?', ['Can cash flow service debt under weaker operating conditions?','Is the company logo modern?','Is revenue an even number?','Does the borrower have many slides?'], 0, 12),
        mc('A covenant is useful when it:', ['Creates meaningful protection and early warning','Can never be triggered','Has unlimited add-backs','Only measures revenue growth'], 0, 12),
        mc('Credit underwriting primarily focuses on:', ['Repayment capacity and downside protection','Maximum equity upside only','Short-term share-price momentum','Brand popularity'], 0, 12)
      ],
      writing: { prompt: 'Write a credit recommendation including repayment source, downside concern, and one covenant or structural protection you would require.', keywords: ['cash flow','leverage','coverage','covenant','liquidity','downside','maturity','repayment'], points: 36 }
    },
    'corporate-banking': {
      name: 'Project Bridge', company: 'Corporate Banking Team', target: 'Summit Logistics',
      rows: [['EBITDA', '$80m'], ['Existing Debt', '$160m'], ['New Facility', '$80m'], ['Cash Interest after Deal', '$24m'], ['Revolver', '$40m undrawn'], ['Purpose', 'Distribution expansion']],
      questions: [
        num('Pro forma total debt / EBITDA is (x)?', 3, 14, .05),
        num('EBITDA / cash-interest coverage is (x)?', 3.333, 14, .06),
        mc('A relationship banker should consider:', ['Credit quality plus broader client needs and economics','Only fee opportunity','Only management personality','Only collateral value'], 0, 12),
        mc('An undrawn revolver primarily provides:', ['Liquidity capacity subject to terms','Equity ownership','Guaranteed profit','A lower tax rate'], 0, 12),
        mc('Best credit recommendation:', ['States risks, mitigants, structure and conditions','Lists only positive factors','Ignores downside scenarios','Uses the maximum possible loan amount'], 0, 12)
      ],
      writing: { prompt: 'Recommend approve/decline/modify the facility and explain key credit risk, relationship benefit and one condition.', keywords: ['credit','liquidity','leverage','coverage','relationship','condition','risk','facility'], points: 36 }
    },
    'corporate-development': {
      name: 'Project Horizon', company: 'Horizon Corp Dev', target: 'Delta Systems',
      rows: [['Target EBITDA', '$30m'], ['Purchase EV', '$300m'], ['Cost Synergy', '$12m'], ['One-time Integration Cost', '$25m'], ['Strategic Market', 'Adjacent'], ['Overlap', 'Moderate']],
      questions: [
        num('Purchase EV / target EBITDA is (x)?', 10, 12, .05),
        mc('Corporate development differs from sell-side banking because it:', ['Makes internal strategic decisions for its own company','Always represents multiple clients','Never uses valuation','Does not work on M&A'], 0, 14),
        mc('A synergy requiring a two-year system migration should be:', ['Phased with timing and costs explicitly modeled','Treated as day-one recurring value','Ignored completely','Counted twice'], 0, 12),
        mc('A financially attractive target can still fail because of:', ['Strategic or integration risk','A lower enterprise value','Positive cash flow','Comparable-company data'], 0, 12),
        mc('Best target-screening criteria should come from:', ['Corporate strategy and acquisition objectives','Random available companies','Only market capitalization','Only recent press coverage'], 0, 12)
      ],
      writing: { prompt: 'Write an internal recommendation: strategic fit, valuation concern, integration risk, and whether to advance the target.', keywords: ['strategy','synergy','integration','valuation','fit','risk','market','advance'], points: 38 }
    },
    'fpa': {
      name: 'Project Forecast', company: 'Operating Finance Team', target: 'Q4 Forecast',
      rows: [['Budget Revenue', '$120m'], ['Actual Revenue', '$114m'], ['Budget OpEx', '$72m'], ['Actual OpEx', '$75m'], ['Pipeline', 'Below plan'], ['Headcount', 'Above plan']],
      questions: [
        num('Revenue variance versus budget is ($m)? Enter negative for unfavorable.', -6, 12, .05),
        num('OpEx variance versus budget is ($m)? Enter positive for overspend.', 3, 12, .05),
        mc('A useful variance explanation should identify:', ['Operating drivers such as price, volume, mix, timing or cost','Only the percentage miss','Only whether the result is bad','Only management’s original plan'], 0, 14),
        mc('A rolling forecast should:', ['Change when business drivers change','Always equal the annual budget','Ignore current pipeline','Eliminate uncertainty'], 0, 12),
        mc('FP&A recommendations are most useful when they:', ['Connect analysis to management action','Only restate financial statements','Avoid operational context','Use the longest possible report'], 0, 12)
      ],
      writing: { prompt: 'Write a CFO-ready variance summary with two drivers and one recommended management action.', keywords: ['revenue','expense','pipeline','headcount','variance','forecast','action','driver'], points: 38 }
    },
    'treasury': {
      name: 'Project Liquidity', company: 'Corporate Treasury', target: '13-Week Cash Plan',
      rows: [['Opening Cash', '$42m'], ['Expected Inflows', '$68m'], ['Expected Outflows', '$95m'], ['Minimum Cash Buffer', '$20m'], ['Undrawn Revolver', '$60m'], ['Debt Maturity', '$25m in Week 10']],
      questions: [
        num('Cash before financing at period end is ($m)?', 15, 14, .05),
        num('How much financing is needed just to restore the $20m minimum buffer ($m)?', 5, 12, .05),
        mc('Treasury’s central concern here is:', ['Liquidity and ability to meet obligations','Equity research target price','Startup TAM','Short-selling borrow'], 0, 12),
        mc('A debt maturity should be managed by:', ['Planning funding well before cash is due','Waiting until maturity day','Ignoring available revolver capacity','Assuming refinancing is automatic'], 0, 12),
        mc('A hedge should generally:', ['Match the underlying exposure and horizon','Create a larger speculative exposure','Always use maximum notional','Be selected only by lowest premium'], 0, 12)
      ],
      writing: { prompt: 'Recommend a liquidity action plan addressing the cash buffer, debt maturity and backup funding.', keywords: ['cash','revolver','maturity','buffer','funding','liquidity','forecast','risk'], points: 38 }
    },
    'wealth-management': {
      name: 'Project Legacy', company: 'Private Wealth Team', target: 'Client Portfolio',
      rows: [['Client Age', '48'], ['Time Horizon', '15+ years'], ['Near-term Liquidity Need', '$200k'], ['Portfolio', '$3.0m'], ['Employer Stock', '45%'], ['Risk Tolerance', 'Moderate']],
      questions: [
        num('Employer stock is what percentage of the portfolio?', 45, 12, .05),
        mc('The 45% employer-stock position creates:', ['Concentration risk','Guaranteed tax efficiency','Duration matching','No diversification issue'], 0, 14),
        mc('Client discovery should include:', ['Goals, liquidity, taxes, constraints and risk capacity','Only age','Only past returns','Only preferred stocks'], 0, 12),
        mc('A moderate risk-tolerance answer alone is:', ['Insufficient to determine the full portfolio','All that is needed','A guarantee of loss capacity','A reason to ignore liquidity'], 0, 12),
        mc('During a market decline, the advisor should:', ['Reconnect decisions to the client plan and constraints','Automatically sell everything','Promise a rebound date','Ignore the client'], 0, 12)
      ],
      writing: { prompt: 'Recommend a client action plan covering concentration, liquidity and communication. Explain the trade-offs.', keywords: ['concentration','diversify','liquidity','tax','goal','risk','client','plan'], points: 38 }
    },
    'risk-management': {
      name: 'Project Shield', company: 'Enterprise Risk Team', target: 'Stress Scenario',
      rows: [['Credit Exposure', '$100m'], ['PD', '2.0%'], ['LGD', '40%'], ['Rate Shock', '+200 bps'], ['Equity Shock', '-20%'], ['Liquidity Buffer', '$35m']],
      questions: [
        num('Expected credit loss using EAD × PD × LGD is ($m)?', .8, 14, .02),
        mc('VaR should be interpreted as:', ['A risk estimate under stated assumptions, not a maximum possible loss','The maximum possible loss','A guaranteed forecast','A measure of revenue'], 0, 14),
        mc('A useful stress test should:', ['Target severe scenarios linked to actual vulnerabilities','Use only average historical conditions','Avoid nonlinear effects','Always produce the same loss'], 0, 12),
        mc('Portfolio credit risk can rise because of:', ['Concentration even if individual names look acceptable','Diversification','Lower PDs','Higher recoveries'], 0, 12),
        mc('Risk communication should include:', ['Exposure, assumptions, limitations and recommended actions','Only a single score','Only the best-case scenario','No uncertainty'], 0, 12)
      ],
      writing: { prompt: 'Write a risk escalation note: identify the most important vulnerability, a stress test to run, and a management action.', keywords: ['stress','exposure','liquidity','credit','rate','scenario','limit','action'], points: 36 }
    },
    'real-estate-finance': {
      name: 'Project Skyline', company: 'Real Estate Investment Team', target: '220-Unit Property',
      rows: [['Gross Potential Rent', '$4.0m'], ['Vacancy', '5%'], ['Other Income', '$0.2m'], ['Operating Expenses', '$1.5m'], ['Annual Debt Service', '$1.4m'], ['Market Cap Rate', '6.0%']],
      questions: [
        num('Effective rental revenue after 5% vacancy is ($m)?', 3.8, 12, .02),
        num('NOI including $0.2m other income is ($m)?', 2.5, 14, .02),
        num('Value at a 6.0% cap rate is approximately ($m)?', 41.667, 14, .2),
        num('DSCR using $2.5m NOI and $1.4m debt service is (x)?', 1.786, 12, .04),
        mc('If insurance expense rises sharply before closing, you should:', ['Update NOI, value and debt coverage before recommending price','Ignore it because purchase price is agreed','Increase rent automatically','Lower the cap rate to offset it'], 0, 12)
      ],
      writing: { prompt: 'Recommend bid/pass and identify the two assumptions that create the most downside risk.', keywords: ['NOI','cap rate','occupancy','expense','debt','DSCR','rent','risk'], points: 36 }
    }
  };

  function mc(prompt, options, correct, points=12){ return {type:'mc', prompt, options, correct, points}; }
  function num(prompt, answer, points=12, tolerance=.01){ return {type:'num', prompt, answer, tolerance, points}; }

  const fallbacks = {
    'sales-trading':'sales-trading',
    'quant-finance':'quantitative-finance',
    'quantitative-finance':'quantitative-finance',
    'fpa':'fpa'
  };

  function simFor(career){
    return SIMS[career.id] || SIMS[fallbacks[career.id]] || buildGenericSim(career);
  }
  function buildGenericSim(career){
    return {
      name: career.sim_title || `Project ${career.title.split(' ')[0]}`,
      company: `${career.title} Team`, target: 'Case Company',
      rows: (career.deliverables || []).slice(0,6).map((x,i)=>[`Workstream ${i+1}`,x]),
      questions: [
        mc(`Which deliverable is most aligned with ${career.role}?`, [career.deliverables[0], 'Unrelated consumer survey', 'Personal tax filing', 'Graphic-design brief'], 0, 14),
        mc('What should happen when a material assumption changes?', ['Update the analysis and reassess the recommendation','Keep the original output unchanged','Delete the assumption','Ignore the change'], 0, 14),
        mc('Which behavior best reflects professional judgment?', ['Separate facts, assumptions, risks and recommendation','Present only supporting evidence','Hide uncertainty','Choose the most optimistic case'], 0, 14),
        mc('What is the strongest source practice?', ['Use authoritative/current evidence and document provenance','Use the first unsourced number found online','Treat simulated data as real','Avoid recording sources'], 0, 14),
        mc('What should a junior professional do before submitting work?', ['Check calculations, sources, logic and presentation','Submit immediately without review','Remove downside cases','Ignore formatting'], 0, 14)
      ],
      writing: { prompt: `Write a concise ${career.role} recommendation using evidence from the case, including one risk and one next step.`, keywords: career.concepts.concat(['risk','recommendation','source','assumption']), points: 30 }
    };
  }

  function blankState(accountUser=null){
    const displayName=String(accountUser?.displayName||'').replace(/\s+/g,' ').trim();
    return {version:1, profile:{name:displayName||DEFAULT_NAME,...(accountUser?.uid?{accountUid:accountUser.uid}:{}),...(displayName?{certificateName:displayName}:{})}, careers:{}, credentials:[], preferences:{}, createdAt:new Date().toISOString()};
  }
  function loadStateFrom(key){
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (parsed && parsed.version === 1) return parsed;
    } catch(e){}
    return blankState();
  }
  function loadState(){ return loadStateFrom(STATE_KEY); }
  function loadQaState(){ return loadStateFrom(QA_STATE_KEY); }
  function qaMode(){ return window.CM_AUTH?.ready === true && window.CM_AUTH?.backendVerified === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true'; }
  let stateSourceKey = STATE_KEY;
  let state = loadState();
  function activeStateKey(){ return qaMode() ? QA_STATE_KEY : STATE_KEY; }
  function ensureActiveState(){
    const key=activeStateKey();
    const authSettled=window.CM_AUTH?.ready===true;
    const accountUser=authSettled?window.CM_AUTH?.user:null;
    const uid=accountUser?.uid||null;
    const owner=state?.profile?.accountUid||null;
    const accountChanged=key===STATE_KEY&&authSettled&&((uid&&owner!==uid)||(!uid&&!!owner));
    if(key!==stateSourceKey||accountChanged){
      state=key===QA_STATE_KEY?loadQaState():loadState();
      stateSourceKey=key;
    }
    if(key===STATE_KEY&&authSettled){
      const loadedOwner=state?.profile?.accountUid||null;
      if((uid&&loadedOwner!==uid)||(!uid&&!!loadedOwner)) state=blankState(accountUser);
    }
    return state;
  }
  function saveState(){ ensureActiveState(); const key=activeStateKey(); stateSourceKey=key; localStorage.setItem(key, JSON.stringify(state)); }
  function getCareerState(id){
    ensureActiveState();
    if(!state.careers[id]) state.careers[id] = {learningComplete:[],completedParts:[],quizScores:{},simulationKnowledge:null,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null};
    const cs=state.careers[id];
    if(!Array.isArray(cs.learningComplete)) cs.learningComplete=[];
    if(!Array.isArray(cs.completedParts)) cs.completedParts=[];
    if(!cs.quizScores) cs.quizScores={};
    if(!cs.applied) cs.applied={};
    if(!cs.simResponses) cs.simResponses={};
    return cs;
  }
  function setQa(v){
    localStorage.setItem(QA_KEY, v ? 'true':'false');
    stateSourceKey=v?QA_STATE_KEY:STATE_KEY;
    state=v?loadQaState():loadState();
  }

  function esc(v=''){ return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':'&quot;'}[c])); }
  function careerById(id){ return DATA.careers.find(c=>c.id===id); }
  function concept(id){ return DATA.concepts ? DATA.concepts[id] : null; }
  function routeParts(){
    const hash = location.hash.replace(/^#\/?/,'');
    const [path, query=''] = hash.split('?');
    return {parts:path.split('/').filter(Boolean), query:new URLSearchParams(query)};
  }
  function nav(path){ location.hash = path.startsWith('#') ? path : '#/'+path.replace(/^\//,''); window.scrollTo({top:0,behavior:'smooth'}); }
  function link(path,label,cls=''){ return `<a href="#/${path}" class="${cls}">${label}</a>`; }
  function pctFor(c){
    const cs = getCareerState(c.id);
    const completed = cs.completedParts.length;
    return Math.min(100, completed*20);
  }
  function highestUnlockedPart(c){
    if(qaMode()) return 5;
    const cs = getCareerState(c.id);
    let unlocked = 1;
    for(let p=1;p<=4;p++){
      if(cs.completedParts.includes(p) && Number(cs.quizScores[p]||0)>=PASS) unlocked=p+1; else break;
    }
    return unlocked;
  }
  function canAccessPart(c,n){ return qaMode() || n<=highestUnlockedPart(c); }
  function isPartComplete(c,n){ return getCareerState(c.id).completedParts.includes(n); }
  function credentialInfo(c,type){
    const cs=getCareerState(c.id);
    const prefixMap={foundations:'FND',applied:'APP',career:'CAR'};
    const names={
      foundations:`${c.title} Foundations Certificate`,
      applied:`${c.title} Applied Skills Certificate`,
      career:`${c.role}${c.track?` — ${c.track==='M&A Advisory'?'M&A':c.track}`:''} Career Certificate`
    };
    const issued = state.credentials.find(x=>x.careerId===c.id && x.type===type);
    const date = issued?.issuedAt || new Date().toISOString();
    const num = String(Math.abs(hashCode(`${c.id}-${type}-${state.profile.name}`))%999999).padStart(6,'0');
    const year = new Date(date).getFullYear();
    return {type,name:names[type],id:`CM-${c.id.replace(/[^a-z]/g,'').slice(0,5).toUpperCase()}-${prefixMap[type]}-${year}-${num}`,issuedAt:date,earned:!!issued};
  }
  function hashCode(str){ let h=0; for(let i=0;i<str.length;i++) h=((h<<5)-h)+str.charCodeAt(i)|0; return h; }
  function eligible(c,type){
    const cs=getCareerState(c.id);
    const q=p=>Number(cs.quizScores[p]||0)>=PASS;
    if(type==='foundations') return [1,2].every(p=>cs.completedParts.includes(p)&&q(p));
    if(type==='applied') return [1,2,3,4].every(p=>cs.completedParts.includes(p)&&q(p));
    return [1,2,3,4,5].every(p=>cs.completedParts.includes(p)) && [1,2,3,4].every(q) && Number(cs.simulationKnowledge||0)>=PASS && Number(cs.simulationScore||0)>=PASS;
  }
  function issueIfEligible(c,type){
    if(!eligible(c,type)) return false;
    const exists=state.credentials.some(x=>x.careerId===c.id&&x.type===type);
    if(!exists){
      const info=credentialInfo(c,type);
      state.credentials.push({careerId:c.id,type,issuedAt:new Date().toISOString(),credentialId:info.id,status:'preview-active',criteriaVersion:'1.0'});
      saveState();
      return true;
    }
    return false;
  }
  function issueAllEligible(c){ ['foundations','applied','career'].forEach(t=>issueIfEligible(c,t)); }

  function readiness(c){
    const cs=getCareerState(c.id);
    const scores=[1,2,3,4].map(p=>Number(cs.quizScores[p]||0)).filter(Boolean);
    if(cs.simulationKnowledge) scores.push(Number(cs.simulationKnowledge));
    if(cs.simulationScore) scores.push(Number(cs.simulationScore));
    if(cs.finalScore) scores.push(Number(cs.finalScore));
    return scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  }

  function header(active=''){
    return `${qaMode()?'<div class="admin-banner">QA PREVIEW MODE — progress can be bypassed. Preview credentials are not live verified credentials.</div>':''}
    <header class="site-header"><div class="container nav">
      <a class="brand" href="#/"><img src="assets/logo-mark.svg" alt="Capital Mastery logo"><span class="brand-name">CAPITAL MASTERY</span></a>
      <nav class="nav-links" aria-label="Primary">
        ${link('','Home',active==='home'?'active':'')}
        ${link('careers','Careers',active==='careers'?'active':'')}
        ${link('employers','For Employers',active==='employers'?'active':'')}
        ${link('credentials','Credentials',active==='credentials'?'active':'')}
        ${link('academy','Academies',active==='academy'?'active':'')}
        ${link('about','About',active==='about'?'active':'')}
        ${link('passport','My Learning',active==='learning'?'active':'')}
      </nav>
      <button class="mobile-menu" aria-label="Open menu" onclick="CM.mobileMenu()">☰</button>
      <div class="nav-actions">${window.CM_AUTH?.user?'<a class="btn btn-outline btn-sm" href="#/notifications">Notifications</a><a class="btn btn-outline btn-sm" href="#/login">Account</a>':'<a class="btn btn-outline btn-sm" href="#/login">Sign in</a>'}<a class="btn btn-primary btn-sm" href="#/careers">Start Free</a></div>
    </div></header>`;
  }
  function footer(){
    return `<footer class="footer"><div class="container"><div class="footer-grid">
      <div class="footer-brand"><a class="brand" href="#/"><img src="assets/logo-mark.svg" alt=""><span class="brand-name">CAPITAL MASTERY</span></a><p>Learn it. Practice it. Prove it. Free finance-career training with sourced learning, graded simulations and verifiable credential architecture.</p></div>
      <div><h4>Learn</h4>${link('learner-guide','How Learning Works')}${link('careers','Careers')}${link('passport','My Learning')}${link('credentials','Credentials')}${link('academy','Academies')}</div>
      <div><h4>About</h4>${link('about','About Capital Mastery')}${link('methodology','Research Methodology')}${link('trust','Trust Center')}${link('credential-policy','Credential Policy')}</div>
      <div><h4>Legal</h4>${link('privacy','Privacy')}${link('terms','Terms')}${link('disclaimer','Educational Disclaimer')}</div>
    </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Capital Mastery. Made by Shriyan Avadhanula.</span><span>Independent educational platform. No employer endorsement implied.</span></div></div></footer>`;
  }

  function render(html,active=''){ app.innerHTML=header(active)+`<main id="main" tabindex="-1">${html}</main>`+footer(); bindGlobal(); }

  function publicEvidenceCards(limit=4){
    const ev=window.CM_PUBLIC_EVIDENCE||{};
    return (ev.onboarding||[]).slice(0,limit).map(x=>`<article class="evidence-stat-card"><div class="evidence-value">${esc(x.value)}</div><h3>${esc(x.label)}</h3><p>${esc(x.detail)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.publisher)} ↗</a></article>`).join('');
  }
  function publicEvidencePrinciples(){
    const ev=window.CM_PUBLIC_EVIDENCE||{};
    return (ev.principles||[]).map((x,i)=>`<article class="evidence-principle"><span>0${i+1}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.copy)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">Public source · ${esc(x.publisher)} ↗</a></div></article>`).join('');
  }

  function home(){
    const stats=DATA.stats;
    render(`
      <section class="hero"><div class="container hero-grid"><div>
        <div class="eyebrow">16 FINANCE CAREERS · 5 CREDENTIAL LEVELS EACH</div>
        <h1>Master finance careers <em>before</em> you enter them.</h1>
        <p>Understand the job. Learn the technical knowledge. Practice real analyst skills. Work through graded simulations. Prove mastery with professional certificates.</p>
        <div class="hero-actions"><a class="btn btn-primary" href="#/careers">Start Learning Free →</a><a class="btn btn-outline" href="#/careers?view=map">Explore Careers</a></div>
        <div class="hero-note"><span class="dot"></span> No paywall · 80% mastery standard · Built for students entering finance</div>
      </div><div class="hero-board">
        <div class="hero-board-top"><img src="assets/logo-mark.svg" alt=""><span class="hero-board-badge">Your path to the desk</span></div>
        <div class="hero-path"><div class="hero-path-head"><div><small>FLAGSHIP PATHWAY</small><h3>Investment Banking Analyst — M&A</h3></div><strong>40%</strong></div><div class="progress"><span style="width:40%"></span></div><div class="hero-steps">${PARTS.map((p,i)=>`<div class="hero-step ${i<2?'active':''}">${p.n}. ${p.short}</div>`).join('')}</div></div>
        <div class="hero-path"><small>CAPITAL MASTERY STANDARD</small><h3>Completion is not enough.</h3><p class="small" style="color:#cbd5e2;margin:8px 0 0">Every required assessment, practical simulation and Professional Readiness Final must meet the 80% standard.</p></div>
      </div></div></section>
      <section class="section section-white"><div class="container"><div class="section-head"><div><div class="eyebrow">TWO WAYS TO USE CAPITAL MASTERY</div><h2>Learn independently—or arrive prepared for your firm.</h2></div><p>The public learning platform stays open to individual learners. Employer workspaces add cohorts, firm-specific preparation and readiness analytics on top.</p></div><div class="grid grid-2"><article class="card"><div class="eyebrow">FOR INDIVIDUAL LEARNERS · FREE</div><h3>Build finance skills on your own.</h3><p>Choose any career pathway, build from foundations into applied work, complete simulations and earn verified credentials—without a learner paywall.</p><div class="hero-actions"><a class="btn btn-primary" href="#/careers">Explore Careers →</a><a class="btn btn-soft" href="#/learner-guide">Try the Interactive Guide</a></div></article><article class="card"><div class="eyebrow">FOR FINANCE FIRMS · FREE</div><h3>Prepare talent before Day 1.</h3><p>Create cohorts, assign role-specific readiness, add a Firm Layer, and see competency evidence instead of just course completion—at no cost to the employer.</p><a class="btn btn-outline" href="#/employers">Capital Mastery for Employers →</a></article></div></div></section>
      <section class="stats-strip"><div class="container stats-grid">
        <div class="stat"><strong>80</strong><span>Standard 2.0 career credential definitions</span></div>
        <div class="stat"><strong>${stats.pathways}</strong><span>Finance career pathways</span></div>
        <div class="stat"><strong>8</strong><span>Cross-career Academy achievements</span></div>
        <div class="stat"><strong>${stats.mastery}</strong><span>Minimum mastery standard</span></div>
      </div></section>
      <section class="section evidence-section"><div class="container"><div class="evidence-hero"><div><div class="eyebrow">THE BUSINESS CASE FOR BETTER PREPARATION</div><h2>Day 1 should start with contribution—not basic role catch-up.</h2><p>Public onboarding research consistently points to the same operational problem: new-hire preparation affects how quickly people become effective, how they experience the job, and whether they stay. Capital Mastery focuses that problem specifically on finance-role readiness.</p></div><a class="btn btn-gold" href="#/employers">See the employer platform →</a></div><div class="evidence-stat-grid">${publicEvidenceCards()}</div><div class="evidence-bridge"><div><div class="eyebrow">FROM ONBOARDING TO READINESS</div><h2>We do not claim a generic course creates those outcomes.</h2><p>Instead, Capital Mastery gives firms a way to prepare and measure the role-specific work that sits underneath time-to-productivity: technical knowledge, models, research, judgment, work-product quality and revision behavior.</p></div><div class="evidence-principles">${publicEvidencePrinciples()}</div></div><div class="evidence-caveat"><strong>Evidence, not hype.</strong> ${esc(window.CM_PUBLIC_EVIDENCE?.caveat||'Public research is shown for context and is not a Capital Mastery performance guarantee.')}</div></div></section>
      <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">EXPLORE THE INDUSTRY</div><h2>Choose the career. We teach the actual job.</h2></div><p>Each pathway identifies the exact entry-level role, required knowledge, professional deliverables, skills and simulation.</p></div>
      <div class="grid grid-4">${DATA.careers.slice(0,8).map(c=>careerCard(c)).join('')}</div><div style="text-align:center;margin-top:26px"><a class="btn btn-outline" href="#/careers">See all 16 careers →</a></div></div></section>
      <section class="section section-navy"><div class="container"><div class="section-head"><div><div class="eyebrow">CREDIBILITY BY DESIGN</div><h2>Built around real finance work.</h2></div><p>We map publicly documented professional responsibilities into lessons, work products, assessments and simulations.</p></div>
      <div class="credibility-grid">${DATA.credibility.map(x=>`<article class="source-card"><h3>${esc(x.org)}</h3><p>${esc(x.claim)}</p><p class="applied"><strong>How Capital Mastery applies it:</strong> ${esc(x.applied)}</p><a href="${esc(x.url)}" target="_blank" rel="noopener">View public source ↗</a></article>`).join('')}</div>
      <div class="disclosure">Capital Mastery is an independent educational platform. References to organizations identify publicly available research sources and do not imply affiliation, endorsement or sponsorship.</div></div></section>
      <section class="section section-white"><div class="container"><div class="section-head"><div><div class="eyebrow">PUBLIC DATA</div><h2>Finance is serious. The data should be too.</h2></div><p>Homepage claims are labeled to the actual federal occupation rather than pretending one statistic represents every finance role.</p></div>
      <div class="grid grid-4"><div class="data-card"><div class="value">${stats.medianWage}</div><div class="label">Median annual wage</div><p>Financial & Investment Analysts</p><div class="source">BLS · May 2025</div></div><div class="data-card"><div class="value">${stats.topDecile}</div><div class="label">Top 10% wage level</div><p>Same federal occupation category</p><div class="source">BLS · May 2025</div></div><div class="data-card"><div class="value">${stats.growth}</div><div class="label">Projected growth</div><p>Financial analysts, 2025–2035</p><div class="source">BLS</div></div><div class="data-card"><div class="value">${stats.openings}</div><div class="label">Projected annual openings</div><p>Average projected openings</p><div class="source">BLS · 2025–2035</div></div></div>
      </div></section>
      <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">HOW CAPITAL MASTERY WORKS</div><h2>Learn → practice → apply → simulate → prove.</h2></div><p>The interface stays simple. The rigor sits underneath.</p></div>
      <div class="grid grid-5 pathway-overview">${PARTS.map(p=>`<div class="card"><div class="icon-box">${p.n}</div><h3>${p.name}</h3><p>${partSummary(p.n)}</p></div>`).join('')}</div></div></section>
      <section class="section section-white"><div class="container founder-card"><img class="founder-photo" src="assets/founder-shriyan.jpg" alt="Shriyan Avadhanula, founder of Capital Mastery"><div class="founder-copy"><div class="byline">About the Founder</div><h2>Built by a student, for students entering finance.</h2><p>Capital Mastery was founded by Shriyan Avadhanula to make finance-career preparation clearer, more practical and more accessible—without forcing beginners through endless lectures before they understand the job.</p><a class="btn btn-gold" style="align-self:flex-start" href="#/about">Meet the Founder →</a></div></div></section>
    `,'home');
  }

  function partSummary(n){ return ({1:'Understand the career, team structure, workflow, language and deliverables.',2:'Build the accounting, valuation, markets or role-specific technical core.',3:'Learn how to perform the tools, models, research and work products.',4:'Complete smaller realistic assignments with review and revision.',5:'Perform a graded simulation in the exact entry-level role.'})[n]; }
  function careerCard(c){
    return `<article class="card card-hover career-card"><div class="career-group">${esc(c.group)}</div><h3>${esc(c.title)}</h3><div class="role">Target: ${esc(c.role)}${c.track?` · ${esc(c.track)}`:''}</div><p class="desc">${esc(c.tagline)}</p><div class="career-footer"><span class="cred-count">3 free certificates · ${pctFor(c)}% complete</span><a class="btn btn-soft btn-sm" href="#/career/${c.id}">Explore →</a></div></article>`;
  }

  function careersPage(query){
    const group=query.get('group')||'All';
    const view=query.get('view')||'grid';
    const list=group==='All'?DATA.careers:DATA.careers.filter(c=>c.group===group);
    render(`<section class="page-hero"><div class="container"><div class="eyebrow">CAREER DIRECTORY</div><h1>Find your place in finance.</h1><p>Career field → exact entry role → required skills → realistic job simulation.</p><div class="hero-actions"><a class="btn btn-gold" href="#/learner-guide">See How Learning Works →</a></div></div></section>
    <section class="section-tight"><div class="container">
      <div class="career-controls">${GROUPS.map(g=>`<a class="filter-chip ${g===group?'active':''}" href="#/careers?group=${encodeURIComponent(g)}">${g}</a>`).join('')}<a class="filter-chip ${view==='map'?'active':''}" href="#/careers?view=map">Career Map</a><a class="filter-chip" href="#/compare">Compare Careers</a></div>
      ${view==='map'?careerMap():`<div class="grid grid-4">${list.map(careerCard).join('')}</div>`}
    </div></section>`,'careers');
  }
  function careerMap(){
    const groups=[...new Set(DATA.careers.map(c=>c.group))];
    return `<div class="grid grid-3">${groups.map(g=>`<section class="card"><div class="eyebrow">${esc(g)}</div>${DATA.careers.filter(c=>c.group===g).map(c=>`<a href="#/career/${c.id}" style="display:block;text-decoration:none;padding:10px 0;border-bottom:1px solid #edf0f3"><strong style="color:var(--navy)">${esc(c.title)}</strong><div class="small muted">${esc(c.role)}</div></a>`).join('')}</section>`).join('')}</div>`;
  }

  function careerPage(c){
    const cs=getCareerState(c.id); issueAllEligible(c);
    const pct=pctFor(c), ready=readiness(c);
    const finalReady=cs.completedParts.includes(5) && Number(cs.simulationScore||0)>=PASS;
    const finalPassed=Number(cs.finalScore||0)>=PASS;
    const finalExamStep=`<div class="path-step ${!finalReady?'locked':''}"><div class="step-num">${finalPassed?'✓':finalReady?'F':'🔒'}</div><div><h3>Professional Readiness Final</h3><p>Knowledge, calculation and workflow-quality credential gate · 80% required.</p>${cs.finalScore!=null?`<div class="small kicker">Final assessment: ${Number(cs.finalScore)}%</div>`:'<div class="small kicker">Not attempted.</div>'}</div>${finalReady?`<a class="btn btn-${finalPassed?'soft':'gold'} btn-sm" href="#/final/${c.id}">${finalPassed?'Review Final':'Take Readiness Final'} →</a>`:'<span class="small muted">Pass the Job Simulation first</span>'}</div>`;
    render(`<section class="page-hero"><div class="container"><div class="eyebrow">${esc(c.group)} · CAREER PATHWAY</div><h1>${esc(c.title)}</h1><p><strong>Target role:</strong> ${esc(c.role)}${c.track?` · <strong>Flagship track:</strong> ${esc(c.track)}`:''}</p></div></section>
    <section class="section-tight"><div class="container career-summary"><div>
      <div class="card"><div class="section-head"><div><div class="eyebrow">YOUR PATH</div><h2>${pct}% complete</h2></div><div><strong>${ready||'—'}</strong><div class="small muted">Readiness score</div></div></div><div class="progress progress-light"><span style="width:${pct}%"></span></div>
      <div class="path-list">${PARTS.map(p=>pathStep(c,p)).join('')}${finalExamStep}</div></div>
    </div><aside class="card"><div class="eyebrow">THE JOB</div><h3>${esc(c.role)}</h3><p>${esc(c.description)}</p><div class="divider"></div><p><strong>Purpose</strong><br>${esc(c.purpose)}</p><p><strong>Who you work with</strong><br>${esc(c.clients)}</p><p><strong>How the business earns revenue</strong><br>${esc(c.revenue)}</p><div class="divider"></div><a class="btn btn-outline btn-block" href="#/compare?a=${c.id}">Compare this career</a></aside></div></section>
    <section class="section section-white"><div class="container"><div class="section-head"><div><div class="eyebrow">DESK STANDARD</div><h2>What Capital Mastery trains you to do.</h2></div><p>Every lesson maps to a real competency: know, calculate, build, research, judge, communicate or deliver.</p></div>
    <div class="grid grid-3"><div class="card"><h3>Deliver</h3><p>${c.deliverables.map(esc).join(' · ')}</p></div><div class="card"><h3>Tools & inputs</h3><p>${c.tools.map(esc).join(' · ')}</p></div><div class="card"><h3>Career ladder</h3><p>${c.ladder.map(esc).join(' → ')}</p></div></div></div></section>
    <section class="section cm-assessment-journey"><div class="container"><div class="section-head"><div><div class="eyebrow">HOW YOU ARE ASSESSED</div><h2>Recognition is only one layer. The job work matters more.</h2></div><p>Knowledge checks support the pathway, but no Career Certificate is earned through multiple choice alone.</p></div><div class="cm-assessment-grid"><article><span>01</span><small>LEARN + PRACTICE</small><h3>Apply every concept</h3><p>After each new concept, explain the source, calculation or interpretation and the decision it changes.</p></article><article><span>02</span><small>BUILD</small><h3>Use professional tools</h3><p>Complete guided and independent work in role-specific workbook, research, memo and review surfaces.</p></article><article><span>03</span><small>PERFORM</small><h3>Handle a changing case</h3><p>Produce real work outputs, respond to material new information, revise dependent analysis and document what changed.</p></article><article><span>04</span><small>DEFEND</small><h3>Send the manager handoff</h3><p>State the decision, case evidence, material risk and controlled next action for server-side review.</p></article><article><span>05</span><small>PROVE</small><h3>Clear the final gate</h3><p>Pass the separate knowledge, calculation and workflow-judgment final and receive verifiable evidence of completion.</p></article></div></div></section>
    <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">FINAL JOB SIMULATION</div><h2>${esc(c.sim_title)}</h2></div><p>${esc(c.sim_context)}</p></div><div class="grid grid-2"><div class="card"><h3>Your work</h3><ol>${c.sim_steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div><div class="card"><h3>What can change</h3><p>Finance work is not static. The case introduces new information after you start.</p><ul>${c.twists.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></div></section>
    <section class="section section-white"><div class="container"><div class="section-head"><div><div class="eyebrow">PUBLIC EVIDENCE</div><h2>Why these skills are here.</h2></div><p>Each pathway keeps a visible source trail.</p></div><div class="source-list">${c.sources.map(s=>`<div class="research-source"><strong>${esc(s.name)}</strong><span>${esc(s.type)}</span><a href="${esc(s.url)}" target="_blank" rel="noopener">Source ↗</a></div>`).join('')}</div></div></section>`,'careers');
  }
  function pathStep(c,p){
    const cs=getCareerState(c.id), unlocked=canAccessPart(c,p.n), completed=isPartComplete(c,p.n), score=cs.quizScores[p.n];
    const marker = completed ? '✓' : unlocked ? p.n : '🔒';
    const cert = p.n===2?'Foundations Certificate':p.n===4?'Applied Skills Certificate':p.n===5?'Career Certificate':'';
    const status=completed?'Completed':score!=null?`Retry required · ${Number(score)}%`:unlocked?(cs.learningComplete.includes(p.n)?'Assessment ready':'Current stage'):'Locked';
    return `<div class="path-step ${!unlocked?'locked':''}" data-course-status="${completed?'passed':score!=null?'failed':unlocked?'available':'locked'}"><div class="step-num">${marker}</div><div><h3>${p.name}</h3><p>${partSummary(p.n)}</p><div class="small kicker">${status}</div></div>${cert?`<div class="credential-marker">${cert}</div>`:''}${unlocked?`<a class="btn btn-${completed?'soft':'primary'} btn-sm" href="#/learn/${c.id}/${p.n}">${completed?'Review':'Open'} →</a>`:'<span class="small muted">Preview only · complete the previous stage first</span>'}</div>`;
  }

  function assessmentBestScore(c,n,final=false){
    const cs=getCareerState(c.id);
    const raw=final?cs.finalScore:n===5?cs.simulationKnowledge:cs.quizScores?.[n];
    if(raw===null||raw===undefined||raw==='') return null;
    const score=Number(raw);
    return Number.isFinite(score)?score:null;
  }
  function assessmentContinuePath(c,n,final=false){
    if(final) return `achievement/${c.id}/career`;
    if(n===5) return `official-simulation/${c.id}`;
    if(n===2) return `achievement/${c.id}/foundations`;
    if(n===4) return `achievement/${c.id}/applied`;
    return `learn/${c.id}/${Math.min(5,n+1)}`;
  }
  function assessmentRetryPath(c,n,final=false){
    const base=final?`final/${c.id}`:`quiz/${c.id}/${n}`;
    return `${base}?retake=1&attempt=${Date.now()}`;
  }
  function assessmentReviewPath(c,n,final=false){
    return `${final?`final/${c.id}`:`quiz/${c.id}/${n}`}?review=1`;
  }
  function renderPassedAssessmentReview(c,n,final,best){
    const label=final?'Professional Readiness Final':n===5?'Job Simulation Knowledge Check':`Part ${n} Assessment`;
    render(`<section class="section"><div class="container" style="max-width:860px"><div class="card cm-assessment-review passed"><div class="eyebrow">SAVED PASS · READ-ONLY REVIEW</div><div class="score-big">${best}%</div><h1 class="serif">${esc(label)} already passed.</h1><p>Your passed attempt is final and preserved. You cannot accidentally start it again; use Review to inspect your answers or Continue to move forward.</p><div class="cm-result-actions"><a class="btn btn-gold" href="#/${assessmentContinuePath(c,n,final)}">Continue to next stage →</a><a class="btn btn-soft" href="#/${final?`career/${c.id}`:`learn/${c.id}/${n}`}">Review learning</a></div></div></div></section>`,'learning');
  }

  function renderLockedCoursePreview(c,n,kind='assessment'){
    const previous=n>1?`Part ${n-1} learning and assessment`:`Part ${n} learning`;
    const reason=kind==='final'?'Pass the official Job Simulation before starting the Professional Readiness Final.':kind==='learning'?`Complete Part ${Math.max(1,n-1)} before starting this lesson.`:`Complete ${previous} before starting this assessment.`;
    const next=Math.max(1,highestUnlockedPart(c));
    const resume=kind==='final'&&Number(getCareerState(c.id).simulationKnowledge||0)>=PASS?`#/official-simulation/${encodeURIComponent(c.id)}`:`#/learn/${encodeURIComponent(c.id)}/${next}`;
    const label=kind==='final'?'Professional Readiness Final':kind==='learning'?PARTS[n-1]?.name||`Part ${n}`:`Part ${n} Assessment`;
    render(`<section class="section cm-course-locked-preview"><div class="container" style="max-width:900px"><div class="card"><div class="eyebrow">LOOK AHEAD · READ-ONLY</div><span class="cm-lock-state">🔒 Locked for now</span><h1 class="serif">${esc(label)}</h1><p>You can see where this stage fits, but no questions, answer controls, or submissions are available until the required work is complete.</p><div class="cm-lock-requirements"><strong>Required first</strong><span>${esc(reason)}</span><small>Your saved progress is unchanged.</small></div><div class="cm-result-actions"><a class="btn btn-primary" href="${resume}">Continue where you left off →</a><a class="btn btn-outline" href="#/career/${encodeURIComponent(c.id)}">View full pathway</a></div></div></div></section>`,'learning');
  }

  function learnPage(c,n){
    if(!canAccessPart(c,n)) return renderLockedCoursePreview(c,n,'learning');
    const body=partContent(c,n);
    const learningComplete=getCareerState(c.id).learningComplete.includes(n);
    const assessmentScore=assessmentBestScore(c,n,false);
    const assessmentPassed=assessmentScore>=PASS;
    const assessmentFailed=assessmentScore!==null&&!assessmentPassed;
    const assessmentLabel=assessmentPassed ? (n===5?`Review passed knowledge check · ${assessmentScore}%`:`Review passed assessment · ${assessmentScore}%`) : assessmentFailed?`Retry required · ${assessmentScore}% · 80% needed`:(n===5?'Take simulation knowledge check':'Take 10-question assessment');
    render(`<div class="learning-shell"><div class="learning-layout"><aside class="lesson-sidebar"><div class="sidebar-title"><strong>${esc(c.title)}</strong><span>${esc(c.role)}</span></div><nav class="sidebar-nav">${PARTS.map(p=>`<a class="${p.n===n?'active':''} ${!canAccessPart(c,p.n)?'disabled':''}" href="${canAccessPart(c,p.n)?`#/learn/${c.id}/${p.n}`:'#'}"><span>${isPartComplete(c,p.n)?'✓':p.n}</span>${p.name}</a>`).join('')}</nav><a class="btn btn-soft btn-block btn-sm" href="#/career/${c.id}">← Pathway overview</a></aside>
    <article class="lesson-content"><div class="lesson-top"><div class="eyebrow">PART ${n} OF 5 · ${pctFor(c)}% COMPLETE</div><h1>${PARTS[n-1].name}</h1><p>${partSummary(n)}</p><div class="cm-stage-state ${assessmentPassed?'passed':assessmentFailed?'failed':learningComplete?'ready':'current'}"><strong>${assessmentPassed?'Assessment passed · review only':assessmentFailed?'Assessment must be passed before moving on':learningComplete?'Learning saved · assessment unlocked':'Current stage · complete the learning first'}</strong><span>${assessmentPassed?'Your score and answers are saved permanently.':assessmentFailed?'Your prior attempt is saved. Review it, then retry when ready.':learningComplete?'You can now begin the assessment.':'The assessment remains locked until you mark this learning complete.'}</span></div></div>${body}<div class="lesson-actions"><button class="btn btn-outline" onclick="CM.markPart('${c.id}',${n})" ${learningComplete?'disabled':''}>${learningComplete?'Learning complete ✓':'Mark learning complete'}</button>${learningComplete?`<a class="btn ${assessmentPassed?'btn-soft':'btn-primary'}" href="#/quiz/${c.id}/${n}">${assessmentLabel} →</a>`:`<span class="btn btn-soft cm-disabled-action" aria-disabled="true">Complete learning to unlock assessment</span>`}</div></article></div></div>`,'learning');
  }
  function partContent(c,n){
    if(n===1) return foundationsContent(c);
    if(n===2) return technicalContent(c);
    if(n===3) return toolkitContent(c);
    if(n===4) return appliedContent(c);
    return simulationPrepContent(c);
  }
  function foundationsContent(c){
    return `<section class="lesson-section"><h2>How ${esc(c.title)} actually works</h2><div class="grid grid-3"><div class="card"><div class="eyebrow">PURPOSE</div><p>${esc(c.purpose)}</p></div><div class="card"><div class="eyebrow">CLIENT / CAPITAL</div><p>${esc(c.clients)}</p></div><div class="card"><div class="eyebrow">ECONOMICS</div><p>${esc(c.revenue)}</p></div></div></section>
    <section class="lesson-section"><h2>Your seat on the team</h2><div class="role-ladder">${c.ladder.map((x,i)=>`<div><strong>${esc(x)}</strong><span>${i===0?'Entry / junior execution':i<c.ladder.length-2?'Increasing ownership & review':'Senior client/investment leadership'}</span></div>`).join('')}</div></section>
    <section class="lesson-section"><h2>A realistic day</h2><ol class="timeline">${c.day.map((x,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><p>${esc(x)}</p></li>`).join('')}</ol></section>
    <section class="lesson-section"><h2>What you actually deliver</h2><div class="grid grid-3">${c.deliverables.map((d,i)=>`<div class="card"><div class="icon-box">${i+1}</div><h3>${esc(d)}</h3><p>${esc(deliverableExplanation(c,d))}</p></div>`).join('')}</div></section>
    <section class="lesson-section"><h2>Language of the desk</h2><p>Tap each term. Capital Mastery teaches the plain-English meaning, professional use and common mistake.</p><div class="term-list">${c.vocab.map(v=>termCard(v)).join('')}</div></section>
    ${sourceDrawer(c,'career foundations')}`;
  }
  function deliverableExplanation(c,d){ return `A core work product in ${c.title}. You will practice this before the final ${c.role} simulation rather than only reading about it.`; }
  function termCard(v){
    const t=DATA.vocab[v]||{simple:`A role-specific term used in finance work.`,use:`Applied in professional ${v.toLowerCase()} decisions.`,mistake:'Using the term without understanding the underlying assumptions.'};
    return `<details class="term"><summary><strong>${esc(v)}</strong><span>Open explanation</span></summary><div class="term-details"><div><small>SIMPLE</small><p>${esc(t.simple)}</p></div><div><small>AT WORK</small><p>${esc(t.use)}</p></div><div><small>COMMON MISTAKE</small><p>${esc(t.mistake)}</p></div></div></details>`;
  }
  function technicalContent(c){
    return `<section class="lesson-section"><h2>The technical core</h2><p>Short learning units focus on one concept at a time: understand it, see it used, then apply it.</p><div class="concept-list">${c.concepts.map((id,i)=>conceptBlock(c,id,i+1)).join('')}</div></section>
    <section class="lesson-section"><div class="practice-callout"><div><div class="eyebrow">RETENTION DESIGN</div><h2>Nothing disappears after the quiz.</h2><p>These concepts return in later toolkit assignments, applied work and the job simulation. The goal is usable knowledge, not one-time completion.</p></div></div></section>${sourceDrawer(c,'technical academy')}`;
  }
  function conceptBlock(c,id,i){ const x=(DATA.concepts||{})[id]||{name:id.replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()),explain:'Understand the concept, the assumptions behind it and where it appears in professional work.',work:'Apply the concept to a realistic finance decision.',example:'A professional answer connects the calculation to the decision.'};const cs=getCareerState(c.id);const saved=cs.conceptPractice?.[id]||'';return `<article class="concept-block"><div class="concept-index">${String(i).padStart(2,'0')}</div><div><h3>${esc(x.name)}</h3><p>${esc(x.explain)}</p><div class="concept-application"><strong>At the desk:</strong> ${esc(x.work)}</div><div class="concept-example"><strong>Worked example:</strong> ${esc(x.example)}</div><div class="cm-concept-practice"><div><span>PRACTICE NOW · BEFORE THE QUIZ</span><strong>Apply ${esc(x.name)} to the job</strong><p>Using the explanation and worked example above, write the input or source, the calculation or interpretation, and the decision or risk it changes for a ${esc(c.role)}.</p></div><label>Your practice response<textarea data-concept-practice="${esc(id)}" data-concept-career="${esc(c.id)}" placeholder="1. Input / source and period…\n2. Calculation or interpretation, with units…\n3. Decision, risk or follow-up…">${esc(saved)}</textarea></label><details><summary>Self-review standard</summary><ul><li>Inputs and sources are identifiable.</li><li>Units, period and formula or logic are explicit.</li><li>The result is interpreted rather than merely repeated.</li><li>The role decision, risk or follow-up is clear.</li></ul></details></div></div></article>`; }
  function toolkitContent(c){
    return `<section class="lesson-section"><div class="eyebrow">TEACH → SHOW → GUIDE → PRACTICE</div><h2>Professional Toolkit</h2><p>No tool is tested before it is taught. Every lab first explains the work product and interface, then walks through a worked example, then gives you a guided build, and only then asks you to complete an independent task.</p><div class="cm-toolkit-sequence-note"><strong>Capital Mastery teaching contract:</strong> if a later assessment or simulation expects a skill, this section must first teach the skill and show what correct work looks like.</div><div class="cm-toolkit-labs">${c.toolkit.map((x,i)=>toolkitLab(c,x,i)).join('')}</div></section>
    <section class="lesson-section"><h2>The Desk Standard</h2><div class="grid grid-4">${['KNOW','CALCULATE','BUILD','RESEARCH','JUDGE','COMMUNICATE','DELIVER'].map((x,i)=>`<div class="card"><div class="eyebrow">${x}</div><p>${deskText(c,x,i)}</p></div>`).join('')}</div></section>${sourceDrawer(c,'professional toolkit')}`;
  }
  function toolkitLab(c,x,i){
    const practice=c.applied[i%c.applied.length];
    const deliverable=c.deliverables[i%c.deliverables.length];
    const tool=c.tools[i%c.tools.length];
    return `<article class="lab-card cm-toolkit-lab"><div class="lab-num">LAB ${i+1}</div><h3>${esc(x)}</h3><p>${esc(toolkitWhy(c,x))}</p><div class="cm-learn-cycle"><section><span>1 · TEACH</span><strong>What you are doing and why</strong><p>${esc(`This workflow supports ${deliverable}. Before touching the task, understand the decision it supports, the inputs you need, the units/time period, and the review standard.`)}</p></section><section><span>2 · VISUAL DEMONSTRATION</span><strong>See the professional work product</strong><p>${esc(`Capital Mastery demonstrates the workflow in a ${tool}-style training surface, showing where inputs, calculations, outputs, source notes and review checks belong.`)}</p></section><section><span>3 · GUIDED BUILD</span><strong>Follow the workflow with prompts</strong><p>${esc(`Complete a worked version with step-by-step prompts, checks and explanations. You can inspect the worked answer before moving to independent practice.`)}</p></section><section><span>4 · INDEPENDENT PRACTICE</span><strong>Produce the work yourself</strong><p>${esc(practice)}</p></section></div><div class="mini-work"><strong>Review standard:</strong> accuracy · source discipline · logic · assumptions · presentation · ability to explain the result.</div></article>`;
  }
  function toolkitWhy(c,x){ return `Learn ${x.toLowerCase()} in the format a junior ${c.role} would actually encounter, then reproduce the workflow yourself.`; }
  function deskText(c,x,i){ const arr=[`Explain ${c.vocab.slice(0,4).join(', ')} and the rest of the role language.`,`Perform the calculations that support ${c.deliverables[0]}.`,`Create ${c.deliverables.slice(0,2).join(' and ')}.`,`Find and validate company, market or client evidence.`,`Choose among plausible alternatives and defend the recommendation.`,`Write and present concise, decision-useful work.`,`Submit professional outputs that can survive review.`]; return arr[i%arr.length]; }
  function appliedContent(c){
    return `<section class="lesson-section"><div class="eyebrow">INDEPENDENT APPLICATION</div><h2>Applied work before the full simulation</h2><p>These assignments only use skills already introduced and demonstrated in Parts 2–3. Each assignment points back to the toolkit workflow you should review before starting.</p>${c.applied.map((x,i)=>`<article class="applied-assignment"><div class="assignment-head"><span>Assignment ${i+1}</span><strong>${esc(x)}</strong></div><div class="cm-prereq-reminder"><strong>Taught first:</strong> Review Toolkit Lab ${(i%c.toolkit.length)+1} — ${esc(c.toolkit[i%c.toolkit.length])}. Use the same workflow, source discipline and review checks without the step-by-step prompts.</div><label for="ap-${i}">Your work</label><textarea id="ap-${i}" data-applied="${i}" data-career="${c.id}" placeholder="Produce the requested work product, calculations, assumptions, evidence and recommendation...">${esc(getCareerState(c.id).applied[i]||'')}</textarea><div class="manager-note"><strong>Manager review lens:</strong> accuracy · source quality · logic · risks · communication.</div></article>`).join('')}</section>
      <section class="lesson-section"><div class="feedback-box"><strong>Review loop:</strong> learn → see a worked example → guided build → independent assignment → manager comments → revise → final. Capital Mastery measures whether you can transfer the taught workflow into work of your own.</div></section>${sourceDrawer(c,'applied work')}`;
  }
  function simulationPrepContent(c){
    return `<section class="lesson-section"><h2>${esc(c.sim_title)} — simulation briefing</h2><p>${esc(c.sim_context)}</p><div class="simulation-brief"><div><div class="eyebrow">YOUR ROLE</div><h3>${esc(c.role)}</h3>${c.track?`<p>${esc(c.track)}</p>`:''}</div><div><div class="eyebrow">YOUR WORK</div><ol>${c.sim_steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></div></section>
    <section class="lesson-section"><h2>Before you enter assessment mode</h2><p>The Part 5 knowledge check confirms you understand the workflow. Score 80% or higher, then the practical simulation unlocks.</p><div class="feedback-box"><strong>Assessment mode:</strong> The simulation grades numerical/technical accuracy, analysis, professional judgment, research/source quality, communication and attention to detail.</div></section>${sourceDrawer(c,'job simulation')}`;
  }
  function sourceDrawer(c,label){ return `<details class="source-drawer"><summary>Sources & professional relevance</summary><div><p><strong>Why this ${label} exists:</strong> Capital Mastery maps public occupational/employer evidence to the required knowledge and deliverables for ${esc(c.role)}.</p>${c.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener"><strong>${esc(s.name)}</strong><span>${esc(s.type)}</span></a>`).join('')}<p class="small muted">Capital Mastery is independent. Public sources inform our curriculum; they do not imply sponsorship or endorsement.</p></div></details>`; }

  function markPart(id,n){
    const c=careerById(id),cs=getCareerState(id);
    if(!cs.learningComplete.includes(n)) cs.learningComplete.push(n);
    saveState(); toast('Learning marked complete. Now pass the assessment to unlock the next stage.','good');
    renderRoute();
  }

  function buildQuiz(c,n,final=false){
    const qs=[]; const others=DATA.careers.filter(x=>x.id!==c.id);
    if(n===1 || final){
      qs.push({prompt:`What is the primary purpose of ${c.title}?`,options:shuffleWithCorrect(c.purpose,others.slice(0,3).map(x=>x.purpose)),answer:c.purpose,explain:`${c.title}: ${c.purpose}`});
      qs.push({prompt:`Which role is Capital Mastery primarily preparing you for in this pathway?`,options:shuffleWithCorrect(c.role,others.slice(3,6).map(x=>x.role)),answer:c.role,explain:`The pathway targets the entry role ${c.role}.`});
      qs.push({prompt:'Which item is an authentic work product in this pathway?',options:shuffleWithCorrect(c.deliverables[0],[others[0].deliverables[0],others[1].deliverables[0],others[2].deliverables[0]]),answer:c.deliverables[0],explain:`${c.deliverables[0]} is one of the pathway’s mapped deliverables.`});
      const v=c.vocab[0],vd=DATA.vocab[v]; if(vd) qs.push({prompt:`Which description best matches ${v}?`,options:shuffleWithCorrect(vd.simple,c.vocab.slice(1,4).map(z=>DATA.vocab[z]?.simple||`A different ${c.title} concept.`)),answer:vd.simple,explain:vd.use});
    }
    if(n===2 || final){
      c.concepts.slice(0,4).forEach((id,i)=>{ const x=concept(id); if(!x)return; const wrong=c.concepts.filter(y=>y!==id).slice(0,3).map(y=>concept(y)?.explain||'A different technical concept.'); qs.push({prompt:`Which explanation best matches ${x.name}?`,options:shuffleWithCorrect(x.explain,wrong),answer:x.explain,explain:`At work: ${x.work}`}); });
      c.vocab.slice(1,5).forEach(v=>{ const x=DATA.vocab[v]; if(!x)return; qs.push({prompt:`What is a common mistake with ${v}?`,options:shuffleWithCorrect(x.mistake,[`Using ${v} with appropriate assumptions.`,`Documenting the source and period consistently.`,`Testing sensitivity before making a recommendation.`]),answer:x.mistake,explain:x.use}); });
    }
    if(n===3 || final){
      c.toolkit.slice(0,4).forEach((x,i)=>qs.push({prompt:`Which activity belongs in the ${c.title} professional toolkit?`,options:shuffleWithCorrect(x,[others[i%others.length].toolkit[0],others[(i+1)%others.length].toolkit[1]||others[0].toolkit[0],'Skip source and logic checks to work faster']),answer:x,explain:`${x} is explicitly practiced in the toolkit.`}));
      qs.push({prompt:'What is the strongest pre-submission habit?',options:shuffleWithCorrect('Check calculations, sources, assumptions, logic and presentation',['Submit immediately when the first answer appears','Remove downside cases before review','Use unsourced figures if they look reasonable']),answer:'Check calculations, sources, assumptions, logic and presentation',explain:'Professional review starts with defensible, checked work.'});
    }
    if(n===4 || final){
      c.applied.slice(0,4).forEach((x,i)=>qs.push({prompt:`Which assignment best prepares a learner for ${c.role}?`,options:shuffleWithCorrect(x,[others[i%others.length].applied[0],others[(i+2)%others.length].applied[1]||others[1].applied[0],'Choose an answer without documenting assumptions']),answer:x,explain:'Applied Work bridges the toolkit and the full simulation.'}));
      qs.push({prompt:'A manager identifies a material assumption error. What should you do?',options:shuffleWithCorrect('Correct the assumption, rerun affected analysis, explain the impact and resubmit',['Change formatting only','Ignore it if the final recommendation is unchanged','Delete the manager comment']),answer:'Correct the assumption, rerun affected analysis, explain the impact and resubmit',explain:'Review/revision is part of professional work.'});
    }
    if(n===5 || final){
      c.sim_steps.slice(0,4).forEach((x,i)=>qs.push({prompt:`Which activity appears in ${c.sim_title}?`,options:shuffleWithCorrect(x,[others[i%others.length].sim_steps[0],others[(i+3)%others.length].sim_steps[1]||others[0].sim_steps[0],'Bypass analysis and issue the certificate']),answer:x,explain:`The simulation explicitly requires: ${x}` }));
      qs.push({prompt:'New information materially changes the case midway through the simulation. Best response?',options:shuffleWithCorrect('Update the affected assumptions and reconsider the recommendation',['Freeze the original model because it was already submitted','Hide the new information','Automatically choose the most optimistic case']),answer:'Update the affected assumptions and reconsider the recommendation',explain:'Real professional work changes when evidence changes.'});
    }
    const unique=[]; const seen=new Set(); for(const q of qs){ if(!seen.has(q.prompt)){seen.add(q.prompt);unique.push(q);} }
    const need=final?20:10;
    while(unique.length<need){
      const idx=unique.length;
      const d=c.deliverables[idx%c.deliverables.length];
      const answer=`Use ${d} with documented assumptions, source checks and professional review.`;
      unique.push({prompt:`Which approach best reflects the Capital Mastery Desk Standard for ${d}?`,options:shuffleWithCorrect(answer,[`Use ${d} without checking sources or assumptions.`,`Choose the most optimistic output regardless of evidence.`,`Skip review because the work product is familiar.`]),answer,explain:'The Desk Standard requires defensible work, source discipline, judgment and review.'});
    }
    return unique.slice(0,need);
  }
  function shuffleWithCorrect(correct,wrong){ return shuffle([correct,...wrong.filter(Boolean).slice(0,3)]); }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  function quizPage(c,n,final=false){
    if(!final && !canAccessPart(c,n)) return renderLockedCoursePreview(c,n,'assessment');
    if(!final && !qaMode() && !getCareerState(c.id).learningComplete.includes(n)) return renderLockedCoursePreview(c,n,'assessment');
    if(final && !qaMode() && Number(getCareerState(c.id).simulationScore||0)<PASS) return renderLockedCoursePreview(c,5,'final');
    const best=assessmentBestScore(c,n,final);
    if(best>=PASS && !qaMode()) return renderPassedAssessmentReview(c,n,final,best);
    const q=buildQuiz(c,n,final);
    sessionStorage.setItem('cmCurrentQuiz',JSON.stringify({careerId:c.id,n,final,q}));
    render(`<section class="quiz-shell"><div class="quiz-wrap"><div class="quiz-head"><div><div class="eyebrow">${final?'PROFESSIONAL READINESS FINAL':n===5?'JOB SIMULATION KNOWLEDGE CHECK':`PART ${n} ASSESSMENT`}</div><h1>${final?`${c.title} Professional Readiness Final`:PARTS[n-1].name}</h1><p>${q.length} scored decisions · 80% required · ${final?'16/20 to pass':'8/10 to pass'}</p></div><a class="btn btn-outline" href="#/career/${c.id}">Exit</a></div><form id="quiz-form">${q.map((x,i)=>`<fieldset class="question"><legend><span>${i+1}</span>${esc(x.prompt)}</legend>${x.options.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${esc(o)}"><span>${String.fromCharCode(65+j)}</span><p>${esc(o)}</p></label>`).join('')}<div class="explanation" id="ex-${i}" hidden></div></fieldset>`).join('')}<button class="btn btn-primary btn-block" type="submit">Submit ${final?'Readiness Final':'Assessment'}</button></form></div></section>`,'learning');
    document.getElementById('quiz-form').addEventListener('submit',e=>submitQuiz(e,c,n,final,q));
  }
  function submitQuiz(e,c,n,final,q){
    e.preventDefault(); let right=0; const form=e.currentTarget;
    q.forEach((x,i)=>{ const val=form.querySelector(`input[name=q${i}]:checked`)?.value; if(val===x.answer) right++; const ex=document.getElementById(`ex-${i}`); ex.hidden=false; ex.className='explanation '+(val===x.answer?'correct':'incorrect'); ex.innerHTML=`<strong>${val===x.answer?'Correct':'Review this'}</strong><p>${esc(x.explain)}</p><p><strong>Answer:</strong> ${esc(x.answer)}</p>`; });
    const score=Math.round(right/q.length*100); const cs=getCareerState(c.id);
    if(final) cs.finalScore=Math.max(Number(cs.finalScore||0),score); else if(n===5) cs.simulationKnowledge=Math.max(Number(cs.simulationKnowledge||0),score); else cs.quizScores[n]=Math.max(Number(cs.quizScores[n]||0),score);
    if(!final && n<=4 && score>=PASS){ if(!cs.completedParts.includes(n)) cs.completedParts.push(n); if(n===2) issueIfEligible(c,'foundations'); if(n===4) issueIfEligible(c,'applied'); }
    if(n===5 && score>=PASS && !cs.completedParts.includes(5)) cs.completedParts.push(5);
    if(final && score>=PASS) issueIfEligible(c,'career');
    saveState();
    const passed=score>=PASS;
    const next = passed ? assessmentContinuePath(c,n,final) : assessmentReviewPath(c,n,final);
    const results=document.createElement('div'); results.className='quiz-result'; results.innerHTML=`<div class="${passed?'pass':'fail'}"><div class="score-big">${right} / ${q.length}</div><h2>${passed?'Passed · saved':'Retry required'}</h2><p><strong>${score}%.</strong> ${passed?'This passed attempt is final. Your answers stay available in read-only Review and the assessment cannot be started again.':'Your attempt and feedback are saved. Review each answer below; the read-only review provides a separate Retry action when you are ready.'}</p><a class="btn ${passed?'btn-gold':'btn-primary'}" href="#/${next}">${passed?(final||n===2||n===4?'View Achievement':'Continue to next stage'):'Review saved attempt'} →</a></div>`; form.prepend(results); form.querySelector('button[type=submit]').disabled=true; form.querySelectorAll('input').forEach(input=>input.disabled=true); window.scrollTo({top:0,behavior:'smooth'});
  }

  function simulationPage(c, forceAdminPreview=false){
    const adminPreview = forceAdminPreview && qaMode();
    if(!adminPreview && !qaMode()){ location.hash=`#/official-simulation/${c.id}`; return; }
    const cs=getCareerState(c.id); if(!adminPreview && !qaMode() && Number(cs.simulationKnowledge||0)<PASS){ toast('Pass the Part 5 knowledge check first.','warn'); return nav(`learn/${c.id}/5`); }
    const sim=simFor(c);
    render(`<div class="sim-shell"><div class="sim-topbar"><div class="container"><div><h2>${esc(sim.name)}</h2><div class="sim-role">${esc(c.role)}${c.track?` · ${esc(c.track)}`:''}</div></div><div class="small">Assessment Mode · Practical Simulation</div></div></div><div class="container sim-layout"><nav class="sim-nav">${['Inbox','Brief','Data','Workspace','Review','Results'].map((x,i)=>`<button class="${i===0?'active':''}" data-sim-tab="${x.toLowerCase()}">${simIcon(x)} ${x}</button>`).join('')}</nav><section class="sim-panel" id="sim-panel">${simInbox(c,sim)}</section></div></div>`,'learning');
    document.querySelectorAll('[data-sim-tab]').forEach(b=>b.addEventListener('click',()=>switchSimTab(c,sim,b.dataset.simTab,b)));
  }
  function simIcon(x){ return ({Inbox:'✉',Brief:'▤',Data:'▦',Workspace:'▣',Review:'✓',Results:'★'})[x]; }
  function switchSimTab(c,sim,tab,btn){ document.querySelectorAll('[data-sim-tab]').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); const p=document.getElementById('sim-panel'); if(tab==='inbox')p.innerHTML=simInbox(c,sim); if(tab==='brief')p.innerHTML=simBrief(c,sim); if(tab==='data')p.innerHTML=simData(c,sim); if(tab==='workspace'){p.innerHTML=simWorkspace(c,sim); bindSimWorkspace(c,sim);} if(tab==='review')p.innerHTML=simReview(c,sim); if(tab==='results')p.innerHTML=simResults(c,sim); }
  function simInbox(c,sim){ return `<h1>Inbox</h1><p class="muted">New assignment · Today</p><div class="email"><div class="email-head"><strong>From:</strong> ${c.ladder[1]||'Manager'} · <strong>Subject:</strong> ${esc(sim.name)} — analysis needed</div><div class="email-body"><p>Welcome to the assignment. ${esc(c.sim_context)}</p><p>Please review the brief and case data, complete the workspace, and send me a concise recommendation. Document assumptions and call out anything that could change the decision.</p><p>— ${esc(c.ladder[1]||'Manager')}</p></div></div><div class="feedback-box"><strong>Professional habit:</strong> Before calculating anything, identify the decision, the requested deliverable and the highest-risk assumptions.</div>`; }
  function simBrief(c,sim){ return `<h1>Assignment Brief</h1><p>${esc(c.sim_context)}</p><h3>Required workflow</h3><ol>${c.sim_steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>New-information risk</h3><ul>${c.twists.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="feedback-box"><strong>Scoring:</strong> objective analysis + professional judgment + written recommendation. You need 80/100 to pass.</div>`; }
  function simData(c,sim){ return `<h1>Case Data</h1><p>Use the provided case data. These figures are <strong>SIMULATED CASE</strong> data unless a source is explicitly labeled otherwise.</p><table class="data-table"><thead><tr><th>Item</th>${sim.rows[0].slice(1).map((_,i)=>`<th>${i===0?esc(sim.target):'Value'}</th>`).join('')}</tr></thead><tbody>${sim.rows.map(r=>`<tr>${r.map((x,i)=>`<${i===0?'th':'td'}>${esc(x)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table><div class="source-drawer"><strong>Data label: SIMULATED CASE</strong><p>Designed to test role-specific competencies. Real-data exercises elsewhere are labeled REAL DATA and link to their sources.</p></div>`; }
  function simWorkspace(c,sim){
    const cs=getCareerState(c.id),r=cs.simResponses||{};
    return `<h1>Workspace</h1><p>Complete every required item. Numerical answers accept reasonable rounding.</p><form id="sim-form">${sim.questions.map((q,i)=>`<div class="work-task"><h3>Task ${i+1} · ${q.points} points</h3><p>${esc(q.prompt)}</p>${q.type==='mc'?`<div class="sim-options">${q.options.map((o,j)=>`<label class="option"><input type="radio" name="s${i}" value="${esc(o)}" ${r[i]===o?'checked':''}><span>${String.fromCharCode(65+j)}</span><p>${esc(o)}</p></label>`).join('')}</div>`:`<input class="num-input" type="number" step="any" name="s${i}" value="${esc(r[i]||'')}" placeholder="Enter number">`}</div>`).join('')}<div class="work-task"><h3>Final recommendation · ${sim.writing.points} points</h3><p>${esc(sim.writing.prompt)}</p><textarea name="writing" style="width:100%;min-height:170px" placeholder="Write a concise, decision-useful recommendation...">${esc(r.writing||'')}</textarea></div><button class="btn btn-primary btn-block" type="submit">Submit Practical Simulation</button></form>`;
  }
  function bindSimWorkspace(c,sim){ document.getElementById('sim-form')?.addEventListener('submit',e=>gradeSimulation(e,c,sim)); }
  function gradeSimulation(e,c,sim){
    e.preventDefault(); const fd=new FormData(e.currentTarget),cs=getCareerState(c.id); cs.simResponses={}; let score=0;
    sim.questions.forEach((q,i)=>{ const val=fd.get(`s${i}`); cs.simResponses[i]=val; if(q.type==='mc' && val===q.options[q.correct])score+=q.points; if(q.type==='num' && val!==null && val!==''){ const n=Number(val); if(Math.abs(n-q.answer)<=q.tolerance)score+=q.points; else if(Math.abs(n-q.answer)<=Math.max(q.tolerance*5,Math.abs(q.answer)*.03))score+=Math.round(q.points*.65); }});
    const writing=String(fd.get('writing')||'').trim(); cs.simResponses.writing=writing; const lower=writing.toLowerCase(); const hits=[...new Set(sim.writing.keywords.filter(k=>lower.includes(String(k).replace(/-/g,' ').toLowerCase().split(' ')[0])))].length; const lengthScore=Math.min(12,Math.floor(writing.split(/\s+/).filter(Boolean).length/12)); const kwScore=Math.min(sim.writing.points-12,Math.round((hits/Math.max(4,sim.writing.keywords.length))* (sim.writing.points-12))); score+=lengthScore+kwScore;
    score=Math.min(100,Math.round(score)); cs.simulationScore=Math.max(Number(cs.simulationScore||0),score); if(score>=PASS && !cs.completedParts.includes(5))cs.completedParts.push(5); saveState(); toast(`Simulation submitted: ${score}/100 ${score>=PASS?'— passed':'— review and retry'}`,score>=PASS?'good':'warn'); switchSimTab(c,sim,'results',document.querySelector('[data-sim-tab="results"]')); }
  function simReview(c,sim){ const cs=getCareerState(c.id); return `<h1>Manager Review</h1>${cs.simResponses?.writing?`<div class="feedback-box"><strong>${esc(c.ladder[1]||'Manager')} comments:</strong><p>${Number(cs.simulationScore||0)>=PASS?'Your recommendation is directionally defensible. Tighten assumptions and preserve the strongest downside point for senior review.':'The work needs a clearer link between case evidence, calculation and recommendation. Revisit the weakest technical answer and make the downside case explicit.'}</p></div><h3>Your submitted recommendation</h3><p>${esc(cs.simResponses.writing)}</p>`:`<p>You have not submitted the workspace yet. Complete the analysis first.</p>`}`; }
  function simResults(c,sim){ const cs=getCareerState(c.id),s=Number(cs.simulationScore||0); const passed=s>=PASS; return `<h1>Simulation Results</h1>${s?`<div class="score-grid"><div class="score-cell"><small>Overall</small><strong>${s}</strong><span>/100</span></div><div class="score-cell"><small>Standard</small><strong>${PASS}</strong><span>required</span></div><div class="score-cell"><small>Status</small><strong>${passed?'PASS':'RETRY'}</strong></div></div><div class="feedback-box"><strong>${passed?'Strong performance.':'Not yet at the standard.'}</strong> ${passed?'You demonstrated the practical mastery required to move to the Professional Readiness Final.':'Reopen Workspace, revise your analysis and resubmit a new attempt.'}</div>${passed?`<a class="btn btn-gold" href="#/final/${c.id}">Take Professional Readiness Final →</a>`:`<button class="btn btn-primary" onclick="document.querySelector('[data-sim-tab=workspace]').click()">Revise Simulation</button>`}`:`<p>No simulation result yet. Complete Workspace and submit.</p>`}`; }

  function finalPage(c){ const cs=getCareerState(c.id); if(!qaMode() && Number(cs.simulationScore||0)<PASS){toast('Pass the practical simulation first.','warn');return nav(`official-simulation/${c.id}`);} quizPage(c,5,true); }

  function achievementPage(c,type){
    issueIfEligible(c,type);
    const info=credentialInfo(c,type), cs=getCareerState(c.id);
    const isCareer=type==='career';
    const score=isCareer?Number(cs.finalScore||0):type==='applied'?Number(cs.quizScores[4]||0):Number(cs.quizScores[2]||0);
    const sim=Number(cs.simulationScore||0);
    const topSkills=[...new Set([...c.deliverables.slice(0,3),...c.vocab.slice(0,3)])];
    render(`<section class="achievement-hero"><div class="confetti-field" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="container achievement-wrap"><div class="achievement-seal"><img src="assets/seal.svg" alt=""></div><div class="eyebrow">${isCareer?'CAREER CERTIFICATE EARNED':type==='applied'?'APPLIED SKILLS CERTIFICATE EARNED':'FOUNDATIONS CERTIFICATE EARNED'}</div><h1>${isCareer?'You passed.':'Milestone unlocked.'}</h1><h2>${esc(info.name)}</h2><p>${isCareer?`You completed the full ${esc(c.title)} pathway and met the Capital Mastery Standard across knowledge, practical simulation and the Professional Readiness Final.`:`You completed the required ${type==='applied'?'applied-work':'foundational'} stages and met the 80% mastery standard.`}</p><div class="achievement-metrics"><div><strong>${score}%</strong><span>${isCareer?'Readiness Final':'Milestone Assessment'}</span></div>${isCareer?`<div><strong>${sim}%</strong><span>Job Simulation</span></div><div><strong>${readiness(c)}</strong><span>Career Readiness</span></div>`:`<div><strong>80%+</strong><span>Required standard</span></div><div><strong>${pctFor(c)}%</strong><span>Pathway progress</span></div>`}</div><div class="achievement-skills"><span>Skills demonstrated</span>${topSkills.map(x=>`<b>${esc(x)}</b>`).join('')}</div><div class="hero-actions" style="justify-content:center"><a class="btn btn-gold" href="#/certificate/${c.id}/${type}">View Certificate →</a><a class="btn btn-outline achievement-outline" href="#/credential/${c.id}/${type}">Share & Add to LinkedIn</a></div><p class="achievement-date">Issued ${formatDate(info.issuedAt)} · ${esc(info.id)}</p></div></section>`,'credentials');
  }

  function credentialsPage(){
    render(`<section class="credentials-hero"><div class="container"><div class="eyebrow">YOUR ACHIEVEMENTS</div><h1>Credentials that show what you proved.</h1><p>Every pathway offers three certificates. The Career Certificate requires 100% completion plus ≥80% knowledge, practical simulation and Professional Readiness Final performance.</p></div></section><section class="section-tight"><div class="container"><div class="grid">${DATA.careers.map(c=>credentialCareerBlock(c)).join('')}</div></div></section>`,'credentials');
  }
  function credentialCareerBlock(c){ issueAllEligible(c); return `<section class="card"><div class="section-head" style="margin-bottom:18px"><div><div class="eyebrow">${esc(c.title)}</div><h2 style="font-size:2rem">${esc(c.role)}</h2></div><div class="small muted">${pctFor(c)}% complete · Readiness ${readiness(c)||'—'}</div></div><div class="grid">${['foundations','applied','career'].map(t=>credentialRow(c,t)).join('')}</div></section>`; }
  function credentialRow(c,t){ const info=credentialInfo(c,t), earned=info.earned, eligibleNow=eligible(c,t); const icon=t==='career'?'★':t==='applied'?'◇':'○'; return `<div class="credential-card ${!earned&&!eligibleNow?'credential-locked':''}"><div class="credential-icon">${icon}</div><div><h3>${esc(info.name)}</h3><p>${earned?`Issued ${formatDate(info.issuedAt)}`:eligibleNow?'Eligible — issue preview credential':'Complete required stages and pass every assessment at 80%+'}</p></div><div class="credential-actions">${earned||eligibleNow?`<a class="btn btn-outline btn-sm" href="#/credential/${c.id}/${t}">${earned?'View':'Preview'} →</a>`:`<a class="btn btn-soft btn-sm" href="#/career/${c.id}">View requirements</a>`}</div></div>`; }

  function credentialDetail(c,type){ issueIfEligible(c,type); const info=credentialInfo(c,type),cs=getCareerState(c.id); const skills=[...new Set([...c.vocab.slice(0,6),...c.deliverables.slice(0,4)])]; const verify=`${location.origin}${location.pathname}#/verify/${encodeURIComponent(info.id)}`; const linkedin=linkedinPost(c,type,info,'professional');
    render(`<section class="section"><div class="container credential-detail"><article class="credential-summary"><span class="verify-status ${info.earned?'':'preview'}">${info.earned?'✓ PREVIEW-ISSUED':'◌ QA PREVIEW'}</span><div class="eyebrow" style="margin-top:20px">${type==='career'?'CAREER CERTIFICATE':type==='applied'?'APPLIED SKILLS CERTIFICATE':'FOUNDATIONS CERTIFICATE'}</div><h1>${esc(info.name)}</h1><p>Issued to <strong>${esc(state.profile.name)}</strong>${info.earned?` on ${formatDate(info.issuedAt)}`:''}.</p><div class="grid grid-3" style="margin:20px 0"><div class="data-card"><div class="value">${type==='career'?(cs.finalScore||'—'):(type==='applied'?(cs.quizScores[4]||'—'):(cs.quizScores[2]||'—'))}</div><div class="label">Assessment</div></div><div class="data-card"><div class="value">${type==='career'?(cs.simulationScore||'—'):readiness(c)||'—'}</div><div class="label">${type==='career'?'Simulation':'Readiness'}</div></div><div class="data-card"><div class="value">80%</div><div class="label">Minimum standard</div></div></div><h3>Skills demonstrated</h3><div class="skills-wrap">${skills.map(s=>`<span class="skill">${esc(s)}</span>`).join('')}</div><div class="divider"></div><p class="small muted">Until Firebase secure issuance is connected, credentials created by this build are local QA previews, not live public verification records.</p></article><aside class="share-panel"><h3>Share your achievement</h3><a class="btn btn-gold btn-block" href="#/certificate/${c.id}/${type}">View Certificate</a><button class="btn btn-outline btn-block" style="margin-top:8px" onclick="CM.linkedinFields('${c.id}','${type}')">Add to LinkedIn</button><button class="btn btn-outline btn-block" style="margin-top:8px" onclick="CM.postModal('${c.id}','${type}')">Create LinkedIn Post</button><button class="btn btn-outline btn-block" style="margin-top:8px" onclick="CM.downloadSocial('${c.id}','${type}')">Download Share Graphic</button><label>Credential ID</label><div class="copy-row">${esc(info.id)}</div><button class="btn btn-soft btn-sm" onclick="CM.copy('${esc(info.id)}')">Copy ID</button><label style="display:block;margin-top:14px">Credential URL</label><div class="copy-row">${esc(verify)}</div><button class="btn btn-soft btn-sm" onclick="CM.copy('${esc(verify)}')">Copy Link</button><div style="display:none">${esc(linkedin)}</div></aside></div></section>`,'credentials');
  }
  function certificatePage(c,type){ const info=credentialInfo(c,type); if(!info.earned && !qaMode() && !eligible(c,type)){toast('This certificate is still locked.','warn');return nav(`career/${c.id}`);} const isCareer=type==='career', cls=type==='foundations'?'simple':type==='applied'?'applied':''; const description=isCareer?'for demonstrating mastery across required learning, technical assessments, applied work and a graded Career Skills job simulation under the Capital Mastery Standard.':type==='applied'?'for successfully completing the applied learning, professional toolkit and required assessments.':'for successfully completing the career foundations and technical academy requirements.';
    render(`<section class="cert-page"><div id="certificate" class="certificate ${cls}"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>${isCareer?'<img class="cert-seal" src="assets/seal.svg" alt="Capital Mastery seal">':''}<div class="cert-inner"><div class="cert-brand"><img src="assets/logo-mark.svg" alt="">CAPITAL MASTERY</div><div class="cert-type">${type==='career'?'Career Certificate':type==='applied'?'Applied Skills Certificate':'Foundations Certificate'}</div><div class="cert-awarded">This certificate is ${isCareer?'proudly ':''}awarded to</div><div class="cert-name">${esc(state.profile.name)}</div><div class="cert-for">for successfully completing the requirements of</div><div class="cert-title">${esc(isCareer?info.name.replace(/ Career Certificate$/,''):info.name.replace(/ Certificate$/,''))}</div><div class="cert-description">${esc(description)}</div><div class="cert-bottom"><div class="cert-meta"><span>ISSUED</span><strong>${formatDate(info.issuedAt)}</strong></div><div class="signature-block"><img src="assets/founder-signature.png" alt="Founder signature"><div class="signature-line"></div><strong>Shriyan Avadhanula</strong><span>Founder, Capital Mastery</span></div><div class="cert-meta"><div id="cert-qr" class="cert-qr qr-placeholder" data-text="${esc(info.id)}"></div><span>CREDENTIAL ID</span><strong>${esc(info.id)}</strong></div></div></div>${!info.earned?'<div class="cert-preview-mark">QA preview · not a live verified credential</div>':''}</div><div class="cert-toolbar"><button class="btn btn-primary" onclick="window.print()">Download / Print PDF</button><button class="btn btn-outline" onclick="CM.downloadCertificateImage()">Download PNG</button><a class="btn btn-outline" href="#/credential/${c.id}/${type}">Credential Details</a></div></section>`,'credentials');
    renderPseudoQr(document.getElementById('cert-qr'),info.id);
  }

  function renderPseudoQr(el,text){
    // Deterministic verification mark for local QA previews. Live signed-in credentials use the authoritative D1 verification flow.
    if(!el)return; const size=21, h=Math.abs(hashCode(text)), bits=[]; for(let y=0;y<size;y++){for(let x=0;x<size;x++){ const finder=(x<7&&y<7)||(x>=14&&y<7)||(x<7&&y>=14); let on=finder?((x%6===0||y%6===0||((x%6>=2&&x%6<=4)&&(y%6>=2&&y%6<=4)))):(((h>>(x+y)%24)&1)^((x*y+y)%3===0)); bits.push(on?1:0); }} el.style.display='grid';el.style.gridTemplateColumns=`repeat(${size},1fr)`;el.innerHTML=bits.map(b=>`<i style="display:block;background:${b?'#071a33':'#fff'}"></i>`).join('');
  }
  function downloadCertificateImage(){
    // Browser-native high-res raster export using SVG foreignObject, with print fallback if blocked.
    const cert=document.getElementById('certificate'); if(!cert)return;
    try{ const clone=cert.cloneNode(true); clone.style.width='1120px'; clone.style.height='792px'; const xml=new XMLSerializer().serializeToString(clone); const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="792"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${xml}</div></foreignObject></svg>`; const blob=new Blob([svg],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob); const img=new Image(); img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=2240;canvas.height=1584;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.drawImage(img,0,0,1120,792);URL.revokeObjectURL(url); const a=document.createElement('a');a.download='Capital-Mastery-Certificate.png';a.href=canvas.toDataURL('image/png');a.click();}; img.onerror=()=>{URL.revokeObjectURL(url);window.print();}; img.src=url; }catch(e){window.print();}
  }

  function linkedinFields(c,type){ if(typeof c==='string') c=careerById(c); const info=credentialInfo(c,type); const url=`${location.origin}${location.pathname}#/verify/${encodeURIComponent(info.id)}`; modal(`<h2>Add to LinkedIn</h2><p>LinkedIn currently asks learners to enter third-party credential fields. Capital Mastery makes each field one-click copy.</p>${[['Credential name',info.name],['Issuing organization','Capital Mastery'],['Issue date',formatMonthYear(info.issuedAt)],['Credential ID',info.id],['Credential URL',url]].map(([a,b])=>`<label>${a}</label><div class="copy-row" style="background:#f5f7f9;color:#24303d">${esc(b)}</div><button class="btn btn-soft btn-sm" onclick="CM.copy('${esc(b)}')">Copy</button>`).join('')}<div class="modal-actions"><button class="btn btn-outline" onclick="CM.closeModal()">Close</button><a class="btn btn-primary" href="https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME" target="_blank" rel="noopener">Open LinkedIn →</a></div>`); }
  function linkedinPost(c,type,info,style){ const skills=[...c.vocab.slice(0,4),...c.deliverables.slice(0,3)]; if(style==='short')return `I earned the Capital Mastery ${info.name}. I completed required learning, assessments and applied work under an 80% mastery standard. #Finance #CapitalMastery`; if(style==='detailed')return `I'm excited to have earned the Capital Mastery ${info.name}.\n\nThe pathway covered ${skills.join(', ')} and required demonstrated mastery across learning, applied work${type==='career'?', and a graded Career Skills job simulation':''}. Capital Mastery requires 80% or higher on each required assessment rather than awarding a participation certificate.\n\nCredential: ${location.origin}${location.pathname}#/verify/${encodeURIComponent(info.id)}\n\n#Finance #FinancialCareers #CapitalMastery`; return `I'm excited to have earned the Capital Mastery ${info.name}. Through the pathway, I developed and applied skills in ${skills.slice(0,5).join(', ')}${type==='career'?' and completed a graded Career Skills job simulation':''}.\n\nCredential: ${location.origin}${location.pathname}#/verify/${encodeURIComponent(info.id)}\n\n#Finance #CapitalMastery`; }
  function postModal(id,type){ const c=careerById(id),info=credentialInfo(c,type); modal(`<h2>Create LinkedIn Post</h2><p>Choose a style. The post is generated from the skills and requirements attached to this credential.</p><div class="career-controls"><button class="filter-chip active" onclick="CM.postStyle(this,'${id}','${type}','professional')">Professional</button><button class="filter-chip" onclick="CM.postStyle(this,'${id}','${type}','detailed')">Detailed</button><button class="filter-chip" onclick="CM.postStyle(this,'${id}','${type}','short')">Short</button></div><textarea id="post-text" style="width:100%;min-height:230px">${esc(linkedinPost(c,type,info,'professional'))}</textarea><div class="modal-actions"><button class="btn btn-outline" onclick="CM.closeModal()">Close</button><button class="btn btn-primary" onclick="CM.copy(document.getElementById('post-text').value);window.open('https://www.linkedin.com/feed/','_blank')">Copy & Open LinkedIn →</button></div>`); }
  function postStyle(btn,id,type,style){ document.querySelectorAll('.career-controls .filter-chip').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const c=careerById(id),info=credentialInfo(c,type);document.getElementById('post-text').value=linkedinPost(c,type,info,style); }
  function downloadSocial(id,type){ const c=careerById(id),info=credentialInfo(c,type); const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const x=canvas.getContext('2d');x.fillStyle='#071a33';x.fillRect(0,0,1200,630);x.strokeStyle='#b98a43';x.lineWidth=4;x.strokeRect(28,28,1144,574);x.fillStyle='#d8b56b';x.font='700 26px Arial';x.fillText('CAPITAL MASTERY',70,85);x.fillStyle='#fff';x.font='54px Georgia';wrapCanvas(x,info.name,70,180,1060,62);x.fillStyle='#cbd5e2';x.font='25px Arial';x.fillText('Awarded to',70,382);x.fillStyle='#fff';x.font='46px Georgia';x.fillText(state.profile.name,70,440);x.fillStyle='#d8b56b';x.font='22px Arial';x.fillText(`Verified credential · ${formatDate(info.issuedAt)} · ${info.id}`,70,535);const a=document.createElement('a');a.download=`Capital-Mastery-${c.id}-${type}.png`;a.href=canvas.toDataURL('image/png');a.click(); }
  function wrapCanvas(ctx,text,x,y,maxWidth,lineHeight){ const words=text.split(' ');let line='';for(const w of words){const test=line+w+' ';if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=w+' ';y+=lineHeight;}else line=test;}ctx.fillText(line,x,y); }

  function passportPage(){
    render(`<section class="page-hero"><div class="container"><div class="eyebrow">MY LEARNING</div><h1>Capital Mastery Passport</h1><p>Your progress and performance are separate. Completion shows what you finished; Readiness shows how well you performed.</p></div></section><section class="section-tight"><div class="container"><div class="grid grid-2">${DATA.careers.map(c=>{const p=pctFor(c),r=readiness(c);return `<article class="card"><div class="career-footer" style="margin:0;padding:0;border:0"><div><div class="eyebrow">${esc(c.group)}</div><h3>${esc(c.title)}</h3><p>${esc(c.role)}</p></div><div style="text-align:right"><strong style="font-size:1.6rem;color:var(--navy)">${p}%</strong><div class="small muted">Readiness ${r||'—'}</div></div></div><div class="progress progress-light"><span style="width:${p}%"></span></div><a class="btn btn-soft btn-sm" href="#/career/${c.id}">${p?'Continue':'Start'} →</a></article>`}).join('')}</div></div></section>`,'learning');
  }

  function comparePage(query){ const a=careerById(query.get('a'))||DATA.careers[0], b=careerById(query.get('b'))||DATA.careers[1]; render(`<section class="page-hero"><div class="container"><div class="eyebrow">CAREER COMPARE</div><h1>See how the jobs really differ.</h1><p>Compare purpose, entry role, deliverables, technical work and career progression without pretending one path is universally “better.”</p></div></section><section class="section-tight"><div class="container"><form class="compare-selects" onsubmit="event.preventDefault();CM.compareGo()"><select id="compare-a">${DATA.careers.map(c=>`<option value="${c.id}" ${c.id===a.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select><span>vs</span><select id="compare-b">${DATA.careers.map(c=>`<option value="${c.id}" ${c.id===b.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select><button class="btn btn-primary">Compare</button></form>${compareTable(a,b)}</div></section>`,'careers'); }
  function compareTable(a,b){ const rows=[['Target role',a.role,b.role],['Purpose',a.purpose,b.purpose],['Who you work with',a.clients,b.clients],['Main deliverables',a.deliverables.slice(0,4).join(' · '),b.deliverables.slice(0,4).join(' · ')],['Technical focus',a.concepts.map(id=>concept(id)?.name||id).slice(0,5).join(' · '),b.concepts.map(id=>concept(id)?.name||id).slice(0,5).join(' · ')],['Career ladder',a.ladder.join(' → '),b.ladder.join(' → ')],['Final simulation',a.sim_title,b.sim_title]]; return `<table class="compare-table"><thead><tr><th>Dimension</th><th>${esc(a.title)}</th><th>${esc(b.title)}</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table>`; }
  function compareGo(){ nav(`compare?a=${document.getElementById('compare-a').value}&b=${document.getElementById('compare-b').value}`); }

  function aboutPage(){ render(`<section class="page-hero"><div class="container"><div class="eyebrow">ABOUT</div><h1>Why Capital Mastery exists.</h1><p>Finance careers are popular, but beginners often encounter either shallow overviews or long, expensive technical programs before they even understand the job.</p></div></section><section class="section"><div class="container"><div class="grid grid-3"><div class="card"><h3>Learn the career</h3><p>Understand what professionals actually do, how the team works and why the work matters.</p></div><div class="card"><h3>Practice the work</h3><p>Build the models, analyses, memos, research and judgment the role requires.</p></div><div class="card"><h3>Prove mastery</h3><p>Career Skills Certificates require 80%+ mastery through the practical simulation. Professional Readiness adds the advanced Role Lab, final assessment, complete evidence coverage and critical competency floors.</p></div></div></div></section><section class="section section-white"><div class="container about-founder"><img src="assets/founder-shriyan.jpg" alt="Shriyan Avadhanula"><div><div class="eyebrow">ABOUT THE FOUNDER</div><h2>Shriyan Avadhanula</h2><p class="kicker">Founder, Capital Mastery</p><p>Shriyan created Capital Mastery as a student-first way to understand finance careers without separating “learning about the job” from “learning how to do the job.” The platform combines concise teaching, public-data exercises, professional work products, graded simulations and transparent credential standards.</p><p>The goal is simple: a learner should enter an internship, student finance organization or future analyst training with a practical foundation that goes far beyond memorized interview definitions.</p><img class="signature-display" src="assets/founder-signature.png" alt="Shriyan Avadhanula signature"><p class="small muted">Capital Mastery is an independent educational project. Employer names referenced in research sections are public sources, not endorsements.</p></div></div></section><section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">THE CAPITAL MASTERY STANDARD</div><h2>Completion isn't enough.</h2></div></div><div class="grid grid-4"><div class="data-card"><div class="value">100%</div><div class="label">Required completion</div></div><div class="data-card"><div class="value">80%+</div><div class="label">Knowledge assessments</div></div><div class="data-card"><div class="value">80%+</div><div class="label">Practical simulation</div></div><div class="data-card"><div class="value">80%+</div><div class="label">Final examination</div></div></div></div></section>`,'about'); }

  function methodologyPage(){ render(`<section class="page-hero"><div class="container"><div class="eyebrow">RESEARCH METHODOLOGY</div><h1>Source → task → lesson → assessment → simulation.</h1><p>Capital Mastery is designed so every major learning objective can be traced to a documented professional need.</p></div></section><section class="section-tight"><div class="container"><div class="grid grid-5 pathway-overview">${['SOURCE','PROFESSIONAL TASK','LESSON','ASSESSMENT','SIMULATION'].map((x,i)=>`<div class="card"><div class="icon-box">${i+1}</div><h3>${x}</h3><p>${['Authoritative public evidence.','What a professional actually does.','What the learner must understand.','How mastery is checked.','Where the learner proves it in context.'][i]}</p></div>`).join('')}</div><div class="section-head" style="margin-top:60px"><div><div class="eyebrow">SOURCE LIBRARY</div><h2>Public evidence behind the product.</h2></div><p>Sources are reviewed for career tasks, public data, credential design and learning architecture.</p></div><div class="source-list">${DATA.researchSources.map(s=>`<div class="research-source"><strong>${esc(s.name)}</strong><span>${esc(s.use)}</span><a href="${esc(s.url)}" target="_blank" rel="noopener">Open ↗</a></div>`).join('')}</div></div></section>`,'about'); }

  function verifyPage(token){ const cred=state.credentials.find(x=>x.credentialId===decodeURIComponent(token)); const c=cred?careerById(cred.careerId):null; render(`<section class="section"><div class="container" style="max-width:850px">${cred&&c?`<div class="credential-summary"><span class="verify-status preview">QA PREVIEW RECORD</span><div class="eyebrow" style="margin-top:20px">CAPITAL MASTERY CREDENTIAL</div><h1>${esc(credentialInfo(c,cred.type).name)}</h1><p>Issued to <strong>${esc(state.profile.name)}</strong></p><div class="grid grid-2"><div class="card"><strong>Credential ID</strong><p>${esc(cred.credentialId)}</p></div><div class="card"><strong>Issued</strong><p>${formatDate(cred.issuedAt)}</p></div></div><div class="divider"></div><h3>Capital Mastery Standard</h3><p>100% required pathway completion · 80%+ every required knowledge assessment · 80%+ practical simulation for Career Certificates · 80%+ Professional Readiness Final for Career Certificates.</p><div class="feedback-box"><strong>Local QA preview:</strong> This browser-only preview is not an authoritative credential. Live accounts use the server-issued D1 verification record.</div></div>`:`<div class="card"><h1>Credential not found</h1><p>No local QA preview credential was found. Signed-in live credentials are verified from the authoritative D1 record.</p><a class="btn btn-primary" href="#/credentials">View Credentials</a></div>`}</div></section>`,'credentials'); }

  function loginPage(){ render(`<section class="section"><div class="container" style="max-width:650px"><div class="card"><div class="eyebrow">SECURE ACCOUNT</div><h1 class="serif" style="font-size:3rem;color:var(--navy)">Loading account access…</h1><p>Capital Mastery uses Firebase Authentication for account sign-in and the secure Capital Mastery API for authoritative assessment and credential actions.</p><div class="feedback-box"><strong>Account isolation is enforced.</strong> Official progress and credentials are tied to the authenticated Firebase identity and authoritative D1 records.</div></div></div></section>`); }

  function trustPage(){ render(`<section class="page-hero"><div class="container"><div class="eyebrow">TRUST CENTER</div><h1>How Capital Mastery protects learning and evidence.</h1><p>Security, privacy, assessment integrity and accessibility are product requirements—not certificate-page decoration.</p></div></section><section class="section-tight"><div class="container"><div class="grid grid-3"><article class="card"><div class="eyebrow">IDENTITY</div><h3>Firebase Authentication</h3><p>Accounts use Firebase identity. Official API requests require a verified Firebase ID token.</p></article><article class="card"><div class="eyebrow">AUTHORITATIVE BACKEND</div><h3>Worker + D1</h3><p>Official grading, prerequisites, enterprise tenancy, competency evidence and credential issuance are enforced by the Cloudflare Worker and stored in D1.</p></article><article class="card"><div class="eyebrow">TENANT ISOLATION</div><h3>Server-verified roles</h3><p>Organization membership and role checks happen on the server. A client-supplied organization ID never grants access by itself.</p></article><article class="card"><div class="eyebrow">ASSESSMENT INTEGRITY</div><h3>Keys stay server-side</h3><p>Official answer keys, grading rules and protected prerequisite logic are not sent to the learner browser.</p></article><article class="card"><div class="eyebrow">CREDENTIAL EVIDENCE</div><h3>Versioned and verifiable</h3><p>Standard 2.0 credentials can carry assessment, Role Lab, readiness and competency evidence while public verification excludes private account identifiers and answers.</p></article><article class="card"><div class="eyebrow">EMPLOYER CONTENT</div><h3>Recoverable by design</h3><p>Firm Layer content is versioned and can be hidden, archived or restored. Employer-facing permanent delete is intentionally unavailable.</p></article></div><section class="card" style="margin-top:20px"><div class="eyebrow">ACCESSIBILITY & RELIABILITY</div><h2>Designed toward WCAG 2.2 usability.</h2><p>Capital Mastery includes keyboard focus indicators, reduced-motion support, semantic form controls, responsive layouts and status messaging. Accessibility testing remains part of every release audit rather than a one-time claim of certification.</p><div class="grid grid-2" style="margin-top:18px"><div><h3>Data architecture</h3><p>Firestore learner-state sync is non-authoritative. D1 is authoritative for official assessments, enterprise evidence and credentials.</p></div><div><h3>Training data</h3><p>Role Lab companies, people and case data are synthetic unless a source is explicitly identified. Firm-specific content is kept separate from the standardized Capital Mastery credential layer.</p></div><div><h3>User data access</h3><p>Signed-in learners can export enterprise data through My Data. Exports intentionally omit secret assessment keys and hidden grading rules.</p></div><div><h3>Claims</h3><p>Capital Mastery is an independent educational platform. It does not claim employer endorsement, professional licensure, accreditation or regulatory-training status unless explicitly documented.</p></div></div></section></div></section>`,'about'); }

  function policyPage(kind){ const content={privacy:['Privacy','Capital Mastery uses Firebase Authentication for identity, Firestore for non-authoritative learner-state sync, and the Capital Mastery Cloudflare Worker + D1 database for authoritative assessments, enterprise assignments, competency evidence and credentials. The platform is designed to collect only data needed to provide learning, readiness and verification features. Signed-in users can export their enterprise data from My Data and can permanently delete their personal Capital Mastery data and Firebase account from Account settings. Sole active owners must transfer workspace ownership first so a shared employer tenant is never stranded.'],terms:['Terms','Capital Mastery is an educational and workforce-readiness platform. Users may not misrepresent test or preview records, interfere with assessment integrity, impersonate other users, or use employer workspaces without authorization. Employer workspace access is controlled by server-verified organization roles.'],disclaimer:['Educational Disclaimer','Capital Mastery provides education, synthetic professional simulations and readiness measurement. It does not provide investment, legal, tax or employment advice; it does not guarantee admission, employment, compensation, professional licensing or regulatory compliance.'],credential:['Credential Policy','Capital Mastery credentials represent completion and demonstrated mastery of the requirements attached to the specific credential version. Legacy Foundations, Applied Skills and Career Certificates remain valid under their original standards. Standard 2.0 adds stackable Essentials, Role Lab and Professional Readiness credentials with versioned evidence. Professional Readiness requires the baseline diagnostic, prerequisite credentials, the required Role Lab, the Professional Readiness Final, complete professional evidence coverage and critical competency floors.']}[kind]; render(`<section class="page-hero"><div class="container"><div class="eyebrow">POLICY</div><h1>${content[0]}</h1></div></section><section class="section-tight"><div class="container" style="max-width:850px"><div class="card"><p>${content[1]}</p><h3>Independent platform</h3><p>References to employers, universities, professional bodies or public agencies identify research sources only and do not imply affiliation, sponsorship or endorsement.</p><h3>Authoritative records</h3><p>Official assessment, enterprise-readiness and credential decisions are made server-side. Browser-edited state cannot issue an authoritative credential.</p><h3>Privacy-conscious verification</h3><p>Public credential verification is designed to show the credential and relevant evidence without exposing Firebase user IDs, account email addresses or assessment answers.</p></div></div></section>`,'about'); }

  function adminPage(){
    const preview=qaMode();
    render(`<section class="page-hero"><div class="container"><div class="eyebrow">ADMIN / QA</div><h1>Capital Mastery Release Lab</h1><p>Server-verified Admin / QA workspace. Preview controls stay isolated from authoritative learner progress, D1 credentials, and employer data unless a tool explicitly says otherwise.</p></div></section><section class="section-tight"><div class="container"><div class="admin-grid"><div class="admin-card"><h3>QA Preview Mode</h3><p>${preview?'Enabled':'Disabled'}</p><button class="btn btn-primary btn-sm" onclick="CM.toggleQa()">${preview?'Disable':'Enable'} QA Mode</button></div><div class="admin-card"><h3>Legacy Credential Compatibility Lab</h3><p>Preview the original Foundations, Applied Skills, and Career certificate surfaces without creating a live verified record. Standard 2.0 credentials are tested through the evidence-backed credential and verification flows.</p><div class="admin-actions"><a class="btn btn-soft btn-sm" href="#/certificate/investment-banking/foundations">Foundations</a><a class="btn btn-soft btn-sm" href="#/certificate/investment-banking/applied">Applied</a><a class="btn btn-gold btn-sm" href="#/certificate/investment-banking/career">Career</a></div></div><div class="admin-card"><h3>Boundary Tests</h3><p>Set IB demo scores to 79, 80 or 100 and verify pass/fail behavior.</p><div class="admin-actions"><button class="btn btn-soft btn-sm" onclick="CM.qaScores(79)">79%</button><button class="btn btn-soft btn-sm" onclick="CM.qaScores(80)">80%</button><button class="btn btn-soft btn-sm" onclick="CM.qaScores(100)">100%</button></div></div><div class="admin-card"><h3>Progress States</h3><p>Jump the flagship pathway to a testing state.</p><div class="admin-actions">${[0,20,40,60,80,100].map(p=>`<button class="btn btn-soft btn-sm" onclick="CM.qaProgress(${p})">${p}%</button>`).join('')}</div></div><div class="admin-card"><h3>Enterprise Demo/Test Lab</h3><p>Generate synthetic firms, cohorts, readiness states and manager signals without real users.</p><a class="btn btn-gold btn-sm" href="#/admin-demo">Open Demo/Test Lab →</a></div><div class="admin-card"><h3>Simulation Lab</h3><p>Open the local Admin QA version of Project Northstar without learner prerequisites. QA Preview Mode is enabled automatically and no authoritative D1 score or credential is created.</p><a class="btn btn-primary btn-sm" data-cm-admin-sim-preview="true" href="#/simulation/investment-banking">Open Admin Simulation Preview</a></div><div class="admin-card"><h3>Reset QA State</h3><p>Clear local progress and credentials. Firebase data is not involved.</p><button class="btn btn-danger btn-sm" onclick="CM.resetState()">Reset Local State</button></div></div><div class="section-head" style="margin-top:50px"><div><div class="eyebrow">CURRENT LOCAL STATE</div><h2>Debug snapshot</h2></div></div><pre class="admin-state">${esc(JSON.stringify(state,null,2))}</pre></div></section>`,'learning'); }

  function qaScores(score){ const c=careerById('investment-banking'),cs=getCareerState(c.id); cs.learningComplete=[1,2,3,4,5]; cs.completedParts=[1,2,3,4,5];[1,2,3,4].forEach(p=>cs.quizScores[p]=score);cs.simulationKnowledge=score;cs.simulationScore=score;cs.finalScore=score;state.credentials=state.credentials.filter(x=>x.careerId!==c.id); if(score>=80) issueAllEligible(c);saveState();toast(`IB QA scores set to ${score}%.`,score>=80?'good':'warn');renderRoute(); }
  function qaProgress(pct){ const c=careerById('investment-banking'),cs=getCareerState(c.id),n=Math.floor(pct/20);cs.learningComplete=[];cs.completedParts=[];cs.quizScores={};for(let p=1;p<=Math.min(n,4);p++){cs.learningComplete.push(p);cs.completedParts.push(p);cs.quizScores[p]=90;}if(n>=5){cs.learningComplete.push(5);cs.completedParts.push(5);cs.simulationKnowledge=90;cs.simulationScore=90;cs.finalScore=90;}else{cs.simulationKnowledge=null;cs.simulationScore=null;cs.finalScore=null;}state.credentials=state.credentials.filter(x=>x.careerId!==c.id);issueAllEligible(c);saveState();toast(`IB QA progress set to ${pct}%.`,'good');renderRoute(); }
  function refreshLocalState(){ stateSourceKey=activeStateKey(); state=stateSourceKey===QA_STATE_KEY?loadQaState():loadState(); }
  function resetState(){ if(confirm('Reset the isolated Capital Mastery QA preview state? Learner progress will not be changed.')){localStorage.removeItem(QA_STATE_KEY);stateSourceKey=QA_STATE_KEY;state=loadQaState();saveState();renderRoute();} }

  let modalReturnFocus=null;
  function mobileMenu(){ modal(`<h2>Menu</h2><div class="grid"><a class="btn btn-outline" href="#/" onclick="CM.closeModal()">Home</a><a class="btn btn-outline" href="#/careers" onclick="CM.closeModal()">Careers</a><a class="btn btn-outline" href="#/credentials" onclick="CM.closeModal()">Credentials</a><a class="btn btn-outline" href="#/academy" onclick="CM.closeModal()">Academies</a><a class="btn btn-outline" href="#/passport" onclick="CM.closeModal()">My Learning</a><a class="btn btn-outline" href="#/about" onclick="CM.closeModal()">About</a></div>`); }
  function modal(html){
    closeModal(false);
    modalReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const d=document.createElement('div');
    d.className='modal-backdrop';
    d.id='cm-modal';
    d.innerHTML=`<div class="modal" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    const panel=d.firstElementChild;
    const heading=panel?.querySelector('h1,h2,h3');
    if(heading){heading.id=heading.id||'cm-modal-title';panel.setAttribute('aria-labelledby',heading.id);}
    else panel?.setAttribute('aria-label','Capital Mastery dialog');
    d.addEventListener('click',e=>{if(e.target===d)closeModal()});
    d.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeModal();return;}
      if(e.key!=='Tab'||!panel)return;
      const focusable=[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>!x.hidden&&x.getAttribute('aria-hidden')!=='true');
      if(!focusable.length){e.preventDefault();panel.focus();return;}
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
    document.body.appendChild(d);
    (panel?.querySelector('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||panel)?.focus();
  }
  function closeModal(restoreFocus=true){
    const modal=document.getElementById('cm-modal');
    if(!modal)return;
    modal.remove();
    if(restoreFocus&&modalReturnFocus?.isConnected)modalReturnFocus.focus();
    modalReturnFocus=null;
  }
  function toast(msg,type=''){ const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200); }
  function copy(text){ navigator.clipboard?.writeText(text).then(()=>toast('Copied.','good')).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied.','good');}); }
  function formatDate(d){ return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(d)); }
  function formatMonthYear(d){ return new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(new Date(d)); }
  function toggleQa(){setQa(!qaMode());renderRoute();}
  function bindGlobal(){ document.querySelectorAll('textarea[data-applied]').forEach(t=>t.addEventListener('input',()=>{const cs=getCareerState(t.dataset.career);cs.applied[t.dataset.applied]=t.value;saveState();}));document.querySelectorAll('textarea[data-concept-practice]').forEach(t=>t.addEventListener('input',()=>{const cs=getCareerState(t.dataset.conceptCareer);cs.conceptPractice=cs.conceptPractice||{};cs.conceptPractice[t.dataset.conceptPractice]=t.value;saveState();})); }

  function renderRoute(){
    ensureActiveState();
    const {parts,query}=routeParts(); const [root,a,b]=parts; document.title='Capital Mastery | 80+ Free Finance Credentials | Made by Shriyan Avadhanula';
    try{
      if(!root) return home();
      if(root==='careers') return careersPage(query);
      if(root==='learner-guide'&&window.CM_LEARNER_GUIDE){render(window.CM_LEARNER_GUIDE.markup(DATA),'learning');window.CM_LEARNER_GUIDE.bind(DATA);return;}
      if(root==='career'){const c=careerById(a);return c?careerPage(c):home();}
      if(root==='learn'){const c=careerById(a);return c?learnPage(c,Number(b||1)):home();}
      if(root==='quiz'){const c=careerById(a);return c?quizPage(c,Number(b||1),false):home();}
      if(root==='admin-preview'&&a==='simulation'){
        const c=careerById(b);
        // admin-route-guard.js owns authorization for this namespace. Do not render
        // a learner fallback while secure role verification is pending.
        if(!qaMode()) return;
        return c?simulationPage(c,true):adminPage();
      }
      if(root==='official-simulation'){
        const c=careerById(a);
        const adminQaPreview=window.CM_AUTH?.ready===true&&window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode();
        if(adminQaPreview){
          if(!c) return home();
          location.replace(`#/admin-preview/simulation/${encodeURIComponent(c.id)}`);
          return;
        }
        // The secure assessment router owns this route for normal learners. Do not
        // render Home first; that created a visible Home -> loading -> simulation flicker.
        // A direct deep link still needs the shared header/main/footer shell because
        // the secure router deliberately paints into #app main#main.
        render('', 'learning');
        return;
      }
      if(root==='simulation'){const c=careerById(a);return c?simulationPage(c):home();}
      if(root==='final'){const c=careerById(a);return c?finalPage(c):home();}
      if(root==='achievement'){const c=careerById(a);return c?achievementPage(c,b||'career'):credentialsPage();}
      if(root==='credentials')return credentialsPage();
      if(root==='credential'){const c=careerById(a);return c?credentialDetail(c,b||'career'):credentialsPage();}
      if(root==='certificate'){const c=careerById(a);return c?certificatePage(c,b||'career'):credentialsPage();}
      if(root==='verify')return verifyPage(a||'');
      if(root==='passport')return passportPage();
      if(root==='compare')return comparePage(query);
      if(root==='about')return aboutPage();
      if(root==='methodology')return methodologyPage();
      if(root==='trust')return trustPage();
      if(root==='login')return loginPage();
      if(root==='privacy')return policyPage('privacy');
      if(root==='terms')return policyPage('terms');
      if(root==='disclaimer')return policyPage('disclaimer');
      if(root==='credential-policy')return policyPage('credential');
      if(root==='admin-preview')return adminPage();
      home();
    }catch(err){console.error(err);render(`<section class="section"><div class="container"><div class="card"><h1>Something went wrong.</h1><p>${esc(err.message)}</p><a class="btn btn-primary" href="#/">Return home</a></div></div></section>`);}
  }

  window.CM={mobileMenu,markPart,toggleQa,qaScores,qaProgress,refreshLocalState,resetState,copy,closeModal,linkedinFields,postModal,postStyle,downloadSocial,downloadCertificateImage,compareGo};
  window.addEventListener('hashchange',renderRoute);
  // Account isolation swaps the shared localStorage state synchronously before
  // this listener runs. Refresh app.js's closure immediately as well, so a
  // same-tab sign-out/sign-in can never render or save the prior account's
  // profile/progress while Firestore hydration is still settling.
  document.addEventListener?.('cm-auth-changed',()=>{
    refreshLocalState();
    if(window.CM_AUTH?.ready===true) setTimeout(()=>{refreshLocalState();renderRoute();},0);
  });
  renderRoute();
})();
