/**
 * Stable authoring catalog. Values in `components` are persisted Puck type
 * identifiers and therefore form a data contract.
 */
export const componentCatalog = {
  navigation: { title: 'Navigation & links', components: navigationKeys },
  foundations: { title: 'Foundations', components: foundationKeys },
  composition: { title: 'Layout & composition', components: compositionKeys },
  heroes: { title: 'Hero options', components: heroKeys },
  portfolio: { title: 'Portfolio & storytelling', components: portfolioKeys },
  utility: { title: 'Content patterns', components: contentPatternKeys },
  cinema: { title: 'Photo & cinema', components: cinemaKeys },
  integrations: { title: 'Embeds & integrations', components: integrationKeys },
  developer: { title: 'Developer', components: developerKeys },
  signal: { title: 'Signal systems', components: signalKeys },
} as const;

export type ComponentKey = (typeof componentCatalog)[keyof typeof componentCatalog]['components'][number];

export const componentCategories = Object.fromEntries(
  Object.entries(componentCatalog).map(([key, value]) => [key, { ...value, components: [...value.components], defaultExpanded: true }]),
);

// Every current block is intentionally nestable. Keep this derived from the
// single catalog so new keys cannot be registered in the picker but omitted
// from slots.
export const nestedAllowlist: ComponentKey[] = Object.values(componentCatalog).flatMap((category) => [...category.components]);

export const componentKeySnapshot = [...nestedAllowlist].sort();
import { navigationKeys } from './components/navigation.ts';
import { foundationKeys } from './components/foundations.ts';
import { compositionKeys } from './components/composition.ts';
import { heroKeys } from './components/heroes.ts';
import { portfolioKeys } from './components/portfolio.ts';
import { contentPatternKeys } from './components/content-patterns.ts';
import { cinemaKeys } from './components/cinema.ts';
import { integrationKeys } from './components/integrations.ts';
import { developerKeys } from './components/developer.ts';
import { signalKeys } from './components/signal.ts';
