# Automatic SEO and social metadata

## Editing and publication

The app serves `/robots.txt` and `/sitemap.xml` dynamically. Public pages receive a title, description, canonical link, robots metadata, Open Graph metadata, and an X/Twitter large-image card. These use published page content and published site settings. Autosaving a draft does not change public metadata.

Open **Site settings → SEO and social defaults** to set the preferred public URL, site name, fallback description, fallback social image (upload or URL), and image description. Save a draft or publish these settings independently of page content. The panel links to the current robots and sitemap responses. Defaults apply even when shared navigation is disabled.

The page settings panel exposes:

| Control | Automatic behavior when unset |
| --- | --- |
| SEO title | Browser title, then site name, then app fallback |
| Search description | Existing social description, then site description, then app fallback |
| Canonical URL | Current public page URL without visitor query parameters |
| Sitemap visibility | Include published, indexable pages whose canonical points to themselves |
| Search indexing | Allow, unless search is disabled for the entire site |
| Search engine link following | Follow links |
| Social title / description | Resolved search title / description |
| Social preview image | Site image, then bundled `/og.png` |
| Social image description | Page alt text, then shared image alt text when using the shared image, then social title |

SEO title changes the HTML document title (including the browser tab). It does not rename the page or its navigation label. Social fields remain independent overrides. Existing stored sharing values retain precedence; clear them to use defaults. Newly created pages and new root configurations start with empty social overrides so they inherit automatically. Templates may contain intentional sharing values.

A root-relative canonical such as `/original` or an absolute HTTP(S) canonical is supported. Fragments are stripped. Invalid values (credentials, unsupported schemes, protocol-relative URLs, backslashes, whitespace/control characters) fall back to the page URL. Query strings on an explicitly authored canonical are retained. A different canonical omits this duplicate page from the sitemap; it does not redirect visitors or set noindex. Sitemap-only exclusion likewise leaves the page indexable.

## Origin precedence and reverse proxies

Every public SEO surface uses the same origin resolver:

1. Valid hosting `SITE_URL` environment variable.
2. Valid published Public site URL setting.
3. Request origin, using `X-Forwarded-Host` and `X-Forwarded-Proto` when present.

Configured URL paths are discarded because this app serves pages at the domain root. On a multi-domain deployment, pin the preferred domain using `SITE_URL` or the published setting. A reverse proxy must overwrite forwarded headers; do not preserve arbitrary client-supplied forwarded headers. This follows the existing analytics proxy trust convention. Invalid configured URLs fall back to the next source.

The metadata origin resolver does not change the separate internal Markdown renderer origin or authorize any server-side fetch to a configured SEO URL. External canonical and image URLs are emitted as metadata only.

## Robots and sitemap behavior

Site settings retain independent policies for general search, AI search, and AI training crawlers. Disallowing general search also sets page `noindex` and produces an empty sitemap. Per-page noindex pages are omitted from the sitemap but remain crawlable so engines can read their noindex tags. Robots preferences are not access control, and engines need to revisit a page before detecting changed metadata.

Private app routes are excluded from robots crawling. Login, editor, analytics, and migration-export pages explicitly emit noindex/nofollow and have no public canonical or social metadata. Fixtures already carry noindex. Public media under `/api/media/` receives a more specific Allow rule so uploaded sharing images and favicons remain crawlable while other API routes stay excluded.

Sitemap URLs are XML-escaped and generated solely from published pages. Draft-only, noindex, explicitly excluded, and non-self-canonical pages are omitted. No fabricated `lastmod`, priority, or frequency is emitted: storage currently has only a document-wide edit timestamp, which does not establish when each page's published content last changed. Slug changes and page deletion are reflected on the next request. Robots and sitemap responses use `Cache-Control: no-store`.

## Implementation map

- `lib/seo.ts`: pure origin, canonical, metadata, and sitemap eligibility rules.
- `lib/seo-server.ts`: obtains Next request headers for page metadata.
- `lib/page-metadata.ts`: loads published pages and adds the Markdown alternate when enabled.
- `lib/site-settings.ts`: backward-compatible normalized, independently published SEO defaults.
- `lib/site-metadata.ts`: shared safe asset URL validation and existing favicon settings.
- `app/layout.tsx`: site-wide metadata base, app name, and published homepage favicon. Page canonical/social tags deliberately live at page level to avoid inheritance onto private and missing routes.
- `app/robots.txt/route.ts` and `app/sitemap.xml/route.ts`: dynamic public discovery routes.
- `lib/site-builder/root.tsx` and `app/edit/SiteSettingsPanel.tsx`: persisted editor controls.

Next metadata merges nested objects by replacement. Keep complete Open Graph and Twitter objects in the page resolver rather than relying on a layout-level partial object. Default image dimensions are supplied only for the known bundled image; uploaded images are not assigned invented dimensions.

## Verification

Run `rtk npm run test:metadata`, `rtk npm run test:site-navigation`, `rtk npm run test:puck-data`, and `rtk npx tsc --noEmit`. The directly scoped robots tests are `rtk proxy node --experimental-strip-types --test lib/crawlers.test.ts`. `test:crawlers` additionally runs the existing Markdown proxy suite.

For actual editor and published-response checks, start a disposable local server with an isolated `DATA_DIR`, an empty `SITE_URL`, a separate `NEXT_BUILD_DIR`, known admin credentials, and `COOKIE_SECURE=false`. Run:

```sh
rtk proxy env QA_ORIGIN=http://localhost:3026 QA_ALLOW_WRITE=1 QA_PASSWORD=seo-qa-password node scripts/verify-seo.mjs
```

The script publishes fixture data and site settings, creates pages, and leaves those fixtures in the disposable data directory. Never point it at valuable local content. It only accepts a loopback host and explicit write opt-in. It checks editor autosave/reload/publication, draft isolation, rendered metadata, preferred and forwarded origins, sitemap exclusions, private routes, and global search disabling. It writes `/tmp/open-canvas-seo-settings.png` for visual inspection.

### Verified September 8, 2026

- Production `next build` passed (isolated `.next/seo-build` output).
- TypeScript passed.
- Metadata tests: 11 passed; robots/crawler unit tests: 8 passed; navigation: 6 passed; Puck persistence: 5 passed.
- Local browser/API verification: 18 checks passed against port 3026 with disposable `/tmp/open-canvas-seo-qa` data. Editor page controls and site settings were visually inspected.
- The proxy test suite verifies that AI crawler requests without an explicit Markdown `Accept` header remain on the original HTML page. This preserves compatibility with crawlers such as GPTBot that expect HTML.
- No commit, push, production data mutation, or deployment was performed.
