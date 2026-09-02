const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
function assert(condition, message) { if (!condition) throw new Error(message); }

const appModule = `
const apps=[];
export function getApps(){return apps;}
export function getApp(){return apps[0];}
export function initializeApp(config){const app={config};apps.push(app);return app;}
`;

const authModule = `
const user={
  uid:'same-admin-uid',
  email:'admin@example.invalid',
  displayName:'Admin User',
  providerData:[{providerId:'google.com'}],
  getIdToken:async()=> 'mock-admin-token',
  reload:async()=>{}
};
const auth={currentUser:user};
let listener=null;
let linkedPassword='';
window.__cmProviderLinkProbe={links:0,passwordSignIns:0,linkedEmail:'',linkedUid:''};
export const browserLocalPersistence={kind:'local'};
export const browserSessionPersistence={kind:'session'};
export function getAuth(){return auth;}
export class GoogleAuthProvider{setCustomParameters(value){this.parameters=value;}}
export class EmailAuthProvider{static credential(email,password){return{email,password,providerId:'password'};}}
export async function getRedirectResult(){return null;}
export function onAuthStateChanged(_auth,callback){listener=callback;setTimeout(()=>callback(auth.currentUser),0);return()=>{};}
export async function linkWithCredential(target,credential){
  if(target.uid!==user.uid)throw new Error('wrong user linked');
  window.__cmProviderLinkProbe.links++;
  window.__cmProviderLinkProbe.linkedEmail=credential.email;
  window.__cmProviderLinkProbe.linkedUid=target.uid;
  linkedPassword=credential.password;
  if(!user.providerData.some(provider=>provider.providerId==='password'))user.providerData.push({providerId:'password'});
  return{user};
}
export async function signInWithEmailAndPassword(_auth,email,password){
  window.__cmProviderLinkProbe.passwordSignIns++;
  if(email!==user.email||password!==linkedPassword){const error=new Error('invalid credential');error.code='auth/invalid-credential';throw error;}
  auth.currentUser=user;
  listener?.(user);
  return{user};
}
export async function signInWithPopup(){return{user};}
export async function signInWithRedirect(){}
export async function signOut(){auth.currentUser=null;listener?.(null);}
export async function setPersistence(){}
export async function createUserWithEmailAndPassword(){throw new Error('not used');}
export async function updateProfile(){}
export async function sendPasswordResetEmail(){}
export async function deleteUser(){}
`;

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  const errors=[];
  try{
    await context.route(/\/firebase-app\.js(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'application/javascript',body:appModule}));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/,route=>{
      if(route.request().url().includes('gstatic.com'))return route.fulfill({status:200,contentType:'application/javascript',body:authModule});
      return route.continue();
    });
    await context.route(/identitytoolkit\.googleapis\.com\/v1\/projects\?key=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authorizedDomains:['127.0.0.1','localhost','sribyju.github.io','capitalmastery.pages.dev']})}));
    await context.route(/\/auth-check$/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:true})}));

    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.CM_AUTH?.ready===true&&window.CM_AUTH?.isAdmin===true,null,{timeout:15000});
    assert(await page.locator('#cm-enable-password-form').isVisible(),'Google-only account did not receive password setup form');
    const googleStatus=await page.locator('.cm-method-status').filter({hasText:'Google'}).innerText();
    assert(googleStatus.includes('Enabled ✓'),'Google provider was not reported as enabled');

    const password='LinkedPass!8294';
    await page.locator('#cm-enable-password-form input[name="password"]').fill(password);
    await page.locator('#cm-enable-password-form input[name="confirmation"]').fill(password);
    await page.locator('#cm-enable-password-form').evaluate(form=>form.requestSubmit());
    await page.waitForFunction(()=>window.__cmProviderLinkProbe?.links===1,null,{timeout:10000});
    await page.waitForFunction(()=>document.body.innerText.includes('Password sign-in enabled.'),null,{timeout:10000});
    const linked=await page.evaluate(()=>({probe:window.__cmProviderLinkProbe,uid:window.CM_AUTH.user?.uid,isAdmin:window.CM_AUTH.isAdmin,providers:window.CM_AUTH.user?.providerData?.map(item=>item.providerId)}));
    assert(linked.uid==='same-admin-uid'&&linked.probe.linkedUid===linked.uid,'Provider linking changed the Firebase identity');
    assert(linked.probe.linkedEmail==='admin@example.invalid','Password was not linked to the authenticated Google email');
    assert(linked.providers.includes('google.com')&&linked.providers.includes('password'),'Both providers were not retained on the same account');
    assert(linked.isAdmin===true,'Provider linking removed administrator authorization');

    await page.evaluate(async()=>window.CM_AUTH.signOut());
    await page.waitForFunction(()=>window.CM_AUTH?.user===null,null,{timeout:10000});
    await page.locator('#cm-full-name-onboarding').waitFor({state:'detached',timeout:10000});
    const signInForm=page.locator('#cm-signin-form');
    await signInForm.waitFor({state:'visible',timeout:10000});
    await signInForm.locator('input[name="email"]').fill('admin@example.invalid');
    await signInForm.locator('input[name="password"]').fill(password);
    await signInForm.locator('button[type="submit"]').click();
    await page.waitForFunction(()=>window.__cmProviderLinkProbe?.passwordSignIns===1,null,{timeout:10000});
    await page.waitForFunction(()=>window.CM_AUTH?.user?.uid==='same-admin-uid',null,{timeout:15000});
    await page.waitForFunction(()=>window.CM_AUTH?.backendVerified===true&&window.CM_AUTH?.isAdmin===true,null,{timeout:30000});
    const passwordLogin=await page.evaluate(()=>({uid:window.CM_AUTH.user.uid,isAdmin:window.CM_AUTH.isAdmin,probe:window.__cmProviderLinkProbe}));
    assert(passwordLogin.probe.passwordSignIns===1,'Linked password was not accepted through the normal sign-in form');
    assert(passwordLogin.uid==='same-admin-uid'&&passwordLogin.isAdmin===true,'Password sign-in did not restore the same administrator account');
    assert(errors.length===0,`Provider-linking browser errors: ${errors.join(' | ')}`);
    console.log('FIREBASE PROVIDER LINKING BROWSER AUDIT PASS: Google account added password, retained the same UID/admin role, and signed back in with email/password');
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
