# Sites to local Docker migration

This runbook moves an authored portfolio from its hosted runtime into the self-hosted Docker distribution without treating a deployment archive as a data backup.

## Data boundary

`GET /api/export` is an authenticated, no-store manifest. It contains the complete published and draft document, page records, media metadata, and analytics events. Media bytes remain out of band and are downloaded from the immutable public `/api/media/:id` route. Keeping the manifest small avoids Worker response and memory pressure from constructing a large archive.

The endpoint uses the deployment's normal editor authorization. In the self-hosted build that is the signed admin session; in the Sites downstream it is the platform-provided editor identity and `EDITOR_EMAILS` allowlist. Never weaken this route to public access because drafts can contain unpublished work.

## Export

1. Stop editing briefly, or record a cutoff time and repeat the export after the last edit.
2. Sign in to the editor.
3. Open `/api/export` on the same origin and save the JSON response.
4. Record the export timestamp, site version, media count, and total `size` values.

The manifest enumerates `media_assets`, not just URLs found in the current page. This preserves uploaded but currently unused images and videos.

## Import

Run the importer from this repository:

```bash
npm run import:site -- \
  --manifest ./site-export.json \
  --origin https://portfolio.example \
  --data-dir ./alisa-data
```

The importer writes the filesystem driver's native layout, downloads four media objects at a time, checks every byte size, retries transient failures, and leaves already-complete files in place on reruns. It rejects paths outside the chosen data directory and media URLs outside the supplied origin.

## Docker

Use a bind mount for the first boot so the migrated files remain easy to inspect and back up:

```yaml
services:
  builder:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      STORAGE_DRIVER: filesystem
      DATA_DIR: /app/data
    volumes:
      - ./alisa-data:/app/data
```

Set a new local `AUTH_SECRET`, `ADMIN_PASSWORD`, and `SITE_URL`. Hosted identity settings and secrets are deliberately not exported.

## Verification

- Compare manifest media count and byte total with the importer summary.
- Request `/api/site` and confirm the reported version and published page.
- Sign in locally and compare the draft in `/edit` before publishing anything.
- Issue `HEAD` requests for representative JPEG, PNG, and video IDs. Confirm type, length, and video range support.
- Back up the entire mounted directory. `documents/`, `media-meta/`, media object keys, and `analytics/events/` form one logical restore set.

If hosted editing continued during the transfer, repeat the manifest export and importer. Existing complete media files are retained, while the document and metadata files are refreshed atomically.
