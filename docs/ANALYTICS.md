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

The dashboard fetches fresh data on mount, when the reporting window changes, every 30 seconds while visible, and when the tab regains focus or visibility. **Refresh** (or clicking the selected reporting window again) requests an immediate update. Requests are aborted when superseded or the dashboard unmounts, and stale responses cannot overwrite the selected window. If a refresh fails, the last successful report remains visible with an error message; automatic and manual refresh can retry.

## Local filesystem collection troubleshooting

Events are persisted on the server. Browser `localStorage` does not hold the report; `sessionStorage` holds only an anonymous tab identifier. Changing browser cookies does not change the server's storage driver or data directory.

### Reverse proxy origin handling

When HTTPS terminates at a reverse proxy, the browser sends an origin such as `https://portfolio.example.com`, while the application may see an HTTP request URL such as `http://localhost:3000`. Comparing those two values directly used to reject legitimate collection requests with `403` before `appendAnalyticsEvent` ran. Separate visitor cookies could not fix that failure.

`lib/analytics-origin.ts` now resolves the public origin using the first `X-Forwarded-Host` value (falling back to `Host`) and the first `X-Forwarded-Proto` value (falling back to the request URL scheme). Malformed authorities and unsupported protocols fall back to the request URL origin. The collection route uses that origin both for its same-origin check and for classifying internal referrers. It does not trust the submitted `Origin` header to determine the expected origin.

Configure the trusted ingress proxy to overwrite forwarded headers with the actual public host and scheme. Do not preserve arbitrary client-supplied forwarded values. Direct local HTTP requests continue to work without these headers. The filesystem and S3 event formats are unchanged; no data migration is needed.

### Diagnose missing visits

1. In a signed-out browser, open a published page and inspect `POST /api/analytics` in its network panel. The editor and dashboard do not track visits. DNT/GPC deliberately suppress collection, and a valid admin cookie causes the server to skip the write even though it returns `204`.
2. A `403` indicates an origin mismatch. Check the public host/scheme forwarded by the proxy. A `503` indicates a failed storage write; verify the runtime user's permissions and the configured `DATA_DIR` or S3 connection.
3. For an accepted signed-out request, check `${DATA_DIR}/analytics/events/YYYY-MM-DD/` for a new JSON record. The date is UTC. The default directory is `data` under the server process's working directory; use an absolute persistent `DATA_DIR` to avoid deployment-directory ambiguity.
4. Open `/analytics` as an admin and click **Refresh**, or leave the tab visible for up to 30 seconds. `GET /api/analytics?days=30` should return the updated count. All instances must share the same storage if a load balancer routes collection and reports to different servers.
5. When testing with `next dev`, use its supported hostname: an unapproved alternate hostname can block JavaScript assets before the tracker mounts. Development Strict Mode can replay the tracker effect; use production mode for exact traffic counts.

### Regression verification (2026-09-05)

- Reproduced an HTTPS-forwarded event returning `403` with the original origin comparison. With the fix, the same request returned `204`, created a JSON event in an isolated temporary `DATA_DIR`, and appeared in the authenticated report with an internal referrer correctly classified.
- Verified direct local writes and report reads; an unrelated cross-origin submission still returned `403`.
- Verified a signed-out browser visit persisted and appeared in the dashboard.
- Left the dashboard open, submitted one more event, and observed page views increase from 4 to 5 without a reload or click. Verified the 7-day selector and manual Refresh retained the correct reporting window.
- `npm run test:analytics` covers direct origins, proxy host/protocol handling, ports, comma-separated proxy values, malformed headers, and the existing reporting-window/device helpers.
- On the final recheck, all six analytics tests passed. The full TypeScript check reports errors in unrelated `app/edit/EditorClient.tsx` (`sharedHeader`) and `lib/site-catalog.ts` (`navigationTitle` / `noIndex`) work; those files are outside this fix.

## Extension points

To add another event type, extend `AnalyticsEventType` and the event normalization in `lib/analytics.ts`, then add an explicit dashboard aggregation. Keep collection payloads allow-listed and bounded. Do not persist raw request headers, full URLs with query strings, or values that can identify a visitor. New public page slugs should continue through `uniquePageSlug`; `analytics` is reserved for this dashboard route.
