(() => {
  'use strict';
  const IB='investment-banking';
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route=()=>String(location.hash||'#/').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);

  const curriculum=[
    {n:1,stage:'Foundations',title:'Investment Banking Desk & Deal Lifecycle',tool:'Deal team map · buyer/seller process map',output:'Explain who does what, how a mandate becomes a transaction, and where the analyst fits.'},
    {n:2,stage:'Foundations',title:'Accounting & Financial Statements',tool:'Income statement · balance sheet · cash flow statement',output:'Spread historicals, connect the statements, calculate EBITDA/FCF and identify accounting quality issues.'},
    {n:3,stage:'Technical Core',title:'Financial Statement Analysis & Forecast Drivers',tool:'Operating model · KPI bridge',output:'Normalize results, identify business drivers and build a defendable forecast.'},
    {n:4,stage:'Technical Core',title:'Excel for Investment Banking',tool:'Interactive workbook sandbox',output:'Navigate, link, audit, format and structure models using analyst-style Excel habits.'},
    {n:5,stage:'Technical Core',title:'Three-Statement Modeling',tool:'Integrated forecast model',output:'Build a connected forecast and understand how assumptions flow through earnings, cash and the balance sheet.'},
    {n:6,stage:'Valuation',title:'Trading Comparables & Precedent Transactions',tool:'Peer set · transaction table · valuation ranges',output:'Research peers/deals, normalize metrics, calculate multiples and defend the selected range.'},
    {n:7,stage:'Valuation',title:'DCF Valuation & Sensitivity',tool:'DCF model · WACC / terminal-growth matrix',output:'Forecast cash flow, calculate terminal value, bridge EV to equity and interpret sensitivities.'},
    {n:8,stage:'M&A Execution',title:'M&A Mechanics, Sources & Uses & Merger Modeling',tool:'Sources & uses · purchase accounting · accretion/dilution',output:'Translate an offer into transaction economics and explain what changes the buyer impact.'},
    {n:9,stage:'M&A Execution',title:'Research, CIMs, Data Rooms & Due Diligence',tool:'SEC filings · source log · diligence tracker',output:'Find authoritative evidence, organize diligence questions and identify decision-critical gaps.'},
    {n:10,stage:'Client Work',title:'Pitchbooks, PowerPoint & Client-Ready Communication',tool:'Valuation page · transaction slide · executive headline',output:'Turn analysis into concise, consistent and review-ready client materials.'},
    {n:11,stage:'Execution Quality',title:'Model QA, Version Control & Associate Review',tool:'Model checks · comments · version log',output:'Catch formula/source/formatting errors, respond to comments and resubmit without losing control of the file.'},
    {n:12,stage:'Capstone',title:'Project Northstar — M&A Analyst Readiness',tool:'Analyst desktop · inbox · data room · model tasks · manager comments',output:'Combine the entire workflow under changing information and senior review.'}
  ];

  function roadmapHtml(){
    const groups=[...new Set(curriculum.map(x=>x.stage))];
    return `<section class="lesson-section cm-ib-roadmap" aria-labelledby="cm-ib-roadmap-title">
      <div class="eyebrow">YOUR INVESTMENT BANKING ANALYST CURRICULUM</div>
      <h2 id="cm-ib-roadmap-title">From zero context to analyst-ready work.</h2>
      <p>This pathway is structured like a pre-onboarding analyst bootcamp, not a glossary. You will learn the concept, see the work product, use the tool, practice the task, receive feedback, and then prove mastery.</p>
      <div class="cm-ib-roadmap-summary"><div><strong>12</strong><span>training modules</span></div><div><strong>8+</strong><span>interactive tool labs</span></div><div><strong>5</strong><span>credential stages</span></div><div><strong>1</strong><span>full M&A capstone</span></div></div>
      ${groups.map(g=>`<div class="cm-ib-roadmap-group"><h3>${esc(g)}</h3><div class="cm-ib-roadmap-grid">${curriculum.filter(x=>x.stage===g).map(x=>`<article><span>${String(x.n).padStart(2,'0')}</span><div><h4>${esc(x.title)}</h4><p><b>Tool / work product:</b> ${esc(x.tool)}</p><p><b>You will be able to:</b> ${esc(x.output)}</p></div></article>`).join('')}</div></div>`).join('')}
      <div class="cm-ib-readiness-promise"><strong>What “ready” means here:</strong> not memorizing definitions. It means you can take a realistic analyst assignment, identify the inputs, build or repair the work product, explain your assumptions, react to new information, and survive a review cycle.</div>
    </section>`;
  }

  const practices={
    'financial-statements':{
      title:'Desk Check — Build the operating-to-cash bridge',
      context:`A target reports Revenue of $500m, EBITDA of $90m, D&A of $20m, taxes of 25%, capex of $24m and a $7m increase in NWC. Calculate EBIT, NOPAT and unlevered FCF.`,
      fields:[['ebit','EBIT ($m)'],['nopat','NOPAT ($m)'],['ufcf','Unlevered FCF ($m)']],
      check:v=>({ok:near(v.ebit,70)&&near(v.nopat,52.5)&&near(v.ufcf,41.5),answer:'EBIT = 70; NOPAT = 52.5; UFCF = 41.5',why:'EBIT = EBITDA − D&A. NOPAT = EBIT × (1 − tax). UFCF = NOPAT + D&A − capex − ΔNWC.'})
    },
    'accounting-quality':{
      title:'Desk Check — Normalize EBITDA',
      context:`Reported EBITDA is $84m. It includes a one-time $6m restructuring charge and $3m of recurring annual stock compensation. Your team’s normalization policy adds back genuine one-time restructuring but keeps recurring stock comp. What adjusted EBITDA should you use?`,
      fields:[['answer','Adjusted EBITDA ($m)']],
      check:v=>({ok:near(v.answer,90),answer:'$90m',why:'Add back the one-time $6m restructuring charge. Do not automatically add back a recurring operating expense just because management labels it non-GAAP.'})
    },
    'comps':{
      title:'Desk Check — Build the peer multiple table',
      context:`Calculate EV / NTM EBITDA for each peer and the median selected multiple.`,
      table:[['Peer','Enterprise Value ($m)','NTM EBITDA ($m)'],['Alpha','960','120'],['Beta','1,350','150'],['Gamma','1,100','100']],
      fields:[['alpha','Alpha (x)'],['beta','Beta (x)'],['gamma','Gamma (x)'],['median','Median (x)']],
      check:v=>({ok:near(v.alpha,8)&&near(v.beta,9)&&near(v.gamma,11)&&near(v.median,9),answer:'8.0x, 9.0x, 11.0x; median = 9.0x',why:'EV / EBITDA = Enterprise Value ÷ EBITDA. A peer table is only the start—you still need to defend comparability and normalize inconsistent metrics.'})
    },
    'precedents':{
      title:'Desk Check — Read precedent transactions',
      context:`A company with an unaffected share price of $20 is acquired for $26 per share. Its LTM EBITDA is $80m, diluted shares are 40m and net debt is $120m. Calculate the offer premium and transaction EV / EBITDA.`,
      fields:[['premium','Offer premium (%)'],['multiple','Transaction EV / EBITDA (x)']],
      check:v=>({ok:near(v.premium,30)&&near(v.multiple,14.5),answer:'30.0% premium; 14.5x EV / EBITDA',why:'Equity purchase price = 26 × 40 = $1,040m. Transaction EV = 1,040 + 120 = $1,160m. 1,160 ÷ 80 = 14.5x.'})
    },
    'dcf':{
      title:'Desk Check — Terminal value sanity check',
      context:`Year-5 FCF is $100m, WACC is 9% and terminal growth is 3%. Calculate Gordon Growth terminal value at the end of Year 5.`,
      fields:[['tv','Terminal value ($m)']],
      check:v=>({ok:near(v.tv,1716.67,1),answer:'≈ $1,716.7m',why:'TV = FCF₅ × (1 + g) ÷ (WACC − g) = 100 × 1.03 ÷ 0.06. Then you would discount that terminal value back to present value.'})
    },
    'ma':{
      title:'Desk Check — Sources & Uses',
      context:`Buyer pays $900m for target equity, refinances $150m of target debt, pays $25m fees, uses $300m cash and raises $400m new debt. How much new equity financing is required to balance Sources & Uses?`,
      fields:[['equity','New equity financing ($m)']],
      check:v=>({ok:near(v.equity,375),answer:'$375m',why:'Uses = 900 + 150 + 25 = 1,075. Known sources = 300 + 400 = 700. Remaining equity source = 375.'})
    },
    'accretion':{
      title:'Desk Check — Accretion / dilution',
      context:`Buyer standalone EPS is $4.00. Pro forma EPS after the transaction is $4.24. Calculate EPS accretion / dilution.`,
      fields:[['acc','Accretion / dilution (%)']],
      check:v=>({ok:near(v.acc,6),answer:'+6.0% accretive',why:'(4.24 ÷ 4.00) − 1 = 6.0%. Then investigate *why*—financing, synergies, purchase accounting and share issuance all matter.'})
    },
    'pitch':{
      title:'Desk Check — Write the slide takeaway',
      context:`Trading comps imply $22–$27/share, DCF implies $25–$31/share, and the proposed offer is $26/share. Write a one-sentence client-ready headline that states the takeaway instead of labeling the page “Valuation.”`,
      text:true,
      check:v=>{const s=String(v.answer||'').toLowerCase(); const ok=s.length>35 && (s.includes('26')||s.includes('offer')) && (s.includes('dcf')||s.includes('trading')||s.includes('range')); return {ok,answer:'Example: “$26 offer sits above the lower end of trading comps and within the DCF range, supporting a defensible but not obviously discounted price.”',why:'A strong banking slide headline communicates the decision-useful takeaway and ties it to the evidence on the page.'}}
    }
  };
  const near=(a,b,t=.15)=>Math.abs(Number(a)-Number(b))<=t;

  function tableHtml(rows){return `<table class="cm-ib-practice-table"><thead><tr>${rows[0].map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
  function practiceHtml(id,p){return `<section class="cm-ib-practice" data-ib-practice="${esc(id)}"><div class="cm-ib-practice-head"><div><span>ANALYST PRACTICE · BEFORE THE QUIZ</span><h4>${esc(p.title)}</h4></div><b>Do the work</b></div><p>${esc(p.context)}</p>${p.table?tableHtml(p.table):''}<div class="cm-ib-practice-fields">${p.text?`<label><span>Your headline</span><textarea name="answer" rows="3" placeholder="Write the one-sentence takeaway..."></textarea></label>`:p.fields.map(([k,l])=>`<label><span>${esc(l)}</span><input type="number" step="any" name="${esc(k)}"></label>`).join('')}</div><button class="btn btn-soft" type="button" data-ib-check>Check my work</button><div class="cm-ib-practice-feedback" aria-live="polite"></div></section>`}

  function injectRoadmap(){const [r,c,p]=route();if(r!=='learn'||c!==IB||p!=='1')return;const target=document.querySelector('.lesson-content');if(!target||target.querySelector('.cm-ib-roadmap'))return;const first=target.querySelector('.lesson-section');const w=document.createElement('div');w.innerHTML=roadmapHtml();target.insertBefore(w.firstElementChild,first||target.querySelector('.lesson-actions'));}
  function injectPractices(){const [r,c,p]=route();if(r!=='learn'||c!==IB||p!=='2')return;const blocks=[...document.querySelectorAll('.concept-block')];if(!blocks.length)return;const ids=(window.CM_DATA?.careers||window.CM?.DATA?.careers||window.CM_DATA)?.find?.(x=>x.id===IB)?.concepts||['financial-statements','accounting-quality','comps','precedents','dcf','ma','accretion','pitch'];blocks.forEach((block,i)=>{if(block.nextElementSibling?.classList?.contains('cm-ib-practice'))return;const id=ids[i]||Object.keys(practices)[i];const p=practices[id];if(!p)return;block.insertAdjacentHTML('afterend',practiceHtml(id,p));});bindPractices();}
  function bindPractices(){document.querySelectorAll('.cm-ib-practice:not([data-bound])').forEach(box=>{box.dataset.bound='1';box.querySelector('[data-ib-check]')?.addEventListener('click',()=>{const p=practices[box.dataset.ibPractice];const vals={};box.querySelectorAll('input,textarea').forEach(x=>vals[x.name]=x.value);const result=p.check(vals);const out=box.querySelector('.cm-ib-practice-feedback');out.className=`cm-ib-practice-feedback ${result.ok?'good':'revise'}`;out.innerHTML=`<strong>${result.ok?'✓ Desk check passed':'Not yet — revise it.'}</strong><p>${esc(result.why)}</p>${result.ok?'':`<details><summary>Show worked answer</summary><p>${esc(result.answer)}</p></details>`}`;});});}
  function run(){requestAnimationFrame(()=>{injectRoadmap();injectPractices();});}
  window.addEventListener('hashchange',run);document.addEventListener('cm-auth-changed',run);const app=document.getElementById('app');if(app)new MutationObserver(run).observe(app,{childList:true,subtree:true});run();
})();
