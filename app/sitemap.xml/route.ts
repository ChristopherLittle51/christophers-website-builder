import { buildPageCatalog, pagePath } from '@/lib/site-catalog';
import { sitemapPagePaths } from '@/lib/crawlers';
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
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  const catalog = buildPageCatalog(site.pages, site.homepageId, 'published');
  const urls = sitemapPagePaths(catalog).map((path) => `<url><loc>${xml(new URL(path, origin).toString())}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'cache-control': 'no-store', 'content-type': 'application/xml; charset=utf-8' } });
}
