import fs from 'node:fs';
const read = (p) => fs.readFileSync(p,'utf8');
const html=read('index.html'), robots=read('robots.txt'), sitemap=read('sitemap.xml'), worker=read('v2/worker-v2-phase1-release.js'), adminOverlay=read('v2/platform-admin-overlay.js'), productionOverlay=read('v2/production-experience-overlay.js'), inviteOverlay=read('v2/invite-revoke-overlay.js'), wrangler=read('wrangler.jsonc'), liveAudit=read('.github/workflows/github-pages-live-readonly-audit.yml'), releaseEvidence=read('docs/release-evidence/cloudflare-workers-builds-2026-09-08.md');
const must=(ok,msg)=>{ if(!ok) throw new Error(msg); };
must(html.includes('rel="canonical" href="https://sribyju.github.io/CapitalMastery/"'), 'GitHub Pages primary canonical missing');
must(!html.includes('rel="canonical" href="https://capitalmastery.pages.dev/'), 'Obsolete Cloudflare Pages host must not be canonical');
must(robots.includes('Sitemap: https://sribyju.github.io/CapitalMastery/sitemap.xml'), 'robots sitemap host mismatch');
must(sitemap.includes('<loc>https://sribyju.github.io/CapitalMastery/</loc>'), 'sitemap primary URL mismatch');
const config=JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm,''));
must(config.vars?.ALLOWED_ORIGIN==='https://sribyju.github.io', 'Worker browser origin allowlist must contain only canonical GitHub Pages');
must(config.main==='v2/invite-revoke-overlay.js', 'Production Worker must use the additive invite revoke entrypoint');
must(inviteOverlay.includes("import coreWorker from './production-experience-overlay.js'"), 'Invite revoke entrypoint must delegate all existing behavior through production experience overlay');
must(productionOverlay.includes("import coreWorker from './platform-admin-overlay.js'"), 'Production Worker must delegate through platform-admin overlay');
must(adminOverlay.includes("import coreWorker from './worker-v2-phase1-release.js'"), 'Platform-admin overlay must delegate to the reviewed core Worker');
must(worker.includes('allowedOriginList(env).includes(origin)'), 'Core Worker does not enforce explicit origin allowlist');
must(/push:\s*\r?\n\s+branches:\s*\[main\]/.test(liveAudit), 'GitHub primary must be audited automatically after main pushes');
must(liveAudit.includes('PRIMARY: https://sribyju.github.io/CapitalMastery'), 'Live primary audit target mismatch');
must(!fs.existsSync('.github/workflows/cloudflare-production-release.yml'), 'Obsolete GitHub-secret Worker release workflow must remain retired');
must(releaseEvidence.includes('Cloudflare Workers Builds'), 'Worker deployment must be documented as Cloudflare Workers Builds');
must(releaseEvidence.includes('Cloudflare Pages is not the canonical frontend deployment target'), 'Release evidence must keep Cloudflare Pages retired as a frontend target');
for (const path of ['.github/workflows','tools']) {
  const files=[];
  const walk=(dir)=>{ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=`${dir}/${e.name}`; if(e.isDirectory()) walk(p); else files.push(p); } };
  walk(path);
  for(const file of files){
    const text=read(file);
    must(!/wrangler(?:@\d+)?\s+pages\s+deploy/i.test(text), `Obsolete Cloudflare Pages deploy command remains in ${file}`);
    must(!text.includes('capitalmastery.pages.dev'), `Obsolete Cloudflare Pages hostname remains in deployment tooling: ${file}`);
  }
}
console.log('PRIMARY ORIGIN AUDIT PASS: GitHub Pages is canonical and sole browser origin; Cloudflare Pages deployment path is retired; Worker deployment uses Cloudflare Workers Builds through the invite-revoke, production and admin overlays.');