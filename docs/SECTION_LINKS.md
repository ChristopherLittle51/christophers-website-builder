# Section links

Every registered content block has a **Section link name** field in the Puck sidebar. Use a short, human-readable value such as `photography`, then point any block link at `#photography`.

## Contract

- The editable value is stored in `props.name`; Puck's internal `props.id` remains separate and continues to identify blocks for editing.
- `lib/puck-data.ts` normalizes names at every draft and published read/write boundary. Names are lowercased, whitespace and punctuation become hyphens, and names are capped at 80 characters.
- Missing names receive deterministic `generated-<block-type>-<hash>` values. Duplicate names receive a numeric suffix, so every anchor remains unique across nested slots and legacy zones.
- The block renderer applies the normalized name to the existing root element as its HTML `id`. No wrapper is added, which preserves grid and flex layout behavior.
- `app/globals.css` supplies `scroll-margin-top` for anchors so fixed navigation does not cover the target after a hash jump. The document already enables smooth scrolling, with reduced-motion support.

## Authoring example

1. Select the block that should be the destination.
2. Set **Section link name** to `photography` and publish the site.
3. Set a link field (for example, a Link list item or Button URL) to `#photography`.

The browser will navigate to the same page and scroll to the block. External pages can use the full URL, for example `https://portfolio.example/#photography`.

## Verification

The focused test is `npm run test:puck-data`. It covers generated names, slug normalization, duplicate suffixing, determinism, and nested component identity repair. TypeScript verification is `npx tsc --noEmit`; production verification is `npm run build`.
