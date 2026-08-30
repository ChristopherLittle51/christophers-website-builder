# Hero components

## The new default: composable hero

`HeroLayout` is the default choice for new generic page openers. It is a
layout block, not a locked copy-and-image component: authors place the usual
`EyebrowBlock`, `HeadingBlock`, `ParagraphBlock`, `ButtonGroup`, `Badge`, or
other approved blocks in its Hero content slot. This keeps an opener's content
editable with the same foundations used throughout the page.

The component has three responsive treatments:

| Treatment | Use it for | Media behavior |
| --- | --- | --- |
| Split media | A portfolio, service, or studio homepage | Text and image stack on mobile, then become two columns. The image may lead or trail. |
| Image overlay | Campaigns, project pages, and expressive openings | An accessible image remains in the document; a soft or strong contrast wash protects the nested content. |
| Text only | Writing-led, minimal, or fast-loading introductions | The same content slot gains the hero rhythm without requiring media. |

The block owns only hero framing: treatment, image/crop/alt text, media side,
contrast, content alignment, vertical placement, and theme. It deliberately
does not own a second headline, body, or button schema.

## Existing hero keys

Existing documents keep their current Puck keys and rendering contracts.
They are not silently migrated, because draft and published documents store
component keys directly.

| Component | Role | Composition decision |
| --- | --- | --- |
| `HeroLayout` | New generic hero foundation | Use for new non-specialist hero work. |
| `EditorialHero` | Art-directed image, title, and byline preset | Retained for compatibility and its existing templates. Recreate new versions with `HeroLayout` when editable nested content is useful. |
| `DeveloperHeroBlock` | Technical hero with availability status | Retained as a domain preset; its status treatment and information hierarchy are intentional. |
| `LensHeroBlock` | Cinematography hero with lens metadata | Retained as a photo/cinema specialist component. |

`ViewfinderBlock` and `ReelShowcaseBlock` are hero-adjacent media features,
not generic page-openers, and stay in Photo & cinema.

## Authoring and accessibility

- Use an H1 in the first page-opening hero only; nested headings later in the
  page should normally be H2 or H3.
- Always provide an image description for meaningful media. The crop selector
  is persisted alongside the image and defaults to centered framing for older
  documents.
- Keep action labels short enough to wrap safely at 390px. `ButtonGroup` is
  the preferred multiple-action primitive.
- `HeroLayout` automatically receives the shared section-link name and works
  inside existing slot containers. Template slot children use unique IDs;
  default slot children deliberately omit literal IDs so Puck can allocate
  them on insertion.

## Responsive verification

Check each treatment at 390px, 768px, and 1280px with a long headline and
long action label. Verify both media sides, all three themes, all nine image
crop positions, optional/missing content, and nested use in
`LayoutContainer`. On mobile, content must appear before split media in the
reading order. The overlay image is an actual `<img>`, not a CSS background.

## Starter

The **Composable hero** starter template demonstrates the split treatment.
Change its treatment in the sidebar to explore overlay and text-only without
rebuilding the content stack.
