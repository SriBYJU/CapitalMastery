import fs from 'node:fs';

const path = 'tests/adversarial-chaos-browser-audit.cjs';
let src = fs.readFileSync(path, 'utf8');
const before = `    await context.addInitScript(({uid}) => {\n      localStorage.setItem(\`cmCredentialNameOnboardedV3:\${uid}\`, 'true');\n      // Invalid persisted values are intentional. The UI must normalize/fail safe.\n      localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking', 'garbage-track-value');\n      localStorage.setItem('capitalMasteryTrainingTrackV1:private-equity', '{not-json-or-track}');\n    }, { uid:UID });`;
const after = `    await context.addInitScript(({uid}) => {\n      localStorage.setItem(\`cmCredentialNameOnboardedV3:\${uid}\`, 'true');\n      // Seed corruption once per tab. addInitScript runs again on reload, so\n      // re-seeding here would destroy the valid value we are trying to verify.\n      if (sessionStorage.getItem('cmChaosCorruptTrackSeededV1') !== 'true') {\n        localStorage.setItem('capitalMasteryTrainingTrackV1:investment-banking', 'garbage-track-value');\n        localStorage.setItem('capitalMasteryTrainingTrackV1:private-equity', '{not-json-or-track}');\n        sessionStorage.setItem('cmChaosCorruptTrackSeededV1', 'true');\n      }\n    }, { uid:UID });`;
const at = src.indexOf(before);
if (at < 0) throw new Error('Chaos seed target not found');
if (src.indexOf(before, at + before.length) >= 0) throw new Error('Chaos seed target ambiguous');
src = src.slice(0, at) + after + src.slice(at + before.length);
fs.writeFileSync(path, src);
console.log('Chaos invalid-track corruption now seeds once per tab and does not invalidate the reload persistence check.');
