'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const integrationsComponents: Record<string, any> = {
  GitHubRepositoryBlock: {
        label: 'GitHub repository',
        fields: {
          repoUrl: { type: 'text', label: 'GitHub repository URL' }, title: { type: 'text', label: 'Display heading', contentEditable: true },
          description: { type: 'radio', label: 'Description', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, stats: { type: 'radio', label: 'Repository statistics', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, topics: { type: 'radio', label: 'Topics', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
        },
        defaultProps: { repoUrl: '', title: '', description: 'show', stats: 'show', topics: 'show', theme: 'black' },
        render: ({ repoUrl, title, description, stats, topics, theme, puck }) => <GitHubRepositoryView repoUrl={repoUrl || ''} title={title || ''} description={description || 'show'} stats={stats || 'show'} topics={topics || 'show'} theme={theme || 'black'} isEditing={Boolean(puck?.isEditing)} />,
  },
  CalendlyBlock: {
        label: 'Calendly scheduling',
        fields: {
          eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Heading', contentEditable: true }, intro: { type: 'textarea', label: 'Supporting text', contentEditable: true },
          titleFont: fontField('Heading font'), introFont: fontField('Supporting text font'), schedulingUrl: { type: 'text', label: 'Calendly scheduling URL' },
          backgroundColor: colorField('Section / calendar background'), textColor: colorField('Text color'), primaryColor: colorField('Button / accent color'),
          hideDetails: { type: 'radio', label: 'Calendly profile details', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] },
          height: { type: 'radio', label: 'Calendar height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] },
        },
        defaultProps: { eyebrow: 'Let’s make something together', title: 'Choose a time that works.', intro: 'Book a short introduction call. No back-and-forth required.', titleFont: 'inherit', introFont: 'inherit', schedulingUrl: '', backgroundColor: '#f7f7f3', textColor: '#050505', primaryColor: '#d8ff00', hideDetails: 'hide', height: 'standard' },
        render: ({ eyebrow, title, intro, titleFont, introFont, schedulingUrl, backgroundColor, textColor, primaryColor, hideDetails, height, puck }) => {
          const url = buildCalendlyEmbedUrl(schedulingUrl || '', { backgroundColor, textColor, primaryColor, hideDetails: hideDetails === 'hide' });
          return <section className="builder-calendly" style={{ backgroundColor, color: textColor }}><header><p className="builder-kicker">{eyebrow}</p><h2 style={fontStyle(titleFont)}>{title}</h2><p style={fontStyle(introFont)}>{intro}</p></header>{url ? <CalendlyWidget url={url} height={embedHeights[height] || embedHeights.standard} isEditing={Boolean(puck?.isEditing)} /> : <div className="builder-calendly__empty">Add a Calendly scheduling link in the sidebar to show the calendar.</div>}</section>;
        },
  },
  CustomCodeBlock: {
        label: 'Custom HTML / JS',
        fields: {
          title: { type: 'text', label: 'Accessible frame title' },
          code: { type: 'textarea', label: 'HTML, CSS, and JavaScript' },
          height: { type: 'radio', label: 'Frame height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] },
          frame: { type: 'radio', label: 'Outer spacing', options: [{ label: 'Framed', value: 'framed' }, { label: 'Full bleed', value: 'bleed' }] },
        },
        defaultProps: {
          title: 'Interactive custom artwork', height: 'standard', frame: 'framed',
          code: `<style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; overflow: hidden; background: #050505; color: #f7f7f3; font: 700 clamp(32px, 10vw, 100px)/.9 system-ui, sans-serif; }
    .orb { position: fixed; width: 42vmin; aspect-ratio: 1; border-radius: 50%; background: #d8ff00; filter: blur(2px); mix-blend-mode: difference; }
  </style>
  <div class="orb"></div>
  <div>MAKE<br>IT MOVE.</div>
  <script>
    const orb = document.querySelector('.orb');
    addEventListener('pointermove', (event) => {
      orb.animate({ transform: \`translate(\${event.clientX - innerWidth / 2}px, \${event.clientY - innerHeight / 2}px)\` }, { duration: 700, fill: 'forwards' });
    });
  </script>`,
        },
        render: ({ title, code, height, frame, puck }) => <section className={`builder-code builder-code--${frame}`}><div className={`builder-code__stage${puck?.isEditing ? ' builder-embed-stage--editing' : ''}`} style={{ height: embedHeights[height] || embedHeights.standard }}><iframe key={code} srcDoc={code} title={title || 'Custom interactive content'} sandbox="allow-forms allow-modals allow-scripts" allow="autoplay; fullscreen" referrerPolicy="no-referrer" />{puck?.isEditing ? <span className="builder-embed-stage__label">Sandboxed code preview · edit from the sidebar</span> : null}</div></section>,
  },
  EmbedFrame: {
        label: 'Embed frame',
        fields: { title: { type: 'text', label: 'Accessible frame title' }, url: { type: 'text', label: 'Embed URL' }, height: { type: 'radio', label: 'Height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] }, caption: { type: 'text', label: 'Caption', contentEditable: true } },
        defaultProps: { title: 'Embedded content', url: '', height: 'standard', caption: 'Embedded content' },
        render: ({ title, url, height, caption }) => <figure className={`builder-embed-frame builder-embed-frame--${height}`}>{url ? <iframe src={url} title={title || 'Embedded content'} loading="lazy" allowFullScreen /> : <div role="status">Add an embed URL in the sidebar.</div>}{caption ? <figcaption>{caption}</figcaption> : null}</figure>,
  },
};

