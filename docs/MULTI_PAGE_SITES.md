# Multi-page sites

Each site document now contains a page collection while preserving the legacy
`draft` and `published` fields for existing storage drivers. A legacy document
is read as one `home` page and is migrated into the page collection the next
time it is saved.

## Editor workflow

The page rail above the editor lets an administrator switch pages, create or
duplicate a page, export/import a page as JSON, set its title and public slug,
or delete a non-home page. Each page has its own Puck draft and published
document. New, duplicated, and imported pages begin as drafts, so their public
route returns 404 until they are published. Autosave affects only the active
page; publishing sends only that page live.

Page exports contain the page title, slug, and Puck draft data. They do not
carry the page ID or published state. Media bytes are not bundled, so imported
pages retain their existing media references.

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


## Copying blocks between pages

Select a block in the canvas and use **Copy** in its action bar. The copied block
is kept in the current browser tab while switching pages. On the destination
page, select a block and choose **Paste** to insert the copy immediately after
it, including any nested slot content. Use **Paste block** in the editor header
to append the copied block to the end of a page, including an empty page.

Pasted blocks receive fresh Puck component IDs before they are saved. Authored
section names and content are retained; normal page normalization resolves any
name collisions in the destination document.
