import fs from 'node:fs';
function ok(value,message){if(!value)throw new Error(message);}

const index=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('employer-mobile-stability.css','utf8');
const build=fs.readFileSync('tools/build-pages.mjs','utf8');

ok(index.includes('employer-mobile-stability.css?v=20260830-stability1'),'Employer mobile stability stylesheet must be cache-busted and loaded after enterprise-v2.css');
ok(index.indexOf('enterprise-v2.css') < index.indexOf('employer-mobile-stability.css'),'Employer stability overrides must load after the enterprise base stylesheet');
ok(css.includes('.cmv2-public-tour-shell > *') && css.includes('min-width: 0') && css.includes('max-width: 100%'),'Employer walkthrough grid items must be allowed to shrink below intrinsic content width');
ok(css.includes('grid-template-columns: minmax(0, 1fr)'),'Single-column employer responsive grids must use minmax(0,1fr), not shrink-resistant 1fr');
ok(css.includes('repeat(2, minmax(0, 1fr))'),'Two-column employer responsive grids must use shrinkable minmax tracks');
ok(css.includes('.cmv2-tour-program') && css.includes('overflow-x: auto') && css.includes('overscroll-behavior-inline: contain'),'The intentionally wide employer program timeline must own its horizontal scroll');
ok(!css.includes('body {') && !css.includes('overflow-x: hidden'),'Employer mobile fix must not hide page-level overflow symptoms');
ok(build.includes('referencedFiles') && build.includes('indexHtml.matchAll'),'Pages build must discover the new linked stylesheet from index.html');

console.log('EMPLOYER MOBILE CONTAINMENT AUDIT PASS');
