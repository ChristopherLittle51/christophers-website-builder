import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { buildPageCatalog, collectSections, resolveLink, safeHref } from './site-catalog.ts';
import { getSiteSettings, normalizeSiteSettings, navigationLinks } from './site-settings.ts';
import { shellMode, withoutComponents } from './site-render-data.ts';

const doc = (title: string, name = 'mission') => ({ root: { props: { title } }, content: [{ type: 'HeadingBlock', props: { id: 'section-1', name, text: 'Mission' } }] }) as Data;
const pages = [{ id: 'home-id', slug: 'home', title: 'Draft home title', draft: doc('Draft only'), published: doc('Public home') }, { id: 'about-id', slug: 'about', title: 'Draft about', draft: doc('Draft about'), published: doc('Public about') }, { id: 'private-id', slug: 'private', title: 'Private title', draft: doc('Private secret'), published: null }];

test('public catalogs contain only published content; editor includes drafts', () => {
  const catalog = buildPageCatalog(pages, 'home-id', 'published');
  assert.deepEqual(catalog.map(page => [page.title, page.path]), [['Public home', '/'], ['Public about', '/about']]);
  assert.equal(buildPageCatalog(pages, 'home-id', 'draft').length, 3);
  assert.ok(!JSON.stringify(catalog).includes('Draft'));
});

test('stable links follow page and section renames and fail closed for missing targets', () => {
  const catalog = buildPageCatalog(pages, 'home-id', 'published');
  const target = { type: 'page', pageId: 'about-id', componentId: 'section-1' };
  assert.equal(resolveLink(target, catalog, 'home-id'), '/about#mission');
  catalog[1] = { ...catalog[1], path: '/studio', sections: [{ id: 'section-1', name: 'our-purpose', label: 'Purpose' }] };
  assert.equal(resolveLink(target, catalog, 'home-id'), '/studio#our-purpose');
  assert.equal(resolveLink(target, catalog, 'about-id'), '#our-purpose');
  assert.equal(resolveLink(target, catalog.slice(0, 1)), undefined);
  assert.equal(resolveLink({ type: 'page', pageId: 'private-id' }, buildPageCatalog(pages, 'home-id', 'draft')), undefined);
  assert.equal(resolveLink({ type: 'page', pageId: 'private-id' }, buildPageCatalog(pages, 'home-id', 'draft'), undefined, true), '/private');
});

test('links preserve supported legacy destinations and reject inert or executable ones', () => {
  for (const href of ['/about', '#mission', 'https://example.com', 'mailto:studio@example.com', 'tel:+15555555555']) assert.equal(safeHref(href), href);
  for (const href of ['', '#', 'javascript:alert(1)', 'data:text/html,x', '//example.com', '\\evil.test']) assert.equal(safeHref(href), undefined);
});

test('nested sections and legacy header conversion preserve unrelated content', () => {
  const data = { ...doc('Home'), content: [{ type: 'FlexRow', props: { id: 'row', name: 'row', content: [{ type: 'HeaderLinkBar', props: { id: 'header', name: 'nav' } }] } }, ...doc('Home').content] } as Data;
  assert.equal(collectSections(data).length, 3);
  assert.equal(shellMode(data, 'header'), 'override');
  const converted = withoutComponents(data, ['HeaderLinkBar']);
  assert.equal(shellMode(converted, 'header'), 'inherit');
  assert.equal(converted.content.length, 2);
  assert.equal(collectSections(converted).length, 2);
});

test('shared settings normalize legacy records and keep published settings independent', () => {
  assert.equal(getSiteSettings(null, 'published').enabled, false);
  const draft = normalizeSiteSettings({ enabled: true, brand: 'Draft brand' });
  const published = normalizeSiteSettings({ enabled: true, brand: 'Public brand' });
  const record = JSON.parse(JSON.stringify({ siteSettings: { draft, published } }));
  assert.equal(getSiteSettings(record, 'published').brand, 'Public brand');
  assert.equal(getSiteSettings(record, 'draft').brand, 'Draft brand');
});

test('automatic navigation applies ordering, visibility, labels and manual additions', () => {
  const settings = normalizeSiteSettings({ navigation: [{ pageId: 'about-id', label: 'Studio', group: 'Company', hidden: false }, { pageId: 'home-id', hidden: true }], links: [{ label: 'Contact', href: 'mailto:hello@example.com', group: 'Contact' }] });
  assert.deepEqual(navigationLinks(settings, buildPageCatalog(pages, 'home-id', 'published')).map(link => link.label), ['Studio', 'Contact']);
});
