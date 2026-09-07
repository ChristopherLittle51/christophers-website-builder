'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const compositionComponents: Record<string, any> = {
  LayoutContainer: {
        label: 'Nested layout container',
        fields: {
          columns: { type: 'radio', label: 'Columns on desktop', options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }, { label: 'Four', value: 'four' }] }, ratio: { type: 'select', label: 'Column balance', options: [{ label: 'Even', value: 'even' }, { label: 'Wide first', value: 'wide-first' }, { label: 'Wide last', value: 'wide-last' }] }, gap: { type: 'radio', label: 'Gap', options: [{ label: 'None', value: 'none' }, { label: 'Tight', value: 'tight' }, { label: 'Airy', value: 'airy' }] }, padding: { type: 'radio', label: 'Outer spacing', options: [{ label: 'None', value: 'none' }, { label: 'Compact', value: 'compact' }, { label: 'Generous', value: 'generous' }] }, verticalAlign: { type: 'select', label: 'Vertical alignment', options: [{ label: 'Top', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'Bottom', value: 'end' }, { label: 'Stretch', value: 'stretch' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
          first: { type: 'slot', label: 'First column', allow: nestedAllowlist }, second: { type: 'slot', label: 'Second column', allow: nestedAllowlist }, third: { type: 'slot', label: 'Third column', allow: nestedAllowlist }, fourth: { type: 'slot', label: 'Fourth column', allow: nestedAllowlist },
        },
        defaultProps: { columns: 'two', ratio: 'even', gap: 'tight', padding: 'compact', verticalAlign: 'start', theme: 'paper', first: [{ type: 'HeadingBlock', props: { text: 'Build a layout.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'Drag any block—including another container—into each column.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }], second: [{ type: 'ImageBlock', props: { image: '/images/photo-1.jpg', alt: 'Portfolio photograph', caption: 'Column two', shape: 'portrait' } }], third: [], fourth: [] },
        render: ({ columns, ratio, gap, padding, verticalAlign, theme, first: First, second: Second, third: Third, fourth: Fourth }) => <section className={`builder-container builder-container--${columns} builder-container--${ratio} builder-container--gap-${gap} builder-container--pad-${padding} builder-container--align-${verticalAlign} builder-theme--${theme}`}><div className="builder-container__cell"><First className="builder-container__dropzone" minEmptyHeight={220} /></div>{columns !== 'one' ? <div className="builder-container__cell"><Second className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}{columns === 'three' || columns === 'four' ? <div className="builder-container__cell"><Third className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}{columns === 'four' ? <div className="builder-container__cell"><Fourth className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}</section>,
  },
  FlexRow: {
        label: 'Flex row',
        fields: {
          gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
          wrap: { type: 'radio', label: 'Wrap items', options: [{ label: 'Wrap', value: 'wrap' }, { label: 'Single line', value: 'nowrap' }] },
          align: { type: 'radio', label: 'Vertical alignment', options: [{ label: 'Start', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }, { label: 'Stretch', value: 'stretch' }] },
          justify: { type: 'radio', label: 'Horizontal distribution', options: [{ label: 'Start', value: 'start' }, { label: 'Between', value: 'between' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }] },
          theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
          content: { type: 'slot', label: 'Row content', allow: nestedAllowlist },
        },
        defaultProps: { gap: 'comfortable', wrap: 'wrap', align: 'center', justify: 'start', theme: 'paper', content: [{ type: 'Badge', props: { text: 'New', tone: 'lime', size: 'small' } }, { type: 'ParagraphBlock', props: { text: 'A flexible row for controls, tags, or short bits of content.', font: 'inherit', size: 'small', align: 'left', width: 'normal' } }] },
        render: ({ gap, wrap, align, justify, theme, content: Content }) => <section className={`builder-flex-row builder-theme--${theme || 'paper'}`}>{Content ? <Content className={`builder-flex-row__content builder-flex-row__content--gap-${gap || 'comfortable'} builder-flex-row__content--wrap-${wrap || 'wrap'} builder-flex-row__content--align-${align || 'center'} builder-flex-row__content--justify-${justify || 'start'}`} collisionAxis="x" minEmptyHeight={112} /> : null}</section>,
  },
  FlexColumn: {
        label: 'Flex column',
        fields: {
          gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
          align: { type: 'radio', label: 'Horizontal alignment', options: [{ label: 'Start', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }, { label: 'Stretch', value: 'stretch' }] },
          padding: { type: 'radio', label: 'Inner spacing', options: qolPaddingOptions },
          theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
          content: { type: 'slot', label: 'Column content', allow: nestedAllowlist },
        },
        defaultProps: { gap: 'comfortable', align: 'stretch', padding: 'compact', theme: 'paper', content: [{ type: 'HeadingBlock', props: { text: 'A calm stack.', level: 'h2', font: 'inherit', size: 'compact', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'Use a column to keep related content together at any breakpoint.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }] },
        render: ({ gap, align, padding, theme, content: Content }) => <section className={`builder-flex-column builder-theme--${theme || 'paper'}`}>{Content ? <Content className={`builder-flex-column__content builder-flex-column__content--gap-${gap || 'comfortable'} builder-flex-column__content--align-${align || 'stretch'} builder-flex-column__content--pad-${padding || 'compact'}`} collisionAxis="y" minEmptyHeight={112} /> : null}</section>,
  },
  InsetContainer: {
        label: 'Inset container',
        fields: {
          width: { type: 'radio', label: 'Content width', options: [{ label: 'Narrow', value: 'narrow' }, { label: 'Standard', value: 'standard' }, { label: 'Wide', value: 'wide' }] },
          padding: { type: 'radio', label: 'Outer spacing', options: qolPaddingOptions },
          align: { type: 'radio', label: 'Text alignment', options: alignOptions },
          theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
          content: { type: 'slot', label: 'Container content', allow: nestedAllowlist },
        },
        defaultProps: { width: 'standard', padding: 'generous', align: 'left', theme: 'paper', content: [{ type: 'ParagraphBlock', props: { text: 'An inset container gives a section a dependable reading measure.', font: 'inherit', size: 'lead', align: 'left', width: 'normal' } }] },
        render: ({ width, padding, align, theme, content: Content }) => <section className={`builder-inset builder-inset--width-${width} builder-inset--pad-${padding} builder-inset--${align} builder-theme--${theme}`}><div>{Content ? <Content /> : null}</div></section>,
  },
  AspectRatio: {
        label: 'Aspect ratio frame',
        fields: {
          ratio: { type: 'radio', label: 'Ratio', options: [{ label: 'Square', value: 'square' }, { label: 'Landscape', value: 'landscape' }, { label: 'Widescreen', value: 'wide' }, { label: 'Portrait', value: 'portrait' }] },
          overflow: { type: 'radio', label: 'Overflow', options: [{ label: 'Clip', value: 'clip' }, { label: 'Show', value: 'show' }] },
          theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
          content: { type: 'slot', label: 'Frame content', allow: nestedAllowlist },
        },
        defaultProps: { ratio: 'landscape', overflow: 'clip', theme: 'black', content: [{ type: 'ImageBlock', props: { image: '/images/photo-1.jpg', alt: 'Framed portfolio image', caption: '', shape: 'landscape' } }] },
        render: ({ ratio, overflow, theme, content: Content }) => <div className={`builder-aspect-frame builder-aspect-frame--${ratio} builder-aspect-frame--overflow-${overflow} builder-theme--${theme}`}><div>{Content ? <Content /> : null}</div></div>,
  },
  MediaText: {
        label: 'Media + nested text',
        fields: { image: imageField('Media image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, side: { type: 'radio', label: 'Image side', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }, ratio: { type: 'radio', label: 'Image ratio', options: [{ label: 'Square', value: 'square' }, { label: 'Landscape', value: 'landscape' }, { label: 'Portrait', value: 'portrait' }] }, content: { type: 'slot', label: 'Text content', allow: nestedAllowlist }, theme: { type: 'radio', label: 'Theme', options: qolToneOptions } },
        defaultProps: { image: '/images/photo-2.jpg', crop: 'center center', alt: 'Creative project detail', side: 'left', ratio: 'portrait', theme: 'paper', content: [{ type: 'HeadingBlock', props: { text: 'Pair image with context.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'A nested slot keeps the copy as editable as the image.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }] },
        render: ({ image, crop, alt, side, ratio, content: Content, theme }) => <section className={`builder-media-text builder-media-text--${side} builder-media-text--ratio-${ratio} builder-theme--${theme}`}><img src={image} alt={alt || ''} style={imagePosition(crop)} /><div>{Content ? <Content /> : null}</div></section>,
  },
};

