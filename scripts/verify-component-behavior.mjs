import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const output = process.env.QA_BEHAVIOR_OUTPUT || '/tmp/open-canvas-component-behavior-qa.json';
const browser = await chromium.launch();
const results = [];

function fixtureData(type, props) {
  const slug = type.toLowerCase();
  return {
    root: { props: {} },
    content: [{ type, props: { id: `behavior-${slug}`, name: `behavior-${slug}`, ...props } }],
  };
}

async function openFixture(context, type, props) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (props) {
    await page.addInitScript(({ key, data }) => {
      window.sessionStorage.setItem(key, JSON.stringify(data));
    }, { key: `fixture-${type}`, data: fixtureData(type, props) });
  }
  await page.goto(`${origin}/fixtures?component=${type}`, { waitUntil: 'networkidle' });
  await (props
    ? page.locator(`#behavior-${type.toLowerCase()}`).waitFor({ state: 'visible' })
    : page.locator(`main .${type === 'SignalCommandPalette' ? 'signal-command' : type.toLowerCase()}`).waitFor({ state: 'visible' }));
  return { page, errors };
}

async function run(name, test) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await test(context);
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    console.log(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await context.close();
  }
}

await run('SignalCommandPalette dialog keyboard lifecycle', async (context) => {
  const { page, errors } = await openFixture(context, 'SignalCommandPalette');
  const trigger = page.getByRole('button', { name: /Open command palette/ });
  await trigger.click();
  const dialog = page.locator('dialog[open]');
  await dialog.waitFor({ state: 'visible' });
  const search = dialog.getByRole('combobox');
  assert.equal(await search.evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press('Control+k');
  await dialog.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
});

await run('SocialIconLinks opens external links in a new tab', async (context) => {
  const { page, errors } = await openFixture(context, 'SocialIconLinks', {
    label: 'Follow us',
    layout: 'auto',
    align: 'left',
    display: 'icons',
    appearance: 'outline',
    size: 'medium',
    newTab: 'new',
    theme: 'paper',
    links: [{ icon: 'website', platform: 'Website', label: 'Website', url: 'https://example.com/work' }],
  });
  const link = page.locator('a[target="_blank"]').first();
  await link.waitFor({ state: 'visible' });
  assert.match(await link.getAttribute('rel') || '', /noopener/);
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  assert.match(popup.url(), /^https:\/\/example\.com\/work/);
  await popup.close();
  assert.deepEqual(errors, []);
});

await run('Notice dismissal is an implemented button', async (context) => {
  const { page, errors } = await openFixture(context, 'Notice', {
    title: 'A quick note',
    message: 'Dismiss this visitor-only notice.',
    tone: 'neutral',
    dismissible: 'hint',
  });
  const notice = page.locator('.builder-notice');
  await page.getByRole('button', { name: 'Dismiss notice' }).click();
  await notice.waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('button', { name: 'Dismiss notice' }).count(), 0);
  assert.deepEqual(errors, []);
});

await run('InteractiveBriefBuilder validates and hands off a completed brief', async (context) => {
  const { page, errors } = await openFixture(context, 'InteractiveBriefBuilder', {
    title: 'Start with the shape of the thing.',
    intro: 'A few constraints make a better first conversation.',
    submitLabel: 'Send my brief',
    submitUrl: '/?brief-destination=contact',
    theme: 'signal',
    questions: [
      { label: 'What needs to change?', options: 'A product|An identity|A digital experience', required: 'yes' },
      { label: 'When should it move?', options: 'This quarter|This year|Still defining it', required: 'yes' },
    ],
  });
  const submit = page.getByRole('button', { name: /Send my brief/ });
  await submit.click();
  await page.locator('p[role="alert"]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('fieldset[aria-invalid="true"]').count(), 2);
  for (const fieldset of await page.locator('fieldset').all()) await fieldset.locator('input[type="radio"]').first().check();
  await submit.click();
  await page.waitForURL((url) => url.searchParams.has('brief'), { timeout: 5000 });
  assert.match(new URL(page.url()).searchParams.get('brief') || '', /What needs to change/);
  assert.deepEqual(errors, []);
});

await writeFile(output, JSON.stringify({
  generatedAt: new Date().toISOString(),
  origin,
  results,
}, null, 2));
await browser.close();
const failures = results.filter((result) => !result.ok);
console.log(JSON.stringify({ tested: results.length, failed: failures.length, report: output }));
process.exitCode = failures.length ? 1 : 0;
