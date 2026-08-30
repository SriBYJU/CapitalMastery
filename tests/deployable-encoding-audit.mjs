import fs from 'node:fs';
import path from 'node:path';

const must=(v,m)=>{if(!v)throw new Error(m);};
const textExt=new Set(['.js','.css','.html','.webmanifest','.json','.xml','.txt','.svg']);
const index=fs.readFileSync('index.html','utf8');
const required=['index.html','404.html','manifest.webmanifest','robots.txt','sitemap.xml'];
const refs=[...index.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map(m=>m[1].split(/[?#]/,1)[0].replace(/^\.\//,''))
  .filter(x=>x&&!x.startsWith('#')&&!/^(?:https?:|data:|mailto:|tel:)/i.test(x));
const files=new Set([...required,...refs.filter(x=>!x.startsWith('assets/'))]);
function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.posix.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(textExt.has(path.extname(entry.name).toLowerCase())) files.add(p);
  }
}
walk('assets');

const signatures=[
  ['latin1-utf8-leading-a-circumflex','â'],
  ['latin1-utf8-leading-a-circumflex-upper','Â'],
  ['replacement-sequence','ï¿½'],
  ['broken-emoji-prefix','ðŸ'],
  ['unicode-replacement-character','�']
];
const failures=[];
for(const file of [...files].sort()){
  must(fs.existsSync(file),`Deployable text dependency missing: ${file}`);
  if(!textExt.has(path.extname(file).toLowerCase())) continue;
  const text=fs.readFileSync(file,'utf8');
  for(const [label,needle] of signatures){
    let from=0,count=0;
    while((from=text.indexOf(needle,from))>=0){count++;from+=needle.length;}
    if(count) failures.push(`${file}: ${label} x${count}`);
  }
}
if(failures.length){
  throw new Error(`Deployable mojibake / encoding corruption detected:\n${failures.join('\n')}`);
}
console.log(`DEPLOYABLE ENCODING AUDIT PASS: ${files.size} production text files contain no known mojibake signatures`);