import fs from 'node:fs';
import vm from 'node:vm';
const data=fs.readFileSync(new URL('../data.js',import.meta.url),'utf8');
const learnerGuideCode=fs.readFileSync(new URL('../learner-guide.js',import.meta.url),'utf8');
const appCode=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
class Store{m=new Map();getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const appEl={innerHTML:''};
const dummy=()=>({innerHTML:'',hidden:false,className:'',style:{},value:'',dataset:{},disabled:false,appendChild(){},remove(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},select(){},click(){},getContext(){return {fillRect(){},strokeRect(){},fillText(){},measureText(){return{width:10}},drawImage(){},scale(){}}},toDataURL(){return'data:image/png;base64,'}});
let hashHandler=()=>{};
const document={title:'',body:{appendChild(){}},getElementById(id){return id==='app'?appEl:dummy()},querySelector(){return dummy()},querySelectorAll(){return[]},createElement(){return dummy()},execCommand(){return true}};
const location={hash:'',origin:'http://localhost:8765',pathname:'/'};
const localStorage=new Store(),sessionStorage=new Store();
const windowObj={CM_DATA:null,addEventListener(type,fn){if(type==='hashchange')hashHandler=fn},scrollTo(){},open(){},print(){}};
const ctx={window:windowObj,document,location,localStorage,sessionStorage,navigator:{clipboard:{writeText:async()=>{}}},console,Intl,Date,Math,URLSearchParams,URL:{createObjectURL(){return'blob:x'},revokeObjectURL(){}},Blob:class{},Image:class{},XMLSerializer:class{serializeToString(){return''}},confirm(){return true},setTimeout(){},clearTimeout(){}};
windowObj.window=windowObj;Object.assign(windowObj,{document,location,localStorage,sessionStorage,navigator:ctx.navigator,console,Intl,Date,Math,URLSearchParams,URL:ctx.URL,Blob:ctx.Blob,Image:ctx.Image,XMLSerializer:ctx.XMLSerializer,confirm:ctx.confirm,setTimeout:ctx.setTimeout});
vm.createContext(ctx);vm.runInContext(data,ctx);windowObj.CM_DATA=ctx.window.CM_DATA;vm.runInContext(learnerGuideCode,ctx);vm.runInContext(appCode,ctx);
localStorage.setItem('capitalMasteryQaPreviewV1','true');
const ids=ctx.window.CM_DATA.careers.map(c=>c.id);
const routes=['','learner-guide','careers','credentials','passport','compare','about','methodology','login','privacy','terms','disclaimer','credential-policy','admin-preview'];
for(const id of ids){routes.push(`career/${id}`);for(let p=1;p<=5;p++)routes.push(`learn/${id}/${p}`);routes.push(`simulation/${id}`);routes.push(`final/${id}`);for(const t of ['foundations','applied','career'])routes.push(`certificate/${id}/${t}`);}
for(const r of routes){location.hash='#/'+r;hashHandler();if(!appEl.innerHTML||appEl.innerHTML.includes('Something went wrong.')){console.error('Route failed:',r);process.exit(1)}}
console.log('RUNTIME SMOKE PASS:',routes.length,'routes rendered in QA mode without runtime exception.');
