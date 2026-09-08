import { chromium, firefox, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const browser = await ({ chromium, firefox, webkit }[process.env.QA_BROWSER || 'webkit']).launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
let checked = 0;
let hidden = 0;
let excluded = 0;
try {
  if (process.env.QA_DOCUMENT) {
    const document = JSON.parse(await readFile(process.env.QA_DOCUMENT, 'utf8'));
    const catalog = [{ id: 'home', title: 'Home', slug: 'home', path: '/', published: true, sections: [] }];
    await page.route('**/api/site-settings', route => route.fulfill({ json: { draft: document.siteSettings?.draft || { enabled: false } } }));
    await page.route('**/api/site?*', route => route.fulfill({ json: { data: document.draft, page: catalog[0], pages: catalog, catalog, homepageId: 'home' } }));
    await page.route('**/api/site', route => route.fulfill({ json: { catalog } }));
  }
  await page.goto(`${origin}/fixtures`);
  const keys = process.env.QA_DOCUMENT ? ['document'] : process.env.QA_COMPONENTS?.split(',') || await page.locator('[data-fixture-controls] option').allTextContents();
  for (const key of keys) {
    await page.goto(process.env.QA_DOCUMENT ? `${origin}/fixtures?mode=studio` : `${origin}/fixtures?component=${key}&mode=editor`, { waitUntil: 'networkidle' });
    const frame = page.frameLocator('iframe');
    await frame.locator('[data-puck-component]').first().waitFor();
    const fields = frame.locator('[contenteditable]');
    const count = await fields.count();
    for (let index = 0; index < count; index++) {
      const field = fields.nth(index);
      if (process.env.QA_NESTED_ONLY === '1' && !await field.evaluate(el => Boolean(el.closest('[data-puck-component]')?.parentElement?.closest('[data-puck-component]')))) { excluded++; continue; }
      if (!await field.isVisible()) { hidden++; continue; }
      try {
        await field.hover({ timeout: 3000 });
        await page.waitForTimeout(100);
        await field.click({ timeout: 3000 });
        await field.press('End');
        await field.evaluate(el => { window.originalEditable = el; window.originalScroll = window.scrollY; });
        for (const character of 'XYZ') {
          await page.keyboard.type(character);
          await page.waitForTimeout(100);
          assert.equal(await field.evaluate(el => el === window.originalEditable && document.activeElement === el), true, 'focus and node identity');
        }
        checked++;
      } catch (error) { failures.push({ key, index, error: error.message, state: await field.evaluate(el => ({ same: el === window.originalEditable, connected: window.originalEditable?.isConnected, active: document.activeElement?.outerHTML.slice(0, 160), block: el.closest('[data-puck-component]')?.getAttribute('data-puck-component'), parent: el.parentElement?.outerHTML.slice(0, 250), scroll: window.scrollY, before: window.originalScroll })) }); }
    }
    console.log(JSON.stringify({ key, fields: count, failures: failures.filter(f => f.key === key) }));
  }
} finally { await browser.close(); }
assert.ok(checked + failures.length > 0, 'at least one editable field was exercised');
console.log(JSON.stringify({ checked, hidden, excluded, failures }));
process.exitCode = failures.length ? 1 : 0;
