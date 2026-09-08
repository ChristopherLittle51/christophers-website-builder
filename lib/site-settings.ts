import type { LinkValue, LinkPage } from './site-catalog.ts';

export type CrawlerSettings = { markdown: boolean; search: 'allow' | 'disallow'; aiTraining: 'allow' | 'disallow'; aiSearch: 'allow' | 'disallow'; aiMarkdown: boolean };
export type NavigationItem = { pageId: string; label: string; group: string; hidden: boolean };
export type ManualLink = { label: string; href: LinkValue; group: string };
export type SeoSettings = { siteUrl: string; siteName: string; description: string; socialImage: string; socialImageAlt: string };
export type SiteSettings = {
  enabled: boolean;
  brand: string;
  brandLink: LinkValue;
  header: boolean;
  footer: boolean;
  footerText: string;
  navigation: NavigationItem[];
  links: ManualLink[];
  crawler: CrawlerSettings;
  seo: SeoSettings;
};
export type SiteSettingsVersions = { draft: SiteSettings; published: SiteSettings };
export const defaultSiteSettings: SiteSettings = {
  enabled: false, brand: 'Studio', brandLink: '/', header: true, footer: true, footerText: 'Independent ideas. Thoughtfully made.', navigation: [], links: [],
  seo: { siteUrl: '', siteName: '', description: '', socialImage: '', socialImageAlt: '' },
  crawler: { markdown: true, search: 'allow', aiTraining: 'allow', aiSearch: 'allow', aiMarkdown: false },
};

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const source = value && typeof value === 'object' ? value as Partial<SiteSettings> : {};
  const text = (value: unknown, fallback: string) => typeof value === 'string' ? value.slice(0, 500) : fallback;
  const link = (value: unknown): LinkValue => {
    if (typeof value === 'string') return value.slice(0, 2048);
    if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>;
      if (v.type === 'page' && typeof v.pageId === 'string') return { type: 'page', pageId: v.pageId, ...(typeof v.componentId === 'string' ? { componentId: v.componentId } : {}) };
      if (v.type === 'url' && typeof v.url === 'string') return { type: 'url', url: v.url.slice(0, 2048) };
    }
    return '';
  };
  return {
    enabled: source.enabled === true, brand: text(source.brand, defaultSiteSettings.brand), brandLink: link(source.brandLink ?? '/'),
    header: source.header !== false, footer: source.footer !== false, footerText: text(source.footerText, defaultSiteSettings.footerText),
    navigation: Array.isArray(source.navigation) ? source.navigation.filter(v => v && typeof v.pageId === 'string').slice(0, 500).map(v => ({ pageId: v.pageId, label: text(v.label, ''), group: text(v.group, ''), hidden: v.hidden === true })) : [],
    links: Array.isArray(source.links) ? source.links.filter(v => v && typeof v.label === 'string').slice(0, 100).map(v => ({ label: text(v.label, ''), href: link(v.href), group: text(v.group, '') })) : [],
    seo: { siteUrl: text(source.seo?.siteUrl, '').trim(), siteName: text(source.seo?.siteName, '').trim(), description: text(source.seo?.description, '').trim(), socialImage: typeof source.seo?.socialImage === 'string' ? source.seo.socialImage.trim().slice(0, 2048) : '', socialImageAlt: text(source.seo?.socialImageAlt, '').trim() },
    crawler: { markdown: source.crawler?.markdown !== false, search: source.crawler?.search === 'disallow' ? 'disallow' : 'allow', aiSearch: source.crawler?.aiSearch === 'disallow' ? 'disallow' : 'allow', aiTraining: source.crawler?.aiTraining === 'disallow' ? 'disallow' : 'allow', aiMarkdown: source.crawler?.aiMarkdown === true },
  };
}

export function getSiteSettings(record: { siteSettings?: SiteSettingsVersions } | null | undefined, mode: 'draft' | 'published'): SiteSettings {
  return normalizeSiteSettings(record?.siteSettings?.[mode]);
}

export function navigationLinks(settings: SiteSettings, pages: LinkPage[]) {
  const ordered = [...settings.navigation.map(item => pages.find(page => page.id === item.pageId)).filter((p): p is LinkPage => !!p), ...pages.filter(page => !settings.navigation.some(item => item.pageId === page.id))];
  const seen = new Set<string>();
  return ordered.filter(page => { if (seen.has(page.id)) return false; seen.add(page.id); return !settings.navigation.find(item => item.pageId === page.id)?.hidden; }).map(page => {
    const item = settings.navigation.find(item => item.pageId === page.id);
    return { label: item?.label || page.title, group: item?.group || 'Explore', href: { type: 'page', pageId: page.id } as LinkValue };
  }).concat(settings.links);
}
