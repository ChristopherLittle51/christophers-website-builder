# Return to top button

The Return to top control is an optional root setting, so it applies to one
page at a time without adding a block to the page content. It is off by
default, including for existing pages. In Puck, open the page settings panel
and change **Return to top button** to **Show on scroll**.

## Authoring controls

The setting is saved in the page's `root.props` alongside the existing color,
typography, and metadata fields:

- `returnToTop`: `hidden` (default) or `show`.
- `returnToTopLabel`: visible button text and accessible name.
- `returnToTopAppearance`: `ink`, `accent`, or `outline`.
- `returnToTopPosition`: `right` or `left`.

The button uses the root `--site-paper`, `--site-ink`, and `--site-accent`
tokens plus the configured accent font. That keeps it aligned with the page's
own visual system instead of introducing fixed product styling.

## Visitor behavior and accessibility

When enabled, the control is fixed above the safe-area inset and becomes
visible only after the visitor has scrolled more than 320 pixels. Activating
it scrolls to the document top with the browser's smooth-scroll behavior.
Reduced-motion visitors retain the global reduced-motion override, so the
browser scrolls without animation. It is a native `button`, has a focus-visible
outline, and uses the editable label as its accessible name.

The control intentionally does not render inside Puck's editing canvas. This
prevents a fixed overlay from obscuring the editor while keeping all settings
editable; use the editor's **View website** link to preview its live behavior.

## Verification

Run `npx tsc --noEmit` and the focused test suite. For manual QA, enable the
setting on a page, publish it, and confirm at 390px, 768px, and 1280px that it
appears after scrolling, respects both sides and each appearance, is reachable
by keyboard, and returns the visitor to the top.
