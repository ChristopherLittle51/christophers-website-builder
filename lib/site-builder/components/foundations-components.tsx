'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { typographyFields, typographyStyle } from '../../typography';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const foundationsComponents: Record<string, any> = {
  HeadingBlock: {
        label: 'Heading',
        fields: { text: { type: 'textarea', label: 'Heading', contentEditable: true }, level: { type: 'radio', label: 'Semantic level', options: [{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }] }, ...typographyFields('', 'Heading'), size: { type: 'select', label: 'Size', options: sizeOptions }, tracking: { type: 'select', label: 'Legacy tracking', options: trackingOptions }, align: { type: 'radio', label: 'Alignment', options: alignOptions } },
        defaultProps: { text: 'A clear point of view.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' },
        render: (props) => <HeadingPrimitive {...(props as unknown as Parameters<typeof HeadingPrimitive>[0])} />,
  },
  ParagraphBlock: {
        label: 'Paragraph',
        fields: { text: { type: 'textarea', label: 'Text', contentEditable: true }, ...typographyFields('', 'Text'), size: { type: 'radio', label: 'Size', options: [{ label: 'Small', value: 'small' }, { label: 'Standard', value: 'standard' }, { label: 'Lead', value: 'lead' }] }, align: { type: 'radio', label: 'Alignment', options: alignOptions }, width: { type: 'radio', label: 'Line length', options: [{ label: 'Narrow', value: 'narrow' }, { label: 'Normal', value: 'normal' }, { label: 'Wide', value: 'wide' }] } },
        defaultProps: { text: 'Use a paragraph block for flexible body copy inside a custom layout.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' },
        render: ({ text, font, size, align, width, fontWeight, fontStyle: textStyle, letterSpacing, wordSpacing, lineHeight }) => <p className={`builder-paragraph builder-paragraph--${size} builder-paragraph--${align} builder-paragraph--${width}`} style={{ ...fontStyle(font), ...typographyStyle({ fontWeight, fontStyle: textStyle, letterSpacing, wordSpacing, lineHeight }) }}>{text}</p>,
  },
  EyebrowBlock: {
        label: 'Eyebrow / label',
        fields: { text: { type: 'text', label: 'Label', contentEditable: true }, font: fontField('Font'), align: { type: 'radio', label: 'Alignment', options: alignOptions }, rule: { type: 'radio', label: 'Rule', options: [{ label: 'None', value: 'none' }, { label: 'Above', value: 'above' }, { label: 'Below', value: 'below' }] } },
        defaultProps: { text: 'Selected work · 2026', font: 'inherit', align: 'left', rule: 'none' },
        render: ({ text, font, align, rule }) => <p className={`builder-eyebrow builder-eyebrow--${align} builder-eyebrow--rule-${rule}`} style={fontStyle(font)}>{text}</p>,
  },
  ImageBlock: {
        label: 'Image', fields: { image: imageField('Image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, caption: { type: 'text', label: 'Caption', contentEditable: true }, captionFont: fontField('Caption font'), shape: { type: 'radio', label: 'Shape', options: [{ label: 'Landscape', value: 'landscape' }, { label: 'Square', value: 'square' }, { label: 'Portrait', value: 'portrait' }, { label: 'Natural', value: 'natural' }] } },
        defaultProps: { image: '/images/photo-1.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'Selected work', captionFont: 'inherit', shape: 'landscape' },
        render: ({ image, crop, alt, caption, captionFont, shape }) => <figure className={`builder-image builder-image--${shape}`}><img src={image} alt={alt || ''} style={imagePosition(crop)} /><figcaption style={fontStyle(captionFont)}>{caption}</figcaption></figure>,
  },
  ButtonBlock: {
        label: 'Button / link', fields: { label: { type: 'text', label: 'Button label', contentEditable: true }, href: { type: 'text', label: 'Link URL' }, labelFont: fontField('Button font'), style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Text link', value: 'text' }] }, align: { type: 'radio', label: 'Alignment', options: alignOptions } },
        defaultProps: { label: 'View project', href: '#', labelFont: 'inherit', style: 'solid', align: 'left' },
        render: ({ label, href, labelFont, style, align }) => <div className={`builder-button builder-button--${align}`}><a className={`builder-button__link builder-button__link--${style}`} href={href} style={fontStyle(labelFont)}>{label}<span aria-hidden="true">↗</span></a></div>,
  },
  DividerBlock: {
        label: 'Divider',
        fields: { weight: { type: 'radio', label: 'Weight', options: [{ label: 'Hairline', value: 'hairline' }, { label: 'Medium', value: 'medium' }, { label: 'Bold', value: 'bold' }] }, width: { type: 'radio', label: 'Width', options: [{ label: 'Short', value: 'short' }, { label: 'Half', value: 'half' }, { label: 'Full', value: 'full' }] }, style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }] } },
        defaultProps: { weight: 'hairline', width: 'full', style: 'solid' },
        render: ({ weight, width, style }) => <div className={`builder-divider builder-divider--${weight} builder-divider--${width} builder-divider--${style}`} role="separator" />,
  },
  SpacerBlock: {
        label: 'Spacer',
        fields: { size: { type: 'radio', label: 'Space', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }, { label: 'XL', value: 'xl' }] }, showGuide: { type: 'radio', label: 'Editor guide', options: [{ label: 'Subtle', value: 'subtle' }, { label: 'Hidden', value: 'hidden' }] } },
        defaultProps: { size: 'medium', showGuide: 'subtle' },
        render: ({ size, showGuide }) => <div className={`builder-spacer builder-spacer--${size} builder-spacer--${showGuide}`} aria-hidden="true" />,
  },
  Badge: {
        label: 'Badge / tag',
        fields: { text: { type: 'text', label: 'Text', contentEditable: true }, tone: { type: 'radio', label: 'Tone', options: qolToneOptions }, size: { type: 'radio', label: 'Size', options: [{ label: 'Small', value: 'small' }, { label: 'Standard', value: 'standard' }, { label: 'Large', value: 'large' }] } },
        defaultProps: { text: 'Available', tone: 'lime', size: 'standard' },
        render: ({ text, tone, size }) => <span className={`builder-badge builder-badge--${tone} builder-badge--${size}`}>{text}</span>,
  },
  ButtonGroup: {
        label: 'Button group',
        fields: {
          align: { type: 'radio', label: 'Alignment', options: alignOptions }, gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
          buttons: { type: 'array', label: 'Buttons', min: 1, max: 6, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL' }, style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Text', value: 'text' }] } }, defaultItemProps: (index) => ({ label: `Action ${index + 1}`, url: '#', style: index === 0 ? 'solid' : 'outline' }), getItemSummary: (item, index) => item.label || `Button ${(index || 0) + 1}` },
        },
        defaultProps: { align: 'left', gap: 'comfortable', buttons: [{ label: 'Start a project', url: '#contact', style: 'solid' }, { label: 'See the work', url: '#work', style: 'outline' }] },
        render: ({ align, gap, buttons }) => <div className={`builder-button-group builder-button-group--${align} builder-button-group--gap-${gap}`}>{(buttons || []).map((button: { label: string; url: string; style: string }, index: number) => <a className={`builder-button-group__button builder-button-group__button--${button.style}`} href={button.url || '#'} key={`${button.label}-${index}`}>{button.label}<span aria-hidden="true">↗</span></a>)}</div>,
  },
};
