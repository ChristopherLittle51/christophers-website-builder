'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialIconName, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const navigationComponents: Record<string, any> = {
  HeaderLinkBar: {
        label: 'Header / link bar',
        fields: {
          brand: { type: 'text', label: 'Brand name', contentEditable: true },
          brandUrl: { type: 'text', label: 'Brand link' },
          links: { type: 'array', label: 'Navigation links', min: 1, max: 8, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL or #anchor' } }, defaultItemProps: (index) => ({ label: `Section ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.label || `Link ${(index || 0) + 1}` },
          theme: { type: 'radio', label: 'Theme', options: themeOptions },
        },
        defaultProps: { brand: 'Studio Name', brandUrl: '#', links: [{ label: 'Work', url: '#work' }, { label: 'About', url: '#about' }, { label: 'Contact', url: '#contact' }], theme: 'paper' },
        render: ({ brand, brandUrl, links, theme }) => <header className={`builder-header-bar builder-theme--${theme}`}><a className="builder-header-bar__brand" href={brandUrl || '#'}>{brand}</a><nav aria-label="Primary navigation">{(links || []).map((link: { label: string; url: string }, index: number) => <a href={link.url || '#'} key={`${link.label}-${index}`}>{link.label}</a>)}</nav></header>,
  },
  FooterSitemap: {
        label: 'Footer / site map',
        fields: {
          eyebrow: { type: 'text', label: 'Small intro', contentEditable: true },
          brand: { type: 'text', label: 'Brand name', contentEditable: true },
          note: { type: 'textarea', label: 'Footer note', contentEditable: true },
          email: { type: 'text', label: 'Email address' },
          copyright: { type: 'text', label: 'Copyright line', contentEditable: true },
          theme: { type: 'radio', label: 'Theme', options: themeOptions },
          links: { type: 'array', label: 'Site map links', min: 1, max: 24, arrayFields: { section: { type: 'text', label: 'Group' }, label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL or #anchor' } }, defaultItemProps: (index) => ({ section: index < 3 ? 'Explore' : 'Connect', label: `Page ${index + 1}`, url: '#' }), getItemSummary: (item, index) => `${item.section || 'Links'} · ${item.label || `Link ${(index || 0) + 1}`}` },
        },
        defaultProps: { eyebrow: 'Stay in the loop', brand: 'Studio Name', note: 'Independent creative practice for images, stories, and ideas with a point of view.', email: 'hello@example.com', copyright: '© 2026 Studio Name', theme: 'black', links: [{ section: 'Explore', label: 'Work', url: '#work' }, { section: 'Explore', label: 'About', url: '#about' }, { section: 'Explore', label: 'Process', url: '#process' }, { section: 'Connect', label: 'Email', url: 'mailto:hello@example.com' }, { section: 'Connect', label: 'Instagram', url: '#' }] },
        render: ({ eyebrow, brand, note, email, copyright, theme, links }) => {
          const groups = (links || []).reduce((result: Record<string, { label: string; url: string }[]>, link: { section: string; label: string; url: string }) => {
            const section = link.section || 'Links';
            (result[section] ||= []).push(link);
            return result;
          }, {});
          return <footer className={`builder-footer-sitemap builder-theme--${theme}`}><div className="builder-footer-sitemap__intro"><p className="builder-kicker">{eyebrow}</p><p className="builder-footer-sitemap__brand">{brand}</p><p className="builder-footer-sitemap__note">{note}</p><a href={`mailto:${email}`}>{email} ↗</a></div><nav className="builder-footer-sitemap__links" aria-label="Site map">{(Object.entries(groups) as [string, { label: string; url: string }[]][]).map(([section, sectionLinks]) => <div key={section}><p>{section}</p>{sectionLinks.map((link, index) => <a href={link.url || '#'} key={`${link.label}-${index}`}>{link.label}<span aria-hidden="true">↗</span></a>)}</div>)}</nav><div className="builder-footer-sitemap__legal"><span>{copyright}</span><span>Built with Open Canvas</span></div></footer>;
        },
  },
  Breadcrumbs: {
        label: 'Breadcrumbs',
        fields: { ariaLabel: { type: 'text', label: 'Navigation label' }, current: { type: 'text', label: 'Current page', contentEditable: true }, links: { type: 'array', label: 'Parent pages', min: 1, max: 6, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL' } }, defaultItemProps: (index) => ({ label: `Parent ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.label || `Parent ${(index || 0) + 1}` } },
        defaultProps: { ariaLabel: 'Breadcrumb', current: 'Current page', links: [{ label: 'Work', url: '#work' }, { label: 'Projects', url: '#projects' }] },
        render: ({ ariaLabel, current, links }) => <nav className="builder-breadcrumbs" aria-label={ariaLabel || 'Breadcrumb'}><ol>{(links || []).map((link: { label: string; url: string }, index: number) => <li key={`${link.label}-${index}`}><a href={link.url || '#'}>{link.label}</a><span aria-hidden="true">/</span></li>)}<li aria-current="page">{current}</li></ol></nav>,
  },
  SocialLinks: {
        label: 'Social links',
        fields: { label: { type: 'text', label: 'Navigation label', contentEditable: true }, links: { type: 'array', label: 'Social links', min: 1, max: 12, arrayFields: { platform: { type: 'text', label: 'Platform' }, label: { type: 'text', label: 'Visible label' }, url: { type: 'text', label: 'URL' } }, defaultItemProps: (index) => ({ platform: `Social ${index + 1}`, label: `Follow on social ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.platform || `Social ${(index || 0) + 1}` } },
        defaultProps: { label: 'Elsewhere', links: [{ platform: 'Instagram', label: '@studio', url: '#' }, { platform: 'Are.na', label: 'Collected references', url: '#' }, { platform: 'Email', label: 'hello@example.com', url: 'mailto:hello@example.com' }] },
        render: ({ label, links }) => <nav className="builder-social-links" aria-label={label || 'Social links'}><p className="builder-kicker">{label}</p><ul>{(links || []).map((link: { platform: string; label: string; url: string }, index: number) => <li key={`${link.platform}-${index}`}><a href={link.url || '#'}><span>{link.platform}</span><strong>{link.label}</strong><span aria-hidden="true">↗</span></a></li>)}</ul></nav>,
  },
  SocialIconLinks: {
        label: 'Social icon links',
        fields: {
          label: { type: 'text', label: 'Navigation label', contentEditable: true },
          links: { type: 'array', label: 'Social profiles', min: 1, max: 16, arrayFields: { icon: { type: 'select', label: 'Icon', options: socialPlatformOptions }, platform: { type: 'text', label: 'Accessible platform name' }, label: { type: 'text', label: 'Visible label' }, url: { type: 'text', label: 'Profile URL' } }, defaultItemProps: (index) => { const defaults = socialPlatformOptions[index % 5]; return { icon: defaults.value, platform: defaults.label, label: defaults.label, url: '#' }; }, getItemSummary: (item, index) => item.platform || item.label || `Social ${(index || 0) + 1}` },
          layout: { type: 'radio', label: 'Responsive layout', options: [{ label: 'Auto', value: 'auto' }, { label: 'Row', value: 'row' }, { label: 'Column', value: 'column' }] },
          align: { type: 'radio', label: 'Alignment', options: alignOptions },
          display: { type: 'radio', label: 'Link labels', options: [{ label: 'Icons only', value: 'icons' }, { label: 'Icons + labels', value: 'labels' }] },
          appearance: { type: 'radio', label: 'Icon style', options: [{ label: 'Simple', value: 'simple' }, { label: 'Outline', value: 'outline' }, { label: 'Filled', value: 'filled' }] },
          size: { type: 'radio', label: 'Icon size', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] },
          newTab: { type: 'radio', label: 'Open profiles', options: [{ label: 'Same tab', value: 'same' }, { label: 'New tab', value: 'new' }] },
          theme: { type: 'radio', label: 'Theme', options: themeOptions },
        },
        defaultProps: { label: 'Follow us', layout: 'auto', align: 'left', display: 'icons', appearance: 'outline', size: 'medium', newTab: 'new', theme: 'paper', links: [{ icon: 'facebook', platform: 'Facebook', label: 'Facebook', url: '#' }, { icon: 'instagram', platform: 'Instagram', label: 'Instagram', url: '#' }, { icon: 'linkedin', platform: 'LinkedIn', label: 'LinkedIn', url: '#' }, { icon: 'youtube', platform: 'YouTube', label: 'YouTube', url: '#' }, { icon: 'x', platform: 'X', label: 'X', url: '#' }] },
        render: ({ label, links, layout, align, display, appearance, size, newTab, theme }) => <nav className={`builder-social-icons builder-social-icons--${layout || 'auto'} builder-social-icons--align-${align || 'left'} builder-social-icons--${display || 'icons'} builder-social-icons--${appearance || 'outline'} builder-social-icons--${size || 'medium'} builder-theme--${theme || 'paper'}`} aria-label={label || 'Social links'}>
          {label ? <p className="builder-kicker">{label}</p> : null}
          <ul>{(links || []).map((link: { icon?: string; platform: string; label: string; url: string }, index: number) => { const accessibleName = link.platform || link.label || 'Social profile'; const opensNewTab = newTab === 'new' && !/^(#|mailto:|tel:)/i.test(link.url || ''); return <li key={`${accessibleName}-${index}`}><a href={link.url || '#'} aria-label={display === 'icons' ? accessibleName : undefined} title={display === 'icons' ? accessibleName : undefined} target={opensNewTab ? '_blank' : undefined} rel={opensNewTab ? 'noreferrer noopener' : undefined}><SocialIcon name={socialIconName(link.icon, link.platform)} />{display !== 'icons' ? <span>{link.label || accessibleName}</span> : null}</a></li>; })}</ul>
        </nav>,
  },
};
