import { crawlerRobotsDirectives } from '@/lib/crawlers';
import { getSiteSettings } from '@/lib/site-settings';
import { storage } from '@/lib/storage';
import { publicOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const record = await storage().getSite();
  const settings = getSiteSettings(record, 'published');
  const origin = publicOrigin(request, process.env.SITE_URL, settings.seo.siteUrl);
  const sitemap = new URL('/sitemap.xml', origin).toString();
  const body = `${crawlerRobotsDirectives(settings.crawler)}Sitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } });
}
