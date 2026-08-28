# Operations Guide

## Production checklist

1. Generate a random `AUTH_SECRET` with at least 32 characters.
2. Set a strong `ADMIN_PASSWORD` in the platform secret manager.
3. Set `SITE_URL` to the final HTTPS origin.
4. Choose persistent filesystem storage or configure S3-compatible storage.
5. Put TLS in front of the Node process and forward the original host and protocol correctly.
6. Build with `npm run build` and start with `npm start`, or use the Docker image.
7. Sign in, upload a small image, save a draft, publish, and verify the public page in a private browser window.

If a reverse proxy is used, disable response buffering for media routes when streaming behavior matters.

## Backups

Filesystem mode: back up the entire `DATA_DIR`. It contains `documents/home.json`, immutable media objects, and `media-meta` records. Capture the directory consistently; page JSON is written atomically.

S3 mode: enable bucket versioning when available and apply the organization's backup or replication policy to the configured prefix. Back up `documents/`, `media-meta/`, and `media/`; metadata is necessary to resolve public media IDs.

## Restore

Filesystem mode: stop the service, restore the complete data directory with its original relative paths and file ownership, then restart.

S3 mode: restore all objects under the configured prefix, retain the same bucket and prefix settings, and restart. If restoring to a new bucket, update only environment variables; page JSON stores stable `/api/media/:id` URLs rather than provider URLs.

## Upgrades

1. Back up storage.
2. Read release notes and compare `.env.example` for new variables.
3. Run `npm ci`, `npm test`, and `npm run build` in a staging checkout.
4. Test `/login`, `/edit`, draft autosave, publish, an image upload, and video seeking.
5. Deploy the new image or Node build without changing the storage prefix.

The current document schema is JSON and additive. A future migration should normalize data at the storage boundary and document the operation here.

## Scaling

Use S3 storage before running more than one application instance. Filesystem storage is appropriate only when every request reaches a process sharing the same persistent volume. The page document uses last-write-wins semantics; the editor is designed for one active administrator, not concurrent collaborative editing.

Place a CDN in front of `/api/media/:id` if media traffic becomes significant. Responses are immutable and cacheable for one year. Keep `/api/site`, `/edit`, and authentication routes uncached.

Uploaded video is original-file hosting. Export H.264/AAC MP4 for broad playback. Use a dedicated video platform when adaptive bitrate streaming, transcoding, captions workflows, or very large files are required.

## Incident actions

- Suspected password disclosure: rotate `ADMIN_PASSWORD`.
- Suspected session-signing disclosure: rotate `AUTH_SECRET`; all sessions become invalid immediately.
- Compromised S3 credentials: revoke them at the provider, create a least-privilege replacement, and update secrets.
- Untrusted custom snippet: remove it from the draft and publish the clean document. The sandbox prevents parent-page and cookie access, but the snippet can send its own network requests.
- Broken content: restore `documents/home.json` or an S3 object version, then restart or reload.

## Health signals

The application has no dedicated health endpoint. A basic liveness check may request `/login`; a content check may request `/` and expect 200. Do not use authenticated routes for unauthenticated infrastructure probes.
