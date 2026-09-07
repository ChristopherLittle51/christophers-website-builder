import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const origin = process.env.QA_ORIGIN || 'http://localhost:3010';
const password = process.env.QA_PASSWORD || 'production-qa-password';
const output = process.env.QA_OUTPUT || '/tmp/open-canvas-navigation-editor-qa.json';
const runId = process.env.QA_RUN_ID || String(Date.now());
const pageTitle = `Navigation browser QA ${runId}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const steps = [];
let pageId;
let initialSettings;
let failure;

function pass(name, details = {}) {
  steps.push({ name, ok: true, ...details });
}

async function fetchJson(path, init) {
  return page.evaluate(async ({ url, requestInit }) => {
    const response = await fetch(url, requestInit);
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: response.status, body };
  }, { url: `${origin}${path}`, requestInit: init });
}

async function siteData(mode, id = pageId) {
  const result = await fetchJson(`/api/site?mode=${mode}&page=${encodeURIComponent(id)}`);
  assert.equal(result.status, 200, `${mode} page read failed: ${result.status}`);
  return result.body;
}

async function settingsData() {
  const result = await fetchJson('/api/site-settings');
  assert.equal(result.status, 200, `settings read failed: ${result.status}`);
  return result.body;
}

async function previewFrame() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = page.frames().find(frame => frame !== page.mainFrame() && frame.url() === 'about:srcdoc');
    if (candidate) {
      try {
        await candidate.locator('[data-puck-entry]').waitFor({ state: 'attached', timeout: 250 });
        return candidate;
      } catch { /* Puck is still remounting. */ }
    }
    await page.waitForTimeout(100);
  }
  throw new Error('Puck preview iframe did not load');
}

async function dragDrawerItem(type) {
  const source = page.getByTestId(`drawer-item:${type}`);
  await source.scrollIntoViewIfNeeded();
  const frame = await previewFrame();
  const target = frame.getByTestId('dropzone:root:default-zone');
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  assert.ok(sourceBox && targetBox, `Could not measure ${type} drag target`);
  const viewportHeight = page.viewportSize()?.height || 1100;
  const dropY = Math.min(targetBox.y + 120, viewportHeight - 30);
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, dropY, { steps: 18 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await page.waitForTimeout(1200);
}

async function publishPage() {
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/site') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 200, `page publish failed: ${response.status()}`);
  await page.waitForTimeout(300);
}

try {
  await page.goto(`${origin}/login?returnTo=/edit`, { waitUntil: 'networkidle' });
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Open editor', exact: true }).click();
  await page.waitForURL(`${origin}/edit`);
  await page.locator('iframe').first().waitFor({ state: 'attached' });
  initialSettings = await settingsData();
  pass('authenticated editor loaded', { origin, initialPublishedBrand: initialSettings.published.brand });

  await page.getByRole('button', { name: 'New page', exact: true }).click();
  const pageDialog = page.locator('form.editor-dialog');
  await pageDialog.getByLabel('Page name').fill(pageTitle);
  await pageDialog.getByRole('button', { name: 'Save page', exact: true }).click();
  const pageButton = page.getByRole('button', { name: pageTitle, exact: true });
  await pageButton.waitFor({ state: 'visible' });
  await page.waitForTimeout(800);
  // The active page ID is returned by the editor API; derive it from the page summary.
  const siteAfterCreate = await fetchJson('/api/site?mode=draft');
  assert.equal(siteAfterCreate.status, 200);
  pageId = siteAfterCreate.body.pages.find(item => item.title === pageTitle)?.id;
  assert.ok(pageId, 'new QA page was not returned by the editor API');
  pass('isolated page created', { pageId, title: pageTitle });

  await dragDrawerItem('HeaderLinkBar');
  await dragDrawerItem('FooterSitemap');
  await dragDrawerItem('ButtonBlock');
  const seededDraft = await siteData('draft');
  const seededTypes = seededDraft.data.content.map(item => item.type);
  assert.ok(seededTypes.includes('HeaderLinkBar'), 'manual header did not autosave');
  assert.ok(seededTypes.includes('FooterSitemap'), 'manual footer did not autosave');
  assert.ok(seededTypes.includes('ButtonBlock'), 'button block did not autosave');
  pass('manual shell and Puck link field seeded', { types: seededTypes });

  const catalog = seededDraft.catalog;
  const sectionEntries = catalog.flatMap(item => item.sections.map(section => ({ page: item, section })));
  assert.ok(sectionEntries.length, 'editor catalog has no searchable sections');
  const counts = new Map(sectionEntries.map(entry => [entry.section.name, 0]));
  for (const entry of sectionEntries) counts.set(entry.section.name, (counts.get(entry.section.name) || 0) + 1);
  const target = sectionEntries.find(entry => entry.page.id !== pageId && counts.get(entry.section.name) === 1) || sectionEntries.find(entry => entry.page.id !== pageId) || sectionEntries[0];
  assert.ok(target, 'no internal page and section destination exists');

  const frame = await previewFrame();
  // Invalid placeholder links render as spans in the editor preview, so use
  // the stable component class rather than assuming the preview keeps an <a>.
  const buttonComponent = frame.locator('[data-puck-component]').filter({ has: frame.locator('.builder-button__link') }).last();
  await buttonComponent.click({ force: true });
  const picker = page.getByRole('combobox', { name: 'Link URL', exact: true });
  await picker.waitFor({ state: 'visible' });
  const resultsId = await picker.getAttribute('aria-controls');
  assert.ok(resultsId, 'Puck link picker did not expose a result list');
  const results = page.locator(`#${resultsId}`);
  await picker.fill(target.section.name);
  const firstOption = results.getByRole('option').first();
  await firstOption.waitFor({ state: 'visible' });
  const optionLabel = await firstOption.textContent();
  await picker.press('Enter');
  const pickerRoot = picker.locator('xpath=ancestor::div[contains(@class,"site-link-picker")][1]');
  await pickerRoot.locator('.site-link-picker__selected').waitFor({ state: 'visible' });
  assert.match(await pickerRoot.locator('.site-link-picker__selected').innerText(), /Clear/);
  pass('keyboard selected internal page and section in Puck', { query: target.section.name, option: optionLabel?.trim() });

  await publishPage();
  const publishedWithLink = await siteData('published');
  const publishedButton = publishedWithLink.data.content.find(item => item.type === 'ButtonBlock');
  const publishedHref = publishedButton?.props?.href ?? publishedButton?.props?.url;
  assert.equal(publishedHref?.type, 'page');
  assert.equal(typeof publishedHref?.pageId, 'string');
  assert.equal(typeof publishedHref?.componentId, 'string');
  pass('Puck link persisted through page publish', { href: publishedHref });

  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  const settingsDialog = page.locator('dialog.site-settings-dialog');
  await settingsDialog.waitFor({ state: 'visible' });
  const enableShared = settingsDialog.locator('fieldset').filter({ hasText: 'Shared header and footer' }).locator('input[type=checkbox]').first();
  await enableShared.check();
  const draftBrand = `Navigation draft ${runId}`;
  await settingsDialog.getByLabel('Brand name').fill(draftBrand);
  const draftSavePromise = page.waitForResponse(response => response.url().endsWith('/api/site-settings') && response.request().method() === 'PUT');
  await settingsDialog.getByRole('button', { name: 'Save draft settings', exact: true }).click();
  const draftSaveResponse = await draftSavePromise;
  assert.equal(draftSaveResponse.status(), 200);
  const afterDraftSettings = await settingsData();
  assert.equal(afterDraftSettings.draft.brand, draftBrand);
  assert.equal(afterDraftSettings.published.brand, initialSettings.published.brand, 'draft settings leaked into published settings');
  pass('shared settings draft saved independently', { draftBrand, publishedBrand: afterDraftSettings.published.brand });

  const conversionPromise = page.waitForResponse(response => response.url().endsWith('/api/site') && response.request().method() === 'PUT');
  await settingsDialog.getByRole('button', { name: 'Convert current draft to shared navigation', exact: true }).click();
  const conversionResponse = await conversionPromise;
  assert.equal(conversionResponse.status(), 200);
  await settingsDialog.getByRole('status').waitFor({ state: 'visible' });
  const convertedDraft = await siteData('draft');
  const convertedTypes = convertedDraft.data.content.map(item => item.type);
  assert.ok(!convertedTypes.includes('HeaderLinkBar'), 'conversion left a manual header in the draft');
  assert.ok(!convertedTypes.includes('FooterSitemap'), 'conversion left a manual footer in the draft');
  assert.equal(convertedDraft.data.root.props.sharedHeader, 'inherit');
  assert.equal(convertedDraft.data.root.props.sharedFooter, 'inherit');
  const convertedFrame = await previewFrame();
  await convertedFrame.locator('.shared-site-header').waitFor({ state: 'visible' });
  assert.equal(await convertedFrame.locator('.shared-site-brand').innerText(), draftBrand);
  pass('draft conversion removed manual shells and showed shared preview', { types: convertedTypes, sharedBrand: draftBrand });

  await settingsDialog.getByRole('button', { name: 'Close site settings', exact: true }).click();
  await settingsDialog.waitFor({ state: 'hidden' });
  await publishPage();
  const convertedPublished = await siteData('published');
  const publishedTypes = convertedPublished.data.content.map(item => item.type);
  assert.ok(!publishedTypes.includes('HeaderLinkBar'));
  assert.ok(!publishedTypes.includes('FooterSitemap'));
  assert.equal(convertedPublished.data.root.props.sharedHeader, 'inherit');
  assert.equal(convertedPublished.data.root.props.sharedFooter, 'inherit');
  pass('converted page published with inherited shell modes', { types: publishedTypes });

  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await settingsDialog.waitFor({ state: 'visible' });
  const settingsPublishPromise = page.waitForResponse(response => response.url().endsWith('/api/site-settings') && response.request().method() === 'PUT');
  await settingsDialog.getByRole('button', { name: 'Publish site settings', exact: true }).click();
  const settingsPublishResponse = await settingsPublishPromise;
  assert.equal(settingsPublishResponse.status(), 200);
  const afterSettingsPublish = await settingsData();
  assert.equal(afterSettingsPublish.published.brand, draftBrand);
  pass('site settings published separately from page content', { publishedBrand: afterSettingsPublish.published.brand });
} catch (error) {
  failure = error;
  steps.push({ name: 'navigation editor verification', ok: false, error: error instanceof Error ? error.message : String(error) });
} finally {
  if (initialSettings) {
    // Restore both versions exactly. The second write keeps the original draft
    // after the first write restores the original published settings.
    await fetchJson('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: initialSettings.published, publish: true }) }).catch(() => null);
    await fetchJson('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: initialSettings.draft, publish: false }) }).catch(() => null);
  }
  if (pageId) {
    await fetchJson('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete', pageId }) }).catch(() => null);
  }
  const report = { generatedAt: new Date().toISOString(), origin, pageTitle, pageId, steps, error: failure ? (failure instanceof Error ? failure.message : String(failure)) : null };
  await writeFile(output, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ tested: steps.filter(step => step.ok).length, failed: failure ? 1 : 0, report: output }));
  if (failure) process.exitCode = 1;
}
