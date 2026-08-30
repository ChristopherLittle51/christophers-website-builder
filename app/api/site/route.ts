import { sessionFromRequest } from '@/lib/auth';
import { normalizeBuilderData } from '@/lib/puck-data';
import { summaries, toSitePages, uniquePageSlug } from '@/lib/site-pages';
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

function homeMirror(pages: ReturnType<typeof toSitePages>['pages'], homepageId: string) {
  return pages.find((page) => page.id === homepageId) || pages[0];
}

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode');
  const pageId = new URL(request.url).searchParams.get('page');
  if (mode === 'draft' && !sessionFromRequest(request)) return jsonError('Sign in to edit this site.', 401);

  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const page = site.pages.find((candidate) => candidate.id === pageId) || site.pages.find((candidate) => candidate.id === site.homepageId) || site.pages[0];
  const source = mode === 'draft' ? page.draft : page.published || starterData;
  const normalized = normalizeBuilderData(source);
  if (record && mode === 'draft' && normalized.changed) {
    const pages = site.pages.map((candidate) => candidate.id === page.id ? { ...candidate, draft: normalized.data } : candidate);
    const home = homeMirror(pages, site.homepageId);
    await storage().putSite({ ...record, pages, homepageId: site.homepageId, draft: home.draft, published: home.published || starterData });
  }

  return Response.json({ data: normalized.data, page: { id: page.id, slug: page.slug, title: page.title }, pages: summaries(site.pages), homepageId: site.homepageId, version: record?.version || 0, updatedAt: record?.updatedAt || null, repairedIds: normalized.repairedIds });
}

export async function PUT(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to edit this site.', 401);
  const body = await request.json().catch(() => null) as { data?: unknown; pageId?: unknown; publish?: boolean } | null;
  if (!body || !isBuilderData(body.data)) return jsonError('The page content is not valid.', 400);

  const normalized = normalizeBuilderData(body.data);
  if (JSON.stringify(normalized.data).length > 1_500_000) return jsonError('The page is too large to save.', 413);
  const existing = await storage().getSite();
  const site = toSitePages(existing || { draft: starterData, published: starterData }, starterData);
  const pageId = typeof body.pageId === 'string' ? body.pageId : site.homepageId;
  const page = site.pages.find((candidate) => candidate.id === pageId);
  if (!page) return jsonError('The selected page does not exist.', 404);
  const now = new Date().toISOString();
  const pages = site.pages.map((candidate) => candidate.id === page.id ? {
    ...candidate,
    draft: normalized.data,
    published: body.publish ? normalized.data : candidate.published,
  } : candidate);
  const home = homeMirror(pages, site.homepageId);
  const record: SiteDocument = {
    published: home.published || starterData,
    draft: home.draft,
    pages,
    homepageId: site.homepageId,
    version: (existing?.version || 0) + (body.publish ? 1 : 0),
    updatedAt: now,
    updatedBy: 'admin',
  };
  await storage().putSite(record);
  return Response.json({ ok: true, published: !!body.publish, page: summaries(pages).find((candidate) => candidate.id === page.id), pages: summaries(pages), version: record.version, updatedAt: now, repairedIds: normalized.repairedIds });
}

export async function POST(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to edit this site.', 401);
  const body = await request.json().catch(() => null) as { action?: unknown; pageId?: unknown; title?: unknown; slug?: unknown } | null;
  const existing = await storage().getSite();
  const site = toSitePages(existing || { draft: starterData, published: starterData }, starterData);
  const action = typeof body?.action === 'string' ? body.action : '';
  const now = new Date().toISOString();

  if (action === 'create') {
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : 'Untitled page';
    const id = crypto.randomUUID();
    const slug = uniquePageSlug(typeof body?.slug === 'string' ? body.slug : title, site.pages);
    const data = normalizeBuilderData({ ...starterData, root: { ...starterData.root, props: { ...starterData.root.props, title } } }).data;
    const pages = [...site.pages, { id, slug, title, draft: data, published: null }];
    const home = homeMirror(pages, site.homepageId);
    await storage().putSite({ published: home.published || starterData, draft: home.draft, pages, homepageId: site.homepageId, version: existing?.version || 0, updatedAt: now, updatedBy: 'admin' });
    return Response.json({ ok: true, page: summaries(pages).find((page) => page.id === id), pages: summaries(pages), homepageId: site.homepageId });
  }

  if (action === 'rename') {
    const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
    const page = site.pages.find((candidate) => candidate.id === pageId);
    if (!page) return jsonError('The selected page does not exist.', 404);
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : page.title;
    const slug = uniquePageSlug(typeof body?.slug === 'string' ? body.slug : title, site.pages, pageId);
    const pages = site.pages.map((candidate) => candidate.id === pageId ? {
      ...candidate,
      title,
      slug,
      draft: normalizeBuilderData({ ...candidate.draft, root: { ...candidate.draft.root, props: { ...candidate.draft.root.props, title } } }).data,
    } : candidate);
    const home = homeMirror(pages, site.homepageId);
    await storage().putSite({ ...(existing || { version: 0, updatedBy: 'admin' }), published: home.published || starterData, draft: home.draft, pages, homepageId: site.homepageId, updatedAt: now, updatedBy: 'admin' });
    return Response.json({ ok: true, page: summaries(pages).find((candidate) => candidate.id === pageId), pages: summaries(pages), homepageId: site.homepageId });
  }

  if (action === 'delete') {
    const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
    if (pageId === site.homepageId || site.pages.length === 1) return jsonError('Keep at least one home page.', 400);
    const pages = site.pages.filter((page) => page.id !== pageId);
    if (pages.length === site.pages.length) return jsonError('The selected page does not exist.', 404);
    const home = homeMirror(pages, site.homepageId);
    await storage().putSite({ ...(existing || { version: 0, updatedBy: 'admin' }), published: home.published || starterData, draft: home.draft, pages, homepageId: site.homepageId, updatedAt: now, updatedBy: 'admin' });
    return Response.json({ ok: true, pages: summaries(pages), homepageId: site.homepageId });
  }

  return jsonError('Unknown page action.', 400);
}
