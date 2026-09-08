'use client';

import { cloneElement, createContext, isValidElement, useContext, useId, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import type { SiteSettings } from './site-settings';
import type { CustomFieldRender } from '@puckeditor/core';
import { resolveLink, safeHref, type LinkPage, type LinkValue } from './site-catalog';
export type { LinkValue, LinkPage } from './site-catalog';

type LinkContext = { pages: LinkPage[]; currentPageId?: string; editing?: boolean; settings?: SiteSettings };
const SiteLinks = createContext<LinkContext>({ pages: [] });
export const SiteLinksProvider = SiteLinks.Provider;
export const useSiteLinks = () => useContext(SiteLinks);

export function SiteLink({ href, children, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href?: LinkValue; children?: ReactNode }) {
  const { pages, currentPageId, editing } = useSiteLinks();
  const resolved = resolveLink(href, pages, currentPageId, editing);
  if (!resolved) return <span className={props.className} style={props.style}>{children}</span>;
  return <a {...props} href={resolved} rel={props.target === '_blank' ? 'noopener noreferrer' : props.rel}>{children}{props.target === '_blank' ? <span className="sr-only"> (opens in a new tab)</span> : null}</a>;
}

export function LinkPicker({ label = 'Link destination', value = '', onChange, readOnly }: { label?: string; value?: LinkValue; onChange: (value: LinkValue) => void; readOnly?: boolean }) {
  const context = useSiteLinks();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const candidates = context.pages.flatMap(page => [
    { label: `${page.title} · ${page.path}${page.published ? '' : ' (unpublished)'}`, value: { type: 'page', pageId: page.id } as LinkValue },
    ...page.sections.map(section => ({ label: `${page.title} / ${section.label} · #${section.name}${page.published ? '' : ' (unpublished)'}`, value: { type: 'page', pageId: page.id, componentId: section.id } as LinkValue })),
  ]).filter(item => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  const selected = typeof value === 'object' && value?.type === 'page' ? context.pages.find(page => page.id === value.pageId) : undefined;
  const section = typeof value === 'object' && value?.type === 'page' && value.componentId ? selected?.sections.find(s => s.id === value.componentId) : undefined;
  const missing = typeof value === 'object' && value?.type === 'page' && (!selected || (value.componentId && !section));
  const raw = typeof value === 'string' ? value : value?.type === 'url' ? value.url : '';
  const select = (index: number) => { if (candidates[index]) onChange(candidates[index].value); setOpen(false); setQuery(''); };
  return <div className="site-link-picker">
    <label htmlFor={id}>{label}</label>
    {typeof value === 'object' && value?.type === 'page' ? <p className="site-link-picker__selected">{missing ? 'Missing target — choose another destination' : `${selected?.title}${section ? ` / ${section.label}` : ''}${selected?.published ? '' : ' (unpublished)'}`}<button type="button" disabled={readOnly} onClick={() => onChange('')}>Clear</button></p> : null}
    <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={open && candidates[active] ? `${id}-${active}` : undefined} disabled={readOnly} placeholder="Search pages or sections…" value={query} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0, Math.min(candidates.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); }
      if (event.key === 'Enter' && open && candidates[active]) { event.preventDefault(); select(active); }
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    }} />
    {open ? <ul id={`${id}-results`} role="listbox" aria-label="Page and section destinations">{candidates.map((item, index) => <li id={`${id}-${index}`} role="option" aria-selected={active === index} key={JSON.stringify(item.value)} onMouseDown={event => event.preventDefault()} onClick={() => select(index)}>{item.label}</li>)}{!candidates.length ? <li role="presentation">No matching destinations</li> : null}</ul> : null}
    <label htmlFor={`${id}-url`}>Or enter a URL, email, or telephone link</label>
    <input id={`${id}-url`} disabled={readOnly} value={raw} placeholder="https://… /about #section mailto:… tel:…" onChange={event => onChange(event.target.value)} />
    {raw && !safeHref(raw) ? <small role="status">Enter a valid destination; empty and unsupported links are not clickable.</small> : null}
  </div>;
}

export function linkField(label = 'Link destination') {
  return { type: 'custom' as const, label, render: (({ value, onChange, readOnly, field }) => <LinkPicker label={field.label || label} value={value} onChange={onChange} readOnly={readOnly} />) as CustomFieldRender<LinkValue> };
}

export function enhanceLinkFields(fields: Record<string, any> | undefined, componentType = ''): Record<string, any> {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, field]) => {
    const explicitLink = !['name', 'label', 'title', 'text'].includes(key) && /(?:link|destination)\s*$/i.test(field.label || '');
    const source = !explicitLink && (/^(video|image|poster|audio|embed|repository|script|source|texture|src)/i.test(key) || (/^(url|href)$/i.test(key) && /^(CalendlyBlock|GitHubRepositoryBlock|EmbedFrame|CustomCodeBlock|VideoBlock)$/.test(componentType)));
    if (field.type === 'array') return [key, { ...field, arrayFields: enhanceLinkFields(field.arrayFields, componentType) }];
    if (field.type === 'object') return [key, { ...field, objectFields: enhanceLinkFields(field.objectFields, componentType) }];
    if (!source && field.type === 'text' && (/(?:url|href|link)$/i.test(key) || explicitLink)) return [key, linkField(field.label)];
    return [key, field];
  }));
}

function resolveValues(value: any, context: LinkContext): any {
  if (!value || typeof value !== 'object' || isValidElement(value)) return value;
  if (value.type === 'page' && typeof value.pageId === 'string' || value.type === 'url' && typeof value.url === 'string') return resolveLink(value, context.pages, context.currentPageId, context.editing) || '';
  if (Array.isArray(value)) return value.map(v => resolveValues(v, context));
  // Puck slot/render functions and non-plain runtime objects must retain identity.
  if (Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === 'puck' ? child : resolveValues(child, context)]));
}

function cleanAnchors(node: ReactNode): ReactNode {
  // Preserve scalar children and authored keys. Children.map converts strings
  // to arrays and rewrites keys, including those owned by inline/slot renderers.
  if (Array.isArray(node)) return node.map((child, index) => {
    const cleaned = cleanAnchors(child);
    return isValidElement(cleaned) && cleaned.key == null ? cloneElement(cleaned, { key: `unkeyed-${index}` }) : cleaned;
  });
  if (!isValidElement<Record<string, any>>(node)) return node;
  const children = node.props.children == null ? node.props.children : cleanAnchors(node.props.children);
  if (node.type === 'a') {
    const href = safeHref(node.props.href);
    if (!href) return <span key={node.key} className={node.props.className} style={node.props.style} id={node.props.id}>{children}</span>;
    return cloneElement(node, { href, ...(node.props.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) }, children);
  }
  return node.props.children == null ? node : cloneElement(node, {}, children);
}

export function withResolvedLinks(render: (props: any) => ReactNode) {
  function ResolvedBlock(props: any) {
    const context = useSiteLinks();
    return cleanAnchors(render(resolveValues(props, context)));
  }
  return (props: any) => <ResolvedBlock {...props} />;
}
