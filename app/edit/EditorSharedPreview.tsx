'use client';
import { createUsePuck } from '@puckeditor/core';
import type { ReactNode } from 'react';
import { useSiteLinks } from '@/lib/site-links-client';
import { SharedHeader, SharedFooter } from '@/lib/site-navigation';
import { shellMode } from '@/lib/site-render-data';
import { pageDesign } from '@/lib/page-design';

const usePuckData = createUsePuck();
export default function EditorSharedPreview({ children }: { children: ReactNode }) {
  const data = usePuckData(state => state.appState.data);
  const { settings } = useSiteLinks();
  if (!settings?.enabled) return <>{children}</>;
  const design = pageDesign(data);
  return <>
    {settings.header && shellMode(data, 'header') === 'inherit' ? <SharedHeader settings={settings} design={design} /> : null}
    {children}
    {settings.footer && shellMode(data, 'footer') === 'inherit' ? <SharedFooter settings={settings} design={design} /> : null}
  </>;
}
