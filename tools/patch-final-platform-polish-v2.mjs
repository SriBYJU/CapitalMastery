import './patch-final-platform-polish.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = 'tests/experience-polish-audit.mjs';
const file = path.join(ROOT, rel);
let source = fs.readFileSync(file, 'utf8');
source = source.replace(
  'ux-stability.js?v=20260901-courseintegrity1',
  'ux-stability.js?v=20260908-credentials-stability1'
);
fs.writeFileSync(file, source);
console.log('Final platform polish cache assertions aligned.');
