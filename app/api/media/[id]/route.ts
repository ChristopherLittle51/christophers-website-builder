import { parseByteRange } from '@/lib/media';
import { jsonError, storage, type MediaAsset } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function mediaHeaders(asset: MediaAsset, size: number, etag: string) {
  return new Headers({ 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable', 'content-length': String(size), 'content-type': asset.contentType, etag, 'x-content-type-options': 'nosniff' });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const asset = await storage().getMedia(id);
  if (!asset) return jsonError('Media not found.', 404);
  const range = parseByteRange(request.headers.get('range'), asset.size);
  if (range.kind === 'invalid') return new Response(null, { status: 416, headers: { 'accept-ranges': 'bytes', 'content-range': `bytes */${asset.size}` } });
  const slice = range.kind === 'range' ? { start: range.start, end: range.end } : undefined;
  const object = await storage().readMedia(asset, slice);
  if (!object) return jsonError('Media not found.', 404);
  const headers = mediaHeaders(asset, object.contentLength, object.etag);
  if (range.kind === 'range') headers.set('content-range', `bytes ${range.start}-${range.end}/${asset.size}`);
  return new Response(object.body, { status: range.kind === 'range' ? 206 : 200, headers });
}

export async function HEAD(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const asset = await storage().getMedia(id);
  if (!asset) return jsonError('Media not found.', 404);
  const object = await storage().readMedia(asset, { start: 0, end: 0 });
  if (!object) return jsonError('Media not found.', 404);
  return new Response(null, { headers: mediaHeaders(asset, asset.size, object.etag) });
}
