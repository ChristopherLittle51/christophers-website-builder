import type { Data } from '@puckeditor/core';
import type { Metadata } from 'next';
import type { SeoSettings } from './site-settings.ts';
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, safeAssetUrl } from './site-metadata.ts';
import { analyticsRequestOrigin } from './analytics-origin.ts';

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const yes = (value: unknown) => value === true || value === 'yes';

/** Canonicals accept root-relative paths or HTTP(S) URLs, never credentials or fragments. */
export function canonicalUrl(value: unknown, origin: string): string | undefined {
  const candidate = text(value);
  if (!candidate || /[\\\u0000-\u0020\u007f]/.test(candidate) || candidate.startsWith('//')) return;
  if (!candidate.startsWith('/') && !/^https?:\/\//i.test(candidate)) return;
  try {
    const url = new URL(candidate, origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
    url.hash = '';
    return url.href;
  } catch { return; }
}

export function publicOrigin(request: Request, configured?: string, published?: string) {
  for (const value of [configured, published]) {
    // An origin setting must be absolute. Paths are deliberately discarded.
    if (!/^https?:\/\//i.test(text(value))) continue;
    const safe = canonicalUrl(value, request.url);
    if (safe) return new URL(safe).origin;
  }
  return analyticsRequestOrigin(request);
}

export function resolvePageSeo(data: Data, path: string, origin: string, defaults: SeoSettings, search: 'allow' | 'disallow' = 'allow') {
  const props = (data.root?.props || {}) as Record<string, unknown>;
  const title = text(props.seoTitle) || text(props.title) || defaults.siteName || DEFAULT_SITE_TITLE;
  // Preserve legacy descriptions; new search copy does not change explicit social copy.
  const description = text(props.seoDescription) || text(props.socialDescription) || defaults.description || DEFAULT_SITE_DESCRIPTION;
  const socialTitle = text(props.socialTitle) || title;
  const socialDescription = text(props.socialDescription) || description;
  const pageImage = safeAssetUrl(props.socialImage);
  const sharedImage = safeAssetUrl(defaults.socialImage);
  const image = pageImage || sharedImage || '/og.png';
  const alt = text(props.socialImageAlt) || (!pageImage && sharedImage ? defaults.socialImageAlt : '') || `${socialTitle} social preview`;
  const ownUrl = new URL(path, origin).href;
  const canonical = canonicalUrl(props.canonicalUrl, origin) || ownUrl;
  const index = search === 'allow' && !yes(props.noIndex);
  const images = [{ url: new URL(image, origin).href, alt, ...(image === '/og.png' ? { width: 1672, height: 941 } : {}) }];
  const metadata: Metadata = {
    title, description, alternates: { canonical },
    robots: { index, follow: !yes(props.noFollow) },
    openGraph: { title: socialTitle, description: socialDescription, url: canonical, siteName: defaults.siteName || DEFAULT_SITE_TITLE, locale: 'en_US', type: 'website', images },
    twitter: { card: 'summary_large_image', title: socialTitle, description: socialDescription, images },
  };
  return { metadata, canonical, includeInSitemap: index && !yes(props.excludeFromSitemap) && canonical === ownUrl };
}

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null,
};
