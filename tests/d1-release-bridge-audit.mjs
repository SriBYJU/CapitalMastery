import fs from 'node:fs';

const bridge=fs.readFileSync('tools/d1-release-bridge-worker.mjs','utf8');
const runner=fs.readFileSync('tools/prepare-production-d1-via-worker.mjs','utf8');
const config=fs.readFileSync('tools/wrangler.d1-release-bridge.jsonc','utf8');
const ok=(value,message)=>{if(!value)throw new Error(message);};

for(const migration of ['MIGRATION_016','MIGRATION_017','MIGRATION_018'])ok(bridge.includes(migration),`Ephemeral bridge missing ${migration}`);
ok(bridge.includes("request.method!=='POST'||url.pathname!=='/prepare'"),'Bridge must expose only the POST preparation route');
ok(bridge.includes("request.headers.get('Authorization')!==`Bearer ${expected}`"),'Bridge must require its one-time secret before any D1 access');
ok(bridge.includes("if(!expected"),'Bridge must deny every request while its secret is absent');
ok(bridge.includes('Partial Career Skills constraint migration detected; refusing automatic repair'),'Bridge must fail closed on a partial 016 state');
ok(bridge.includes('indexes/triggers not recreated by migration 016'),'Bridge must refuse unknown rebuild objects');
ok(bridge.includes('assertUnchanged(beforeCounts,afterCounts)'),'Bridge must prove critical row counts did not change');
ok(bridge.includes("PRAGMA quick_check")&&bridge.includes("PRAGMA foreign_key_check"),'Bridge must run SQLite integrity and foreign-key checks');
ok(bridge.includes("Cache-Control':'no-store'")&&bridge.includes("X-Content-Type-Options':'nosniff'"),'Bridge responses need no-store and nosniff protections');
ok(config.includes('"name": "capital-mastery-d1-release-bridge"'),'Bridge config must pin a distinct disposable Worker name');
ok(config.includes('"database_name": "capital-mastery-prod"')&&config.includes('"database_id": "d007e8e7-8540-47dc-89b1-1aec4154b69b"'),'Bridge must pin the exact production D1 binding');
ok(runner.includes("randomBytes(32).toString('base64url')"),'Bridge runner must generate a high-entropy one-time secret');
ok(runner.includes("secret','put','CM_RELEASE_TOKEN"),'One-time authorization must be stored as a Worker secret, not a plaintext variable');
ok(runner.includes("finally")&&runner.includes("delete','--name',NAME,'--force'"),'Bridge runner must delete the exact disposable Worker even after failure');
ok(!runner.includes('--var'),'Bridge runner must never expose its token through a plaintext Wrangler variable');
ok(runner.includes("fs.writeFileSync('d1-production-preflight.json'"),'Bridge runner must preserve audited preflight evidence');

console.log('D1 EPHEMERAL RELEASE BRIDGE AUDIT PASS: secret-protected, schema-aware, integrity-checked, evidence-producing and self-deleting');
