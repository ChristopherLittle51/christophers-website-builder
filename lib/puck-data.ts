import type { Data } from '@puckeditor/core';

type ComponentLike = { type: string; props: Record<string, unknown> };

export type NormalizedBuilderData = {
  data: Data;
  changed: boolean;
  repairedIds: number;
};

function isComponent(value: unknown): value is ComponentLike {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; props?: unknown };
  return typeof candidate.type === 'string' && !!candidate.props && typeof candidate.props === 'object' && !Array.isArray(candidate.props);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Puck addresses every component, including slot children, by one globally unique
 * props.id. This read/write boundary repairs missing or duplicated IDs without
 * changing the first valid occurrence. Replacement IDs are deterministic for the
 * same document shape, which prevents two concurrent readers from inventing
 * different repairs for the same stored draft.
 */
export function normalizeBuilderData(input: Data): NormalizedBuilderData {
  const data = JSON.parse(JSON.stringify(input)) as Data;
  const usedIds = new Set<string>();
  let repairedIds = 0;

  const allocateId = (component: ComponentLike, path: string) => {
    const current = typeof component.props.id === 'string' ? component.props.id.trim() : '';
    if (current && !usedIds.has(current)) {
      component.props.id = current;
      usedIds.add(current);
      return;
    }

    const seed = `${component.type}|${current || 'missing'}|${path}`;
    let attempt = 0;
    let nextId = `${component.type}-${stableHash(seed)}`;
    while (usedIds.has(nextId)) {
      attempt += 1;
      nextId = `${component.type}-${stableHash(`${seed}|${attempt}`)}`;
    }
    component.props.id = nextId;
    usedIds.add(nextId);
    repairedIds += 1;
  };

  const walkComponent = (component: ComponentLike, path: string) => {
    allocateId(component, path);
    walkSlotValues(component.props, `${path}.props`);
  };

  const walkSlotValues = (props: Record<string, unknown>, path: string) => {
    for (const [propName, value] of Object.entries(props)) {
      if (!Array.isArray(value)) continue;
      value.forEach((child, index) => {
        if (isComponent(child)) walkComponent(child, `${path}.${propName}[${index}]`);
      });
    }
  };

  data.content.forEach((component, index) => {
    if (isComponent(component)) walkComponent(component, `content[${index}]`);
  });

  if (data.root?.props && typeof data.root.props === 'object') {
    walkSlotValues(data.root.props, 'root.props');
  }

  for (const zoneName of Object.keys(data.zones || {}).sort()) {
    const zone = data.zones?.[zoneName] || [];
    zone.forEach((component, index) => {
      if (isComponent(component)) walkComponent(component, `zones.${zoneName}[${index}]`);
    });
  }

  return { data, changed: repairedIds > 0, repairedIds };
}
