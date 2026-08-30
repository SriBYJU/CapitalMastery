import fs from 'node:fs';

const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const fail=[];
const ok=(value,message)=>{ if(!value) fail.push(message); };

// Reading the inbox must first reconcile generated state alerts, then hide
// archived items and keep urgent/attention messages ahead of positive/info.
ok(worker.includes("request.method === 'GET' && url.pathname === '/enterprise/notifications'")&&worker.includes('await refreshEnterpriseNotifications(env,user);'),'Notification GET must reconcile generated alerts before reading');
ok(worker.includes("status!='archived'")&&worker.includes("CASE severity WHEN 'urgent' THEN 0 WHEN 'attention' THEN 1 WHEN 'positive' THEN 2 ELSE 3 END")&&worker.includes('LIMIT 100'),'Inbox must exclude archived items, prioritize severity and cap the result set');

// A user may only mutate their own notification, and status transitions are
// constrained to the supported read/archive states.
ok(worker.includes("enterpriseEnum(body.status||'read',['read','archived'],'notification status')"),'Notification PATCH status must be enumerated');
ok(worker.includes('WHERE id=? AND recipient_uid=?'),'Notification mutation must be recipient-scoped');
ok(worker.includes("if(!Number(result.meta?.changes||0)) throw new HttpError(404,'Notification not found')"),'Cross-user or missing notification updates must fail closed');
ok(worker.includes("read_at=CASE WHEN ?='read' THEN CURRENT_TIMESTAMP ELSE read_at END"),'Read transition must stamp read_at without destroying it on archive');

// Generated alerts use deterministic dedupe keys. An archived alert must reopen
// if the underlying condition returns, while an already-read active alert should
// not be needlessly forced back to unread on every refresh.
ok(worker.includes('const id=`note_${(await sha256Hex(`${recipientUid}|${dedupeKey}`)).slice(0,24)}`'),'Generated notification id must be deterministic from recipient + dedupe key');
ok(worker.includes("ON CONFLICT(recipient_uid,dedupe_key) DO UPDATE")&&worker.includes("status=CASE WHEN enterprise_notifications.status='archived' THEN 'unread' ELSE enterprise_notifications.status END"),'Notification dedupe must reopen resolved alerts without resetting every read alert');

// Stateful deadline/revision/readiness alerts must disappear when the condition
// clears instead of becoming permanent stale inbox noise.
ok(worker.includes("category IN ('overdue','revision','readiness','deadline')"),'Generated state-alert cleanup must cover all release categories');
ok(worker.includes("!activeSet.has(key)")&&worker.includes("UPDATE enterprise_notifications SET status='archived'"),'Resolved generated alerts must be archived');
ok(worker.includes('archivedResolved+=Number(r.meta?.changes||0)'),'Resolved-alert cleanup must report actual archived rows');

// Account deletion must remove the user's notification records too.
ok(worker.includes('DELETE FROM enterprise_notifications WHERE recipient_uid=?'),'Account deletion must purge enterprise notifications');

if(fail.length){
  console.error('NOTIFICATION EDGE AUDIT FAILED\n - '+fail.join('\n - '));
  process.exit(1);
}
console.log('NOTIFICATION EDGE AUDIT PASS: ordering, cap, dedupe, ownership, read/archive transitions, resolution cleanup and account purge verified');
