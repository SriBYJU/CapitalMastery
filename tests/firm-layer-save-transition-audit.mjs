import fs from 'node:fs';
const s=fs.readFileSync('enterprise-v2.js','utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(s.includes("status.textContent='Saved. Refreshing Firm Layer…';await curriculum(orgId,assignment.id)"),'Firm Layer create must explicitly rerender after success');
ok(s.includes("st.textContent='Version saved. Refreshing Firm Layer…';await curriculum(orgId,assignment.id)"),'Firm Layer edit must explicitly rerender after success');
const createOld="location.hash=`#/employer/${orgId}/curriculum?assignment=${encodeURIComponent(assignment.id)}`;}catch(err){status.textContent=err.message";
const editOld="location.hash=`#/employer/${orgId}/curriculum?assignment=${encodeURIComponent(assignment.id)}`;}catch(err){st.textContent=err.message";
ok(!s.includes(createOld)&&!s.includes(editOld),'same-hash save transition must not return');
console.log('FIRM LAYER SAVE TRANSITION AUDIT PASS: successful writes rerender immediately without same-hash hangs');
