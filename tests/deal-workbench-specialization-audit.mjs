import fs from 'node:fs';
const js=fs.readFileSync('career-professional-visuals.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const index=fs.readFileSync('index.html','utf8');
function ok(v,m){if(!v)throw new Error(m);}
for(const marker of [
  "'private-equity':{surface:'privateequity'","'venture-capital':{surface:'venture'","'corporate-development':{surface:'corpdev'",
  'LBO / Investment Committee Workbench','SPONSOR UNDERWRITING','LBO Underwriting / Returns Bridge','MOIC / IRR','Investment Committee recommendation',
  'Market / Cap Table / Cohort Workspace','VENTURE DILIGENCE','Venture Investment Workpaper','Bottom-up TAM','New-investor ownership','Partner recommendation',
  'CORPORATE DEVELOPMENT DEAL ROOM','Target / Valuation / Synergy / Integration','Corporate Development Deal Case','Risk-adjusted synergy','One-time integration cost','Executive recommendation'
]) ok(js.includes(marker),'missing role-native deal workbench marker: '+marker);
for(const marker of ['.cm-deal-workstation','.cm-deal-kpis','.cm-deal-practice-grid','.cm-applied-privateequity','.cm-applied-venture','.cm-applied-corpdev']) ok(css.includes(marker),'missing deal-workbench styling: '+marker);
ok(!/private-equity':\{surface:'spreadsheet'/.test(js),'PE must not regress to generic spreadsheet surface');
ok(!/venture-capital':\{surface:'spreadsheet'/.test(js),'VC must not regress to generic spreadsheet surface');
ok(!/corporate-development':\{surface:'spreadsheet'/.test(js),'Corp Dev must not regress to generic spreadsheet surface');
ok(index.includes('career-professional-visuals.js?v=20260829-bigfirm3')&&index.includes('styles.css?v=20260829-bigfirm3'),'deal-workbench release assets must be cache-busted');
ok(index.includes('data.js?v=20260829-bigfirm3'),'curriculum data source update must be cache-busted');
console.log('DEAL WORKBENCH SPECIALIZATION AUDIT PASS: PE, VC and Corp Dev have role-native guided + independent work surfaces');
