# Text editing and typography

## Behavior

Heading, Paragraph, and the body of Text accept Markdown. Heading supports inline emphasis, code and links. Paragraph and Text also support paragraphs, headings, lists and block quotes. Newlines remain visible. Example: `**Bold** and [About](/about)`.

The editor preserves raw Markdown inside Puck's inline text element so typing does not replace its DOM node or rewrite the cursor position. The published page and fixture published view render Markdown. Raw HTML is ignored; links use the existing `safeHref` policy. Images belong in image components.

Native component typography controls take precedence. Text fallback controls are optional, property-specific and resettable with “Use component styling.” Choosing a font no longer forces weight, line height, emphasis, and decoration to inherit. Heading and Paragraph expose a single set of native typography fields instead of duplicate override fields.

## Implementation

- The shared link sanitizer preserves scalar children and existing React keys. Its former `Children.map` traversal converted Markdown strings to arrays and rewrote keys inside component children.
- `lib/markdown-text.tsx` uses react-markdown, without raw HTML execution. React elements supplied by Puck pass through unchanged.
- `typographyFields()` uses lower-case property names when no prefix is requested. Previously it wrote `FontWeight`, while renderers read `fontWeight`.
- `normalizeBuilderData` migrates old capitalized typography keys and duplicate overrides for Heading/Paragraph. Existing native values win; capitalized fields then legacy overrides supply missing values. Persisted component keys and IDs remain intact.
- `withTypographyOverride` applies property-specific fallback classes and preserves styles already set on the component root. Descendant CSS does not use `!important`, and explicitly styled descendants retain their own properties.
- Editor override callbacks and viewport/DnD definitions have stable identities across typing and autosave. Page/template replacement remains an intentional reset. Autosave errors continue to set the visible save-error state without an unhandled rejected promise.

## Verification

Run `node --import tsx --test lib/markdown-text.test.tsx`, `npm run test:puck-data`, and `npx tsc --noEmit`. No linting or unrelated test repairs are required.

For isolated browser verification, run `COMPONENT_FIXTURES=1 NEXT_BUILD_DIR=.next-editor-qa npm run dev -- --port 3010`, then `node scripts/verify-editor-text.mjs`. The script uses the real EditorClient at `/fixtures?mode=studio`, with intercepted in-memory API responses. It does not modify real draft or published data. The fixture route remains gated by COMPONENT_FIXTURES.

The test checks editable node identity across multiple keystrokes and autosave, computed native weight, a lower-page section drag, and published Markdown/links/semantic emphasis. Screenshot: `/tmp/editor-markdown-qa.png`.

The reported one-character remount was not reproduced in the original local Paragraph fixture or the full studio shell with isolated data. Stability changes remove changing override/viewport identities, but do not establish the cause in the user's affected document. If it persists, reproduce with that document and inspect which node is replaced (iframe, canvas, block or editable span), including nested slot moves. Avoid scroll-to-position patches that conceal a remount.

Verified locally: 7 Markdown/link rendering tests (including all 93 default component renders), 5 persistence-normalization tests, TypeScript, and the browser regression passed. During the drag regression, the preview remained at scrollY 2878 before and after reordering; continuous `XYZ123` input survived autosave with the same editable node. No deployment was performed.

References: [Puck override API](https://puckeditor.com/docs/api-reference/overrides), [Puck inline text fields](https://puckeditor.com/docs/api-reference/fields/text), and [react-markdown](https://github.com/remarkjs/react-markdown). Context7 was unavailable; installed Puck source and official documentation were inspected instead.

## Nested slot remount fix — 2026-09-08

### Reproduction and cause

The continued report was reproduced in WebKit using an in-memory copy of the local draft. All five nested editable fields in MediaText and HeroLayout lost their DOM identity after one character. The old editable became disconnected, focus moved to the iframe body, and a lower HeroLayout field reset scrollY from 3216 to 0. Top-level paragraphs passed, which explains why the original regression missed this defect.

Puck 0.23's `getSlotTransform` creates a new slot callback when nested content is transformed. Rendering that callback as `<Content />` makes it a new React component type and unmounts the drop zone. This is independent of the editor-level key and the preview override identities addressed earlier.

`lib/site-builder/StableSlot.tsx` provides a stable component boundary and invokes the current Puck-generated slot render callback inside it. The callback is a hook-free factory in the installed Puck version; it returns the underlying drop-zone/render component. The same drop-zone type stays mounted while its props update. Do not replace this with `<Render />`, memoize an old callback, or restore scroll after a remount. Recheck this assumption when upgrading Puck or adding custom slot field transforms.

Every slot in LayoutContainer, FlexRow, FlexColumn, InsetContainer, AspectRatio, MediaText, and HeroLayout uses this boundary. Existing slot names, component IDs, anchors, styles, nesting permissions, and resolveData behavior are retained. No persistence migration is needed.

### Verification commands

Run a development fixture server with `COMPONENT_FIXTURES=1 NEXT_BUILD_DIR=.next-editor-qa npm run dev -- --webpack --port 3010`. Browser test binaries can be installed with `npx playwright install chromium firefox webkit`.

- `QA_BROWSER=webkit QA_NESTED=1 QA_SHARED_NAVIGATION=1 node scripts/verify-editor-text.mjs`
- `QA_BROWSER=chromium QA_NESTED=1 QA_SHARED_NAVIGATION=1 node scripts/verify-editor-text.mjs`
- `QA_BROWSER=webkit QA_COMPONENTS=LayoutContainer,FlexRow,FlexColumn,InsetContainer,AspectRatio,MediaText,HeroLayout node scripts/verify-inline-fields.mjs`
- Optional local-draft reproduction: `QA_BROWSER=webkit QA_NESTED_ONLY=1 QA_DOCUMENT=data/documents/home.json node scripts/verify-inline-fields.mjs`
- `npm run test:render` and `npx tsc --noEmit`

`QA_ORIGIN` overrides localhost:3010. `QA_NESTED=1` places the 60 paragraph blocks inside a FlexColumn. The regression checks focus and element identity after each character without refocusing, saved text, typography, actual pointer drag activation, saved nested order, and scroll displacement below five pixels. Dragging starts from the block edge with time for the drag sensor to activate. Saves are intercepted; no real draft or published data is written.

WebKit and Chromium passed nested typing/autosave/reordering at scrollY 3616. The final WebKit test also asserts the drag's exact scroll preservation. WebKit passed 13 visible inline fields across the layout gallery; one empty image caption in AspectRatio was invisible and counted separately. All five nested fields in the copied local draft passed. TypeScript and all three render tests passed, including the default rendering/anchor check for every registered component.

An exploratory sweep of all local-draft fields also encountered a separate LensHeroBlock kicker click selecting its headline; both elements stayed mounted and there was no scroll reset. It is outside the nested remount fix and is not counted as a passing all-document check. Use `QA_NESTED_ONLY=1` to reproduce the scoped five-field result.

Firefox's downloaded test browser failed before navigation with “Could not find profile folder,” including with a profile under /private/tmp. Firefox runtime verification remains outstanding; Playwright WebKit is engine-level verification, not a claim of testing the user's installed Safari. No deployment was performed.
