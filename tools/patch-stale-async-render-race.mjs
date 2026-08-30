import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing patch target: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const livePath = 'capital-mastery-live-ui.js';
let live = fs.readFileSync(livePath, 'utf8');

live = replaceOnce(
  live,
  `  function main() {\n    return document.querySelector('#app main#main');\n  }\n`,
  `  function main() {\n    return document.querySelector('#app main#main');\n  }\n\n  // Every async renderer captures the route it started on. A response that\n  // arrives after navigation is stale and must never repaint the current page.\n  function currentRouteKey() {\n    return location.hash || '#/';\n  }\n\n  function routeIsCurrent(expectedRoute) {\n    return currentRouteKey() === expectedRoute;\n  }\n`,
  'route identity helpers'
);

live = replaceOnce(
  live,
  `  async function renderCredentials() {\n    if (!window.CM_AUTH?.ready) return renderLoading('Checking your account…');`,
  `  async function renderCredentials() {\n    const expectedRoute = currentRouteKey();\n    if (!window.CM_AUTH?.ready) return renderLoading('Checking your account…');`,
  'renderCredentials route capture'
);
live = replaceOnce(
  live,
  `      const credentials = await fetchCredentials();\n      const el = main();`,
  `      const credentials = await fetchCredentials();\n      if (!routeIsCurrent(expectedRoute)) return;\n      const el = main();`,
  'renderCredentials stale response guard'
);
live = replaceOnce(
  live,
  `    } catch (error) {\n      renderError('Could not load credentials.', error.message);\n    }\n  }\n\n  async function renderCredentialDetail(pathwayId, level) {`,
  `    } catch (error) {\n      if (routeIsCurrent(expectedRoute)) renderError('Could not load credentials.', error.message);\n    }\n  }\n\n  async function renderCredentialDetail(pathwayId, level) {`,
  'renderCredentials stale error guard'
);

live = replaceOnce(
  live,
  `  async function renderCredentialDetail(pathwayId, level) {\n    renderLoading('Loading credential details…');`,
  `  async function renderCredentialDetail(pathwayId, level) {\n    const expectedRoute = currentRouteKey();\n    renderLoading('Loading credential details…');`,
  'renderCredentialDetail route capture'
);
live = replaceOnce(
  live,
  `      const credential = await findCredential(pathwayId, level);\n      if (!credential) throw new Error('No issued credential was found for this pathway and level.');`,
  `      const credential = await findCredential(pathwayId, level);\n      if (!routeIsCurrent(expectedRoute)) return;\n      if (!credential) throw new Error('No issued credential was found for this pathway and level.');`,
  'renderCredentialDetail credential guard'
);
live = replaceOnce(
  live,
  `        try { evidenceData = await v2ApiFetch(\`/enterprise/credentials/\${encodeURIComponent(credential.credential_id)}/evidence\`); }\n        catch (error) { console.warn('V2 credential evidence unavailable:', error); }\n      }\n      const profile =`,
  `        try { evidenceData = await v2ApiFetch(\`/enterprise/credentials/\${encodeURIComponent(credential.credential_id)}/evidence\`); }\n        catch (error) { console.warn('V2 credential evidence unavailable:', error); }\n        if (!routeIsCurrent(expectedRoute)) return;\n      }\n      const profile =`,
  'renderCredentialDetail evidence guard'
);
live = replaceOnce(
  live,
  `    } catch (error) {\n      renderError('Credential unavailable.', error.message);\n    }\n  }\n\n  async function renderCertificate(pathwayId, level) {`,
  `    } catch (error) {\n      if (routeIsCurrent(expectedRoute)) renderError('Credential unavailable.', error.message);\n    }\n  }\n\n  async function renderCertificate(pathwayId, level) {`,
  'renderCredentialDetail stale error guard'
);

