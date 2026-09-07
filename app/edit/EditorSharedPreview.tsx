'use client';
import { createUsePuck } from '@puckeditor/core';
import type { ReactNode } from 'react';
import { useSiteLinks } from '@/lib/site-links-client';
import { SharedHeader, SharedFooter } from '@/lib/site-navigation';
import { shellMode } from '@/lib/site-render-data';

const usePuckData = createUsePuck();
export default function EditorSharedPreview({ children }: { children: ReactNode }) {
  const data = usePuckData(state => state.appState.data);
  const { settings } = useSiteLinks();
  if (!settings?.enabled) return <>{children}</>;
  return <>
    {settings.header && shellMode(data, 'header') === 'inherit' ? <SharedHeader settings={settings} /> : null}
    {children}
    {settings.footer && shellMode(data, 'footer') === 'inherit' ? <SharedFooter settings={settings} /> : null}
  </>;
}
