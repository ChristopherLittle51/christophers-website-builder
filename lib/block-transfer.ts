import type { ComponentData, Data } from '@puckeditor/core';
import { normalizeBuilderData } from './puck-data';

export const BLOCK_CLIPBOARD_FORMAT = 'open-canvas-block' as const;
export const BLOCK_CLIPBOARD_VERSION = 1 as const;
export const BLOCK_CLIPBOARD_STORAGE_KEY = 'open-canvas:block-clipboard';

export type BlockClipboard = {
  format: typeof BLOCK_CLIPBOARD_FORMAT;
  formatVersion: typeof BLOCK_CLIPBOARD_VERSION;
  component: ComponentData;
};

export type BlockPasteTarget = {
  index: number;
  zone?: string | null;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isComponent(value: unknown): value is ComponentData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; props?: unknown };
  return typeof candidate.type === 'string' && !!candidate.props && typeof candidate.props === 'object' && !Array.isArray(candidate.props);
}

function stripComponentIds(component: ComponentData) {
  const copy = clone(component);
  const walk = (item: ComponentData) => {
    const props = item.props as Record<string, unknown>;
    delete props.id;
    for (const value of Object.values(props)) {
      if (!Array.isArray(value)) continue;
      for (const child of value) if (isComponent(child)) walk(child);
    }
  };
  walk(copy);
  return copy;
}

function findComponent(data: Data, id: string): ComponentData | null {
  const walk = (items: unknown[]): ComponentData | null => {
    for (const value of items) {
      if (!isComponent(value)) continue;
      if ((value.props as Record<string, unknown>).id === id) return value;
      for (const prop of Object.values(value.props as Record<string, unknown>)) {
        if (!Array.isArray(prop)) continue;
        const nested = walk(prop);
        if (nested) return nested;
      }
    }
    return null;
  };

  const rootMatch = walk(data.content as unknown[]);
  if (rootMatch) return rootMatch;
  for (const zone of Object.values(data.zones || {})) {
    const match = walk(zone as unknown[]);
    if (match) return match;
  }
  return null;
}

function insertAt(items: ComponentData[], index: number, component: ComponentData) {
  const safeIndex = Math.max(0, Math.min(index, items.length));
  items.splice(safeIndex, 0, component);
}

function insertIntoZone(data: Data, zone: string | null | undefined, index: number, component: ComponentData) {
  if (!zone || zone === 'root:default-zone' || zone === 'default-zone') {
    insertAt(data.content as ComponentData[], index, component);
    return true;
  }

  if (data.zones?.[zone]) {
    insertAt(data.zones[zone] as ComponentData[], index, component);
    return true;
  }

  const separator = zone.indexOf(':');
  if (separator <= 0) return false;
  const parentId = zone.slice(0, separator);
  const slotName = zone.slice(separator + 1);
  if (parentId === 'root') {
    const rootProps = data.root?.props as Record<string, unknown> | undefined;
    const slot = rootProps?.[slotName];
    if (!Array.isArray(slot)) return false;
    insertAt(slot as ComponentData[], index, component);
    return true;
  }

  const parent = findComponent(data, parentId);
  if (!parent) return false;
  const slot = (parent.props as Record<string, unknown>)[slotName];
  if (!Array.isArray(slot)) return false;
  insertAt(slot as ComponentData[], index, component);
  return true;
}

export function makeBlockClipboard(component: ComponentData): BlockClipboard {
  return {
    format: BLOCK_CLIPBOARD_FORMAT,
    formatVersion: BLOCK_CLIPBOARD_VERSION,
    component: clone(component),
  };
}

export function parseBlockClipboard(value: unknown): BlockClipboard | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { format?: unknown; formatVersion?: unknown; component?: unknown };
  if (candidate.format !== BLOCK_CLIPBOARD_FORMAT || candidate.formatVersion !== BLOCK_CLIPBOARD_VERSION || !isComponent(candidate.component)) return null;
  return makeBlockClipboard(candidate.component);
}

export function pasteBlock(data: Data, clipboard: BlockClipboard, target?: BlockPasteTarget) {
  const next = clone(data);
  const component = stripComponentIds(clipboard.component);
  const inserted = target
    ? insertIntoZone(next, target.zone, target.index + 1, component)
    : insertIntoZone(next, 'root:default-zone', next.content.length, component);

  if (!inserted) insertIntoZone(next, 'root:default-zone', next.content.length, component);
  return normalizeBuilderData(next).data;
}
