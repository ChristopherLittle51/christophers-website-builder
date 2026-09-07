import assert from 'node:assert/strict';
import test from 'node:test';
import { componentCatalog, componentKeySnapshot, nestedAllowlist } from './catalog.ts';

const persistedComponentKeys = `Accordion ApiEndpointBlock ArchitectureBlock AspectRatio AvatarGroup Badge BeforeAfter Breadcrumbs ButtonBlock ButtonGroup CalendlyBlock Callout Card ChangelogBlock Checklist CodeSnippet CodeSnippetBlock ColorGradeBlock ContactBlock ContactSheetBlock CreditsBlock CustomCodeBlock DeveloperCtaBlock DeveloperFeaturesBlock DeveloperHeroBlock DeveloperStatsBlock DirectorsSlateBlock DividerBlock DocsCalloutBlock EditorialHero EmbedFrame EndCreditsBlock ExpandableGrid EyebrowBlock FeatureList FilmStockBlock FilmStripBlock FlexColumn FlexRow FooterSitemap GalleryBlock GitHubRepositoryBlock HeaderLinkBar HeadingBlock HeroLayout ImageBlock InsetContainer LayoutContainer LensHeroBlock LinkListBlock LogoCloud MarqueeBlock MediaText MetricList Notice OpenSourceBlock ParagraphBlock ProjectGrid QuoteBlock ReelShowcaseBlock SocialIconLinks SocialLinks SpacerBlock SplitFeature StatsBlock StickyStory StoryboardBlock TechStackBlock TerminalBlock TextBlock TimelineBlock VideoBlock ViewfinderBlock`.split(' ').sort();

test('keeps the persisted component type contract stable', () => {
  assert.deepEqual(componentKeySnapshot.filter((key) => persistedComponentKeys.includes(key)).sort(), persistedComponentKeys);
  assert.equal(componentKeySnapshot.length, 93);
});

test('assigns every component to exactly one picker category and nested slot', () => {
  const categorized = Object.values(componentCatalog).flatMap((category) => [...category.components]);
  assert.equal(new Set(categorized).size, categorized.length);
  assert.deepEqual([...categorized].sort(), componentKeySnapshot);
  assert.deepEqual([...nestedAllowlist].sort(), componentKeySnapshot);
});
