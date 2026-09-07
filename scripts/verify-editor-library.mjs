import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${origin}/fixtures`, { waitUntil: 'networkidle' });
const allKeys = await page.locator('[data-fixture-controls] option').allTextContents();
assert.equal(allKeys.length, 93);
const keys = process.env.QA_COMPONENTS ? process.env.QA_COMPONENTS.split(',') : allKeys;
const results = [];
for (const key of keys) {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    await page.goto(`${origin}/fixtures?component=${key}&mode=editor`, { waitUntil: 'networkidle' });
    const frame = page.frames().find(frame => frame !== page.mainFrame());
    assert.ok(frame, 'Editor preview iframe exists');
    const component = frame.locator('[data-puck-component]').first();
    await component.waitFor({ state: 'visible' });
    // Center clicks also select hairline components whose rendered root is
    // shorter than the old fixed y=12 test point.
    const hasNestedComponents = await frame.locator('[data-puck-component]').count() > 1;
    const bounds = await component.boundingBox();
    const position = hasNestedComponents && bounds && bounds.height > 2 ? { x: 1, y: 1 } : undefined;
    await component.click({ force: true, ...(position ? { position } : {}) });
    const field = page.getByLabel('Section link name', { exact: true }).filter({ visible: true }).first();
    await field.waitFor({ state: 'visible' });
    await field.fill(`verified-${key.toLowerCase()}`);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(`fixture-${key}`)), key);
    assert.equal(saved.content[0].props.name, `verified-${key.toLowerCase()}`);
    await page.goto(`${origin}/fixtures?component=${key}`, { waitUntil: 'networkidle' });
    await page.locator(`#verified-${key.toLowerCase()}`).waitFor();
    assert.deepEqual(errors, []);
    results.push({ key, ok: true });
  } catch (error) { results.push({ key, ok: false, error: error.message, errors }); console.log(`${key}: ${error.message.slice(0, 180)}`); }
  page.off('pageerror', onError);
  if (results.length % 10 === 0) console.log(`Edited/saved/reloaded ${results.length}/${keys.length}`);
}
await browser.close();
await writeFile('/tmp/open-canvas-editor-qa.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify({ tested: results.length, failed: results.filter(r => !r.ok).length }));
process.exitCode = results.some(r => !r.ok) ? 1 : 0;
