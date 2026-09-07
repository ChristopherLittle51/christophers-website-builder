import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const output = process.env.QA_MODES_OUTPUT || '/tmp/open-canvas-library-modes-qa.json';
const browser = await chromium.launch();
const bootstrap = await browser.newPage({ viewport: { width: 390, height: 844 } });
await bootstrap.goto(`${origin}/fixtures`, { waitUntil: 'networkidle' });
const allKeys = await bootstrap.locator('[data-fixture-controls] option').allTextContents();
assert.equal(allKeys.length, 93);
await bootstrap.close();

const focusedKeys = process.env.QA_MODE_COMPONENTS
  ? process.env.QA_MODE_COMPONENTS.split(',').filter((key) => allKeys.includes(key))
  : ['SignalCommandPalette', 'OrbitalProjectNavigator', 'LayoutContainer', 'FlexColumn', 'BeforeAfter', 'Notice', 'FilmStripBlock', 'EmbedFrame', 'InteractiveBriefBuilder', 'FooterSitemap'];
const results = [];

async function inspectPage(page, mode, key, checkOverflow) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  const url = `${origin}/fixtures?component=${key}${mode === 'stress' ? '&stress=1' : ''}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(80);
  if (mode === 'zoom') await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const observation = await page.evaluate(({ mode, checkOverflow }) => {
    const main = document.querySelector('main');
    if (!main) return { overflow: [], documentOverflow: document.documentElement.scrollWidth - innerWidth, focus: [], animations: [] };
    const overflow = checkOverflow
      ? [...main.querySelectorAll('*')].flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height || getComputedStyle(element).position === 'fixed') return [];
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== main) {
          if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(ancestor).overflowX)) return [];
          ancestor = ancestor.parentElement;
        }
        return rect.left < -1 || rect.right > innerWidth + 1
          ? [{ tag: element.tagName.toLowerCase(), className: String(element.className || '').slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right) }]
          : [];
      }).slice(0, 12)
      : [];
    const focus = [];
    if (mode === 'zoom') {
      for (const element of [...main.querySelectorAll('a,button,input,select,summary')]) {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || !(element instanceof HTMLElement)) continue;
        element.focus();
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const rect = element.getBoundingClientRect();
        if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) {
          focus.push({ tag: element.tagName.toLowerCase(), text: (element.textContent || '').trim().slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top), bottom: Math.round(rect.bottom) });
        }
      }
    }
    const animations = mode === 'reduced'
      ? [...main.querySelectorAll('*')].filter((element) => getComputedStyle(element).animationName !== 'none' && getComputedStyle(element).animationDuration !== '0.01s').map((element) => element.className).slice(0, 8)
      : [];
    return { overflow, documentOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), focus, animations };
  }, { mode, checkOverflow });
  page.off('pageerror', onError);
  results.push({ mode, key, ...observation, errors });
  if (errors.length || observation.overflow.length || observation.documentOverflow > 1 || observation.focus.length || observation.animations.length) {
    console.log(JSON.stringify({ mode, key, ...observation, errors }));
  }
}

async function runMode(mode, keys, widths) {
  const context = await browser.newContext({ viewport: { width: widths[0], height: 844 } });
  const page = await context.newPage();
  if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
  if (mode === 'forced') await page.emulateMedia({ forcedColors: 'active' });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    for (const key of keys) {
      await inspectPage(page, mode, key, mode !== 'zoom');
    }
  }
  await context.close();
}

await runMode('stress', allKeys, [320, 390]);
await runMode('reduced', focusedKeys, [390]);
await runMode('forced', focusedKeys, [390]);
await runMode('zoom', focusedKeys, [390]);

await writeFile(output, JSON.stringify({
  generatedAt: new Date().toISOString(),
  origin,
  registryCount: allKeys.length,
  stressCount: allKeys.length,
  focusedKeys,
  results,
}, null, 2));
await browser.close();
const failures = results.filter((result) => result.errors.length || result.overflow.length || result.documentOverflow > 1 || result.focus.length || result.animations.length);
console.log(JSON.stringify({ tested: results.length, failed: failures.length, report: output }));
process.exitCode = failures.length ? 1 : 0;
