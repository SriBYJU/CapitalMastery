import fs from 'node:fs';

const root = 'docs/reports';
const expected = [
  'README.md',
  'phase-1-simple.md','phase-1-detailed.md',
  'phase-2-simple.md','phase-2-detailed.md',
  'phase-3-simple.md','phase-3-detailed.md',
  'full-project-simple.md','full-project-detailed.md'
];
const failures = [];
const ok = (value, message) => { if (!value) failures.push(message); };

for (const file of expected) {
  const path = `${root}/${file}`;
  ok(fs.existsSync(path), `Missing report: ${path}`);
  if (!fs.existsSync(path)) continue;
  const text = fs.readFileSync(path, 'utf8');
  ok(text.length >= (file.includes('detailed') ? 2500 : 700), `${file} is not sufficiently complete for its label`);
}

const index = fs.readFileSync(`${root}/README.md`, 'utf8');
for (const file of expected.filter(file => file !== 'README.md')) ok(index.includes(`(${file})`), `Report index does not link ${file}`);

const full = fs.readFileSync(`${root}/full-project-detailed.md`, 'utf8');
for (const marker of ['Phase 1 (`abd7cf1`)', 'Phase 2 (`2ce85e7`)', 'Phase 3 (`b02255f`)', '16 finance pathways', '88 dependency-free static audit files']) {
  ok(full.includes(marker), `Full detailed report is missing ${marker}`);
}
ok(/does not|not yet|not a formal/i.test(full) && full.includes('SOC 2') && full.includes('independently penetration-tested'), 'Full report must preserve external-assurance limits');

const phase3 = fs.readFileSync(`${root}/phase-3-detailed.md`, 'utf8');
ok(phase3.includes('zero additional cost') && phase3.includes('D1 Time Travel') && phase3.includes('88 / 88'), 'Phase 3 report must record its cost, recovery and verification evidence');

if (failures.length) {
  console.error(`RELEASE REPORT COMPLETENESS AUDIT FAILED\n - ${failures.join('\n - ')}`);
  process.exit(1);
}
console.log('RELEASE REPORT COMPLETENESS AUDIT PASS: indexed simple/detailed reports exist for Phases 1-3 and the full project with evidence and honest assurance boundaries');
