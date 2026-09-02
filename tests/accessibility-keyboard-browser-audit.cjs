const { chromium } = require('playwright');

const BASE = String(process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';
const routes = ['#/','#/careers','#/career/investment-banking','#/learner-guide','#/employers','#/trust','#/about','#/credentials','#/privacy','#/terms'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function authStub() {
  return `(()=>{const user={uid:'a11y-audit',email:'a11y@example.invalid',displayName:'Accessibility Audit'};window.CM_AUTH={ready:true,user,isAdmin:false,backendVerified:true,getIdToken:async()=> 'a11y-token',signOut:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user,isAdmin:false,backendVerified:true}})),0)})();`;
}

function signedOutAuthStub() {
  return `(()=>{window.CM_AUTH={ready:true,user:null,isAdmin:false,backendVerified:false,getIdToken:async()=>null,signOut:async()=>{}};setTimeout(()=>document.dispatchEvent(new CustomEvent('cm-auth-changed',{detail:{user:null,isAdmin:false,backendVerified:false}})),0)})();`;
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{ width:375, height:812 } });
  try {
    await context.addInitScript(() => localStorage.setItem('cmCredentialNameOnboardedV3:a11y-audit', 'true'));
    await context.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({ status:200, contentType:'application/javascript', body:authStub() }));
    await context.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({ status:200, contentType:'application/javascript', body:'window.CM_SYNC={ready:true,status:"synced",flush:async()=>true};' }));
    await context.route(`${WORKER}/**`, route => {
      const path = new URL(route.request().url()).pathname;
      const payload = path === '/credentials/me' ? { ok:true, credentials:[], programCompletions:[] } : path.startsWith('/progress/') ? { ok:true, progress:[] } : { ok:true };
      return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(payload) });
    });

    const page = await context.newPage();
    await page.goto(`${BASE}/#/`, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForSelector('#app main#main', { timeout:15000 });

    const violations = [];
    for (const hash of routes) {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForTimeout(260);
      const found = await page.evaluate(() => {
        const visible = element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
        };
        const text = element => String(element.textContent || '').replace(/\s+/g, ' ').trim();
        const label = element => {
          const ids = String(element.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
          const labelled = ids.map(id => text(document.getElementById(id) || {})).join(' ').trim();
          return String(element.getAttribute('aria-label') || labelled || element.labels?.[0]?.textContent || element.closest('label')?.textContent || element.getAttribute('title') || text(element) || element.querySelector('img[alt]')?.alt || '').trim();
        };
        const issues = [];
        if (document.documentElement.lang !== 'en') issues.push('Document language is not en');
        const main = document.querySelector('main#main');
        if (!main || main.getAttribute('tabindex') !== '-1') issues.push('Main landmark is not programmatically focusable');
        const h1 = [...document.querySelectorAll('h1')].filter(visible);
        if (h1.length !== 1) issues.push(`Expected one visible h1, found ${h1.length}`);
        const skip = document.querySelector('.skip-link[href="#main"]');
        if (!skip) issues.push('Skip-to-content target is missing');
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id).filter(Boolean);
        for (const id of new Set(ids)) if (ids.filter(value => value === id).length > 1) issues.push(`Duplicate id: ${id}`);
        for (const image of [...document.querySelectorAll('img')].filter(visible)) if (!image.hasAttribute('alt')) issues.push(`Visible image missing alt: ${image.src}`);
        for (const element of [...document.querySelectorAll('a[href],button,[role="button"]')].filter(visible)) {
          if (!label(element)) issues.push(`Interactive element has no accessible name: ${element.outerHTML.slice(0, 160)}`);
          if (element.getAttribute('role') === 'button' && !/^(?:BUTTON|A)$/.test(element.tagName) && element.tabIndex < 0) issues.push(`Custom button is not keyboard reachable: ${element.outerHTML.slice(0, 160)}`);
        }
        for (const control of [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(visible)) if (!label(control)) issues.push(`Form control has no accessible label: ${control.outerHTML.slice(0, 160)}`);
        for (const element of [...document.querySelectorAll('[tabindex]')]) if (Number(element.getAttribute('tabindex')) > 0) issues.push(`Positive tabindex found: ${element.outerHTML.slice(0, 160)}`);
        for (const element of [...document.querySelectorAll('[aria-hidden="true"]')]) if (element.matches('a[href],button,input,select,textarea,[tabindex]') && element.tabIndex >= 0) issues.push(`aria-hidden element remains focusable: ${element.outerHTML.slice(0, 160)}`);
        return issues;
      });
      for (const issue of found) violations.push(`${hash}: ${issue}`);
    }

    await page.evaluate(() => { location.hash = '#/'; });
    await page.waitForTimeout(220);
    const opener = page.locator('.mobile-menu');
    await opener.focus();
    await opener.click();
    const dialog = page.locator('#cm-modal [role="dialog"]');
    await dialog.waitFor({ state:'visible', timeout:3000 });
    assert(await dialog.getAttribute('aria-modal') === 'true', 'Mobile menu dialog missing aria-modal');
    const modalState = await page.evaluate(() => {
      const dialog = document.querySelector('#cm-modal [role="dialog"]');
      const labelledBy = dialog?.getAttribute('aria-labelledby');
      return { labelled:Boolean(labelledBy && document.getElementById(labelledBy)?.textContent?.trim()), focusInside:Boolean(dialog?.contains(document.activeElement)) };
    });
    assert(modalState.labelled, 'Mobile menu dialog has no resolved accessible name');
    assert(modalState.focusInside, 'Opening the mobile menu did not move focus inside the dialog');
    await dialog.press('Escape');
    assert(await page.locator('#cm-modal').count() === 0, 'Escape did not close the mobile menu dialog');
    assert(await opener.evaluate(element => document.activeElement === element), 'Closing the dialog did not restore focus to its opener');

    const guestContext = await browser.newContext({ viewport:{ width:1280, height:720 } });
    try {
      await guestContext.route(/\/firebase-auth\.js(?:\?.*)?$/, route => route.fulfill({ status:200, contentType:'application/javascript', body:signedOutAuthStub() }));
      await guestContext.route(/\/firebase-sync\.js(?:\?.*)?$/, route => route.fulfill({ status:200, contentType:'application/javascript', body:'window.CM_SYNC={ready:true,status:"guest",flush:async()=>true};' }));
      const guestPage = await guestContext.newPage();
      await guestPage.goto(`${BASE}/#/`, { waitUntil:'domcontentloaded', timeout:30000 });
      await guestPage.waitForSelector('#app main#main', { timeout:15000 });
      const learningOpener = guestPage.getByRole('navigation', { name:'Primary' }).getByRole('link', { name:'Careers', exact:true }).first();
      await learningOpener.click();
      const learningGate = guestPage.locator('#cm-learning-gate [role="dialog"]');
      await learningGate.waitFor({ state:'visible', timeout:3000 });
      const gateState = await guestPage.evaluate(() => {
        const dialog = document.querySelector('#cm-learning-gate [role="dialog"]');
        const labelledBy = dialog?.getAttribute('aria-labelledby');
        return { labelled:Boolean(labelledBy && document.getElementById(labelledBy)?.textContent?.trim()), focusInside:Boolean(dialog?.contains(document.activeElement)), tabIndex:dialog?.getAttribute('tabindex') };
      });
      assert(gateState.labelled, 'Signed-out learning gate has no resolved accessible name');
      assert(gateState.focusInside, 'Signed-out learning gate did not move focus inside the dialog');
      assert(gateState.tabIndex === '-1', 'Signed-out learning gate dialog is not programmatically focusable');
      await learningGate.press('Escape');
      assert(await guestPage.locator('#cm-learning-gate').count() === 0, 'Escape did not close the signed-out learning gate');
      assert(await learningOpener.evaluate(element => document.activeElement === element), 'Signed-out learning gate did not return focus to its opener');
    } finally {
      await guestContext.close();
    }

    assert(violations.length === 0, `Accessibility structure violations (${violations.length}):\n${[...new Set(violations)].slice(0, 100).join('\n')}`);
    console.log(`ACCESSIBILITY KEYBOARD BROWSER AUDIT PASS: ${routes.length} public routes plus shared and account-gate modal naming, focus entry, Escape and focus return`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
