# christopher's website builder

christopher's website builder is an open-source, self-hostable visual website builder for creative professionals. It keeps the focused, art-directed feel of a custom portfolio while giving a nontechnical editor control over layout, typography, color, images, video, links, scheduling, and selected custom code.

It is a normal Next.js application—not a hosted-platform project. Run it on a laptop, in Docker, on a VM, or on any Node-compatible cloud. Content and uploads can live on the local filesystem or in any S3-compatible object store.

## What is included

- Mobile-first drag-and-drop editing powered by [Puck](https://puckeditor.com/).
- Six starter templates, including a composable hero starter and a complete Director’s treatment for photography and moving image.
- Seventy-two blocks organized into foundations, composition, hero options, portfolio storytelling, content patterns, media, integrations, developer, and [ten production-inspired photo and cinema blocks](docs/PHOTOGRAPHY_AND_CINEMA_BLOCKS.md).
- Recursive nested containers with one to four columns and container-query reflow.
- Expandable image grids with editorial, uniform, and filmstrip layouts.
- Per-field and global font control using nine bundled open-source font families.
- Custom colors, content widths, corner styles, favicon, Open Graph image, and social copy.
- Image uploads plus seekable MP4/WebM video hosting with HTTP range responses.
- YouTube/Vimeo, Calendly, GitHub repository metadata, and sandboxed HTML/CSS/JavaScript blocks.
- Draft autosave with explicit publishing, so experiments do not immediately change the public site.
- Editable section link names, so links such as `#photography` scroll visitors to a chosen block.
- Optional, scroll-aware Return to top control with editable label, style, and side.
- Password-protected editor sessions signed with HMAC.
- Filesystem and S3-compatible storage drivers.
- Production Docker image and Compose setup.

## Quick start

Requirements: Node.js 22.13 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Set `AUTH_SECRET` and `ADMIN_PASSWORD` in `.env`, then open:

- Public site: `http://localhost:3000`
- Editor: `http://localhost:3000/edit`

The default `STORAGE_DRIVER=filesystem` writes content and uploads to `./data`. The folder is intentionally gitignored. Draft changes autosave; use **Publish website** to update the public page and its metadata.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build -d
```

Compose mounts a named volume at `/app/data`. Back up that volume to retain the page document and uploaded media. The image uses Next.js standalone output and runs as an unprivileged user.

To run the image without Compose:

```bash
docker build -t open-canvas-builder .
docker run --rm -p 3000:3000 \
  --env-file .env \
  -v open-canvas-data:/app/data \
  open-canvas-builder
```

## Cloud and S3-compatible storage

Set `STORAGE_DRIVER=s3` when the application filesystem is ephemeral or when multiple instances need shared storage. The same adapter works with AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, and compatible services.

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=my-portfolio-builder
S3_REGION=auto
S3_ENDPOINT=https://your-s3-compatible-endpoint.example
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
S3_PREFIX=open-canvas
```

For AWS S3, omit `S3_ENDPOINT`, use the bucket's AWS region, and credentials may come from the normal AWS runtime credential chain instead of explicit variables. For local MinIO, set its endpoint and usually set `S3_FORCE_PATH_STYLE=true`.

Deploy the Node server anywhere that supports a persistent process and environment variables. Run `npm run build` followed by `npm start`, or deploy the included Docker image. Set `SITE_URL` to the final public HTTPS origin so canonical, favicon, and social-image URLs resolve correctly.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Production | At least 32 characters; signs editor sessions. |
| `ADMIN_PASSWORD` | Production | Password used at `/login`. Store it only in the host's secret manager. |
| `SITE_URL` | Recommended | Public origin used by metadata, for example `https://portfolio.example.com`. |
| `COOKIE_SECURE` | No | `auto` (default) supports LAN HTTP and marks sessions Secure for HTTPS requests, including TLS proxies that send `X-Forwarded-Proto`. Use `false` only to force non-Secure cookies everywhere. |
| `STORAGE_DRIVER` | No | `filesystem` (default) or `s3`. |
| `DATA_DIR` | Filesystem only | Persistent directory; defaults to `./data`. |
| `S3_BUCKET` | S3 only | Object-storage bucket. |
| `S3_REGION` | S3 only | Region; defaults to `auto`. |
| `S3_ENDPOINT` | Compatible stores | Custom endpoint; omit for AWS S3. |
| `S3_ACCESS_KEY_ID` | Store-dependent | Access key; may be omitted when the runtime supplies AWS credentials. |
| `S3_SECRET_ACCESS_KEY` | Store-dependent | Secret key paired with the access key. |
| `S3_FORCE_PATH_STYLE` | No | Use `true` for stores such as many MinIO installations. |
| `S3_PREFIX` | No | Namespace within the bucket; defaults to `open-canvas`. |

Never commit `.env`. Rotate `ADMIN_PASSWORD` and `AUTH_SECRET` if either is exposed; changing `AUTH_SECRET` signs out existing editor sessions.

## Editor model

The public page reads only the published document. `/edit` loads the draft and autosaves after changes settle. Publishing copies the current normalized draft to the published document and increments its version.

Puck requires every nested component to have a globally unique `props.id`. `lib/puck-data.ts` repairs missing or duplicate identifiers at all read/write boundaries. Do not place literal IDs inside a component's slot `defaultProps`; Puck must allocate them when a container is inserted.

Custom HTML/JS runs in an iframe with `sandbox="allow-forms allow-modals allow-scripts"`. It deliberately lacks same-origin access, popup privileges, and parent navigation. Treat third-party snippets as code: use trusted sources and never include private keys.

## Component library

The main registry is `lib/site-builder.tsx`.

- Foundations: heading, paragraph, eyebrow, image, button, divider, spacer, badge, and button group.
- Layout & composition: recursive 1–4 column containers, flex rows/columns, inset and aspect-ratio wrappers, and media with a nested content slot.
- Hero options: a new slot-based composable hero with split, overlay, and text-only treatments, plus editorial and technical presets. See [hero authoring](docs/HERO_COMPONENTS.md).
- Portfolio & storytelling: split feature, text section, grids, project cards, gallery, before/after comparison, video, sticky story, timeline, pull quote, marquee, links, facts, credits, and contact.
- Content patterns: cards, callouts, accordions, feature lists, logos, avatars, metrics, checklists, code snippets, and notices.
- Navigation & integrations: editable header/link bar, footer/site map, breadcrumbs, social links, Calendly, public GitHub repository metadata, sandboxed custom HTML/CSS/JS, and generic embeds.
- The exact category map and composition decisions live in [the component-library audit](docs/COMPONENT_LIBRARY_AUDIT.md).

Templates are ordinary Puck JSON in `lib/templates.ts`. A new template must use registered component names and globally unique IDs. New component types should be added to `nestedAllowlist` so they can be used inside containers.

## Development and verification

```bash
npm test
npm run build
```

Focused tests cover Calendly URL constraints, upload policy and byte ranges, published metadata normalization, and recursive Puck identity repair. The GitHub Actions workflow runs the same test and build commands.

Project map:

- `app/`: public renderer, protected editor, auth, content, and media routes.
- `lib/site-builder.tsx`: Puck component and root settings registry.

Image-bearing components expose a nine-position focal-point control; see [docs/IMAGE_CROPPING.md](docs/IMAGE_CROPPING.md) for the saved-data contract and extension rules.
- `lib/templates.ts`: generic starter documents.
- `lib/storage.ts`: filesystem/S3 persistence boundary.
- `lib/auth.ts`: signed editor sessions and password verification.
- `lib/puck-data.ts`: recursive component identity normalization.
- `docs/SECTION_LINKS.md`: editable block anchors and authoring contract.
- `docs/HERO_COMPONENTS.md`: composable hero fields, treatments, accessibility, and responsive verification.
- `docs/COMPONENT_LIBRARY_AUDIT.md`: complete picker taxonomy and component composition decisions.
- `lib/media.ts`: upload rules and HTTP byte-range parsing.
- `docs/ARCHITECTURE.md`: contracts and extension points.
- `docs/NAVIGATION_COMPONENTS.md`: header/link bar and footer/site map field contracts.
- `docs/RETURN_TO_TOP_BUTTON.md`: root-level Return to top authoring and accessibility contract.
- `docs/GITHUB_REPOSITORY_BLOCK.md`: GitHub repository block data and authoring contract.
- `docs/OPERATIONS.md`: deployment, backup, restore, and upgrade guide.

## Current scope

christopher's website builder intentionally publishes one site with one administrator password. It is not a multi-tenant SaaS, collaborative document editor, transcoding service, or arbitrary parent-page code runner. Those boundaries keep it understandable and easy to self-host. Storage and authentication are isolated so a team can replace either without rewriting the editor.

## License

MIT. Puck and bundled fonts retain their respective open-source licenses.
