# Multi-page sites

Each site document now contains a page collection while preserving the legacy
`draft` and `published` fields for existing storage drivers. A legacy document
is read as one `home` page and is migrated into the page collection the next
time it is saved.

## Editor workflow

The page rail above the editor lets an administrator switch pages, create a
page, set its title and public slug, or delete a non-home page. Each page has
its own Puck draft and published document. New pages begin as drafts, so their
public route returns 404 until they are published. Autosave affects only the
active page; publishing sends only that page live.

Page and template actions use in-editor modal forms rather than browser-native
`prompt()` or `confirm()` calls. Puck disables those APIs inside its editor
frame, so keeping the interaction in the editor prevents unhandled rejections.

## Public routes

The home page remains `/`. Additional pages publish at `/<slug>`. Page slugs
are normalized to lowercase URL-safe text and are made unique automatically.
The home page cannot be deleted, and at least one page always remains.

## Generated section names

Every new Puck component now receives a deterministic generated section name
during Puck's insert-time `resolveData` pass. This keeps the editable sidebar
field, the rendered anchor, and saved data aligned without remounting the
editor or moving the canvas viewport.
