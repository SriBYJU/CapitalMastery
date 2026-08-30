import fs from 'node:fs';
const path='tests/failure-seeking-browser-audit.mjs';
let src=fs.readFileSync(path,'utf8');
const from=`async function assertNoOverflow(page,label) {
  const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert(Math.max(metrics.doc,metrics.body)<=metrics.innerWidth+2,\`${'${label}'}: horizontal overflow ${'${Math.max(metrics.doc,metrics.body)}'}px > ${'${metrics.innerWidth}'}px\`);
}`;
const to=`async function assertNoOverflow(page,label) {
  const metrics=await page.evaluate(()=>{
    const innerWidth=window.innerWidth;
    const offenders=[...document.querySelectorAll('body *')].map(el=>{
      const r=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      return {
        tag:el.tagName.toLowerCase(),
        id:el.id||'',
        cls:String(el.className||'').slice(0,180),
        left:Math.round(r.left),
        right:Math.round(r.right),
        width:Math.round(r.width),
        scrollWidth:el.scrollWidth,
        overflowX:style.overflowX,
        display:style.display,
        text:(el.textContent||'').trim().replace(/\\s+/g,' ').slice(0,90)
      };
    }).filter(x=>x.right>innerWidth+2||x.left<-2||x.width>innerWidth+2)
      .sort((a,b)=>Math.max(b.right-innerWidth,b.width-innerWidth)-Math.max(a.right-innerWidth,a.width-innerWidth))
      .slice(0,12);
    return {innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,offenders};
  });
  assert(Math.max(metrics.doc,metrics.body)<=metrics.innerWidth+2,
    \`${'${label}'}: horizontal overflow ${'${Math.max(metrics.doc,metrics.body)}'}px > ${'${metrics.innerWidth}'}px; offenders=${'${JSON.stringify(metrics.offenders)}'}\`);
}`;
if(src.includes(to)) {
  console.log('Browser overflow diagnostics already instrumented.');
} else {
  if(!src.includes(from)) throw new Error('Overflow diagnostic patch target not found');
  src=src.replace(from,to);
  fs.writeFileSync(path,src);
  console.log('Browser overflow diagnostics instrumented.');
}
