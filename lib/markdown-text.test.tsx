import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownText } from './markdown-text';
import { typographyFields } from './typography';
import { normalizeBuilderData } from './puck-data';

test('Markdown renders formatting, lists and safe links without executable HTML', () => {
  const html = renderToStaticMarkup(<MarkdownText block>{'**Bold** and *italic* [About](/about)\n\n- One\n- Two\n\n[bad](javascript:alert%281%29)\n<script>alert(1)</script>'}</MarkdownText>);
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /<ul>/);
  assert.doesNotMatch(html, /href="javascript:|<script/);
});
test('inline editor element and plain newlines remain intact', () => {
  assert.equal(renderToStaticMarkup(<MarkdownText><span contentEditable suppressContentEditableWarning>**source**</span></MarkdownText>), '<span contentEditable="true">**source**</span>');
  assert.equal(renderToStaticMarkup(<MarkdownText>{'First\nSecond'}</MarkdownText>), 'First\nSecond');
});
test('native typography fields use renderer keys and legacy weights migrate', () => {
  assert.ok(typographyFields().fontWeight);
  assert.equal(typographyFields().FontWeight, undefined);
  const result = normalizeBuilderData({ root: {}, content: [{ type: 'HeadingBlock', props: { id: 'heading', FontWeight: '500', typographyFontWeight: '800' } }] });
  assert.equal(result.data.content[0].props.fontWeight, '500');
  assert.equal(result.data.content[0].props.typographyFontWeight, undefined);
});

test('registered text rendering keeps Markdown strings through link decoration', async () => {
  const { builderConfig } = await import('./site-builder');
  const { Render } = await import('@puckeditor/core');
  const html = renderToStaticMarkup(<Render config={builderConfig} data={{ root: {}, content: [{ type: 'ParagraphBlock', props: { id: 'md', text: '**Bold** [About](/about)' } }] }} />);
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /href="\/about"/);
});
