import { pagePath } from '@/lib/site-catalog';
import { publicOrigin, resolvePageSeo } from '@/lib/seo';
import { getSiteSettings } from '@/lib/site-settings';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { toSitePages } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET(request: Request) {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const settings = getSiteSettings(record, 'published');
  const origin = publicOrigin(request, process.env.SITE_URL, settings.seo.siteUrl);
  const urls = site.pages.flatMap(page => {
    if (!page.published) return [];
    const seo = resolvePageSeo(page.published, pagePath(page, site.homepageId), origin, settings.seo, settings.crawler.search);
    return seo.includeInSitemap ? [`<url><loc>${xml(seo.canonical)}</loc></url>`] : [];
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'cache-control': 'no-store', 'content-type': 'application/xml; charset=utf-8' } });
}
