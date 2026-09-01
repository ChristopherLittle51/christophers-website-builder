import { sessionFromRequest } from '@/lib/auth';
import { SITE_EXPORT_FORMAT, SITE_EXPORT_VERSION, type SiteExportManifest } from '@/lib/site-export';
import { jsonError, storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to export this site.', 401);

  const [document, media, analyticsEvents] = await Promise.all([
    storage().getSite(),
    storage().listMedia(),
    storage().getAnalyticsEvents(),
  ]);
  if (!document) return jsonError('There is no saved site to export.', 404);

  const manifest: SiteExportManifest = {
    format: SITE_EXPORT_FORMAT,
    formatVersion: SITE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    document,
    media: media.map((asset) => ({ ...asset, downloadPath: `/api/media/${asset.id}` })),
    analyticsEvents,
  };

  const headers = new Headers({ 'cache-control': 'no-store' });
  if (new URL(request.url).searchParams.get('download') === '1') {
    headers.set('content-disposition', `attachment; filename="site-export-${manifest.exportedAt.slice(0, 10)}.json"`);
  }
  return Response.json(manifest, { headers });
}
