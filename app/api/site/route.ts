import { sessionFromRequest } from '@/lib/auth';
import { normalizeBuilderData } from '@/lib/puck-data';
import { jsonError, storage, type SiteDocument } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import type { Data } from '@puckeditor/core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isBuilderData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const data = value as { content?: unknown; root?: unknown };
  return Array.isArray(data.content) && !!data.root && typeof data.root === 'object';
}

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode');
  if (mode === 'draft' && !sessionFromRequest(request)) return jsonError('Sign in to edit this site.', 401);

  const record = await storage().getSite();
  const source = record ? (mode === 'draft' ? record.draft : record.published) : starterData;
  const normalized = normalizeBuilderData(source);
  if (record && mode === 'draft' && normalized.changed) await storage().putSite({ ...record, draft: normalized.data });

  return Response.json({ data: normalized.data, version: record?.version || 0, updatedAt: record?.updatedAt || null, repairedIds: normalized.repairedIds });
}

export async function PUT(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to edit this site.', 401);
  const body = await request.json().catch(() => null) as { data?: unknown; publish?: boolean } | null;
  if (!body || !isBuilderData(body.data)) return jsonError('The page content is not valid.', 400);

  const normalized = normalizeBuilderData(body.data);
  if (JSON.stringify(normalized.data).length > 1_500_000) return jsonError('The page is too large to save.', 413);
  const existing = await storage().getSite();
  const now = new Date().toISOString();
  const record: SiteDocument = {
    published: body.publish ? normalized.data : existing?.published || starterData,
    draft: normalized.data,
    version: (existing?.version || 0) + (body.publish ? 1 : 0),
    updatedAt: now,
    updatedBy: 'admin',
  };
  await storage().putSite(record);
  return Response.json({ ok: true, published: !!body.publish, version: record.version, updatedAt: now, repairedIds: normalized.repairedIds });
}
