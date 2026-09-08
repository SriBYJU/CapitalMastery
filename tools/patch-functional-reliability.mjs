import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function write(rel, value) { fs.writeFileSync(path.join(ROOT, rel), value); }

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Patch anchor is ambiguous: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function patchIndex() {
  const rel = 'index.html';
  let source = read(rel);
  if (!source.includes('functional-reliability.js')) {
    source = replaceOnce(
      source,
      '  <script src="firebase-sync.js?v=20260831-phase2rc7"></script>\n  <script src="account-isolation-early.js?v=20260831-phase2rc3"></script>',
      '  <script src="firebase-sync.js?v=20260908-reliability1"></script>\n  <script src="functional-reliability.js?v=20260908-reliability1"></script>\n  <script src="account-isolation-early.js?v=20260831-phase2rc3"></script>',
      'index reliability script load'
    );
  }
  source = source.replace('course-continuity.js?v=20260902-course-reviewactions1', 'course-continuity.js?v=20260908-reliability1');
  source = source.replace('enterprise-v2.js?v=20260902-adminintegrity1', 'enterprise-v2.js?v=20260908-reliability1');
  write(rel, source);
}

function patchFirebaseSync() {
  const rel = 'firebase-sync.js';
  let source = read(rel);
  if (!source.includes('PENDING_SYNC_PREFIX')) {
    source = replaceOnce(
      source,
      '  let debounceTimer = null;\n  let syncTail = Promise.resolve(true);',
      '  let debounceTimer = null;\n  let retryTimer = null;\n  const PENDING_SYNC_PREFIX = \'capitalMasteryPendingCloudSyncV1:\';\n  let syncTail = Promise.resolve(true);',
      'firebase sync pending variables'
    );

    source = replaceOnce(
      source,
      `  function setStatus(status, error = null) {\n    CM_SYNC.status = status;\n    CM_SYNC.error = error ? String(error.message || error) : null;\n    document.dispatchEvent(new CustomEvent('cm-sync-changed', {\n      detail: { status: CM_SYNC.status, lastSyncedAt: CM_SYNC.lastSyncedAt, error: CM_SYNC.error }\n    }));\n  }`,
      `  function setStatus(status, error = null) {\n    CM_SYNC.status = status;\n    CM_SYNC.error = error ? String(error.message || error) : null;\n    document.dispatchEvent(new CustomEvent('cm-sync-changed', {\n      detail: { status: CM_SYNC.status, lastSyncedAt: CM_SYNC.lastSyncedAt, error: CM_SYNC.error }\n    }));\n  }\n\n  function pendingSyncKey(uid = user?.uid) {\n    return uid ? \`\${PENDING_SYNC_PREFIX}\${uid}\` : null;\n  }\n\n  function markPending(state) {\n    const key = pendingSyncKey();\n    if (!key) return;\n    try {\n      localStorage.setItem(key, JSON.stringify({ at:Date.now(), updatedAt:state?.updatedAt || null }));\n    } catch (error) {\n      window.CM_RELIABILITY?.report?.('browser-storage', 'This browser could not record the pending cloud save.', { severity:'error', detail:String(error?.message || error) });\n    }\n  }\n\n  function clearPending() {\n    const key = pendingSyncKey();\n    if (!key) return;\n    try { localStorage.removeItem(key); } catch (_) {}\n  }\n\n  function scheduleRetry(delay = 4000) {\n    if (!user || qaMode()) return;\n    clearTimeout(retryTimer);\n    retryTimer = setTimeout(() => {\n      retryTimer = null;\n      scheduleCloudSync(readLocalState());\n    }, Math.max(1000, Number(delay || 4000)));\n  }`,
      'firebase sync reliability helpers'
    );

    source = replaceOnce(
      source,
      `    if (rootProfileInitializedForUid !== uid) {\n      const snap = await fs.getDoc(ref);\n      if (!snap.exists()) base.createdAt = fs.serverTimestamp();\n      rootProfileInitializedForUid = uid;\n    }\n\n    await fs.setDoc(ref, base, { merge: true });`,
      `    const initializingRootProfile = rootProfileInitializedForUid !== uid;\n    if (initializingRootProfile) {\n      const snap = await fs.getDoc(ref);\n      if (!snap.exists()) base.createdAt = fs.serverTimestamp();\n    }\n\n    await fs.setDoc(ref, base, { merge: true });\n    if (initializingRootProfile) rootProfileInitializedForUid = uid;`,
      'root profile initialization fence'
    );

    const syncStart = source.indexOf('  async function syncLocalToCloud(state) {');
    const syncEnd = source.indexOf('\n  function scheduleCloudSync(state) {', syncStart);
    if (syncStart < 0 || syncEnd < 0) throw new Error('Could not locate syncLocalToCloud block');
    const replacement = `  async function syncLocalToCloud(state) {\n    if (!user || !state) return false;\n    if (qaMode()) {\n      setStatus('qa-local-only');\n      return false;\n    }\n    if (!db || !fs) {\n      const error = new Error('Account sync is not initialized yet. Your work remains saved on this device and will retry.');\n      markPending(state);\n      setStatus('error', error);\n      scheduleRetry();\n      return false;\n    }\n\n    const clean = normalizeState(state, user, 'local');\n    if (clean.profile?.accountUid !== user.uid) {\n      const error = new Error('Capital Mastery blocked a cross-account progress write. Sign in again before continuing.');\n      console.warn(error.message);\n      setStatus('error', error);\n      return false;\n    }\n\n    try {\n      markPending(clean);\n      setStatus('syncing');\n      await fs.setDoc(fs.doc(db, 'users', user.uid, 'progress', 'state'), cloudPayload(clean), { merge: false });\n      let rootProfileError = null;\n      try {\n        await writeRootProfile(clean);\n      } catch (error) {\n        rootProfileError = error;\n        console.warn('Protected account-profile mirror will retry:', error);\n      }\n      try {\n        localStorage.setItem(userStateKey(user.uid), JSON.stringify(clean));\n      } catch (error) {\n        window.CM_RELIABILITY?.report?.('browser-storage', 'Your cloud progress saved, but this browser could not update its local account cache.', { severity:'error', detail:String(error?.message || error) });\n      }\n      clearPending();\n      CM_SYNC.lastSyncedAt = new Date().toISOString();\n      if (rootProfileError) {\n        setStatus('degraded', new Error('Your progress is saved. The protected account-profile mirror is still retrying.'));\n        scheduleRetry(5000);\n      } else {\n        clearTimeout(retryTimer);\n        retryTimer = null;\n        setStatus('synced');\n      }\n      return true;\n    } catch (error) {\n      console.error('Capital Mastery Firestore sync failed:', error);\n      markPending(clean);\n      setStatus('error', error);\n      scheduleRetry(typeof navigator !== 'undefined' && navigator.onLine === false ? 15000 : 4000);\n      return false;\n    }\n  }`;
    source = source.slice(0, syncStart) + replacement + source.slice(syncEnd);

    source = replaceOnce(
      source,
      `  function queueSync(state) {\n    if (!user || qaMode() || suppressLocalHook) return;\n    clearTimeout(debounceTimer);\n    debounceTimer = setTimeout(() => scheduleCloudSync(state || readLocalState()), 700);\n  }`,
      `  function queueSync(state) {\n    if (!user || qaMode() || suppressLocalHook) return;\n    const latest = state || readLocalState();\n    clearTimeout(debounceTimer);\n    markPending(latest);\n    setStatus('pending');\n    debounceTimer = setTimeout(() => scheduleCloudSync(latest || readLocalState()), 700);\n  }`,
      'firebase queued sync state'
    );

    source = replaceOnce(
      source,
      `  initFirestore();\n})();`,
      `  function flushLatestBeforeBackground() {\n    if (!user || qaMode()) return;\n    clearTimeout(debounceTimer);\n    debounceTimer = null;\n    const latest = readLocalState();\n    if (latest) scheduleCloudSync(latest);\n  }\n\n  document.addEventListener('visibilitychange', () => {\n    if (document.visibilityState === 'hidden') flushLatestBeforeBackground();\n  });\n  window.addEventListener('pagehide', flushLatestBeforeBackground);\n\n  initFirestore();\n})();`,
      'firebase lifecycle flush'
    );
  }
  write(rel, source);
}

