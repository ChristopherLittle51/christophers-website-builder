# Typography controls

The builder exposes a shared typography system in `lib/typography.ts`. It is
the single registry for selectable font families, font weights and text
metrics, so new text surfaces do not need to invent their own control values.

## Families

There are 19 selectable families: the original nine (Inter, Manrope, Space
Grotesk, DM Sans, Bricolage Grotesque, Playfair Display, Cormorant Garamond,
Fraunces, and IBM Plex Mono) plus ten locally packaged additions (Roboto, Open
Sans, Lato, Montserrat, Oswald, Raleway, Libre Baskerville, Source Code Pro,
Nunito, and Archivo). The additions are imported by `app/layout.tsx`, avoiding
a runtime CDN dependency and keeping published pages deterministic.

## Controls and compatibility

`typographyFields()` provides font family, weight, italic/upright style, letter
spacing, word spacing, line spacing, decoration, case transformation, and font
kerning. Blank or absent values produce no inline declaration, preserving old
documents and existing component CSS. The existing `font`/`*Font` props remain
valid and are used as legacy fallbacks by their existing renderers.

Heading and Paragraph primitives use the controls directly. During config
registration every non-layout block also receives a `typography*` block-wide
override. This override is useful for helper-rendered text and array/repeater
content: when set, `builder-typography-overrides` makes visual text descendants
inherit the selected values. Layout and slot wrappers are intentionally
excluded so nested blocks retain independent typography.

Metadata, URLs, image alt text, and opaque iframe contents are not styled.
Per-item repeater controls are not synthesized; the block-wide override is the
safe, backwards-compatible way to style all visible copy in those blocks.

## Verification

Run `npx tsc --noEmit` after changing the registry. Focused behavior tests can
be run with `npm run test:puck-data`; unrelated lint/test failures should not
be used to scope typography changes.
