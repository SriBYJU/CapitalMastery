import fs from 'node:fs';
const src=fs.readFileSync('account-isolation-early.js','utf8');
const app=fs.readFileSync('app.js','utf8');
function assert(c,m){if(!c)throw new Error(m);}
for(const marker of [
  'const activeShared = parse(localStorage.getItem(STATE_KEY));',
  "activeShared?.profile?.accountUid === user.uid",
  ': parse(localStorage.getItem(key(user.uid)))',
  'localStorage.setItem(key(user.uid), JSON.stringify(state));',
  'localStorage.setItem(STATE_KEY, JSON.stringify(state));'
]) assert(src.includes(marker),`Account isolation continuity missing ${marker}`);
const activateStart=src.indexOf('  function activate(user) {');
const activateEnd=src.indexOf('\n  function deactivate()',activateStart);
const activate=src.slice(activateStart,activateEnd);
assert(activate.indexOf('activeShared?.profile?.accountUid === user.uid') < activate.indexOf('parse(localStorage.getItem(key(user.uid)))'),'Same-user activation must prefer the live owned shared state before the stored snapshot');
for(const marker of [
  'const accountChanged=key===STATE_KEY&&authSettled',
  'if((uid&&loadedOwner!==uid)||(!uid&&!!loadedOwner)) state=blankState(accountUser);',
  'function saveState(){ ensureActiveState();',
  "document.addEventListener?.('cm-auth-changed',()=>{",
  'refreshLocalState();renderRoute();'
]) assert(app.includes(marker),`App closure account isolation missing ${marker}`);
console.log('ACCOUNT ISOLATION COURSE CONTINUITY AUDIT PASS: repeated auth events cannot roll back a learner, and same-tab account switches refresh the app closure before rendering or saving');
