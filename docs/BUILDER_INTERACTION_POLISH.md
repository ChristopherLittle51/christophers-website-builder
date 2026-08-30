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

## Preserve the editor viewport on drops

Puck manages the active document after it mounts. `EditorClient` still
normalizes every change before persisting it, but it no longer increments the
Puck key when normalization repairs the just-added block's anchor. That former
remount reset the active canvas and sent the editor back to the top. Applying a
template remains the explicit remount path because it intentionally replaces
the document.
