#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_BASE = 'http://127.0.0.1:4173';
const DIST_INDEX = path.join(ROOT, 'dist-pages', 'index.html');
const require = createRequire(import.meta.url);

const BROWSER_AUDITS = [
  'tests/course-pass-continuity-browser-audit.cjs',
  'tests/course-no-skip-resume-browser-audit.cjs',
  'tests/course-assessment-state-browser-audit.cjs',
  'tests/state-resilience-browser-audit.cjs',
  'tests/functional-persistence-reliability-browser-audit.cjs',
  'tests/account-switch-app-state-browser-audit.cjs',
  'tests/failure-seeking-browser-audit.mjs',
  'tests/adversarial-chaos-browser-audit.cjs',
  'tests/admin-route-zero-exposure-browser-audit.cjs',
  'tests/admin-simulation-route-stability-browser-audit.cjs',
  'tests/program-completion-public-browser-audit.cjs',
  'tests/learner-guide-mobile-browser-audit.cjs',
  'tests/ib-workbench-navigation-guide-browser-audit.cjs',
  'tests/all-career-browser-sweep.cjs',
  'tests/employer-public-browser-audit.cjs',
  'tests/employer-role-matrix-browser-audit.cjs',
  'tests/employer-invite-lifecycle-browser-audit.cjs',
  'tests/platform-admin-employer-usage-browser-audit.cjs',
  'tests/accessibility-keyboard-browser-audit.cjs',
  'tests/firebase-direct-google-browser-audit.cjs'
];

function fail(message) {
  console.error(`\nQA SAFETY STOP: ${message}\n`);
  process.exit(2);
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
  }
}

function resolvePython() {
  const candidates = process.platform === 'win32'
    ? [['py', ['-3']], ['python', []]]
    : [['python3', []], ['python', []]];
  for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, '--version'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return { command, prefix };
  }
  return null;
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Local QA server exited before becoming ready (status ${server.exitCode}).`);
    }
    try {
      const response = await fetch(`${LOCAL_BASE}/`, { redirect: 'manual' });
      if (response.ok || (response.status >= 300 && response.status < 400)) return;
    } catch (_) {
      // Server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for the isolated QA server at ${LOCAL_BASE}.`);
}

const requestedBase = process.env.CM_AUDIT_URL?.replace(/\/+$/, '');
if (requestedBase && requestedBase !== LOCAL_BASE) {
  fail(`CM_AUDIT_URL must remain ${LOCAL_BASE}. This runner refuses production or remote URLs so QA cannot touch live organization, cohort, workspace, or learner data.`);
}

try {
  require.resolve('playwright');
} catch (_) {
  fail('Playwright is not installed. Run `npm run qa:browser`; that command installs the pinned QA-only dependency without changing package.json or package-lock.json.');
}

if (!existsSync(DIST_INDEX)) {
  console.log('Building the isolated dist-pages QA artifact...');
  run(process.execPath, ['tools/build-pages.mjs']);
}

const python = resolvePython();
if (!python) fail('Python 3 is required only to serve the local dist-pages QA artifact.');

const env = { ...process.env, CM_AUDIT_URL: LOCAL_BASE };
const server = spawn(
  python.command,
  [...python.prefix, '-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', 'dist-pages'],
  { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] }
);

try {
  await waitForServer(server);
  console.log(`\nRunning ${BROWSER_AUDITS.length} browser audits against local-only ${LOCAL_BASE}.`);
  console.log('No production URL is permitted by this runner.\n');

  for (const audit of BROWSER_AUDITS) {
    console.log(`\n=== ${audit} ===`);
    run(process.execPath, [audit], env);
  }

  console.log('\nLOCAL_BROWSER_AUDIT_SUITE=PASS');
} finally {
  if (server.exitCode === null) {
    server.kill('SIGTERM');
  }
}
