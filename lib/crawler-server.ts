import 'server-only';

import { configuredCrawlerOrigin, crawlerDocumentToMarkdown, crawlerResponseHeaders, extractCrawlerDocument } from './crawlers';

const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 8_000;

export function trustedRenderOrigin(request: Request) {
  return configuredCrawlerOrigin();
}

export async function fetchRenderedHtml(request: Request, path: string) {
  const origin = trustedRenderOrigin(request);
  if (!origin || !path.startsWith('/') || path.startsWith('//') || /^(?:\/api|\/edit|\/_next|\/content|\/robots\.txt|\/sitemap\.xml)(?:\/|$)/.test(path) || path.includes('..')) throw new Error('Crawler render origin is not configured safely.');
  const target = new URL(path, origin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(target, { redirect: 'manual', signal: controller.signal, cache: 'no-store', headers: { accept: 'text/html', 'user-agent': 'OpenCanvas crawler renderer', 'x-crawler-bypass': '1' } });
    if (!response.ok || response.type === 'opaqueredirect' || response.headers.get('location')) throw new Error(`Rendered page returned ${response.status}.`);
    if (!(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) throw new Error('Rendered page was not HTML.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Rendered page had no body.');
    const chunks: Uint8Array[] = []; let total = 0;
    while (true) { const next = await reader.read(); if (next.done) break; total += next.value.byteLength; if (total > MAX_HTML_BYTES) { await reader.cancel(); throw new Error('Rendered page is too large.'); } chunks.push(next.value); }
    return new TextDecoder().decode(Buffer.concat(chunks));
  } finally { clearTimeout(timeout); }
}

export async function renderCrawlerContent(request: Request, path: string) {
  const html = await fetchRenderedHtml(request, path);
  const document = extractCrawlerDocument(html, new URL(path, trustedRenderOrigin(request)).toString());
  return crawlerDocumentToMarkdown(document);
}

export function crawlerContentResponse(body: string, status = 200) {
  return new Response(body, { status, headers: crawlerResponseHeaders() });
}

export function crawlerHtmlResponse(body: string, status = 200) {
  return new Response(body, { status, headers: crawlerResponseHeaders('text/html; charset=utf-8') });
}

export function crawlerErrorResponse(body: string, status: number) {
  return new Response(body, { status, headers: crawlerResponseHeaders('text/plain; charset=utf-8') });
}
