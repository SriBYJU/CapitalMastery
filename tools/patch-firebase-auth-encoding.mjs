import fs from 'node:fs';

const path='firebase-auth.js';
let src=fs.readFileSync(path,'utf8');
const replacements=[
  ['Opening Google sign-inâ¦','Opening Google sign-in…'],
  ['Signing inâ¦','Signing in…'],
  ['Creating your accountâ¦','Creating your account…'],
  ['Connecting securelyâ¦','Connecting securely…'],
  ['Verified â','Verified ✓'],
  ['My Learning â','My Learning →'],
  ['Admin â','Admin →'],
  ['Sign in â','Sign in →'],
  ['Checking administrator accessâ¦','Checking administrator access…']
];
for(const [before,after] of replacements){
  const first=src.indexOf(before);
  if(first<0) throw new Error(`Missing encoding target: ${before}`);
  if(src.indexOf(before,first+before.length)>=0) throw new Error(`Ambiguous encoding target: ${before}`);
  src=src.slice(0,first)+after+src.slice(first+before.length);
}
if(/[âÃÂ�]/u.test(src)) throw new Error('Mojibake sentinel remains in firebase-auth.js after guarded repair');
fs.writeFileSync(path,src);
console.log(`FIREBASE AUTH ENCODING PATCH PASS: ${replacements.length} guarded replacements`);
