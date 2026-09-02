const { chromium } = require('playwright');

const BASE=process.env.CM_AUDIT_URL||'http://127.0.0.1:4173';
const WORKER='https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const routes=['#/','#/careers','#/career/investment-banking','#/learner-guide','#/employers','#/trust','#/about','#/credentials','#/privacy','#/terms'];
const viewports=[[320,568],[375,812],[430,932],[768,1024],[1024,768],[1440,1000]];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

function authStub(){return `(()=>{const user={uid:'contrast-audit',email:'contrast@example.invalid',displayName:'Contrast Audit'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'contrast-token',signOut:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0)})();`;}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  try {
    await context.addInitScript(()=>localStorage.setItem('cmCredentialNameOnboardedV3:contrast-audit','true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:authStub()}));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};'}));
    await context.route(`${WORKER}/**`,route=>{
      const path=new URL(route.request().url()).pathname;
      const payload=path==='/credentials/me'?{ok:true,credentials:[],programCompletions:[]}:path.startsWith('/progress/')?{ok:true,progress:[]}:{ok:true};
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
    });
    const page=await context.newPage();
    await page.goto(`${BASE}/#/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#app main#main',{timeout:15000});
    const violations=[];
    for(const [width,height] of viewports){
      await page.setViewportSize({width,height});
      for(const hash of routes){
        await page.evaluate(value=>{location.hash=value;},hash);
        await page.waitForTimeout(220);
        const found=await page.evaluate(()=>{
          function rgba(value){const match=String(value).match(/rgba?\(([^)]+)\)/);if(!match)return null;const parts=match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);return {r:parts[0],g:parts[1],b:parts[2],a:Number.isFinite(parts[3])?parts[3]:1};}
          function composite(fg,bg){const a=fg.a+bg.a*(1-fg.a);return {r:(fg.r*fg.a+bg.r*bg.a*(1-fg.a))/a,g:(fg.g*fg.a+bg.g*bg.a*(1-fg.a))/a,b:(fg.b*fg.a+bg.b*bg.a*(1-fg.a))/a,a};}
          function background(el){let result={r:255,g:255,b:255,a:1};const layers=[];for(let node=el;node;node=node.parentElement){const style=getComputedStyle(node);if(style.backgroundImage&&style.backgroundImage!=='none')return null;const color=rgba(style.backgroundColor);if(color&&color.a>0)layers.push(color);}for(let i=layers.length-1;i>=0;i--)result=composite(layers[i],result);return result;}
          function lum(c){const v=[c.r,c.g,c.b].map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
          function ratio(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
          return [...document.querySelectorAll('body *')].flatMap(el=>{
            if(![...el.childNodes].some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim()))return [];
            const style=getComputedStyle(el),rect=el.getBoundingClientRect();
            if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||rect.width<1||rect.height<1)return [];
            const fg=rgba(style.color),bg=background(el);if(!fg||!bg)return [];
            const actual=ratio(composite(fg,bg),bg),size=parseFloat(style.fontSize)||16,weight=parseInt(style.fontWeight)||400;
            const large=size>=24||(size>=18.66&&weight>=700),required=large?3:4.5;
            if(actual+0.05>=required)return [];
            return [{text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,110),ratio:Number(actual.toFixed(2)),required,fg:style.color,bg:`rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,tag:el.tagName.toLowerCase(),className:String(el.className||'').slice(0,90)}];
          });
        });
        for(const issue of found) violations.push({route:hash,viewport:`${width}x${height}`,...issue});
      }
    }
    const unique=[...new Map(violations.map(item=>[`${item.route}|${item.text}|${item.fg}|${item.bg}`,item])).values()];
    assert(unique.length===0,`WCAG text contrast failures (${unique.length} unique):\n${unique.slice(0,80).map(x=>JSON.stringify(x)).join('\n')}`);
    console.log(`VISUAL CONTRAST BROWSER AUDIT PASS: ${routes.length} routes across ${viewports.length} responsive viewports`);
  } finally {await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
