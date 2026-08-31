import fs from 'node:fs';
import path from 'node:path';

const config=fs.readFileSync('_config.yml','utf8');
const index=fs.readFileSync('index.html','utf8');
const must=(v,m)=>{if(!v)throw new Error(m);};

const lines=config.split(/\r?\n/);
const start=lines.findIndex(line=>/^exclude:\s*$/.test(line.trim()));
must(start>=0,'GitHub Pages config must define an explicit exclude list');
const excluded=[];
for(let i=start+1;i<lines.length;i++){
  const line=lines[i];
  if(/^\S/.test(line)&&line.trim()) break;
  const match=line.match(/^\s*-\s+(.+?)\s*$/);
  if(match) excluded.push(match[1].trim().replace(/^['"]|['"]$/g,''));
}
const set=new Set(excluded);
const sensitive=[
  '.github','.gitignore','README.md','SECURITY.md','auth-test.html','docs','functions',
  'migrations','tests','tools','v2','wrangler.jsonc','firestore.rules','firestore.rules.example',
  'firebase-config.example.js','learner-guide-mobile-fix.css'
];
for(const item of sensitive) must(set.has(item),`GitHub Pages publish boundary must exclude ${item}`);

// Frontend files referenced by the actual shell must remain publishable.
const refs=[...index.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map(m=>m[1].split(/[?#]/,1)[0].replace(/^\.\//,''))
  .filter(x=>x&&!x.startsWith('#')&&!/^(?:https?:|data:|mailto:|tel:)/i.test(x));
for(const ref of refs){
  const top=ref.split('/')[0];
  must(!set.has(ref)&&!set.has(top),`GitHub Pages exclude list accidentally blocks browser dependency ${ref}`);
  must(fs.existsSync(path.resolve(ref)),`Referenced browser dependency is missing from repository: ${ref}`);
}
for(const required of ['index.html','404.html','manifest.webmanifest','robots.txt','sitemap.xml','assets']){
  must(!set.has(required),`GitHub Pages exclude list must not block required public surface ${required}`);
}

// The Cloudflare build remains the stronger allowlist; the fallback denylist must
// at minimum protect every backend/database/QA class that the live audit attacks.
const liveAudit=fs.readFileSync('.github/workflows/github-pages-live-readonly-audit.yml','utf8');
for(const marker of [
  'v2/worker-v2-phase1-release.js','migrations/017_phase2_program_completion_records.sql','migrations/018_assessment_attempt_reviews.sql',
  'tests/program-completion-public-verification-audit.mjs','tools/prepare-production-d1.mjs',
  'wrangler.jsonc','auth-test.html','firestore.rules','firebase-config.example.js'
]) must(liveAudit.includes(marker),`Live fallback audit must attack ${marker}`);
must(liveAudit.includes('Wait for internal backend and QA artifacts to become private'),'Live audit must be propagation-aware before declaring privacy');

console.log(`GITHUB PAGES PUBLISH BOUNDARY AUDIT PASS: ${excluded.length} internal paths excluded; ${refs.length} shell dependencies remain public`);
