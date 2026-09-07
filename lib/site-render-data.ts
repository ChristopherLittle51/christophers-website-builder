import type { Data } from '@puckeditor/core';

export function containsComponent(data: Data, type: string): boolean {
  function walk(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(walk);
    const node = value as Record<string, unknown>;
    return node.type === type || Object.values(node).some(walk);
  }
  return walk(data.content) || walk(data.zones);
}

export function withoutComponents(data: Data, types: string[]): Data {
  function walk(value: any): any {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.filter(item => !(item && types.includes(item.type))).map(walk);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, walk(child)]));
  }
  return walk(data);
}

export function shellMode(data: Data, region: 'header' | 'footer'): 'inherit' | 'override' | 'hidden' {
  const value = (data.root?.props as Record<string, unknown> | undefined)?.[region === 'header' ? 'sharedHeader' : 'sharedFooter'];
  if (value === 'inherit' || value === 'override' || value === 'hidden') return value;
  return containsComponent(data, region === 'header' ? 'HeaderLinkBar' : 'FooterSitemap') ? 'override' : 'inherit';
}
