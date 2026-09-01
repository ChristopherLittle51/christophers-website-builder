# Social icon links component

`SocialIconLinks` is a separate Puck component for compact, icon-led social navigation. The existing `SocialLinks` component remains unchanged as the larger text-link list.

## Editor controls

- Add, remove, and reorder up to 16 profiles. Each item has an icon, accessible platform name, optional visible label, and profile URL.
- Built-in icons cover Facebook, Instagram, LinkedIn, YouTube, X/Twitter, TikTok, Pinterest, Threads, Bluesky, GitHub, Discord, Twitch, Mastodon, email, website, and a generic custom link.
- Choose an automatic responsive layout, a wrapping row, or a fixed column. Auto uses the component's available width—not the page viewport—so it responds correctly inside nested layout columns.
- Choose left, center, or right alignment; icon-only or icon-and-label display; simple, outline, or filled styling; and three sizes.
- Choose whether normal profile links open in the same tab or a new tab. Anchor, email, and telephone links always stay in the current browsing context.

## Responsive behavior

The block is a wrapping flex row by default. In **Auto**, a container query switches the links to a vertical list below 420px of actual component width. A block nested in a narrow `FlexRow`, `FlexColumn`, or `LayoutContainer` cell therefore stacks even on a desktop page. Explicit **Row** and **Column** choices override that automatic switch.

## Accessibility

Icon-only links receive the authored platform name as their accessible name and tooltip. SVG artwork is decorative, keyboard focus is visible, and links opened in a new tab use `noopener` and `noreferrer`.

## Verification

1. Insert Social icon links and confirm the default Facebook, Instagram, LinkedIn, YouTube, and X icons render.
2. Check icon-only and icon-and-label modes at small, medium, and large sizes.
3. Place the block in a narrow nested column and confirm Auto becomes a vertical list; widen the column and confirm it returns to a wrapping row.
4. Confirm Row never becomes a column, Column remains stacked, and all three alignments work.
5. Tab through every link and confirm the focus ring and accessible platform name.
