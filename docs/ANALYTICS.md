# First-party analytics

Open Canvas includes a small, self-hosted analytics suite at `/analytics`. It is intentionally built on the same Next.js App Router and storage abstraction as the site rather than adding a hosted analytics or charting dependency.

## Access

`/analytics` uses the existing administrator session. Visitors who are not signed in are redirected to `/login?returnTo=/analytics`; the dashboard API at `/api/analytics` returns `401` without the same HMAC-signed session cookie. The dashboard links back to the public site and editor and includes the existing sign-out action.

## Collection contract

The public renderer mounts `app/PageViewTracker.tsx`. It sends one `page_view` event after the browser has mounted and again when the pathname changes. The tracker is not mounted by the analytics dashboard itself, does not collect editor or API activity, ignores signed-in administrator traffic, and honors Do Not Track and Global Privacy Control where the browser exposes them.

```json
{
  "type": "page_view",
  "path": "/work",
  "visitorId": "opaque-browser-id",
  "referrer": "https://example.com/"
}
```

The server route (`POST /api/analytics`) adds the event ID, timestamp, and device class. It stores only the referrer hostname (or `(direct)` / `(internal)`), never the full referrer URL or raw user agent. `path` is reduced to a pathname and capped at 500 characters. Visitor IDs are random, opaque browser-tab-session values used only to estimate visits; no account, IP address, fingerprint, query string, or form data is recorded. A visitor count is therefore not a count of people or long-lived devices.

This is aggregate site telemetry, not a consent-management system. If the site needs jurisdiction-specific consent or opt-out behavior, add that policy at the tracker boundary before enabling collection for those visitors.

## Storage and retention

Events are append-only JSON records under `analytics/events/YYYY-MM-DD/<event-id>.json` through the configured storage driver:

- Filesystem storage: `${DATA_DIR}/analytics/events/` (default `./data/analytics/events/`).
- S3-compatible storage: `${S3_PREFIX}/analytics/events/`.

The report reads at most 100,000 events. It considers only the most recent 400 days, but retention deletion is intentionally left to the host (for example an S3 lifecycle rule) so collection writes stay atomic. The dashboard does not expose raw events; it reads the server-side aggregate returned by `GET /api/analytics?days=7|30|90`. Existing site backups include analytics because it uses the same persistent data root or S3 prefix.

The current append-only store is suitable for modest portfolio traffic. S3 deployments should add a 400-day lifecycle expiration rule for the analytics prefix; the dashboard must list and read each event object, so high-volume deployments should replace `getAnalyticsEvents` / `appendAnalyticsEvent` with an aggregate database or queue-backed implementation while keeping the route and report contract stable.

## Dashboard report

The dashboard reports:

- Total page views and estimated unique visitors.
- Number of pages reached and the top page.
- Top referrer hosts, with direct and internal navigation separated.
- Desktop, mobile, and tablet view counts.
- A daily SVG line chart and ranked page/source/device bars.

The three reporting windows are UTC calendar days ending today. Empty periods are included in the chart so a new site has a truthful zero baseline instead of a misleading compressed line.

## Extension points

To add another event type, extend `AnalyticsEventType` and the event normalization in `lib/analytics.ts`, then add an explicit dashboard aggregation. Keep collection payloads allow-listed and bounded. Do not persist raw request headers, full URLs with query strings, or values that can identify a visitor. New public page slugs should continue through `uniquePageSlug`; `analytics` is reserved for this dashboard route.
