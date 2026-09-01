'use client';

import { useEffect, useState } from 'react';

export function ExportClient() {
  const [manifest, setManifest] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/export', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal })
      .then(async (response) => {
        const body = await response.text();
        if (!response.ok) throw new Error(body || `Export failed with HTTP ${response.status}.`);
        setManifest(body);
      })
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  return <main style={{ fontFamily: 'ui-monospace, monospace', margin: '0 auto', maxWidth: 960, padding: 24 }}>
    <h1>Site migration export</h1>
    <p>This page uses the current editor session. Keep the exported draft and media inventory private.</p>
    {manifest ? <p><a href="/api/export?download=1">Download JSON manifest</a></p> : null}
    {error ? <pre data-export-error style={{ color: '#a00', whiteSpace: 'pre-wrap' }}>{error}</pre> : null}
    {!manifest && !error ? <p>Preparing export…</p> : null}
    {manifest ? <pre data-export-manifest style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{manifest}</pre> : null}
  </main>;
}
