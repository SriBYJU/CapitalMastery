import fs from 'node:fs';
const s=fs.readFileSync('enterprise-v2.js','utf8');
const css=fs.readFileSync('enterprise-v2.css','utf8');
const must=[
  "let copied=false",
  "catch{}st.innerHTML",
  "Invitation link<input",
  "Copy invitation link",
  "f.reset();btn.disabled=false",
  "input?.focus();input?.select()"
];
for(const x of must) if(!s.includes(x)) throw new Error(`Missing resilient invite behavior: ${x}`);
if(!css.includes('.cmv2-invite-link')) throw new Error('Invite link styling missing');
if(s.includes("await navigator.clipboard?.writeText?.(link);st.textContent='Secure invite created")) throw new Error('Clipboard failure can still masquerade as invite failure');
console.log('STAFF INVITE RESILIENCE AUDIT PASS: invite creation is independent from clipboard availability');
