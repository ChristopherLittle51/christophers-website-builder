import type { Data } from '@puckeditor/core';
import type { SitePage } from './site-pages.ts';

export type LinkSection = { id: string; name: string; label: string };
export type LinkPage = { id: string; slug: string; title: string; published: boolean; sections: LinkSection[]; path: string; noIndex?: boolean };
export type LinkValue = string | { type: 'page'; pageId: string; componentId?: string } | { type: 'url'; url: string };

export function pagePath(page: Pick<SitePage, 'id' | 'slug'>, homepageId: string) {
  return page.id === homepageId ? '/' : `/${encodeURIComponent(page.slug)}`;
}

export function collectSections(data: Data): LinkSection[] {
  const sections: LinkSection[] = [];
  const seen = new Set<string>();
  function walk(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    const node = value as Record<string, any>;
    if (typeof node.type === 'string' && node.props && typeof node.props.id === 'string' && typeof node.props.name === 'string' && !seen.has(node.props.id)) {
      seen.add(node.props.id);
      sections.push({ id: node.props.id, name: node.props.name, label: String(node.props.title || node.props.heading || node.props.label || node.props.name).slice(0, 120) });
    }
    Object.values(node).forEach(walk);
  }
  walk(data.content); walk(data.zones);
  return sections;
}

export function buildPageCatalog(pages: SitePage[], homepageId: string, mode: 'draft' | 'published'): LinkPage[] {
  return pages.filter(page => mode === 'draft' || page.published !== null).map(page => {
    const data = mode === 'draft' ? page.draft : page.published!;
    const props = data.root?.props as Record<string, unknown> | undefined;
    return { id: page.id, slug: page.slug, title: mode === 'published' ? String(props?.navigationTitle || props?.title || page.title) : page.title, published: page.published !== null, path: pagePath(page, homepageId), sections: collectSections(data), noIndex: props?.noIndex === true || props?.noIndex === 'yes' };
  });
}

export function safeHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const href = value.trim();
  if (!href || href === '#' || /[\u0000-\u001f\u007f]/.test(href)) return undefined;
  if (/^(https?:|mailto:|tel:)/i.test(href) || /^(\/[^/\\]|\/$|#|\.\.?\/)/.test(href)) return href;
  // Preserve ordinary relative links, but never unknown URL schemes or protocol-relative URLs.
  if (!/[:\\]/.test(href) && !href.startsWith('//')) return href;
  return undefined;
}

export function resolveLink(value: unknown, pages: LinkPage[], currentPageId?: string, editing = false): string | undefined {
  if (typeof value === 'string') return safeHref(value);
  if (!value || typeof value !== 'object') return undefined;
  const link = value as LinkValue;
  if (typeof link === 'string') return safeHref(link);
  if (link.type === 'url') return safeHref(link.url);
  if (link.type !== 'page') return undefined;
  const page = pages.find(page => page.id === link.pageId && (editing || page.published));
  if (!page) return undefined;
  if (!link.componentId) return page.path;
  const section = page.sections.find(section => section.id === link.componentId);
  if (!section) return undefined;
  return `${page.id === currentPageId ? '' : page.path}#${encodeURIComponent(section.name)}`;
}
