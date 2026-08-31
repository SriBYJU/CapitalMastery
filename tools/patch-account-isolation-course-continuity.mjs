import fs from 'node:fs';

const FILE='account-isolation-early.js';
const text=fs.readFileSync(FILE,'utf8');
const before=`    let state = parse(localStorage.getItem(key(user.uid)));\n    if (!state || state.profile?.accountUid !== user.uid) {\n      state = !previousUid ? safeLegacyStateFor(user) : null;\n    }\n    if (!state) state = blank(user);`;
const after=`    // A repeated auth-ready/backend-verification event for the SAME Firebase user\n    // must never roll current course progress back to an older per-user snapshot.\n    // Prefer the active shared state when it is already owned by this UID; use the\n    // stored per-user snapshot only when activating/switching into the account.\n    const activeShared = parse(localStorage.getItem(STATE_KEY));\n    let state = activeShared?.profile?.accountUid === user.uid\n      ? activeShared\n      : parse(localStorage.getItem(key(user.uid)));\n    if (!state || state.profile?.accountUid !== user.uid) {\n      state = !previousUid ? safeLegacyStateFor(user) : null;\n    }\n    if (!state) state = blank(user);`;
if(text.includes(after)){
  console.log('ACCOUNT ISOLATION COURSE CONTINUITY PATCH ALREADY APPLIED');
  process.exit(0);
}
if(!text.includes(before)) throw new Error('Missing account-isolation activation anchor');
const next=text.replace(before,after);
fs.writeFileSync(FILE,next);
console.log('ACCOUNT ISOLATION COURSE CONTINUITY PATCH APPLIED: repeated same-user auth events preserve the current owned progress state instead of restoring a stale snapshot');