live = replaceOnce(
  live,
  `  async function renderCertificate(pathwayId, level) {\n    renderLoading('Preparing your verified certificate…');`,
  `  async function renderCertificate(pathwayId, level) {\n    const expectedRoute = currentRouteKey();\n    renderLoading('Preparing your verified certificate…');`,
  'renderCertificate route capture'
);
live = replaceOnce(
  live,
  `      const credential = await findCredential(pathwayId, level);\n      if (!credential || credential.status !== 'active') throw new Error('An active issued credential is required to view this certificate.');`,
  `      const credential = await findCredential(pathwayId, level);\n      if (!routeIsCurrent(expectedRoute)) return;\n      if (!credential || credential.status !== 'active') throw new Error('An active issued credential is required to view this certificate.');`,
  'renderCertificate credential guard'
);
live = replaceOnce(
  live,
  `    } catch (error) {\n      renderError('Certificate unavailable.', error.message);\n    }\n  }\n\n  async function renderAchievement(pathwayId, level) {`,
  `    } catch (error) {\n      if (routeIsCurrent(expectedRoute)) renderError('Certificate unavailable.', error.message);\n    }\n  }\n\n  async function renderAchievement(pathwayId, level) {`,
  'renderCertificate stale error guard'
);

live = replaceOnce(
  live,
  `  async function renderAchievement(pathwayId, level) {\n    renderLoading('Opening your achievement…');`,
  `  async function renderAchievement(pathwayId, level) {\n    const expectedRoute = currentRouteKey();\n    renderLoading('Opening your achievement…');`,
  'renderAchievement route capture'
);
live = replaceOnce(
  live,
  `      const credential = await findCredential(pathwayId, level);\n      if (!credential || credential.status !== 'active') throw new Error('No active verified credential was found.');`,
  `      const credential = await findCredential(pathwayId, level);\n      if (!routeIsCurrent(expectedRoute)) return;\n      if (!credential || credential.status !== 'active') throw new Error('No active verified credential was found.');`,
  'renderAchievement credential guard'
);
live = replaceOnce(
  live,
  `    } catch (error) {\n      renderError('Achievement unavailable.', error.message);\n    }\n  }\n`,
  `    } catch (error) {\n      if (routeIsCurrent(expectedRoute)) renderError('Achievement unavailable.', error.message);\n    }\n  }\n`,
  'renderAchievement stale error guard'
);

live = replaceOnce(
  live,
  `  async function route() {\n    const [root, a, b] = hashParts();`,
  `  async function route() {\n    const expectedRoute = currentRouteKey();\n    const [root, a, b] = hashParts();`,
  'route capture'
);
live = replaceOnce(
  live,
  `      const changed = await syncOfficialProgress(a);\n      const key = \`\${location.hash}|\${window.CM_AUTH.user.uid}\`;`,
  `      const changed = await syncOfficialProgress(a);\n      if (!routeIsCurrent(expectedRoute)) return;\n      const key = \`\${location.hash}|\${window.CM_AUTH.user.uid}\`;`,
  'route stale progress guard'
);

fs.writeFileSync(livePath, live);

const tracksPath = 'training-tracks.js';
let tracks = fs.readFileSync(tracksPath, 'utf8');
tracks = tracks.replace(
  'Career Skills</strong> is the shorter practical route with four verified credentials: Foundations, Essentials, Applied Skills and the Career Skills Certificate.',
  'Career Skills</strong> is the shorter practical route with three verified Standard 2.0 credentials—Foundations, Essentials and Applied Skills—plus a separate Career Skills Program Completion Certificate after the practical capstone.'
);
tracks = tracks.replace(
  'Career Skills produces four verified credentials: Foundations, Essentials, Applied Skills and the Career Skills Certificate, which requires the practical capstone simulation.',
  'Career Skills produces three verified Standard 2.0 credentials—Foundations, Essentials and Applied Skills—plus a separate Career Skills Program Completion Certificate after the practical capstone simulation.'
);
if (tracks.includes('four verified credentials')) throw new Error('Stale four-verified Career Skills copy remains in training-tracks.js');
fs.writeFileSync(tracksPath, tracks);

console.log('Patched stale async route rendering and Career Skills copy.');