function patchCourseContinuity() {
  const rel = 'course-continuity.js';
  let source = read(rel);
  if (!source.includes('progressReadFailure')) {
    const start = source.indexOf('  async function progressRows(pathway, force=false) {');
    const end = source.indexOf('\n  function rowBest(rows,itemId) {', start);
    if (start < 0 || end < 0) throw new Error('Could not locate progressRows block');
    const replacement = `  function progressReadScope(pathway) { return \`progress-read:\${pathway}\`; }\n\n  function progressReadFailure(pathway, message) {\n    const scope = progressReadScope(pathway);\n    window.CM_RELIABILITY?.report?.(scope, message, {\n      severity:'error',\n      retry:async () => {\n        progressCache.delete(pathway);\n        await progressRows(pathway, true);\n        return !(window.CM_RELIABILITY?.issues || []).some(issue => issue.scope === scope);\n      },\n      detail:'Capital Mastery will not replace authoritative server progress with an empty result.'\n    });\n  }\n\n  async function progressRows(pathway, force=false) {\n    if (!pathway || !API || !window.CM_AUTH?.user) return [];\n    const cached = progressCache.get(pathway);\n    if (!force && cached && Date.now() - cached.at < 15000) return cached.rows;\n    if (!force && progressInflight.has(pathway)) return progressInflight.get(pathway);\n    const request = (async () => {\n      try {\n        const token = await authToken();\n        if (!token) {\n          progressReadFailure(pathway, 'Capital Mastery could not verify your signed-in session before reading saved course progress.');\n          return [];\n        }\n        const response = await fetch(\`\${API}/progress/\${encodeURIComponent(pathway)}\`, { headers:{Authorization:\`Bearer \${token}\`} });\n        const data = await response.json().catch(() => ({}));\n        if (!response.ok || !Array.isArray(data.progress)) {\n          progressReadFailure(pathway, \`Saved course progress could not be verified from the server (\${response.status}).\`);\n          return [];\n        }\n        progressCache.set(pathway,{at:Date.now(),rows:data.progress});\n        window.CM_RELIABILITY?.clear?.(progressReadScope(pathway));\n        return data.progress;\n      } catch (error) {\n        progressReadFailure(pathway, \`Saved course progress could not be verified: \${String(error?.message || error)}\`);\n        return [];\n      }\n      finally { progressInflight.delete(pathway); }\n    })();\n    progressInflight.set(pathway, request);\n    return request;\n  }`;
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  write(rel, source);
}

function patchEnterpriseFrontend() {
  const rel = 'enterprise-v2.js';
  let source = read(rel);
  const before = `      let report={}; try { report=await api(\`/enterprise/learner/readiness-report/\${encodeURIComponent(a.pathwayId)}?assignmentId=\${encodeURIComponent(a.id)}\`); } catch {}`;
  const after = `      const report=await api(\`/enterprise/learner/readiness-report/\${encodeURIComponent(a.pathwayId)}?assignmentId=\${encodeURIComponent(a.id)}\`);`;
  if (source.includes(before)) source = replaceOnce(source, before, after, 'assigned readiness silent failure');
  write(rel, source);
}

function patchAssessmentEnrichment(rel) {
  let source = read(rel);
  if (!source.includes('evidenceRefreshPending=false')) {
    const startMarker = `  let readiness=null;\n  if(passed){\n`;
    const endMarker = `  }\n  return {attemptId,score,passed,correct,total:qs.length,competencyScores:compScores,details,readiness};`;
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    if (start < 0 || end < 0) throw new Error(`Could not locate assessment enrichment block in ${rel}`);
    const body = source.slice(start + startMarker.length, end);
    const replacement = `  let readiness=null;\n  let evidenceRefreshPending=false;\n  let evidenceRefreshWarning=null;\n  if(passed){\n    let lastEvidenceError=null;\n    for(const delay of [0,250,900]){\n      if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n      try{\n${body}        lastEvidenceError=null;\n        break;\n      }catch(error){\n        lastEvidenceError=error;\n      }\n    }\n    if(lastEvidenceError){\n      evidenceRefreshPending=true;\n      evidenceRefreshWarning='Your assessment attempt is saved, but readiness evidence could not finish updating yet.';\n    }\n  }\n  return {attemptId,score,passed,correct,total:qs.length,competencyScores:compScores,details,readiness,evidenceRefreshPending,evidenceRefreshWarning};`;
    source = source.slice(0, start) + replacement + source.slice(end + endMarker.length);
  }

  const refreshLine = `        const refreshed=result.passed?await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId}):[];`;
  if (source.includes(refreshLine)) {
    source = replaceOnce(source, refreshLine, `        let refreshed=[];\n        let credentialRefreshPending=result.evidenceRefreshPending===true;\n        let credentialRefreshWarning=result.evidenceRefreshWarning||null;\n        if(result.passed && !result.evidenceRefreshPending){\n          let lastRefreshError=null;\n          for(const delay of [0,250,900]){\n            if(delay) await new Promise(resolve=>setTimeout(resolve,delay));\n            try{\n              refreshed=await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId});\n              lastRefreshError=null;\n              break;\n            }catch(error){ lastRefreshError=error; }\n          }\n          if(lastRefreshError){\n            credentialRefreshPending=true;\n            credentialRefreshWarning='Your assessment attempt is saved, but credential issuance could not finish yet.';\n          }\n        }`, `${rel} credential refresh retry`);
  }

  const returnPrefix = `        return json({ok:true,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,issuedCredentials:`;
  if (source.includes(returnPrefix)) {
    source = replaceOnce(source, returnPrefix, `        return json({ok:true,assessmentSaved:true,pathwayId:pathway.id,assignmentId,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,credentialRefreshPending,credentialRefreshWarning,issuedCredentials:`, `${rel} assessment saved response`);
  }

  write(rel, source);
}

patchIndex();
patchFirebaseSync();
patchCourseContinuity();
patchEnterpriseFrontend();
patchAssessmentEnrichment('v2/v2-credential-assessment-helpers.js');
patchAssessmentEnrichment('v2/worker-v2-phase1-release.js');

console.log('Functional reliability patches applied.');
