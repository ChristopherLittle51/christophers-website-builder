import { NextResponse, type NextRequest } from 'next/server';
import { configuredCrawlerOrigin, crawlerFormatFromRequest } from './lib/crawlers';
import { RESERVED_PAGE_SLUGS } from './lib/site-pages';

function nextWithVary() {
  const values = new Set(['Accept', 'User-Agent']);
  const response = NextResponse.next({ headers: { vary: [...values].join(', ') } });
  for (const value of (response.headers.get('Vary') || '').split(',').map((item) => item.trim()).filter(Boolean)) values.add(value);
  values.add('Accept'); values.add('User-Agent');
  response.headers.set('Vary', [...values].join(', '));
  return response;
}

function isPublicPagePath(pathname: string) {
  if (pathname === '/') return true;
  if (!/^\/[^/]+$/.test(pathname) || pathname.includes('.')) return false;
  let slug = '';
  try { slug = decodeURIComponent(pathname.slice(1)).toLowerCase(); } catch { return false; }
  return !RESERVED_PAGE_SLUGS.has(slug);
}

export async function proxy(request: NextRequest) {
  if (request.headers.get('x-crawler-bypass') === '1') return nextWithVary();
  if (request.method !== 'GET') return NextResponse.next();
  const pathname = request.nextUrl.pathname;
  if (!isPublicPagePath(pathname)) return NextResponse.next();
  if (crawlerFormatFromRequest(request) !== 'markdown') return nextWithVary();
  const origin = configuredCrawlerOrigin();
  if (!origin) return nextWithVary();
  // Ask the internal representation route first so a renderer outage cannot
  // replace the ordinary page response with that route's error. A rewrite
  // commits to the route response and cannot fall back to the original page.
  const target = new URL(request.nextUrl.pathname, origin);
  target.pathname = `/content/${pathname === '/' ? 'home' : pathname.slice(1)}.md`;
  target.search = '';
  const headers = new Headers();
  headers.set('accept', request.headers.get('accept') || '*/*');
  headers.set('user-agent', request.headers.get('user-agent') || 'OpenCanvas crawler');
  headers.set('x-crawler-negotiated', '1');
  headers.set('x-crawler-original-path', pathname);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);
  try {
    const representation = await fetch(target, { cache: 'no-store', redirect: 'manual', headers, signal: controller.signal });
    const contentType = (representation.headers.get('content-type') || '').toLowerCase();
    if (!representation.ok || representation.headers.get('location') || (!contentType.includes('text/markdown') && !contentType.includes('text/html'))) return nextWithVary();
    const response = new NextResponse(representation.body, { status: representation.status, headers: representation.headers });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Vary', 'Accept, User-Agent');
    return response;
  } catch {
    return nextWithVary();
  } finally {
    clearTimeout(timeout);
  }
}

export const config = { matcher: ['/', '/((?!_next|api|content|robots.txt|sitemap.xml).*)'] };
