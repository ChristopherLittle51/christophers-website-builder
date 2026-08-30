# Quality-of-life builder components

The **Quality of life** category contains twenty small, composable blocks for common page-building tasks. Each block exposes its content and presentation choices as Puck fields, and every block receives the shared section-name field so it can be targeted by an anchor link.

## Components

| Component | Use it for |
| --- | --- |
| Flex row | A wrapping horizontal row of nested blocks, with gap, alignment, and distribution controls. |
| Flex column | A vertical stack of nested blocks with controlled gap, alignment, and padding. |
| Inset container | A readable max-width wrapper around nested content. |
| Aspect ratio frame | A predictable frame for nested media or content with square, landscape, wide, or portrait ratios. |
| Card | A titled, optional-action panel for an offer, service, or small idea. |
| Callout | A labeled note with info, success, or warning tone. |
| Badge / tag | A compact status or category label. |
| Button group | One to six editable links with solid, outline, or text treatments. |
| Breadcrumbs | Accessible parent-page navigation with a current-page marker. |
| Accordion / details | Native `<details>` disclosure rows for FAQs and progressive disclosure. |
| Media + nested text | An image paired with a fully nested, editable content slot. |
| Feature list | Numbered feature rows with title and supporting description. |
| Logo cloud | Linked collaborator logos with editable accessible names and uploadable images. |
| Avatar group | Linked contributor portraits with editable names and fallback initials. |
| Metric list | A definition list for values, labels, and optional supporting details. |
| Checklist | A scannable list whose rows can be marked done or to do. |
| Social links | A labeled list of external or mail links. |
| Code snippet | An editable, semantic code sample with language label and caption. |
| Embed frame | A lazy-loaded iframe with an editable accessible title, height, and caption. |
| Notice | A status note with neutral, positive, or caution tone and an optional close hint. |

## Nesting behavior

Flex row, Flex column, Inset container, Aspect ratio frame, and Media + nested text expose Puck slots. Their slots allow the complete builder block allowlist, including one another, so layouts can be composed recursively. The slot wrappers use `min-width: 0` and the CSS switches to columns only at the parent/container width where appropriate; content therefore remains usable on narrow screens. Other QoL blocks are leaf components and can be placed inside any slot or existing `LayoutContainer` column.

Interactive and semantic details are intentionally native: Breadcrumbs uses `nav`/`ol` and `aria-current`, Accordion uses native disclosure controls, Metric list uses `dl`, media and avatars expose editable alt text, and Embed frame always has a configurable iframe title.
