import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { normalizeBuilderData } from './puck-data.ts';
import { makeBlockClipboard, parseBlockClipboard, pasteBlock } from './block-transfer.ts';
import { heroCompositionTemplate } from './templates.ts';

const brokenNestedData: Data = {
  root: { props: {} },
  content: [
    {
      type: 'LayoutContainer',
      props: {
        id: 'layout-1',
        first: [
          { type: 'ParagraphBlock', props: { id: 'shared-child', text: 'First' } },
          { type: 'LayoutContainer', props: { id: 'layout-2', first: [{ type: 'ParagraphBlock', props: { id: 'shared-child', text: 'Nested' } }], second: [] } },
        ],
        second: [{ type: 'ImageBlock', props: { image: '/image.jpg' } }],
      },
    },
  ],
  zones: {},
};

function collectIds(value: unknown, ids: string[] = []) {
  if (!value || typeof value !== 'object') return ids;
  if ('type' in value && 'props' in value) {
    const component = value as { props: Record<string, unknown> };
    if (typeof component.props.id === 'string') ids.push(component.props.id);
  }
  if (Array.isArray(value)) value.forEach((child) => collectIds(child, ids));
  else Object.values(value).forEach((child) => collectIds(child, ids));
  return ids;
}

test('repairs duplicate and missing component IDs across recursively nested slots', () => {
  const result = normalizeBuilderData(brokenNestedData);
  const ids = collectIds(result.data);
  assert.equal(result.repairedIds, 2);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], 'layout-1');
  assert.equal(ids[1], 'shared-child');
});

test('is deterministic and idempotent', () => {
  const first = normalizeBuilderData(brokenNestedData);
  const second = normalizeBuilderData(brokenNestedData);
  assert.deepEqual(first.data, second.data);
  const stable = normalizeBuilderData(first.data);
  assert.equal(stable.changed, false);
  assert.deepEqual(stable.data, first.data);
});

test('enforces one identity space across root content and legacy zones', () => {
  const data = {
    root: { props: {} },
    content: [{ type: 'HeadingBlock', props: { id: 'global-id', text: 'Root content' } }],
    zones: { sidebar: [{ type: 'ParagraphBlock', props: { id: 'global-id', text: 'Legacy zone' } }] },
  } as unknown as Data;
  const result = normalizeBuilderData(data);
  const ids = collectIds(result.data);
  assert.equal(result.repairedIds, 1);
  assert.equal(new Set(ids).size, 2);
});

test('generates valid unique anchor names and normalizes edited names', () => {
  const data = {
    root: { props: {} },
    content: [
      { type: 'TextBlock', props: { id: 'intro', name: 'Photography & Film' } },
      { type: 'ImageBlock', props: { id: 'image', name: 'Photography & Film' } },
      { type: 'ParagraphBlock', props: { id: 'missing-name' } },
    ],
    zones: {},
  } as unknown as Data;

  const result = normalizeBuilderData(data);
  const components = result.data.content as Array<{ props: Record<string, unknown> }>;
  assert.equal(components[0].props.name, 'photography-film');
  assert.equal(components[1].props.name, 'photography-film-2');
  assert.match(String(components[2].props.name), /^generated-paragraphblock-[a-z0-9]+$/);
  assert.equal(result.changed, true);
  assert.equal(normalizeBuilderData(result.data).changed, false);
});

test('keeps the composable hero template globally identifiable through its nested slot', () => {
  const result = normalizeBuilderData(heroCompositionTemplate);
  const ids = collectIds(result.data);
  const hero = result.data.content?.[0] as { type?: string; props?: Record<string, unknown> };
  assert.equal(hero.type, 'HeroLayout');
  assert.equal(hero.props?.layout, 'split');
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(normalizeBuilderData(result.data).changed, false);
});


test('block clipboard preserves nested content but assigns fresh component ids on paste', () => {
  const source = {
    type: 'LayoutContainer',
    props: {
      id: 'source-layout',
      name: 'copied-group',
      first: [{ type: 'ParagraphBlock', props: { id: 'source-child', name: 'copied-child', text: 'Nested copy' } }],
      second: [],
    },
  } as any;
  const destination = normalizeBuilderData({
    root: { props: {} },
    content: [{ type: 'HeadingBlock', props: { id: 'target-heading', name: 'target', text: 'Target' } }],
    zones: {},
  } as Data).data;

  const clipboard = parseBlockClipboard(JSON.parse(JSON.stringify(makeBlockClipboard(source))));
  assert.ok(clipboard);
  const pasted = pasteBlock(destination, clipboard!, { index: 0, zone: 'root:default-zone' });
  const group = pasted.content[1] as any;
  const child = group.props.first[0];

  assert.equal(group.type, 'LayoutContainer');
  assert.equal(child.props.text, 'Nested copy');
  assert.notEqual(group.props.id, 'source-layout');
  assert.notEqual(child.props.id, 'source-child');
  assert.equal((pasted.content[0] as any).props.id, 'target-heading');
});

test('pastes after a selected component inside a nested slot', () => {
  const destination = normalizeBuilderData({
    root: { props: {} },
    content: [{
      type: 'LayoutContainer',
      props: {
        id: 'layout-target',
        name: 'layout-target',
        first: [{ type: 'ParagraphBlock', props: { id: 'first-child', name: 'first-child', text: 'Before' } }],
        second: [],
      },
    }],
    zones: {},
  } as unknown as Data).data;
  const clipboard = makeBlockClipboard({ type: 'ParagraphBlock', props: { id: 'copied-paragraph', name: 'copied-paragraph', text: 'After' } } as any);
  const pasted = pasteBlock(destination, clipboard, { index: 0, zone: 'layout-target:first' });
  const children = (pasted.content[0] as any).props.first;

  assert.equal(children.length, 2);
  assert.equal(children[0].props.text, 'Before');
  assert.equal(children[1].props.text, 'After');
  assert.notEqual(children[1].props.id, 'copied-paragraph');
});
