const { chromium } = require('playwright');

const BASE = process.env.CM_AUDIT_URL || 'http://127.0.0.1:4173';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pageWidth(page) {
  return page.evaluate(() => ({
    inner: window.innerWidth,
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    visiblePanel: document.querySelector('[data-learner-guide-panel].active')?.getAttribute('data-learner-guide-panel') || '',
    panelWidth: document.querySelector('[data-learner-guide-panel].active')?.getBoundingClientRect().width || 0,
    shellWidth: document.querySelector('.cm-learner-guide-shell')?.getBoundingClientRect().width || 0
  }));
}

async function assertContained(page, label) {
  const m = await pageWidth(page);
  const width = Math.max(m.doc, m.body);
  assert(width <= m.inner + 2,
    `${label}: document overflow ${width}px > ${m.inner}px; panel=${m.visiblePanel} shell=${m.shellWidth.toFixed(1)} panelWidth=${m.panelWidth.toFixed(1)}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of [[375, 812], [430, 932]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', error => runtimeErrors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error' && !/Firebase|auth-check|Failed to fetch|favicon/i.test(msg.text())) runtimeErrors.push(msg.text());
      });

      await page.goto(`${BASE}/#/learner-guide`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('[data-learner-guide-tab]', { timeout: 15000 });
      await page.waitForTimeout(250);
      await assertContained(page, `Learner Guide initial @ ${width}`);

      const ids = await page.locator('[data-learner-guide-tab]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-learner-guide-tab')));
      assert(JSON.stringify(ids) === JSON.stringify(['role','sequence','work','change','proof']),
        `Learner Guide panel set changed unexpectedly @ ${width}: ${JSON.stringify(ids)}`);

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const button = page.locator(`[data-learner-guide-tab="${id}"]`);
        if (i % 2 === 0) {
          await button.focus();
          await page.keyboard.press('Enter');
        } else {
          await button.click();
        }
        await page.waitForTimeout(100);

        assert(await page.locator(`[data-learner-guide-panel="${id}"].active`).count() === 1,
          `Learner Guide ${id} did not become the single active panel @ ${width}`);
        assert(await button.getAttribute('aria-selected') === 'true',
          `Learner Guide ${id} did not expose selected state @ ${width}`);
        await assertContained(page, `Learner Guide ${id} @ ${width}`);

        if (id === 'work') {
          const workbook = page.locator('.cm-guide-workbook');
          assert(await workbook.count() === 1, `Workbook panel missing @ ${width}`);
          const wb = await workbook.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth, overflowX: getComputedStyle(node).overflowX }));
          assert(wb.client <= width && ['auto','scroll'].includes(wb.overflowX),
            `Workbook must contain its own wide sheet @ ${width}: ${JSON.stringify(wb)}`);
        }
      }

      assert(runtimeErrors.length === 0, `Learner Guide runtime errors @ ${width}: ${[...new Set(runtimeErrors)].join(' | ')}`);
      await context.close();
    }

    console.log('LEARNER GUIDE ALL-PANEL MOBILE BROWSER AUDIT PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
