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
const auth={currentUser:null};
let listener=null;
window.__cmDirectGoogleProbe={firebaseExchanges:0,idToken:'',uid:''};
export const browserLocalPersistence={kind:'local'};
export const browserSessionPersistence={kind:'session'};
export function getAuth(){return auth;}
export class GoogleAuthProvider{
  setCustomParameters(value){this.parameters=value;}
  static credential(idToken){return{providerId:'google.com',idToken};}
}
export class EmailAuthProvider{static credential(email,password){return{providerId:'password',email,password};}}
export async function getRedirectResult(){return null;}
export function onAuthStateChanged(_auth,callback){listener=callback;setTimeout(()=>callback(null),0);return()=>{};}
export async function signInWithCredential(_auth,credential){
  window.__cmDirectGoogleProbe.firebaseExchanges++;
  window.__cmDirectGoogleProbe.idToken=credential.idToken;
  const user={uid:'direct-google-admin-uid',email:'admin@example.invalid',displayName:'Direct Google Admin',providerData:[{providerId:'google.com'}],getIdToken:async()=> 'mock-firebase-token',reload:async()=>{}};
  window.__cmDirectGoogleProbe.uid=user.uid;
  auth.currentUser=user;
  listener?.(user);
  return{user};
}
export async function signInWithPopup(){throw new Error('legacy popup must not be the primary path');}
export async function signInWithRedirect(){throw new Error('legacy redirect must not be the primary path');}
export async function signInWithEmailAndPassword(){throw new Error('not used');}
export async function linkWithCredential(){throw new Error('not used');}
export async function signOut(){auth.currentUser=null;listener?.(null);}
export async function setPersistence(){}
export async function createUserWithEmailAndPassword(){throw new Error('not used');}
export async function updateProfile(){}
export async function sendPasswordResetEmail(){}
export async function deleteUser(){}
`;

const googleIdentityModule = `
window.__cmGoogleIdentityProbe={initialized:0,rendered:0,clientId:'',configuration:null};
let configuration=null;
window.google={accounts:{id:{
  initialize(value){configuration=value;window.__cmGoogleIdentityProbe.initialized++;window.__cmGoogleIdentityProbe.clientId=value.client_id;window.__cmGoogleIdentityProbe.configuration={auto_select:value.auto_select,ux_mode:value.ux_mode};},
  renderButton(mount){window.__cmGoogleIdentityProbe.rendered++;const button=document.createElement('button');button.id='cm-direct-google-probe';button.type='button';button.textContent='Continue with Google';button.addEventListener('click',()=>configuration.callback({credential:'signed-google-id-token'}));mount.appendChild(button);}
}}};
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
    await context.route(/accounts\.google\.com\/gsi\/client/,route=>route.fulfill({status:200,contentType:'application/javascript',body:googleIdentityModule}));
    await context.route(/identitytoolkit\.googleapis\.com\/v1\/projects\?key=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authorizedDomains:['127.0.0.1','localhost','sribyju.github.io','capitalmastery.pages.dev']})}));
    await context.route(/\/auth-check$/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:true})}));

    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.CM_AUTH?.ready===true&&window.__cmGoogleIdentityProbe?.rendered===1,null,{timeout:15000});
    assert(await page.locator('#cm-direct-google-probe').isVisible(),'Official direct Google button did not render');
    const initialized=await page.evaluate(()=>window.__cmGoogleIdentityProbe);
    assert(initialized.initialized===1,'Google Identity Services was not initialized exactly once');
    assert(initialized.clientId==='13730226275-bqn30lg5j96fm52k2387qojgthmrrbki.apps.googleusercontent.com','Google Identity Services used the wrong OAuth client');
    assert(initialized.configuration.auto_select===false&&initialized.configuration.ux_mode==='popup','Direct Google sign-in was not configured for explicit user choice');

    await page.locator('#cm-direct-google-probe').click();
    await page.waitForFunction(()=>window.CM_AUTH?.user?.uid==='direct-google-admin-uid'&&window.CM_AUTH?.isAdmin===true,null,{timeout:10000});
    const result=await page.evaluate(()=>({probe:window.__cmDirectGoogleProbe,uid:window.CM_AUTH.user?.uid,isAdmin:window.CM_AUTH.isAdmin}));
    assert(result.probe.firebaseExchanges===1&&result.probe.idToken==='signed-google-id-token','Google ID token was not exchanged exactly once with Firebase');
    assert(result.uid==='direct-google-admin-uid'&&result.isAdmin===true,'Direct Google sign-in did not establish the verified administrator identity');
    assert(errors.length===0,`Direct Google browser errors: ${errors.join(' | ')}`);
    console.log('FIREBASE DIRECT GOOGLE BROWSER AUDIT PASS: official Google ID token exchanged directly for the verified Firebase administrator identity');
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
