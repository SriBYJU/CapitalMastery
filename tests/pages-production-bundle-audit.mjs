import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function ok(value, message) { if (!value) throw new Error(message); }

execFileSync(process.execPath, ['tools/build-pages.mjs'], { stdio: 'pipe' });

const output = 'dist-pages';
const index = fs.readFileSync('index.html', 'utf8');
const localReferences = [...index.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => value && !value.startsWith('#') && !/^(?:https?:|data:|mailto:|tel:)/i.test(value))
  .map((value) => value.split(/[?#]/, 1)[0].replace(/^\.\//, ''));

for (const relativePath of localReferences) {
  ok(fs.existsSync(path.join(output, relativePath)), `Production bundle is missing ${relativePath}`);
}

for (const forbidden of ['v2', 'tests', 'migrations', 'docs', 'tools', 'functions', 'auth-test.html', 'firebase-config.example.js', 'firestore.rules', 'wrangler.jsonc']) {
  ok(!fs.existsSync(path.join(output, forbidden)), `Production bundle must exclude ${forbidden}`);
}

const bundledIndex = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const bundledGuardIndex = bundledIndex.indexOf('admin-route-guard.js');
const bundledAppIndex = bundledIndex.indexOf('app.js');
ok(fs.existsSync(path.join(output, 'admin-route-guard.js')), 'Production bundle must include the pre-router admin security gate');
ok(bundledGuardIndex >= 0 && bundledAppIndex >= 0 && bundledGuardIndex < bundledAppIndex, 'Production bundle must load admin-route-guard.js before app.js');

const headers = fs.readFileSync(path.join(output, '_headers'), 'utf8');
for (const control of ['X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Permissions-Policy:', 'Strict-Transport-Security:']) {
  ok(headers.includes(control), `Production response headers are missing ${control}`);
}

ok(fs.existsSync(path.join(output, 'assets', 'seal.svg')), 'Credential seal must ship in the production asset set');
ok(fs.existsSync(path.join(output, 'assets', 'founder-signature.png')), 'Certificate signature asset must ship in the production asset set');
console.log('PAGES PRODUCTION BUNDLE AUDIT PASS: complete frontend allowlist + pre-router admin guard + backend/test artifact exclusion + baseline security headers');
