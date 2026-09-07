# Production component library

This document records the component-library boundaries and the checks required
when another contributor changes them. It is deliberately maintained beside
the code so future work does not need to reconstruct the persistence contract.

## Module boundaries

- `lib/site-builder.tsx` is the compatibility facade used by the editor and
  published renderer. Keep this import path stable.
- `lib/site-builder/config.tsx` only assembles the Puck configuration and
  applies cross-cutting wrappers.
- `lib/site-builder/components/*-components.tsx` own the established component
  definitions by authoring family; `new-components.tsx` owns Signal systems.
- `lib/site-builder/runtime.tsx` owns stateful render helpers and the section,
  typography, and generated-name behavior used across families.
- `lib/site-builder/catalog.ts` is the single picker and nesting catalog. Its
  component values are persisted document type identifiers.
- `lib/site-builder/shared.tsx` owns reusable fields, field UI, visual option
  lists, crop behavior, typography helpers, and media upload feedback.
- `app/styles/builder-accessibility.css` supplies cross-family keyboard,
  high-contrast, touch-target, media, and text-overflow safeguards. It is the
  last import in `app/globals.css`, so these shared safeguards win the final
  cascade while component-specific rules remain readable in their family files.

The registry currently has 93 persisted component type keys: 73 established
compatibility keys and 20 Signal systems. Renaming or removing one requires a
versioned data migration. Moving the TypeScript object that defines a key does
not require a migration when its key, props, defaults, and rendered behavior
remain compatible.

## Assembly rules

Each component appears in exactly one picker category. Every current component
is also allowed in slots, so `nestedAllowlist` is derived from the same catalog
instead of maintained as a second handwritten list. The catalog contract test
uses a frozen list so accidentally deleting or renaming a key fails loudly.

All registered blocks receive a public section name and section-anchor wrapper.
Blocks other than the four structural containers also receive the shared
typography fields and typography wrapper. The established wrapper order is:

1. Start with the component's renderer.
2. Apply the section-anchor wrapper.
3. Apply the typography wrapper where supported.
4. Apply cross-page link field and render adapters after those wrappers.
5. Supply insertion-time generated section names through `resolveData`.

Do not reverse the section and typography wrappers. Both clone the component's
root element and merge different props; order changes are observable.

## Current production evidence

The frozen catalog contract covers all 93 keys, picker ownership, nesting, and
persisted-key compatibility. The dated [component QA matrix](COMPONENT_QA_MATRIX.md)
records the latest published fixture run for every key at 320, 390, 768, and
1280 CSS pixels, including horizontal overflow, broken images, uncaught browser
errors, and axe WCAG checks. Use the matrix as review evidence for that run;
rerun `npm run test:browser` after component changes.

Two legacy media gaps were corrected. `ProjectGrid` now has a description for
each project image, and `GalleryBlock` has a description for each of its six
images. Existing saved documents remain valid: missing new description props
render as decorative empty alt text until an author supplies descriptions.

`Notice` has an optional dismiss affordance. When `dismissible` is `hint`, the
renderer uses a real 44px button with an accessible name and removes the notice
from the visitor's local React state after activation. Dismissal is not saved
to the document, so authors retain control of the persisted content.

Return-to-top behavior now checks `prefers-reduced-motion` before requesting
smooth scrolling. CSS also suppresses animations and transitions for the same
preference.

## Required checklist

Complete these checks for component work and record any intentionally skipped
item in the change description.

- [ ] The frozen catalog test still contains all 93 persisted keys, including
      the 20 Signal systems.
- [ ] Every component appears in exactly one picker category.
- [ ] Every slot-compatible component is in the derived allowlist.
- [ ] Persisted keys and existing prop meanings are unchanged, or a migration
      and backward-compatibility fixture are included.
- [ ] Default slot children do not contain literal Puck IDs.
- [ ] Image content has an editable description; decorative duplicates use an
      empty alt attribute intentionally.
- [ ] Iframes have a useful title and the narrow viewport does not trap content.
- [ ] Interactive controls work by keyboard with visible focus.
- [ ] Native semantics are used for links, buttons, disclosures, lists, status,
      and tab interfaces.
- [ ] Controls remain usable at 320 and 390 CSS pixels and at 200 percent zoom.
- [ ] Layout is checked at 768 and 1280 CSS pixels.
- [ ] Nested layout is checked inside a constrained column, not only full width.
- [ ] Long unbroken labels, translated copy, and empty optional fields do not
      overflow or create dead controls.
- [ ] Reduced-motion and forced-colors modes preserve meaning and operation.
- [ ] Focus order follows the visible reading order.
- [ ] `npm run test:catalog`, focused tests, and `npx tsc --noEmit` pass apart
      from separately identified concurrent work.
- [ ] The [per-component QA matrix](COMPONENT_QA_MATRIX.md) is regenerated from
      the same run after responsive or accessibility changes.

## Responsive acceptance fixtures

`scripts/verify-production-library.mjs` visits each of the 93 fixture
components in published mode at 320, 390, 768, and 1280 pixels. It records
document overflow, broken images, browser errors, and axe violations in the
report used for the [QA matrix](COMPONENT_QA_MATRIX.md). Add targeted fixture
checks for short landscape viewports, 200 percent zoom, reduced motion, forced
colors, or editor overlays when a change affects those contracts; the published
matrix does not claim to cover those dimensions automatically.

The editor and published renderer share the registry, but both modes need
coverage. Editor overlays and slot drop zones change geometry, while published
mode activates visitor-only interactions such as return-to-top and embeds.

## Negotiated crawler fallback

`proxy.ts` fetches the internal `/content/<page>.md` representation at the
configured trusted render origin before it
commits a crawler request to that response. A successful Markdown or HTML
representation is streamed to the requester. A network error, redirect,
unsupported response type, or non-success status returns `NextResponse.next()`
so Next.js renders the original public HTML page. This also covers disabled
Markdown and an unavailable configured renderer without exposing a `502` as
the public page response.

The internal request forwards only the negotiation marker, original public
path, the original `Accept`, and `User-Agent`; it does not forward visitor cookies or
authorization. The representation and fallback response vary on `Accept` and
`User-Agent`, use `no-store`, and continue to resolve pages from the published
catalog. The proxy bounds the internal request to nine seconds. Preserving the
original `Accept` value also lets the content route distinguish an explicit
Markdown request from automatic AI-crawler negotiation and enforce the
`aiMarkdown` setting. `npm run test:crawlers` includes the success,
extraction-failure, policy-preservation, and unreachable-route proxy contracts.

## Family ownership

Legacy definitions are split into navigation, foundations, composition, heroes,
portfolio, content patterns, cinema, integrations, and developer modules. Each
exports one component map; `config.tsx` spreads those maps and applies common
wrappers once after assembly. Keep new behavior in its owning family, and move
only cross-family fields or stateful rendering mechanics into `shared.tsx` or
`runtime.tsx`.
