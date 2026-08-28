export const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024;
export const VIDEO_UPLOAD_LIMIT = 95 * 1024 * 1024;

export type MediaKind = 'image' | 'video';

export type MediaUploadPolicy = {
  kind: MediaKind;
  maxSize: number;
  allowedLabel: string;
};

const uploadPolicies: Record<string, MediaUploadPolicy> = {
  'image/jpeg': { kind: 'image', maxSize: IMAGE_UPLOAD_LIMIT, allowedLabel: 'JPG, PNG, GIF, or WebP' },
  'image/png': { kind: 'image', maxSize: IMAGE_UPLOAD_LIMIT, allowedLabel: 'JPG, PNG, GIF, or WebP' },
  'image/webp': { kind: 'image', maxSize: IMAGE_UPLOAD_LIMIT, allowedLabel: 'JPG, PNG, GIF, or WebP' },
  'image/gif': { kind: 'image', maxSize: IMAGE_UPLOAD_LIMIT, allowedLabel: 'JPG, PNG, GIF, or WebP' },
  'video/mp4': { kind: 'video', maxSize: VIDEO_UPLOAD_LIMIT, allowedLabel: 'MP4 or WebM' },
  'video/webm': { kind: 'video', maxSize: VIDEO_UPLOAD_LIMIT, allowedLabel: 'MP4 or WebM' },
};

export function getMediaUploadPolicy(contentType: string) {
  return uploadPolicies[contentType] || null;
}

export type ParsedRange =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'range'; start: number; end: number; length: number };

export function parseByteRange(header: string | null, size: number): ParsedRange {
  if (!header) return { kind: 'none' };
  if (!Number.isSafeInteger(size) || size <= 0) return { kind: 'invalid' };

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return { kind: 'invalid' };

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { kind: 'invalid' };
    const start = Math.max(0, size - suffixLength);
    return { kind: 'range', start, end: size - 1, length: size - start };
  }

  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return { kind: 'invalid' };

  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return { kind: 'invalid' };

  const end = Math.min(requestedEnd, size - 1);
  return { kind: 'range', start, end, length: end - start + 1 };
}
