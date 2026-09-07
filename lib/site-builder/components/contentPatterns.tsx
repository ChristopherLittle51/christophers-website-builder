'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const contentPatternsComponents: Record<string, any> = {
  Card: {
        label: 'Card',
        fields: {
          eyebrow: { type: 'text', label: 'Eyebrow', contentEditable: true },
          title: { type: 'text', label: 'Title', contentEditable: true },
          body: { type: 'textarea', label: 'Body', contentEditable: true },
          actionLabel: { type: 'text', label: 'Action label', contentEditable: true }, actionUrl: { type: 'text', label: 'Action URL' },
          tone: { type: 'radio', label: 'Tone', options: qolToneOptions }, radius: { type: 'radio', label: 'Corners', options: qolRadiusOptions },
        },
        defaultProps: { eyebrow: '01 / Service', title: 'A useful card.', body: 'Keep a small idea, offer, or next step easy to scan.', actionLabel: 'Learn more', actionUrl: '#', tone: 'paper', radius: 'soft' },
        render: ({ eyebrow, title, body, actionLabel, actionUrl, tone, radius }) => <article className={`builder-card builder-theme--${tone} builder-card--radius-${radius}`}><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p>{actionLabel ? <a href={actionUrl || '#'}>{actionLabel}<span aria-hidden="true">↗</span></a> : null}</article>,
  },
  Callout: {
        label: 'Callout',
        fields: {
          label: { type: 'text', label: 'Label', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Message', contentEditable: true },
          actionLabel: { type: 'text', label: 'Action label', contentEditable: true }, actionUrl: { type: 'text', label: 'Action URL' }, tone: { type: 'radio', label: 'Tone', options: [{ label: 'Info', value: 'info' }, { label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }] },
        },
        defaultProps: { label: 'Good to know', title: 'A small detail worth seeing.', body: 'Use a callout for context, a note, or a helpful next action.', actionLabel: '', actionUrl: '#', tone: 'info' },
        render: ({ label, title, body, actionLabel, actionUrl, tone }) => <aside className={`builder-callout builder-callout--${tone}`} role="note"><p className="builder-kicker">{label}</p><h2>{title}</h2><p>{body}</p>{actionLabel ? <a href={actionUrl || '#'}>{actionLabel} ↗</a> : null}</aside>,
  },
  Accordion: {
        label: 'Accordion / details',
        fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Details', min: 1, max: 12, arrayFields: { summary: { type: 'text', label: 'Summary' }, body: { type: 'textarea', label: 'Details' }, open: { type: 'radio', label: 'Open by default', options: [{ label: 'Closed', value: 'closed' }, { label: 'Open', value: 'open' }] } }, defaultItemProps: (index) => ({ summary: `Question ${index + 1}`, body: 'Add the supporting details here.', open: index === 0 ? 'open' : 'closed' }), getItemSummary: (item, index) => item.summary || `Details ${(index || 0) + 1}` } },
        defaultProps: { heading: 'Questions, answered.', items: [{ summary: 'What belongs here?', body: 'Use native details for FAQs, process notes, or progressive disclosure.', open: 'open' }, { summary: 'Can I add more?', body: 'Yes. Add or reorder rows from the sidebar.', open: 'closed' }] },
        render: ({ heading, items }) => <section className="builder-accordion"><h2>{heading}</h2><div>{(items || []).map((item: { summary: string; body: string; open: string }, index: number) => <details open={item.open === 'open'} key={`${item.summary}-${index}`}><summary>{item.summary}</summary><p>{item.body}</p></details>)}</div></section>,
  },
  FeatureList: {
        label: 'Feature list',
        fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, intro: { type: 'textarea', label: 'Intro', contentEditable: true }, items: { type: 'array', label: 'Features', min: 1, max: 12, arrayFields: { title: { type: 'text', label: 'Title' }, body: { type: 'textarea', label: 'Description' }, marker: { type: 'text', label: 'Marker' } }, defaultItemProps: (index) => ({ title: `Feature ${index + 1}`, body: 'Describe a useful feature or promise.', marker: String(index + 1).padStart(2, '0') }), getItemSummary: (item, index) => item.title || `Feature ${(index || 0) + 1}` } },
        defaultProps: { heading: 'A clear set of capabilities.', intro: 'Make the important parts easy to scan.', items: [{ title: 'Thoughtful structure', body: 'Organize information with a deliberate rhythm.', marker: '01' }, { title: 'Flexible details', body: 'Give every item enough room to be understood.', marker: '02' }, { title: 'Ready to use', body: 'Turn the finished idea into an obvious next step.', marker: '03' }] },
        render: ({ heading, intro, items }) => <section className="builder-feature-list"><header><p className="builder-kicker">Features</p><h2>{heading}</h2><p>{intro}</p></header><ol>{(items || []).map((item: { title: string; body: string; marker: string }, index: number) => <li key={`${item.title}-${index}`}><span>{item.marker || String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}</ol></section>,
  },
  LogoCloud: {
        label: 'Logo cloud',
        fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, logos: { type: 'array', label: 'Logos', min: 1, max: 16, arrayFields: { image: imageField('Logo image'), name: { type: 'text', label: 'Accessible name' }, url: { type: 'text', label: 'Link URL' } }, defaultItemProps: (index) => ({ image: '', name: `Partner ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.name || `Logo ${(index || 0) + 1}` } },
        defaultProps: { heading: 'Selected collaborators', logos: [{ image: '', name: 'Northstar Studio', url: '#' }, { image: '', name: 'Field Notes', url: '#' }, { image: '', name: 'Common Ground', url: '#' }] },
        render: ({ heading, logos }) => <section className="builder-logo-cloud"><h2>{heading}</h2><ul>{(logos || []).map((logo: { image: string; name: string; url: string }, index: number) => <li key={`${logo.name}-${index}`}><a href={logo.url || '#'} aria-label={logo.name || 'Collaborator'}>{logo.image ? <img src={logo.image} alt={logo.name || ''} /> : <span>{logo.name}</span>}</a></li>)}</ul></section>,
  },
  AvatarGroup: {
        label: 'Avatar group',
        fields: { label: { type: 'text', label: 'Group label', contentEditable: true }, people: { type: 'array', label: 'People', min: 1, max: 12, arrayFields: { image: imageField('Portrait'), name: { type: 'text', label: 'Name' }, url: { type: 'text', label: 'Profile URL' } }, defaultItemProps: (index) => ({ image: '', name: `Person ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.name || `Person ${(index || 0) + 1}` } },
        defaultProps: { label: 'Made with good people', people: [{ image: '/images/photo-3.jpg', name: 'Alex Morgan', url: '#' }, { image: '/images/photo-4.jpg', name: 'Sam Lee', url: '#' }, { image: '/images/photo-5.jpg', name: 'Jordan Kim', url: '#' }] },
        render: ({ label, people }) => <div className="builder-avatar-group"><p>{label}</p><ul>{(people || []).map((person: { image: string; name: string; url: string }, index: number) => <li key={`${person.name}-${index}`}><a href={person.url || '#'} aria-label={person.name || 'Contributor'}>{person.image ? <img src={person.image} alt={person.name || ''} /> : <span aria-hidden="true">{(person.name || '?').slice(0, 1)}</span>}</a></li>)}</ul></div>,
  },
  MetricList: {
        label: 'Metric list',
        fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Metrics', min: 1, max: 8, arrayFields: { value: { type: 'text', label: 'Value' }, label: { type: 'text', label: 'Label' }, detail: { type: 'text', label: 'Detail' } }, defaultItemProps: (index) => ({ value: '—', label: `Metric ${index + 1}`, detail: '' }), getItemSummary: (item, index) => item.label || `Metric ${(index || 0) + 1}` } },
        defaultProps: { heading: 'At a glance', items: [{ value: '12+', label: 'Years making', detail: 'and learning' }, { value: '48', label: 'Stories shipped', detail: 'across formats' }, { value: '03', label: 'Ways to work', detail: 'near or far' }] },
        render: ({ heading, items }) => <section className="builder-metric-list"><h2>{heading}</h2><dl>{(items || []).map((item: { value: string; label: string; detail: string }, index: number) => <div key={`${item.label}-${index}`}><dt>{item.value}</dt><dd><strong>{item.label}</strong>{item.detail ? <span>{item.detail}</span> : null}</dd></div>)}</dl></section>,
  },
  Checklist: {
        label: 'Checklist',
        fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Checklist items', min: 1, max: 12, arrayFields: { label: { type: 'text', label: 'Item' }, detail: { type: 'text', label: 'Detail' }, state: { type: 'radio', label: 'State', options: [{ label: 'To do', value: 'todo' }, { label: 'Done', value: 'done' }] } }, defaultItemProps: (index) => ({ label: `Checklist item ${index + 1}`, detail: '', state: 'todo' }), getItemSummary: (item, index) => item.label || `Item ${(index || 0) + 1}` } },
        defaultProps: { heading: 'A simple checklist', items: [{ label: 'Define the brief', detail: 'Align on the useful part first.', state: 'done' }, { label: 'Make the thing', detail: 'Give the idea a clear shape.', state: 'todo' }, { label: 'Share the result', detail: 'Make the next step obvious.', state: 'todo' }] },
        render: ({ heading, items }) => <section className="builder-checklist"><h2>{heading}</h2><ul>{(items || []).map((item: { label: string; detail: string; state: string }, index: number) => <li className={item.state === 'done' ? 'builder-checklist__item--done' : ''} key={`${item.label}-${index}`}><span aria-hidden="true">{item.state === 'done' ? '✓' : '○'}</span><div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}</div></li>)}</ul></section>,
  },
  CodeSnippet: {
        label: 'Code snippet',
        fields: { title: { type: 'text', label: 'Title', contentEditable: true }, language: { type: 'text', label: 'Language' }, code: { type: 'textarea', label: 'Code', contentEditable: true }, copyLabel: { type: 'text', label: 'Copy hint', contentEditable: true } },
        defaultProps: { title: 'A small useful snippet', language: 'CSS', code: '.thing {\n  display: grid;\n  gap: 1rem;\n}', copyLabel: 'Readable, editable, yours.' },
        render: ({ title, language, code, copyLabel }) => <figure className="builder-code-snippet"><figcaption><strong>{title}</strong><span>{language}</span></figcaption><pre><code>{code}</code></pre>{copyLabel ? <p>{copyLabel}</p> : null}</figure>,
  },
  Notice: {
        label: 'Notice',
        fields: { title: { type: 'text', label: 'Title', contentEditable: true }, message: { type: 'textarea', label: 'Message', contentEditable: true }, tone: { type: 'radio', label: 'Tone', options: [{ label: 'Neutral', value: 'neutral' }, { label: 'Positive', value: 'positive' }, { label: 'Caution', value: 'caution' }] }, dismissible: { type: 'radio', label: 'Dismiss affordance', options: [{ label: 'None', value: 'none' }, { label: 'Show close hint', value: 'hint' }] } },
        defaultProps: { title: 'A quick note', message: 'Use a notice for a timely piece of context or a gentle heads-up.', tone: 'neutral', dismissible: 'none' },
        render: ({ title, message, tone, dismissible }) => <NoticeView title={title} message={message} tone={tone} dismissible={dismissible} />,
  },
};
