# Architecture

## Runtime shape

Open Canvas is a single Next.js App Router service. The public renderer and visual editor share one Puck component registry, so a saved component has the same implementation in preview and production.

```text
visitor -> / -> published Data -> Puck Render
editor  -> /edit -> draft Data -> Puck editor
                         |
                         +-- PUT /api/site (autosave or publish)
                         +-- POST /api/media (image/video upload)

routes -> StorageDriver -> filesystem or S3-compatible objects
```

The public renderer never reads the draft. Root Puck fields own both visual design tokens and publication metadata.

## Persistence contract

`lib/storage.ts` defines the complete persistence surface:

- `getSite` / `putSite` store one `SiteDocument` containing separate draft and published Puck data.
- `putMedia` stores original media plus a small metadata document.
- `getMedia` resolves an immutable public media identifier.
- `readMedia` streams a complete object or an inclusive byte slice.

The filesystem driver writes JSON atomically by renaming a temporary file. The S3 driver stores page JSON, media metadata, and media bytes beneath `S3_PREFIX`. No database is required. Add SQL, Git, or CMS storage by implementing this boundary rather than changing routes or components.

Media IDs are random UUIDs. Public URLs never expose provider credentials or raw filesystem paths. Upload types and limits are enforced before a driver receives data.

## Content identity

Puck component identity is document-global, including recursive slots. `normalizeBuilderData` walks root content, legacy zones, and every array-valued slot. It preserves the first valid ID and deterministically replaces missing or duplicate IDs. Normalization occurs when documents enter the editor, when templates are applied, and before every save.

Literal IDs must not appear in slot children inside component `defaultProps`. Puck assigns fresh IDs at insertion time. Templates, in contrast, are complete documents and must contain their own unique IDs.

## Responsive layout

CSS is mobile-first. Multi-column containers stack initially, then activate columns at wider sizes. Nested containers use container queries so their layout responds to the parent cell's actual width instead of the browser width. Four-column sections move through one, two, and four columns rather than compressing directly into four narrow tracks.

The editor exposes constrained semantic choices—font roles, spacing labels, ratios, themes, and alignments—instead of raw CSS. This preserves responsive behavior while giving creators meaningful art direction.

## Trust boundaries

- Public GET routes require no session.
- `/edit`, draft reads, saves, publishing, and uploads require a valid HMAC-signed HttpOnly session.
- Login compares the configured administrator password in constant time.
- Session cookies are SameSite=Lax and Secure in production.
- Media types are allowlisted and served with `X-Content-Type-Options: nosniff`.
- Custom code is isolated in a sandboxed opaque-origin iframe and cannot read the editor or parent authentication context.
- Metadata asset URLs accept local paths or HTTPS URLs only.

The password model is deliberately single-admin. To add identity providers or teams, replace `lib/auth.ts` and preserve the server-side authorization checks in routes and `/edit`.

## Adding a block

1. Add the component config and renderer to `builderConfig.components`.
2. Put it in the appropriate Puck category.
3. Add the component name to `nestedAllowlist`.
4. Use mobile-first styles in `app/globals.css`.
5. Add a template example only if the block's default state does not explain itself.
6. Verify 390, 768, and 1280 pixel editor viewports.
7. Add focused tests for parsing, validation, security, or persistence logic.

Keep defaults intentional. A newly dragged block should already look publishable and teach the editor what it is for.
