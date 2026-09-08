# Crawler content and Markdown

The public HTML page is the source of crawler content. When Markdown is
requested, the server renders the published page HTML through the configured
renderer and derives a bounded semantic document from that DOM. This keeps
the alternate representation aligned with what a published visitor can read;
draft data and editor-only markup never enter the public crawler path.

## Public endpoints

- `/content/<page-id>.md` resolves the immutable published page ID and returns
  Markdown when the published `crawler.markdown` setting is enabled. It is an
  explicit endpoint, so it returns a clear `404` when Markdown is disabled or
  the page is not published. A render failure returns `502`.
- `/` and `/<slug>` remain HTML for normal browsers. `proxy.ts` rewrites a
  request to the corresponding `/content/*.md` route only for an explicit
  `Accept: text/markdown` request. AI crawler user agents without that header
  remain on the original HTML response so crawlers that expect HTML are not
  given a different representation. If the rewrite cannot be used, the
  original HTML request continues with `Vary: Accept, User-Agent`.
- `/api/crawler-preview?page=<page-id>` is an authenticated editor preview of
  the published representation. It does not preview draft content.

The public rewrite requires a valid renderer origin. `RENDER_ORIGIN` takes
precedence over `SITE_URL`; either value must be an absolute `http` or `https`
origin with no credentials, path, query, or fragment. With neither valid value
configured, the proxy passes through HTML rather than rewriting to a route
that cannot fetch its source page. Internal renderer requests carry
`x-crawler-bypass: 1` so extraction cannot recurse.

Crawler Markdown, HTML fallbacks, error responses, authenticated preview
responses, `/robots.txt`, and `/sitemap.xml` use `Cache-Control: no-store`.
Negotiated content also carries `Vary: Accept, User-Agent`; crawler content is
marked `X-Robots-Tag: noindex` because the Markdown route is an alternate
representation of the canonical HTML page.

## Extracted content

The extractor uses `parse5` and removes `script`, `style`, `noscript`,
`template`, `svg`, `input`, `select`, and `textarea` nodes. It also omits
closed dialogs, hidden nodes, `aria-hidden="true"` content,
`data-crawler-ignore` subtrees, fixture controls, and inline styles that hide a
node. Headings, paragraphs, blockquotes, lists, tables, code blocks, authored
links, and images with meaningful `alt` text are represented in Markdown.

Visible inline runs are retained for captions, metrics, status labels,
disclosure summaries, and authored button labels. Icon-only buttons are
treated as interaction chrome and omitted. Authors can mark a published
subtree with `data-crawler-ignore` when a visitor-facing interaction should
not be included in the semantic representation.

URLs are resolved against the rendered page origin. `javascript:`, `data:`,
and `vbscript:` values are rejected, and the extractor records links and image
URLs without fetching them. Markdown escapes punctuation in text and includes
canonical, description, links, and image sections when those values exist.

Extraction is bounded to 1.5 MB of HTML, eight seconds, and 200 items per
semantic collection. The renderer follows no redirects, requires an HTML
content type, sends no credentials, and uses `cache: no-store` for its
internal fetch. If a negotiated extraction fails, the public route falls back
to the original HTML response. A direct `/content` request reports the failure
instead of silently returning an incomplete document.

## Robots and sitemap policy

`/robots.txt` reads the published crawler settings and appends the configured
origin's `/sitemap.xml` URL. The directives are emitted as three separate
groups so search crawling and AI policy controls do not bleed into one
another:

- `search` controls `User-agent: *`.
- `aiTraining` controls `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, and
  `Bytespider`.
- `aiSearch` controls `OAI-SearchBot`, `Claude-SearchBot`, and
  `PerplexityBot`.

When a group is allowed, private application paths (`/edit`, `/login`,
`/api/`, `/analytics`, `/migration-export`, and `/fixtures`) remain disallowed
within that group. When a group is disallowed, the group receives
`Disallow: /`. The stored `aiMarkdown` setting does not override content
negotiation: an AI crawler must explicitly request `Accept: text/markdown`,
which still follows the `markdown` setting. Robots policy remains independent
of representation.

`/sitemap.xml` contains only pages with a published document whose root does
not set `noIndex`. Page IDs are used internally for stable resolution; the
homepage is emitted as `/`, while other entries use their current published
slug. Draft and unpublished pages never appear in public crawler output.

## Verification

Focused behavior checks cover semantic extraction, hidden and decorative
content, authored button labels versus icon-only controls, unsafe URL
handling, renderer-origin validation, Markdown negotiation and quality
boundaries, robots group separation, sitemap filtering, and `no-store`
headers:

```bash
npm run test:crawlers
npm run test:brief-handoff
```

The local API verifier exercises authenticated publication, page renames,
published-only content, Markdown settings, robots, sitemap, metadata,
concurrent writes, and export/import. Run it only against the isolated QA
server described in the production handoff:

```bash
COMPONENT_FIXTURES=1 DATA_DIR=/tmp/open-canvas-production-qa \
  ADMIN_PASSWORD=production-qa-password npm run dev -- --port 3010
QA_ORIGIN=http://localhost:3010 \
  DATA_DIR=/tmp/open-canvas-production-qa \
  QA_PASSWORD=production-qa-password npm run test:site-features
```

Do not point the verifier at a real site's data directory. The browser-facing
component checks use `/fixtures` and the published route; editor overlays are
not part of the crawler contract.
