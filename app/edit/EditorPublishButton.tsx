'use client';
import { createUsePuck, type Data } from '@puckeditor/core';
import { useState } from 'react';

const usePuckData = createUsePuck();
export default function EditorPublishButton({ onPublish }: { onPublish: (data: Data) => void | Promise<void> }) {
  const data = usePuckData(state => state.appState.data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <><button type="button" disabled={busy} style={{ padding: '10px 18px', border: '1px solid #154aaf', borderRadius: 6, background: '#1558c0', color: 'white', fontWeight: 600, minHeight: 44, cursor: 'pointer' }} onClick={async () => {
    setBusy(true); setError('');
    try { await onPublish(data); } catch { setError('Could not publish. Please retry.'); } finally { setBusy(false); }
  }}>{busy ? 'Publishing…' : 'Publish'}</button>{error ? <span role="alert">{error}</span> : null}</>;
}
