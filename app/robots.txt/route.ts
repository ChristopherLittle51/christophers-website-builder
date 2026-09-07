import { crawlerRobotsDirectives } from '@/lib/crawlers';
import { getSiteSettings } from '@/lib/site-settings';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { toSitePages } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const settings = getSiteSettings(record, 'published');
  const origin = new URL(process.env.SITE_URL || request.url).origin;
  const sitemap = new URL('/sitemap.xml', origin).toString();
  const body = `${crawlerRobotsDirectives(settings.crawler)}Sitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } });
}
