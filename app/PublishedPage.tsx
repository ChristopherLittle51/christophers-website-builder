'use client';

import { Render, type Data } from '@puckeditor/core';
import { builderConfig } from '@/lib/site-builder';
import { SiteLinksProvider } from '@/lib/site-links-client';
import type { LinkPage } from '@/lib/site-catalog';
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings';
import { SharedHeader, SharedFooter } from '@/lib/site-navigation';
import { shellMode, withoutComponents } from '@/lib/site-render-data';
import { pageDesign } from '@/lib/page-design';
import PageViewTracker from './PageViewTracker';

export default function PublishedPage({ data, pages = [], pageId, settings = defaultSiteSettings, preview = false }: { data: Data; pages?: LinkPage[]; pageId?: string; settings?: SiteSettings; preview?: boolean }) {
  const headerMode = shellMode(data, 'header');
  const footerMode = shellMode(data, 'footer');
  const excluded = settings.enabled ? [...(headerMode !== 'override' ? ['HeaderLinkBar'] : []), ...(footerMode !== 'override' ? ['FooterSitemap'] : [])] : [];
  const content = excluded.length ? withoutComponents(data, excluded) : data;
  const design = pageDesign(data);
  return <SiteLinksProvider value={{ pages, currentPageId: pageId }}>
    <div className="published-site-shell" style={design.style}>
    {!preview ? <PageViewTracker /> : null}
    {settings.enabled && settings.header && headerMode === 'inherit' ? <SharedHeader settings={settings} design={design} /> : null}
    <main id="main-content"><Render config={builderConfig} data={content} /></main>
    {settings.enabled && settings.footer && footerMode === 'inherit' ? <SharedFooter settings={settings} design={design} /> : null}
    </div>
  </SiteLinksProvider>;
}
