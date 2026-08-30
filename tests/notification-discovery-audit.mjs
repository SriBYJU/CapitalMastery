import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
function ok(v,m){if(!v)throw new Error(m);}
ok(app.includes("window.CM_AUTH?.user?'"),'global nav must respond to signed-in state');
ok(app.includes('href="#/notifications">Notifications</a>'),'signed-in users must have a global Notifications entry point');
ok(app.includes('href="#/login">Account</a>'),'signed-in nav must expose Account instead of only Sign in');
ok(/<script\s+src=["']app\.js\?v=[^"']+["']><\/script>/.test(index),'notification discovery release must load app.js with a cache-busted production URL');
console.log('NOTIFICATION DISCOVERY AUDIT PASS: signed-in users can reach notifications globally');
