# Paragraph line breaks

## Contract

`ParagraphBlock` stores its `text` field as a plain string. Newline characters entered in the textarea are part of that persisted value and must remain visible as line breaks on the published page.

## Rendering boundary

The component renders the saved value as text inside a `<p class="builder-paragraph">`. The public stylesheet applies `white-space: pre-line` to that class. This preserves authored newlines without changing normal paragraph wrapping or preserving accidental repeated spaces.

The editor can appear correct even when the public page is not, because the editor surface supplies its own editing styles. Always check the published renderer when changing paragraph output or CSS.

## Verification

Use a paragraph containing two lines, save it, and confirm that the published DOM contains the newline in the text and that the rendered element has `white-space: pre-line`. Repeat once inside a nested layout container, since nested blocks use the same class.
