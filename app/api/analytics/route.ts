import { sessionFromRequest } from '@/lib/auth';
import { analyticsDays, getAnalyticsReport, recordPageView } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (sessionFromRequest(request)) return new Response(null, { status: 204 });
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin && origin !== requestOrigin) return Response.json({ error: 'Cross-origin analytics events are not accepted.' }, { status: 403 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8_192) return Response.json({ error: 'Analytics event is too large.' }, { status: 413 });
  const body = await request.json().catch(() => null) as { type?: unknown; path?: unknown; visitorId?: unknown; referrer?: unknown } | null;
  if (!body || body.type !== 'page_view') return Response.json({ error: 'Unsupported analytics event.' }, { status: 400 });
  try {
    await recordPageView({
      path: body.path,
      visitorId: body.visitorId,
      referrer: body.referrer,
      requestOrigin,
      userAgent: request.headers.get('user-agent'),
    });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: 'Could not record analytics event.' }, { status: 503 });
  }
}

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return Response.json({ error: 'Sign in to view analytics.' }, { status: 401 });
  const days = analyticsDays(new URL(request.url).searchParams.get('days'));
  try {
    return Response.json(await getAnalyticsReport(days));
  } catch {
    return Response.json({ error: 'Could not load analytics.' }, { status: 503 });
  }
}
