# Builder interaction polish

## Expandable image-grid title

The shared section heading rules now target only the numbered section marker:
`.builder-section-title > div > span`. Puck turns content-editable title and
introduction fields into nested spans; the old descendant selector accidentally
applied marker-scale typography to those editor wrappers and produced visibly
broken title kerning.

## More forgiving nested drops

`LayoutContainer` slots should use Puck's supported `minEmptyHeight` slot prop
and the `builder-container__dropzone` class. Keep this at 220px so an empty
column has an obvious, touch-friendly landing area while populated columns keep
their natural height. This relies on Puck's slot API, rather than synthetic drag
overlays or pointer-event overrides, so nested content editing remains intact.

## Nesting contract

When a component category gains blocks, keep the nested-layout allowlist in
`lib/site-builder.tsx` in sync. The existing photo-and-cinema components must
also be included: they are advertised in the picker and should be valid inside
layout columns.
