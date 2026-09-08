import './patch-final-platform-polish-v2.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = 'tests/platform-admin-employer-usage-source-audit.mjs';
const file = path.join(ROOT, rel);
let source = fs.readFileSync(file, 'utf8');
source = source.replaceAll('20260908-founderadmin1', '20260908-founderadmin2');
fs.writeFileSync(file, source);
console.log('Founder admin production cache assertions aligned.');
