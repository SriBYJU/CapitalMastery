import fs from 'node:fs';

const path = 'training-tracks.js';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(before, after, label) {
  const at = src.indexOf(before);
  if (at < 0) throw new Error(`Missing patch target: ${label}`);
  if (src.indexOf(before, at + before.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  src = src.slice(0, at) + after + src.slice(at + before.length);
}

replaceOnce(
  `  function routeParts() {\n    return (location.hash || '#/').replace(/^#\\/?/, '').split('?')[0].split('/').filter(Boolean);\n  }\n`,
  `  function safeDecodeRoutePart(value='') {\n    try { return decodeURIComponent(String(value)); }\n    catch (_) { return ''; }\n  }\n\n  function routeParts() {\n    return (location.hash || '#/').replace(/^#\\/?/, '').split('?')[0].split('/').filter(Boolean);\n  }\n`,
  'safe route decoder helper'
);

replaceOnce(
  `    const pathwayId = pathwayRoutes.has(route) && p[1] ? decodeURIComponent(p[1]) : '';`,
  `    const pathwayId = pathwayRoutes.has(route) && p[1] ? safeDecodeRoutePart(p[1]) : '';`,
  'routeContext pathway decode'
);
replaceOnce(
  `    if(p[0]==='role-lab'&&p[1]) return publicPathway(decodeURIComponent(p[1]));`,
  `    if(p[0]==='role-lab'&&p[1]) return publicPathway(safeDecodeRoutePart(p[1]));`,
  'advanced Role Lab decode'
);
replaceOnce(
  `      const key=decodeURIComponent(p[1]);`,
  `      const key=safeDecodeRoutePart(p[1]);`,
  'advanced final decode'
);

if (/decodeURIComponent\(p\[1\]\)/.test(src)) throw new Error('Unsafe route decode remains in training-tracks.js');
fs.writeFileSync(path, src);
console.log('Patched route decoding to fail safely on malformed percent-encoding.');
