# Site navigation and publication

## Ownership and data flow

`lib/site-catalog.ts` builds separate editor and public catalogs. The editor
catalog contains draft page titles and section choices, including unpublished
pages marked as such. The public catalog includes only published documents and
their published titles/anchors. The public API never returns draft-only pages.

`LinkValue` accepts existing strings indefinitely, `{ type: 'url', url }`, or
`{ type: 'page', pageId, componentId? }`. Page and component IDs are persistent
identities; the resolver looks up their current URL slug and section name. A
deleted or unpublished reference renders readable text without a clickable
fallback. Existing raw URLs remain raw URLs: they cannot track slug changes.

The Puck registry decorates navigation fields, including repeaters, with
`LinkPicker`. Names, captions, labels, media URLs, and integration sources keep
their original field types. The picker supports keyboard search, page/section
selection, raw URLs, `mailto:`, and `tel:`. Regression tests cover the boundary
between link destinations and fields that merely mention the word “link.”

Public renderers receive only a published catalog through `SiteLinksProvider`.
The command palette and shared header/footer use the same catalog. The editor
provider supplies its authenticated draft catalog; pending section changes are
reflected without remounting Puck.

## Shared header and footer

Open **Site settings** in the editor to configure brand, header/footer
visibility, automatic page links, ordering, label overrides, footer groups, and
additional links. New published pages automatically enter navigation unless
hidden. Hiding a page from navigation does not unpublish it or prevent indexing.

Settings persist as `SiteDocument.siteSettings = { draft, published }`. Saving
draft settings changes the editor preview. **Publish site settings** applies
the shared configuration across the site; publishing one page does not publish
the site-settings draft.

Page root controls provide **inherit**, **override**, and **hidden** modes for
each region. For old documents without those controls, an existing manual
HeaderLinkBar/FooterSitemap means override; otherwise it means inherit. Shared
navigation starts disabled for old sites. This prevents unexpected duplicate
headers or replacement of authored layouts.

**Convert current draft to shared navigation** explicitly removes manual header
and footer blocks from that draft, including nested occurrences, and marks both
regions inherit. It does not modify the published page until the page is
published. To retain page-specific navigation, use override and author its
manual blocks. Conversion is not an automatic migration.

The editor shows inherited navigation through its preview override. Shared
links remain outside Puck's draggable page content. Page-level modes hide the
published inherited regions; existing manual content remains editable so it
can be removed or adjusted deliberately.

## API and persistence

- `/api/site-settings`: authenticated GET and PUT. PUT accepts
  `{ settings, publish?: boolean }`, normalizes supported fields, and preserves
  page documents.
- `/api/site`: page reads and existing save/create/rename/delete actions remain
  compatible. Draft GET no longer performs a write as a side effect.
- Page and settings mutations serialize their read/modify/write operations in
  one Node process. Filesystem writes remain atomic. Multiple independent
  application instances still require a storage driver with conditional writes;
  the process queue is not a distributed lock.
- Existing export/import manifests preserve the optional `siteSettings` field
  without changing the manifest version. Old exports obtain disabled shared
  navigation and the default crawler policy when read.

Reserved application route names are centralized in `site-pages.ts`. Home URLs
derive from `homepageId`, not a literal `home` identifier. Page metadata uses the
published page's own canonical, title, description, social image, and indexing
preference. Changing a slug takes effect immediately; old slugs return 404.

Crawler output follows the same public catalog and publication boundary. The
stable `/content/<page-id>.md` endpoint, authenticated
`/api/crawler-preview?page=<page-id>`, `/robots.txt`, and `/sitemap.xml` routes
are documented in [Crawler content and Markdown](../CRAWLER_CONTENT.md).
Automatic Markdown negotiation requires a validated `RENDER_ORIGIN` or
`SITE_URL` origin; this prevents the public proxy from rewriting requests when
the renderer cannot fetch its own published HTML. Crawler representations and
errors use `no-store`, and negotiated responses vary on `Accept` and
`User-Agent`.

## Verification

`site-navigation.test.ts` covers ID-based resolution, section renames, missing
targets, public catalog isolation, settings defaults, grouping, and conversion.
`site-links-client.test.tsx` covers field boundaries, readable unresolved links,
and server rendering/anchor propagation across the registered component
catalog.

`scripts/verify-site-features.mjs` performs local authenticated API publication,
slug changes, public HTML and Markdown checks, metadata, concurrent saves,
settings preservation, and an export/import round trip into a temporary folder.
It requires a localhost server with `COMPONENT_FIXTURES=1`,
`DATA_DIR=/tmp/open-canvas-production-qa`, and the QA password. The command
and crawler-specific checks are recorded in [Crawler content and Markdown](../CRAWLER_CONTENT.md).
Never point its mutation workflow at an existing site's data directory.
