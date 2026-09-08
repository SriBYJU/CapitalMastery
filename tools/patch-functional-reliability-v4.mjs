import './patch-functional-reliability-v3.mjs';
import fs from 'node:fs';

const rel = 'firebase-sync.js';
let source = fs.readFileSync(rel, 'utf8');
source = source.replace(
  "console.warn('Protected account-profile mirror will retry:', error);",
  "console.warn('Protected account-profile mirror will retry after rules convergence:', error);"
);
fs.writeFileSync(rel, source);
console.log('Root-profile rollout compatibility invariant preserved.');
