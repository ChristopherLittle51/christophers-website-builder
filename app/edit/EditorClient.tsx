'use client';

import EditorPublishButton from './EditorPublishButton';
import EditorSharedPreview from './EditorSharedPreview';
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings';
import SiteSettingsPanel from './SiteSettingsPanel';
import { SiteLinksProvider } from '@/lib/site-links-client';
import { collectSections, type LinkPage } from '@/lib/site-catalog';
import { withoutComponents } from '@/lib/site-render-data';
import { Puck, type Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { builderConfig } from '@/lib/site-builder';
import { normalizeBuilderData } from '@/lib/puck-data';
import { starterData, templates } from '@/lib/templates';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const editorViewports = [{ width: 390, height: 'auto' as const, label: 'Phone' }, { width: 768, height: 'auto' as const, label: 'Tablet' }, { width: 1280, height: 'auto' as const, label: 'Desktop' }];
const editorDnd = { behavior: 'auto' as const };

type SaveState = 'loading' | 'saved' | 'saving' | 'published' | 'error';
type PageSummary = { id: string; slug: string; title: string };
type PageDialog = 'create' | 'rename' | 'delete' | null;

function cloneData(data: Data) {
  return normalizeBuilderData(data).data;
}

export default function EditorClient({ editorName }: { editorName: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [showTemplates, setShowTemplates] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [catalog, setCatalog] = useState<LinkPage[]>([]);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [homepageId, setHomepageId] = useState('home');
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [activePage, setActivePage] = useState<PageSummary | null>(null);
  const [pageDialog, setPageDialog] = useState<PageDialog>(null);
  const [pageTitleInput, setPageTitleInput] = useState('');
  const [pageSlugInput, setPageSlugInput] = useState('');
  const [templateToApply, setTemplateToApply] = useState<(typeof templates)[number] | null>(null);
  const latestData = useRef<Data>(starterData);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPage = useCallback(async (pageId?: string, replaceEditor = false) => {
    setSaveState('loading');
    try {
      const query = new URLSearchParams({ mode: 'draft' });
      if (pageId) query.set('page', pageId);
      const response = await fetch(`/api/site?${query}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load the editor');
      const result = await response.json() as { data: Data; page: PageSummary; pages: PageSummary[]; catalog: LinkPage[]; homepageId: string };
      const normalized = normalizeBuilderData(result.data).data;
      latestData.current = normalized;
      setData(normalized);
      setPages(result.pages);
      setCatalog(result.catalog);
      setHomepageId(result.homepageId);
      setActivePage(result.page);
      if (replaceEditor) setEditorKey((key) => key + 1);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  useEffect(() => {
    void loadPage();
    void fetch('/api/site-settings').then(response => response.ok ? response.json() : null).then(result => { if (result) setSiteSettings(result.draft); });
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [loadPage]);

  const save = useCallback(async (nextData: Data, publish: boolean) => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/site', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: nextData, pageId: activePage?.id, publish }),
      });
      if (!response.ok) throw new Error('Save failed');
      const result = await response.json();
      if (result.catalog) setCatalog(result.catalog);
      setSaveState(publish ? 'published' : 'saved');
      if (publish) setTimeout(() => setSaveState('saved'), 2800);
    } catch {
      setSaveState('error');
      throw new Error('Could not save the website');
    }
  }, [activePage?.id]);

  const publish = useCallback(async (nextData: Data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const normalized = normalizeBuilderData(nextData).data;
    latestData.current = normalized;
    await save(normalized, true);
  }, [save]);
  // Puck treats override functions as component types. Keep them stable across
  // typing, catalog updates and autosave status changes.
  const overrides = useMemo(() => ({
    preview: EditorSharedPreview,
    headerActions: () => <EditorPublishButton onPublish={publish} />,
  }), [publish]);

  const handleChange = (nextData: Data) => {
    const normalized = normalizeBuilderData(nextData);
    latestData.current = normalized.data;
    // Puck owns the active editor document after mount. Remounting it just to
    // persist repaired IDs/anchors discards its current viewport, which made a
    // newly dropped block jump the editor back to the top. Save the normalized
    // representation, but leave the mounted editor (and its scroll position)
    // intact. Template replacement remains the intentional remount path.
    setCatalog(current => current.map(page => page.id === activePage?.id ? { ...page, sections: collectSections(normalized.data) } : page));
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveTimer.current = null; void save(normalized.data, false).catch(() => {}); }, 900);
  };

  const applyTemplate = (template: (typeof templates)[number]) => {
    const nextData = cloneData(template.data);
    latestData.current = nextData;
    setData(nextData);
    setEditorKey((key) => key + 1);
    setShowTemplates(false);
    void save(nextData, false);
  };

  const flushPendingSave = async () => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    await save(latestData.current, false);
  };

  const switchPage = async (pageId: string) => {
    await flushPendingSave();
    await loadPage(pageId, true);
  };

  const createPage = async (title: string) => {
    await flushPendingSave();
    const response = await fetch('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create', title }) });
    const result = await response.json() as { page?: PageSummary; error?: string };
    if (!response.ok || !result.page) { setSaveState('error'); return; }
    await switchPage(result.page.id);
  };

  const renamePage = async (title: string, slug: string) => {
    if (!activePage) return;
    await flushPendingSave();
    const response = await fetch('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'rename', pageId: activePage.id, title, slug }) });
    if (!response.ok) { setSaveState('error'); return; }
    await switchPage(activePage.id);
  };

  const deletePage = async () => {
    if (!activePage || activePage.id === homepageId) return;
    await flushPendingSave();
    const response = await fetch('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete', pageId: activePage.id }) });
    const result = await response.json() as { pages?: PageSummary[] };
    if (!response.ok || !result.pages?.[0]) { setSaveState('error'); return; }
    await switchPage(result.pages[0].id);
  };

  const openPageDialog = (dialog: Exclude<PageDialog, null>) => {
    setPageDialog(dialog);
    setPageTitleInput(dialog === 'create' ? 'Untitled page' : activePage?.title || '');
    setPageSlugInput(dialog === 'rename' ? activePage?.slug || '' : '');
  };

  const submitPageDialog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = pageTitleInput.trim();
    if (pageDialog === 'create' && title) await createPage(title);
    if (pageDialog === 'rename' && title) await renamePage(title, pageSlugInput);
    if (pageDialog === 'delete') await deletePage();
    setPageDialog(null);
  };

  if (!data) {
    return <main className="editor-loading"><span className="editor-loading__mark">OC</span><p>{saveState === 'error' ? 'The editor could not load. Refresh to try again.' : 'Opening your site studio…'}</p></main>;
  }

  return (
    <SiteLinksProvider value={{ pages: catalog, currentPageId: activePage?.id, editing: true, settings: siteSettings }}><div className="editor-shell">
      <div className="editor-intro">
        <div><span>Open Canvas studio</span><strong>Hi {editorName}. Drag in a block, click its content, and make it yours.</strong></div>
        <div className="editor-intro__actions">
          <button type="button" onClick={() => setShowSiteSettings(true)}>Site settings</button>
          <button type="button" onClick={() => setShowTemplates((open) => !open)}>Templates</button>
          <a href="/" target="_blank">View website ↗</a>
          <a href="/analytics">Analytics</a>
          <form action="/api/auth/logout" method="post"><button type="submit">Sign out</button></form>
          <span className={`save-state save-state--${saveState}`}>{saveState === 'saving' ? 'Saving…' : saveState === 'published' ? 'Published!' : saveState === 'error' ? 'Save failed' : 'All changes saved'}</span>
        </div>
      </div>
      <nav className="editor-pages" aria-label="Site pages"><div className="editor-pages__list">{pages.map((page) => <button type="button" key={page.id} className={page.id === activePage?.id ? 'is-active' : ''} onClick={() => void switchPage(page.id)}>{page.id === homepageId ? 'Home' : page.title}</button>)}</div><div className="editor-pages__actions"><button type="button" onClick={() => openPageDialog('create')}>New page</button><button type="button" onClick={() => openPageDialog('rename')} disabled={!activePage}>Settings</button><button type="button" onClick={() => openPageDialog('delete')} disabled={!activePage || activePage.id === homepageId}>Delete</button></div></nav>
      {showTemplates ? <aside className="template-picker" aria-label="Site templates"><div><span>Start from a template</span><button type="button" onClick={() => setShowTemplates(false)} aria-label="Close templates">×</button></div><div className="template-picker__grid">{templates.map((template) => <button type="button" key={template.id} onClick={() => setTemplateToApply(template)}><strong>{template.name}</strong><span>{template.description}</span><em>Use template →</em></button>)}</div></aside> : null}
      {pageDialog ? <div className="editor-dialog-backdrop" role="presentation"><form className="editor-dialog" onSubmit={(event) => void submitPageDialog(event)}><div><span>{pageDialog === 'create' ? 'New page' : pageDialog === 'rename' ? 'Page settings' : 'Delete page'}</span><button type="button" onClick={() => setPageDialog(null)} aria-label="Close dialog">×</button></div>{pageDialog === 'delete' ? <p>Delete “{activePage?.title}”? This cannot be undone.</p> : <><label>Page name<input autoFocus value={pageTitleInput} onChange={(event) => setPageTitleInput(event.target.value)} required /></label>{pageDialog === 'rename' ? <label>Public URL slug<input value={pageSlugInput} onChange={(event) => setPageSlugInput(event.target.value)} placeholder="about" /></label> : null}</>}<footer><button type="button" onClick={() => setPageDialog(null)}>Cancel</button><button type="submit" className={pageDialog === 'delete' ? 'is-danger' : ''}>{pageDialog === 'delete' ? 'Delete page' : 'Save page'}</button></footer></form></div> : null}
      {templateToApply ? <div className="editor-dialog-backdrop" role="presentation"><div className="editor-dialog" role="dialog" aria-modal="true" aria-label="Confirm template"><div><span>Replace draft?</span><button type="button" onClick={() => setTemplateToApply(null)} aria-label="Close dialog">×</button></div><p>Use “{templateToApply.name}” for this page? Its published version will stay unchanged until you publish.</p><footer><button type="button" onClick={() => setTemplateToApply(null)}>Cancel</button><button type="button" onClick={() => { applyTemplate(templateToApply); setTemplateToApply(null); }}>Use template</button></footer></div></div> : null}
      {showSiteSettings ? <SiteSettingsPanel onSettingsChange={setSiteSettings} onClose={() => setShowSiteSettings(false)} beforeSave={flushPendingSave} onConvert={async () => {
        await flushPendingSave();
        const converted = withoutComponents(latestData.current, ['HeaderLinkBar', 'FooterSitemap']);
        converted.root = { ...converted.root, props: { ...converted.root.props, ...{ sharedHeader: 'inherit', sharedFooter: 'inherit' } } };
        latestData.current = converted;
        await save(converted, false);
        setData(converted); setEditorKey(key => key + 1);
      }} /> : null}
      <Puck
        key={editorKey}
        config={builderConfig}
        overrides={overrides}
        data={data}
        onChange={handleChange}
        onPublish={publish}
        dnd={editorDnd}
        dictionary={{ 'header-publish': 'Publish website' }}
        headerTitle="Open Canvas editor"
        headerPath="/edit"
        viewports={editorViewports}
      />
    </div></SiteLinksProvider>
  );
}
