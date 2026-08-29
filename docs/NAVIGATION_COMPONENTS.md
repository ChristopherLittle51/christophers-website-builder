# Navigation components

Open Canvas includes two reusable navigation blocks in `lib/site-builder.tsx`:

## Header / link bar

`HeaderLinkBar` renders a semantic `<header>` with an editable brand link and a repeatable horizontal navigation list. Each link accepts a label and either a normal URL or an in-page anchor such as `#work`. On narrow screens the brand gets its own row and long titles can wrap at safe word boundaries; the link row remains horizontally scrollable. At desktop widths the brand and links return to one row, with the brand capped so it cannot crowd the navigation. The block supports the shared `paper`, `black`, and `lime` themes.

## Footer / site map

`FooterSitemap` renders a semantic `<footer>` with an intro, brand, note, email link, and grouped site-map links. Each repeatable link has a group, label, and URL. Rows with the same group name render together, so editors can create sections such as `Explore`, `Services`, and `Connect` without managing separate arrays. The copyright line is an editable field and is intentionally not generated from the server clock.

Both blocks are available in the Navigation category and are allowed inside nested layout containers. They use `--block-bg` and `--block-ink`, which inherit the site’s configured theme colors, and their layout is mobile-first with a desktop breakpoint at 700px. Long brand names in either block use safe overflow wrapping; the footer legal row can also wrap when its text exceeds the viewport.

When adding anchors to a page, give the destination block a unique **Section link name** such as `work` or `about`, then use that value in a header or footer URL as `#work` or `#about`. The existing data normalizer makes section names unique across the saved document.

## Verification

Check the blocks in Puck at the existing Phone (390px), Tablet (768px), and Desktop (1280px) viewports. Confirm that mobile header links remain reachable by horizontal scrolling, footer groups preserve their order, and anchor links target the intended named block after save and reload.
