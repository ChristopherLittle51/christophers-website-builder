import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Render } from '@puckeditor/core';
import { builderConfig } from './site-builder';
import { normalizeBuilderData } from './puck-data';
import { enhanceLinkFields, SiteLinksProvider, SiteLink } from './site-links-client';
import { SharedHeader, SharedFooter } from './site-navigation';
import { normalizeSiteSettings } from './site-settings';
import { pageDesign } from './page-design';

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

test('image link uses the site link picker for its destination', () => {
  assert.equal(builderConfig.components.ImageLink.fields?.url?.type, 'custom');
});

test('every registered default server-renders with its persisted section anchor', () => {
  assert.equal(Object.keys(builderConfig.components).length, 94);
  for (const [type, component] of Object.entries(builderConfig.components)) {
    const data = normalizeBuilderData({ root: { props: { title: 'Fixture' } }, content: [{ type, props: { ...structuredClone(component.defaultProps || {}), id: `test-${type}`, name: `section-${type.toLowerCase()}` } }] }).data;
    const html = renderToStaticMarkup(<Render config={builderConfig} data={data} />);
    assert.ok(!html.includes('[object Object]'), `${type} retains authored scalar style props`);
    assert.ok(html.includes(`id="section-${type.toLowerCase()}"`), `${type} must forward its public anchor to the actual DOM`);
  }
});


test('shared header and footer render with the current page design tokens', () => {
  const pages = [{ id: 'home', path: '/', slug: 'home', title: 'Home', published: true, sections: [] }];
  const settings = normalizeSiteSettings({ enabled: true, brand: 'Page-aware studio', footerText: 'Footer copy' });
  const design = pageDesign({
    root: { props: {
      paperColor: '#121212',
      inkColor: '#f2f2f2',
      accentColor: '#ff6600',
      displayFont: 'playfair',
      bodyFont: 'manrope',
      accentFont: 'ibm-plex-mono',
      headingStyle: 'classic',
      contentWidth: 'focused',
      corners: 'soft',
    } },
    content: [],
  } as any);

  const html = renderToStaticMarkup(
    <SiteLinksProvider value={{ pages, currentPageId: 'home' }}>
      <SharedHeader settings={settings} design={design} />
      <SharedFooter settings={settings} design={design} />
    </SiteLinksProvider>,
  );

  assert.match(html, /shared-site-header site-heading--classic site-width--focused site-corners--soft/);
  assert.match(html, /shared-site-footer site-heading--classic site-width--focused site-corners--soft/);
  assert.match(html, /--site-paper:#121212/);
  assert.match(html, /--site-ink:#f2f2f2/);
  assert.match(html, /--site-accent:#ff6600/);
  assert.match(html, /Playfair/);
  assert.match(html, /Manrope/);
  assert.match(html, /IBM Plex Mono/);
});
