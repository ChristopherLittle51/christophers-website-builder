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
