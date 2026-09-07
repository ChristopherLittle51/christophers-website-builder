import type { Metadata } from 'next';
import { storage } from './storage';
import { toSitePages } from './site-pages';
import { pagePath } from './site-catalog';
import { starterData } from './templates';
import { getSiteMetadataSettings } from './site-metadata';
import { getSiteSettings } from './site-settings';

export async function metadataForPage(slug?: string): Promise<Metadata> {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const page = site.pages.find(page => slug ? page.slug === slug && page.id !== site.homepageId : page.id === site.homepageId);
  if (!page?.published) return { title: 'Page not found', robots: { index: false, follow: false }, alternates: { canonical: null } };
  const settings = getSiteMetadataSettings(page.published);
  const path = pagePath(page, site.homepageId);
  const props = page.published.root?.props as Record<string, unknown> | undefined;
  const noIndex = props?.noIndex === true || props?.noIndex === 'yes';
  return {
    title: settings.browserTitle, description: settings.socialDescription,
    alternates: { canonical: path, ...(getSiteSettings(record, 'published').crawler.markdown ? { types: { 'text/markdown': `/content/${encodeURIComponent(page.id)}.md` } } : {}) },
    robots: { index: !noIndex, follow: true },
    openGraph: { title: settings.socialTitle, description: settings.socialDescription, url: path, type: 'website', images: [{ url: settings.socialImage, alt: settings.socialImageAlt }] },
    twitter: { card: 'summary_large_image', title: settings.socialTitle, description: settings.socialDescription, images: [{ url: settings.socialImage, alt: settings.socialImageAlt }] },
  };
}
