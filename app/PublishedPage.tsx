'use client';

import type { CSSProperties } from 'react';
import { FONT_FAMILIES } from '@/lib/typography';
import { Render, type Data } from '@puckeditor/core';
import { builderConfig } from '@/lib/site-builder';
import { SiteLinksProvider } from '@/lib/site-links-client';
import type { LinkPage } from '@/lib/site-catalog';
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings';
import { SharedHeader, SharedFooter } from '@/lib/site-navigation';
import { shellMode, withoutComponents } from '@/lib/site-render-data';
import PageViewTracker from './PageViewTracker';

export default function PublishedPage({ data, pages = [], pageId, settings = defaultSiteSettings, preview = false }: { data: Data; pages?: LinkPage[]; pageId?: string; settings?: SiteSettings; preview?: boolean }) {
  const headerMode = shellMode(data, 'header');
  const footerMode = shellMode(data, 'footer');
  const excluded = settings.enabled ? [...(headerMode !== 'override' ? ['HeaderLinkBar'] : []), ...(footerMode !== 'override' ? ['FooterSitemap'] : [])] : [];
  const content = excluded.length ? withoutComponents(data, excluded) : data;
  const props = (data.root?.props || {}) as Record<string, string>;
  const shellStyle = { '--site-paper': props.paperColor || '#f7f7f3', '--site-ink': props.inkColor || '#050505', '--site-accent': props.accentColor || '#d8ff00', '--font-display': FONT_FAMILIES[props.displayFont || 'space-grotesk'], '--font-body': FONT_FAMILIES[props.bodyFont || 'inter'], background: props.paperColor || '#f7f7f3', color: props.inkColor || '#050505', fontFamily: FONT_FAMILIES[props.bodyFont || 'inter'] } as CSSProperties;
  return <SiteLinksProvider value={{ pages, currentPageId: pageId }}>
    <div className="published-site-shell" style={shellStyle}>
    {!preview ? <PageViewTracker /> : null}
    {settings.enabled && settings.header && headerMode === 'inherit' ? <SharedHeader settings={settings} /> : null}
    <main id="main-content"><Render config={builderConfig} data={content} /></main>
    {settings.enabled && settings.footer && footerMode === 'inherit' ? <SharedFooter settings={settings} /> : null}
    </div>
  </SiteLinksProvider>;
}
