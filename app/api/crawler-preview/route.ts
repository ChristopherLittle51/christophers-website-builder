import { sessionFromRequest } from '@/lib/auth';
import { crawlerContentResponse, fetchRenderedHtml, trustedRenderOrigin } from '@/lib/crawler-server';
import { extractCrawlerDocument, crawlerDocumentToMarkdown } from '@/lib/crawlers';
import { buildPageCatalog, pagePath } from '@/lib/site-catalog';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { toSitePages } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const previewErrorHeaders = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex', vary: 'Accept, User-Agent' };

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return Response.json({ error: 'Sign in to preview crawler content.' }, { status: 401, headers: previewErrorHeaders });
  const query = new URL(request.url).searchParams;
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const page = buildPageCatalog(site.pages, site.homepageId, 'published').find((candidate) => candidate.id === query.get('page') || candidate.slug === query.get('page'));
  if (!page?.published) return Response.json({ error: 'Published page not found.' }, { status: 404, headers: previewErrorHeaders });
  try {
    const path = pagePath(page, site.homepageId);
    const html = await fetchRenderedHtml(request, path);
    const origin = trustedRenderOrigin(request);
    const document = extractCrawlerDocument(html, new URL(path, origin).toString());
    return crawlerContentResponse(crawlerDocumentToMarkdown(document));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not render published page.' }, { status: 502, headers: previewErrorHeaders });
  }
}
