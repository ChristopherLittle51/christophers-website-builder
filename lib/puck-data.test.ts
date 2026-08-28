import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { normalizeBuilderData } from './puck-data.ts';

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
