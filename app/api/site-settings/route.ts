import { withSiteMutation } from '@/lib/site-mutation';
import { sessionFromRequest } from '@/lib/auth';
import { storage, jsonError } from '@/lib/storage';
import { getSiteSettings, normalizeSiteSettings } from '@/lib/site-settings';
import { starterData } from '@/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to edit site settings.', 401);
  const record = await storage().getSite();
  return Response.json({ draft: getSiteSettings(record, 'draft'), published: getSiteSettings(record, 'published') }, { headers: { 'cache-control': 'no-store' } });
}

export function PUT(request: Request) { return withSiteMutation(() => saveSettings(request)); }

async function saveSettings(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to edit site settings.', 401);
  const body = await request.json().catch(() => null);
  if (!body || !body.settings || typeof body.settings !== 'object' || JSON.stringify(body.settings).length > 100_000) return jsonError('Invalid site settings.', 400);
  const record = await storage().getSite();
  const draft = normalizeSiteSettings(body.settings);
  const published = body.publish === true ? draft : getSiteSettings(record, 'published');
  await storage().putSite({ ...(record || { draft: starterData, published: starterData, version: 0, updatedAt: null, updatedBy: 'admin' }), siteSettings: { draft, published }, version: (record?.version || 0) + (body.publish === true ? 1 : 0), updatedAt: new Date().toISOString(), updatedBy: 'admin' });
  return Response.json({ draft, published });
}
