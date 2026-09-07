'use client';
import { SiteLink, useSiteLinks } from './site-links-client';
import { navigationLinks, type SiteSettings } from './site-settings';

export function SharedHeader({ settings }: { settings: SiteSettings }) {
  const { pages, currentPageId } = useSiteLinks();
  const links = navigationLinks(settings, pages);
  return <header className="shared-site-header"><SiteLink className="shared-site-brand" href={settings.brandLink}>{settings.brand}</SiteLink><nav aria-label="Main navigation">{links.map((item, index) => <SiteLink key={index} href={item.href} aria-current={typeof item.href === 'object' && item.href.type === 'page' && item.href.pageId === currentPageId ? 'page' : undefined}>{item.label}</SiteLink>)}</nav></header>;
}

export function SharedFooter({ settings }: { settings: SiteSettings }) {
  const { pages } = useSiteLinks();
  const links = navigationLinks(settings, pages);
  const groups = [...new Set(links.map(item => item.group || 'Explore'))];
  return <footer className="shared-site-footer"><div><strong>{settings.brand}</strong><p>{settings.footerText}</p></div><nav aria-label="Site map">{groups.map(group => <section key={group}><h2>{group}</h2><ul>{links.filter(item => (item.group || 'Explore') === group).map((item, index) => <li key={index}><SiteLink href={item.href}>{item.label}</SiteLink></li>)}</ul></section>)}</nav></footer>;
}
