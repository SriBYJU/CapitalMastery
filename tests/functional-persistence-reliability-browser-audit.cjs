const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';
const WORKER = 'https://capital-mastery-api.avadhanula-shriyan.workers.dev';

(async () => {
  const browser = await chromium.launch({ headless:true });
  try {
    for (const viewport of [
      { width:320, height:720 },
      { width:768, height:900 },
      { width:1440, height:1000 }
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(String(error)));
      await page.goto(BASE, { waitUntil:'domcontentloaded' });
      await page.waitForFunction(() => !!window.CM_RELIABILITY, null, { timeout:10000 });

      // Explicit errors must be visible, readable and contained on every target viewport.
      await page.evaluate(() => window.CM_RELIABILITY.report('audit-visible', 'Synthetic save failure for browser reliability audit.', { severity:'error', detail:'No user data was changed.' }));
      const banner = page.locator('#cm-functional-reliability');
      await banner.waitFor({ state:'visible' });
      assert.match(await banner.innerText(), /Save \/ sync needs attention/);
      assert.match(await banner.innerText(), /Synthetic save failure/);
      const box = await banner.boundingBox();
      assert.ok(box, 'Reliability banner must have a rendered box.');
      assert.ok(box.x >= -1 && box.x + box.width <= viewport.width + 1, `Reliability banner overflowed width ${viewport.width}.`);
      await page.evaluate(() => window.CM_RELIABILITY.clear('audit-visible'));
      await page.waitForFunction(() => document.getElementById('cm-functional-reliability')?.hidden === true);

      // Cross-device sync failure must surface, and a later confirmed sync must clear it.
      await page.evaluate(() => document.dispatchEvent(new CustomEvent('cm-sync-changed', { detail:{ status:'error', error:'Synthetic Firestore outage' } })));
      await banner.waitFor({ state:'visible' });
      assert.match(await banner.innerText(), /Synthetic Firestore outage/);
      assert.match(await banner.innerText(), /Retry now/);
      await page.evaluate(() => document.dispatchEvent(new CustomEvent('cm-sync-changed', { detail:{ status:'synced', error:null } })));
      await page.waitForFunction(() => document.getElementById('cm-functional-reliability')?.hidden === true);

      // Storage becoming unavailable after startup may never fail silently.
      await page.evaluate(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (String(key).startsWith('cmStorageHealth:')) throw new Error('Synthetic quota/storage denial');
          return original.call(this, key, value);
        };
        try { window.CM_RELIABILITY.storageHealthCheck(); }
        finally { Storage.prototype.setItem = original; }
      });
      await banner.waitFor({ state:'visible' });
      assert.match(await banner.innerText(), /blocking Capital Mastery from saving progress/i);
      await page.evaluate(() => window.CM_RELIABILITY.clear('browser-storage'));

      // Failed authenticated server mutations must be visible and remain failed to the caller.
      await page.route(`${WORKER}/**`, route => route.fulfill({ status:503, contentType:'application/json', body:JSON.stringify({ ok:false, error:'Synthetic D1 unavailable' }) }));
      const serverResult = await page.evaluate(async worker => {
        const previous = window.CM_AUTH?.user || null;
        window.CM_AUTH ||= {};
        window.CM_AUTH.user = { uid:'reliability-browser-test' };
        try {
          const response = await fetch(`${worker}/enterprise/organizations`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'Never Saved'}) });
          return { ok:response.ok, status:response.status };
        } finally {
          window.CM_AUTH.user = previous;
        }
      }, WORKER);
      assert.equal(serverResult.ok, false);
      assert.equal(serverResult.status, 503);
      await banner.waitFor({ state:'visible' });
      assert.match(await banner.innerText(), /server change was not saved/i);
      await page.evaluate(() => window.CM_RELIABILITY.clear('server-write'));

      assert.deepEqual(pageErrors, [], `Unexpected page errors at ${viewport.width}px: ${pageErrors.join('\n')}`);
      await context.close();
    }
    console.log('Functional persistence reliability browser audit passed.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
