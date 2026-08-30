import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { slugifyPage, toSitePages, uniquePageSlug } from './site-pages.ts';

const data = (title: string) => ({ root: { props: { title } }, content: [], zones: {} }) as unknown as Data;

test('migrates the legacy single document into a home page', () => {
  const pages = toSitePages({ draft: data('Home — Studio'), published: data('Home — Studio') }, data('Fallback'));
  assert.equal(pages.homepageId, 'home');
  assert.deepEqual(pages.pages.map((page) => [page.id, page.slug, page.title]), [['home', 'home', 'Home — Studio']]);
});

test('creates stable, unique public slugs', () => {
  assert.equal(slugifyPage('About & Process'), 'about-process');
  assert.equal(uniquePageSlug('About', [{ id: 'home', slug: 'home' }, { id: 'about', slug: 'about' }]), 'about-2');
});
