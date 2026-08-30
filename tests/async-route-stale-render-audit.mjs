import fs from 'node:fs';

const live = fs.readFileSync('capital-mastery-live-ui.js', 'utf8');
const tracks = fs.readFileSync('training-tracks.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(live.includes('function currentRouteKey()'), 'Missing current route identity helper');
assert(live.includes('function routeIsCurrent(expectedRoute)'), 'Missing route-current guard helper');

for (const renderer of ['renderCredentials', 'renderCredentialDetail', 'renderCertificate', 'renderAchievement']) {
  const start = live.indexOf(`async function ${renderer}`);
  assert(start >= 0, `Missing ${renderer}`);
  const next = live.indexOf('\n  async function ', start + 20);
  const body = live.slice(start, next >= 0 ? next : live.length);
  assert(body.includes('const expectedRoute = currentRouteKey();'), `${renderer} does not capture its starting route`);
  assert(body.includes('routeIsCurrent(expectedRoute)'), `${renderer} does not reject stale async completion`);
}

const routeStart = live.indexOf('async function route()');
assert(routeStart >= 0, 'Missing live UI route function');
const routeBody = live.slice(routeStart, live.indexOf('\n  function injectStyles()', routeStart));
assert(routeBody.includes('const expectedRoute = currentRouteKey();'), 'Live UI route does not capture starting route');
assert(/await syncOfficialProgress\(a\);\s*if \(!routeIsCurrent\(expectedRoute\)\) return;/.test(routeBody), 'Live UI route can continue after stale progress response');

assert(!/Career Skills[^\n]{0,220}four verified credentials/i.test(tracks), 'Career Skills copy still claims four verified credentials');
assert(tracks.includes('three verified Standard 2.0 credentials'), 'Career Skills copy does not state the corrected three-credential boundary');

console.log('ASYNC ROUTE STALE-RENDER AUDIT PASS: authoritative async renderers are route-scoped and Career Skills copy preserves the five-level credential boundary');
