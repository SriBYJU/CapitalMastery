import fs from 'node:fs'; import vm from 'node:vm';
const code=fs.readFileSync('data.js','utf8'); const ctx={window:{}}; vm.createContext(ctx); vm.runInContext(code,ctx); const cs=ctx.window.CM_DATA.careers;
function get(id){return cs.find(x=>x.id===id)} function ok(v,m){if(!v)throw new Error(m)}
const required={
 'private-equity':['cfainstitute.org/programs/private-equity-certificate'],
 'venture-capital':['insightpartners.com/Summer-Analyst-Program'],
 'asset-management':['jpmorganchase.com/careers/explore-opportunities/programs/asset-management-summer-analyst'],
 'hedge-funds':['point72.com/point72-academy'],
 'sales-trading':['jpmorganchase.com/careers/explore-opportunities/programs/markets-fulltime-analyst'],
 'private-credit':['apollo.com/institutional/strategies/asset-management/credit'],
 'corporate-banking':['jpmorganchase.com/careers/explore-opportunities/programs/csi-fulltime'],
 'corporate-development':['amazon.jobs/en/jobs/10412045'],
 'wealth-management':['jpmorganchase.com/careers/explore-opportunities/programs/wealth-management-fulltime-analyst'],
 'risk-management':['jpmorganchase.com/careers/explore-opportunities/programs/risk-fulltime-analyst'],
 'real-estate-finance':['careers.cbre.com/en_US/careers/JobDetail/Financial-Analyst-FCG/265149']
};
for(const [id,needles] of Object.entries(required)){const c=get(id);ok(c,'missing '+id);ok((c.sources||[]).length>=6,'source depth too thin for '+id);const urls=(c.sources||[]).map(x=>x.url).join('\n');for(const n of needles)ok(urls.includes(n),'current role source missing for '+id+': '+n)}
ok(fs.existsSync('docs/curriculum-accuracy-audit-2026-08-29.md'),'dated curriculum accuracy audit missing');
console.log('CURRICULUM SOURCE DEPTH AUDIT PASS: role-specific current/professional benchmarks strengthened across previously thin pathways');
