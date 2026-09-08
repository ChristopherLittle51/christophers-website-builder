import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { canonicalUrl, publicOrigin, resolvePageSeo } from './seo.ts';
import { defaultSiteSettings, getSiteSettings, normalizeSiteSettings } from './site-settings.ts';
import { safeAssetUrl } from './site-metadata.ts';
import { crawlerRobotsDirectives } from './crawlers.ts';

const data = (props: Record<string, unknown>) => ({ root: { props }, content: [] }) as Data;
const defaults = defaultSiteSettings.seo;
const resolve = (props: Record<string, unknown>) => resolvePageSeo(data(props), '/work', 'https://studio.test', defaults);

test('automatic canonical, sharing, and indexing use the public page URL', () => {
  const result = resolve({ title: 'Selected work' });
  assert.equal(result.canonical, 'https://studio.test/work');
  assert.equal(result.metadata.title, 'Selected work');
  assert.equal(result.metadata.openGraph?.title, 'Selected work');
  assert.equal(result.metadata.openGraph?.url, result.canonical);
  assert.deepEqual(result.metadata.robots, { index: true, follow: true });
  assert.equal(result.includeInSitemap, true);
});

test('search copy can differ from social copy and blank social fields inherit', () => {
  const result = resolve({ title: 'Work', seoTitle: 'Search title', seoDescription: 'Search description', socialTitle: 'Social title', socialDescription: 'Social description' });
  assert.equal(result.metadata.title, 'Search title');
  assert.equal(result.metadata.description, 'Search description');
  assert.equal(result.metadata.openGraph?.title, 'Social title');
  assert.equal(result.metadata.openGraph?.description, 'Social description');
  const inherited = resolve({ seoTitle: 'Search title', seoDescription: 'Search description' });
  assert.equal(inherited.metadata.twitter?.title, 'Search title');
  assert.equal(inherited.metadata.twitter?.description, 'Search description');
  assert.equal(resolve({ socialDescription: 'Legacy description' }).metadata.description, 'Legacy description');
});

test('published site defaults fill blanks and do not replace page overrides', () => {
  const shared = { ...defaults, siteName: 'Studio', description: 'Site description', socialImage: '/api/media/card', socialImageAlt: 'Shared card' };
  const result = resolvePageSeo(data({}), '/', 'https://studio.test', shared);
  assert.equal(result.metadata.title, 'Studio');
  assert.equal(result.metadata.description, 'Site description');
  assert.deepEqual(result.metadata.openGraph?.images, [{ url: 'https://studio.test/api/media/card', alt: 'Shared card' }]);
  const custom = resolvePageSeo(data({ socialImage: 'https://cdn.test/card.jpg', socialImageAlt: 'Custom card' }), '/', 'https://studio.test', shared);
  assert.deepEqual(custom.metadata.openGraph?.images, [{ url: 'https://cdn.test/card.jpg', alt: 'Custom card' }]);
});

test('canonical overrides omit duplicate pages; unsafe overrides fall back', () => {
  for (const canonical of ['/original', 'https://other.test/original']) {
    const result = resolve({ canonicalUrl: canonical });
    assert.equal(result.includeInSitemap, false);
    assert.equal(result.metadata.openGraph?.url, result.canonical);
  }
  assert.equal(resolve({ canonicalUrl: '/work#section' }).includeInSitemap, true);
  for (const invalid of ['//evil.test', '/\\evil.test', 'javascript:alert(1)', 'https://user:pass@evil.test', '/path\nInjected', 'relative-path']) {
    assert.equal(canonicalUrl(invalid, 'https://studio.test'), undefined, invalid);
    assert.equal(resolve({ canonicalUrl: invalid }).canonical, 'https://studio.test/work');
  }
});

test('indexing and sitemap exclusion are independent; site search block applies to all pages', () => {
  for (const noIndex of [true, 'yes']) {
    assert.equal(resolve({ noIndex }).includeInSitemap, false);
    assert.deepEqual(resolve({ noIndex }).metadata.robots, { index: false, follow: true });
  }
  const excluded = resolve({ excludeFromSitemap: 'yes', noFollow: 'yes' });
  assert.equal(excluded.includeInSitemap, false);
  assert.deepEqual(excluded.metadata.robots, { index: true, follow: false });
  const blocked = resolvePageSeo(data({ noIndex: 'no' }), '/', 'https://studio.test', defaults, 'disallow');
  assert.equal(blocked.includeInSitemap, false);
  assert.deepEqual(blocked.metadata.robots, { index: false, follow: true });
});

test('public URL precedence and forwarded HTTPS agree across metadata and routes', () => {
  const request = new Request('http://localhost:3000/sitemap.xml', { headers: { 'x-forwarded-host': 'public.test', 'x-forwarded-proto': 'https' } });
  assert.equal(publicOrigin(request), 'https://public.test');
  assert.equal(publicOrigin(request, '', 'https://saved.test/path'), 'https://saved.test');
  assert.equal(publicOrigin(request, 'https://env.test/path', 'https://saved.test'), 'https://env.test');
  assert.equal(publicOrigin(request, 'invalid', 'javascript:alert(1)'), 'https://public.test');
  assert.equal(publicOrigin(new Request('http://localhost:4321/sitemap.xml')), 'http://localhost:4321');
});

test('legacy site settings receive defaults and draft SEO stays separate', () => {
  assert.deepEqual(normalizeSiteSettings({}).seo, defaults);
  const draft = normalizeSiteSettings({ seo: { siteName: 'Draft only', description: 123 } });
  const published = normalizeSiteSettings({ seo: { siteName: 'Published' } });
  assert.equal(draft.seo.description, '');
  assert.equal(getSiteSettings({ siteSettings: { draft, published } }, 'published').seo.siteName, 'Published');
});

test('uploaded metadata assets remain crawlable without opening private API routes', () => {
  const robots = crawlerRobotsDirectives(defaultSiteSettings.crawler);
  assert.match(robots, /Disallow: \/api\//);
  assert.equal(robots.split('Allow: /api/media/').length - 1, 3);
  for (const unsafe of ['/\\evil.test/card', 'https://user:pass@evil.test/card', '/card\nInjected']) assert.equal(safeAssetUrl(unsafe), '');
});
