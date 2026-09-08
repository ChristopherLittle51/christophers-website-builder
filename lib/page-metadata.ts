import type { Metadata } from 'next';
import { storage } from './storage';
import { toSitePages } from './site-pages';
import { pagePath } from './site-catalog';
import { starterData } from './templates';
import { resolvePageSeo, privatePageMetadata } from './seo';
import { metadataOrigin } from './seo-server';
import { getSiteSettings } from './site-settings';

export async function metadataForPage(slug?: string): Promise<Metadata> {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const page = site.pages.find(page => slug ? page.slug === slug && page.id !== site.homepageId : page.id === site.homepageId);
  if (!page?.published) return { ...privatePageMetadata, title: 'Page not found' };
  const settings = getSiteSettings(record, 'published');
  const origin = await metadataOrigin(settings.seo);
  const homepage = site.pages.find(page => page.id === site.homepageId)?.published;
  const homeTitle = homepage?.root?.props?.title;
  const defaults = { ...settings.seo, siteName: settings.seo.siteName || (typeof homeTitle === 'string' ? homeTitle.trim() : '') };
  const { metadata } = resolvePageSeo(page.published, pagePath(page, site.homepageId), origin, defaults, settings.crawler.search);
  if (settings.crawler.markdown) metadata.alternates = { ...metadata.alternates, types: { 'text/markdown': new URL(`/content/${encodeURIComponent(page.id)}.md`, origin).href } };
  return metadata;
}
