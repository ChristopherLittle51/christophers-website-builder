# Component library audit and organization

This is the current organizational contract for all 72 registered Puck
component keys. Each key appears in exactly one picker category. Categories
describe an author's starting point, not whether a block may be nested.

## Picker taxonomy

| Category | Components |
| --- | --- |
| Navigation & links | Header link bar, Footer / site map, Breadcrumbs, Social links |
| Foundations | Heading, Paragraph, Eyebrow / label, Image, Button, Divider, Spacer, Badge / tag, Button group |
| Layout & composition | Nested layout container, Flex row, Flex column, Inset container, Aspect ratio frame, Media + nested text |
| Hero options | Composable hero, Editorial hero, Developer hero |
| Portfolio & storytelling | Split image + text, Text section, Expandable grid, Project cards, Gallery, Before / after, Video, Sticky story, Process timeline, Pull quote, Marquee, Link list, Facts / stats, Project credits, Contact footer |
| Content patterns | Card, Callout, Accordion / details, Feature list, Logo cloud, Avatar group, Metric list, Checklist, Code snippet, Notice |
| Photo & cinema | Film strip, Contact sheet, Director’s slate, Lens / aperture hero, Camera viewfinder, Storyboard sequence, Showreel feature, Color grade triptych, Film stock details, End credits |
| Embeds & integrations | GitHub repository, Calendly scheduling, Custom HTML / JS, Embed frame |
| Developer | Code snippet, Terminal session, Tech stack, Developer features, API endpoint, Architecture map, Changelog, Open source note, Developer metrics, Documentation callout, Developer CTA |

The names above map directly to the stable keys in `lib/site-builder.tsx`.
`ImageBlock` no longer appears in two categories, and all former Quality of
life entries now live beside the job they perform.

## Composition policy

New generic surfaces should be composed from Foundations plus Layout &
composition before adding another curated block. The preferred sequence is:

1. Use `FlexRow`, `FlexColumn`, `InsetContainer`, `AspectRatio`, `MediaText`,
   or `LayoutContainer` to establish responsive structure.
2. Add semantic content with text, image, action, and status foundations.
3. Use a content pattern only when it supplies distinctive semantics or
   interaction, such as native disclosure, metrics, a checklist, or a logo
   fallback.
4. Add a curated block only when its behavior cannot be expressed without
   losing a meaningful visual or functional contract.

The `HeroLayout` component follows this rule: it provides the hero geometry,
while its slot uses ordinary authoring blocks. The Composable hero template is
the reference implementation.

## Curated-component decisions

Every key has one current decision below. “Partial” means share a small
renderer/field helper beneath the stable registered component; it does not
authorize changing persisted Puck data into a different component type.

| Decision | Component keys |
| --- | --- |
| Foundation — use directly in new compositions | `LayoutContainer`, `FlexRow`, `FlexColumn`, `InsetContainer`, `AspectRatio`, `MediaText`, `HeadingBlock`, `ParagraphBlock`, `EyebrowBlock`, `DividerBlock`, `SpacerBlock`, `Badge`, `ImageBlock`, `ButtonBlock`, `ButtonGroup`, `HeroLayout` |
| Compose first; retain the existing key for compatibility | `TextBlock`, `Card`, `Callout`, `ContactBlock`, `DeveloperCtaBlock`, `OpenSourceBlock` |
| Partial helper extraction; retain its distinct outer contract | `EditorialHero`, `DeveloperHeroBlock`, `SplitFeature`, `HeaderLinkBar`, `FooterSitemap`, `LinkListBlock`, `SocialLinks`, `SocialIconLinks`, `FeatureList`, `DeveloperFeaturesBlock`, `TimelineBlock`, `ChangelogBlock`, `StatsBlock`, `MetricList`, `DeveloperStatsBlock`, `CreditsBlock`, `LogoCloud`, `AvatarGroup`, `ExpandableGrid`, `ProjectGrid`, `GalleryBlock`, `StoryboardBlock`, `ReelShowcaseBlock`, `EndCreditsBlock`, `CodeSnippet`, `CodeSnippetBlock`, `TechStackBlock`, `DocsCalloutBlock` |
| Retain bespoke | `Breadcrumbs`, `Accordion`, `Checklist`, `Notice`, `QuoteBlock`, `MarqueeBlock`, `StickyStory`, `BeforeAfter`, `VideoBlock`, `LensHeroBlock`, `FilmStripBlock`, `ContactSheetBlock`, `DirectorsSlateBlock`, `ViewfinderBlock`, `ColorGradeBlock`, `FilmStockBlock`, `TerminalBlock`, `ApiEndpointBlock`, `ArchitectureBlock`, `EmbedFrame`, `GitHubRepositoryBlock`, `CalendlyBlock`, `CustomCodeBlock` |

`DeveloperHeroBlock` intentionally belongs in Hero options rather than
Developer, while all Photo & cinema keys remain in their specialist category.
This table and the picker taxonomy together account for every registered
component exactly once.

### Reuse or compose for new work

| Existing family | Preferred building blocks | Compatibility decision |
| --- | --- | --- |
| Text section | Eyebrow + Heading + Paragraph in Flex column / Inset container | Keep `TextBlock` for existing pages; create new sections composition-first. |
| Split image + text | Media + nested text with Heading and Paragraph | Keep `SplitFeature` until a parity-tested migration is intentionally planned. |
| Developer CTA / Open source | Eyebrow + Heading + Paragraph + Button group / Badge | Keep domain-specific framing, but use foundations for new generic CTA and project notes. |
| Developer metrics / facts | Metric list plus a text wrapper | Keep the current keys; Metric list is the canonical generic metric primitive. |
| Documentation callout | Callout plus Code snippet / Button group | Keep `DocsCalloutBlock` for its technical marker and link treatment. |
| Contact footer | Eyebrow + Heading + Button group | Keep its email-specific semantics and large closing treatment. |

### Intentionally specialized

Navigation, Breadcrumbs, Accordion, Logo cloud, Avatar group, Checklist,
Video, Before / after, galleries, Sticky story, Timeline, Marquee, all
integrations, and the Photo & cinema family remain dedicated components.
They own native semantics, stateful behavior, external-service boundaries, or
heavy art direction that would be lost by flattening them into generic slots.

Photo & cinema is explicitly kept bespoke except for already-shared concerns
such as image crop handling, theme tokens, and array-field conventions. Do
not replace its registered keys with generic layout data without a separate
visual-parity and data-migration project.

## Data and maintenance guardrails

- Component keys are persisted in draft and published Puck JSON. Do not rename
  or remove a key without a migration.
- Register a new block in its one picker category and in `nestedAllowlist` if
  it must work inside a slot.
- Default slot children must not contain literal IDs. Templates must contain
  globally unique IDs.
- All image-bearing components need the shared centered crop fallback and an
  editable meaningful alt field.
- Verify changed responsive surfaces at 390px, 768px, and 1280px; nested
  layouts must be checked inside a constrained parent as well as full-width.

## Coverage gap retained for later work

Five templates exercise only 24 of the pre-existing registered keys. The new
Composable hero starter improves discoverability of composition but does not
pretend every component has template coverage. Add focused template examples
only when they teach a coherent page story; do not create a template merely to
tick off a picker entry.
