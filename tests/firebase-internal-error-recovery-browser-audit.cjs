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
window.__cmAuthRecoveryProbe={popup:0,redirect:0,email:0,signOut:0,localPersistence:0,sessionPersistence:0};
export const browserLocalPersistence={kind:'local'};
export const browserSessionPersistence={kind:'session'};
export function getAuth(){return auth;}
export class GoogleAuthProvider{setCustomParameters(value){this.parameters=value;}}
export async function getRedirectResult(){return null;}
export function onAuthStateChanged(_auth,callback){listener=callback;setTimeout(()=>callback(null),0);return()=>{};}
export async function signInWithPopup(){window.__cmAuthRecoveryProbe.popup++;const error=new Error('Firebase: Error (auth/internal-error).');error.code='auth/internal-error';throw error;}
export async function signInWithRedirect(){window.__cmAuthRecoveryProbe.redirect++;}
export async function signOut(){window.__cmAuthRecoveryProbe.signOut++;auth.currentUser=null;listener?.(null);}
export async function setPersistence(_auth,persistence){if(persistence===browserLocalPersistence)window.__cmAuthRecoveryProbe.localPersistence++;else window.__cmAuthRecoveryProbe.sessionPersistence++;}
export async function signInWithEmailAndPassword(){window.__cmAuthRecoveryProbe.email++;if(window.__cmAuthRecoveryProbe.email===1){const error=new Error('Firebase: Error (auth/internal-error).');error.code='auth/internal-error';throw error;}if(window.__cmAuthRecoveryProbe.email===3){const error=new Error('Firebase: Error (auth/network-request-failed).');error.code='auth/network-request-failed';throw error;}return{user:{uid:'recovered-admin',email:'admin@example.invalid',displayName:'Recovered Admin',getIdToken:async()=> 'mock-token'}};}
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
      if(route.request().url().includes('gstatic.com')) return route.fulfill({status:200,contentType:'application/javascript',body:authModule});
      return route.continue();
    });
    await context.route(/identitytoolkit\.googleapis\.com\/v1\/projects\?key=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authorizedDomains:['127.0.0.1','localhost','sribyju.github.io','capitalmastery.pages.dev']})}));
    await context.route(/\/auth-check$/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,isAdmin:true})}));

    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${BASE.replace(/\/$/,'')}/#/login`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.CM_AUTH?.ready===true,null,{timeout:15000});
    await page.locator('[data-cm-auth-action="google"]').click();
    await page.waitForFunction(()=>window.__cmAuthRecoveryProbe?.redirect===1,null,{timeout:10000});
    const google=await page.evaluate(()=>window.__cmAuthRecoveryProbe);
    assert(google.popup===1,'Google sign-in did not attempt the normal popup first');
    assert(google.redirect===1,'auth/internal-error did not fall back to same-tab redirect');
    assert(google.signOut>=1&&google.localPersistence>=1,'Google recovery did not refresh the Firebase auth session');

    const email=await page.evaluate(async()=>{
      const user=await window.CM_AUTH.emailSignIn('admin@example.invalid','correct-password');
      return {uid:user?.uid||'',probe:window.__cmAuthRecoveryProbe};
    });
    assert(email.uid==='recovered-admin','Email/password recovery did not return the authenticated user');
    assert(email.probe.email===2,'Email/password auth/internal-error did not receive exactly one retry');
    assert(email.probe.signOut>=2&&email.probe.localPersistence>=2,'Email/password recovery did not refresh the Firebase auth session');
    const network=await page.evaluate(async()=>{
      const user=await window.CM_AUTH.emailSignIn('admin@example.invalid','correct-password');
      return {uid:user?.uid||'',probe:window.__cmAuthRecoveryProbe};
    });
    assert(network.uid==='recovered-admin','Transient network recovery did not return the authenticated user');
    assert(network.probe.email===4,'Email/password network failure did not receive exactly one retry');
    assert(errors.length===0,`Firebase recovery browser errors: ${errors.join(' | ')}`);
    console.log('FIREBASE AUTH RECOVERY BROWSER AUDIT PASS: popup internal error falls back to same-tab redirect; email/password internal and transient network errors refresh auth and retry exactly once');
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
