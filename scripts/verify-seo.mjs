import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

// Run only against a disposable local DATA_DIR: this publishes fixture content.
const origin = process.env.QA_ORIGIN;
if (!origin || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname) || process.env.QA_ALLOW_WRITE !== '1') throw new Error('Set local QA_ORIGIN and QA_ALLOW_WRITE=1 with an isolated server DATA_DIR.');
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
let checks = 0;
const check = (name, value) => { assert.ok(value, name); checks++; console.log(`PASS ${name}`); };
const call = async (path, method = 'GET', data) => {
  const response = await context.request.fetch(path, { method, data });
  assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.json();
};
const read = async path => (await context.request.get(path, { headers: { 'user-agent': 'Googlebot' } })).text();
const doc = props => ({ root: { props }, content: [] });
try {
  await page.goto('/login');
  check('login is noindex without a home canonical', (await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex') && await page.locator('link[rel="canonical"]').count() === 0);
  await page.getByLabel('Password', { exact: true }).filter({ visible: true }).first().fill(process.env.QA_PASSWORD || 'seo-qa-password');
  await page.getByRole('button', { name: 'Open editor', exact: true }).click();
  await page.waitForURL('**/edit');
  const initial = await call('/api/site?mode=draft');
  const homeId = initial.homepageId;
  const baselineSettings = (await call('/api/site-settings')).published;
  await call('/api/site-settings', 'PUT', { settings: { ...baselineSettings, seo: { siteUrl: '', siteName: '', description: '', socialImage: '', socialImageAlt: '' }, crawler: { ...baselineSettings.crawler, search: 'allow' } }, publish: true });
  for (const fixture of initial.pages.filter(item => /^seo-(visible|hidden|excluded|duplicate|draft)(-\d+)?$/.test(item.slug))) await call('/api/site', 'POST', { action: 'delete', pageId: fixture.id });
  const published = doc({ title: 'QA home', seoDescription: 'Published search description' });
  await call('/api/site', 'PUT', { pageId: homeId, data: published, publish: true });
  await page.reload();
  const title = page.getByLabel('SEO title (blank uses browser title)', { exact: true }).filter({ visible: true }).first();
  await title.fill('QA search title');
  await page.locator('textarea[name="seoDescription"]').filter({ visible: true }).first().fill('QA search description');
  await page.getByLabel('Canonical URL (blank uses this page URL)', { exact: true }).filter({ visible: true }).first().fill('/');
  await page.getByLabel('Social sharing title', { exact: true }).filter({ visible: true }).first().fill('QA social title');
  await page.locator('textarea[name="socialDescription"]').filter({ visible: true }).first().fill('QA social description');
  await page.getByLabel('Social preview image description', { exact: true }).filter({ visible: true }).first().fill('QA image alt');
  await page.getByText('All changes saved', { exact: false }).waitFor();
  await page.waitForFunction(async () => (await (await fetch('/api/site?mode=draft')).json()).data.root.props.socialImageAlt === 'QA image alt');
  check('draft metadata stays private', !(await read('/')).includes('QA search title'));
  await page.reload();
  check('page SEO controls survive autosave and reload', await title.inputValue() === 'QA search title');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.waitForFunction(async () => (await (await fetch('/api/site')).json()).data.root.props.seoTitle === 'QA search title');
  const visitor = await browser.newPage();
  await visitor.goto(origin);
  check('published search title and description render', await visitor.title() === 'QA search title' && await visitor.locator('meta[name="description"]').getAttribute('content') === 'QA search description');
  check('social copy can differ from search copy', await visitor.locator('meta[property="og:title"]').getAttribute('content') === 'QA social title' && await visitor.locator('meta[name="twitter:description"]').getAttribute('content') === 'QA social description');
  check('one absolute canonical matches the actual host', await visitor.locator('link[rel="canonical"]').count() === 1 && new URL(await visitor.locator('link[rel="canonical"]').getAttribute('href')).href === `${origin}/`);
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByLabel('Site name', { exact: true }).filter({ visible: true }).first().fill('QA Studio');
  await page.getByLabel('Public site URL', { exact: true }).filter({ visible: true }).first().fill('https://preferred.example');
  await page.getByLabel('Default search and social description', { exact: true }).filter({ visible: true }).first().fill('Shared SEO description');
  await page.getByRole('button', { name: 'Save draft settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Draft settings saved' }).waitFor();
  check('draft site URL does not change sitemap', (await read('/sitemap.xml')).includes(`${origin}/`));
  await page.getByRole('button', { name: 'Close site settings', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await expect(page.getByLabel('Site name', { exact: true }).filter({ visible: true }).first()).toHaveValue('QA Studio');
  check('site defaults persist through reload', await page.getByLabel('Site name', { exact: true }).filter({ visible: true }).first().inputValue() === 'QA Studio');
  await page.getByRole('button', { name: 'Publish site settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Site settings published' }).waitFor();
  await page.screenshot({ path: '/tmp/open-canvas-seo-settings.png', fullPage: true });
  await visitor.reload();
  check('preferred domain reaches canonical and social URLs', new URL(await visitor.locator('link[rel="canonical"]').getAttribute('href')).href === 'https://preferred.example/' && new URL(await visitor.locator('meta[property="og:url"]').getAttribute('content')).href === 'https://preferred.example/');
  check('social image is absolute with alt text', (await visitor.locator('meta[property="og:image"]').getAttribute('content')).startsWith('https://preferred.example/') && await visitor.locator('meta[property="og:image:alt"]').getAttribute('content') === 'QA image alt');
  const robots = await read('/robots.txt');
  check('robots advertises preferred sitemap and crawlable media', robots.includes('Sitemap: https://preferred.example/sitemap.xml') && robots.includes('Allow: /api/media/') && robots.includes('Disallow: /edit'));
  const created = [];
  for (const [slug, props, publish] of [
    ['seo-visible', {}, true], ['seo-hidden', { noIndex: 'yes' }, true],
    ['seo-excluded', { excludeFromSitemap: 'yes' }, true],
    ['seo-duplicate', { canonicalUrl: 'https://original.example/work' }, true],
    ['seo-draft', {}, false],
  ]) {
    const result = await call('/api/site', 'POST', { action: 'create', title: slug, slug });
    created.push(result.page);
    await call('/api/site', 'PUT', { pageId: result.page.id, data: doc({ title: slug, ...props }), publish });
  }
  const sitemap = await read('/sitemap.xml');
  check('sitemap contains published self-canonical pages only', sitemap.includes('/seo-visible</loc>') && !/seo-(hidden|excluded|duplicate|draft)/.test(sitemap));
  await visitor.goto(`${origin}/seo-visible`);
  check('page inherits site description and site name', await visitor.locator('meta[name="description"]').getAttribute('content') === 'Shared SEO description' && await visitor.locator('meta[property="og:site_name"]').getAttribute('content') === 'QA Studio');
  await visitor.goto(`${origin}/seo-hidden`);
  check('noindex page remains accessible with explicit noindex', (await visitor.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
  const missing = await context.request.get('/seo-draft');
  check('unpublished page is 404 without canonical', missing.status() === 404 && !(await missing.text()).includes('rel="canonical"'));
  const settings = (await call('/api/site-settings')).published;
  await call('/api/site-settings', 'PUT', { settings: { ...settings, crawler: { ...settings.crawler, search: 'disallow' } }, publish: true });
  check('global search block empties sitemap', !(await read('/sitemap.xml')).includes('<url>'));
  await visitor.goto(`${origin}/seo-visible`);
  check('global search block marks published pages noindex', (await visitor.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
  await call('/api/site-settings', 'PUT', { settings: { ...settings, seo: { ...settings.seo, siteUrl: '' } }, publish: true });
  const forwarded = { 'x-forwarded-host': 'proxy.example', 'x-forwarded-proto': 'https', 'user-agent': 'Googlebot' };
  const proxiedHtml = await (await context.request.get('/seo-visible', { headers: forwarded })).text();
  const proxiedSitemap = await (await context.request.get('/sitemap.xml', { headers: forwarded })).text();
  const proxiedRobots = await (await context.request.get('/robots.txt', { headers: forwarded })).text();
  check('forwarded HTTPS is consistent across HTML, sitemap and robots', proxiedHtml.includes('href="https://proxy.example/seo-visible"') && proxiedSitemap.includes('https://proxy.example/seo-visible') && proxiedRobots.includes('Sitemap: https://proxy.example/sitemap.xml'));
  console.log(`SEO QA: ${checks} checks passed`);
} finally { await browser.close(); }
