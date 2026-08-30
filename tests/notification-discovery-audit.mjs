import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
function ok(v,m){if(!v)throw new Error(m);}
ok(app.includes("window.CM_AUTH?.user?'"),'global nav must respond to signed-in state');
ok(app.includes('href="#/notifications">Notifications</a>'),'signed-in users must have a global Notifications entry point');
ok(app.includes('href="#/login">Account</a>'),'signed-in nav must expose Account instead of only Sign in');
ok(index.includes('app.js?v=20260830-stability3'),'notification discovery release must cache-bust app.js to the current stability generation');
console.log('NOTIFICATION DISCOVERY AUDIT PASS: signed-in users can reach notifications globally');
