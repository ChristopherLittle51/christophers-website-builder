'use client';
import { useEffect, useRef, useState } from 'react';
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings';
import { LinkPicker, useSiteLinks } from '@/lib/site-links-client';

export default function SiteSettingsPanel({ onClose, onConvert, beforeSave, onSettingsChange }: { onSettingsChange: (settings: SiteSettings) => void; onClose: () => void; onConvert: () => Promise<void>; beforeSave: () => Promise<void> }) {
  const { pages, currentPageId } = useSiteLinks();
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Loading settings…');
  const [busy, setBusy] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    let live = true;
    fetch('/api/site-settings').then(async response => { if (!response.ok) throw new Error('Could not load settings'); return response.json(); }).then(result => { if (live) { setSettings(result.draft); onSettingsChange(result.draft); setLoaded(true); setStatus('Draft settings'); } }).catch(error => { if (live) setStatus(error.message); });
    return () => { live = false; };
  }, []);
  const patch = (value: Partial<SiteSettings>) => { const next = { ...settings, ...value }; setSettings(next); onSettingsChange(next); };
  const save = async (publish: boolean) => {
    setBusy(true);
    try {
      await beforeSave();
      const response = await fetch('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings, publish }) });
      if (!response.ok) throw new Error('Could not save settings');
      setStatus(publish ? 'Site settings published across all pages.' : 'Draft settings saved. Publish to apply across the site.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Save failed'); }
    finally { setBusy(false); }
  };
  const orderedIds = [...new Set([...settings.navigation.map(item => item.pageId), ...pages.map(page => page.id)])].filter(id => pages.some(page => page.id === id));
  const ordered = orderedIds.map(id => settings.navigation.find(item => item.pageId === id) || { pageId: id, label: '', group: '', hidden: false });
  const move = (index: number, delta: number) => { const next = [...ordered]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; patch({ navigation: next }); };
  const previewMarkdown = async () => {
    setBusy(true);
    try { const response = await fetch(`/api/crawler-preview?page=${encodeURIComponent(currentPageId || '')}`); const result = await response.text(); if (!response.ok) throw new Error(result); setMarkdown(result); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Preview unavailable'); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="site-settings-dialog" aria-labelledby="site-settings-title" onCancel={onClose} onClose={onClose}>
    <header><h2 id="site-settings-title">Site settings</h2><button type="button" onClick={onClose} aria-label="Close site settings">×</button></header>
    <p>Shared settings have their own draft and publish action. Page content is published separately.</p>
    <fieldset disabled={!loaded || busy}><legend>Shared header and footer</legend>
      <label><input type="checkbox" checked={settings.enabled} onChange={event => patch({ enabled: event.target.checked })} /> Enable shared navigation</label>
      <label>Brand name<input value={settings.brand} onChange={event => patch({ brand: event.target.value })} /></label>
      <LinkPicker label="Brand link" value={settings.brandLink} onChange={brandLink => patch({ brandLink })} />
      <div className="site-settings-row"><label><input type="checkbox" checked={settings.header} onChange={event => patch({ header: event.target.checked })} /> Header</label><label><input type="checkbox" checked={settings.footer} onChange={event => patch({ footer: event.target.checked })} /> Footer</label></div>
      <label>Footer description<textarea value={settings.footerText} onChange={event => patch({ footerText: event.target.value })} /></label>
      <p>Existing manual blocks keep their layout. Convert this page to remove its header/footer blocks from the draft and inherit shared navigation. Publish the page to apply conversion.</p>
      <button type="button" onClick={async () => { setBusy(true); try { await onConvert(); setStatus('Current draft converted to shared navigation. Publish this page to apply.'); } catch { setStatus('Conversion failed.'); } finally { setBusy(false); } }}>Convert current draft to shared navigation</button>
    </fieldset>
    <fieldset disabled={!loaded || busy}><legend>Automatic page links</legend><p>Published pages appear automatically. Override labels, groups, order, or hide a page from navigation.</p>
      {ordered.map((item, index) => <div className="site-settings-page" key={item.pageId}><strong>{pages.find(page => page.id === item.pageId)?.title}</strong><label>Link label<input placeholder="Use page title" value={item.label} onChange={event => patch({ navigation: ordered.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} /></label><label>Footer group<input placeholder="Explore" value={item.group} onChange={event => patch({ navigation: ordered.map((entry, i) => i === index ? { ...entry, group: event.target.value } : entry) })} /></label><label><input type="checkbox" checked={item.hidden} onChange={event => patch({ navigation: ordered.map((entry, i) => i === index ? { ...entry, hidden: event.target.checked } : entry) })} /> Hide from navigation</label><div><button type="button" disabled={index === 0} aria-label={`Move ${pages.find(page => page.id === item.pageId)?.title} up`} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === ordered.length - 1} aria-label={`Move ${pages.find(page => page.id === item.pageId)?.title} down`} onClick={() => move(index, 1)}>↓</button></div></div>)}
    </fieldset>
    <fieldset disabled={!loaded || busy}><legend>Additional links</legend>{settings.links.map((link, index) => <div className="site-settings-page" key={index}><label>Label<input value={link.label} onChange={event => patch({ links: settings.links.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} /></label><label>Footer group<input value={link.group} onChange={event => patch({ links: settings.links.map((entry, i) => i === index ? { ...entry, group: event.target.value } : entry) })} /></label><LinkPicker value={link.href} onChange={href => patch({ links: settings.links.map((entry, i) => i === index ? { ...entry, href } : entry) })} /><button type="button" onClick={() => patch({ links: settings.links.filter((_, i) => i !== index) })}>Remove link</button></div>)}<button type="button" onClick={() => patch({ links: [...settings.links, { label: 'New link', group: 'Explore', href: '' }] })}>Add link</button></fieldset>
    <fieldset disabled={!loaded || busy}><legend>Crawlers and Markdown</legend>
      <p>Robots rules express crawler preferences; they do not restrict access. Search engines receive HTML by default.</p>
      {(['search', 'aiSearch', 'aiTraining'] as const).map(key => <label key={key}>{key === 'search' ? 'Search engines' : key === 'aiSearch' ? 'AI search crawlers' : 'AI training crawlers'}<select value={settings.crawler[key]} onChange={event => patch({ crawler: { ...settings.crawler, [key]: event.target.value } })}><option value="allow">Allow crawling</option><option value="disallow">Request no crawling</option></select></label>)}
      <label><input type="checkbox" checked={settings.crawler.markdown} onChange={event => patch({ crawler: { ...settings.crawler, markdown: event.target.checked } })} /> Offer DOM-derived Markdown</label>
      <label><input type="checkbox" checked={settings.crawler.aiMarkdown} onChange={event => patch({ crawler: { ...settings.crawler, aiMarkdown: event.target.checked } })} /> Automatically serve Markdown to recognized AI crawlers</label>
      <button type="button" onClick={() => void previewMarkdown()}>Preview current published page as Markdown</button>
      {markdown !== null ? <pre className="site-settings-markdown">{markdown}</pre> : null}
    </fieldset>
    <footer><p role="status">{status}</p><button type="button" disabled={!loaded || busy} onClick={() => void save(false)}>Save draft settings</button><button type="button" disabled={!loaded || busy} onClick={() => void save(true)}>Publish site settings</button></footer>
  </dialog>;
}
