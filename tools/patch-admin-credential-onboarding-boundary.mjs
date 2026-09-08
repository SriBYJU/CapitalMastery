import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = 'certificate-name.js';
const file = path.join(ROOT, rel);
let source = fs.readFileSync(file, 'utf8');

function replaceRequired(before, after, label) {
  if (source.includes(after)) return;
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Patch anchor is ambiguous: ${label}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceRequired(
  "    'passport','credentials','credential','certificate','achievement','compare','admin-preview'\n",
  "    'passport','credentials','credential','certificate','achievement','compare'\n",
  'learner gated roots must exclude admin-preview'
);

replaceRequired(
  "  async function maybePromptForName(user) {\n    if (!user) return;\n",
  "  async function maybePromptForName(user) {\n    if (!user) return;\n    // Credential-name onboarding is a learner concern. Admin routes are owned by\n    // admin-route-guard.js and must never be covered by a learner onboarding modal.\n    if (routeRoot() === 'admin-preview') { closeNameModal(false); return; }\n",
  'admin route exclusion from auth-triggered name onboarding'
);

replaceRequired(
  "  async function enforceCurrentRoute() {\n    if (!authReady() || routeGuardBusy) return;\n    const hash = location.hash || '#/';\n    if (!isGatedHash(hash)) return;\n",
  "  async function enforceCurrentRoute() {\n    if (!authReady() || routeGuardBusy) return;\n    const hash = location.hash || '#/';\n    if (routeRoot(hash) === 'admin-preview') { closeNameModal(false); return; }\n    if (!isGatedHash(hash)) return;\n",
  'admin route exclusion from route-enforced name onboarding'
);

fs.writeFileSync(file, source);
console.log('Admin routes are now isolated from learner credential-name onboarding.');
