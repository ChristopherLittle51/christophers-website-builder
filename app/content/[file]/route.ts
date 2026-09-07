import { crawlerContentResponse, crawlerErrorResponse, crawlerHtmlResponse, fetchRenderedHtml, renderCrawlerContent } from '@/lib/crawler-server';
import { hasExplicitMarkdownAccept, isAiCrawlerUserAgent } from '@/lib/crawlers';
import { getSiteSettings } from '@/lib/site-settings';
import { buildPageCatalog, pagePath } from '@/lib/site-catalog';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { toSitePages } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([^./]+)\.md$/.exec(file);
  if (!match) return crawlerErrorResponse('Use /content/<page-id>.md', 400);
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const settings = getSiteSettings(record, 'published');
  const catalog = buildPageCatalog(site.pages, site.homepageId, 'published');
  const negotiated = request.headers.get('x-crawler-negotiated') === '1';
  const originalPath = request.headers.get('x-crawler-original-path');
  const page = negotiated && originalPath
    ? catalog.find((candidate) => candidate.path === originalPath)
    : catalog.find((candidate) => candidate.id === match[1]);
  if (!page?.published) return crawlerErrorResponse('Published page not found.', 404);
  if (!settings.crawler.markdown) {
    if (negotiated) {
      try { return crawlerHtmlResponse(await fetchRenderedHtml(request, page.path)); } catch { return crawlerErrorResponse('Could not render the published page.', 502); }
    }
    return crawlerErrorResponse('Markdown content is disabled.', 404);
  }
  const automaticAiMarkdown = isAiCrawlerUserAgent(request.headers.get('user-agent') || '') && !hasExplicitMarkdownAccept(request);
  if (negotiated && automaticAiMarkdown && !settings.crawler.aiMarkdown) {
    try { return crawlerHtmlResponse(await fetchRenderedHtml(request, page.path)); } catch { return crawlerErrorResponse('Could not render the published page.', 502); }
  }
  try { return crawlerContentResponse(await renderCrawlerContent(request, pagePath(page, site.homepageId))); }
  catch (error) {
    if (negotiated) {
      try { return crawlerHtmlResponse(await fetchRenderedHtml(request, page.path)); } catch { /* report the original extraction failure below */ }
    }
    return crawlerErrorResponse(error instanceof Error ? error.message : 'Could not render crawler content.', 502);
  }
}
