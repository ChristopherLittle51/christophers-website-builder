# Photography and cinema blocks

The **Photo & cinema** category adds ten production-inspired Puck blocks. They are designed for photographer portfolios, director treatments, cinematography reels, project case studies, and behind-the-scenes pages. Every content value shown in a block is editable from the Puck sidebar; repeated imagery and credits use reorderable array fields.

## Block inventory

| Block | Puck key | Best use | Notable controls |
| --- | --- | --- | --- |
| Film strip | `FilmStripBlock` | A horizontal or vertical run of film stills | Direction, film-stock label, 2–12 frames, sticky scroll capture |
| Contact sheet | `ContactSheetBlock` | Proofs, selects, and photo archives | 3/4/6 columns, 3–24 frames, circled selects |
| Director’s slate | `DirectorsSlateBlock` | Project opening or production metadata | Scene, take, roll, crew, date, theme |
| Lens / aperture hero | `LensHeroBlock` | Cinematographer or photographer landing hero | Image, focal length, aperture, ISO, theme |
| Camera viewfinder | `ViewfinderBlock` | A single hero still with camera UI | Scope/wide/academy ratios, timecode, lens readout |
| Storyboard sequence | `StoryboardBlock` | Shot planning and process narratives | 2–12 panels with shot and camera notes |
| Showreel feature | `ReelShowcaseBlock` | A prominent linked reel or film | Poster, URL, duration, year, roles, theme |
| Color grade triptych | `ColorGradeBlock` | Before/working/final look presentation | One master image, three labels, theme |
| Film stock details | `FilmStockBlock` | Technical capture notes or equipment choices | Stock, format, exposure, process, label color |
| End credits | `EndCreditsBlock` | Dramatic project or site closer | Alignment and 2–30 role/name pairs |

## Design system

The blocks reuse the site-level display, body, and accent fonts plus `--site-paper`, `--site-ink`, and `--site-accent`. Theme-aware blocks support the existing Paper, Black, and Accent choices. Production motifs—sprocket holes, contact-print markings, a slate clapper, lens rings, viewfinder guides, and a film can—are CSS, so there are no decorative asset dependencies.

All layouts are mobile-first. Multi-column contact sheets, storyboards, grade comparisons, slate layouts, and film-stock details collapse to a single readable flow on narrow screens. `prefers-reduced-motion` continues to use the project-wide motion override.

The horizontal film strip measures the right edge of the last rendered photo relative to the track's origin. Its travel is exactly the part of that edge beyond the visible strip width; trailing padding and decorative track space never add travel. The translation is clamped to this distance, so the last photo finishes flush with the strip viewport's right edge and cannot scroll past it.

On the published page, the content-height stage sticks while vertical scrolling advances the frames horizontally. The section height is the measured stage height plus that exact travel distance, with no added viewport. Any number of photos can scroll when necessary; photos that fit have zero travel and remain in normal document flow. The former four-frame threshold was removed because photo count does not determine overflow and the old scroll listener still moved supposedly static strips.

Frame widths are explicit and captions wrap inside them, so image intrinsic dimensions and long captions cannot create an oversized empty track. Resize observation covers the stage, viewport, track, and images to remeasure after image loading, font/layout changes, and responsive resizing. In the Puck editor the strip uses native horizontal scrolling. The vertical option keeps its natural stacked layout.

### Scroll regression checks

Use a local fixture with a section before and after the strip; do not change a saved or published portfolio document for testing. Check the real browser layout after images load, not just a build or data-normalization test.

- For overflowing strips, scroll beyond the horizontal interval. The last image's `getBoundingClientRect().right` must equal the track viewport's right edge, and further page scrolling must not change the final horizontal translation.
- For fitting or empty strips, the section and stage heights must match and translation must be zero, including after removing frames or widening the viewport.
- The scroll interval must equal `max(0, lastPhotoRight - trackLeft - viewportWidth)`. Do not use `scrollWidth` or add a viewport-sized minimum.
- Verified on 2026-08-31 with four desktop photos and two/twelve photos at a 390px viewport: end-gap was 0px in each case. One-photo and empty cases reset to 0px travel after removing photos. Source and downstream builds are separate from these browser checks.

## Showcase template

The **Director’s treatment** starter template contains all ten blocks in a recommended narrative order:

1. Lens hero
2. Director’s slate
3. Showreel
4. Film strip
5. Contact sheet
6. Viewfinder
7. Storyboard
8. Color grade
9. Film stock notes
10. End credits

Use the template as a full starting point or add individual blocks from the **Photo & cinema** category to an existing page.

## Maintenance notes

- Array limits are intentional: they prevent sidebar and page performance from degrading on very large shoots.
- Decorative production UI uses `aria-hidden`; captions, stills, and linked reels retain editable accessible labels.
- Keep `.site-canvas` on `overflow-x: clip`, not `overflow: hidden`; a scrolling overflow ancestor prevents the film strip’s sticky stage from following the viewport.
- Keep new CSS under the photography/cinema section in `app/globals.css` and add responsive overrides to the existing `min-width: 700px` media query.
- When changing a component key, migrate saved Puck data first. Published and draft page JSON stores these keys directly.
