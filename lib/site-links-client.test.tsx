import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Render } from '@puckeditor/core';
import { builderConfig } from './site-builder';
import { normalizeBuilderData } from './puck-data';
import { enhanceLinkFields, SiteLinksProvider, SiteLink } from './site-links-client';

test('enhances destinations without replacing names, labels, media, or embed sources', () => {
  const text = (label: string) => ({ type: 'text', label });
  const fields = enhanceLinkFields({ name: text('Section link name'), label: text('Link label'), url: text('Link URL'), source: text('Source link'), image: text('Image URL'), links: { type: 'array', arrayFields: { label: text('Link label'), url: text('URL') } } }, 'LinkListBlock');
  assert.equal(fields.name.type, 'text');
  assert.equal(fields.label.type, 'text');
  assert.equal(fields.image.type, 'text');
  assert.equal(fields.url.type, 'custom');
  assert.equal(fields.source.type, 'custom');
  assert.equal(fields.links.arrayFields.url.type, 'custom');
  assert.equal(fields.links.arrayFields.label.type, 'text');
  for (const type of ['VideoBlock', 'CalendlyBlock', 'GitHubRepositoryBlock', 'EmbedFrame']) assert.equal(enhanceLinkFields({ url: text('URL') }, type).url.type, 'text');
});

test('missing references render text and public references follow the current page catalog', () => {
  const catalog = [{ id: 'about', path: '/studio', slug: 'studio', title: 'Studio', published: true, sections: [] }];
  const html = renderToStaticMarkup(<SiteLinksProvider value={{ pages: catalog }}><SiteLink href={{ type: 'page', pageId: 'about' }}>Studio</SiteLink><SiteLink href={{ type: 'page', pageId: 'missing' }}>Missing</SiteLink></SiteLinksProvider>);
  assert.match(html, /href="\/studio"/);
  assert.match(html, /<span>Missing<\/span>/);
});

test('every registered default server-renders with its persisted section anchor', () => {
  assert.equal(Object.keys(builderConfig.components).length, 93);
  for (const [type, component] of Object.entries(builderConfig.components)) {
    const data = normalizeBuilderData({ root: { props: { title: 'Fixture' } }, content: [{ type, props: { ...structuredClone(component.defaultProps || {}), id: `test-${type}`, name: `section-${type.toLowerCase()}` } }] }).data;
    const html = renderToStaticMarkup(<Render config={builderConfig} data={data} />);
    assert.ok(!html.includes('[object Object]'), `${type} retains authored scalar style props`);
    assert.ok(html.includes(`id="section-${type.toLowerCase()}"`), `${type} must forward its public anchor to the actual DOM`);
  }
});
