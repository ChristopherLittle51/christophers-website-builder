'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { FONT_FAMILIES } from '../typography';
import { colorField, directFontField, imageField } from './shared';

type ReturnToTopButtonProps = { enabled: boolean; label: string; appearance: string; position: string; isEditing: boolean };

function ReturnToTopButton({ enabled, label, appearance, position, isEditing }: ReturnToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 320);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!enabled || isEditing || !isVisible) return null;

  return <button type="button" className={`builder-return-to-top builder-return-to-top--${appearance || 'ink'} builder-return-to-top--${position || 'right'}`} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} aria-label={label || 'Return to top'}><span aria-hidden="true">↑</span>{label || 'Return to top'}</button>;
}

export const rootConfig = {
  fields: { title: { type: 'text', label: 'Browser title' }, favicon: imageField('Favicon (use a square image)'), socialTitle: { type: 'text', label: 'Social sharing title' }, socialDescription: { type: 'textarea', label: 'Social sharing description' }, socialImage: imageField('Social preview image (wide, ideally 1.91:1)'), socialImageAlt: { type: 'text', label: 'Social preview image description' }, displayFont: directFontField('Display / headline font'), bodyFont: directFontField('Body font'), accentFont: directFontField('Accent / caption font'), headingStyle: { type: 'radio', label: 'Heading weight', options: [{ label: 'Bold', value: 'bold' }, { label: 'Regular', value: 'classic' }, { label: 'Mixed', value: 'mixed' }] }, paperColor: colorField('Background color'), inkColor: colorField('Text color'), accentColor: colorField('Accent color'), contentWidth: { type: 'radio', label: 'Page width', options: [{ label: 'Focused', value: 'focused' }, { label: 'Standard', value: 'standard' }, { label: 'Full bleed', value: 'full' }] }, corners: { type: 'radio', label: 'Image corners', options: [{ label: 'Sharp', value: 'sharp' }, { label: 'Soft', value: 'soft' }, { label: 'Round', value: 'round' }] }, returnToTop: { type: 'radio', label: 'Return to top button', options: [{ label: 'Hidden', value: 'hidden' }, { label: 'Show on scroll', value: 'show' }] }, returnToTopLabel: { type: 'text', label: 'Return to top label' }, returnToTopAppearance: { type: 'radio', label: 'Return to top style', options: [{ label: 'Ink', value: 'ink' }, { label: 'Accent', value: 'accent' }, { label: 'Outline', value: 'outline' }] }, returnToTopPosition: { type: 'radio', label: 'Return to top position', options: [{ label: 'Right', value: 'right' }, { label: 'Left', value: 'left' }] } },
  defaultProps: { title: 'Studio Name — Creative Portfolio', favicon: '/favicon.svg', socialTitle: '', socialDescription: '', socialImage: '', socialImageAlt: '', displayFont: 'space-grotesk', bodyFont: 'inter', accentFont: 'fraunces', headingStyle: 'bold', paperColor: '#f7f7f3', inkColor: '#050505', accentColor: '#d8ff00', contentWidth: 'full', corners: 'sharp', returnToTop: 'hidden', returnToTopLabel: 'Return to top', returnToTopAppearance: 'ink', returnToTopPosition: 'right' },
  render: ({ children, displayFont = 'space-grotesk', bodyFont = 'inter', accentFont = 'fraunces', headingStyle = 'bold', paperColor = '#f7f7f3', inkColor = '#050505', accentColor = '#d8ff00', contentWidth = 'full', corners = 'sharp', returnToTop = 'hidden', returnToTopLabel = 'Return to top', returnToTopAppearance = 'ink', returnToTopPosition = 'right', puck }: any) => {
    const style = { '--site-paper': paperColor, '--site-ink': inkColor, '--site-accent': accentColor, '--font-display': FONT_FAMILIES[displayFont], '--font-body': FONT_FAMILIES[bodyFont], '--font-accent': FONT_FAMILIES[accentFont] } as CSSProperties;
    return <div className={`site-canvas site-heading--${headingStyle} site-width--${contentWidth} site-corners--${corners}`} style={style}>{children}<ReturnToTopButton enabled={returnToTop === 'show'} label={returnToTopLabel} appearance={returnToTopAppearance} position={returnToTopPosition} isEditing={Boolean(puck?.isEditing)} /></div>;
  },
};

// These controls intentionally have no defaults. Undefined values are the
// legacy-document signal consumed by the site settings layer.
rootConfig.fields = {
  seoTitle: { type: 'text', label: 'SEO title (blank uses browser title)' },
  seoDescription: { type: 'textarea', label: 'Search description (blank uses social or site description)' },
  canonicalUrl: { type: 'text', label: 'Canonical URL (blank uses this page URL)' },
  excludeFromSitemap: { type: 'select', label: 'Sitemap visibility', options: [{ label: 'Automatic', value: 'no' }, { label: 'Exclude from sitemap', value: 'yes' }] },
  noFollow: { type: 'select', label: 'Search engine link following', options: [{ label: 'Follow links', value: 'no' }, { label: 'Request nofollow', value: 'yes' }] },
  navigationTitle: { type: 'text', label: 'Navigation title' },
  sharedHeader: { type: 'select', label: 'Shared header', options: [{ label: 'Use site setting', value: 'inherit' }, { label: 'Override on this page', value: 'override' }, { label: 'Hide on this page', value: 'hidden' }] },
  sharedFooter: { type: 'select', label: 'Shared footer', options: [{ label: 'Use site setting', value: 'inherit' }, { label: 'Override on this page', value: 'override' }, { label: 'Hide on this page', value: 'hidden' }] },
  noIndex: { type: 'select', label: 'Search indexing', options: [{ label: 'Allow indexing', value: 'no' }, { label: 'Hide from search engines', value: 'yes' }] },
  ...rootConfig.fields,
} as typeof rootConfig.fields;
