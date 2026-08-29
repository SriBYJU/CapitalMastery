import fs from 'node:fs';
const s=fs.readFileSync('enterprise-v2.js','utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(s.includes("/curriculum/add?assignment=${encodeURIComponent(chosen.id)}"),'Add action must use a distinct route');
ok(s.includes("/curriculum/content/${encodeURIComponent(b.dataset.contentEdit)}/edit?assignment=${encodeURIComponent(chosen.id)}"),'Edit action must use a distinct route');
ok(s.includes("/curriculum/content/${encodeURIComponent(b.dataset.contentHistory)}/history?assignment=${encodeURIComponent(chosen.id)}"),'History action must use a distinct route');
ok(s.includes("b==='curriculum' && c==='add'"),'Router must handle Firm Layer add route');
ok(s.includes("e==='edit'"),'Router must handle Firm Layer edit route');
ok(s.includes("e==='history'"),'Router must handle Firm Layer history route');
ok(s.includes("status.textContent='Saved. Returning to Curriculum…';location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}`"),'Create save must navigate back to parent curriculum route');
ok(s.includes("st.textContent='Version saved. Returning to Curriculum…';location.hash=`#/employer/${encodeURIComponent(orgId)}/curriculum?assignment=${encodeURIComponent(assignment.id)}`"),'Edit save must navigate back to parent curriculum route');
ok(!s.includes("status.textContent='Saved. Refreshing Firm Layer…';await curriculum(orgId,assignment.id)"),'In-place create rerender workaround must not return');
ok(!s.includes("st.textContent='Version saved. Refreshing Firm Layer…';await curriculum(orgId,assignment.id)"),'In-place edit rerender workaround must not return');
ok(s.includes("if(manage && !caps.manageContent) throw new Error('Firm Layer editing is not part of your workspace role.')"),'Deep-linked edit routes must enforce manage-content capability');
console.log('FIRM LAYER ROUTE TRANSITION AUDIT PASS: add/edit/history have real routes, deep-link guards and deterministic parent navigation');
