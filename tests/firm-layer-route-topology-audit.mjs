import fs from 'node:fs';
const s=fs.readFileSync('enterprise-v2.js','utf8');
function ok(v,m){if(!v)throw new Error(m)}
for(const fn of ['firmLayerRouteContext','firmLayerAddPage','firmLayerEditPage','firmLayerHistoryPage']) ok(s.includes(`function ${fn}`),`Missing ${fn}`);
ok((s.match(/href=\"#\/employer\/\$\{encodeURIComponent\(orgId\)\}\/curriculum\?assignment=\$\{encodeURIComponent\(assignment\.id\)\}\"/g)||[]).length>=3,'Add/edit/history views must expose a real parent Curriculum back link');
ok(s.includes("contentId){") && s.includes("item=(d.content||[]).find(x=>x.id===contentId)||null"),'Deep-link content routes must resolve the item inside the scoped assignment');
ok(s.includes("if(!item) throw new Error('Firm Layer item not found in this program.')"),'Cross-assignment content ids must fail closed');
console.log('FIRM LAYER ROUTE TOPOLOGY AUDIT PASS: deep links, scoped item resolution and parent navigation are explicit');
