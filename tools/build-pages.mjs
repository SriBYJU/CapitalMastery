import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = path.join(repoRoot, 'dist-pages');
const requiredStaticFiles = ['index.html', '404.html', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml'];

function localReference(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value || value.startsWith('#') || /^(?:https?:|data:|mailto:|tel:)/i.test(value)) return null;
  const clean = value.split(/[?#]/, 1)[0].replace(/^\.\//, '');
  const normalized = path.posix.normalize(clean);
  if (!normalized || normalized === '.' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe production reference: ${value}`);
  }
  return normalized;
}

async function copyRelative(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const target = path.join(outputRoot, relativePath);
  await access(source);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

const indexHtml = await readFile(path.join(repoRoot, 'index.html'), 'utf8');
const referencedFiles = [...indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => localReference(match[1]))
  .filter(Boolean)
  .filter((reference) => !reference.startsWith('assets/'));

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const relativePath of [...new Set([...requiredStaticFiles, ...referencedFiles])].sort()) {
  await copyRelative(relativePath);
}
await copyRelative('assets');

await writeFile(path.join(outputRoot, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/index.html
  Cache-Control: no-cache, no-store, must-revalidate

/404.html
  Cache-Control: no-cache, no-store, must-revalidate
`, 'utf8');

console.log(`Cloudflare Pages bundle ready: ${path.relative(repoRoot, outputRoot)}`);
console.log(`Included ${new Set([...requiredStaticFiles, ...referencedFiles]).size} root files plus assets/ and _headers`);

