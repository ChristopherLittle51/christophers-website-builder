import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const output = process.env.QA_OUTPUT || '/tmp/open-canvas-component-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(`${origin}/fixtures`, { waitUntil: 'networkidle' });
const allKeys = await page.locator('[data-fixture-controls] option').allTextContents();
if (allKeys.length !== 93) { await browser.close(); throw new Error(`Expected 93 fixture components, got ${allKeys.length}. Check server build errors.`); }
const keys = process.env.QA_COMPONENTS ? process.env.QA_COMPONENTS.split(',') : allKeys;
const results = [];
for (const key of keys) {
  const result = { key, widths: [], violations: [], errors: [] };
  errors.length = 0;
  await page.goto(`${origin}/fixtures?component=${key}`, { waitUntil: 'networkidle' });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(60);
    result.widths.push(await page.evaluate(width => {
      const main = document.querySelector('main');
      return { width, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), brokenImages: [...main.querySelectorAll('img')].filter(image => image.complete && !image.naturalWidth).length };
    }, width));
  }
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  result.violations = await page.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
  result.errors = [...errors];
  results.push(result);
  if (result.violations.length || result.widths.some(item => item.overflow > 1) || result.errors.length) console.log(JSON.stringify({ key, violations: result.violations.map(v => v.id), widths: result.widths.filter(item => item.overflow > 1), errors: result.errors }));
  if (results.length % 10 === 0) console.log(`Verified ${results.length}/${keys.length}`);
}
await writeFile(`${output}/report.json`, JSON.stringify({ generatedAt: new Date().toISOString(), origin, registryCount: allKeys.length, results }, null, 2));
await browser.close();
const failures = results.filter(r => r.violations.length || r.errors.length || r.widths.some(w => w.overflow > 1 || w.brokenImages));
console.log(JSON.stringify({ tested: results.length, registryCount: allKeys.length, failing: failures.length, report: `${output}/report.json` }));
process.exitCode = failures.length ? 1 : 0;
