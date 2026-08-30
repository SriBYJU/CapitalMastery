import fs from 'node:fs';
const app=fs.readFileSync('app.js','utf8');
const live=fs.readFileSync('capital-mastery-live.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const admin=fs.readFileSync('admin-qa-simulation-fix.js','utf8');
const madeline=fs.readFileSync('madeline.js','utf8');
const ok=(v,m)=>{if(!v)throw new Error(m);};

ok(app.includes("if(root==='official-simulation')"),'Base SPA router must explicitly delegate the official simulation route');
ok(app.includes("window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true&&qaMode()"),'Admin local simulation preview must require backend-verified admin state');
ok(app.includes('The secure assessment router owns this route for normal learners'),'Normal official simulation must not transiently fall through to Home');
ok(live.includes("root === 'official-simulation'"),'Secure assessment router must yield official simulation during Admin QA preview');
ok(tracks.includes('window.CM_AUTH?.backendVerified === true'),'Two-track Admin QA bypass must require backend verification');
ok(admin.includes('window.CM_AUTH?.backendVerified === true'),'Admin QA shim must require backend verification');
ok(!madeline.includes('Career Skills (4 verified credentials)'),'Madeline must not misclassify the Career Skills completion certificate as a fourth verified credential');
ok(madeline.includes('3 verified Standard 2.0 credentials + 1 program-completion certificate'),'Madeline must describe Career Skills credential semantics accurately');
console.log('ADMIN SIMULATION ROUTE OWNERSHIP AUDIT PASS');
