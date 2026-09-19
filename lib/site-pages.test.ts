import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { slugifyPage, toSitePages, uniquePageSlug } from './site-pages.ts';
import { makePageExport, parsePageExport } from './page-transfer.ts';

const data = (title: string) => ({ root: { props: { title } }, content: [], zones: {} }) as unknown as Data;

test('migrates the legacy single document into a home page', () => {
  const pages = toSitePages({ draft: data('Home — Studio'), published: data('Home — Studio') }, data('Fallback'));
  assert.equal(pages.homepageId, 'home');
  assert.deepEqual(pages.pages.map((page) => [page.id, page.slug, page.title]), [['home', 'home', 'Home — Studio']]);
});

test('creates stable, unique public slugs', () => {
  assert.equal(slugifyPage('About & Process'), 'about-process');
  assert.equal(uniquePageSlug('About', [{ id: 'home', slug: 'home' }, { id: 'about', slug: 'about' }]), 'about-2');
  assert.equal(uniquePageSlug('Analytics', []), 'analytics-2');
});


test('round trips the page export format', () => {
  const page = makePageExport('About', 'about', data('About'));
  assert.deepEqual(parsePageExport(JSON.parse(JSON.stringify(page))), page);
});

test('rejects unsupported page exports', () => {
  assert.equal(parsePageExport({ format: 'open-canvas-page', formatVersion: 2, title: 'About', slug: 'about', data: data('About') }), null);
  assert.equal(parsePageExport({ format: 'open-canvas-page', formatVersion: 1, title: 'About', slug: 'about', data: {} }), null);
});
