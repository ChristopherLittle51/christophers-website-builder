# Image crop controls

Every editable photo field exposes a **Photo crop** control in the Puck sidebar. The control selects the image focal point from a nine-position grid: top-left, top, top-right, left, center, right, bottom-left, bottom, and bottom-right.

## Data contract

Crop choices are stored beside the existing image URL rather than replacing it. Single-image blocks use a block-specific field such as `imageCrop`, `beforeCrop`, `afterCrop`, or `posterCrop`. Repeated image fields use `crop` inside each array item. The six-image gallery and project cards use numbered crop fields beside their image fields.

Older documents do not need migration. Missing crop values resolve to `center center` at render time, while newly inserted items receive the same explicit center default.

## Implementation rules

- Add `cropField()` next to every `imageField()` used for an editable photo.
- Add a center default for new component and array-item data.
- Pass the crop value to `imagePosition()` on the rendered `<img>` (or video poster element).
- Keep the URL and crop separate so existing documents, uploads, metadata, and published JSON remain compatible.
- If a new component introduces a photo, update this document and add a focused render/registry test when practical.

The shared implementation lives in `lib/site-builder.tsx`. `imagePosition()` converts the saved CSS position into `object-position`; the existing component CSS continues to determine the frame aspect ratio and `object-fit` behavior.
