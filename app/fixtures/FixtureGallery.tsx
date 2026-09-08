'use client';
import { Puck, type Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { useEffect, useMemo, useState } from 'react';
import { builderConfig } from '@/lib/site-builder';
import { normalizeBuilderData } from '@/lib/puck-data';
import EditorPublishButton from '../edit/EditorPublishButton';
import PublishedPage from '../PublishedPage';
import { SiteLinksProvider } from '@/lib/site-links-client';
import { collectSections, type LinkPage } from '@/lib/site-catalog';

export default function FixtureGallery({ selected, editor, stress }: { selected?: string; editor?: boolean; stress?: boolean }) {
  const keys = Object.keys(builderConfig.components);
  const component = selected && keys.includes(selected) ? selected : keys[0];
  const defaults = structuredClone(builderConfig.components[component].defaultProps || {});
  if (stress) {
    for (const key of ['title', 'text', 'heading', 'brand', 'label']) if (typeof defaults[key] === 'string') defaults[key] = 'ExtraordinarilyLongUnbrokenAuthoredHeadingForResponsiveVerification '.repeat(3);
  }
  const [data, setData] = useState<Data>(() => normalizeBuilderData({ root: { props: { ...builderConfig.root?.defaultProps, title: 'Component verification' } }, content: [{ type: component, props: { ...defaults, id: `fixture-${component}`, name: `fixture-${component.toLowerCase()}` } }] }).data);
  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => { const saved = sessionStorage.getItem(`fixture-${component}`); if (saved) { try { setData(normalizeBuilderData(JSON.parse(saved)).data); setEditorKey(key => key + 1); } catch { /* Ignore a stale local fixture. */ } } }, [component]);
  const overrides = useMemo(() => ({ headerActions: () => <EditorPublishButton onPublish={next => { sessionStorage.setItem(`fixture-${component}`, JSON.stringify(next)); }} /> }), [component]);
  const pages: LinkPage[] = [{ id: 'home', title: 'Home', slug: 'home', path: '/', published: true, sections: collectSections(data) }, { id: 'about', title: 'About the studio', slug: 'about', path: '/about', published: true, sections: [{ id: 'mission', label: 'Our mission', name: 'mission' }] }, { id: 'draft', title: 'Unpublished project', slug: 'unpublished', path: '/unpublished', published: false, sections: [] }];
  return <>
    <nav aria-label="Component verification" data-fixture-controls style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12, background: '#eee', color: '#111' }}><label>Component <select aria-label="Component" value={component} onChange={event => { window.location.href = `/fixtures?component=${event.target.value}${editor ? '&mode=editor' : ''}`; }}>{keys.map(key => <option key={key}>{key}</option>)}</select></label><a href={`/fixtures?component=${component}${editor ? '' : '&mode=editor'}`}>{editor ? 'Published view' : 'Editor view'}</a><span>{keys.length} components</span></nav>
    {editor ? <SiteLinksProvider value={{ pages, currentPageId: 'home', editing: true }}><Puck key={editorKey} overrides={overrides} config={builderConfig} data={data} onChange={setData} onPublish={next => { sessionStorage.setItem(`fixture-${component}`, JSON.stringify(next)); }} /></SiteLinksProvider> : <PublishedPage data={data} pages={pages.filter(page => page.published)} pageId="home" preview />}
  </>;
}
