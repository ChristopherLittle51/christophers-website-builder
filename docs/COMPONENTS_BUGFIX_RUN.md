# Component bugfix run

## Developer blocks

The developer-family component registry was present, but its matching CSS was
missing. The blocks now have a dedicated technical/editorial visual system for
all twelve components, including responsive grids, terminal and code surfaces,
API cards, architecture maps, release notes, callouts, metrics, and calls to
action. Their existing Puck field values are rendered directly into class and
content changes, so sidebar updates immediately affect the active preview.

## Flex layout blocks

`FlexRow` and `FlexColumn` previously applied flex styles to an outer wrapper
that contained one Puck slot element. The actual dropped blocks remained inside
that slot's normal document flow, so gap, alignment, wrapping, and distribution
controls did not govern the blocks users dropped.

The slot itself now receives the layout classes and Puck's supported
`collisionAxis` setting: `x` for rows and `y` for columns. This makes dropped
children the flex items, preserves a visible empty target, and leaves the
existing parent block as the themed section surface.
