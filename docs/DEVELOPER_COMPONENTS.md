# Developer component rendering

## September 7, 2026 update

The terminal uses a macOS dark Terminal presentation: red/yellow/green controls on the left, centered title with symmetric reserved space, gray gradient title bar, rounded border, shadow, dark transcript, monospace text, and steady block cursor. Desktop section gutters no longer apply to its frame, keeping the title bar flush with the window edges.

The controls and final idle prompt are decorative and hidden from assistive technology. The component displays an authored transcript and does not execute commands. The cursor does not blink.

## Data and editor contract

Implementation lives in `lib/site-builder/components/developer-components.tsx`; styling lives in `app/styles/developer.css`.

The persisted `TerminalBlock` key and `title`, `prompt`, and `lines` fields are unchanged. Existing documents retain their content. Each command now displays the configured prompt inline. Output appears verbatim without synthetic indentation or checkmarks; success lines are green. Whitespace is preserved and long lines wrap. New instances default to `project — zsh` and `sam@studio project %`. Existing shared typography controls remain supported.

Code snippet and API response defaults now contain actual newlines. The snippet regex also uses the correct backslash. These defaults affect new instances only. Existing authored code is not unescaped during rendering, because literal backslashes can be meaningful code.

## Responsive repairs

Feature cards, metrics, and architecture maps use their own container width to choose columns. Below 560px of content width they stack; above that threshold they use two or three columns. Architecture arrows follow the same breakpoint. This supports narrow Puck slots on wide screens.

Long filenames, endpoint paths, stack labels, and architecture labels can wrap. Changelog descriptions preserve authored newlines.

## Verification and handoff

An isolated source copy at `/tmp/developer-window-qa` ran development fixtures on port 3012 with `COMPONENT_FIXTURES=1`. The existing port 3000 server and saved site data were untouched. Webpack was used because Turbopack rejects an external node_modules symlink. The temporary server was stopped after verification.

- Existing production-library browser script, scoped to all 11 developer blocks: passed at 320, 390, 768, and 1280px. No page overflow, broken images, runtime errors, or detected WCAG A/AA violations.
- Existing editor-library script, scoped to TerminalBlock: selection, section-name editing, fixture publication to session storage, and reload passed.
- Direct browser measurements: terminal padding is 0px; feature, metrics, and architecture grids stack without overflow at a forced 300px section width in a 1000px viewport.
- Terminal screenshot visually inspected at `/tmp/terminal-macos.png`.

Reports are ephemeral local artifacts at `/tmp/open-canvas-component-qa/report.json` and `/tmp/open-canvas-editor-qa.json`. Browser evidence comes from development fixtures, not a production build or hosted deployment. Lint and unrelated tests were skipped.
