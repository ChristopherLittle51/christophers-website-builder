import assert from 'node:assert/strict';
import test from 'node:test';
import { getMediaUploadPolicy, IMAGE_UPLOAD_LIMIT, parseByteRange, VIDEO_UPLOAD_LIMIT } from './media.ts';

test('separates image and video upload policies', () => {
  assert.deepEqual(getMediaUploadPolicy('image/webp'), {
    kind: 'image', maxSize: IMAGE_UPLOAD_LIMIT, allowedLabel: 'JPG, PNG, GIF, or WebP',
  });
  assert.deepEqual(getMediaUploadPolicy('video/mp4'), {
    kind: 'video', maxSize: VIDEO_UPLOAD_LIMIT, allowedLabel: 'MP4 or WebM',
  });
  assert.equal(getMediaUploadPolicy('video/quicktime'), null);
});

test('parses bounded, open-ended, and suffix byte ranges', () => {
  assert.deepEqual(parseByteRange('bytes=10-19', 100), { kind: 'range', start: 10, end: 19, length: 10 });
  assert.deepEqual(parseByteRange('bytes=90-', 100), { kind: 'range', start: 90, end: 99, length: 10 });
  assert.deepEqual(parseByteRange('bytes=-12', 100), { kind: 'range', start: 88, end: 99, length: 12 });
  assert.deepEqual(parseByteRange('bytes=90-200', 100), { kind: 'range', start: 90, end: 99, length: 10 });
  assert.deepEqual(parseByteRange(null, 100), { kind: 'none' });
});

test('rejects malformed, multiple, reversed, and unsatisfiable ranges', () => {
  for (const header of ['bytes=', 'items=0-1', 'bytes=0-1,4-5', 'bytes=20-10', 'bytes=100-', 'bytes=-0']) {
    assert.deepEqual(parseByteRange(header, 100), { kind: 'invalid' });
  }
  assert.deepEqual(parseByteRange('bytes=0-1', 0), { kind: 'invalid' });
});
