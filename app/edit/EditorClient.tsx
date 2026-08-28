'use client';

import { Puck, type Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { builderConfig } from '@/lib/site-builder';
import { normalizeBuilderData } from '@/lib/puck-data';
import { starterData, templates } from '@/lib/templates';
import { useEffect, useRef, useState } from 'react';

type SaveState = 'loading' | 'saved' | 'saving' | 'published' | 'error';

function cloneData(data: Data) {
  return normalizeBuilderData(data).data;
}

export default function EditorClient({ editorName }: { editorName: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [showTemplates, setShowTemplates] = useState(false);
  const latestData = useRef<Data>(starterData);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/site?mode=draft', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the editor');
        return response.json() as Promise<{ data: Data }>;
      })
      .then((result) => {
        if (!active) return;
        const normalized = normalizeBuilderData(result.data).data;
        latestData.current = normalized;
        setData(normalized);
        setSaveState('saved');
      })
      .catch(() => active && setSaveState('error'));
    return () => { active = false; if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const save = async (nextData: Data, publish: boolean) => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/site', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: nextData, publish }),
      });
      if (!response.ok) throw new Error('Save failed');
      setSaveState(publish ? 'published' : 'saved');
      if (publish) setTimeout(() => setSaveState('saved'), 2800);
    } catch {
      setSaveState('error');
      throw new Error('Could not save the website');
    }
  };

  const handleChange = (nextData: Data) => {
    const normalized = normalizeBuilderData(nextData);
    latestData.current = normalized.data;
    if (normalized.changed) {
      setData(normalized.data);
      setEditorKey((key) => key + 1);
    }
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(normalized.data, false), 900);
  };

  const applyTemplate = (template: (typeof templates)[number]) => {
    if (!window.confirm(`Replace the current draft with “${template.name}”? Your published site will stay unchanged until you publish.`)) return;
    const nextData = cloneData(template.data);
    latestData.current = nextData;
    setData(nextData);
    setEditorKey((key) => key + 1);
    setShowTemplates(false);
    void save(nextData, false);
  };

  if (!data) {
    return <main className="editor-loading"><span className="editor-loading__mark">OC</span><p>{saveState === 'error' ? 'The editor could not load. Refresh to try again.' : 'Opening your site studio…'}</p></main>;
  }

  return (
    <div className="editor-shell">
      <div className="editor-intro">
        <div><span>Open Canvas studio</span><strong>Hi {editorName}. Drag in a block, click its content, and make it yours.</strong></div>
        <div className="editor-intro__actions">
          <button type="button" onClick={() => setShowTemplates((open) => !open)}>Templates</button>
          <a href="/" target="_blank">View website ↗</a>
          <form action="/api/auth/logout" method="post"><button type="submit">Sign out</button></form>
          <span className={`save-state save-state--${saveState}`}>{saveState === 'saving' ? 'Saving…' : saveState === 'published' ? 'Published!' : saveState === 'error' ? 'Save failed' : 'All changes saved'}</span>
        </div>
      </div>
      {showTemplates ? <aside className="template-picker" aria-label="Site templates"><div><span>Start from a template</span><button type="button" onClick={() => setShowTemplates(false)} aria-label="Close templates">×</button></div><div className="template-picker__grid">{templates.map((template) => <button type="button" key={template.id} onClick={() => applyTemplate(template)}><strong>{template.name}</strong><span>{template.description}</span><em>Use template →</em></button>)}</div></aside> : null}
      <Puck
        key={editorKey}
        config={builderConfig}
        data={data}
        onChange={handleChange}
        onPublish={async (nextData) => { if (saveTimer.current) clearTimeout(saveTimer.current); const normalized = normalizeBuilderData(nextData).data; latestData.current = normalized; await save(normalized, true); }}
        dnd={{ behavior: 'auto' }}
        dictionary={{ 'header-publish': 'Publish website' }}
        headerTitle="Open Canvas editor"
        headerPath="/edit"
        viewports={[
          { width: 390, height: 'auto', label: 'Phone' },
          { width: 768, height: 'auto', label: 'Tablet' },
          { width: 1280, height: 'auto', label: 'Desktop' },
        ]}
      />
    </div>
  );
}
