# Interactive component collection

`new-components.tsx` exports exactly 20 persisted Puck component keys. Import
`newComponents` into the registry, add their keys to the interactive picker
category and nested allowlist, and import `new-components.css` from the public
global stylesheet or config entrypoint.

All controls use native buttons, links, inputs, tabs, disclosures, audio, or
form fields. The component CSS has small-screen linear layouts and an explicit
reduced-motion fallback for the only decorative animated treatment.

## Link contract

`SignalCommandPalette` reads `useSiteLinks()` directly and renders its page and
section records using `SiteLink`. Its local command array remains a useful
fallback for actions such as an email link. Other fields named `url`, `link`,
or `href` are designed for the registry's shared link-field and resolved-link
wrappers.

## Authoring checks

- Give every image a meaningful description; image fields remain optional so a
  component is still readable when media is omitted.
- Use IANA timezone names for Location Clockboard, for example
  `America/New_York`.
- Audio Field Notes should include a transcript whenever audio is supplied.
- Do not label Release Status Board as live unless its values come from a real
  source; the default uses authored release data.
- Verify keyboard tabs, command palette escape behavior, and 390px/768px/1280px
  layouts whenever this collection changes.
