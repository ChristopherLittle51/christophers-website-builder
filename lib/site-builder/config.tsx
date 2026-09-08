'use client';

import type { Config } from '@puckeditor/core';
import { typographyFields } from '../typography';
import { enhanceLinkFields, withResolvedLinks } from '../site-links-client';
import { componentCategories } from './catalog';
import { developerComponents } from './components/developer-components';
import { cinemaComponents } from './components/cinema-components';
import { compositionComponents } from './components/composition-components';
import { contentPatternsComponents } from './components/contentPatterns';
import { foundationsComponents } from './components/foundations-components';
import { heroesComponents } from './components/heroes-components';
import { integrationsComponents } from './components/integrations-components';
import { navigationComponents } from './components/navigation-components';
import { portfolioComponents } from './components/portfolio-components';
import { newComponents } from './new-components';
import { generatedSectionName, withSectionAnchor, withTypographyOverride } from './runtime';
import { rootConfig } from './root';
import { sectionNameField } from './shared';

export const builderConfig: Config<any> = {
  categories: componentCategories,
  components: Object.fromEntries(Object.entries({ ...newComponents, ...navigationComponents, ...foundationsComponents, ...compositionComponents, ...heroesComponents, ...portfolioComponents, ...contentPatternsComponents, ...cinemaComponents, ...integrationsComponents, ...developerComponents }).map(([key, component]) => [key, { ...component, fields: { ...component.fields } }])),
  root: rootConfig,
};

// Clone definitions before decoration: HMR can reuse imported family modules.
// Mutating their exports would repeatedly wrap renderers and corrupt style props.
for (const [componentType, component] of Object.entries(builderConfig.components)) {
  component.fields = { name: sectionNameField, ...component.fields };
  component.render = withSectionAnchor(component.render);
  if (!['LayoutContainer', 'FlexRow', 'FlexColumn', 'InsetContainer'].includes(componentType)) {
    const fallbackFields = typographyFields('typography', 'Text fallback');
    for (const property of Object.keys(typographyFields())) {
      if (component.fields?.[property]) delete fallbackFields[`typography${property[0].toUpperCase()}${property.slice(1)}`];
    }
    component.fields = { ...component.fields, ...fallbackFields };
    component.render = withTypographyOverride(component.render);
  }
  component.resolveData = ({ props }: { props: Record<string, unknown> }) => {
    const name = typeof props.name === 'string' ? props.name.trim() : '';
    return name ? { props } : { props: { ...props, name: generatedSectionName(componentType, props.id) } };
  };
  component.fields = enhanceLinkFields(component.fields, componentType);
  component.render = withResolvedLinks(component.render);
}

export { starterData } from '../templates';
