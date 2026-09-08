'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { StableSlot } from '../StableSlot';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const heroesComponents: Record<string, any> = {
  HeroLayout: {
        label: 'Composable hero',
        fields: {
          layout: { type: 'radio', label: 'Hero treatment', options: [{ label: 'Split media', value: 'split' }, { label: 'Image overlay', value: 'overlay' }, { label: 'Text only', value: 'text' }] },
          image: imageField('Hero image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, imageSide: { type: 'radio', label: 'Media side', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
          overlay: { type: 'radio', label: 'Image contrast', options: [{ label: 'Soft', value: 'soft' }, { label: 'Strong', value: 'strong' }] },
          horizontalAlign: { type: 'radio', label: 'Content alignment', options: alignOptions }, verticalAlign: { type: 'radio', label: 'Vertical placement', options: [{ label: 'Top', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'Bottom', value: 'end' }] },
          theme: { type: 'radio', label: 'Theme', options: themeOptions },
          content: { type: 'slot', label: 'Hero content', allow: nestedAllowlist },
        },
        defaultProps: {
          layout: 'split', image: '/images/demo-hero.jpg', imageCrop: 'center center', imageAlt: 'Abstract creative studio composition', imageSide: 'right', overlay: 'strong', horizontalAlign: 'left', verticalAlign: 'end', theme: 'paper',
          content: [
            { type: 'EyebrowBlock', props: { text: 'Independent creative practice', font: 'inherit', align: 'left', rule: 'none' } },
            { type: 'HeadingBlock', props: { text: 'MAKE THE IDEA\nIMPOSSIBLE TO IGNORE.', level: 'h1', font: 'inherit', size: 'oversized', tracking: 'tight', align: 'left' } },
            { type: 'ParagraphBlock', props: { text: 'Build the opener from the same editable blocks used everywhere else.', font: 'inherit', size: 'lead', align: 'left', width: 'normal' } },
            { type: 'ButtonGroup', props: { align: 'left', gap: 'comfortable', buttons: [{ label: 'See the work', url: '#work', style: 'solid' }, { label: 'Start a conversation', url: '#contact', style: 'outline' }] } },
          ],
        },
        render: ({ layout, image, imageCrop, imageAlt, imageSide, overlay, horizontalAlign, verticalAlign, theme, content: Content }) => <section className={`builder-composable-hero builder-composable-hero--${layout || 'split'} builder-composable-hero--media-${imageSide || 'right'} builder-composable-hero--overlay-${overlay || 'strong'} builder-composable-hero--align-${horizontalAlign || 'left'} builder-composable-hero--vertical-${verticalAlign || 'end'} builder-theme--${theme || 'paper'}`}>
          {layout !== 'text' && image ? <img className="builder-composable-hero__media" src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /> : null}
          {layout === 'overlay' ? <span className="builder-composable-hero__wash" aria-hidden="true" /> : null}
          <div className="builder-composable-hero__content">{Content ? <StableSlot render={Content} className="builder-composable-hero__dropzone" collisionAxis="y" minEmptyHeight={260} /> : null}</div>
        </section>,
  },
  EditorialHero: {
        label: 'Editorial hero',
        fields: {
          eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, byline: { type: 'text', label: 'Byline', contentEditable: true },
          eyebrowFont: fontField('Intro font'), titleFont: fontField('Headline font'), bylineFont: fontField('Byline font'), titleSize: { type: 'select', label: 'Headline size', options: sizeOptions }, titleAlign: { type: 'radio', label: 'Headline alignment', options: alignOptions }, titleTracking: { type: 'select', label: 'Headline spacing', options: trackingOptions },
          image: imageField('Feature image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
        },
        defaultProps: { eyebrow: 'Independent creative practice', title: 'WORK WITH\nA POINT OF VIEW', byline: 'Film · Image · Design', eyebrowFont: 'inherit', titleFont: 'inherit', bylineFont: 'fraunces', titleSize: 'standard', titleAlign: 'left', titleTracking: 'tight', image: '/images/demo-hero.jpg', imageCrop: 'center center', imageAlt: 'Abstract creative studio composition', theme: 'paper' },
        render: ({ eyebrow, title, byline, eyebrowFont, titleFont, bylineFont, titleSize, titleAlign, titleTracking, image, imageCrop, imageAlt, theme }) => <section className={`builder-hero builder-theme--${theme} builder-align--${titleAlign}`}><div className="builder-hero__copy"><p className="builder-kicker" style={fontStyle(eyebrowFont)}>{eyebrow}</p><h1 className={typeClass('builder-hero-title', titleSize, titleTracking)} style={fontStyle(titleFont)}>{title}</h1><p className="builder-hero__byline" style={fontStyle(bylineFont)}>{byline}</p></div><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /></section>,
  },
  DeveloperHeroBlock: {
        label: 'Developer hero',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, body: { type: 'textarea', label: 'Supporting text', contentEditable: true }, ctaLabel: { type: 'text', label: 'Button label', contentEditable: true }, ctaUrl: { type: 'text', label: 'Button URL' }, status: { type: 'text', label: 'Status label', contentEditable: true }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
        defaultProps: { eyebrow: 'Independent software maker', title: 'MAKE THE INVISIBLE USEFUL.', body: 'I design and build calm, durable products for teams doing meaningful work.', ctaLabel: 'See the work ↗', ctaUrl: '#work', status: 'AVAILABLE FOR SELECT BUILDS', theme: 'black' },
        render: ({ eyebrow, title, body, ctaLabel, ctaUrl, status, theme }) => <section className={'builder-dev-hero builder-theme--' + theme}><div className="builder-dev-hero__grid"><p className="builder-kicker">{eyebrow}</p><span className="builder-dev-hero__status"><i />{status}</span></div><h1>{title}</h1><div className="builder-dev-hero__footer"><p>{body}</p><a href={ctaUrl || '#'}>{ctaLabel}</a></div></section>,
  },
};

