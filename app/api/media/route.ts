import { sessionFromRequest } from '@/lib/auth';
import { getMediaUploadPolicy } from '@/lib/media';
import { jsonError, storage, type MediaAsset } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sessionFromRequest(request)) return jsonError('Sign in to upload media.', 401);
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return jsonError('Choose an image or video to upload.', 400);
  const policy = getMediaUploadPolicy(file.type);
  if (!policy) return jsonError('Use a JPG, PNG, GIF, WebP, MP4, or WebM file.', 415);
  if (file.size === 0) return jsonError('The selected file is empty.', 400);
  if (file.size > policy.maxSize) {
    const limitInMb = Math.floor(policy.maxSize / (1024 * 1024));
    return jsonError(`${policy.kind === 'image' ? 'Images' : 'Videos'} must be ${limitInMb} MB or smaller.`, 413);
  }

  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120) || policy.kind;
  const asset: MediaAsset = { id, objectKey: `media/${policy.kind}/${id}-${safeName}`, filename: file.name, contentType: file.type, size: file.size, createdAt: new Date().toISOString(), createdBy: 'admin' };
  await storage().putMedia(asset, file.stream());
  return Response.json({ id, url: `/api/media/${id}`, filename: file.name, contentType: file.type, kind: policy.kind, size: file.size }, { status: 201 });
}
