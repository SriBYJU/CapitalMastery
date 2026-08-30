import fs from 'node:fs';

const tracks = fs.readFileSync('training-tracks.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(tracks.includes("function safeDecodeRoutePart(value='')"), 'Missing fail-safe route decoder');
assert(/try\s*\{\s*return decodeURIComponent\(String\(value\)\);\s*\}\s*catch\s*\(_\)\s*\{\s*return '';\s*\}/s.test(tracks), 'Route decoder does not safely absorb malformed percent-encoding');
assert(!/decodeURIComponent\(p\[1\]\)/.test(tracks), 'Unsafe direct decodeURIComponent(p[1]) remains in training-track routing');
assert(tracks.includes("safeDecodeRoutePart(p[1])"), 'Route paths are not using the fail-safe decoder');

console.log('MALFORMED ROUTE DECODING AUDIT PASS: hostile percent-encoded hashes fail safely instead of throwing URI errors');
